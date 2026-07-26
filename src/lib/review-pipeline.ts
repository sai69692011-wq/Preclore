import { scoreProject } from '../../lib/vq-engine.js';

export function deterministicReview(input: Record<string, unknown>) {
  return scoreProject(input);
}
