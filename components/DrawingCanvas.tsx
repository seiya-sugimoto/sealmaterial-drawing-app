
import React, { forwardRef } from 'react';
import { DrawingData } from '../types';

interface DrawingCanvasProps {
  data: DrawingData;
}

// Helper to format dimension text with tolerances
const formatTolerance = (val: number | undefined, plus?: number | undefined, minus?: number | undefined, unit: string = ''): string => {
  if (val === undefined) return ''; // Should be caught by validation, but safe fallback
  
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
  // Arrow head calculation
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrow1_1x = x1 + arrowSize * Math.cos(angle + Math.PI / 6);
  const arrow1_1y = y1 + arrowSize * Math.sin(angle + Math.PI / 6);
  const arrow1_2x = x1 + arrowSize * Math.cos(angle - Math.PI / 6);
  const arrow1_2y = y1 + arrowSize * Math.sin(angle - Math.PI / 6);

  const arrow2_1x = x2 - arrowSize * Math.cos(angle + Math.PI / 6);
  const arrow2_1y = y2 - arrowSize * Math.sin(angle + Math.PI / 6);
  const arrow2_2x = x2 - arrowSize * Math.cos(angle - Math.PI / 6);
  const arrow2_2y = y2 - arrowSize * Math.sin(angle - Math.PI / 6);

  // Text position
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const textX = vertical ? midX + textOffset : midX;
  const textY = vertical ? midY : midY - textOffset / 2;

  return (
    <g className="stroke-black fill-black" strokeWidth="1">
      {/* Main Line */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {/* Extension lines usually handled by caller, but simple arrows here */}
      <path d={`M${x1},${y1} L${arrow1_1x},${arrow1_1y} M${x1},${y1} L${arrow1_2x},${arrow1_2y}`} fill="none" />
      <path d={`M${x2},${y2} L${arrow2_1x},${arrow2_1y} M${x2},${y2} L${arrow2_2x},${arrow2_2y}`} fill="none" />
      {/* Text */}
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
  // O-RING RENDERER
  // -------------------------------------------------------------------------
  const renderORing = () => {
    if (!data.oRingDims) return null;
    // Default to 0 for rendering calculations if undefined, though text will be handled by formatTolerance
    const { id = 0, idTolPlus, idTolMinus, w = 0, wTolPlus, wTolMinus } = data.oRingDims;

    // ViewBox handling: Center is 400, 300.
    // We normalize visualization size regardless of real size to fit the paper.
    const cx = 250;
    const cy = 250;
    const baseRadius = 100; // Visual radius
    const innerRadius = baseRadius;
    const thicknessScale = (w / (id || 1)) * baseRadius * 3; // Avoid divide by zero
    const visualThickness = Math.max(15, Math.min(thicknessScale, 40)); // Clamp visual thickness
    const outerRadius = innerRadius + visualThickness;

    // Section view (Capsule) parameters
    const sectionX = 550;
    const sectionY = 250;
    const sectionHeight = 100; // Arbitrary visual height for the loop
    const sectionWidth = visualThickness; 

    return (
      <svg width="100%" height="100%" viewBox="0 0 800 500" className="absolute top-0 left-0">
        <defs>
           <pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" style={{stroke: 'black', strokeWidth: 0.5}} />
          </pattern>
        </defs>

        {/* --- FRONT VIEW (Left) --- */}
        <g id="front-view">
          {/* Center Lines */}
          <line x1={cx - outerRadius - 40} y1={cy} x2={cx + outerRadius + 40} y2={cy} stroke="black" strokeDasharray="10,5" strokeWidth="0.5" />
          <line x1={cx} y1={cy - outerRadius - 40} x2={cx} y2={cy + outerRadius + 40} stroke="black" strokeDasharray="10,5" strokeWidth="0.5" />

          {/* O-Ring Circles */}
          <circle cx={cx} cy={cy} r={outerRadius} fill="none" stroke="black" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={innerRadius} fill="none" stroke="black" strokeWidth="2" />

          {/* Dimension: ID */}
          {/* Draw horizontal dimension line inside the inner circle */}
          <DimensionLine 
            x1={cx - innerRadius} y1={cy} 
            x2={cx + innerRadius} y2={cy} 
            text={`ID ${formatTolerance(id, idTolPlus, idTolMinus)}`} 
            textOffset={20}
          />
        </g>

        {/* --- SECTION VIEW (Right) --- */}
        <g id="section-view">
          {/* We draw a capsule representing the cross section cut */}
          {/* Top circle */}
          <circle cx={sectionX} cy={sectionY - sectionHeight/2} r={sectionWidth/2} fill="url(#hatch)" stroke="black" strokeWidth="2" />
          {/* Bottom circle */}
          <circle cx={sectionX} cy={sectionY + sectionHeight/2} r={sectionWidth/2} fill="url(#hatch)" stroke="black" strokeWidth="2" />
          
          {/* Connecting lines for context (showing it's a ring loop) - simplified as dashed */}
           <path 
            d={`M${sectionX - sectionWidth/2},${sectionY - sectionHeight/2} L${sectionX - sectionWidth/2},${sectionY + sectionHeight/2}`} 
            stroke="black" strokeWidth="1" fill="none"
           />
           <path 
            d={`M${sectionX + sectionWidth/2},${sectionY - sectionHeight/2} L${sectionX + sectionWidth/2},${sectionY + sectionHeight/2}`} 
            stroke="black" strokeWidth="1" fill="none"
           />

           {/* Dimension: W (Cross section width) */}
           <DimensionLine 
             x1={sectionX - sectionWidth/2} y1={sectionY} 
             x2={sectionX + sectionWidth/2} y2={sectionY} 
             text={`W ${formatTolerance(w, wTolPlus, wTolMinus)}`} 
             textOffset={30} // Push text up
           />
           
           {/* Label */}
           <text x={sectionX} y={sectionY + sectionHeight/2 + 50} textAnchor="middle" className="font-bold text-sm">断面図</text>
        </g>
      </svg>
    );
  };

  // -------------------------------------------------------------------------
  // BACKUP RING RENDERER
  // -------------------------------------------------------------------------
  const renderBackupRing = () => {
    if (!data.backupRingDims) return null;
    const { 
      od = 0, odTolPlus, odTolMinus, 
      id = 0, idTolPlus, idTolMinus, 
      t = 0, tTolPlus, tTolMinus, 
      shape,
      angle = 22, angleTolPlus, angleTolMinus
    } = data.backupRingDims;

    // View Config
    const cx = 200; // Front view center
    const cy = 250;
    
    // Front View Visuals
    const baseRadius = 80;
    // Calculate visual thickness based on real ratio, clamped
    const radialWidth = (od - id) / 2;
    const tScale = (radialWidth / (id || 1)) * baseRadius * 4;
    const visualWidth = Math.max(10, Math.min(tScale, 30)); 
    
    const innerRadius = baseRadius;
    const outerRadius = baseRadius + visualWidth;

    // Side View / Shape Detail Config (Right Side)
    const sideX = 520; // Shifted left slightly to make room for Detail A
    const sideY = 250;
    const sideHeight = 120; // Represents the developed length or just a segment
    const sideWidth = 40;   // Represents Thickness T visually
    
    // Hatch pattern ID
    const hatchId = "hatchBr";

    // Angle text logic
    const angleText = angle ? formatTolerance(angle, angleTolPlus, angleTolMinus, '°') : '';

    return (
      <svg width="100%" height="100%" viewBox="0 0 800 500" className="absolute top-0 left-0">
         <defs>
           <pattern id={hatchId} patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" style={{stroke: 'black', strokeWidth: 0.5}} />
          </pattern>
        </defs>

        {/* --- FRONT VIEW (Common + Spiral Cut) --- */}
        <g id="br-front-view">
           {/* Center Lines */}
           <line x1={cx - outerRadius - 30} y1={cy} x2={cx + outerRadius + 30} y2={cy} stroke="black" strokeDasharray="10,5" strokeWidth="0.5" />
           <line x1={cx} y1={cy - outerRadius - 30} x2={cx} y2={cy + outerRadius + 30} stroke="black" strokeDasharray="10,5" strokeWidth="0.5" />

           {/* Circles */}
           <circle cx={cx} cy={cy} r={outerRadius} fill="none" stroke="black" strokeWidth="2" />
           <circle cx={cx} cy={cy} r={innerRadius} fill="none" stroke="black" strokeWidth="2" />
           
           {/* Spiral Cut on Front View */}
           {shape === 'Spiral' && (
             <g>
               {/* 'Erase' a small section at the top using a white stroke or rect */}
               {/* Using a white line to mask the circle strokes */}
               <line x1={cx} y1={cy - outerRadius - 2} x2={cx} y2={cy - innerRadius + 2} stroke="white" strokeWidth="8" />
               {/* Draw the cut diagonal */}
               <line x1={cx - 3} y1={cy - outerRadius - 1} x2={cx + 3} y2={cy - innerRadius + 1} stroke="black" strokeWidth="1.5" />
             </g>
           )}

           <text x={cx} y={cy + outerRadius + 50} textAnchor="middle" className="font-bold text-sm">
             {shape === 'Spiral' ? 'スパイラル (正面図)' : '正面図'}
           </text>
        </g>

        {/* --- SIDE / SHAPE VIEW (Varies by Shape) --- */}
        <g id="br-side-view">
            
            {/* Draw Thickness T dimension common for all */}
            <DimensionLine 
                x1={sideX - sideWidth/2} y1={sideY - sideHeight/2 - 20} 
                x2={sideX + sideWidth/2} y2={sideY - sideHeight/2 - 20} 
                text={`T ${formatTolerance(t, tTolPlus, tTolMinus)}`} textOffset={-15}
            />

            {/* Shape Logic */}
            {(shape === 'Endless' || shape === 'Spiral') && (
                <g>
                    {/* Simple Rectangle (Endless Style) */}
                    <rect x={sideX - sideWidth/2} y={sideY - sideHeight/2} width={sideWidth} height={sideHeight} 
                          fill={`url(#${hatchId})`} stroke="black" strokeWidth="2" />
                    
                    {/* Label */}
                    <text x={sideX} y={sideY + sideHeight/2 + 30} textAnchor="middle" className="font-bold text-sm">
                       {shape === 'Spiral' ? 'スパイラル (側面図)' : 'エンドレス'}
                    </text>

                    {/* Indicator Arrow for Spiral Detail View */}
                    {shape === 'Spiral' && (
                       <g>
                         {/* Arrow pointing to the side view */}
                         <text x={sideX + sideWidth + 10} y={sideY + 5} className="font-bold text-lg">A</text>
                         <path d={`M${sideX + sideWidth + 5},${sideY} L${sideX + sideWidth/2 + 5},${sideY}`} stroke="black" strokeWidth="1" markerEnd="url(#arrow)" />
                         <path d={`M${sideX + sideWidth + 5},${sideY} L${sideX + sideWidth/2 + 5},${sideY}`} stroke="black" strokeWidth="1" />
                         {/* Simple arrow head manually since defs might be tricky in partial updates */}
                         <path d={`M${sideX + sideWidth/2 + 10},${sideY - 3} L${sideX + sideWidth/2 + 2},${sideY} L${sideX + sideWidth/2 + 10},${sideY + 3}`} fill="black" />
                       </g>
                    )}
                </g>
            )}

            {shape === 'Bias Cut' && (
                <g>
                   {/* Top part */}
                   <path d={`M${sideX - sideWidth/2},${sideY - sideHeight/2} L${sideX + sideWidth/2},${sideY - sideHeight/2} L${sideX + sideWidth/2},${sideY - 10} L${sideX - sideWidth/2},${sideY + 10} Z`} 
                         fill={`url(#${hatchId})`} stroke="black" strokeWidth="2" />
                   
                   {/* Bottom part */}
                   <path d={`M${sideX - sideWidth/2},${sideY + 20} L${sideX + sideWidth/2},${sideY} L${sideX + sideWidth/2},${sideY + sideHeight/2} L${sideX - sideWidth/2},${sideY + sideHeight/2} Z`} 
                         fill={`url(#${hatchId})`} stroke="black" strokeWidth="2" />

                   {/* Angle Dimension */}
                   <line x1={sideX + sideWidth/2} y1={sideY} x2={sideX + sideWidth/2 + 30} y2={sideY} stroke="black" strokeWidth="0.5" strokeDasharray="2,2"/>
                   <text x={sideX + sideWidth + 10} y={sideY + 20} className="text-xs">{angleText}</text>

                   <text x={sideX} y={sideY + sideHeight/2 + 30} textAnchor="middle" className="font-bold text-sm">バイアスカット</text>
                </g>
            )}
            
            {(shape !== 'Endless' && shape !== 'Spiral' && shape !== 'Bias Cut') && (
              <text x={sideX} y={sideY + sideHeight/2 + 50} textAnchor="middle" className="font-bold text-sm text-gray-500">(側面図)</text>
            )}
        </g>

        {/* --- DETAIL VIEW A (Spiral Only) --- */}
        {shape === 'Spiral' && (
           <g id="detail-view-a" transform="translate(680, 250)">
               {/* 1. The Plate Rectangle */}
               {/* Visualizing the end face as a single plate */}
               <rect x="-30" y="-60" width="60" height="120" fill="white" stroke="black" strokeWidth="2" />
               
               {/* 2. The Diagonal Cut Line */}
               {/* Diagonal approx 30 degrees. tan(30) = 0.577. 60 width * 0.577 = 34.6 height diff */}
               {/* Drawing from (-30, 20) to (30, -15) - approx 30 deg slope */}
               <line x1="-30" y1="20" x2="30" y2="-15" stroke="black" strokeWidth="2" />

               {/* 3. Angle Dimension */}
               {/* Horizontal reference line from the start point of diagonal at left edge */}
               <line x1="-30" y1="20" x2="10" y2="20" stroke="black" strokeWidth="0.5" strokeDasharray="4,2" />
               
               {/* Arc representing the angle between horizontal and diagonal */}
               {/* Path M startX startY A rx ry rot largeArc sweep endX endY */}
               {/* Visual arc from horizontal down to diagonal */}
               <path d="M-5,20 A 25,25 0 0,1 -8,14" fill="none" stroke="black" strokeWidth="1" />
               
               {/* Arrow head for the arc */}
               {/* Manually drawn simple arrow head at end of arc */}
               <path d="M-8,14 L-5,11 M-8,14 L-11,12" stroke="black" strokeWidth="1" fill="none" />

               {/* Text Label */}
               <text x="5" y="15" className="text-xs">30°±5°</text>

               {/* Caption */}
               <text x="0" y="80" textAnchor="middle" className="font-bold text-sm">A部拡大図</text>
           </g>
        )}

        {/* --- TABLE for Backup Ring (Common) --- */}
        <foreignObject x={450} y={50} width={320} height={100}>
            <div className="text-xs">
                <table className="w-full border-collapse border border-black bg-white">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black px-1">P/N</th>
                            <th className="border border-black px-1">φD</th>
                            <th className="border border-black px-1">φd</th>
                            <th className="border border-black px-1">T</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-black px-1 text-center">{data.partNo}</td>
                            <td className="border border-black px-1 text-center">{formatTolerance(od, odTolPlus, odTolMinus)}</td>
                            <td className="border border-black px-1 text-center">{formatTolerance(id, idTolPlus, idTolMinus)}</td>
                            <td className="border border-black px-1 text-center">{formatTolerance(t, tTolPlus, tTolMinus)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </foreignObject>

      </svg>
    );
  };

  return (
    <div className="w-full flex justify-center py-8 bg-gray-200 overflow-auto">
      {/* A4 Paper Container - 297mm x 210mm approx ratio 1.414 */}
      {/* We use a fixed pixel size for the "Paper" to ensure PDF generation is consistent */}
      <div 
        ref={ref}
        id="drawing-paper"
        className="bg-white shadow-lg relative flex-shrink-0"
        style={{ width: '1123px', height: '794px' }} // A4 Landscape at 96 DPI approx
      >
        {/* Drawing Border */}
        <div className="absolute inset-4 border-2 border-black" />

        {/* Title Header */}
        <div className="absolute top-8 w-full text-center">
          <h1 className="text-2xl font-bold tracking-widest underline">
            【 {data.partType === 'O-Ring' ? 'Oリング' : 'バックアップリング'} 納入図 】
          </h1>
        </div>

        {/* Date (Top Left) */}
        <div className="absolute top-6 left-6 text-sm">
           作成日: {data.createdAt.split('T')[0]}
        </div>

        {/* MAIN DRAWING AREA */}
        <div className="absolute top-20 left-4 right-4 bottom-48">
            {data.partType === 'O-Ring' ? renderORing() : renderBackupRing()}
        </div>

        {/* NOTES AREA */}
        <div className="absolute bottom-40 left-10 text-sm">
            <h3 className="font-bold underline mb-1">注記</h3>
            <ul className="list-disc list-inside space-y-1">
                <li>寸法単位: mm</li>
                <li>指示なき公差は JIS B 0405 中級 (m) とする。</li>
                {data.note && <li>{data.note}</li>}
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

        {/* TITLE BLOCK (Bottom Right) */}
        <div className="absolute bottom-6 right-6 border-2 border-black w-[400px]">
             <table className="w-full border-collapse text-sm">
                 <tbody>
                     <tr>
                         <td className="border border-black p-1 bg-gray-50 w-24 font-bold">図番</td>
                         <td className="border border-black p-1 font-mono text-lg font-bold">{data.drawingNo}</td>
                     </tr>
                     <tr>
                         <td className="border border-black p-1 bg-gray-50 font-bold">品名</td>
                         <td className="border border-black p-1">{data.partType}</td>
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
                         <td className="border border-black p-1">{data.material} / {data.hardness}</td>
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
