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

    // ==================== LLAMA FREE TIER LIMIT CHECK ====================
    if (selectedModel === 'llama-3.3-70b') {
      const { data: limitCheck, error: limitError } = await supabase
        .rpc('check_and_increment_daily_limit', {
          p_user_id: userId,
          p_max_limit: 50
        });

      if (limitError) {
        console.error('Daily limit check error:', limitError);
      } else if (limitCheck && !limitCheck.allowed) {
        await supabase
          .from('sessions')
          .update({ 
            generation_status: 'failed',
            generation_error: limitCheck.message || 'Daily free generation limit reached (50/day). Try again tomorrow or use Claude Sonnet 4.5.'
          })
          .eq('id', sessionId);

        return NextResponse.json({ 
          error: limitCheck.message || 'Daily limit reached',
          success: false 
        }, { status: 429 });
      }
    }

    // ==================== CLAUDE TOKEN BALANCE CHECK ====================
    if (selectedModel === 'claude-sonnet-4.5') {
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('token_balance')
        .eq('user_id', userId)
        .single();

      const balance = wallet?.token_balance || 0;

      // Changed minimum from 1000 to 4000 tokens
      if (balance < 4000) {
        await supabase
          .from('sessions')
          .update({ 
            generation_status: 'failed',
            generation_error: 'Insufficient tokens. You need at least 4,000 tokens to use Claude Sonnet 4.5.'
          })
          .eq('id', sessionId);

        return NextResponse.json({ 
          error: 'Insufficient tokens. You need at least 4,000 tokens to use Claude Sonnet 4.5.',
          success: false 
        }, { status: 402 });
      }
    }

    // ==================== UPDATE STATUS TO GENERATING ====================
    await supabase
      .from('sessions')
      .update({ 
        generation_status: 'generating',
        generation_error: null
      })
      .eq('id', sessionId);

    // Get chat history
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

    // ==================== STREAMING RESPONSE ====================
    const stream = new ReadableStream({
      async start(controller) {
        let htmlResult = '';
        let totalTokensUsed = 0;
        let generationSuccess = false;

        try {
          const agentResponse = await fetch(`${AGENT_SERVICE_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: message,
              model: selectedModel,
              current_code: project?.html_code || null,
              chat_history: chatHistory || [],
              user_id: userId,
              session_id: sessionId
            })
          });

          if (!agentResponse.ok) {
            const errorText = await agentResponse.text();
            console.error('Agent service error:', errorText);
            
            await supabase
              .from('sessions')
              .update({ 
                generation_status: 'failed',
                generation_error: `Agent service error: ${errorText}`
              })
              .eq('id', sessionId);

            // NETWORK FAILURE: Deduct 2000 tokens for Claude
            if (selectedModel === 'claude-sonnet-4.5') {
              await supabase.rpc('deduct_tokens_with_tracking', {
                p_user_id: userId,
                p_amount: 2000,
                p_description: `Network failure penalty - ${selectedModel}`,
                p_session_id: sessionId
              });
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              message: 'Agent service unavailable' 
            })}\n\n`));
            controller.close();
            return;
          }

          const reader = agentResponse.body?.getReader();
          if (!reader) throw new Error('No reader available');

          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                try {
                  const parsed = JSON.parse(data);
                  
                  // Capture HTML and token usage from backend
                  if (parsed.type === 'complete') {
                    htmlResult = parsed.html;
                    totalTokensUsed = parsed.total_tokens || 0;
                    generationSuccess = true;
                  }
                  
                  // Forward to frontend
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                } catch (e) {
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
              }
            }
          }

          // ==================== SAVE TO DATABASE ====================
          if (htmlResult && generationSuccess) {
            // Save chat messages
            await supabase.from('chat_messages').insert({
              session_id: sessionId,
              role: 'user',
              content: message
            });

            await supabase.from('chat_messages').insert({
              session_id: sessionId,
              role: 'assistant',
              content: 'Generated code successfully'
            });

            // Update project's html_code
            await supabase
              .from('projects')
              .update({ 
                html_code: htmlResult,
                updated_at: new Date().toISOString()
              })
              .eq('session_id', sessionId);

            console.log('✅ Project html_code updated');

            // Update status to completed
            await supabase
              .from('sessions')
              .update({ 
                generation_status: 'completed',
                generation_error: null
              })
              .eq('id', sessionId);

            // ==================== DEDUCT ACTUAL TOKENS FOR CLAUDE ====================
            if (selectedModel === 'claude-sonnet-4.5') {
              // Use actual token usage, or fallback to 2000 if not available
              const tokensToDeduct = totalTokensUsed > 0 ? totalTokensUsed : 2000;
              
              const { data: deductionResult, error: tokenError } = await supabase.rpc('deduct_tokens_with_tracking', {
                p_user_id: userId,
                p_amount: tokensToDeduct,
                p_description: `Code generation with ${selectedModel} (${tokensToDeduct} tokens)`,
                p_session_id: sessionId
              });

              if (tokenError) {
                console.error('Token deduction error:', tokenError);
              } else {
                console.log(`✅ Deducted ${tokensToDeduct} tokens. New balance: ${deductionResult?.new_balance}`);
              }
            }

            console.log(`✅ Generation complete. Tokens used: ${totalTokensUsed}`);
          } else {
            // Generation failed
            await supabase
              .from('sessions')
              .update({ 
                generation_status: 'failed',
                generation_error: 'No HTML generated'
              })
              .eq('id', sessionId);

            // FAILURE: Deduct 2000 tokens for Claude
            if (selectedModel === 'claude-sonnet-4.5') {
              await supabase.rpc('deduct_tokens_with_tracking', {
                p_user_id: userId,
                p_amount: 2000,
                p_description: `Generation failure penalty - ${selectedModel}`,
                p_session_id: sessionId
              });
            }
          }

          controller.close();

        } catch (error: any) {
          console.error('❌ Stream processing error:', error);

          await supabase
            .from('sessions')
            .update({ 
              generation_status: 'failed',
              generation_error: error.message || 'Unknown error'
            })
            .eq('id', sessionId);

          // ERROR: Deduct 2000 tokens for Claude
          if (selectedModel === 'claude-sonnet-4.5') {
            await supabase.rpc('deduct_tokens_with_tracking', {
              p_user_id: userId,
              p_amount: 2000,
              p_description: `Error penalty - ${selectedModel}`,
              p_session_id: sessionId
            });
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            message: error.message || 'Generation failed' 
          })}\n\n`));
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
    console.error('❌ API Route Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Server error',
      success: false 
    }, { status: 500 });
  }
}