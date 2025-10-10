import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { prompt } = await request.json();

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert web developer. Generate complete, self-contained HTML pages with embedded CSS and JavaScript. Always return ONLY the HTML code starting with <!DOCTYPE html>, no markdown, no explanations, no code blocks. Make it visually appealing and modern with inline styles.'
          },
          {
            role: 'user',
            content: `Create a complete HTML page for: ${prompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error response:', errorText);
      return NextResponse.json({ error: 'API request failed' }, { status: 500 });
    }

    const data = await response.json();
    console.log('Groq response:', JSON.stringify(data, null, 2));

    if (!data.choices || data.choices.length === 0) {
      console.error('No choices in response:', data);
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    let html = data.choices[0].message.content;

    // Clean up markdown code blocks if present
    html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Groq API error:', error);
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
  }
}