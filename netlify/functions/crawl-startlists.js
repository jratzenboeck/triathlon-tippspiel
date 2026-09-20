import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'
import { schedule } from '@netlify/functions'
import { extractTextItems } from 'unpdf'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

const IRONMAN_PAGE = 'https://www.ironman.com/community/pro-athletes'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const COUNTRY_CODES = {
  'united states': 'US',
  canada: 'CA',
  mexico: 'MX',
  'united kingdom': 'GB',
  ireland: 'IE',
  germany: 'DE',
  france: 'FR',
  italy: 'IT',
  spain: 'ES',
  portugal: 'PT',
  sweden: 'SE',
  norway: 'NO',
  denmark: 'DK',
  finland: 'FI',
  netherlands: 'NL',
  belgium: 'BE',
  switzerland: 'CH',
  austria: 'AT',
  poland: 'PL',
  'czech republic': 'CZ',
  czechia: 'CZ',
  hungary: 'HU',
  romania: 'RO',
  bulgaria: 'BG',
  greece: 'GR',
  croatia: 'HR',
  slovenia: 'SI',
  slovakia: 'SK',
  serbia: 'RS',
  belarus: 'BY',
  ukraine: 'UA',
  russia: 'RU',
  estonia: 'EE',
  latvia: 'LV',
  lithuania: 'LT',
  luxembourg: 'LU',
  iceland: 'IS',
  turkey: 'TR',
  israel: 'IL',
  'south africa': 'ZA',
  namibia: 'NA',
  zimbabwe: 'ZW',
  kenya: 'KE',
  ethiopia: 'ET',
  morocco: 'MA',
  egypt: 'EG',
  japan: 'JP',
  china: 'CN',
  'south korea': 'KR',
  'hong kong': 'HK',
  taiwan: 'TW',
  'new zealand': 'NZ',
  singapore: 'SG',
  malaysia: 'MY',
  thailand: 'TH',
  philippines: 'PH',
  india: 'IN',
  indonesia: 'ID',
  vietnam: 'VN',
  australia: 'AU',
  brazil: 'BR',
  argentina: 'AR',
  chile: 'CL',
  colombia: 'CO',
  ecuador: 'EC',
  peru: 'PE',
  venezuela: 'VE',
  uruguay: 'UY',
  paraguay: 'PY',
  bolivia: 'BO',
  'costa rica': 'CR',
  panama: 'PA',
  guatemala: 'GT',
  'dominican republic': 'DO',
  'puerto rico': 'PR',
  cuba: 'CU',
  jamaica: 'JM',
  'trinidad and tobago': 'TT',
  bermuda: 'BM',
  'united arab emirates': 'AE',
  'saudi arabia': 'SA',
  kazakhstan: 'KZ',
  mongolia: 'MN',
  usa: 'US',
  can: 'CA',
  mex: 'MX',
  gbr: 'GB',
  irl: 'IE',
  deu: 'DE',
  fra: 'FR',
  ita: 'IT',
  esp: 'ES',
  prt: 'PT',
  swe: 'SE',
  nor: 'NO',
  dan: 'DK',
  fin: 'FI',
  nld: 'NL',
  bel: 'BE',
  che: 'CH',
  aut: 'AT',
  pol: 'PL',
  cze: 'CZ',
  hun: 'HU',
  rou: 'RO',
  bul: 'BG',
  grc: 'GR',
  hrv: 'HR',
  svn: 'SI',
  svk: 'SK',
  srb: 'RS',
  blr: 'BY',
  ukr: 'UA',
  rus: 'RU',
  est: 'EE',
  lva: 'LV',
  ltu: 'LT',
  lux: 'LU',
  isl: 'IS',
  tur: 'TR',
  isr: 'IL',
  zaf: 'ZA',
  nam: 'NA',
  zwe: 'ZW',
  ken: 'KE',
  eth: 'ET',
  mar: 'MA',
  egy: 'EG',
  jpn: 'JP',
  chn: 'CN',
  kor: 'KR',
  hkg: 'HK',
  twn: 'TW',
  nzl: 'NZ',
  sgp: 'SG',
  mys: 'MY',
  tha: 'TH',
  phl: 'PH',
  ind: 'IN',
  idn: 'ID',
  vnm: 'VN',
  aus: 'AU',
  bra: 'BR',
  arg: 'AR',
  chl: 'CL',
  col: 'CO',
  ecu: 'EC',
  per: 'PE',
  ven: 'VE',
  ury: 'UY',
  pry: 'PY',
  bol: 'BO',
  cri: 'CR',
  pan: 'PA',
  gtm: 'GT',
  dom: 'DO',
  pri: 'PR',
  cub: 'CU',
  jam: 'JM',
  tto: 'TT',
  bmu: 'BM',
  are: 'AE',
  sau: 'SA',
  kaz: 'KZ',
  mng: 'MN',
  snd: 'SD',
  dza: 'DZ',
  pyf: 'PF'
}

