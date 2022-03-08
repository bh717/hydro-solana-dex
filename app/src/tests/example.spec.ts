import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Hydraswap/);

  // Expect an content "to contain" to the value.
  await expect(page.locator('.container .MuiButtonBase-root').first()).toHaveText('Connect Wallet');

  // ... and continue the test to check more things
  await page.locator('.container .MuiButtonBase-root').first().click();
  await expect(page.locator('.MuiModal-root')).toBeVisible();
});