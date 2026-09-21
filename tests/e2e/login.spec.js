import { test, expect } from '@playwright/test'

const EMAIL = 'alice@example.com'
const PASSWORD = 'password123'

test.describe('login page', () => {
  test('shows the sign-in form', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('form input[type="email"]')).toBeVisible()
    await expect(page.locator('form input[type="password"]')).toBeVisible()
    await expect(page.locator('form button[type="submit"]')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Triathlon Tippspiel' })).toBeVisible()
  })

  test('shows an error for wrong credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', EMAIL)
    await page.fill('input[type="password"]', 'wrong-password')
    await page.click('button[type="submit"]')

    await expect(page.locator('p.text-red-600')).toContainText('Invalid login credentials')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirects to the dashboard on successful login', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', EMAIL)
    await page.fill('input[type="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/$/)

    // Seeded data is reachable through the UI.
    await expect(page.getByText('Test Group')).toBeVisible()
    await expect(page.getByText('T100 Singapore')).toBeVisible()
  })

  test('redirects logged-out users from / to /login', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/login/)
  })
})