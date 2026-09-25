import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import { loginViaUI, users } from './helpers'

const logo = readFileSync(new URL('../../public/logo.png', import.meta.url))
const appleTouchIcon = readFileSync(new URL('../../public/apple-touch-icon.png', import.meta.url))

function imageFile(buffer, name = 'avatar.png') {
  return { name, mimeType: 'image/png', buffer }
}

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

  test('uploads and persists a profile picture', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto('/profile')

    await page.getByLabel('Profile picture').setInputFiles(imageFile(logo))
    await page.getByRole('button', { name: 'Upload picture' }).click()

    await expect(page.getByRole('status')).toHaveText('Profile picture uploaded.')
    const picture = page.getByRole('img', { name: 'Profile picture of Alice' })
    await expect(picture).toBeVisible()

    await page.reload()
    await expect(picture).toBeVisible()
  })

  test('replaces an existing profile picture', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto('/profile')

    const input = page.getByLabel('Profile picture')
    const picture = page.getByRole('img', { name: 'Profile picture of Alice' })

    await input.setInputFiles(imageFile(logo, 'first-avatar.png'))
    await page.getByRole('button', { name: 'Upload picture' }).click()
    await expect(page.getByRole('status')).toHaveText('Profile picture uploaded.')
    const firstSource = await picture.getAttribute('src')

    await input.setInputFiles(imageFile(appleTouchIcon, 'replacement-avatar.png'))
    await page.getByRole('button', { name: 'Upload picture' }).click()
    await expect(page.getByRole('status')).toHaveText('Profile picture uploaded.')

    await expect.poll(() => picture.getAttribute('src')).not.toBe(firstSource)
    await expect(picture).toBeVisible()
  })

  test('removes a profile picture', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto('/profile')

    await page.getByLabel('Profile picture').setInputFiles(imageFile(logo))
    await page.getByRole('button', { name: 'Upload picture' }).click()
    const picture = page.getByRole('img', { name: 'Profile picture of Alice' })
    await expect(picture).toBeVisible()

    await page.getByRole('button', { name: 'Remove picture' }).click()
    await expect(page.getByRole('status')).toHaveText('Profile picture removed.')
    await expect(picture).toHaveCount(0)

    await page.reload()
    await expect(picture).toHaveCount(0)
  })

  test('rejects unsupported and oversized profile pictures', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto('/profile')

    const input = page.getByLabel('Profile picture')
    const uploadButton = page.getByRole('button', { name: 'Upload picture' })

    await input.setInputFiles({
      name: 'avatar.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image')
    })
    await expect(page.getByRole('alert')).toHaveText('Please choose a JPEG, PNG or WebP image.')
    await expect(uploadButton).toBeDisabled()

    await input.setInputFiles(imageFile(Buffer.alloc(5 * 1024 * 1024 + 1), 'large-avatar.png'))
    await expect(page.getByRole('alert')).toHaveText('Profile picture must not exceed 5 MB.')
    await expect(uploadButton).toBeDisabled()
  })

  test('signs out back to the login page', async ({ page }) => {
    await loginViaUI(page, users.alice.email, users.alice.password)
    await page.goto('/profile')

    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
