import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH - Update project html_code (save without commit)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { htmlCode } = await request.json();
    const { id: projectId } = await params;

    if (!htmlCode) {
      return NextResponse.json({ error: 'HTML code required' }, { status: 400 });
    }

    // Update project's html_code
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        html_code: htmlCode,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ project, success: true });
  } catch (error: any) {
    console.error('Save project error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to save project',
      success: false 
    }, { status: 500 });
  }
}