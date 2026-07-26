export async function readJsonObject(request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return null;
    }
    return body;
  } catch {
    return null;
  }
}
