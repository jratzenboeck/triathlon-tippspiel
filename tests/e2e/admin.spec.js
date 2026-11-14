import { test, expect } from '@playwright/test'
import { loginViaUI, users } from './helpers'

const LONDON_ID = '40000000-0000-0000-0000-000000000001'

test.describe('admin', () => {
  test('is hidden from players who are not super admins', async ({ page }) => {
    await loginViaUI(page, users.bob.email, users.bob.password)
    await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/$/)
  })

  test('lets a super admin correct a result and rescores the bets', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.getByRole('link', { name: 'Admin' }).first().click()
    await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible()

    await page.getByRole('link', { name: /T100 London/ }).click()
    await expect(page.getByRole('heading', { name: 'T100 London' })).toBeVisible()

    // Swap the men's winner and runner-up: Alice's picks (Max 1, Jonas 2) drop from 3+3 to 1+1.
    await page.getByRole('button', { name: 'Men', exact: true }).click()
    await page.getByLabel('Athlete, row 1').selectOption({ label: 'Jonas Weber (DEU)' })
    await page.getByLabel('Athlete, row 2').selectOption({ label: 'Max Keller (DEU)' })
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible()

    await page.goto(`/races/${LONDON_ID}`)
    await expect(page.getByText('5 pts')).toBeVisible()

    // Put the seeded order back so the other specs still see Alice's 9 points.
    await page.goto(`/admin/races/${LONDON_ID}`)
    await page.getByRole('button', { name: 'Men', exact: true }).click()
    await page.getByLabel('Athlete, row 1').selectOption({ label: 'Max Keller (DEU)' })
    await page.getByLabel('Athlete, row 2').selectOption({ label: 'Jonas Weber (DEU)' })
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible()
    await page.goto(`/races/${LONDON_ID}`)
    await expect(page.getByText('9 pts')).toBeVisible()
  })
})
