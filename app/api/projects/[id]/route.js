import { NextResponse } from 'next/server';
import { PROJECT_SLOT_LIMIT } from '@/lib/constants';
import { readJsonObject } from '@/lib/request';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please login first.' }, { status: 401 });
  }

  const body = await readJsonObject(request);
  const action = body?.action;

  if (!['archive', 'restore'].includes(action)) {
    return NextResponse.json({ error: 'Invalid project action.' }, { status: 400 });
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, title, slug, status, researcher_id, published_at')
    .eq('id', id)
    .eq('researcher_id', user.id)
    .maybeSingle();

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 400 });
  }

  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  }

  if (action === 'archive') {
    if (project.status === 'archived') {
      return NextResponse.json({ message: 'Project already archived.', project });
    }

    const { data: updated, error: updateError } = await supabase
      .from('projects')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', project.id)
      .eq('researcher_id', user.id)
      .select('id, title, slug, status, project_tag, summary, published_at')
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Project archived. You now have one free slot.',
      project: updated,
      slotLimit: PROJECT_SLOT_LIMIT
    });
  }

  const { count: activeProjectCount, error: countError } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('researcher_id', user.id)
    .eq('status', 'published');

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 400 });
  }

  if ((activeProjectCount || 0) >= PROJECT_SLOT_LIMIT) {
    return NextResponse.json(
      {
        error: `You already used all ${PROJECT_SLOT_LIMIT} active project slots. Archive one active project before restoring this one.`
      },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from('projects')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', project.id)
    .eq('researcher_id', user.id)
    .select('id, title, slug, status, project_tag, summary, published_at')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({
    message: 'Project restored and visible again.',
    project: updated,
    slotLimit: PROJECT_SLOT_LIMIT
  });
}
