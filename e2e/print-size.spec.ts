import { expect, test } from '@playwright/test';
import { choosePaper, generate, measurePrint, openApp, setNumber, uploadImage } from './helpers';

const CASES = [
  { paper: 'A4', width: 15, height: 10, cols: 2, rows: 1, tilePx: [1554, 2238], squareIn: 2 },
  { paper: 'A4 Borderless', width: 15, height: 10, cols: 2, rows: 1, tilePx: [1654, 2338], squareIn: 2 },
  { paper: 'Letter (US)', width: 30, height: 20, cols: 4, rows: 2, tilePx: [800, 1050], squareIn: 4 },
];

for (const c of CASES) {
  test(`a ${c.width} x ${c.height} in print on ${c.paper} prints at exactly that size`, async ({ page }) => {
    await openApp(page);
    await uploadImage(page, 3000, 2000);
    await setNumber(page, 'print-width', c.width);
    await setNumber(page, 'print-height', c.height);
    await choosePaper(page, c.paper);
    await generate(page);
    const m = await measurePrint(page, 0.25);
    expect({ cols: m.cols, rows: m.rows }).toEqual({ cols: c.cols, rows: c.rows });
    expect([m.tileWidthPx, m.tileHeightPx]).toEqual(c.tilePx);
    expect(Math.abs(m.printedWidthIn - c.width), `printed width ${m.printedWidthIn}`).toBeLessThan(0.03);
    expect(Math.abs(m.printedHeightIn - c.height), `printed height ${m.printedHeightIn}`).toBeLessThan(0.03);
    expect(Math.abs(m.squareWidthIn - c.squareIn), `square width ${m.squareWidthIn}`).toBeLessThan(0.03);
    expect(Math.abs(m.squareHeightIn - c.squareIn), `square height ${m.squareHeightIn}`).toBeLessThan(0.03);
  });
}
