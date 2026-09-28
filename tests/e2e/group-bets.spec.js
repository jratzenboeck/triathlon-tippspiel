import { test, expect } from '@playwright/test'
import {
  SUPABASE_SECRET_KEY,
  SUPABASE_URL,
  createUser,
  deleteUser,
  loginViaUI,
  users
} from './helpers'

const TEST_GROUP_ID = '20000000-0000-0000-0000-000000000001'

const raceCard = (page, name) =>
  page.locator('div.bg-white.rounded-lg.shadow-sm.border', { hasText: name })

const memberRows = (card) => card.locator('button[aria-label^="Show bets of"]')

const createdUserIds = []
const createdGroupIds = []

test.afterEach(async () => {
  for (const id of createdGroupIds.splice(0)) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/groups?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${SUPABASE_SECRET_KEY}`
      }
    })
    if (!res.ok) throw new Error(`deleteGroup failed with status ${res.status}`)
  }
  while (createdUserIds.length) {
    await deleteUser(createdUserIds.pop())
  }
})

async function createTestUser(displayName) {
  const email = `${displayName.toLowerCase()}-${Date.now()}@example.com`
  const user = await createUser({ email, password: 'password123', displayName })
  createdUserIds.push(user.id)
  return { ...user, email }
}

async function addGroupMember(userId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/group_members`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ group_id: TEST_GROUP_ID, user_id: userId, is_admin: false })
  })
  if (!res.ok) throw new Error(`addGroupMember failed with status ${res.status}`)
}

