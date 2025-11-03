import { NextResponse } from 'next/server';

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const { sessionId, pageNumber, userId } = await request.json();

    if (!sessionId || pageNumber === undefined || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        success: false 
      }, { status: 400 });
    }

    console.log(`🔄 Regenerating page ${pageNumber} for session ${sessionId}`);

    // Trigger regeneration on backend
    fetch(`${AGENT_SERVICE_URL}/regenerate-page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        page_number: pageNumber,
        user_id: userId
      })
    }).catch(err => {
      console.error('Failed to trigger page regeneration:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Page regeneration started',
      pageNumber: pageNumber
    });

  } catch (error: any) {
    console.error('❌ Regenerate page API error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to regenerate page'
    }, { status: 500 });
  }
}