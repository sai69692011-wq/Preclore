'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Delete a project (Master Admin or Owner)
export async function removeProjectAction(projectId, pdfUrl) {
  const supabase = await createClient();

  // 1. Delete PDF file from storage if present
  if (pdfUrl) {
    const urlParts = pdfUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    if (fileName) {
      await supabase.storage.from('research_pdfs').remove([fileName]);
    }
  }

  // 2. Delete database record
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }

  revalidatePath('/journal');
  redirect('/journal');
}

// Send an Instagram-style Contact Request
export async function sendContactRequestAction(receiverId, projectId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be logged in to send a request.');
  }

  if (user.id === receiverId) {
    throw new Error('You cannot send a contact request to yourself.');
  }

  // Check if request already exists
  const { data: existing } = await supabase
    .from('contact_requests')
    .select('id, status')
    .eq('sender_id', user.id)
    .eq('project_id', projectId)
    .maybeSingle();

  if (existing) {
    return { success: false, message: `Request already sent (${existing.status}).` };
  }

  const { error } = await supabase.from('contact_requests').insert({
    sender_id: user.id,
    receiver_id: receiverId,
    project_id: projectId,
    status: 'pending',
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/project/${projectId}`);
  revalidatePath('/connections');
  return { success: true, message: 'Contact request sent!' };
}

// Accept or Decline a Contact Request
export async function updateRequestStatusAction(requestId, status) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('contact_requests')
    .update({ status })
    .eq('id', requestId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/connections');
}
