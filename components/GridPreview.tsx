import React, { useMemo } from 'react';
import { PaperSize } from '../types';

interface GridPreviewProps {
  imageSrc: string;
  targetWidth: number; // inches
  targetHeight: number; // inches
  paperSize: PaperSize;
  overlap: number; // inches
}

const GridPreview: React.FC<GridPreviewProps> = ({ 
  imageSrc, targetWidth, targetHeight, paperSize, overlap 
}) => {
  // Calculate grid lines percentage based on CSS
  const gridStyle = useMemo(() => {
    // How many pages fit in the target width?
    // Total Width / (PageWidth - Overlap) = Number of columns (approx, simplified for visualization)
    const effectivePageWidth = paperSize.width - overlap;
    const effectivePageHeight = paperSize.height - overlap;
    
    const cols = Math.ceil(targetWidth / effectivePageWidth);
    const rows = Math.ceil(targetHeight / effectivePageHeight);

    return { cols, rows };
  }, [targetWidth, targetHeight, paperSize, overlap]);

  return (
    <div className="relative inline-block overflow-hidden rounded-lg shadow-lg border border-slate-200 bg-white">
      {/* Container aspect ratio forced to match physical dimensions */}
      <div 
        style={{ 
          aspectRatio: `${targetWidth}/${targetHeight}`,
          maxHeight: '500px',
          maxWidth: '100%'
        }}
        className="relative"
      >
        <img 
          src={imageSrc} 
          alt="Preview" 
          className="w-full h-full object-cover"
        />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Vertical Lines */}
          {Array.from({ length: gridStyle.cols }).map((_, i) => (
            i > 0 && (
              <div 
                key={`v-${i}`}
                className="absolute top-0 bottom-0 border-l border-dashed border-red-500/70 shadow-[0_0_2px_rgba(255,255,255,0.8)]"
                style={{ 
                  left: `${(i / gridStyle.cols) * 100}%`,
                  width: '1px'
                }} 
              />
            )
          ))}
          {/* Horizontal Lines */}
          {Array.from({ length: gridStyle.rows }).map((_, i) => (
             i > 0 && (
              <div 
                key={`h-${i}`}
                className="absolute left-0 right-0 border-t border-dashed border-red-500/70 shadow-[0_0_2px_rgba(255,255,255,0.8)]"
                style={{ 
                  top: `${(i / gridStyle.rows) * 100}%`,
                  height: '1px'
                }} 
              />
            )
          ))}
          
          {/* Labels */}
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            {targetWidth}" × {targetHeight}" • {gridStyle.cols * gridStyle.rows} Pages ({paperSize.name})
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridPreview;
