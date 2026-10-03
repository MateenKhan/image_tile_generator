import { expect, test } from '@playwright/test';
import { choosePaper, generate, measurePrint, openApp, setNumber, uploadImage } from './helpers';

test('keep proportions is on by default: width fills height and height fills width', async ({ page }) => {
  await openApp(page);
  await uploadImage(page, 3000, 2000);
  await expect(page.getByTestId('keep-proportions')).toHaveAttribute('aria-pressed', 'true');
  await setNumber(page, 'print-width', 12);
  await expect(page.getByTestId('print-height')).toHaveValue('8');
  await setNumber(page, 'print-height', 5);
  await expect(page.getByTestId('print-width')).toHaveValue('7.5');
  await expect(page.getByTestId('stretch-note')).toHaveCount(0);
});

test('uploading fills the height from the image proportions, portrait too', async ({ page }) => {
  await openApp(page);
  await uploadImage(page, 2000, 3000);
  await setNumber(page, 'print-width', 10);
  await expect(page.getByTestId('print-height')).toHaveValue('15');
});

for (const source of [
  { w: 3000, h: 2000, width: 11, height: 7.33 },
  { w: 2000, h: 3000, width: 9, height: 13.5 },
]) {
  test(`a locked ${source.w} x ${source.h} px image prints undistorted at ${source.width} in wide`, async ({ page }) => {
    await openApp(page);
    await uploadImage(page, source.w, source.h);
    await setNumber(page, 'print-width', source.width);
    await expect(page.getByTestId('print-height')).toHaveValue(String(source.height));
    await choosePaper(page, 'A4');
    await generate(page);
    const m = await measurePrint(page, 0.25);
    const squareIn = (400 * source.width) / source.w;
    expect(Math.abs(m.squareWidthIn - m.squareHeightIn), 'square stays square').toBeLessThan(0.015);
    expect(Math.abs(m.squareWidthIn - squareIn)).toBeLessThan(0.03);
    expect(Math.abs(m.printedWidthIn - source.width)).toBeLessThan(0.03);
    expect(Math.abs(m.printedHeightIn - source.height)).toBeLessThan(0.03);
  });
}

test('unlocked, a mismatched size stretches the print and says so', async ({ page }) => {
  await openApp(page);
  await uploadImage(page, 3000, 2000);
  await expect(page.getByTestId('keep-proportions'), 'missing control keep-proportions').toBeVisible();
  await page.getByTestId('keep-proportions').click();
  await expect(page.getByTestId('keep-proportions')).toHaveAttribute('aria-pressed', 'false');
  await setNumber(page, 'print-width', 15);
  await setNumber(page, 'print-height', 10);
  await expect(page.getByTestId('stretch-note')).toHaveCount(0);
  await setNumber(page, 'print-height', 20);
  await expect(page.getByTestId('print-width')).toHaveValue('15');
  await expect(page.getByTestId('stretch-note')).toBeVisible();
  await expect(page.getByTestId('stretch-note')).toContainText(/stretch/i);
  await choosePaper(page, 'A4');
  await generate(page);
  const m = await measurePrint(page, 0.25);
  expect(Math.abs(m.printedWidthIn - 15)).toBeLessThan(0.03);
  expect(Math.abs(m.printedHeightIn - 20)).toBeLessThan(0.03);
  expect(Math.abs(m.squareWidthIn - 2)).toBeLessThan(0.03);
  expect(Math.abs(m.squareHeightIn - 4)).toBeLessThan(0.03);
});

test('locking again restores the proportions and clears the stretch note', async ({ page }) => {
  await openApp(page);
  await uploadImage(page, 3000, 2000);
  await expect(page.getByTestId('keep-proportions'), 'missing control keep-proportions').toBeVisible();
  await page.getByTestId('keep-proportions').click();
  await setNumber(page, 'print-width', 15);
  await setNumber(page, 'print-height', 20);
  await expect(page.getByTestId('stretch-note')).toBeVisible();
  await page.getByTestId('keep-proportions').click();
  await expect(page.getByTestId('print-height')).toHaveValue('10');
  await expect(page.getByTestId('stretch-note')).toHaveCount(0);
});
