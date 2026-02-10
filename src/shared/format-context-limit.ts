export function formatContextWindowLimitLabel(limit: number): string {
  if (limit % 1_000 === 0) {
    return `${Math.round(limit / 1_000)}k`
  }
  return limit.toLocaleString()
}
