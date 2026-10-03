import { PaperSize } from '../types';

export const PRINT_MARGIN_IN = 0.25;
export const MAX_OUTPUT_PPI = 300;

const EPSILON = 1e-6;

export interface TileLayout {
  cols: number;
  rows: number;
  pageWidth: number;
  pageHeight: number;
  stepX: number;
  stepY: number;
  margin: number;
}

export const isBorderless = (paper: PaperSize) => paper.name.includes('Borderless');

const pagesAlong = (total: number, page: number, step: number) => {
  if (!(total > 0) || !(step > 0)) return 1;
  if (total <= page + EPSILON) return 1;
  return Math.ceil((total - page) / step - EPSILON) + 1;
};

export const tileLayout = (
  printWidth: number,
  printHeight: number,
  paper: PaperSize,
  overlap: number,
): TileLayout => {
  const margin = isBorderless(paper) ? 0 : PRINT_MARGIN_IN;
  const pageWidth = paper.width - 2 * margin;
  const pageHeight = paper.height - 2 * margin;
  const stepX = pageWidth - overlap;
  const stepY = pageHeight - overlap;
  return {
    cols: pagesAlong(printWidth, pageWidth, stepX),
    rows: pagesAlong(printHeight, pageHeight, stepY),
    pageWidth,
    pageHeight,
    stepX,
    stepY,
    margin,
  };
};

export const formatInches = (value: number) => `${Number(value.toFixed(2))}"`;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export const formatRatio = (width: number, height: number) => {
  const d = gcd(width, height);
  const w = width / d;
  const h = height / d;
  if (w <= 50 && h <= 50) return `${w}:${h}`;
  return width >= height ? `${(width / height).toFixed(2)}:1` : `1:${(height / width).toFixed(2)}`;
};

export const roundSize = (value: number) => Math.round(value * 100) / 100;
