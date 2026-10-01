import { expect, test, type Page, type TestInfo } from '@playwright/test';

async function completeOnboarding(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Set up now' }).click();
  await expect(page.getByRole('heading', { name: 'Make the workspace yours.' })).toBeVisible();

  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('.form-error')).toContainText('Add your first name, employee ID, and designation');

  await page.getByLabel(/First name/).fill('E2E');
  await page.getByLabel(/Last name/).fill('Tester');
  await page.getByLabel(/Employee ID/).fill('QA-39');
  await page.getByLabel('Designation').fill('Quality analyst');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Set your salary rules.' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Finish your work style.' })).toBeVisible();
  await page.getByRole('button', { name: 'Finish setup' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Welcome, E2E.' })).toBeVisible();
}

test('onboarding rejects incomplete data and persists a completed workspace', async ({ page }) => {
  await completeOnboarding(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome, E2E.' })).toBeVisible();
  await expect(page.getByText('Quality analyst · ID QA-39')).toBeVisible();
});

test('pocket cash, savings goals, and transfers survive a refresh', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/pocket');
  const entryForm = page.locator('.pocket-layout .company-entry-form');
  await entryForm.getByLabel('Amount (PKR)').fill('1500');
  await entryForm.getByLabel('Note').fill('Payday cash');
  await entryForm.getByRole('button', { name: 'Add entry' }).click();
  await expect(entryForm.getByRole('status')).toContainText('Pocket entry saved locally.');

  const goalForm = page.locator('.savings-goal-form');
  await goalForm.getByLabel('Goal name').fill('Emergency fund');
  await goalForm.getByLabel('Target (PKR)').fill('10000');
  await goalForm.getByRole('button', { name: 'Create goal' }).click();
  await expect(goalForm.getByRole('status')).toContainText('Savings goal created locally.');

  const transferForm = page.locator('.transfer-form');
  await transferForm.locator('select').nth(1).selectOption({ index: 1 });
  await transferForm.getByLabel('Amount (PKR)').fill('300');
  await transferForm.getByRole('button', { name: 'Save transfer' }).click();
  await expect(transferForm.getByRole('status')).toContainText('Transfer saved and goal balance updated.');
  await page.reload();
  await expect(page.getByText('Payday cash')).toBeVisible();
  await expect(page.locator('.savings-goal-card').getByText('Emergency fund', { exact: true })).toBeVisible();
  await expect(page.locator('.savings-goal-card .goal-progress-copy')).toContainText('Rs 300 saved');
});

test('backup restore requires preview, acknowledgement, and typed confirmation', async ({ page }, testInfo: TestInfo) => {
  await completeOnboarding(page);
  await page.goto('/settings');
  const exportPanel = page.locator('.backup-card').filter({ hasText: 'EXPORT BACKUP' });
  await exportPanel.getByLabel('Backup passphrase').fill('test-passphrase');
  await exportPanel.getByLabel('Confirm passphrase').fill('test-passphrase');
  const downloadPromise = page.waitForEvent('download');
  await exportPanel.getByRole('button', { name: 'Download encrypted backup' }).click();
  const download = await downloadPromise;
  const backupPath = testInfo.outputPath('phase-39.lstbackup');
  await download.saveAs(backupPath);

  const restorePanel = page.locator('.backup-card').filter({ hasText: 'RESTORE BACKUP' });
  await restorePanel.locator('input[type="file"]').setInputFiles(backupPath);
  await restorePanel.getByLabel('Backup passphrase').fill('test-passphrase');
  await restorePanel.getByRole('button', { name: 'Decrypt and preview' }).click();
  await expect(page.getByText('Backup decrypted and validated. Review it before replacing local records.')).toBeVisible();

  const restoreButton = page.getByRole('button', { name: 'Replace local data with this backup' });
  await expect(restoreButton).toBeDisabled();
  await page.getByLabel(/I understand that restoring/).check();
  await expect(restoreButton).toBeDisabled();
  await page.getByPlaceholder('REPLACE').fill('replace');
  await expect(restoreButton).toBeDisabled();
  await page.getByPlaceholder('REPLACE').fill('REPLACE');
  await expect(restoreButton).toBeEnabled();
  await restoreButton.click();
  await expect(page.locator('.backup-status')).toContainText('Backup restored locally.');
});

test('PIN lock rejects an incorrect PIN and unlocks with the correct PIN', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/settings');
  const securityPanel = page.locator('.security-panel');
  await securityPanel.getByLabel('Choose a PIN').fill('1234');
  await securityPanel.getByLabel('Confirm new PIN').fill('1234');
  await securityPanel.getByRole('button', { name: 'Enable PIN lock' }).click();
  await expect(securityPanel.getByRole('status')).toContainText('PIN lock enabled locally.');

  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your workspace is locked.' })).toBeVisible();
  await page.getByLabel('PIN').fill('0000');
  await page.getByRole('button', { name: 'Unlock workspace' }).click();
  await expect(page.getByRole('status')).toContainText('That PIN did not unlock this workspace.');
  await page.getByLabel('PIN').fill('1234');
  await page.getByRole('button', { name: 'Unlock workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Rules you control.' })).toBeVisible();
});
