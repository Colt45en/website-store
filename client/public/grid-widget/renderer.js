// Grid Drawing Widget Renderer
const gridCanvas = document.getElementById('gridCanvas');
const drawingCanvas = document.getElementById('drawingCanvas');
const gridCtx = gridCanvas.getContext('2d');
const drawCtx = drawingCanvas.getContext('2d');

// Canvas state
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let points = [];
let currentMode = 'freehand';
let gridVisible = true;
let undoStack = [];

// Circle drawing state
let circleStartX = 0;
let circleStartY = 0;
let tempCircleRadius = 0;

// Line drawing state
let lineStartX = 0;
let lineStartY = 0;

// Settings
let currentColor = '#00FF00';
let currentWidth = 3;
let currentGridSize = 40;
let currentGridTheme = 'neon-green';
let currentCircleSize = 100;
let currentTextSize = 20;
let currentText = '';

function init() {
  resizeCanvases();
  setupEventListeners();
  applyGridTheme();
  drawGrid();
}

function resizeCanvases() {
  const container = document.querySelector('.canvas-container');
  const width = container.clientWidth;
  const height = container.clientHeight;
  gridCanvas.width = width; gridCanvas.height = height;
  drawingCanvas.width = width; drawingCanvas.height = height;
}

function setupEventListeners() {
  window.addEventListener('resize', () => {
    const saved = drawingCanvas.toDataURL();
    resizeCanvases();
    drawGrid();
    const img = new Image();
    img.onload = () => { drawCtx.drawImage(img, 0, 0); };
    img.src = saved;
  });

  document.getElementById('freehandMode').addEventListener('click', () => setMode('freehand'));
  document.getElementById('circleMode').addEventListener('click', () => setMode('circle'));
  document.getElementById('lineMode').addEventListener('click', () => setMode('line'));
  document.getElementById('textMode').addEventListener('click', () => setMode('text'));
  document.getElementById('eraserMode').addEventListener('click', () => setMode('eraser'));

  document.getElementById('gridSize').addEventListener('change', (e) => { currentGridSize = parseInt(e.target.value); drawGrid(); });
  document.getElementById('gridTheme').addEventListener('change', (e) => { currentGridTheme = e.target.value; applyGridTheme(); drawGrid(); });
  document.getElementById('toggleGrid').addEventListener('click', toggleGrid);

  document.getElementById('strokeWidth').addEventListener('input', (e) => { currentWidth = parseInt(e.target.value); document.getElementById('strokeWidthValue').textContent = currentWidth; });
  document.getElementById('colorPicker').addEventListener('input', (e) => { currentColor = e.target.value; });
  document.getElementById('circleSize').addEventListener('input', (e) => { currentCircleSize = parseInt(e.target.value); document.getElementById('circleSizeValue').textContent = currentCircleSize; });
  document.getElementById('textSize').addEventListener('input', (e) => { currentTextSize = parseInt(e.target.value); document.getElementById('textSizeValue').textContent = currentTextSize; });
  document.getElementById('textInput').addEventListener('input', (e) => { currentText = e.target.value; });

  document.getElementById('clearCanvas').addEventListener('click', clearCanvas);
  document.getElementById('saveDrawing').addEventListener('click', saveDrawing);
  document.getElementById('undoBtn').addEventListener('click', undo);

  drawingCanvas.addEventListener('mousedown', handleMouseDown);
  drawingCanvas.addEventListener('mousemove', handleMouseMove);
  drawingCanvas.addEventListener('mouseup', handleMouseUp);
  drawingCanvas.addEventListener('mouseout', handleMouseUp);
}

function applyGridTheme() {
  const container = document.querySelector('.canvas-container');
  container.className = 'canvas-container ' + currentGridTheme;
}

function drawGrid() {
  if (!gridVisible) return;
  gridCtx.clearRect(0,0,gridCanvas.width,gridCanvas.height);
  const gridSize = currentGridSize; const width = gridCanvas.width; const height = gridCanvas.height;
  gridCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-color') || 'rgba(57,255,20,0.5)';
  gridCtx.lineWidth = 1;
  for (let x=0;x<=width;x+=gridSize){ gridCtx.beginPath(); gridCtx.moveTo(x,0); gridCtx.lineTo(x,height); gridCtx.stroke(); }
  for (let y=0;y<=height;y+=gridSize){ gridCtx.beginPath(); gridCtx.moveTo(0,y); gridCtx.lineTo(width,y); gridCtx.stroke(); }
}

function toggleGrid(){ gridVisible = !gridVisible; const btn=document.getElementById('toggleGrid'); btn.textContent = gridVisible ? 'Hide Grid' : 'Show Grid'; if (gridVisible) drawGrid(); else gridCtx.clearRect(0,0,gridCanvas.width,gridCanvas.height); }

