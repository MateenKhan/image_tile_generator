import { expect, type Page } from '@playwright/test';

export const SQUARE = { x: 100, y: 100, size: 400 };

export interface TileScan {
  id: string;
  width: number;
  height: number;
  red: { x0: number; y0: number; x1: number; y1: number } | null;
  contentRight: number;
  contentBottom: number;
}

export async function openApp(page: Page) {
  await page.addInitScript(() => {
    const original = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
      if ((child as unknown as Element).tagName === 'IFRAME') return child;
      return original.call(this, child) as T;
    };
  });
  await page.goto('/');
}

export async function uploadImage(page: Page, width: number, height: number) {
  const dataUrl = await page.evaluate(
    ({ width, height, square }) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'rgb(0,0,255)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgb(255,0,0)';
      ctx.fillRect(square.x, square.y, square.size, square.size);
      return canvas.toDataURL('image/png');
    },
    { width, height, square: SQUARE },
  );
  const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
  await page.locator('input[type=file]').setInputFiles({
    name: `source-${width}x${height}.png`,
    mimeType: 'image/png',
    buffer,
  });
}

export async function setNumber(page: Page, testId: string, value: number) {
  const field = page.getByTestId(testId);
  await expect(field, `missing control ${testId}`).toBeVisible();
  await field.fill(String(value));
}

export async function choosePaper(page: Page, name: string) {
  await page.getByTestId('paper-size').selectOption(name);
}

export async function generate(page: Page) {
  await page.getByTestId('generate-tiles').click();
  await expect(page.locator('img[alt^="tile_"]').first()).toBeVisible({ timeout: 30_000 });
}

export async function tileIds(page: Page): Promise<string[]> {
  return page.locator('img[alt^="tile_"]').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('alt')!));
}

export function gridOf(ids: string[]) {
  const cols = new Set(ids.map((id) => id.split('_')[1])).size;
  const rows = new Set(ids.map((id) => id.split('_')[2])).size;
  return { cols, rows };
}

export async function scanTile(page: Page, id: string): Promise<TileScan> {
  return page.evaluate(async (id) => {
    const img = document.querySelector(`img[alt="${id}"]`) as HTMLImageElement;
    const blob = await (await fetch(img.src)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    let rx0 = Infinity, ry0 = Infinity, rx1 = -1, ry1 = -1, right = 0, bottom = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const isRed = r > 150 && g < 100 && b < 100;
        const isBlue = b > 150 && r < 100 && g < 100;
        if (isRed) {
          if (x < rx0) rx0 = x;
          if (y < ry0) ry0 = y;
          if (x + 1 > rx1) rx1 = x + 1;
          if (y + 1 > ry1) ry1 = y + 1;
        }
        if (isRed || isBlue) {
          if (x + 1 > right) right = x + 1;
          if (y + 1 > bottom) bottom = y + 1;
        }
      }
    }
    return {
      id,
      width,
      height,
      red: rx1 < 0 ? null : { x0: rx0, y0: ry0, x1: rx1, y1: ry1 },
      contentRight: right,
      contentBottom: bottom,
    };
  }, id);
}

export async function printedTileInches(page: Page, id: string) {
  await page.getByTestId(`tile-preview-${id}`).click();
  await page.getByTestId('print-tile').click();
  await page.emulateMedia({ media: 'print' });
  const size = await page.waitForFunction(() => {
    const frames = Array.from(document.querySelectorAll('iframe'));
    const frame = frames[frames.length - 1];
    const img = frame?.contentDocument?.querySelector('.print-content') as HTMLImageElement | null;
    if (!img || !img.complete || img.naturalWidth === 0) return null;
    const rect = img.getBoundingClientRect();
    return { width: rect.width / 96, height: rect.height / 96 };
  }, null, { timeout: 10_000 });
  const inches = (await size.jsonValue()) as { width: number; height: number };
  await page.emulateMedia({ media: 'screen' });
  await page.getByTestId('close-print-preview').click();
  return inches;
}

export interface PrintMeasure {
  cols: number;
  rows: number;
  tileWidthPx: number;
  tileHeightPx: number;
  printedWidthIn: number;
  printedHeightIn: number;
  squareWidthIn: number;
  squareHeightIn: number;
}

export async function measurePrint(page: Page, overlap: number): Promise<PrintMeasure> {
  const ids = await tileIds(page);
  const { cols, rows } = gridOf(ids);
  const first = await scanTile(page, 'tile_0_0');
  const lastCol = await scanTile(page, `tile_${cols - 1}_0`);
  const lastRow = await scanTile(page, `tile_0_${rows - 1}`);
  const page0 = await printedTileInches(page, 'tile_0_0');
  const inPerPxX = page0.width / first.width;
  const inPerPxY = page0.height / first.height;
  const printedWidthIn = (cols - 1) * (page0.width - overlap) + lastCol.contentRight * inPerPxX;
  const printedHeightIn = (rows - 1) * (page0.height - overlap) + lastRow.contentBottom * inPerPxY;
  expect(first.red, 'the red square must be on the first page').not.toBeNull();
  const red = first.red!;
  const measure = {
    cols,
    rows,
    tileWidthPx: first.width,
    tileHeightPx: first.height,
    printedWidthIn: Number(printedWidthIn.toFixed(3)),
    printedHeightIn: Number(printedHeightIn.toFixed(3)),
    squareWidthIn: Number(((red.x1 - red.x0) * inPerPxX).toFixed(3)),
    squareHeightIn: Number(((red.y1 - red.y0) * inPerPxY).toFixed(3)),
  };
  console.log(`measured ${JSON.stringify(measure)}`);
  return measure;
}
