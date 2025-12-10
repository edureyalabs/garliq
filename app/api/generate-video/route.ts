import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { videoId, userId, topicCategory } = await req.json();

    const modalUrl = process.env.MODAL_VIDEO_BACKEND_URL;
    if (!modalUrl) {
      throw new Error('MODAL_VIDEO_BACKEND_URL not configured');
    }

    const response = await fetch(`${modalUrl}/generate-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId, user_id: userId, topic_category: topicCategory })
    });

    const result = await response.json();
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}