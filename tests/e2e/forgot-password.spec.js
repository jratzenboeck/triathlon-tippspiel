import { test, expect } from '@playwright/test'
import { users } from './helpers'

test.describe('forgot password', () => {
  test('asks for an email and confirms the reset link was requested', async ({ page }) => {
    await page.goto('/forgot-password')

    await expect(page.getByRole('heading', { name: 'Forgot password?' })).toBeVisible()
    await page.fill('input[type="email"]', users.alice.email)
    await page.click('button[type="submit"]')

    await expect(
      page.getByText(
        'If an account exists for that email address, a password reset link has been sent.'
      )
    ).toBeVisible()
  })
})
