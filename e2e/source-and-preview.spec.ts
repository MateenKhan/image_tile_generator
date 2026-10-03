import { expect, test } from '@playwright/test';
import { choosePaper, generate, gridOf, openApp, setNumber, tileIds, uploadImage } from './helpers';

for (const source of [
  { w: 3000, h: 2000, ratio: '3:2' },
  { w: 2000, h: 3000, ratio: '2:3' },
]) {
  test(`the source size of a ${source.w} x ${source.h} px image is shown once uploaded`, async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId('source-size')).toHaveCount(0);
    await uploadImage(page, source.w, source.h);
    const readout = page.getByTestId('source-size');
    await expect(readout).toContainText(`${source.w} × ${source.h} px`);
    await expect(readout).toContainText(source.ratio);
  });
}

test('the preview draws the print width along the top and the height down the side', async ({ page }) => {
  await openApp(page);
  await uploadImage(page, 3000, 2000);
  await setNumber(page, 'print-width', 15);
  await choosePaper(page, 'A4');
  const widthDim = page.getByTestId('preview-width-dim');
  const heightDim = page.getByTestId('preview-height-dim');
  await expect(widthDim).toHaveText('15"');
  await expect(heightDim).toHaveText('10"');
  const box = (await page.getByTestId('preview-box').boundingBox())!;
  const top = (await widthDim.boundingBox())!;
  const side = (await heightDim.boundingBox())!;
  expect(top.y + top.height).toBeLessThanOrEqual(box.y + 1);
  expect(Math.abs(top.x - box.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(top.x + top.width - (box.x + box.width))).toBeLessThanOrEqual(2);
  expect(side.x + side.width).toBeLessThanOrEqual(box.x + 1);
  expect(Math.abs(side.y - box.y)).toBeLessThanOrEqual(2);
  expect(Math.abs(side.y + side.height - (box.y + box.height))).toBeLessThanOrEqual(2);
  const viewport = page.viewportSize()!;
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(Math.abs(box.width / box.height - 1.5)).toBeLessThan(0.02);
});

test('the preview follows the size and its page count matches the tiles generated', async ({ page }) => {
  await openApp(page);
  await uploadImage(page, 3000, 2000);
  await setNumber(page, 'print-width', 30);
  await choosePaper(page, 'A4');
  await expect(page.getByTestId('preview-width-dim')).toHaveText('30"');
  await expect(page.getByTestId('preview-height-dim')).toHaveText('20"');
  await expect(page.getByTestId('preview-pages')).toContainText(/8 pages/i);
  await expect(page.getByTestId('preview-cut-v')).toHaveCount(3);
  await expect(page.getByTestId('preview-cut-h')).toHaveCount(1);
  await generate(page);
  const { cols, rows } = gridOf(await tileIds(page));
  expect({ cols, rows }).toEqual({ cols: 4, rows: 2 });
});
