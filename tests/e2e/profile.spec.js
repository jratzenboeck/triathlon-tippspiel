import { test, expect } from '@playwright/test'
import { loginViaUI, users } from './helpers'

test.describe('profile', () => {
  test('shows display name and email', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto('/profile')

    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
    await expect(page.getByText('Display name')).toBeVisible()
    await expect(page.getByText('Alice').first()).toBeVisible()
    await expect(page.getByText('Email')).toBeVisible()
    await expect(page.getByText('alice@example.com').first()).toBeVisible()
  })

  test('signs out back to the login page', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto('/profile')

    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
