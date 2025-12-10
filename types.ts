
export type PartType = 'O-Ring' | 'Backup Ring';

export type BackupRingShape = 'Endless' | 'Spiral' | 'Bias Cut';

export interface ORingDimensions {
  id: number;
  idTolPlus: number;
  idTolMinus: number;
  w: number;
  wTolPlus: number;
  wTolMinus: number;
}

export interface BackupRingDimensions {
  od: number;
  odTolPlus: number;
  odTolMinus: number;
  id: number;
  idTolPlus: number;
  idTolMinus: number;
  t: number;
  tTolPlus: number;
  tTolMinus: number;
  shape: BackupRingShape;
  // Angle properties for Bias Cut (and potentially Spiral)
  angle?: number;
  angleTolPlus?: number;
  angleTolMinus?: number;
}

export interface DrawingData {
  id: string; // Unique ID for storage
  drawingNo: string;
  companyName: string;
  partType: PartType;
  partNo: string;
  customerCode: string;
  material: string;
  hardness: string;
  note: string;
  createdAt: string; // ISO string
  
  oRingDims?: ORingDimensions;
  backupRingDims?: BackupRingDimensions;
}

export interface DimensionPreset {
  code: string;
  description: string;
  partType: PartType;
  oRingDims?: ORingDimensions;
  backupRingDims?: BackupRingDimensions;
}
