
import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { 
  DrawingData, 
  PartType, 
  ORingDimensions, 
  BackupRingDimensions,
  BackupRingShape,
  CompositeComponentDetails
} from './types';
import { PRESETS, DEFAULT_COMPANY_NAME, O_RING_MATERIALS, BACKUP_RING_MATERIALS } from './constants';
import { saveDrawing, getHistory, generateDrawingNo } from './services/storageService';
import { DrawingCanvas } from './components/DrawingCanvas';
import { Button } from './components/Button';
import { QuoteModal } from './components/QuoteModal';

// Initial Empty States
const initialORingDims: ORingDimensions = { 
  id: undefined, idTolPlus: undefined, idTolMinus: undefined, 
  w: undefined, wTolPlus: undefined, wTolMinus: undefined 
};
const initialBackupDims: BackupRingDimensions = { 
  od: undefined, odTolPlus: undefined, odTolMinus: undefined, 
  id: undefined, idTolPlus: undefined, idTolMinus: undefined, 
  t: undefined, tTolPlus: undefined, tTolMinus: undefined,
  shape: 'Bias Cut',
  angle: 22, angleTolPlus: undefined, angleTolMinus: undefined
};
const initialCompositeDetails: CompositeComponentDetails = {
  oRingPartNo: '', oRingMaterial: O_RING_MATERIALS[0], oRingHardness: '70',
  backupRingPartNo: '', backupRingMaterial: BACKUP_RING_MATERIALS[0]
};

// Helper to format dimension text with tolerances for the Email Body
const formatDimForEmail = (val: number | undefined, plus?: number | undefined, minus?: number | undefined, unit: string = ''): string => {
  if (val === undefined) return '未入力';
  
  const p = plus || 0;
  const m = minus || 0;

  let tolerance = '';
  if (p === 0 && m === 0) {
    tolerance = '公差なし';
  } else if (p === m) {
    tolerance = `±${p}${unit}`;
  } else {
    tolerance = `+${p}${unit} -${m}${unit}`;
  }
  
  return `${val}${unit} (公差: ${tolerance})`;
};

