import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { sessionId, message, userId } = await request.json();

    if (!sessionId || !message || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Generating code for session:', sessionId);

    // Get chat history
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // Get current commit (if exists)
    const { data: currentCommit } = await supabase
      .from('commits')
      .select('html_code')
      .eq('session_id', sessionId)
      .order('commit_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Build context for LLM
    let systemPrompt = 'You are an expert web developer. Generate complete, self-contained HTML pages with embedded CSS and JavaScript. Always return ONLY the HTML code starting with <!DOCTYPE html>, no markdown, no explanations, no code blocks. Make it visually appealing and modern with inline styles.';

    if (currentCommit) {
      systemPrompt = `You are updating existing HTML code based on user feedback.

Current code:
${currentCommit.html_code}

Previous conversation:
${chatHistory?.map(m => `${m.role}: ${m.content}`).join('\n') || 'No previous messages'}

User's new request: ${message}

Generate ONLY the complete updated HTML. Return the full page, not just changes. Keep existing functionality unless asked to change it.`;
    }

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      throw new Error('AI service unavailable');
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI');
    }

    let html = data.choices[0].message.content;
    html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('HTML generated, length:', html.length);

    // Save user message
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message
    });

    // Save assistant response
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: 'Generated updated code'
    });

    // Always create a commit after generation
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

    console.log('Creating commit:', { sessionId, nextNumber, commitMessage });

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

    console.log('Commit created:', newCommit.id);

    // Update session's current_commit_id
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ current_commit_id: newCommit.id })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Session update error:', updateError);
    }

    console.log('Generation complete');

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