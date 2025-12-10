
import { DimensionPreset } from './types';

export const DEFAULT_COMPANY_NAME = "有限会社澤田商店";

export const PRESETS: DimensionPreset[] = [
  {
    code: "P-10",
    description: "JIS P-10 Standard O-Ring",
    partType: "O-Ring",
    oRingDims: { 
      id: 9.8, idTolPlus: 0.15, idTolMinus: 0.15, 
      w: 1.9, wTolPlus: 0.08, wTolMinus: 0.08 
    }
  },
  {
    code: "P-20",
    description: "JIS P-20 Standard O-Ring",
    partType: "O-Ring",
    oRingDims: { 
      id: 19.8, idTolPlus: 0.20, idTolMinus: 0.20, 
      w: 2.4, wTolPlus: 0.09, wTolMinus: 0.09 
    }
  },
  {
    code: "G-30",
    description: "JIS G-30 Standard O-Ring",
    partType: "O-Ring",
    oRingDims: { 
      id: 29.4, idTolPlus: 0.29, idTolMinus: 0.29, 
      w: 3.1, wTolPlus: 0.10, wTolMinus: 0.10 
    }
  },
  {
    code: "BR-T1",
    description: "Standard T1 Backup Ring",
    partType: "Backup Ring",
    backupRingDims: { 
      od: 35.0, odTolPlus: 0.05, odTolMinus: 0.05, 
      id: 30.0, idTolPlus: 0.05, idTolMinus: 0.05, 
      t: 1.5, tTolPlus: 0.1, tTolMinus: 0.1, 
      shape: 'Bias Cut',
      angle: 30, angleTolPlus: 5, angleTolMinus: 5
    }
  },
  {
    code: "BR-T2",
    description: "Heavy Duty T2 Backup Ring",
    partType: "Backup Ring",
    backupRingDims: { 
      od: 55.0, odTolPlus: 0.1, odTolMinus: 0.1, 
      id: 45.0, idTolPlus: 0.1, idTolMinus: 0.1, 
      t: 2.0, tTolPlus: 0.1, tTolMinus: 0.1, 
      shape: 'Bias Cut',
      angle: 30, angleTolPlus: 5, angleTolMinus: 5
    }
  }
];

export const MATERIALS = [
  "NBR-70-1 (1種A)",
  "NBR-90-1 (1種B)",
  "FKM-70 (4種D)",
  "VMQ-50 (シリコン)",
  "EPDM-70"
];
