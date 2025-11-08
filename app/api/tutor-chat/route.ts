// app/api/tutor-chat/route.ts

import { NextResponse } from 'next/server';
import { buildSystemPrompt, TutorContext } from '@/lib/tutor-context';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export const maxDuration = 30; // 30 second timeout

interface ChatRequest {
  message: string;
  context: TutorContext;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

export async function POST(request: Request) {
  try {
    const { message, context, conversationHistory = [] }: ChatRequest = await request.json();

    // Validation
    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    if (!context || !context.courseTitle) {
      return NextResponse.json(
        { success: false, error: 'Context is required' },
        { status: 400 }
      );
    }

    // Check if GROQ_API_KEY exists
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY not found in environment variables');
      return NextResponse.json(
        { success: false, error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(context);

    // Prepare messages for Groq
    // Keep last 10 messages for context (to avoid token limits)
    const recentHistory = conversationHistory.slice(-10);
    
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...recentHistory,
      { role: 'user' as const, content: message }
    ];

    console.log('🤖 Calling Groq API for tutor chat...');

    // Call Groq API
    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('❌ Groq API Error:', errorText);
      
      // Handle rate limiting
      if (groqResponse.status === 429) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }

      throw new Error(`Groq API failed: ${groqResponse.status}`);
    }

    const data = await groqResponse.json();

    // Extract AI response
    const aiMessage = data.choices?.[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('No response from AI');
    }

    console.log('✅ Tutor response generated successfully');

    // Return success response
    return NextResponse.json({
      success: true,
      message: aiMessage,
      tokensUsed: data.usage?.total_tokens || 0
    });

  } catch (error: any) {
    console.error('❌ Tutor chat error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get AI response. Please try again.' 
      },
      { status: 500 }
    );
  }
}