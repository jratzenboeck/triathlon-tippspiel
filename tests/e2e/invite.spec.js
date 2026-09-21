import { test, expect } from '@playwright/test'
import { createUser, createLinkInvite, getInviteToken, loginViaUI, users } from './helpers'

const INVALID_TOKEN = 'not-a-real-token'

test.describe('invite page', () => {
  test('shows the pending invite to a logged-out visitor', async ({ page }) => {
    const token = await getInviteToken()
    await page.goto(`/invite/${token}`)

    await expect(page.getByText(/You've been invited to join/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('shows the joined state to an existing member', async ({ page }) => {
    const token = await getInviteToken()
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto(`/invite/${token}`)

    await expect(page.getByText('You joined Test Group!')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Go to group' })).toBeVisible()
  })

  test('rejects an invalid token with an error', async ({ page }) => {
    await page.goto(`/invite/${INVALID_TOKEN}`)

    await expect(page.getByText('Invalid or expired invite')).toBeVisible()
  })

  test('returns a signed-up visitor to the invite so they can join', async ({ page }) => {
    const token = await getInviteToken()
    await page.goto(`/invite/${token}`)
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible()

    const email = `invitee-${Date.now()}@example.com`
    await createUser({ email, password: 'password123', displayName: 'Newbie' })
    await page.goto('/login')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL(`/invite/${token}`)
    await expect(page.getByRole('button', { name: 'Join group' })).toBeVisible()
  })

  test('shows a link invite (no email) to a logged-out visitor', async ({ page }) => {
    const token = await createLinkInvite()
    await page.goto(`/invite/${token}`)

    await expect(page.getByText(/You've been invited to join/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('shows the joined state to an existing member on a link invite', async ({ page }) => {
    const token = await createLinkInvite()
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto(`/invite/${token}`)

    await expect(page.getByText('You joined Test Group!')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Go to group' })).toBeVisible()
  })
})
