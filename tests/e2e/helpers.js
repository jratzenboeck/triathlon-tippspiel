const SUPABASE_URL = 'http://127.0.0.1:54321'
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
export const SUPABASE_SECRET_KEY = 'your-local-supabase-secret-key'

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
