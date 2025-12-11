
import React, { forwardRef } from 'react';
import { DrawingData } from '../types';

interface DrawingCanvasProps {
  data: DrawingData;
}

// Helper to format dimension text with tolerances
const formatTolerance = (val: number | undefined, plus?: number | undefined, minus?: number | undefined, unit: string = ''): string => {
  if (val === undefined) return ''; 
  
  const p = plus || 0;
  const m = minus || 0;

  if (p === 0 && m === 0) {
    return `${val}${unit}`;
  }
  if (p === m) {
    return `${val}${unit} ±${p}${unit}`;
  }
  return `${val}${unit} +${p}${unit} -${m}${unit}`;
};

// Helper for drawing dimension lines
const DimensionLine = ({ 
  x1, y1, x2, y2, text, textOffset = 15, vertical = false, arrowSize = 5 
}: { 
  x1: number; y1: number; x2: number; y2: number; text: string; textOffset?: number; vertical?: boolean; arrowSize?: number 
}) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrow1_1x = x1 + arrowSize * Math.cos(angle + Math.PI / 6);
  const arrow1_1y = y1 + arrowSize * Math.sin(angle + Math.PI / 6);
  const arrow1_2x = x1 + arrowSize * Math.cos(angle - Math.PI / 6);
  const arrow1_2y = y1 + arrowSize * Math.sin(angle - Math.PI / 6);

  const arrow2_1x = x2 - arrowSize * Math.cos(angle + Math.PI / 6);
  const arrow2_1y = y2 - arrowSize * Math.sin(angle + Math.PI / 6);
  const arrow2_2x = x2 - arrowSize * Math.cos(angle - Math.PI / 6);
  const arrow2_2y = y2 - arrowSize * Math.sin(angle - Math.PI / 6);

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const textX = vertical ? midX + textOffset : midX;
  const textY = vertical ? midY : midY - textOffset / 2;

  return (
    <g className="stroke-black fill-black" strokeWidth="1">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <path d={`M${x1},${y1} L${arrow1_1x},${arrow1_1y} M${x1},${y1} L${arrow1_2x},${arrow1_2y}`} fill="none" />
      <path d={`M${x2},${y2} L${arrow2_1x},${arrow2_1y} M${x2},${y2} L${arrow2_2x},${arrow2_2y}`} fill="none" />
      <text 
        x={textX} 
        y={textY} 
        textAnchor="middle" 
        dominantBaseline="middle" 
        stroke="none" 
        className="text-[12px] font-mono"
        transform={vertical ? `rotate(-90, ${textX}, ${textY})` : ''}
      >
        {text}
      </text>
    </g>
  );
};

