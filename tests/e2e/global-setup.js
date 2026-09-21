import { execSync } from 'node:child_process'

const SUPABASE_LOCAL_API = 'http://127.0.0.1:54321/auth/v1/health'

export default async function globalSetup() {
  if (process.env.PLAYWRIGHT_NO_RESET) {
    console.log('[e2e] Skipping DB reset (PLAYWRIGHT_NO_RESET is set).')
    return
  }

  try {
    const res = await fetch(SUPABASE_LOCAL_API)
    if (!res.ok) throw new Error(`health check returned ${res.status}`)
  } catch {
    throw new Error(
      'Local Supabase is not running. Start it with `supabase start` before running e2e tests.'
    )
  }

  console.log('[e2e] Resetting local database to the seeded baseline...')
  execSync('supabase db reset', { stdio: 'inherit' })
}
