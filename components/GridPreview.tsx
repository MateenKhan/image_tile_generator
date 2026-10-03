import React, { useMemo } from 'react';
import { PaperSize } from '../types';
import { formatInches, tileLayout } from '../utils/tileLayout';

interface GridPreviewProps {
  imageSrc: string;
  targetWidth: number;
  targetHeight: number;
  paperSize: PaperSize;
  overlap: number;
}

const MAX_BOX_WIDTH = 560;
const MAX_BOX_HEIGHT = 460;
const RULER = 28;

const GridPreview: React.FC<GridPreviewProps> = ({
  imageSrc, targetWidth, targetHeight, paperSize, overlap
}) => {
  const valid = targetWidth > 0 && targetHeight > 0;
  const layout = useMemo(
    () => tileLayout(targetWidth, targetHeight, paperSize, overlap),
    [targetWidth, targetHeight, paperSize, overlap]
  );
  const ratio = valid ? targetWidth / targetHeight : 1;
  const boxWidth = Math.min(MAX_BOX_WIDTH, MAX_BOX_HEIGHT * ratio);
  const cutsX = Array.from({ length: layout.cols - 1 }, (_, i) => ((i + 1) * layout.stepX) / targetWidth);
  const cutsY = Array.from({ length: layout.rows - 1 }, (_, i) => ((i + 1) * layout.stepY) / targetHeight);
  const pages = layout.cols * layout.rows;

  return (
    <div
      className="grid w-full justify-center"
      style={{ gridTemplateColumns: `${RULER}px minmax(0, ${boxWidth}px)` }}
    >
      <div />
      <div data-testid="preview-width-dim" className="relative h-7 flex items-center" aria-label="Print width">
        <div className="absolute left-0 right-0 top-1/2 border-t border-slate-400" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3 border-l border-slate-400" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 border-r border-slate-400" />
        <span
          className="relative mx-auto bg-white px-1.5 text-xs font-medium text-slate-700"
        >{formatInches(targetWidth)}</span>
      </div>

      <div data-testid="preview-height-dim" className="relative flex justify-center" aria-label="Print height">
        <div className="absolute top-0 bottom-0 left-1/2 border-l border-slate-400" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 border-t border-slate-400" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 border-b border-slate-400" />
        <span
          className="relative my-auto bg-white py-1.5 text-xs font-medium text-slate-700"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >{formatInches(targetHeight)}</span>
      </div>

      <div
        data-testid="preview-box"
        className="relative w-full overflow-hidden rounded-lg shadow-lg border border-slate-200 bg-white"
        style={{ aspectRatio: `${ratio}` }}
      >
        <img
          src={imageSrc}
          alt="Preview"
          className="absolute inset-0 w-full h-full object-fill"
        />
        <div className="absolute inset-0 pointer-events-none">
          {cutsX.map((f, i) => (
            <div
              key={`v-${i}`}
              data-testid="preview-cut-v"
              className="absolute top-0 bottom-0 border-l border-dashed border-red-500/70 shadow-[0_0_2px_rgba(255,255,255,0.8)]"
              style={{ left: `${f * 100}%`, width: '1px' }}
            />
          ))}
          {cutsY.map((f, i) => (
            <div
              key={`h-${i}`}
              data-testid="preview-cut-h"
              className="absolute left-0 right-0 border-t border-dashed border-red-500/70 shadow-[0_0_2px_rgba(255,255,255,0.8)]"
              style={{ top: `${f * 100}%`, height: '1px' }}
            />
          ))}
          <div
            data-testid="preview-pages"
            className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm"
          >
            {pages} Pages ({paperSize.name}) • {layout.cols} across × {layout.rows} down
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridPreview;
