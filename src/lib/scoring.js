export function betPoints(bet, actualPosition, topFive) {
  if (actualPosition === null || actualPosition === undefined) return 0
  if (actualPosition === bet.predicted_position) return 3
  return topFive.has(bet.athlete_id) ? 1 : 0
}

// Points for every bet of one race, given that race's results. Mirrors score-race so a
// hand-edited result shows up in the standings right away instead of the next morning.
export function scoreBets(bets, results) {
  const positions = new Map()
  const topFive = { FPRO: new Set(), MPRO: new Set() }
  for (const r of results) {
    if (r.position === null || r.position === undefined) continue
    positions.set(`${r.division}:${r.athlete_id}`, r.position)
    if (r.position <= 5) topFive[r.division]?.add(r.athlete_id)
  }
  return bets.map((bet) => ({
    id: bet.id,
    points: betPoints(
      bet,
      positions.get(`${bet.division}:${bet.athlete_id}`),
      topFive[bet.division] || new Set()
    )
  }))
}
