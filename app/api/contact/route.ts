import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side operations
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const ip_address = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';

    // Insert into database
    const { data, error } = await supabase
      .from('contact_inquiries')
      .insert({
        name,
        email,
        subject,
        message,
        ip_address,
        user_agent,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to submit inquiry' },
        { status: 500 }
      );
    }

    // TODO: Send email notification to team@parasync.in
    // You can integrate with services like:
    // - Resend (https://resend.com)
    // - SendGrid
    // - AWS SES
    // - Nodemailer

    return NextResponse.json(
      { 
        success: true, 
        message: 'Inquiry submitted successfully',
        id: data.id 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}