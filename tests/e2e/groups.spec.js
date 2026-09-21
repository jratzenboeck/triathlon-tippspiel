import { test, expect } from '@playwright/test'
import { loginViaUI, users } from './helpers'

const TEST_GROUP_ID = '20000000-0000-0000-0000-000000000001'

test.describe('groups', () => {
  test('lists my groups', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto('/groups')

    await expect(page.getByRole('heading', { name: 'Groups' })).toBeVisible()
    await expect(page.getByText('Test Group')).toBeVisible()
    await expect(page.getByRole('link', { name: 'New group' })).toBeVisible()
  })

  test('creates a new group and lands on its detail page', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto('/groups/new')

    await page.fill('input[type="text"]', 'Road to Ironman')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/groups\/[0-9a-f-]+$/)
    await expect(page.getByRole('heading', { name: 'Road to Ironman' })).toBeVisible()
    await expect(page.getByText('1 member')).toBeVisible()
  })

  test('shows the group leaderboard and members to the admin', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto(`/groups/${TEST_GROUP_ID}`)

    await expect(page.getByRole('heading', { name: 'Test Group' })).toBeVisible()
    await expect(page.getByText('2 members')).toBeVisible()

    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
    await expect(page.getByText('1.').first()).toBeVisible()
    await expect(page.getByText('10 pts')).toBeVisible()
    await expect(page.getByText('9 pts')).toBeVisible()

    await expect(page.getByRole('heading', { name: 'Members', exact: true })).toBeVisible()
    await expect(page.getByText('Admin', { exact: true })).toHaveCount(1)
  })

  test('hides admin controls from regular members', async ({ page }) => {
    await loginViaUI(page, users.bob.email, users.bob.password)
    await page.goto(`/groups/${TEST_GROUP_ID}`)

    await expect(page.getByText('Only group admins can invite members.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Make admin' })).toHaveCount(0)
  })

  test('lets the admin grant another member admin rights', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto(`/groups/${TEST_GROUP_ID}`)

    await page.getByRole('button', { name: 'Make admin' }).click()
    await expect(page.getByRole('button', { name: 'Make admin' })).toHaveCount(0)
    await expect(page.getByText('Admin', { exact: true })).toHaveCount(2)
  })

  test('shows the invite form to the admin', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto(`/groups/${TEST_GROUP_ID}`)

    await expect(page.getByRole('heading', { name: 'Invite members' })).toBeVisible()
    await expect(page.locator('input[placeholder="Email address"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Invite' })).toBeVisible()
  })
})