function norm(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(str) {
  return norm(str)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function countryCode(name) {
  if (!name) return null
  return COUNTRY_CODES[norm(name)] || null
}

function cleanLabel(label) {
  let s = norm(label)
  const idx = s.indexOf('ironman')
  if (idx > 0) s = s.slice(idx)
  s = s.replace(/^\d{4}\b\s*/, '')
  return s.trim()
}

function matchRace(label, races) {
  const key = cleanLabel(label)
  if (key.includes('world championship') && !key.includes('70.3')) {
    return races.find((r) => r.nameNorm === 'ironman hawaii') || null
  }
  let best = null
  for (const r of races) {
    if (key === r.nameNorm || key.startsWith(r.nameNorm + ' ')) {
      if (!best || r.nameNorm.length > best.nameNorm.length) best = r
    }
  }
  return best
}

function getStartListLinks(html) {
  const $ = cheerio.load(html)
  const button = $('button.trigger')
    .filter((_, el) => ($(el).text() || '').includes('PRO Start Lists'))
    .first()
  if (!button.length) return []
  const links = []
  button
    .parent()
    .find('a[href$=".pdf"]')
    .each((_, el) => {
      const href = $(el).attr('href')
      if (!href) return
      links.push({
        label: $(el).text().replace(/\s+/g, ' ').trim(),
        url: new URL(href, IRONMAN_PAGE).toString()
      })
    })
  return links
}

async function parseStartListPdf(buffer) {
  const { items } = await extractTextItems(buffer)
  const rows = []
  for (const page of items) {
    const buckets = new Map()
    for (const item of page) {
      const str = (item.str || '').trim()
      if (!str) continue
      const y = Math.round(item.y)
      if (!buckets.has(y)) buckets.set(y, [])
      buckets.get(y).push({ ...item, str })
    }
    const ys = [...buckets.keys()].sort((a, b) => a - b)
    for (const y of ys) {
      const tokens = buckets.get(y).sort((a, b) => a.x - b.x)
      const m = (tokens[0]?.str || '').match(/^([FM])(\d+)$/)
      if (!m) continue
      const division = m[1] === 'F' ? 'FPRO' : 'MPRO'
      const first = []
      const last = []
      const country = []
      for (const t of tokens) {
        if (/^[FM]\d+$/.test(t.str)) continue
        if (t.x < 230) first.push(t.str)
        else if (t.x < 330) last.push(t.str)
        else country.push(t.str)
      }
      const first_name = first.join(' ').trim()
      const last_name = last.join(' ').trim()
      if (!first_name || !last_name) continue
      rows.push({
        division,
        bib: m[0],
        first_name,
        last_name,
        country: country.join(' ').trim() || null
      })
    }
  }
  return rows
}

async function crawlHandler() {
  const log = []
  try {
    const pageRes = await fetch(IRONMAN_PAGE, { headers: { 'user-agent': UA } })
    if (!pageRes.ok) throw new Error(`Ironman page ${pageRes.status}`)
    const links = getStartListLinks(await pageRes.text())
    if (!links.length) throw new Error('No PRO Start List links found')

    const { data: allRaces } = await supabase.from('races').select('id, name, slug')
    const races = (allRaces || [])
      .map((r) => ({ ...r, nameNorm: norm(r.name) }))
      .filter((r) => r.nameNorm.startsWith('ironman'))

    const allAthletes = []
    {
      const pageSize = 1000
      for (let offset = 0; ; offset += pageSize) {
        const { data } = await supabase
          .from('athletes')
          .select('id, slug, full_name, division, country')
          .order('id')
          .range(offset, offset + pageSize - 1)
        allAthletes.push(...(data || []))
        if (!data || data.length < pageSize) break
      }
    }
    const byName = new Map()
    const bySlug = new Map()
    for (const a of allAthletes) {
      byName.set(norm(a.full_name), a)
      bySlug.set(a.slug, a)
    }

    const toCreate = new Map()
    const raceEntries = []

    for (const link of links) {
      const race = matchRace(link.label, races)
      if (!race) {
        log.push(`no race match: ${link.label}`)
        continue
      }
      const pdfRes = await fetch(link.url, { headers: { 'user-agent': UA } })
      if (!pdfRes.ok) {
        log.push(`download failed ${pdfRes.status}: ${link.label}`)
        continue
      }
      const pdf = new Uint8Array(await pdfRes.arrayBuffer())
      const rows = await parseStartListPdf(pdf)

      const entries = []
      for (const row of rows) {
        const fullName = `${row.first_name} ${row.last_name}`.trim()
        const key = norm(fullName)

        let athlete = byName.get(key) || bySlug.get(slugify(fullName))

        if (!athlete) {
          const slug = slugify(fullName)
          if (!toCreate.has(slug)) toCreate.set(slug, { ...row, slug, full_name: fullName })
        }
        entries.push({ raceId: race.id, row, key, fullName })
      }
      raceEntries.push({ race, entries })
      log.push(`${race.name}: matched ${link.label} (${rows.length} athletes)`)
    }

    if (toCreate.size > 0) {
      const fresh = []
      for (const row of toCreate.values()) {
        fresh.push({
          slug: row.slug,
          first_name: row.first_name,
          last_name: row.last_name,
          full_name: row.full_name,
          country: countryCode(row.country),
          division: row.division
        })
      }
      const { data: inserted, error: insErr } = await supabase
        .from('athletes')
        .upsert(fresh, { onConflict: 'slug', ignoreDuplicates: false })
        .select('id, slug, full_name, division, country')
        .limit(1000)
      if (insErr) throw insErr
      for (const a of inserted || []) {
        byName.set(norm(a.full_name), a)
        bySlug.set(a.slug, a)
      }
    }

    // Accumulate records across PDFs per race, so multiple PDFs targeting the same race
    // (e.g. WPRO + MPRO world championship lists) merge instead of overwriting.
    const recordsByRace = new Map()
    for (const { race, entries } of raceEntries) {
      const records = entries
        .map(({ raceId, row, key }) => {
          const athlete =
            byName.get(key) || bySlug.get(slugify(row.first_name + ' ' + row.last_name))
          if (!athlete) {
            log.push(`$unmatched: ${row.division} ${row.bib} ${row.first_name} ${row.last_name}`)
            return null
          }
          return {
            race_id: raceId,
            athlete_id: athlete.id,
            division: row.division,
            bib: row.bib
          }
        })
        .filter(Boolean)
      if (!recordsByRace.has(race.id)) recordsByRace.set(race.id, { race, records: [] })
      recordsByRace.get(race.id).records.push(...records)
    }

    for (const { race, records } of recordsByRace.values()) {
      await supabase.from('race_startlists').delete().eq('race_id', race.id)
      if (records.length) {
        await supabase.from('race_startlists').insert(records)
      }
      await supabase
        .from('races')
        .update({ startlist_crawled_at: new Date().toISOString() })
        .eq('id', race.id)
      log.push(`${race.name}: stored ${records.length} startlist rows`)
    }

    return { statusCode: 200, body: JSON.stringify({ done: true, log }) }
  } catch (error) {
    console.error('Startlist crawl failed:', error.message)
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}

export const handler = schedule('0 6 * * *', crawlHandler)
