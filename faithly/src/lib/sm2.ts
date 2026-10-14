/** SM-2 spaced repetition. grade: 0 = again, 3 = hard, 4 = good, 5 = easy. */
export interface CardState { ease: number; interval_days: number; repetitions: number }

export function review(card: CardState, grade: 0 | 3 | 4 | 5): CardState & { due_in_days: number } {
  let { ease, interval_days, repetitions } = card;
  if (grade < 3) {
    repetitions = 0;
    interval_days = 0;
  } else {
    repetitions += 1;
    interval_days = repetitions === 1 ? 1 : repetitions === 2 ? 3 : Math.round(interval_days * ease);
  }
  ease = Math.max(1.3, ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
  return { ease: Math.round(ease * 100) / 100, interval_days, repetitions, due_in_days: interval_days };
}
