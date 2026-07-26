export function normalizeVideoEvidence(urls: string[] = []) {
  return urls.map((url) => ({
    url,
    provider: 'external' as const,
    verified: false
  }));
}
