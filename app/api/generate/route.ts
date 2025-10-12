import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: Request) {
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

    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    const { data: currentCommit } = await supabase
      .from('commits')
      .select('html_code')
      .eq('session_id', sessionId)
      .order('commit_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const agentResponse = await fetch(`${AGENT_SERVICE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: message,
        model: selectedModel,
        current_code: currentCommit?.html_code || null,
        chat_history: chatHistory || []
      })
    });

    if (!agentResponse.ok) {
      const errorText = await agentResponse.text();
      console.error('Agent service error:', errorText);
      throw new Error('AI service unavailable');
    }

    const agentData = await agentResponse.json();
    
    if (!agentData.success || !agentData.html) {
      throw new Error(agentData.error || 'No response from AI');
    }

    const html = agentData.html;

    console.log('HTML generated, length:', html.length);

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

    const { data: existingCommits } = await supabase
      .from('commits')
      .select('commit_number, id')
      .eq('session_id', sessionId)
      .order('commit_number', { ascending: false })
      .limit(1);

    const nextNumber = existingCommits && existingCommits.length > 0 
      ? existingCommits[0].commit_number + 1 
      : 1;
    
    const commitMessage = currentCommit 
      ? `Update #${nextNumber}` 
      : 'Initial generation';

    const { data: newCommit, error: commitError } = await supabase
      .from('commits')
      .insert({
        session_id: sessionId,
        commit_number: nextNumber,
        commit_message: commitMessage,
        html_code: html,
        parent_commit_id: existingCommits?.[0]?.id || null
      })
      .select()
      .single();

    if (commitError) {
      console.error('Commit creation error:', commitError);
      throw commitError;
    }

    await supabase
      .from('sessions')
      .update({ current_commit_id: newCommit.id })
      .eq('id', sessionId);

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

    return NextResponse.json({ 
      html, 
      success: true,
      commit: newCommit
    });
  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate code',
      success: false 
    }, { status: 500 });
  }
}