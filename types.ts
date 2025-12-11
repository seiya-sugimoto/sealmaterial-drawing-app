
export type PartType = 'O-Ring' | 'Backup Ring';

export type BackupRingShape = 'Endless' | 'Spiral' | 'Bias Cut';

export interface ORingDimensions {
  id: number | undefined;
  idTolPlus: number | undefined;
  idTolMinus: number | undefined;
  w: number | undefined;
  wTolPlus: number | undefined;
  wTolMinus: number | undefined;
}

export interface BackupRingDimensions {
  od: number | undefined;
  odTolPlus: number | undefined;
  odTolMinus: number | undefined;
  id: number | undefined;
  idTolPlus: number | undefined;
  idTolMinus: number | undefined;
  t: number | undefined;
  tTolPlus: number | undefined;
  tTolMinus: number | undefined;
  shape: BackupRingShape;
  // Angle properties for Bias Cut (and potentially Spiral)
  angle?: number | undefined;
  angleTolPlus?: number | undefined;
  angleTolMinus?: number | undefined;
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
