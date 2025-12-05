export interface Dimension {
  width: number;
  height: number;
}

export interface PaperSize {
  name: string;
  width: number; // inches
  height: number; // inches
}

export interface SplitResult {
  id: string;
  blob: Blob;
  url: string;
  colIndex: number;
  rowIndex: number;
  width: number;
  height: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
