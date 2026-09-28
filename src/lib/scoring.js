export function betPoints(bet, actualPosition, topFive) {
  if (actualPosition === null || actualPosition === undefined) return 0
  if (actualPosition === bet.predicted_position) return 3
  return topFive.has(bet.athlete_id) ? 1 : 0
}
