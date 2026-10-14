import { describe, expect, it } from 'vitest';
import { detectCrisis } from './safety';

describe('detectCrisis', () => {
  it('flags messages that may indicate risk', () => {
    for (const m of ["I don't want to live any more", 'I want to kill myself', 'thinking about suicide', 'my partner hits me', 'I have been self-harming']) {
      expect(detectCrisis(m), m).toBe(true);
    }
  });
  it('does not flag ordinary faith questions', () => {
    for (const m of ['What does the Bible say about anxiety?', 'Why did Jesus have to die?', 'Explain Psalm 23', 'How do I forgive my dad?']) {
      expect(detectCrisis(m), m).toBe(false);
    }
  });
});
