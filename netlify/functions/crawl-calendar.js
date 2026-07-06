import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'
import { schedule } from '@netlify/functions'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function crawl() {
  const res = await fetch('https://stats.protriathletes.org/pro-race-calendar')
  const html = await res.text()
  const $ = cheerio.load(html)

  const races = []

  $('.sortable-item').each((_, el) => {
    const $el = $(el)
    const nameEl = $el.find('.col-name a')
    const href = nameEl.attr('href') || ''
    const match = href.match(/\/race\/(.+?)\/(\d{4})\/(results|participants)/)
    if (!match) return
    const slug = match[1]

    const detailsEl = $el.next('.details')
    const divisions = []
    if (detailsEl.text().includes('FPRO')) divisions.push('FPRO')
    if (detailsEl.text().includes('MPRO')) divisions.push('MPRO')

    const dateText = $el.find('.col-date').text().trim()
    const date = dateText ? new Date(dateText).toISOString().split('T')[0] : null

    races.push({
      slug,
      name: nameEl.text().trim(),
      date,
      tier: $el.find('.col-tier').text().trim(),
      brand: $el.find('.col-brand').text().trim(),
      distance: detailsEl.find(':contains("Distance")').text().replace('Distance:', '').trim(),
      location: detailsEl.find(':contains("Location")').text().replace('Location:', '').trim(),
      country: detailsEl.find(':contains("Country")').text().replace('Country:', '').trim(),
      prize_money: $el.find('.col-prize').text().trim(),
      divisions: divisions.length ? divisions : null,
      results_url: href.includes('/results') ? `https://stats.protriathletes.org${href}` : null,
      participants_url: href.includes('/participants') ? `https://stats.protriathletes.org${href}` : null,
      crawled_at: new Date().toISOString(),
    })
  })

  for (const race of races) {
    await supabase.from('races').upsert(race, { onConflict: 'slug' })
  }

  return races.length
}

async function crawlHandler() {
  try {
    const count = await crawl()
    return { statusCode: 200, body: JSON.stringify({ imported: count }) }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}

export const handler = schedule('0 6 * * *', crawlHandler)
