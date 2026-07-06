import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'
import { schedule } from '@netlify/functions'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function crawlDivision(division) {
  const path = division === 'FPRO' ? 'women' : 'men'
  const res = await fetch(`https://stats.protriathletes.org/rankings/${path}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  const athletes = []

  $('.trow').each((_, el) => {
    const $el = $(el)
    const nameLink = $el.find('.name a[href^="/athlete/"]')
    const href = nameLink.attr('href') || ''
    const slug = href.replace('/athlete/', '')

    const flagEl = $el.find('.flag-icon')
    const country = flagEl.attr('class')?.match(/flag-icon-(\w{2})/)?.[1] || null

    const rankingNumber = $el.find('.ranking-number').text().trim()
    const firstName = $el.find('.truncate-mobile').attr('data-original-content') || ''
    const lastName = $el.find('.name a span:last-child').text().trim()

    athletes.push({
      slug,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
      country: country?.toUpperCase() || null,
      division,
      pto_points: parseFloat($el.find('.trow > div:not(.p-1):not(.expand-details):not(.d-flex)').first().text().trim()) || null,
      ranking_position: parseInt(rankingNumber) || null,
    })
  })

  for (let i = 0; i < athletes.length; i += 100) {
    const batch = athletes.slice(i, i + 100)
    await supabase.from('athletes').upsert(batch, { onConflict: 'slug' })
  }

  return athletes.length
}

async function crawlHandler() {
  try {
    const men = await crawlDivision('MPRO')
    const women = await crawlDivision('FPRO')
    return { statusCode: 200, body: JSON.stringify({ imported: { men, women } }) }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}

export const handler = schedule('0 6 * * *', crawlHandler)
