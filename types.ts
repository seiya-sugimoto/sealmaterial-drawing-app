
export type PartType = 'O-Ring' | 'Backup Ring' | 'Composite';

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

export interface CompositeComponentDetails {
  oRingPartNo: string;
  oRingMaterial: string;
  oRingHardness: string;
  backupRingPartNo: string;
  backupRingMaterial: string;
}

export interface DrawingData {
  id: string; // Unique ID for storage
  drawingNo: string;
  companyName: string;
  partType: PartType;
  partNo: string;
  customerCode: string;
  material: string; // Used for "Set Material" summary or generic text in Composite
  hardness: string; // Used for "Set Hardness" summary or generic text in Composite
  note: string;
  createdAt: string; // ISO string
  
  oRingDims?: ORingDimensions;
  backupRingDims?: BackupRingDimensions;
  compositeDetails?: CompositeComponentDetails;
}

export interface DimensionPreset {
  code: string;
  description: string;
  partType: PartType;
  oRingDims?: ORingDimensions;
  backupRingDims?: BackupRingDimensions;
}
