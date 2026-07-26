export async function createMentorshipRequest(payload: { researcherId: string }) {
  const response = await fetch('/api/mentorship-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return response.json();
}
