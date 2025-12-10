import { DrawingData } from '../types';

const STORAGE_KEY = 'sealring_gen_history';

export const saveDrawing = (drawing: DrawingData): void => {
  const currentHistory = getHistory();
  // Add to top, limit to 100 items
  const newHistory = [drawing, ...currentHistory].slice(0, 100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
};

export const getHistory = (): DrawingData[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse history", e);
    return [];
  }
};

export const generateDrawingNo = (type: string, sequence: number): string => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const typeStr = type === 'O-Ring' ? 'OR' : 'BR';
  const seqStr = String(sequence).padStart(4, '0');
  return `${yyyy}${mm}${dd}_${typeStr}_${seqStr}`;
};