// Helper Component for Dimension Input Group
const DimensionInputGroup = ({ 
  label, 
  baseVal, setBase, 
  plusVal, setPlus, 
  minusVal, setMinus,
  unit = ''
}: { 
  label: string, 
  baseVal: number | undefined, setBase: (v: string) => void,
  plusVal: number | undefined, setPlus: (v: string) => void,
  minusVal: number | undefined, setMinus: (v: string) => void,
  unit?: string
}) => (
  <div className="flex flex-col space-y-1">
    <label className="text-sm font-bold text-gray-700">{label}</label>
    <div className="flex space-x-2 items-center">
      <div className="flex-1">
        <div className="relative">
          <input 
            type="number" step="0.01" 
            value={baseVal ?? ''} 
            onChange={(e) => setBase(e.target.value)} 
            className="w-full border p-2 rounded text-right pr-8 placeholder-gray-300" 
            placeholder="基準値"
          />
          <span className="absolute right-2 top-2 text-gray-400 text-xs">{unit}</span>
        </div>
      </div>
      <div className="w-20">
        <div className="relative">
          <input 
            type="number" step="0.01" 
            value={plusVal ?? ''} 
            onChange={(e) => setPlus(e.target.value)} 
            className="w-full border p-2 rounded text-right text-sm placeholder-gray-300" 
            placeholder="+0.1"
          />
          <span className="absolute left-1 top-2 text-gray-400 text-xs">+</span>
        </div>
      </div>
      <div className="w-20">
        <div className="relative">
          <input 
            type="number" step="0.01" 
            value={minusVal ?? ''} 
            onChange={(e) => setMinus(e.target.value)} 
            className="w-full border p-2 rounded text-right text-sm placeholder-gray-300" 
            placeholder="-0.1"
          />
          <span className="absolute left-1 top-2 text-gray-400 text-xs">-</span>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  const [view, setView] = useState<'form' | 'preview' | 'history'>('form');
  
  const [formData, setFormData] = useState<DrawingData>({
    id: '',
    drawingNo: '',
    companyName: DEFAULT_COMPANY_NAME,
    partType: 'O-Ring',
    partNo: '',
    customerCode: '',
    material: O_RING_MATERIALS[0],
    hardness: '70',
    note: '',
    createdAt: new Date().toISOString(),
    oRingDims: initialORingDims,
    backupRingDims: initialBackupDims,
    compositeDetails: initialCompositeDetails
  });

  const [history, setHistory] = useState<DrawingData[]>([]);
  const drawingRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [quoteSubject, setQuoteSubject] = useState('');

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    if (!formData.drawingNo) {
      setFormData(prev => ({
        ...prev,
        drawingNo: generateDrawingNo(prev.partType, 1)
      }));
    }
  }, [formData.partType, formData.drawingNo]);

  useEffect(() => {
    const defaultMat = formData.partType === 'O-Ring' ? O_RING_MATERIALS[0] : BACKUP_RING_MATERIALS[0];
    // Don't override if composite
    if (formData.partType !== 'Composite') {
       setFormData(prev => ({ ...prev, material: defaultMat }));
    }
  }, [formData.partType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompositeDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      compositeDetails: { ...prev.compositeDetails!, [name]: value }
    }));
  };

  const handleDimChange = (type: 'O-Ring' | 'Backup Ring', field: string, value: string) => {
    const numVal = value === '' ? undefined : parseFloat(value);
    
    if (type === 'O-Ring') {
      setFormData(prev => ({
        ...prev,
        oRingDims: { ...prev.oRingDims!, [field]: numVal }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        backupRingDims: { ...prev.backupRingDims!, [field]: numVal }
      }));
    }
  };

  const handleShapeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      backupRingDims: { ...prev.backupRingDims!, shape: value as BackupRingShape }
    }));
  };

  const applyPreset = (code: string) => {
    const preset = PRESETS.find(p => p.code === code);
    if (!preset) return;

    // Presets are strictly O-Ring or Backup Ring currently
    setFormData(prev => ({
      ...prev,
      partType: preset.partType,
      oRingDims: preset.oRingDims ? { ...preset.oRingDims } : prev.oRingDims,
      backupRingDims: preset.backupRingDims ? { ...preset.backupRingDims } : prev.backupRingDims
    }));
  };

  const handleGenerate = () => {
    if (!formData.partNo) {
      alert("品番 (セット品番) を入力してください");
      return;
    }

    if (formData.partType === 'O-Ring' || formData.partType === 'Composite') {
       if (formData.oRingDims?.id === undefined || formData.oRingDims?.w === undefined) {
        alert("Oリングの主要寸法 (ID, W) は必須です。");
        return;
      }
    }
    
    if (formData.partType === 'Backup Ring' || formData.partType === 'Composite') {
      if (formData.backupRingDims?.od === undefined || formData.backupRingDims?.id === undefined || formData.backupRingDims?.t === undefined) {
        alert("バックアップリングの主要寸法 (φD, φd, T) は必須です。");
        return;
      }
    }

    if (formData.partType === 'Composite') {
      if (!formData.compositeDetails?.oRingPartNo || !formData.compositeDetails?.backupRingPartNo) {
         alert("構成品のP/Nを入力してください。");
         return;
      }
    }

    setFormData(prev => ({...prev, createdAt: new Date().toISOString()}));
    setView('preview');
  };

  const handleDownloadPDF = async () => {
    if (!drawingRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const canvas = await html2canvas(drawingRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${formData.drawingNo}.pdf`);

      const dataToSave = { ...formData, id: Date.now().toString() };
      saveDrawing(dataToSave);
      setHistory(getHistory());

    } catch (err) {
      console.error("PDF Generation failed", err);
      alert("PDF作成に失敗しました");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleOpenQuoteModal = () => {
    const typeLabel = formData.partType === 'O-Ring' ? 'Oリング' : 
                      formData.partType === 'Backup Ring' ? 'バックアップリング' : 
                      'Oリング＋バックアップリング複合品';
    
    const subject = `【見積もり依頼】${typeLabel}納入図`;
    let body = `${formData.companyName || DEFAULT_COMPANY_NAME} 御中\n\n`;
    body += `以下条件にて${typeLabel}の見積もりをお願いします。\n\n`;
    
    body += `部品種別：${formData.partType}\n`;
    body += `図番：${formData.drawingNo}\n`;
    body += `品番（セット）：${formData.partNo}\n`;
    body += `客先コード：${formData.customerCode}\n\n`;

    if (formData.partType === 'Composite') {
       const c = formData.compositeDetails!;
       const odims = formData.oRingDims!;
       const bdims = formData.backupRingDims!;
       
       body += `【構成1: Oリング】\n`;
       body += `  P/N：${c.oRingPartNo}\n`;
       body += `  材質/硬度：${c.oRingMaterial} / ${c.oRingHardness}\n`;
       body += `  ID：${formatDimForEmail(odims.id, odims.idTolPlus, odims.idTolMinus)}\n`;
       body += `  W ：${formatDimForEmail(odims.w, odims.wTolPlus, odims.wTolMinus)}\n`;
       body += `\n`;

       body += `【構成2: バックアップリング】\n`;
       body += `  P/N：${c.backupRingPartNo}\n`;
       body += `  材質：${c.backupRingMaterial}\n`;
       body += `  形状：${bdims.shape}\n`;
       body += `  φD：${formatDimForEmail(bdims.od, bdims.odTolPlus, bdims.odTolMinus)}\n`;
       body += `  φd：${formatDimForEmail(bdims.id, bdims.idTolPlus, bdims.idTolMinus)}\n`;
       body += `  T ：${formatDimForEmail(bdims.t, bdims.tTolPlus, bdims.tTolMinus)}\n`;
       if (bdims.shape !== 'Endless') {
          const angle = bdims.angle !== undefined ? bdims.angle : (bdims.shape === 'Spiral' ? 30 : 22);
          body += `  角度：${formatDimForEmail(angle, bdims.angleTolPlus, bdims.angleTolMinus, '°')}\n`;
       }

    } else {
        body += `材質：${formData.material}\n`;
        body += `硬度：${formData.hardness}\n\n`;
        body += `寸法：\n`;
        if (formData.partType === 'O-Ring' && formData.oRingDims) {
          body += `  ID：${formatDimForEmail(formData.oRingDims.id, formData.oRingDims.idTolPlus, formData.oRingDims.idTolMinus)}\n`;
          body += `  W ：${formatDimForEmail(formData.oRingDims.w, formData.oRingDims.wTolPlus, formData.oRingDims.wTolMinus)}\n`;
        } else if (formData.partType === 'Backup Ring' && formData.backupRingDims) {
          body += `  φD：${formatDimForEmail(formData.backupRingDims.od, formData.backupRingDims.odTolPlus, formData.backupRingDims.odTolMinus)}\n`;
          body += `  φd：${formatDimForEmail(formData.backupRingDims.id, formData.backupRingDims.idTolPlus, formData.backupRingDims.idTolMinus)}\n`;
          body += `  T ：${formatDimForEmail(formData.backupRingDims.t, formData.backupRingDims.tTolPlus, formData.backupRingDims.tTolMinus)}\n`;
          body += `  形状タイプ：${formData.backupRingDims.shape}\n`;
          if (formData.backupRingDims.shape !== 'Endless') {
             const angle = formData.backupRingDims.angle !== undefined ? formData.backupRingDims.angle : 
                           (formData.backupRingDims.shape === 'Spiral' ? 30 : 22);
             body += `  角度：${formatDimForEmail(angle, formData.backupRingDims.angleTolPlus, formData.backupRingDims.angleTolMinus, '°')}\n`;
          }
        }
    }

    body += `\n数量：____\n\n`;
    body += `備考：\n${formData.note}\n\n`;
    body += `よろしくお願いいたします。`;

    setQuoteSubject(subject);
    setQuoteText(body);
    setIsQuoteModalOpen(true);
  };

  const loadFromHistory = (item: DrawingData) => {
    setFormData(item);
    setView('form');
  };

  const renderForm = () => {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 border-b pb-2">図面作成</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">部品種別</label>
            <select 
              name="partType" 
              value={formData.partType} 
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
            >
              <option value="O-Ring">O-Ring</option>
              <option value="Backup Ring">Backup Ring</option>
              <option value="Composite">複合品 (O-Ring + Backup Ring)</option>
            </select>
          </div>
          <div>
             {/* Hide Preset for Composite for simplicity now */}
             {formData.partType !== 'Composite' && (
                <>
                <label className="block text-sm font-medium text-gray-700">寸法プリセット呼び出し</label>
                <select 
                  onChange={(e) => applyPreset(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-blue-50"
                  defaultValue=""
                >
                  <option value="" disabled>選択してください</option>
                  {PRESETS.map(p => (
                    <option key={p.code} value={p.code}>
                      {p.code} ({p.partType}) - {p.description}
                    </option>
                  ))}
                </select>
                </>
             )}
          </div>
        </div>

        {/* --- FORM LAYOUT --- */}
        <div className="space-y-6">
            
            {/* 1. Common Info */}
            <div className="bg-gray-50 p-4 rounded border">
                 <h3 className="font-bold text-gray-600 mb-2">基本情報 {formData.partType === 'Composite' ? '(セット全体)' : ''}</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500">図番</label>
                        <input type="text" name="drawingNo" value={formData.drawingNo} onChange={handleInputChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">
                          {formData.partType === 'Composite' ? '品番 (セット品)' : '品番'} <span className="text-red-500">*</span>
                        </label>
                        <input type="text" name="partNo" value={formData.partNo} onChange={handleInputChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">客先コード</label>
                        <input type="text" name="customerCode" value={formData.customerCode} onChange={handleInputChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">会社名</label>
                        <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">備考</label>
                        <textarea name="note" value={formData.note} onChange={handleInputChange} className="w-full border p-2 rounded h-10" />
                    </div>
                 </div>
                 
                 {/* Standalone Material/Hardness */}
                 {formData.partType !== 'Composite' && (
                     <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-xs text-gray-500">材質</label>
                            <input 
                              list="material-options" name="material" value={formData.material} onChange={handleInputChange} 
                              className="w-full border p-2 rounded"
                            />
                            <datalist id="material-options">
                              {(formData.partType === 'O-Ring' ? O_RING_MATERIALS : BACKUP_RING_MATERIALS).map(m => <option key={m} value={m} />)}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">硬度</label>
                            <input type="text" name="hardness" value={formData.hardness} onChange={handleInputChange} className="w-full border p-2 rounded" />
                        </div>
                     </div>
                 )}
            </div>

            {/* 2. Component Inputs (Conditional) */}
            
            {/* O-RING COMPONENT */}
            {(formData.partType === 'O-Ring' || formData.partType === 'Composite') && (
                <div className="bg-white p-4 rounded border border-blue-200">
                    <h3 className="font-bold text-blue-700 mb-2 border-b border-blue-100 pb-1">
                      {formData.partType === 'Composite' ? '構成1: Oリング' : '寸法情報 (Oリング)'}
                    </h3>
                    
                    {formData.partType === 'Composite' && (
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-xs text-gray-500">P/N (Oリング) *</label>
                                <input type="text" name="oRingPartNo" value={formData.compositeDetails?.oRingPartNo} onChange={handleCompositeDetailChange} className="w-full border p-2 rounded" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500">材質</label>
                                <input list="oring-mats" name="oRingMaterial" value={formData.compositeDetails?.oRingMaterial} onChange={handleCompositeDetailChange} className="w-full border p-2 rounded" />
                                <datalist id="oring-mats">{O_RING_MATERIALS.map(m => <option key={m} value={m} />)}</datalist>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500">硬度</label>
                                <input type="text" name="oRingHardness" value={formData.compositeDetails?.oRingHardness} onChange={handleCompositeDetailChange} className="w-full border p-2 rounded" />
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <DimensionInputGroup 
                            label="ID (内径) *" 
                            baseVal={formData.oRingDims?.id} setBase={(v) => handleDimChange('O-Ring', 'id', v)}
                            plusVal={formData.oRingDims?.idTolPlus} setPlus={(v) => handleDimChange('O-Ring', 'idTolPlus', v)}
                            minusVal={formData.oRingDims?.idTolMinus} setMinus={(v) => handleDimChange('O-Ring', 'idTolMinus', v)}
                        />
                        <DimensionInputGroup 
                            label="W (線径) *" 
                            baseVal={formData.oRingDims?.w} setBase={(v) => handleDimChange('O-Ring', 'w', v)}
                            plusVal={formData.oRingDims?.wTolPlus} setPlus={(v) => handleDimChange('O-Ring', 'wTolPlus', v)}
                            minusVal={formData.oRingDims?.wTolMinus} setMinus={(v) => handleDimChange('O-Ring', 'wTolMinus', v)}
                        />
                    </div>
                </div>
            )}

            {/* BACKUP RING COMPONENT */}
            {(formData.partType === 'Backup Ring' || formData.partType === 'Composite') && (
                <div className="bg-white p-4 rounded border border-green-200">
                     <h3 className="font-bold text-green-700 mb-2 border-b border-green-100 pb-1">
                        {formData.partType === 'Composite' ? '構成2: バックアップリング' : '寸法情報 (バックアップリング)'}
                     </h3>

                     {formData.partType === 'Composite' && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs text-gray-500">P/N (BUリング) *</label>
                                <input type="text" name="backupRingPartNo" value={formData.compositeDetails?.backupRingPartNo} onChange={handleCompositeDetailChange} className="w-full border p-2 rounded" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500">材質</label>
                                <input list="br-mats" name="backupRingMaterial" value={formData.compositeDetails?.backupRingMaterial} onChange={handleCompositeDetailChange} className="w-full border p-2 rounded" />
                                <datalist id="br-mats">{BACKUP_RING_MATERIALS.map(m => <option key={m} value={m} />)}</datalist>
                            </div>
                        </div>
                    )}

                     <div className="space-y-4">
                        <div>
                           <label className="block text-sm font-bold text-gray-700">形状タイプ</label>
                           <select 
                            value={formData.backupRingDims?.shape} 
                            onChange={(e) => handleShapeChange(e.target.value)}
                            className="w-full border p-2 rounded bg-white"
                           >
                            <option value="Endless">エンドレス</option>
                            <option value="Spiral">スパイラル</option>
                            <option value="Bias Cut">バイアスカット</option>
                           </select>
                        </div>
                        
                        <DimensionInputGroup 
                            label="φD (外径) *" 
                            baseVal={formData.backupRingDims?.od} setBase={(v) => handleDimChange('Backup Ring', 'od', v)}
                            plusVal={formData.backupRingDims?.odTolPlus} setPlus={(v) => handleDimChange('Backup Ring', 'odTolPlus', v)}
                            minusVal={formData.backupRingDims?.odTolMinus} setMinus={(v) => handleDimChange('Backup Ring', 'odTolMinus', v)}
                        />
                        <DimensionInputGroup 
                            label="φd (内径) *" 
                            baseVal={formData.backupRingDims?.id} setBase={(v) => handleDimChange('Backup Ring', 'id', v)}
                            plusVal={formData.backupRingDims?.idTolPlus} setPlus={(v) => handleDimChange('Backup Ring', 'idTolPlus', v)}
                            minusVal={formData.backupRingDims?.idTolMinus} setMinus={(v) => handleDimChange('Backup Ring', 'idTolMinus', v)}
                        />
                        <DimensionInputGroup 
                            label="T (厚み) *" 
                            baseVal={formData.backupRingDims?.t} setBase={(v) => handleDimChange('Backup Ring', 't', v)}
                            plusVal={formData.backupRingDims?.tTolPlus} setPlus={(v) => handleDimChange('Backup Ring', 'tTolPlus', v)}
                            minusVal={formData.backupRingDims?.tTolMinus} setMinus={(v) => handleDimChange('Backup Ring', 'tTolMinus', v)}
                        />

                        {formData.backupRingDims?.shape !== 'Endless' && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                            <DimensionInputGroup 
                                label={formData.backupRingDims?.shape === 'Spiral' ? "スパイラル角度 (度)" : "バイアスカット角度 (度)"} 
                                baseVal={formData.backupRingDims?.angle} setBase={(v) => handleDimChange('Backup Ring', 'angle', v)}
                                plusVal={formData.backupRingDims?.angleTolPlus} setPlus={(v) => handleDimChange('Backup Ring', 'angleTolPlus', v)}
                                minusVal={formData.backupRingDims?.angleTolMinus} setMinus={(v) => handleDimChange('Backup Ring', 'angleTolMinus', v)}
                                unit="°"
                            />
                            </div>
                        )}
                     </div>
                </div>
            )}
        </div>

        <div className="mt-8">
          <Button onClick={handleGenerate} fullWidth className="h-12 text-lg">
            図面生成プレビュー
          </Button>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">図面履歴</h2>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">図番</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">種別</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">品番</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作成日</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {history.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap font-mono">{item.drawingNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{item.partType}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{item.partNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => loadFromHistory(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">再利用</button>
                            </td>
                        </tr>
                    ))}
                    {history.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500">履歴がありません</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <span className="text-xl font-bold">SealRing Gen</span>
                <span className="text-xs bg-slate-700 px-2 py-1 rounded">Internal Use Only</span>
            </div>
            <nav className="space-x-4">
                <button 
                  onClick={() => setView('form')} 
                  className={`px-3 py-1 rounded ${view === 'form' ? 'bg-slate-600' : 'hover:bg-slate-700'}`}
                >
                    新規作成
                </button>
                <button 
                  onClick={() => setView('history')}
                  className={`px-3 py-1 rounded ${view === 'history' ? 'bg-slate-600' : 'hover:bg-slate-700'}`}
                >
                    履歴
                </button>
            </nav>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8">
        {view === 'form' && renderForm()}
        
        {view === 'history' && renderHistory()}

        {view === 'preview' && (
            <div className="flex flex-col items-center space-y-4">
                <div className="w-full max-w-6xl flex justify-between items-center bg-white p-4 rounded shadow mb-4">
                    <h2 className="text-lg font-bold">プレビュー</h2>
                    <div className="space-x-4 flex items-center">
                        <Button variant="secondary" onClick={() => setView('form')}>修正する</Button>
                        <Button variant="success" onClick={handleOpenQuoteModal}>
                            この条件で見積もり依頼
                        </Button>
                        <Button onClick={handleDownloadPDF} disabled={isGeneratingPdf}>
                            {isGeneratingPdf ? '生成中...' : 'PDFダウンロード & 保存'}
                        </Button>
                    </div>
                </div>
                
                <DrawingCanvas ref={drawingRef} data={formData} />
            </div>
        )}
      </main>

      <footer className="bg-gray-100 border-t py-4 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} SealRing Gen System v1.2
      </footer>

      <QuoteModal 
        isOpen={isQuoteModalOpen} 
        onClose={() => setIsQuoteModalOpen(false)} 
        text={quoteText}
        subject={quoteSubject}
      />
    </div>
  );
}

export default App;
