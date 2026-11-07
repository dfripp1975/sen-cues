import { guideCoverage } from './guides';

/** Chapters covered by a book's built-in guide (empty when it has none). */
export function guideChapters(slug: string): number[] {
  return guideCoverage[slug] ?? [];
}

/** "1 to 5" for a run from chapter 1, otherwise "1, 4, 15, 30 and 47". */
export function describeChapters(nums: number[]): string {
  if (!nums.length) return '';
  if (nums.every((n, i) => n === i + 1)) return nums.length === 1 ? '1' : `1 to ${nums.length}`;
  return nums.length === 1 ? String(nums[0]) : `${nums.slice(0, -1).join(', ')} and ${nums[nums.length - 1]}`;
}
