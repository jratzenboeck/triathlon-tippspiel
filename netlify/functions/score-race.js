import { createClient } from '@supabase/supabase-js'
import { schedule } from '@netlify/functions'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function scoreHandler() {
  try {
    console.log('Starting race scoring...')
    const { data: races } = await supabase
      .from('races')
      .select('id')
      .not('crawled_at', 'is', null)
      .lt('date', new Date().toISOString().split('T')[0])

    if (!races?.length) {
      console.log('No races to score')
      return { statusCode: 200, body: JSON.stringify({ message: 'No races to score' }) }
    }

    console.log(`Found ${races.length} races to score`)
    let totalUpdated = 0

    for (const race of races) {
      const { data: results } = await supabase
        .from('race_results')
        .select('athlete_id, division, position')
        .eq('race_id', race.id)
        .not('position', 'is', null)

      if (!results?.length) {
        console.log(`  No results for race ${race.id}`)
        continue
      }

      const { data: bets } = await supabase
        .from('bets')
        .select('id, user_id, athlete_id, division, predicted_position')
        .eq('race_id', race.id)

      if (!bets?.length) {
        console.log(`  No bets for race ${race.id}`)
        continue
      }

      const resultMap = {}
      for (const r of results) {
        if (!resultMap[r.division]) resultMap[r.division] = {}
        resultMap[r.division][r.athlete_id] = r.position
      }

      const top5ByDiv = {}
      for (const r of results) {
        if (r.position <= 5) {
          if (!top5ByDiv[r.division]) top5ByDiv[r.division] = new Set()
          top5ByDiv[r.division].add(r.athlete_id)
        }
      }

      for (const bet of bets) {
        let points = 0
        const actualPosition = resultMap[bet.division]?.[bet.athlete_id]

        if (actualPosition === bet.predicted_position) {
          points = 3
        } else if (top5ByDiv[bet.division]?.has(bet.athlete_id)) {
          points = 1
        }

        await supabase
          .from('bets')
          .update({ points })
          .eq('id', bet.id)

        totalUpdated++
      }
    }

    console.log(`Done: ${totalUpdated} bets scored`)
    return { statusCode: 200, body: JSON.stringify({ scored: totalUpdated }) }
  } catch (error) {
    console.error('Scoring failed:', error.message)
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}

export const handler = schedule('0 8 * * *', scoreHandler)
