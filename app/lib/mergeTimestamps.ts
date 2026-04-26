export function mergeTimestamps(tsA: number[], tsB: number[]): number[] {
  const set = new Set([...tsA, ...tsB])
  return Array.from(set).sort((a, b) => a - b)
}

export function alignSeries(
  mergedTs: number[],
  originalTs: number[],
  values: (number | null)[]
): (number | null)[] {
  const map = new Map<number, number | null>()
  originalTs.forEach((t, i) => map.set(t, values[i]))
  return mergedTs.map(t => map.get(t) ?? null)
}