test.describe('group bets', () => {
  test('lists the races of the group and who bet, collapsed by default', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto(`/groups/${TEST_GROUP_ID}/bets`)

    await expect(page.getByRole('heading', { name: 'Test Group' })).toBeVisible()
    await expect(page.getByText('Group bets')).toBeVisible()
    await expect(page.getByRole('link', { name: '← Back to group' })).toBeVisible()

    const miami = raceCard(page, 'T100 Miami')
    await expect(miami.getByRole('link', { name: 'T100 Miami' })).toBeVisible()
    await expect(miami.getByText('Betting open')).toBeVisible()
    await expect(miami.getByText('Who bet')).toBeVisible()
    await expect(miami.getByText('Alice')).toBeVisible()
    await expect(miami.getByText('1 bet')).toBeVisible()

    const london = raceCard(page, 'T100 London')
    await expect(london.getByText('Scored')).toBeVisible()
    await expect(london.getByText('Ranking for this race')).toBeVisible()
    await expect(london.getByText('1 exact')).toBeVisible()
    await expect(london.getByText('3 pts')).toBeVisible()

    // Nobody is expanded, so no bet rows are rendered
    await expect(page.getByRole('columnheader', { name: 'Pred' })).toHaveCount(0)
  })

  test('ranks the members per race once the results are in', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto(`/groups/${TEST_GROUP_ID}/bets`)

    await page.getByRole('button', { name: 'Men', exact: true }).click()

    await expect(raceCard(page, 'T100 Singapore')).toBeVisible()
    await expect(raceCard(page, 'T100 New York')).toBeVisible()
    await expect(raceCard(page, 'T100 London')).toBeVisible()

    // Both scored 6 pts on London, Alice wins the tie on exact picks
    const london = memberRows(raceCard(page, 'T100 London'))
    await expect(london).toHaveCount(2)
    await expect(london.nth(0)).toContainText('Alice')
    await expect(london.nth(0)).toContainText('2 exact')
    await expect(london.nth(0)).toContainText('6 pts')
    await expect(london.nth(1)).toContainText('Bob')
    await expect(london.nth(1)).toContainText('1 exact')
    await expect(london.nth(1)).toContainText('6 pts')

    // New York was only bet on by Bob, who got one place exactly right
    const newYork = memberRows(raceCard(page, 'T100 New York'))
    await expect(newYork).toHaveCount(1)
    await expect(newYork.nth(0)).toContainText('Bob')
    await expect(newYork.nth(0)).toContainText('1 exact')
    await expect(newYork.nth(0)).toContainText('4 pts')
  })

  test('expands a member and shows their bets against the result', async ({ page }) => {
    await loginViaUI(page, users.bob.email, users.bob.password)
    await page.goto(`/groups/${TEST_GROUP_ID}/bets`)

    await page.getByRole('button', { name: 'Men', exact: true }).click()

    const london = raceCard(page, 'T100 London')
    await london.getByRole('button', { name: 'Show bets of Bob' }).click()

    const rows = london.locator('table').last().locator('tbody tr')
    await expect(rows).toHaveCount(5)
    await expect(rows.nth(0)).toContainText('Jonas Weber')
    await expect(rows.nth(0).locator('td').nth(3)).toHaveText('1')
    await expect(rows.nth(2)).toContainText('Max Keller')
    await expect(rows.nth(3)).toContainText('Noah Van Dijk')
    await expect(rows.nth(3).locator('td').nth(3)).toHaveText('3')
    await expect(rows.nth(4)).toContainText('Diek Meyer')
    await expect(rows.nth(4).locator('td').nth(3)).toHaveText('0')

    // Only the 4th place was predicted exactly right, so it is the only green row
    await expect(rows.nth(3)).toHaveClass(/bg-green-50/)
    await expect(rows.nth(0)).not.toHaveClass(/bg-green-50/)
  })

  test('colours the bets by the points they scored', async ({ page }) => {
    await loginViaUI(page, users.bob.email, users.bob.password)
    await page.goto(`/groups/${TEST_GROUP_ID}/bets`)

    await page.getByRole('button', { name: 'Men', exact: true }).click()
    await expect(page.getByText('Exactly right — 3 pts')).toBeVisible()
    await expect(page.getByText('In the top 5, but a different place — 1 pt')).toBeVisible()

    const london = raceCard(page, 'T100 London')
    await london.getByRole('button', { name: 'Show bets of Bob' }).click()

    const rows = london.locator('table').last().locator('tbody tr')
    // Jonas 1st -> 2nd, Max 3rd -> 1st, Liam 2nd -> 3rd: 1 pt each, orange
    await expect(rows.nth(0)).toHaveClass(/bg-orange-50/)
    await expect(rows.nth(1)).toHaveClass(/bg-orange-50/)
    await expect(rows.nth(2)).toHaveClass(/bg-orange-50/)
    // Noah 4th -> 4th: exactly right, green
    await expect(rows.nth(3)).toHaveClass(/bg-green-50/)
    // Diek 5th -> 6th, outside the top 5: no points, no colour
    await expect(rows.nth(4)).not.toHaveClass(/bg-orange-50|bg-green-50/)
  })

  test('does not colour the bets of a race without results', async ({ page }) => {
    await loginViaUI(page, users.bob.email, users.bob.password)
    await page.goto(`/groups/${TEST_GROUP_ID}/bets`)

    await page.getByRole('button', { name: 'Men', exact: true }).click()

    const singapore = raceCard(page, 'T100 Singapore')
    await expect(singapore.getByText('Betting open')).toBeVisible()
    await singapore.getByRole('button', { name: 'Show bets of Bob' }).click()

    const rows = singapore.locator('table').last().locator('tbody tr')
    await expect(rows).toHaveCount(2)
    for (let i = 0; i < 2; i++) {
      await expect(rows.nth(i)).not.toHaveClass(/bg-orange-50|bg-green-50/)
    }
  })

  test('shows the results of a finished race and can collapse them', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto(`/groups/${TEST_GROUP_ID}/bets`)

    await page.getByRole('button', { name: 'Men', exact: true }).click()

    const london = raceCard(page, 'T100 London')
    await expect(london.getByRole('button', { name: 'Hide results' })).toBeVisible()
    await expect(london.getByText('3:12:44')).toBeVisible()
    await expect(london.getByText('Max Keller')).toBeVisible()

    await london.getByRole('button', { name: 'Hide results' }).click()
    await expect(london.getByText('3:12:44')).toHaveCount(0)
  })

  test('does not list members who did not bet', async ({ page }) => {
    const cara = await createTestUser('Cara')
    await addGroupMember(cara.id)
    await loginViaUI(page, cara.email, 'password123')

    await page.goto(`/groups/${TEST_GROUP_ID}/bets`)

    await page.getByRole('button', { name: 'Men', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Show bets of Cara' })).toHaveCount(0)
    await expect(raceCard(page, 'T100 London')).toBeVisible()
  })

  test('shows the empty state when no member has bet', async ({ page }) => {
    const solo = await createTestUser('Solo')
    await loginViaUI(page, solo.email, 'password123')

    await page.goto('/groups/new')
    await page.fill('input[type="text"]', 'Lonely Group')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/groups\/([0-9a-f-]+)$/)
    createdGroupIds.push(page.url().split('/').pop())

    await page.goto(`${page.url()}/bets`)
    await expect(page.getByText("None of the group's members has placed a bet yet.")).toBeVisible()
  })

  test('hides the page from users who are not in the group', async ({ page }) => {
    const outsider = await createTestUser('Outsider')
    await loginViaUI(page, outsider.email, 'password123')

    await page.goto(`/groups/${TEST_GROUP_ID}/bets`)
    await expect(page.getByText('Group not found.')).toBeVisible()
  })
})
