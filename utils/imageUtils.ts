import { SplitResult, PaperSize } from '../types';
import { MAX_OUTPUT_PPI, isBorderless, tileLayout } from './tileLayout';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data:image/jpeg;base64, prefix for API calls if needed usually
        // but for display we keep it. For Gemini we split it later.
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};

export const splitImage = async (
  imageSrc: string,
  printWidthInches: number,
  printHeightInches: number,
  paperSize: PaperSize,
  overlapInches: number = 0.25
): Promise<SplitResult[]> => {
  const img = await loadImage(imageSrc);
  const sourceWidth = img.naturalWidth;
  const sourceHeight = img.naturalHeight;
  const ppiX = sourceWidth / printWidthInches;
  const ppiY = sourceHeight / printHeightInches;
  const outputPPI = Math.min(MAX_OUTPUT_PPI, Math.max(ppiX, ppiY));
  const layout = tileLayout(printWidthInches, printHeightInches, paperSize, overlapInches);
  const borderless = isBorderless(paperSize);
  const canvasWidth = Math.round(layout.pageWidth * outputPPI);
  const canvasHeight = Math.round(layout.pageHeight * outputPPI);
  const results: SplitResult[] = [];

  for (let y = 0; y < layout.rows; y++) {
    for (let x = 0; x < layout.cols; x++) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const srcX = x * layout.stepX * ppiX;
      const srcY = y * layout.stepY * ppiY;
      const srcW = Math.min(layout.pageWidth * ppiX, sourceWidth - srcX);
      const srcH = Math.min(layout.pageHeight * ppiY, sourceHeight - srcY);
      if (srcW > 0 && srcH > 0) {
        ctx.drawImage(
          img,
          srcX, srcY, srcW, srcH,
          0, 0, (srcW / ppiX) * outputPPI, (srcH / ppiY) * outputPPI
        );
      }

      if (!borderless) {
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 20); ctx.lineTo(0,0); ctx.lineTo(20,0);
        ctx.moveTo(canvas.width, canvas.height - 20); ctx.lineTo(canvas.width, canvas.height); ctx.lineTo(canvas.width - 20, canvas.height);
        ctx.stroke();
      }

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));

      if (blob) {
        results.push({
          id: `tile_${x}_${y}`,
          blob,
          url: URL.createObjectURL(blob),
          colIndex: x,
          rowIndex: y,
          width: canvas.width,
          height: canvas.height
        });
      }
    }
  }

  return results;
};