function setMode(mode){ currentMode = mode; document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active')); const el=document.getElementById(mode+'Mode'); if(el) el.classList.add('active'); document.getElementById('circleSizeContainer').style.display = mode==='circle' ? 'block' : 'none'; document.getElementById('textSizeContainer').style.display = mode==='text' ? 'block' : 'none'; document.getElementById('textInputContainer').style.display = mode==='text' ? 'block' : 'none'; switch(mode){ case 'freehand': drawingCanvas.style.cursor='crosshair'; break; case 'circle': drawingCanvas.style.cursor='crosshair'; break; case 'line': drawingCanvas.style.cursor='crosshair'; break; case 'text': drawingCanvas.style.cursor='text'; break; case 'eraser': drawingCanvas.style.cursor='url("assets/eraser-cursor.png"), auto'; break; } }

function handleMouseDown(e){ saveState(); isDrawing=true; const rect=drawingCanvas.getBoundingClientRect(); const x=e.clientX-rect.left; const y=e.clientY-rect.top; lastX=x; lastY=y; switch(currentMode){ case 'freehand': drawCtx.beginPath(); drawCtx.moveTo(x,y); points=[{x,y}]; break; case 'circle': circleStartX=x; circleStartY=y; break; case 'line': lineStartX=x; lineStartY=y; break; case 'text': drawText(x,y); break; case 'eraser': drawCtx.globalCompositeOperation='destination-out'; drawCtx.beginPath(); drawCtx.arc(x,y,currentWidth*3,0,Math.PI*2); drawCtx.fill(); break; } }

function handleMouseMove(e){ if(!isDrawing) return; const rect=drawingCanvas.getBoundingClientRect(); const x=e.clientX-rect.left; const y=e.clientY-rect.top; switch(currentMode){ case 'freehand': drawFreehand(x,y); break; case 'circle': drawTempCircle(x,y); break; case 'line': drawTempLine(x,y); break; case 'eraser': drawEraser(x,y); break; } lastX=x; lastY=y; }

function handleMouseUp(){ if(!isDrawing) return; isDrawing=false; switch(currentMode){ case 'freehand': drawCtx.stroke(); break; case 'circle': finalizeTempDrawing(); drawActualCircle(); break; case 'line': finalizeTempDrawing(); drawActualLine(); break; case 'eraser': drawCtx.globalCompositeOperation='source-over'; break; } }

function drawFreehand(x,y){ drawCtx.strokeStyle = currentColor; drawCtx.lineWidth = currentWidth; drawCtx.lineCap='round'; drawCtx.lineJoin='round'; drawCtx.lineTo(x,y); drawCtx.stroke(); drawCtx.beginPath(); drawCtx.moveTo(x,y); points.push({x,y}); }

function drawTempCircle(x,y){ const dx=x-circleStartX; const dy=y-circleStartY; tempCircleRadius=Math.sqrt(dx*dx + dy*dy); finalizeTempDrawing(); drawCtx.strokeStyle=currentColor; drawCtx.lineWidth=currentWidth; drawCtx.beginPath(); drawCtx.arc(circleStartX,circleStartY,tempCircleRadius,0,Math.PI*2); drawCtx.stroke(); }

function drawActualCircle(){ drawCtx.strokeStyle=currentColor; drawCtx.lineWidth=currentWidth; drawCtx.beginPath(); drawCtx.arc(circleStartX,circleStartY,tempCircleRadius,0,Math.PI*2); drawCtx.stroke(); }

function drawTempLine(x,y){ finalizeTempDrawing(); drawCtx.strokeStyle=currentColor; drawCtx.lineWidth=currentWidth; drawCtx.beginPath(); drawCtx.moveTo(lineStartX,lineStartY); drawCtx.lineTo(x,y); drawCtx.stroke(); }

function drawActualLine(){ drawCtx.strokeStyle=currentColor; drawCtx.lineWidth=currentWidth; drawCtx.beginPath(); drawCtx.moveTo(lineStartX,lineStartY); drawCtx.lineTo(lastX,lastY); drawCtx.stroke(); }

function drawText(x,y){ if(!currentText) return; drawCtx.fillStyle=currentColor; drawCtx.font = `${currentTextSize}px Arial`; drawCtx.textAlign='center'; drawCtx.fillText(currentText,x,y); }

function drawEraser(x,y){ drawCtx.globalCompositeOperation='destination-out'; drawCtx.beginPath(); drawCtx.moveTo(lastX,lastY); drawCtx.lineTo(x,y); drawCtx.lineWidth=currentWidth*5; drawCtx.lineCap='round'; drawCtx.stroke(); }

function finalizeTempDrawing(){ /* placeholder for future layering */ }

function saveState(){ undoStack.push(drawingCanvas.toDataURL()); if(undoStack.length>20) undoStack.shift(); }

function undo(){ if(undoStack.length===0) return; const previous=undoStack.pop(); const img=new Image(); img.onload=()=>{ drawCtx.clearRect(0,0,drawingCanvas.width,drawingCanvas.height); drawCtx.drawImage(img,0,0); }; img.src=previous; }

function clearCanvas(){ saveState(); drawCtx.clearRect(0,0,drawingCanvas.width,drawingCanvas.height); }

function saveDrawing(){ const combined=document.createElement('canvas'); combined.width = drawingCanvas.width; combined.height = drawingCanvas.height; const cctx = combined.getContext('2d'); cctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-bg') || '#0f2b14'; cctx.fillRect(0,0,combined.width,combined.height); if(gridVisible) cctx.drawImage(gridCanvas,0,0); cctx.drawImage(drawingCanvas,0,0); const dataURL = combined.toDataURL('image/png'); const link = document.createElement('a'); link.download='grid-drawing.png'; link.href=dataURL; link.click(); }

// Initialize on DOM ready
window.addEventListener('DOMContentLoaded', init);
