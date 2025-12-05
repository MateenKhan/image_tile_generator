import { PaperSize } from './types';

export const PAPER_SIZES: PaperSize[] = [
  { name: 'A4', width: 8.27, height: 11.69 },
  { name: 'A4 Borderless', width: 8.27, height: 11.69 },
  { name: 'Letter (US)', width: 8.5, height: 11.0 },
  { name: 'Legal (US)', width: 8.5, height: 14.0 },
  { name: 'A3', width: 11.69, height: 16.53 },
];

export const DEFAULT_PHYSICAL_WIDTH = 15; // inches (from prompt)
export const DEFAULT_PHYSICAL_HEIGHT = 20; // inches (from prompt)
export const DEFAULT_PAPER = PAPER_SIZES[0]; // A4
