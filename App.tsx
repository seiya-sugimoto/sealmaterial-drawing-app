
import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { 
  DrawingData, 
  PartType, 
  ORingDimensions, 
  BackupRingDimensions,
  BackupRingShape
} from './types';
import { PRESETS, DEFAULT_COMPANY_NAME, MATERIALS } from './constants';
import { saveDrawing, getHistory, generateDrawingNo } from './services/storageService';
import { DrawingCanvas } from './components/DrawingCanvas';
import { Button } from './components/Button';

// Initial Empty State
const initialORingDims: ORingDimensions = { 
  id: 0, idTolPlus: 0, idTolMinus: 0, 
  w: 0, wTolPlus: 0, wTolMinus: 0 
};
const initialBackupDims: BackupRingDimensions = { 
  od: 0, odTolPlus: 0, odTolMinus: 0, 
  id: 0, idTolPlus: 0, idTolMinus: 0, 
  t: 0, tTolPlus: 0, tTolMinus: 0,
  shape: 'Bias Cut',
  angle: 22, angleTolPlus: 0, angleTolMinus: 0
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
            value={baseVal} 
            onChange={(e) => setBase(e.target.value)} 
            className="w-full border p-2 rounded text-right pr-8" 
            placeholder="基準値"
          />
          <span className="absolute right-2 top-2 text-gray-400 text-xs">{unit}</span>
        </div>
      </div>
      <div className="w-20">
        <div className="relative">
          <input 
            type="number" step="0.01" 
            value={plusVal} 
            onChange={(e) => setPlus(e.target.value)} 
            className="w-full border p-2 rounded text-right text-sm" 
            placeholder="+0.1"
          />
          <span className="absolute left-1 top-2 text-gray-400 text-xs">+</span>
        </div>
      </div>
      <div className="w-20">
        <div className="relative">
          <input 
            type="number" step="0.01" 
            value={minusVal} 
            onChange={(e) => setMinus(e.target.value)} 
            className="w-full border p-2 rounded text-right text-sm" 
            placeholder="-0.1"
          />
          <span className="absolute left-1 top-2 text-gray-400 text-xs">-</span>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  // View State: 'form' | 'preview' | 'history'
  const [view, setView] = useState<'form' | 'preview' | 'history'>('form');
  
  // Data State
  const [formData, setFormData] = useState<DrawingData>({
    id: '',
    drawingNo: '',
    companyName: DEFAULT_COMPANY_NAME,
    partType: 'O-Ring',
    partNo: '',
    customerCode: '',
    material: MATERIALS[0],
    hardness: '70',
    note: '',
    createdAt: new Date().toISOString(),
    oRingDims: initialORingDims,
    backupRingDims: initialBackupDims
  });

  const [history, setHistory] = useState<DrawingData[]>([]);
  const drawingRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Initialize History on Load
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  // Initialize Drawing No
  useEffect(() => {
    if (!formData.drawingNo) {
      setFormData(prev => ({
        ...prev,
        drawingNo: generateDrawingNo(prev.partType, 1)
      }));
    }
  }, [formData.partType, formData.drawingNo]);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDimChange = (type: PartType, field: string, value: string) => {
    const numVal = value === '' ? 0 : parseFloat(value);
    
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

    setFormData(prev => ({
      ...prev,
      partType: preset.partType,
      oRingDims: preset.oRingDims ? { ...preset.oRingDims } : prev.oRingDims,
      backupRingDims: preset.backupRingDims ? { ...preset.backupRingDims } : prev.backupRingDims
    }));
  };

  const handleGenerate = () => {
    // Basic Validation
    if (!formData.partNo) {
      alert("品番を入力してください");
      return;
    }
    setFormData(prev => ({...prev, createdAt: new Date().toISOString()}));
    setView('preview');
  };

  const handleDownloadPDF = async () => {
    if (!drawingRef.current) return;
    setIsGeneratingPdf(true);

    try {
      // 1. Capture the drawing div
      const canvas = await html2canvas(drawingRef.current, {
        scale: 2, // Higher scale for better resolution
        useCORS: true,
        logging: false
      });

      // 2. Generate PDF
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

      // 3. Save to History
      const dataToSave = { ...formData, id: Date.now().toString() };
      saveDrawing(dataToSave);
      setHistory(getHistory()); // Refresh list

    } catch (err) {
      console.error("PDF Generation failed", err);
      alert("PDF作成に失敗しました");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const loadFromHistory = (item: DrawingData) => {
    // Adapter for legacy data support if needed, assuming types match for now or basic defaults
    const adaptedItem = {
       ...item,
       oRingDims: item.oRingDims ? {
         id: item.oRingDims.id,
         idTolPlus: (item.oRingDims as any).idTolPlus ?? (item.oRingDims as any).idTol ?? 0,
         idTolMinus: (item.oRingDims as any).idTolMinus ?? (item.oRingDims as any).idTol ?? 0,
         w: item.oRingDims.w,
         wTolPlus: (item.oRingDims as any).wTolPlus ?? (item.oRingDims as any).wTol ?? 0,
         wTolMinus: (item.oRingDims as any).wTolMinus ?? (item.oRingDims as any).wTol ?? 0,
       } : undefined,
       backupRingDims: item.backupRingDims ? {
         ...item.backupRingDims,
         odTolPlus: (item.backupRingDims as any).odTolPlus ?? (item.backupRingDims as any).odTol ?? 0,
         odTolMinus: (item.backupRingDims as any).odTolMinus ?? (item.backupRingDims as any).odTol ?? 0,
         idTolPlus: (item.backupRingDims as any).idTolPlus ?? (item.backupRingDims as any).idTol ?? 0,
         idTolMinus: (item.backupRingDims as any).idTolMinus ?? (item.backupRingDims as any).idTol ?? 0,
         tTolPlus: (item.backupRingDims as any).tTolPlus ?? (item.backupRingDims as any).tTol ?? 0,
         tTolMinus: (item.backupRingDims as any).tTolMinus ?? (item.backupRingDims as any).tTol ?? 0,
         // Default angle vals
         angle: item.backupRingDims.angle ?? 22,
         angleTolPlus: item.backupRingDims.angleTolPlus ?? 0,
         angleTolMinus: item.backupRingDims.angleTolMinus ?? 0,
       } : undefined
    };
    setFormData(adaptedItem);
    setView('form');
  };

  // --- RENDER HELPERS ---

  const renderForm = () => (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-6 border-b pb-2">図面作成</h2>
      
      {/* Top Controls */}
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
          </select>
        </div>
        <div>
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Meta Data */}
        <div className="space-y-4">
            <h3 className="font-bold text-gray-600">基本情報</h3>
             <div>
                <label className="block text-xs text-gray-500">図番 (自動生成・編集可)</label>
                <input type="text" name="drawingNo" value={formData.drawingNo} onChange={handleInputChange} className="w-full border p-2 rounded" />
            </div>
            <div>
                <label className="block text-xs text-gray-500">品番</label>
                <input type="text" name="partNo" value={formData.partNo} onChange={handleInputChange} className="w-full border p-2 rounded" placeholder="例: P-10" />
            </div>
             <div>
                <label className="block text-xs text-gray-500">客先コード</label>
                <input type="text" name="customerCode" value={formData.customerCode} onChange={handleInputChange} className="w-full border p-2 rounded" />
            </div>
             <div>
                <label className="block text-xs text-gray-500">会社名</label>
                <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full border p-2 rounded" />
            </div>
             <div className="grid grid-cols-2 gap-2">
                <div>
                   <label className="block text-xs text-gray-500">材質</label>
                   <select name="material" value={formData.material} onChange={handleInputChange} className="w-full border p-2 rounded">
                       {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-xs text-gray-500">硬度</label>
                   <input type="text" name="hardness" value={formData.hardness} onChange={handleInputChange} className="w-full border p-2 rounded" />
                </div>
            </div>
            <div>
                <label className="block text-xs text-gray-500">備考</label>
                <textarea name="note" value={formData.note} onChange={handleInputChange} className="w-full border p-2 rounded h-20" />
            </div>
        </div>

        {/* Right Column: Dimensions */}
        <div className="bg-gray-50 p-4 rounded border">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-gray-600">寸法入力 (mm)</h3>
                 <span className="text-xs text-gray-400">値 | 上限(+) | 下限(-)</span>
             </div>
             
             {formData.partType === 'O-Ring' && (
               <div className="space-y-4">
                 <DimensionInputGroup 
                   label="ID (内径)" 
                   baseVal={formData.oRingDims?.id} setBase={(v) => handleDimChange('O-Ring', 'id', v)}
                   plusVal={formData.oRingDims?.idTolPlus} setPlus={(v) => handleDimChange('O-Ring', 'idTolPlus', v)}
                   minusVal={formData.oRingDims?.idTolMinus} setMinus={(v) => handleDimChange('O-Ring', 'idTolMinus', v)}
                 />
                 <DimensionInputGroup 
                   label="W (線径)" 
                   baseVal={formData.oRingDims?.w} setBase={(v) => handleDimChange('O-Ring', 'w', v)}
                   plusVal={formData.oRingDims?.wTolPlus} setPlus={(v) => handleDimChange('O-Ring', 'wTolPlus', v)}
                   minusVal={formData.oRingDims?.wTolMinus} setMinus={(v) => handleDimChange('O-Ring', 'wTolMinus', v)}
                 />
               </div>
             )}

             {formData.partType === 'Backup Ring' && (
               <div className="space-y-4">
                  {/* Shape Selector */}
                  <div>
                    <label className="block text-sm font-bold text-blue-800">形状タイプ</label>
                    <select 
                      value={formData.backupRingDims?.shape} 
                      onChange={(e) => handleShapeChange(e.target.value)}
                      className="w-full border p-2 rounded bg-white"
                    >
                      <option value="Endless">エンドレス (Endless)</option>
                      <option value="Spiral">スパイラル (Spiral)</option>
                      <option value="Bias Cut">バイアスカット (Bias Cut)</option>
                    </select>
                  </div>
                  <hr className="border-gray-300"/>

                 <DimensionInputGroup 
                   label="φD (外径)" 
                   baseVal={formData.backupRingDims?.od} setBase={(v) => handleDimChange('Backup Ring', 'od', v)}
                   plusVal={formData.backupRingDims?.odTolPlus} setPlus={(v) => handleDimChange('Backup Ring', 'odTolPlus', v)}
                   minusVal={formData.backupRingDims?.odTolMinus} setMinus={(v) => handleDimChange('Backup Ring', 'odTolMinus', v)}
                 />
                 <DimensionInputGroup 
                   label="φd (内径)" 
                   baseVal={formData.backupRingDims?.id} setBase={(v) => handleDimChange('Backup Ring', 'id', v)}
                   plusVal={formData.backupRingDims?.idTolPlus} setPlus={(v) => handleDimChange('Backup Ring', 'idTolPlus', v)}
                   minusVal={formData.backupRingDims?.idTolMinus} setMinus={(v) => handleDimChange('Backup Ring', 'idTolMinus', v)}
                 />
                 <DimensionInputGroup 
                   label="T (厚み)" 
                   baseVal={formData.backupRingDims?.t} setBase={(v) => handleDimChange('Backup Ring', 't', v)}
                   plusVal={formData.backupRingDims?.tTolPlus} setPlus={(v) => handleDimChange('Backup Ring', 'tTolPlus', v)}
                   minusVal={formData.backupRingDims?.tTolMinus} setMinus={(v) => handleDimChange('Backup Ring', 'tTolMinus', v)}
                 />

                 {/* Angle Configuration for Bias Cut */}
                 {formData.backupRingDims?.shape === 'Bias Cut' && (
                   <div className="mt-4 pt-4 border-t border-gray-200">
                     <DimensionInputGroup 
                       label="バイアスカット角度 (度)" 
                       baseVal={formData.backupRingDims?.angle} setBase={(v) => handleDimChange('Backup Ring', 'angle', v)}
                       plusVal={formData.backupRingDims?.angleTolPlus} setPlus={(v) => handleDimChange('Backup Ring', 'angleTolPlus', v)}
                       minusVal={formData.backupRingDims?.angleTolMinus} setMinus={(v) => handleDimChange('Backup Ring', 'angleTolMinus', v)}
                       unit="°"
                     />
                   </div>
                 )}
               </div>
             )}
        </div>
      </div>

      <div className="mt-8">
        <Button onClick={handleGenerate} fullWidth className="h-12 text-lg">
          図面生成プレビュー
        </Button>
      </div>
    </div>
  );

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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">形状/ID</th>
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
                            <td className="px-6 py-4 whitespace-nowrap text-xs">
                              {item.partType === 'O-Ring' 
                                ? `ID: ${item.oRingDims?.id}` 
                                : `${item.backupRingDims?.shape}`
                              }
                            </td>
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
      {/* Header */}
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

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8">
        {view === 'form' && renderForm()}
        
        {view === 'history' && renderHistory()}

        {view === 'preview' && (
            <div className="flex flex-col items-center space-y-4">
                <div className="w-full max-w-6xl flex justify-between items-center bg-white p-4 rounded shadow mb-4">
                    <h2 className="text-lg font-bold">プレビュー</h2>
                    <div className="space-x-4">
                        <Button variant="secondary" onClick={() => setView('form')}>修正する</Button>
                        <Button onClick={handleDownloadPDF} disabled={isGeneratingPdf}>
                            {isGeneratingPdf ? '生成中...' : 'PDFダウンロード & 保存'}
                        </Button>
                    </div>
                </div>
                
                {/* The Canvas itself */}
                <DrawingCanvas ref={drawingRef} data={formData} />
            </div>
        )}
      </main>

      <footer className="bg-gray-100 border-t py-4 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} SealRing Gen System v1.1
      </footer>
    </div>
  );
}

export default App;
