import { test, expect } from '@playwright/test'
import { createUser, loginViaUI, users } from './helpers'

const LONDON_ID = '40000000-0000-0000-0000-000000000001'
const SINGAPORE_ID = '40000000-0000-0000-0000-000000000003'

test.describe('race detail', () => {
  test('locked race shows results and my bets, no betting form', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto(`/races/${LONDON_ID}`)

    await expect(page.getByRole('heading', { name: 'T100 London' })).toBeVisible()
    await expect(page.getByText('Betting is closed')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Place bet' })).toHaveCount(0)

    // Results, default Women tab.
    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible()
    await expect(page.getByText('Anna Schmidt').first()).toBeVisible()
    await page.getByRole('button', { name: 'Men', exact: true }).first().click()
    await expect(page.getByText('Max Keller').first()).toBeVisible()
    await expect(page.getByText('3:12:44')).toBeVisible()

    // Your bets.
    await expect(page.getByRole('heading', { name: 'Your bets' })).toBeVisible()
    await expect(page.getByText('9 pts')).toBeVisible()
  })

  test('open race shows start list and lets me place a bet', async ({ page }) => {
    const email = `racer-${Date.now()}@example.com`
    await createUser({ email, password: 'password123', displayName: 'Racer' })
    await loginViaUI(page, email, 'password123')
    await page.goto(`/races/${SINGAPORE_ID}`)

    await expect(page.getByRole('heading', { name: 'T100 Singapore' })).toBeVisible()
    await expect(page.getByText('Betting open until')).toBeVisible()
    await expect(
      page.getByText('Only athletes on the official start list can be picked.')
    ).toBeVisible()

    // Start list, men tab shows bibs.
    await page.getByRole('button', { name: 'Men', exact: true }).first().click()
    await expect(page.getByText('Max Keller').first()).toBeVisible()
    await expect(page.getByText('Noah Van Dijk').first()).toBeVisible()

    // Search and pick an athlete for the women's division.
    await page.getByRole('button', { name: 'Women', exact: true }).first().click()
    await page.fill('input[placeholder="Search athlete..."]', 'Anna')
    await page.getByRole('button', { name: /Anna Schmidt/ }).click()
    await page.getByRole('button', { name: 'Place bet' }).click()

    await expect(page.getByText('Bet saved')).toBeVisible()
  })

  test('shows an invalid race as not found', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto('/races/40000000-0000-0000-0000-0000000000ff')

    await expect(page.getByText('Race not found.')).toBeVisible()
  })
})
