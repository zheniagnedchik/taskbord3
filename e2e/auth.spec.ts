import { expect, test, type Page } from '@playwright/test'

const LOCALE_STORAGE_KEY = 'taskbord3-locale'

const PASSWORD = 'E2e-Playwright-99'

const EMAIL_CONFIRM_SKIP =
  'Supabase returned no session after sign-up (email confirmation is likely required). Disable "Confirm email" for the dev project or confirm the inbox, then rerun.'

/** One seeded user created in worker `beforeAll` for tests that only need login */
const SHARED = {
  email: '',
  /** False when signup did not yield an immediate session (e-mail confirmation etc.) */
  ready: false,
}

function uniqueEmail() {
  return `pw.e2e.${crypto.randomUUID().slice(0, 12)}@taskbord3-e2e.example`
}

async function forceEnglish(page: Page) {
  await page.addInitScript(([key]) => {
    localStorage.setItem(key, 'en')
  }, [LOCALE_STORAGE_KEY])
}

/** Returns true only when signup produced a session and we signed out cleanly */
async function registerThenSignOut(page: Page, email: string): Promise<boolean> {
  await forceEnglish(page)
  await page.goto('/sign-up')

  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible()

  await page.fill('#sign-up-email', email)
  await page.fill('#sign-up-password', PASSWORD)
  await page.fill('#sign-up-confirm', PASSWORD)

  await page
    .locator('form')
    .filter({ has: page.locator('#sign-up-email') })
    .getByRole('button', { name: 'Create account' })
    .click()

  const needsEmailConfirm = page.getByText(
    /Check your email to confirm your account|Проверьте почту и подтвердите аккаунт/i,
  )
  const emailChip = page.locator('header').locator(`span[title="${email}"]`)

  await expect(needsEmailConfirm.or(emailChip).first()).toBeVisible({ timeout: 30_000 })
  if (await needsEmailConfirm.isVisible()) {
    return false
  }

  await expect(emailChip).toBeVisible()
  await expect(page.getByRole('dialog')).toBeHidden()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()

  return true
}

async function signInViaDialog(page: Page, email: string, password: string) {
  await forceEnglish(page)
  await page.goto('/sign-in')

  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

  const authDialog = page.getByRole('dialog')
  /** Single sign-in `<form>` in the auth modal (distinct from markup-only wrappers) */
  const signInForm = authDialog.locator('form:has(#sign-in-email)')
  await expect(signInForm).toBeVisible()

  const loginSubmit = signInForm.locator('button[type="submit"]')
  await expect(loginSubmit).toBeVisible({
    message: 'Sign-in dialog must expose a login submit button (type=submit)',
  })
  await expect(loginSubmit).toBeEnabled()
  await expect(loginSubmit).toHaveText(/^Sign in$/)

  await page.fill('#sign-in-email', email)
  await page.fill('#sign-in-password', password)

  await loginSubmit.click()

  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 30_000 })
  await expect(page.locator('header').locator(`span[title="${email}"]`)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
}

/** Run once per worker: shared user for downstream tests */
test.beforeAll(async ({ browser }) => {
  SHARED.email = uniqueEmail()
  SHARED.ready = false

  const page = await browser.newPage()
  try {
    const ok = await registerThenSignOut(page, SHARED.email)
    SHARED.ready = ok
  } finally {
    await page.close()
  }
})

test.describe('after fresh login each test', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!SHARED.ready, 'Shared signup in beforeAll did not finish (instant session required).')
    await signInViaDialog(page, SHARED.email, PASSWORD)
  })

  test('sign-in restores session — Boards sidebar appears', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Boards' })).toBeVisible({ timeout: 15_000 })
    await page.locator('aside').getByRole('button', { name: /Create board/i }).click()
    await expect(page.getByRole('heading', { name: 'New board' })).toBeVisible()
    await page
      .getByRole('dialog')
      .filter({ has: page.locator('#new-board-title') })
      .getByRole('button', { name: 'Cancel' })
      .click()
  })

  test('creates board, column and card', async ({ page }) => {
    const boardTitle = `E2E Orion Sprint ${crypto.randomUUID().slice(0, 6)}`
    const columnTitle = 'Discovery backlog'
    const cardTitle = 'Implement dark-mode preview toggle'
    const cardDescription =
      'Sync the theme picker with prefers-color-scheme and persist the choice locally.'

    await page.locator('aside').getByRole('button', { name: /Create board/i }).click()
    await expect(page.getByRole('heading', { name: 'New board' })).toBeVisible()
    await page.fill('#new-board-title', boardTitle)
    await page
      .getByRole('dialog')
      .filter({ has: page.locator('#new-board-title') })
      .getByRole('button', { name: /^Create$/ })
      .click()

    await expect(page).toHaveURL(/\/board\/[a-f0-9-]+$/i)
    await expect(page.getByRole('heading', { level: 1, name: boardTitle })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: 'Add column' })).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: 'Add column' }).click()
    await expect(page.getByRole('heading', { name: 'New column' })).toBeVisible()
    await page.fill('#column-title', columnTitle)
    await page
      .getByRole('dialog')
      .filter({ has: page.locator('#column-title') })
      .getByRole('button', { name: /^Create$/ })
      .click()

    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Add card', exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Add card', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'New card' })).toBeVisible()
    await page.fill('#card-title', cardTitle)
    await page.fill('#card-description', cardDescription)
    await page
      .getByRole('dialog')
      .filter({ has: page.locator('#card-title') })
      .getByRole('button', { name: /^Create$/ })
      .click()

    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByText(cardTitle, { exact: true })).toBeVisible()
    await expect(page.getByText(cardDescription, { exact: true })).toBeVisible()
  })
})

test('email sign-up for a fresh address, then signs in again', async ({ page }) => {
  const email = uniqueEmail()

  const ok = await registerThenSignOut(page, email)
  test.skip(!ok, EMAIL_CONFIRM_SKIP)

  await signInViaDialog(page, email, PASSWORD)

  await expect(page.getByRole('heading', { name: 'Boards' })).toBeVisible({ timeout: 15_000 })
})
