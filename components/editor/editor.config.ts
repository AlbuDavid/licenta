/* components/editor/editor.config.ts */

export type Tool = 'select' | 'rect' | 'ellipse' | 'line' | 'text' | 'pan';
export type MaterialMode = 'none' | 'slate' | 'wood';

export interface TextProps {
  vis: boolean; font: string; size: number; color: string;
  bold: boolean; italic: boolean; under: boolean;
}
export interface SelInfo { x: number; y: number; w: number; h: number; }

/* Canvas viewport (screen px) */
export const CV_W = 960;
export const CV_H = 620;

/* Document size: 400 × 400 cm = 4000 × 4000 mm
   1 fabric unit = 1 mm → perfect for laser work */
export const DOC_W = 4000;
export const DOC_H = 4000;

export const FONTS = [
  'Arial', 'Georgia', 'Times New Roman', 'Courier New',
  'Verdana', 'Trebuchet MS', 'Palatino', 'Garamond',
];
export const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

export const SHORTCUTS = [
  { keys: 'V / F1',          desc: 'Instrument Selectare' },
  { keys: 'R / F6',          desc: 'Dreptunghi' },
  { keys: 'E / F7',          desc: 'Elipsă' },
  { keys: 'I',               desc: 'Linie' },
  { keys: 'T',               desc: 'Text' },
  { keys: 'H',               desc: 'Pan (mână)' },
  { keys: 'Escape',          desc: 'Revino la Selectare' },
  { keys: 'Ctrl + G',        desc: 'Grupează selecția' },
  { keys: 'Ctrl + U',        desc: 'Degrupează' },
  { keys: 'Ctrl + A',        desc: 'Selectează tot' },
  { keys: 'Ctrl + D',        desc: 'Duplică obiect' },
  { keys: 'Ctrl + Z',        desc: 'Undo' },
  { keys: 'Ctrl + Y',        desc: 'Redo' },
  { keys: 'Ctrl + S',        desc: 'Descarcă SVG' },
  { keys: 'Ctrl + 0',        desc: 'Potrivire în fereastră' },
  { keys: 'Delete',          desc: 'Șterge selectat' },
  { keys: '↑ ↓ ← →',         desc: 'Mișcă 1 mm' },
  { keys: 'Shift + Săgeți',  desc: 'Mișcă 10 mm' },
  { keys: 'Page Up / Down',  desc: 'Strat ±1' },
  { keys: 'Home / End',      desc: 'Prim-plan / Fundal' },
  { keys: 'Ctrl + drag',     desc: 'Formă perfectă (pătrat/cerc)' },
  { keys: 'Scroll mouse',    desc: 'Zoom' },
  { keys: 'Spațiu + drag',   desc: 'Panoramare canvas' },
];
