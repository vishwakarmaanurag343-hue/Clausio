// Minimal LCS line-diff used by the Drafting page's "View Diff" between two versions.
// Zero dependencies — drafts are a few hundred lines, so an O(m·n) table is fine.

export type DiffLine = { type: 'same' | 'added' | 'removed'; text: string }

export function diffLines(a: string, b: string): DiffLine[] {
  const left = a.split('\n')
  const right = b.split('\n')
  const m = left.length
  const n = right.length

  // dp[i][j] = length of the LCS of left[i..] and right[j..]
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = left[i] === right[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])

  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < m && j < n) {
    if (left[i] === right[j]) {
      out.push({ type: 'same', text: left[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'removed', text: left[i++] })
    } else {
      out.push({ type: 'added', text: right[j++] })
    }
  }
  while (i < m) out.push({ type: 'removed', text: left[i++] })
  while (j < n) out.push({ type: 'added', text: right[j++] })
  return out
}
