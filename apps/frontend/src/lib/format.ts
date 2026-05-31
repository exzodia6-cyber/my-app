export function formatCounter(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)} тыс.`;
  return `${(value / 1_000_000).toFixed(1)} млн`;
}

export function makeAvatar(seed: string): string {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed.trim() || 'User')}`;
}
