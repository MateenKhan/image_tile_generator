import React, { useState, useEffect } from 'react';
import { Upload, Download, Settings, RefreshCw, Scissors, ArrowRight, Printer, Eye, X } from 'lucide-react';
import { 
  DEFAULT_PHYSICAL_HEIGHT, 
  DEFAULT_PHYSICAL_WIDTH, 
  DEFAULT_PAPER, 
  PAPER_SIZES 
} from './constants';
import { PaperSize, SplitResult } from './types';
import { fileToBase64, splitImage } from './utils/imageUtils';
// import AssistantChat from './components/AssistantChat';
import GridPreview from './components/GridPreview';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [targetWidth, setTargetWidth] = useState<number>(DEFAULT_PHYSICAL_WIDTH);
  const [targetHeight, setTargetHeight] = useState<number>(DEFAULT_PHYSICAL_HEIGHT);
  const [selectedPaper, setSelectedPaper] = useState<PaperSize>(DEFAULT_PAPER);
  const [overlap, setOverlap] = useState<number>(0.25);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [tiles, setTiles] = useState<SplitResult[]>([]);
  const [activeTab, setActiveTab] = useState<'configure' | 'download'>('configure');

  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printPreviewTile, setPrintPreviewTile] = useState<SplitResult | null>(null);

  const [showCustomPrintPreview, setShowCustomPrintPreview] = useState(false);
  const [printSettings, setPrintSettings] = useState({
    copies: 1,
    scale: 100,
    paperHandling: 'auto'
  });

  // Handle File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setImageSrc(base64);
        setTiles([]); // Reset tiles on new image
        setActiveTab('configure');
      } catch (err) {
        console.error(err);
        alert("Error loading image");
      }
    }
  };

  // Process Image Splitting
  const handleSplit = async () => {
    if (!imageSrc) return;
    
    setIsProcessing(true);
    try {
      // Small timeout to allow UI to show loading state
      setTimeout(async () => {
        const result = await splitImage(imageSrc, targetWidth, targetHeight, selectedPaper, overlap);
        setTiles(result);
        setIsProcessing(false);
        setActiveTab('download');
      }, 100);
    } catch (err) {
      console.error(err);
      alert("Failed to split image");
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const folder = zip.folder("tileprint-project");
    
    tiles.forEach((tile) => {
      folder?.file(`${tile.id}.jpg`, tile.blob);
    });

    const content = await zip.generateAsync({ type: "blob" });
    
    // Use native anchor download to avoid file-saver module issues
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = "tileprint-project.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handlePrintPreview = (tile: SplitResult) => {
    setPrintPreviewTile(tile);
    setShowPrintPreview(true);
    setShowCustomPrintPreview(true);
  };

  const closePrintPreview = () => {
    setShowPrintPreview(false);
    setShowCustomPrintPreview(false);
    setPrintPreviewTile(null);
  };

  const handlePrint = () => {
    if (printPreviewTile) {
      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-1000px';
      iframe.style.left = '-1000px';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        // Check if this is a borderless print
        const isBorderless = selectedPaper.name.includes('Borderless');
        
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print Tile</title>
              <style>
                @media print {
                  @page {
                    margin: 0;
                    size: ${selectedPaper.width}in ${selectedPaper.height}in;
                  }
                  body {
                    margin: 0;
                    padding: 0;
                  }
                }
                @media screen {
                  body {
                    margin: 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: #f0f0f0;
                  }
                }
                body {
                  font-family: Arial, sans-serif;
                }
                .print-area {
                  width: ${selectedPaper.width}in;
                  height: ${selectedPaper.height}in;
                  box-sizing: border-box;
                  position: relative;
                  ${isBorderless ? 'margin: 0; padding: 0;' : 'padding: 0.25in;'}
                  background: white;
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .print-content {
                  width: 100%;
                  height: 100%;
                  ${isBorderless ? 'width: 100%; height: 100%; object-fit: cover;' : ''}
                }
                .non-printable-header {
                  display: none;
                }
                @media print {
                  .non-printable-header {
                    display: none;
                  }
                  .print-area {
                    box-shadow: none;
                    ${isBorderless ? 'padding: 0;' : ''}
                  }
                }
              </style>
            </head>
            <body>
              <div class="non-printable-header">
                <h2>Print Preview - ${printPreviewTile.id}</h2>
                <p>This is a preview. Click print to print the image.</p>
              </div>
              <div class="print-area">
                <img src="${printPreviewTile.url}" alt="Print Preview" class="print-content" />
              </div>
            </body>
          </html>
        `);
        iframeDoc.close();
        
        // Wait a bit for the content to load, then trigger print
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          
          // Clean up the iframe after printing
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Printer className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">TilePrint AI</h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Split large art for standard printers
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Controls & Assistant */}
          <div className="space-y-6">
            
            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload size={20} className="text-indigo-600"/> 
                1. Upload Image
              </h2>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${imageSrc ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}>
                  {imageSrc ? (
                    <div className="text-indigo-700 font-medium">Image Loaded! Click to change.</div>
                  ) : (
                    <div className="text-slate-500">
                      <p className="font-medium text-slate-700">Click to upload</p>
                      <p className="text-xs mt-1">JPG, PNG supported</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Configuration Section */}
            <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-opacity ${!imageSrc ? 'opacity-50 pointer-events-none' : ''}`}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings size={20} className="text-indigo-600"/> 
                2. Dimensions
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target Width (in)</label>
                    <input 
                      type="number" 
                      value={targetWidth}
                      onChange={(e) => setTargetWidth(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target Height (in)</label>
                    <input 
                      type="number" 
                      value={targetHeight}
                      onChange={(e) => setTargetHeight(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Paper Size</label>
                  <select 
                    value={selectedPaper.name}
                    onChange={(e) => {
                      const paper = PAPER_SIZES.find(p => p.name === e.target.value);
                      if (paper) setSelectedPaper(paper);
                    }}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {PAPER_SIZES.map(p => (
                      <option key={p.name} value={p.name}>{p.name} ({p.width}" × {p.height}")</option>
                    ))}
                  </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">
                     Overlap (inches)
                     <span className="text-xs text-slate-400 ml-2 font-normal">Helps with alignment</span>
                   </label>
                   <input 
                      type="range" 
                      min="0" max="1" step="0.05"
                      value={overlap}
                      onChange={(e) => setOverlap(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <div className="text-right text-xs text-slate-500">{overlap}"</div>
                </div>

                <button 
                  onClick={handleSplit}
                  disabled={isProcessing}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="animate-spin w-5 h-5" /> Processing...
                    </>
                  ) : (
                    <>
                      <Scissors className="w-5 h-5" /> Generate Tiles
                    </>
                  )}
                </button>
              </div>
            </div>

            

          </div>

          {/* RIGHT COLUMN: Preview & Results */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tab Navigation */}
            <div className="border-b border-slate-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('configure')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === 'configure'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Settings size={16} /> Configuration Preview
                </button>
                <button
                  onClick={() => setActiveTab('download')}
                  disabled={tiles.length === 0}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === 'download'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  <Download size={16} /> Results & Download
                </button>
              </nav>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px] bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center">
              
              {!imageSrc && (
                <div className="text-center text-slate-400 py-20">
                  <div className="bg-slate-100 p-4 rounded-full inline-flex mb-4">
                    <Upload size={32} />
                  </div>
                  <p>Upload an image to get started</p>
                </div>
              )}

              {imageSrc && activeTab === 'configure' && (
                <div className="w-full flex flex-col items-center">
                   <GridPreview 
                      imageSrc={imageSrc}
                      targetWidth={targetWidth}
                      targetHeight={targetHeight}
                      paperSize={selectedPaper}
                      overlap={overlap}
                   />
                   <div className="mt-6 flex items-start gap-4 text-sm text-slate-600 max-w-lg bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <div className="min-w-fit mt-1 text-indigo-600">
                        <ArrowRight size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-indigo-900 mb-1">About the preview</p>
                        <p>Red dashed lines indicate where the image will be split. The aspect ratio of the image is stretched to fit exactly {targetWidth}" × {targetHeight}". Adjust the dimensions if the preview looks distorted.</p>
                      </div>
                   </div>
                </div>
              )}

              {imageSrc && activeTab === 'download' && tiles.length > 0 && !showPrintPreview && (
                <div className="w-full">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Ready to Print</h3>
                      <p className="text-slate-500 text-sm">Total {tiles.length} pages generated</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleDownloadAll}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                      >
                        <Download size={16} /> Download All (.zip)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {tiles.map((tile) => (
                      <div key={tile.id} className="group relative bg-slate-50 rounded-lg border border-slate-200 p-2 hover:shadow-md transition-shadow">
                        <div className="aspect-[1/1.41] overflow-hidden rounded mb-2 bg-white">
                          <img src={tile.url} alt={tile.id} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex justify-between items-center px-1">
                          <span className="text-xs font-mono text-slate-500">
                             Row {tile.rowIndex + 1}, Col {tile.colIndex + 1}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handlePrintPreview(tile)}
                              className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50"
                              title="Print Preview"
                            >
                              <Eye size={16} />
                            </button>
                            <a 
                              href={tile.url} 
                              download={`${tile.id}.jpg`}
                              className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50"
                              title="Download Page"
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Print Preview Modal */}
              {showPrintPreview && showCustomPrintPreview && printPreviewTile && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center p-4 border-b border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900">Print Preview</h3>
                      <button 
                        onClick={closePrintPreview}
                        className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                      {/* Print Preview Area */}
                      <div className="flex-1 p-4 bg-slate-100 flex items-center justify-center overflow-auto">
                        <div 
                          className="bg-white shadow-lg flex items-center justify-center"
                          style={{
                            width: `${Math.min(600, (selectedPaper.width / selectedPaper.height) * 400)}px`,
                            height: '400px',
                            aspectRatio: `${selectedPaper.width}/${selectedPaper.height}`
                          }}
                        >
                          <img 
                            src={printPreviewTile.url} 
                            alt="Print Preview" 
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </div>
                      
                      {/* Print Settings Panel */}
                      <div className="w-full md:w-80 border-l border-slate-200 bg-white p-4 overflow-y-auto">
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-medium text-slate-900 mb-3">Print Settings</h4>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Paper Size</label>
                                <div className="text-sm text-slate-900 bg-slate-50 p-2 rounded">
                                  {selectedPaper.name} ({selectedPaper.width}" × {selectedPaper.height}")
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Copies</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={printSettings.copies}
                                  onChange={(e) => setPrintSettings({...printSettings, copies: parseInt(e.target.value) || 1})}
                                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Scale</label>
                                <select
                                  value={printSettings.scale}
                                  onChange={(e) => setPrintSettings({...printSettings, scale: parseInt(e.target.value)})}
                                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                  <option value={50}>50%</option>
                                  <option value={75}>75%</option>
                                  <option value={100}>100%</option>
                                  <option value={125}>125%</option>
                                  <option value={150}>150%</option>
                                  <option value={200}>200%</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Paper Handling</label>
                                <select
                                  value={printSettings.paperHandling}
                                  onChange={(e) => setPrintSettings({...printSettings, paperHandling: e.target.value})}
                                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                  <option value="auto">Auto</option>
                                  <option value="portrait">Portrait</option>
                                  <option value="landscape">Landscape</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t border-slate-200">
                            <h4 className="font-medium text-slate-900 mb-3">Preview Info</h4>
                            <div className="text-sm space-y-2">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Tile ID:</span>
                                <span className="font-mono">{printPreviewTile.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Position:</span>
                                <span>Row {printPreviewTile.rowIndex + 1}, Col {printPreviewTile.colIndex + 1}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Dimensions:</span>
                                <span>{printPreviewTile.width} × {printPreviewTile.height}px</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
                      <button
                        onClick={closePrintPreview}
                        className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2"
                      >
                        <Printer size={16} /> Print
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;