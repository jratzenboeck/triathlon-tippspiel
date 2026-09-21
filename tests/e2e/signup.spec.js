import { test, expect } from '@playwright/test'

test.describe('signup', () => {
  test('shows a confirmation message after signing up', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible()
    await page.fill('input[type="text"]', 'New Person')
    await page.fill('input[type="email"]', `new-${Date.now()}@example.com`)
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page.getByText('Check your email for the verification link.')).toBeVisible()
  })
})
