import { test, expect } from '@playwright/test'
import { createUser, loginViaUI, users } from './helpers'

test.describe('my bets', () => {
  test('shows the bet summary and race cards for Alice', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto('/bets')

    await expect(page.getByRole('heading', { name: 'My bets' })).toBeVisible()
    await expect(page.getByText('7 bets')).toBeVisible()
    await expect(page.getByText('9 pts')).toBeVisible()

    for (const race of ['T100 Miami', 'T100 Singapore', 'T100 London']) {
      await expect(page.getByText(race)).toBeVisible()
    }
    await expect(page.getByText('Betting open')).toHaveCount(2)
    await expect(page.getByText('Scored')).toHaveCount(1)
  })

  test('shows the bet summary and race cards for Bob', async ({ page }) => {
    await loginViaUI(page, users.bob.email, users.bob.password)
    await page.goto('/bets')

    await expect(page.getByText('8 bets')).toBeVisible()
    await expect(page.getByText('10 pts')).toBeVisible()

    for (const race of ['T100 Singapore', 'T100 New York', 'T100 London']) {
      await expect(page.getByText(race)).toBeVisible()
    }
    await expect(page.getByText('Betting open')).toHaveCount(1)
    await expect(page.getByText('Scored')).toHaveCount(2)
  })

  test('expands a race card and shows the prediction rows', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto('/bets')

    const londonCard = page.locator('div.bg-white.rounded-lg.shadow-sm.border', {
      hasText: 'T100 London'
    })
    await londonCard.locator('button[aria-expanded="false"]').click()

    await expect(londonCard.locator('tbody tr', { hasText: 'Max Keller' }).first()).toBeVisible()
    await expect(londonCard.getByText('Jonas Weber')).toBeVisible()
    await expect(londonCard.getByText('Anna Schmidt')).toBeVisible()
  })

  test('shows the empty state for a user without bets', async ({ page }) => {
    const email = `no-bets-${Date.now()}@example.com`
    await createUser({ email, password: 'password123', displayName: 'No Bets' })
    await loginViaUI(page, email, 'password123')

    await page.goto('/bets')
    await expect(page.getByText("You haven't placed any bets yet.")).toBeVisible()
    await expect(page.getByRole('link', { name: 'Go to the races' })).toBeVisible()
  })
})
