export function flag(country) {
  if (!country || country.length !== 2) return ''
  country = country.toUpperCase()
  if (country < 'AA' || country > 'ZZ') return ''
  return String.fromCodePoint(...[...country].map((c) => 127397 + c.charCodeAt(0)))
}