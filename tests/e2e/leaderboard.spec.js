import { test, expect } from '@playwright/test'
import { loginViaUI, users } from './helpers'

test.describe('global leaderboard', () => {
  test('ranks users by total points and highlights the current user', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto('/leaderboard')

    await expect(page.getByRole('heading', { name: 'Global leaderboard' })).toBeVisible()

    const rows = page.locator(
      'div.bg-white.rounded-lg.shadow-sm.border > div.flex.items-center.justify-between.px-4.py-3.border-b'
    )

    await expect(rows.nth(0)).toContainText('Bob')
    await expect(rows.nth(0)).toContainText('10 pts')
    await expect(rows.nth(0)).toContainText('8 bets')

    await expect(rows.nth(1)).toContainText('Alice')
    await expect(rows.nth(1)).toContainText('9 pts')
    await expect(rows.nth(1)).toContainText('7 bets')
    await expect(rows.nth(1)).toHaveClass(/bg-indigo-50/)
  })
})
