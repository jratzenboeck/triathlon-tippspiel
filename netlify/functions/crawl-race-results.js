import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'
import { schedule } from '@netlify/functions'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

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
      if (isNaN(position)) return

      const nameLink = $cells.eq(1).find('a[href^="/athlete/"]')
      const athleteSlug = nameLink.attr('href')?.replace('/athlete/', '')
      if (!athleteSlug) return

      const finishTime = $cells.eq(7).text().trim()

      results.push({
        race_id: race.id,
        athlete_slug: athleteSlug,
        division,
        position,
        finish_time: finishTime || null
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
      .is('results_crawled_at', null)
      .limit(10)

    if (!races?.length) {
      console.log('No races to crawl')
      return { statusCode: 200, body: JSON.stringify({ message: 'No races to crawl' }) }
    }

    console.log(`Found ${races.length} races to crawl`)

    let totalResults = 0

    for (const race of races) {
      console.log(`Crawling ${race.slug} (${race.date})...`)
      const results = await crawlRaceResults(race)
      if (!results.length) {
        console.log(`  No results found for ${race.slug}`)
        continue
      }

      const slugs = [...new Set(results.map((r) => r.athlete_slug))]
      const { data: athletes } = await supabase
        .from('athletes')
        .select('id, slug')
        .in('slug', slugs)

      const athleteIdBySlug = new Map((athletes || []).map((a) => [a.slug, a.id]))

      const rows = []
      for (const r of results) {
        const athleteId = athleteIdBySlug.get(r.athlete_slug)
        if (!athleteId) {
          console.log(`  Athlete not found: ${r.athlete_slug}`)
          continue
        }
        rows.push({
          race_id: r.race_id,
          athlete_id: athleteId,
          division: r.division,
          position: r.position,
          finish_time: r.finish_time
        })
      }

      const { error } = await supabase
        .from('race_results')
        .upsert(rows, { onConflict: 'race_id,athlete_id,division' })
      if (error) console.error(`  Upsert failed for ${race.slug}:`, error.message)

      await supabase
        .from('races')
        .update({ results_crawled_at: new Date().toISOString() })
        .eq('id', race.id)

      totalResults += rows.length
    }

    console.log(`Done: ${races.length} races, ${totalResults} results`)
    return { statusCode: 200, body: JSON.stringify({ races: races.length, results: totalResults }) }
  } catch (error) {
    console.error('Crawl failed:', error.message)
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}

export const handler = schedule('0 7 * * *', crawlHandler)
