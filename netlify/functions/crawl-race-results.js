import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'
import { schedule } from '@netlify/functions'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function crawlRaceResults(race) {
  const year = race.date.slice(0, 4)
  const url = `https://stats.protriathletes.org/race/${race.slug}/${year}/results`

  const res = await fetch(url)
  const html = await res.text()
  const $ = cheerio.load(html)

  const results = []

  $('#divisionTabs a').each((_, tab) => {
    const division = $(tab).attr('id')?.replace('-tab', '')
    if (!division) return

    const tabId = $(tab).attr('href')
    const $rows = $(`${tabId} .race-results tbody tr`).not('[head]')

    $rows.each((_, row) => {
      const $cells = $(row).find('td')
      const posText = $cells.eq(0).text().trim()
      if (posText.toLowerCase() === 'dnf') return

      const position = parseInt(posText)
      if (isNaN(position) || position > 5) return

      const nameLink = $cells.eq(1).find('a[href^="/athlete/"]')
      const athleteSlug = nameLink.attr('href')?.replace('/athlete/', '')
      if (!athleteSlug) return

      const finishTime = $cells.eq(7).text().trim()

      results.push({
        race_id: race.id,
        athlete_slug: athleteSlug,
        division,
        position,
        finish_time: finishTime || null,
      })
    })
  })

  return results
}

async function crawlHandler() {
  try {
    const { data: races } = await supabase
      .from('races')
      .select('id, slug, date')
      .lt('date', new Date().toISOString().split('T')[0])
      .is('crawled_at', null)
      .limit(10)

    if (!races?.length) {
      return { statusCode: 200, body: JSON.stringify({ message: 'No races to crawl' }) }
    }

    let totalResults = 0

    for (const race of races) {
      const results = await crawlRaceResults(race)
      if (!results.length) continue

      for (const r of results) {
        const { data: athletes } = await supabase
          .from('athletes')
          .select('id')
          .eq('slug', r.athlete_slug)
          .limit(1)

        const athleteId = athletes?.[0]?.id
        if (!athleteId) continue

        await supabase.from('race_results').upsert({
          race_id: r.race_id,
          athlete_id: athleteId,
          division: r.division,
          position: r.position,
          finish_time: r.finish_time,
        }, { onConflict: 'race_id,athlete_id,division' })
      }

      await supabase
        .from('races')
        .update({ crawled_at: new Date().toISOString() })
        .eq('id', race.id)

      totalResults += results.length
    }

    return { statusCode: 200, body: JSON.stringify({ races: races.length, results: totalResults }) }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}

export const handler = schedule('0 7 * * *', crawlHandler)