export const DrawingCanvas = forwardRef<HTMLDivElement, DrawingCanvasProps>(({ data }, ref) => {
  
  // -------------------------------------------------------------------------
  // O-RING RENDER PRIMITIVES
  // -------------------------------------------------------------------------
  const renderORingFrontView = (cx: number, cy: number, scale: number) => {
    if (!data.oRingDims) return null;
    const { id = 0, idTolPlus, idTolMinus, w = 0 } = data.oRingDims;

    const baseRadius = 100 * scale; 
    const innerRadius = baseRadius;
    const thicknessScale = (w / (id || 1)) * baseRadius * 3; 
    const visualThickness = Math.max(15 * scale, Math.min(thicknessScale, 40 * scale)); 
    const outerRadius = innerRadius + visualThickness;

    return (
      <g>
        <line x1={cx - outerRadius - 40 * scale} y1={cy} x2={cx + outerRadius + 40 * scale} y2={cy} stroke="black" strokeDasharray="10,5" strokeWidth="0.5" />
        <line x1={cx} y1={cy - outerRadius - 40 * scale} x2={cx} y2={cy + outerRadius + 40 * scale} stroke="black" strokeDasharray="10,5" strokeWidth="0.5" />

        <circle cx={cx} cy={cy} r={outerRadius} fill="none" stroke="black" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={innerRadius} fill="none" stroke="black" strokeWidth="2" />

        <DimensionLine 
          x1={cx - innerRadius} y1={cy} 
          x2={cx + innerRadius} y2={cy} 
          text={`ID ${formatTolerance(id, idTolPlus, idTolMinus)}`} 
          textOffset={20 * scale}
        />
        
        <text x={cx} y={cy + outerRadius + 30 * scale} textAnchor="middle" fontSize={14 * scale} fontWeight="bold">正面図 (Oリング)</text>
      </g>
    );
  };

  const renderORingSectionView = (cx: number, cy: number, scale: number) => {
    if (!data.oRingDims) return null;
    const { id = 0, w = 0, wTolPlus, wTolMinus } = data.oRingDims;
    
    // We re-calculate visual thickness to match Front View logic roughly for consistency
    const baseRadius = 100 * scale;
    const thicknessScale = (w / (id || 1)) * baseRadius * 3; 
    const visualThickness = Math.max(15 * scale, Math.min(thicknessScale, 40 * scale)); 

    const sectionHeight = 100 * scale;
    const sectionWidth = visualThickness; 

    return (
      <g>
         <circle cx={cx} cy={cy - sectionHeight/2} r={sectionWidth/2} fill="url(#hatch)" stroke="black" strokeWidth="2" />
         <circle cx={cx} cy={cy + sectionHeight/2} r={sectionWidth/2} fill="url(#hatch)" stroke="black" strokeWidth="2" />
         
          <path 
           d={`M${cx - sectionWidth/2},${cy - sectionHeight/2} L${cx - sectionWidth/2},${cy + sectionHeight/2}`} 
           stroke="black" strokeWidth="1" fill="none"
          />
          <path 
           d={`M${cx + sectionWidth/2},${cy - sectionHeight/2} L${cx + sectionWidth/2},${cy + sectionHeight/2}`} 
           stroke="black" strokeWidth="1" fill="none"
          />

          <DimensionLine 
            x1={cx - sectionWidth/2} y1={cy} 
            x2={cx + sectionWidth/2} y2={cy} 
            text={`W ${formatTolerance(w, wTolPlus, wTolMinus)}`} 
            textOffset={30 * scale} 
          />
          
          <text x={cx} y={cy + sectionHeight/2 + 30 * scale} textAnchor="middle" fontSize={14 * scale} fontWeight="bold">断面図 (Oリング)</text>
      </g>
    );
  };

  // -------------------------------------------------------------------------
  // BACKUP RING RENDER PRIMITIVES
  // -------------------------------------------------------------------------
  const renderBRFrontView = (cx: number, cy: number, scale: number) => {
    if (!data.backupRingDims) return null;
    const { 
      od = 0, id = 0, idTolPlus, idTolMinus, shape
    } = data.backupRingDims;

    const baseRadius = 80 * scale; 
    const radialWidth = (od - id) / 2;
    const tScale = (radialWidth / (id || 1)) * baseRadius * 4;
    const visualWidth = Math.max(10 * scale, Math.min(tScale, 30 * scale)); 
    
    const innerRadius = baseRadius;
    const outerRadius = baseRadius + visualWidth;

    return (
      <g>
         <line x1={cx - outerRadius - 30 * scale} y1={cy} x2={cx + outerRadius + 30 * scale} y2={cy} stroke="black" strokeDasharray="10,5" strokeWidth="0.5" />
         <line x1={cx} y1={cy - outerRadius - 30 * scale} x2={cx} y2={cy + outerRadius + 30 * scale} stroke="black" strokeDasharray="10,5" strokeWidth="0.5" />

         <circle cx={cx} cy={cy} r={outerRadius} fill="none" stroke="black" strokeWidth="2" />
         <circle cx={cx} cy={cy} r={innerRadius} fill="none" stroke="black" strokeWidth="2" />
         
         {/* ID Dimension (Consistent with O-Ring now) */}
         <DimensionLine 
            x1={cx - innerRadius} y1={cy} 
            x2={cx + innerRadius} y2={cy} 
            text={`φd ${formatTolerance(id, idTolPlus, idTolMinus)}`} 
            textOffset={20 * scale}
         />

         {shape === 'Spiral' && (
           <g>
             <line x1={cx} y1={cy - outerRadius - 2} x2={cx} y2={cy - innerRadius + 2} stroke="white" strokeWidth="8" />
             <line x1={cx - 3} y1={cy - outerRadius - 1} x2={cx + 3} y2={cy - innerRadius + 1} stroke="black" strokeWidth="1.5" />
           </g>
         )}

         <text x={cx} y={cy + outerRadius + 30 * scale} textAnchor="middle" fontSize={14 * scale} fontWeight="bold">
           {shape === 'Spiral' ? '正面図 (スパイラル)' : '正面図 (BUリング)'}
         </text>
      </g>
    );
  };

  const renderBRSideView = (cx: number, cy: number, scale: number) => {
    if (!data.backupRingDims) return null;
    const { 
      t = 0, tTolPlus, tTolMinus, shape, angle, angleTolPlus, angleTolMinus 
    } = data.backupRingDims;

    const sideHeight = 120 * scale;
    const sideWidth = 40 * scale; // Visual thickness T
    const hatchId = "hatchBr";
    const angleText = angle ? formatTolerance(angle, angleTolPlus, angleTolMinus, '°') : '';

    return (
      <g>
          {/* T Dimension: Use positive offset to move text ABOVE the arrow lines, preventing overlap */}
          <DimensionLine 
              x1={cx - sideWidth/2} y1={cy - sideHeight/2 - 20 * scale} 
              x2={cx + sideWidth/2} y2={cy - sideHeight/2 - 20 * scale} 
              text={`T ${formatTolerance(t, tTolPlus, tTolMinus)}`} 
              textOffset={50 * scale}
          />

          {(shape === 'Endless' || shape === 'Spiral') && (
              <g>
                  <rect x={cx - sideWidth/2} y1={cy - sideHeight/2} width={sideWidth} height={sideHeight} 
                        fill={`url(#${hatchId})`} stroke="black" strokeWidth="2" />
                  
                  <text x={cx} y={cy + sideHeight/2 + 30 * scale} textAnchor="middle" fontSize={14 * scale} fontWeight="bold">
                     {shape === 'Spiral' ? '側面図 (スパイラル)' : '側面図 (エンドレス)'}
                  </text>

                  {shape === 'Spiral' && (
                     <g>
                       <text x={cx + sideWidth + 10} y={cy + 5} className="font-bold text-lg">A</text>
                       <path d={`M${cx + sideWidth + 5},${cy} L${cx + sideWidth/2 + 5},${cy}`} stroke="black" strokeWidth="1" markerEnd="url(#arrow)" />
                       <path d={`M${cx + sideWidth + 5},${cy} L${cx + sideWidth/2 + 5},${cy}`} stroke="black" strokeWidth="1" />
                     </g>
                  )}
              </g>
          )}

          {shape === 'Bias Cut' && (
              <g>
                 <path d={`M${cx - sideWidth/2},${cy - sideHeight/2} L${cx + sideWidth/2},${cy - sideHeight/2} L${cx + sideWidth/2},${cy - 10} L${cx - sideWidth/2},${cy + 10} Z`} 
                       fill={`url(#${hatchId})`} stroke="black" strokeWidth="2" />
                 <path d={`M${cx - sideWidth/2},${cy + 20} L${cx + sideWidth/2},${cy} L${cx + sideWidth/2},${cy + sideHeight/2} L${cx - sideWidth/2},${cy + sideHeight/2} Z`} 
                       fill={`url(#${hatchId})`} stroke="black" strokeWidth="2" />

                 <line x1={cx + sideWidth/2} y1={cy} x2={cx + sideWidth/2 + 30 * scale} y2={cy} stroke="black" strokeWidth="0.5" strokeDasharray="2,2"/>
                 <text x={cx + sideWidth + 10 * scale} y={cy + 20} className="text-xs">{angleText}</text>
                 <text x={cx} y={cy + sideHeight/2 + 30 * scale} textAnchor="middle" fontSize={14 * scale} fontWeight="bold">バイアスカット</text>
              </g>
          )}

          {/* --- DETAIL A (Spiral) --- */}
          {shape === 'Spiral' && (
             <g transform={`translate(${cx + 80 * scale}, ${cy})`}>
                 <rect x="-30" y="-60" width="60" height="120" fill="white" stroke="black" strokeWidth="2" />
                 <line x1="-30" y1="20" x2="30" y2="-15" stroke="black" strokeWidth="2" />
                 <line x1="-30" y1="20" x2="10" y2="20" stroke="black" strokeWidth="0.5" strokeDasharray="4,2" />
                 <path d="M-5,20 A 25,25 0 0,1 -8,14" fill="none" stroke="black" strokeWidth="1" />
                 <text x="5" y="15" className="text-xs">30°±5°</text>
                 <text x="0" y="80" textAnchor="middle" fontSize={14 * scale} fontWeight="bold">A部拡大図</text>
             </g>
          )}
      </g>
    );
  };

  // -------------------------------------------------------------------------
  // COMPOSITE COMPONENT TABLE (SVG)
  // -------------------------------------------------------------------------
  const renderCompositeTable = () => {
     // Table layout
     const tableX = 50;
     const tableY = 60; // Top position
     const colWidths = [30, 100, 80, 200, 150]; // Total 560
     const rowHeight = 30;
     const totalWidth = colWidths.reduce((a, b) => a + b, 0);
     const centeredX = (800 - totalWidth) / 2;
     
     const headers = ["No", "P/N", "種類", "寸法", "材質 / 硬度"];
     const comp = data.compositeDetails;
     
     // Dim Strings
     const oRingDims = data.oRingDims;
     const oRingDimStr = `ID ${formatTolerance(oRingDims?.id, oRingDims?.idTolPlus, oRingDims?.idTolMinus)}, W ${formatTolerance(oRingDims?.w, oRingDims?.wTolPlus, oRingDims?.wTolMinus)}`;
     
     const brDims = data.backupRingDims;
     const brDimStr = `φD ${formatTolerance(brDims?.od, brDims?.odTolPlus, brDims?.odTolMinus)}, φd ${formatTolerance(brDims?.id, brDims?.idTolPlus, brDims?.idTolMinus)}, T ${formatTolerance(brDims?.t, brDims?.tTolPlus, brDims?.tTolMinus)}`;

     return (
        <g transform={`translate(${centeredX}, ${tableY})`}>
            {/* Header Background */}
            <rect x="0" y="0" width={totalWidth} height={rowHeight} fill="#f3f4f6" stroke="none"/>
            
            {/* Header Text */}
            {headers.map((h, i) => {
                let xPos = colWidths.slice(0, i).reduce((a, b) => a + b, 0);
                return (
                    <text key={i} x={xPos + colWidths[i]/2} y={rowHeight/2} dominantBaseline="middle" textAnchor="middle" fontWeight="bold" fontSize="12">{h}</text>
                );
            })}

            {/* Row 1 Text */}
            <text x={colWidths[0]/2} y={rowHeight*1.5} dominantBaseline="middle" textAnchor="middle" fontSize="12">1</text>
            <text x={colWidths[0] + colWidths[1]/2} y={rowHeight*1.5} dominantBaseline="middle" textAnchor="middle" fontSize="12">{comp?.oRingPartNo}</text>
            <text x={colWidths[0] + colWidths[1] + colWidths[2]/2} y={rowHeight*1.5} dominantBaseline="middle" textAnchor="middle" fontSize="12">Oリング</text>
            <text x={colWidths[0] + colWidths[1] + colWidths[2] + 10} y={rowHeight*1.5} dominantBaseline="middle" textAnchor="start" fontSize="11">{oRingDimStr}</text>
            <text x={colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4]/2} y={rowHeight*1.5} dominantBaseline="middle" textAnchor="middle" fontSize="11">{comp?.oRingMaterial} / {comp?.oRingHardness}</text>

            {/* Row 2 Text */}
            <text x={colWidths[0]/2} y={rowHeight*2.5} dominantBaseline="middle" textAnchor="middle" fontSize="12">2</text>
            <text x={colWidths[0] + colWidths[1]/2} y={rowHeight*2.5} dominantBaseline="middle" textAnchor="middle" fontSize="12">{comp?.backupRingPartNo}</text>
            <text x={colWidths[0] + colWidths[1] + colWidths[2]/2} y={rowHeight*2.5} dominantBaseline="middle" textAnchor="middle" fontSize="12">バックアップリング</text>
            <text x={colWidths[0] + colWidths[1] + colWidths[2] + 10} y={rowHeight*2.5} dominantBaseline="middle" textAnchor="start" fontSize="11">{brDimStr}</text>
            <text x={colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4]/2} y={rowHeight*2.5} dominantBaseline="middle" textAnchor="middle" fontSize="11">{comp?.backupRingMaterial}</text>
            
            {/* --- GRID LINES (Explicitly drawn for PDF safety) --- */}
            {/* Outer Box */}
            <rect x="0" y="0" width={totalWidth} height={rowHeight * 3} fill="none" stroke="black" strokeWidth="1"/>
            
            {/* Horizontal Lines */}
            <line x1="0" y1={rowHeight} x2={totalWidth} y2={rowHeight} stroke="black" strokeWidth="1" />
            <line x1="0" y1={rowHeight*2} x2={totalWidth} y2={rowHeight*2} stroke="black" strokeWidth="1" />

            {/* Vertical Lines - Explicitly drawing dividers */}
            {colWidths.map((w, i) => {
               // Skip first line x=0 as it is covered by the Outer Box rect
               if (i === 0) return null;
               const x = colWidths.slice(0, i).reduce((a, b) => a + b, 0);
               return <line key={i} x1={x} y1={0} x2={x} y2={rowHeight * 3} stroke="black" strokeWidth="1" />;
            })}
        </g>
     );
  };

  // -------------------------------------------------------------------------
  // STANDALONE TABLE (Backup Ring)
  // -------------------------------------------------------------------------
  const renderStandaloneBRTable = () => {
    return (
        <g transform="translate(450, 50)">
            <rect x="0" y="0" width="320" height="25" fill="#f3f4f6" stroke="none" />
            <rect x="0" y="25" width="320" height="35" fill="white" stroke="none" />
            <rect x="0" y="0" width="320" height="60" fill="none" stroke="black" strokeWidth="1" />
            <line x1="0" y1="25" x2="320" y2="25" stroke="black" strokeWidth="1" />
            <line x1="110" y1="0" x2="110" y2="60" stroke="black" strokeWidth="1" />
            <line x1="180" y1="0" x2="180" y2="60" stroke="black" strokeWidth="1" />
            <line x1="250" y1="0" x2="250" y2="60" stroke="black" strokeWidth="1" />
            <text x="55" y="12.5" dominantBaseline="middle" textAnchor="middle" fontSize="12" fontWeight="bold">P/N</text>
            <text x="145" y="12.5" dominantBaseline="middle" textAnchor="middle" fontSize="12" fontWeight="bold">φD</text>
            <text x="215" y="12.5" dominantBaseline="middle" textAnchor="middle" fontSize="12" fontWeight="bold">φd</text>
            <text x="285" y="12.5" dominantBaseline="middle" textAnchor="middle" fontSize="12" fontWeight="bold">T</text>
            <text x="55" y="42.5" dominantBaseline="middle" textAnchor="middle" fontSize="12">{data.partNo}</text>
            <text x="145" y="42.5" dominantBaseline="middle" textAnchor="middle" fontSize="12">{formatTolerance(data.backupRingDims?.od, data.backupRingDims?.odTolPlus, data.backupRingDims?.odTolMinus)}</text>
            <text x="215" y="42.5" dominantBaseline="middle" textAnchor="middle" fontSize="12">{formatTolerance(data.backupRingDims?.id, data.backupRingDims?.idTolPlus, data.backupRingDims?.idTolMinus)}</text>
            <text x="285" y="42.5" dominantBaseline="middle" textAnchor="middle" fontSize="12">{formatTolerance(data.backupRingDims?.t, data.backupRingDims?.tTolPlus, data.backupRingDims?.tTolMinus)}</text>
        </g>
    );
  };

  return (
    <div className="w-full flex justify-center py-8 bg-gray-200 overflow-auto">
      <div 
        ref={ref}
        id="drawing-paper"
        className="bg-white shadow-lg relative flex-shrink-0"
        style={{ width: '1123px', height: '794px' }} 
      >
        <div className="absolute inset-4 border-2 border-black" />

        <defs>
           <pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" style={{stroke: 'black', strokeWidth: 0.5}} />
          </pattern>
           <pattern id="hatchBr" patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" style={{stroke: 'black', strokeWidth: 0.5}} />
          </pattern>
           <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
             <path d="M0,0 L0,6 L9,3 z" fill="black" />
           </marker>
        </defs>

        <div className="absolute top-8 w-full text-center">
          <h1 className="text-2xl font-bold tracking-widest underline">
            【 {data.partType === 'O-Ring' ? 'Oリング' : data.partType === 'Backup Ring' ? 'バックアップリング' : '複合品 納入図'} 】
          </h1>
        </div>

        <div className="absolute top-6 left-6 text-sm">
           作成日: {data.createdAt.split('T')[0]}
        </div>

        <svg width="100%" height="100%" viewBox="0 0 800 500" className="absolute top-0 left-0 pointer-events-none">
            {/* Standalone O-Ring */}
            {data.partType === 'O-Ring' && (
                <g>
                    {renderORingFrontView(250, 250, 1.0)}
                    {renderORingSectionView(550, 250, 1.0)}
                </g>
            )}
            
            {/* Standalone Backup Ring */}
            {data.partType === 'Backup Ring' && (
                <g>
                    {renderStandaloneBRTable()}
                    {renderBRFrontView(200, 250, 1.0)}
                    {renderBRSideView(520, 250, 1.0)}
                </g>
            )}
            
            {/* Composite Layout */}
            {data.partType === 'Composite' && (
                <g>
                    {/* Row 1: Table */}
                    {renderCompositeTable()}

                    {/* Row 2: Grid Layout (Horizontal Arrangement within columns) */}
                    {/* Y = 300 to clear the table (Table ends at ~150) */}
                    
                    {/* Left Col: O-Ring */}
                    <g>
                        {/* Front View */}
                        {renderORingFrontView(150, 300, 0.6)}
                        {/* Section View (Moved to Right of Front View) */}
                        {renderORingSectionView(300, 300, 0.6)}
                    </g>
                    
                    {/* Right Col: Backup Ring */}
                    <g>
                        {/* Front View */}
                        {renderBRFrontView(500, 300, 0.6)}
                        {/* Side View (Moved to Right of Front View) */}
                        {renderBRSideView(650, 300, 0.6)}
                    </g>
                </g>
            )}
        </svg>

        {/* NOTES AREA - Moved further down to prevent overlap */}
        <div className="absolute bottom-24 left-10 text-sm">
            <h3 className="font-bold underline mb-1">注記</h3>
            <ul className="list-disc list-inside space-y-1">
                <li>寸法単位: mm</li>
                <li>指示なき公差は JIS B 0405 中級 (m) とする。</li>
                {data.note && <li>{data.note}</li>}
                
                {/* Composite Notes */}
                {data.partType === 'Composite' && data.backupRingDims?.shape === 'Spiral' && (
                    <li>スパイラル角度: 30°±5° (バックアップリング)</li>
                )}
                 {data.partType === 'Composite' && data.backupRingDims?.shape === 'Bias Cut' && (
                    <li>バイアスカット角度: {formatTolerance(data.backupRingDims.angle || 22, data.backupRingDims.angleTolPlus, data.backupRingDims.angleTolMinus, '°')} (バックアップリング)</li>
                )}

                {/* Standalone Notes */}
                {data.partType === 'Backup Ring' && data.backupRingDims?.shape === 'Bias Cut' && (
                    <li>バイアスカット角度: {formatTolerance(data.backupRingDims.angle || 22, data.backupRingDims.angleTolPlus, data.backupRingDims.angleTolMinus, '°')}</li>
                )}
                {data.partType === 'Backup Ring' && data.backupRingDims?.shape === 'Spiral' && (
                    <li>スパイラル角度: 30°±5°</li>
                )}
                {data.partType === 'Backup Ring' && data.backupRingDims?.shape === 'Endless' && (
                    <li>形状: エンドレス</li>
                )}
            </ul>
        </div>

        {/* TITLE BLOCK */}
        <div className="absolute bottom-6 right-6 border-2 border-black w-[400px]">
             <table className="w-full border-collapse text-sm">
                 <tbody>
                     <tr>
                         <td className="border border-black p-1 bg-gray-50 w-24 font-bold">図番</td>
                         <td className="border border-black p-1 font-mono text-lg font-bold">{data.drawingNo}</td>
                     </tr>
                     <tr>
                         <td className="border border-black p-1 bg-gray-50 font-bold">品名</td>
                         <td className="border border-black p-1">
                            {data.partType === 'Composite' ? 'O-Ring + Backup Ring Set' : data.partType}
                         </td>
                     </tr>
                     <tr>
                         <td className="border border-black p-1 bg-gray-50 font-bold">品番</td>
                         <td className="border border-black p-1">{data.partNo}</td>
                     </tr>
                     <tr>
                         <td className="border border-black p-1 bg-gray-50 font-bold">客先コード</td>
                         <td className="border border-black p-1">{data.customerCode}</td>
                     </tr>
                     <tr>
                         <td className="border border-black p-1 bg-gray-50 font-bold">材質 / 硬度</td>
                         <td className="border border-black p-1">
                             {data.partType === 'Composite' 
                               ? '別表参照' 
                               : `${data.material} / ${data.hardness}`}
                         </td>
                     </tr>
                     <tr>
                         <td className="border border-black p-1 bg-gray-50 font-bold">会社名</td>
                         <td className="border border-black p-1">{data.companyName}</td>
                     </tr>
                 </tbody>
             </table>
        </div>
      </div>
    </div>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';
