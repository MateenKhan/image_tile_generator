import { SplitResult, PaperSize } from '../types';

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
  targetWidthInches: number,
  targetHeightInches: number,
  paperSize: PaperSize,
  overlapInches: number = 0.25
): Promise<SplitResult[]> => {
  const img = await loadImage(imageSrc);
  
  // 1. Calculate PPI (Pixels Per Inch) needed to match the target physical size
  //    PPI = Image Pixels / Target Physical Inches
  //    We use the larger dimension to ensure quality or just average.
  //    Actually, we just map the physical grid to the pixel grid.
  
  const widthPPI = img.naturalWidth / targetWidthInches;
  const heightPPI = img.naturalHeight / targetHeightInches;
  
  // Use the higher PPI to maintain quality, or treat X/Y independently if aspect ratio changes (stretching)
  // Assuming we want to Preserve Aspect Ratio of the *original image* usually, 
  // but here the user explicitly defines physical dimensions which might warp it.
  // We will assume "Fill" logic or simple stretching. Let's do simple stretching to match dimensions provided.
  
  const pixelsPerPaperWidth = paperSize.width * widthPPI;
  const pixelsPerPaperHeight = paperSize.height * heightPPI;
  const pixelsOverlapX = overlapInches * widthPPI;
  const pixelsOverlapY = overlapInches * heightPPI;

  // Check if this is a borderless print
  const isBorderless = paperSize.name.includes('Borderless');
  
  // Calculate grid
  // Effective print area per page (subtracting overlap logic if we were strictly printing, 
  // but usually tile printing means we print the full page and the user cuts.
  // Let's assume standard tiling: We step by (PaperSize - Overlap).
  
  const stepX = (paperSize.width - overlapInches) * widthPPI;
  const stepY = (paperSize.height - overlapInches) * heightPPI;
  
  const cols = Math.ceil(img.naturalWidth / stepX);
  const rows = Math.ceil(img.naturalHeight / stepY);

  const results: SplitResult[] = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      // Canvas size is the Paper Size in pixels
      canvas.width = pixelsPerPaperWidth;
      canvas.height = pixelsPerPaperHeight;
      
      // Fill white background (for transparency handling)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Source coordinates
      const srcX = x * stepX;
      const srcY = y * stepY;
      
      // Draw slice
      ctx.drawImage(
        img,
        srcX, srcY, pixelsPerPaperWidth, pixelsPerPaperHeight, // Source rect
        0, 0, canvas.width, canvas.height // Dest rect
      );

      // Add cut markers or guides? optional. 
      // Let's add simple corner ticks to help alignment.
      // Skip guides for borderless prints
      if (!isBorderless) {
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Top left
        ctx.moveTo(0, 20); ctx.lineTo(0,0); ctx.lineTo(20,0);
        // Bottom right
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
