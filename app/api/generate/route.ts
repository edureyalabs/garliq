import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  
  try {
    const { sessionId, message, userId, model } = await request.json();

    if (!sessionId || !message || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Generating code for session:', sessionId, 'with model:', model);

    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    const selectedModel = model || session?.selected_model || 'llama-3.3-70b';

    // Check token balance for Claude
    if (selectedModel === 'claude-sonnet-4.5') {
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('token_balance')
        .eq('user_id', userId)
        .single();

      const balance = wallet?.token_balance || 0;

      if (balance < 1000) {
        return NextResponse.json({ 
          error: 'Insufficient tokens. You need at least 1,000 tokens to use Claude Sonnet 4.5.',
          success: false 
        }, { status: 402 });
      }
    }

    // Get chat history (we keep this for context)
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // Get current project code
    const { data: project } = await supabase
      .from('projects')
      .select('html_code')
      .eq('session_id', sessionId)
      .maybeSingle();

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const agentResponse = await fetch(`${AGENT_SERVICE_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: message,
              model: selectedModel,
              current_code: project?.html_code || null,
              chat_history: chatHistory || []
            })
          });

          if (!agentResponse.ok) {
            const errorText = await agentResponse.text();
            console.error('Agent service error:', errorText);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'AI service unavailable' })}\n\n`));
            controller.close();
            return;
          }

          const reader = agentResponse.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          let htmlResult = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = new TextDecoder().decode(value);
            buffer += text;
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6).trim();
                  if (!jsonStr) continue;
                  
                  const data = JSON.parse(jsonStr);
                  
                  if (data.type === 'complete') {
                    htmlResult = data.html;
                  }
                  
                  // Forward to client
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                } catch (e) {
                  console.error('JSON parse error:', e);
                }
              }
            }
          }

          // Save to database after generation
          if (htmlResult) {
            // Save chat messages
            await supabase.from('chat_messages').insert({
              session_id: sessionId,
              role: 'user',
              content: message
            });

            await supabase.from('chat_messages').insert({
              session_id: sessionId,
              role: 'assistant',
              content: 'Generated updated code'
            });

            // Update project's html_code directly (no commit creation)
            await supabase
              .from('projects')
              .update({ 
                html_code: htmlResult,
                updated_at: new Date().toISOString()
              })
              .eq('session_id', sessionId);

            console.log('✅ Project html_code updated');

            // Deduct tokens if using Claude
            if (selectedModel === 'claude-sonnet-4.5') {
              const { error: tokenError } = await supabase.rpc('deduct_tokens', {
                p_user_id: userId,
                p_amount: 1000,
                p_description: `Code generation with ${selectedModel}`
              });

              if (tokenError) {
                console.error('Token deduction error:', tokenError);
              }
            }
          }

          controller.close();
        } catch (error: any) {
          console.error('Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate code',
      success: false 
    }, { status: 500 });
  }
}