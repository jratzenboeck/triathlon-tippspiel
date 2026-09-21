import { readFileSync } from 'node:fs'

function loadEnv() {
  return readFileSync(new URL('../../.env', import.meta.url), 'utf8')
    .split('\n')
    .reduce((vars, line) => {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (match) vars[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
      return vars
    }, {})
}

const env = loadEnv()

export const SUPABASE_URL = env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321'
export const SUPABASE_PUBLISHABLE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY
export const SUPABASE_SECRET_KEY = env.SUPABASE_SECRET_KEY

if (!SUPABASE_SECRET_KEY) {
  throw new Error(
    'tests/e2e/helpers.js: missing SUPABASE_SECRET_KEY — copy .env.example to .env first'
  )
}

export const users = {
  alice: { email: 'alice@example.com', password: 'password123', displayName: 'Alice' },
  bob: { email: 'bob@example.com', password: 'password123', displayName: 'Bob' }
}

export async function loginViaUI(page, email, password) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/$/)
}

export async function createUser({ email, password, displayName }) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName }
    })
  })
  if (!res.ok) throw new Error(`createUser failed with status ${res.status}`)
  return res.json()
}

export async function getInviteToken() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/invites?select=token`, {
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`
    }
  })
  if (!res.ok) throw new Error(`getInviteToken failed with status ${res.status}`)
  const rows = await res.json()
  return rows[0]?.token
}

const TEST_GROUP_ID = '20000000-0000-0000-0000-000000000001'
const ALICE_USER_ID = '10000000-0000-0000-0000-000000000001'

export async function createLinkInvite() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/invites`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      group_id: TEST_GROUP_ID,
      invited_by: ALICE_USER_ID,
      email: null
    })
  })
  if (!res.ok) throw new Error(`createLinkInvite failed with status ${res.status}`)
  const rows = await res.json()
  return rows[0]?.token
}
