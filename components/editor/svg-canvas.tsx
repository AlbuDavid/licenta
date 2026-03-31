/* components/editor/svg-canvas.tsx */
"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';

import { type Tool, type MaterialMode, type TextProps, type SelInfo } from './editor.config';
import { makeWoodCanvas, makeSlateCanvas }  from './utils/textures';
import { parseDXFtoFabric }                 from './utils/dxf';
import {
  loadSVGOntoCanvas, fabricImageFromURL, fabricLoadJSON,
  sendToBack, bringToFront, sendBackwards, bringForward, cloneObject,
  getScenePoint,
} from './utils/fabric-compat';
import { doAlign, type AlignType } from './utils/align';

import { Toolbar }     from './ui/Toolbar';
import { TextBar, AlignBar, StatusBar, ShortcutsPanel, SnapPanel, MaterialPanel } from './ui/EditorPanels';

// ─────────────────────────────────────────────────────────────────────────────

export default function SvgCanvas({
  svgContent,
  onSave,
}: {
  svgContent?: string | null;
  onSave?:    (svg: string) => void;
}) {
  // ── DOM refs ─────────────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasEl     = useRef<HTMLCanvasElement>(null);
  const gridEl       = useRef<HTMLCanvasElement>(null);
  const matOverlay   = useRef<HTMLDivElement>(null);   // material texture overlay
  const importRef    = useRef<HTMLInputElement>(null);

  // ── Canvas size (dynamic, full-screen) ──────────────────────────────────────
  const cvW = useRef(960);
  const cvH = useRef(620);

  // ── Fabric canvas ────────────────────────────────────────────────────────────
  const fcRef = useRef<fabric.Canvas | null>(null);
  const [fc, setFc] = useState<fabric.Canvas | null>(null);

  // ── Tool ─────────────────────────────────────────────────────────────────────
  const [tool, setToolState] = useState<Tool>('select');
  const toolRef = useRef<Tool>('select');
  const setTool = useCallback((t: Tool) => {
    toolRef.current = t;
    setToolState(t);
    const c = fcRef.current;
    if (c) c.defaultCursor = t === 'pan' ? 'grab' : t === 'select' ? 'default' : 'crosshair';
  }, []);

  // ── Draw state ───────────────────────────────────────────────────────────────
  const drawing    = useRef(false);
  const drawStart  = useRef({ x: 0, y: 0 });
  const drawShape  = useRef<fabric.Object | null>(null);
  const ctrlRef    = useRef(false);
  const spaceRef   = useRef(false);
  const panning    = useRef(false);         // space / H-tool pan
  const midPanning = useRef(false);         // middle-mouse pan
  const lastPan    = useRef({ x: 0, y: 0 });

  // ── Last-clicked object (used as alignment anchor) ───────────────────────────
  const lastClickedRef = useRef<fabric.Object | null>(null);

  // ── Grid / snap ──────────────────────────────────────────────────────────────
  const [gridOn,   setGridOn]   = useState(true);
  const [gridSize, setGridSize] = useState(10);
  const [snapGrid, setSnapGrid] = useState(false);
  const [snapObj,  setSnapObj]  = useState(false);
  const gridOnR   = useRef(true);
  const gridSizeR = useRef(10);
  const snapGridR = useRef(false);
  const snapObjR  = useRef(false);
  useEffect(() => { gridOnR.current   = gridOn;   }, [gridOn]);
  useEffect(() => { gridSizeR.current = gridSize; }, [gridSize]);
  useEffect(() => { snapGridR.current = snapGrid; }, [snapGrid]);
  useEffect(() => { snapObjR.current  = snapObj;  }, [snapObj]);

  // ── History ──────────────────────────────────────────────────────────────────
  const hist    = useRef<string[]>([]);
  const histIdx = useRef(-1);
  const saveHist = useCallback(() => {
    const c = fcRef.current; if (!c) return;
    const json = JSON.stringify(c.toJSON());
    hist.current = hist.current.slice(0, histIdx.current + 1);
    hist.current.push(json);
    if (hist.current.length > 40) hist.current.shift();
    histIdx.current = hist.current.length - 1;
  }, []);

  // ── Material preview ─────────────────────────────────────────────────────────
  const [material, setMaterial] = useState<MaterialMode>('none');
  const [preview,  setPreview]  = useState(false);
  const savedColors = useRef<Map<fabric.Object, { fill: unknown; stroke: unknown }>>(new Map());

  // Update material overlay size whenever canvas resizes
  const updateMatOverlay = useCallback((mat: MaterialMode) => {
    if (!matOverlay.current) return;
    const el = matOverlay.current;
    if (mat === 'none') {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'block';
    el.style.width   = '100%';
    el.style.height  = '100%';
    if (mat === 'wood') {
      const wc  = makeWoodCanvas();
      el.style.backgroundImage  = `url(${wc.toDataURL()})`;
      el.style.backgroundSize   = 'cover';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.opacity = '1';
    } else {
      // slate
      const sc = makeSlateCanvas();
      el.style.backgroundImage  = `url(${sc.toDataURL()})`;
      el.style.backgroundSize   = 'cover';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.opacity = '1';
    }
  }, []);

  const applyPreview = useCallback((mat: MaterialMode) => {
    const c = fcRef.current; if (!c) return;

    // Restore previous colors
    savedColors.current.forEach((orig, obj) => obj.set({ fill: orig.fill, stroke: orig.stroke }));
    savedColors.current.clear();

    if (mat === 'none') {
      updateMatOverlay('none');
      setPreview(false); setMaterial('none');
      c.requestRenderAll();
      return;
    }

    // Save current colors & apply preview strokes
    c.getObjects().forEach(o => {
      savedColors.current.set(o, { fill: o.fill, stroke: o.stroke });
      const strokeColor = mat === 'slate' ? '#9CA3AF' : '#3B1A08';
      o.set({ fill: 'transparent', stroke: strokeColor });
    });

    updateMatOverlay(mat);
    setPreview(true); setMaterial(mat);
    c.requestRenderAll();
  }, [updateMatOverlay]);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [zoomPct, setZoomPct]   = useState(24);
  const [cur,     setCur]       = useState({ x: 0, y: 0 });
  const [selInfo, setSelInfo]   = useState<SelInfo | null>(null);
  const [tp,      setTp]        = useState<TextProps>({
    vis: false, font: 'Arial', size: 20, color: '#000000',
    bold: false, italic: false, under: false,
  });
  const [importUngroup, setImportUngroup] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSnapPanel, setShowSnapPanel] = useState(false);
  const [showMatPanel,  setShowMatPanel]  = useState(false);

  // ── Grid draw ─────────────────────────────────────────────────────────────────
  const drawGrid = useCallback(() => {
    const gel = gridEl.current;
    const canvas = fcRef.current;
    if (!gel || !canvas) return;
    const W = cvW.current, H = cvH.current;
    const ctx = gel.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (!gridOnR.current) return;

    const vpt   = canvas.viewportTransform!;
    const z     = vpt[0];
    const tx    = vpt[4], ty = vpt[5];
    const minor = gridSizeR.current;
    const major = minor * 10;

    // Always draw at least major lines — never disappear on scroll out
    const drawMinor = minor * z >= 1.5;
    const drawMajor = major * z >= 1.5;
    if (!drawMajor) {
      // too far out — nothing meaningful to draw
      return;
    }

    const sx = -tx / z, sy = -ty / z;
    const ex = sx + W / z, ey = sy + H / z;

    // Vertical lines
    const stepX = drawMinor ? minor : major;
    for (let x = Math.floor(sx / stepX) * stepX; x <= ex; x += stepX) {
      const px = x * z + tx;
      if (px < -1 || px > W + 1) continue;
      const isMaj = Math.abs(x % major) < 0.5;
      ctx.beginPath();
      ctx.strokeStyle = isMaj ? 'rgba(100,120,220,.40)' : 'rgba(160,170,220,.16)';
      ctx.lineWidth   = isMaj ? 1 : 0.5;
      ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
      if (isMaj && major * z > 40) {
        ctx.fillStyle = 'rgba(130,150,240,.8)';
        ctx.font = '9px monospace';
        ctx.fillText(`${(x / 10).toFixed(0)}`, px + 2, 10);
      }
    }

    // Horizontal lines
    const stepY = drawMinor ? minor : major;
    for (let y = Math.floor(sy / stepY) * stepY; y <= ey; y += stepY) {
      const py = y * z + ty;
      if (py < -1 || py > H + 1) continue;
      const isMaj = Math.abs(y % major) < 0.5;
      ctx.beginPath();
      ctx.strokeStyle = isMaj ? 'rgba(100,120,220,.40)' : 'rgba(160,170,220,.16)';
      ctx.lineWidth   = isMaj ? 1 : 0.5;
      ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
      if (isMaj && major * z > 40) {
        ctx.fillStyle = 'rgba(130,150,240,.8)';
        ctx.font = '9px monospace';
        ctx.fillText(`${(y / 10).toFixed(0)}`, 2, py - 2);
      }
    }
    // NO document border — removed per request
  }, []);

  // ── Fit all ───────────────────────────────────────────────────────────────────
  const fitAll = useCallback(() => {
    const c = fcRef.current; if (!c) return;
    const z = cvW.current / 4000;
    c.setZoom(z);
    if (c.viewportTransform) { c.viewportTransform[4] = 0; c.viewportTransform[5] = 0; }
    c.requestRenderAll(); drawGrid();
    setZoomPct(Math.round(z * 100));
  }, [drawGrid]);

  // ── Download SVG ──────────────────────────────────────────────────────────────
  const doDownload = useCallback(() => {
    const c = fcRef.current; if (!c) return;
    const name = (window.prompt('Numele fișierului SVG:', 'design') ?? 'design').replace(/\.svg$/i, '');
    const wasPreview = preview;
    const wasMat     = material;
    if (wasPreview) applyPreview('none');
    setTimeout(() => {
      const svg = c.toSVG();
      if (wasPreview) applyPreview(wasMat);
      const a = document.createElement('a');
      a.href     = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      a.download = name + '.svg';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      onSave?.(svg);
    }, 50);
  }, [preview, material, applyPreview, onSave]);

  // ── Apply text property ────────────────────────────────────────────────────────
  const applyText = useCallback((prop: string, val: string | number | boolean) => {
    const c = fcRef.current; if (!c) return;
    const o = c.getActiveObject();
    if (o && (o.type === 'i-text' || o.type === 'text')) {
      (o as fabric.IText).set(prop, val); c.requestRenderAll();
    }
  }, []);

  // ── Selection info sync ───────────────────────────────────────────────────────
  const syncSel = useCallback(() => {
    const c = fcRef.current; if (!c) return;
    const obj = c.getActiveObject();
    if (obj) {
      setSelInfo({
        x: +((obj.left ?? 0) / 10).toFixed(1),
        y: +((obj.top  ?? 0) / 10).toFixed(1),
        w: +((obj.width  ?? 0) * (obj.scaleX ?? 1) / 10).toFixed(1),
        h: +((obj.height ?? 0) * (obj.scaleY ?? 1) / 10).toFixed(1),
      });
      if (obj.type === 'i-text' || obj.type === 'text') {
        const t = obj as fabric.IText;
        setTp({
          vis: true,
          font:   (t.fontFamily as string)  || 'Arial',
          size:   (t.fontSize   as number)  || 20,
          color:  (t.fill       as string)  || '#000',
          bold:   t.fontWeight === 'bold',
          italic: t.fontStyle  === 'italic',
          under:  !!t.underline,
        });
      } else {
        setTp(p => ({ ...p, vis: false }));
      }
    } else {
      setSelInfo(null);
      setTp(p => ({ ...p, vis: false }));
    }
  }, []);

  // ── Group helpers (Fabric v6 compatible) ──────────────────────────────────────
  const groupSelected = useCallback(() => {
    const c = fcRef.current; if (!c) return;
    const a = c.getActiveObject();
    if (!a || a.type !== 'activeSelection') return;
    const sel  = a as fabric.ActiveSelection;
    const objs = sel.getObjects();
    const grp  = new fabric.Group(objs);
    c.discardActiveObject();
    objs.forEach(o => c.remove(o));
    c.add(grp);
    c.setActiveObject(grp);
    c.requestRenderAll(); saveHist();
  }, [saveHist]);

  const ungroupSelected = useCallback(() => {
    const c = fcRef.current; if (!c) return;
    const a = c.getActiveObject();
    if (!a || a.type !== 'group') return;
    const grp  = a as fabric.Group;
    const objs = grp.getObjects();
    c.remove(grp);
    objs.forEach(o => c.add(o));
    const sel = new fabric.ActiveSelection(objs, { canvas: c });
    c.setActiveObject(sel);
    c.requestRenderAll(); saveHist();
  }, [saveHist]);

  // ── 1. Resize observer — canvas always fills its container ───────────────────
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width < 10 || height < 10) return;
      cvW.current = width;
      cvH.current = height;
      const c = fcRef.current;
      if (c) {
        c.setDimensions({ width, height });
        c.requestRenderAll();
      }
      if (gridEl.current) {
        gridEl.current.width  = width;
        gridEl.current.height = height;
      }
      drawGrid();
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [drawGrid]);

  // ── 2. Initialise Fabric canvas ───────────────────────────────────────────────
  useEffect(() => {
    if (!canvasEl.current) return;
    const W = containerRef.current?.clientWidth  || 960;
    const H = containerRef.current?.clientHeight || 620;
    cvW.current = W; cvH.current = H;

    const canvas = new fabric.Canvas(canvasEl.current, {
      width: W, height: H,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      // Multi-select via Ctrl+click is native in Fabric — keep selection enabled
      selection: true,
    });

    // Initial zoom: fit 4000mm document
    const initZ = W / 4000;
    canvas.setZoom(initZ);
    setZoomPct(Math.round(initZ * 100));

    fcRef.current = canvas;
    setFc(canvas);
    saveHist();
    return () => { canvas.dispose(); fcRef.current = null; };
  }, [saveHist]);

  // ── 3. Grid after:render ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!fc) return;
    fc.on('after:render', drawGrid);
    return () => { fc.off('after:render', drawGrid as any); };
  }, [fc, drawGrid]);

  // ── 4. Load initial SVG ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!fc || !svgContent) return;
    loadSVGOntoCanvas(fc, svgContent, true, importUngroup).then(saveHist);
  }, [fc, svgContent]); // eslint-disable-line

  // ── 5. Canvas interaction events ──────────────────────────────────────────────
  useEffect(() => {
    if (!fc) return;

    // Wheel → zoom (or middle-mouse-pan is handled in native events below)
    const onWheel = (opt: any) => {
      opt.e.preventDefault();
      let z = fc.getZoom() * (0.999 ** opt.e.deltaY);
      z = Math.max(0.002, Math.min(50, z));
      fc.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), z);
      setZoomPct(Math.round(z * 100));
      drawGrid();
    };

    // Mouse move → pan / live draw / cursor position
    const onMove = (opt: any) => {
      const ptr = opt.e;
      // Get scene point (Fabric v6: getScenePoint, v5: getPointer)
      const p = getScenePoint(fc, ptr);
      setCur({ x: +(p.x / 10).toFixed(1), y: +(p.y / 10).toFixed(1) });

      if (panning.current || midPanning.current) {
        fc.relativePan(new fabric.Point(ptr.clientX - lastPan.current.x, ptr.clientY - lastPan.current.y));
        lastPan.current = { x: ptr.clientX, y: ptr.clientY };
        drawGrid(); return;
      }

      if (!drawing.current || !drawShape.current) return;
      const s = drawStart.current;
      let w = p.x - s.x, h = p.y - s.y;
      if (ctrlRef.current) { const m = Math.max(Math.abs(w), Math.abs(h)); w = w < 0 ? -m : m; h = h < 0 ? -m : m; }
      const t = toolRef.current;
      if (t === 'rect')    (drawShape.current as fabric.Rect).set({ left: w < 0 ? s.x + w : s.x, top: h < 0 ? s.y + h : s.y, width: Math.abs(w), height: Math.abs(h) });
      if (t === 'ellipse') (drawShape.current as fabric.Ellipse).set({ left: w < 0 ? s.x + w : s.x, top: h < 0 ? s.y + h : s.y, rx: Math.abs(w) / 2, ry: Math.abs(h) / 2 });
      if (t === 'line')    (drawShape.current as fabric.Line).set({ x2: p.x, y2: p.y });
      fc.requestRenderAll();
    };

    // Mouse down
    const onDown = (opt: any) => {
      const t   = toolRef.current;
      const btn = opt.e.button;

      // ── Middle mouse button → pan regardless of tool ──
      if (btn === 1) {
        opt.e.preventDefault();
        midPanning.current = true;
        lastPan.current    = { x: opt.e.clientX, y: opt.e.clientY };
        fc.selection = false; return;
      }

      // ── Space / H tool → pan ──
      if (spaceRef.current || t === 'pan') {
        panning.current    = true;
        lastPan.current    = { x: opt.e.clientX, y: opt.e.clientY };
        fc.selection = false; return;
      }

      // ── Track last clicked object (alignment anchor) ──
      if (opt.target) {
        lastClickedRef.current = opt.target;
      }

      // ── Select tool → let Fabric handle (incl. Ctrl+click multi-select) ──
      if (t === 'select') return;
      if (opt.target) return;  // clicked on object → don't draw

      // ── Drawing tools ──
      const p = getScenePoint(fc, opt.e);

      if (t === 'text') {
        const txt = new fabric.IText('Text', { left: p.x, top: p.y, fontFamily: 'Arial', fontSize: 20, fill: '#000' });
        fc.add(txt); fc.setActiveObject(txt); txt.enterEditing();
        drawing.current = false; saveHist(); setTool('select');
        fc.selection = true; fc.requestRenderAll(); return;
      }

      drawing.current    = true;
      drawStart.current  = { x: p.x, y: p.y };
      fc.selection = false;
      const sw = 1 / fc.getZoom();
      let shape: fabric.Object | null = null;
      if (t === 'rect')    shape = new fabric.Rect(   { left: p.x, top: p.y, width: 0, height: 0, fill: 'transparent', stroke: '#1a1a1a', strokeWidth: sw, selectable: false });
      if (t === 'ellipse') shape = new fabric.Ellipse({ left: p.x, top: p.y, rx: 0, ry: 0,        fill: 'transparent', stroke: '#1a1a1a', strokeWidth: sw, selectable: false });
      if (t === 'line')    shape = new fabric.Line(   [p.x, p.y, p.x, p.y], { stroke: '#1a1a1a', strokeWidth: sw, selectable: false });
      if (shape) { drawShape.current = shape; fc.add(shape); }
    };

    // Mouse up
    const onUp = (opt: any) => {
      // Middle mouse release
      if (opt.e.button === 1) { midPanning.current = false; fc.selection = true; return; }

      if (panning.current) { panning.current = false; fc.selection = true; return; }
      if (!drawing.current || !drawShape.current) return;

      drawing.current = false;
      const shape = drawShape.current, t = toolRef.current;
      const tiny =
        (t === 'rect'    && ((shape as fabric.Rect).width   ?? 0) < 3) ||
        (t === 'ellipse' && ((shape as fabric.Ellipse).rx   ?? 0) < 1) ||
        (t === 'line'    && Math.abs(((shape as fabric.Line).x2 ?? 0) - ((shape as fabric.Line).x1 ?? 0)) < 3);
      if (tiny) fc.remove(shape);
      else { shape.set({ selectable: true }); fc.setActiveObject(shape); saveHist(); }
      drawShape.current = null;
      fc.selection = true; setTool('select'); fc.requestRenderAll();
    };

    // Snap on move
    const onMoving = (e: any) => {
      const obj = e.target;
      if (snapGridR.current) {
        const gs = gridSizeR.current;
        obj.set({ left: Math.round((obj.left ?? 0) / gs) * gs, top: Math.round((obj.top ?? 0) / gs) * gs });
      }
      if (snapObjR.current) {
        const thresh = 8 / fc.getZoom();
        const oL = obj.left ?? 0, oT = obj.top ?? 0;
        const oW = (obj.width  ?? 0) * (obj.scaleX ?? 1);
        const oH = (obj.height ?? 0) * (obj.scaleY ?? 1);
        const oR = oL + oW, oB = oT + oH;
        for (const other of fc.getObjects()) {
          if (other === obj) continue;
          const bL = other.left ?? 0, bT = other.top ?? 0;
          const bR = bL + (other.width  ?? 0) * (other.scaleX ?? 1);
          const bB = bT + (other.height ?? 0) * (other.scaleY ?? 1);
          if      (Math.abs(oL - bL) < thresh) obj.set({ left: bL });
          else if (Math.abs(oR - bR) < thresh) obj.set({ left: bR - oW });
          else if (Math.abs(oR - bL) < thresh) obj.set({ left: bL - oW });
          else if (Math.abs(oL - bR) < thresh) obj.set({ left: bR });
          if      (Math.abs(oT - bT) < thresh) obj.set({ top: bT });
          else if (Math.abs(oB - bB) < thresh) obj.set({ top: bB - oH });
          else if (Math.abs(oB - bT) < thresh) obj.set({ top: bT - oH });
          else if (Math.abs(oT - bB) < thresh) obj.set({ top: bB });
        }
      }
    };

    // Prevent context menu on middle-click
    const onContextMenu = (opt: any) => {
      if (opt.e.button === 1) opt.e.preventDefault();
    };

    fc.on('mouse:wheel', onWheel);
    fc.on('mouse:move',  onMove);
    fc.on('mouse:down',  onDown);
    fc.on('mouse:up',    onUp);
    fc.on('object:moving',      onMoving);
    fc.on('contextmenu',        onContextMenu);
    fc.on('selection:created',  syncSel);
    fc.on('selection:updated',  syncSel);
    fc.on('selection:cleared',  syncSel);
    fc.on('object:modified',    () => { syncSel(); saveHist(); });

    return () => {
      fc.off('mouse:wheel',        onWheel        as any);
      fc.off('mouse:move',         onMove         as any);
      fc.off('mouse:down',         onDown         as any);
      fc.off('mouse:up',           onUp           as any);
      fc.off('object:moving',      onMoving       as any);
      fc.off('contextmenu',        onContextMenu  as any);
      fc.off('selection:created',  syncSel        as any);
      fc.off('selection:updated',  syncSel        as any);
      fc.off('selection:cleared',  syncSel        as any);
      fc.off('object:modified',    saveHist       as any);
    };
  }, [fc, drawGrid, saveHist, syncSel, setTool]);

  // ── Prevent browser middle-click scroll on the canvas wrapper ────────────────
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const stop = (e: MouseEvent) => { if (e.button === 1) e.preventDefault(); };
    el.addEventListener('mousedown', stop);
    el.addEventListener('auxclick',  stop);
    return () => { el.removeEventListener('mousedown', stop); el.removeEventListener('auxclick', stop); };
  }, []);

  // ── 6. Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    if (!fc) return;

    const kd = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (e.code === 'Space') { spaceRef.current = true; return; }
      ctrlRef.current = ctrl;

      if (!ctrl) {
        if (e.key === 'v' || e.key === 'F1') setTool('select');
        if (e.key === 'r' || e.key === 'F6') setTool('rect');
        if (e.key === 'e' || e.key === 'F7') setTool('ellipse');
        if (e.key === 'i')                   setTool('line');
        if (e.key === 't')                   setTool('text');
        if (e.key === 'h')                   setTool('pan');
        if (e.key === 'Escape') { setTool('select'); fc.selection = true; }
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !ctrl) {
        e.preventDefault();
        const a = fc.getActiveObjects();
        fc.discardActiveObject(); a.forEach(o => fc.remove(o));
        fc.requestRenderAll(); saveHist();
      }

      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key) && !ctrl) {
        e.preventDefault();
        const obj = fc.getActiveObject(); if (!obj) return;
        const d = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft')  obj.set({ left: (obj.left ?? 0) - d });
        if (e.key === 'ArrowRight') obj.set({ left: (obj.left ?? 0) + d });
        if (e.key === 'ArrowUp')    obj.set({ top:  (obj.top  ?? 0) - d });
        if (e.key === 'ArrowDown')  obj.set({ top:  (obj.top  ?? 0) + d });
        obj.setCoords(); fc.requestRenderAll(); saveHist();
      }

      const actObj = fc.getActiveObject();
      if (e.key === 'PageUp'   && actObj) sendBackwards(fc, actObj);
      if (e.key === 'PageDown' && actObj) bringForward(fc, actObj);
      if (e.key === 'Home'     && actObj) bringToFront(fc, actObj);
      if (e.key === 'End'      && actObj) sendToBack(fc, actObj);

      if (ctrl) {
        if (e.key === 'a') {
          e.preventDefault();
          const all = fc.getObjects();
          if (all.length) { const s = new fabric.ActiveSelection(all, { canvas: fc }); fc.setActiveObject(s); fc.requestRenderAll(); }
        }
        if (e.key === 'g') { e.preventDefault(); groupSelected(); }
        if (e.key === 'u') { e.preventDefault(); ungroupSelected(); }
        if (e.key === 'd') {
          e.preventDefault();
          const a = fc.getActiveObject(); if (!a) return;
          cloneObject(a).then((cloned) => {
            cloned.set({ left: (a.left ?? 0) + 20, top: (a.top ?? 0) + 20 });
            fc.add(cloned); fc.setActiveObject(cloned); fc.requestRenderAll(); saveHist();
          });
        }
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          if (histIdx.current <= 0) return;
          histIdx.current--;
          fabricLoadJSON(fc, JSON.parse(hist.current[histIdx.current])).then(() => fc.requestRenderAll());
        }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          if (histIdx.current >= hist.current.length - 1) return;
          histIdx.current++;
          fabricLoadJSON(fc, JSON.parse(hist.current[histIdx.current])).then(() => fc.requestRenderAll());
        }
        if (e.key === 's') { e.preventDefault(); doDownload(); }
        if (e.key === '0') { e.preventDefault(); fitAll(); }
      }
    };

    const ku = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) ctrlRef.current = false;
      if (e.code === 'Space') spaceRef.current = false;
    };

    window.addEventListener('keydown', kd);
    window.addEventListener('keyup',   ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [fc, saveHist, setTool, fitAll, doDownload, groupSelected, ungroupSelected]);

  // ── File import handler ────────────────────────────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !fc) return;
    e.target.value = '';
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (ext === 'svg') {
      const r = new FileReader();
      r.onload = ev => loadSVGOntoCanvas(fc, ev.target?.result as string, false, importUngroup).then(saveHist);
      r.readAsText(file);
    } else if (ext === 'dxf') {
      const r = new FileReader();
      r.onload = ev => {
        const objs = parseDXFtoFabric(ev.target?.result as string);
        objs.forEach(o => fc.add(o));
        fc.requestRenderAll(); saveHist();
      };
      r.readAsText(file);
    } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
      const r = new FileReader();
      r.onload = ev => {
        fabricImageFromURL(ev.target?.result as string).then(img => {
          const z = fc.getZoom();
          const maxW = cvW.current * 0.6 / z;
          if ((img.width ?? 0) > maxW) img.scale(maxW / (img.width ?? maxW));
          const vpt = fc.viewportTransform!;
          img.set({ left: (cvW.current / 2 - vpt[4]) / z, top: (cvH.current / 2 - vpt[5]) / z, originX: 'center', originY: 'center' });
          fc.add(img); fc.setActiveObject(img); fc.requestRenderAll(); saveHist();
        });
      };
      r.readAsDataURL(file);
    } else {
      alert('Format nesuportat. Acceptate: SVG, DXF, PNG, JPEG');
    }
  };

  // ── Toolbar add-text helper ───────────────────────────────────────────────────
  const addText = () => {
    if (!fc) return;
    const z = fc.getZoom(), vpt = fc.viewportTransform!;
    const t = new fabric.IText('Textul tău', {
      left: (cvW.current / 2 - vpt[4]) / z - 50,
      top:  (cvH.current / 2 - vpt[5]) / z - 20,
      fontFamily: 'Arial', fontSize: 20, fill: '#000',
    });
    fc.add(t); fc.setActiveObject(t); t.enterEditing(); fc.requestRenderAll();
  };

  const deleteSelected = () => {
    if (!fc) return;
    const a = fc.getActiveObjects(); fc.discardActiveObject(); a.forEach(o => fc.remove(o));
    fc.requestRenderAll(); saveHist();
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
      className="flex flex-col w-full h-full rounded-xl overflow-hidden border border-gray-700 shadow-2xl bg-gray-950 select-none"
    >
      {/* ── Top bar ── */}
      <div className="h-8 bg-gray-900 border-b border-gray-800 flex items-center px-3 gap-2 shrink-0">
        <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest">Laser Editor Pro</span>
        <span className="text-[11px] text-gray-700 mx-1">|</span>
        <span className="text-[11px] text-gray-600">{zoomPct}%</span>
        {preview && (
          <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-amber-400 bg-amber-900/40 border border-amber-700 px-2 py-0.5 rounded-full">
            PREVIEW {material.toUpperCase()}
          </span>
        )}
        <div className="flex-1" />
        <span className="text-[10px] text-gray-700">
          Scroll mijloc = pan · Scroll = zoom · Ctrl+click = multi-select
        </span>
      </div>

      {/* ── Text toolbar ── */}
      <TextBar tp={tp} setTp={setTp} applyText={applyText} />

      {/* ── Alignment bar ── */}
      <AlignBar onAlign={(t: AlignType) => fc && doAlign(fc, t, lastClickedRef.current)} />

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Toolbar
          tool={tool} setTool={setTool}
          importUngroup={importUngroup} setImportUngroup={setImportUngroup}
          onImportFile={() => importRef.current?.click()}
          onAddText={addText}
          onDeleteSel={deleteSelected}
          onGroup={groupSelected}
          onUngroup={ungroupSelected}
          onShowSnap={() => { setShowSnapPanel(v => !v); setShowMatPanel(false); }}
          onShowMat={() =>  { setShowMatPanel(v => !v); setShowSnapPanel(false); }}
          onShowShortcuts={() => setShowShortcuts(true)}
        />

        {/* ── Canvas wrapper — fills remaining space ── */}
        <div ref={containerRef} className="relative flex-1 overflow-hidden bg-gray-800">

          {/* Material texture overlay (behind canvas, pointer-events none) */}
          <div
            ref={matOverlay}
            className="absolute inset-0 pointer-events-none"
            style={{ display: 'none', zIndex: 0 }}
          />

          {/* Fabric canvas */}
          <canvas ref={canvasEl} className="absolute inset-0" style={{ zIndex: 1 }} />

          {/* Grid overlay */}
          <canvas
            ref={gridEl}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 2 }}
          />

          {/* Floating panels */}
          {showSnapPanel && (
            <SnapPanel
              gridOn={gridOn}     setGridOn={setGridOn}
              gridSize={gridSize} setGridSize={setGridSize}
              snapGrid={snapGrid} setSnapGrid={setSnapGrid}
              snapObj={snapObj}   setSnapObj={setSnapObj}
              onClose={() => setShowSnapPanel(false)}
            />
          )}
          {showMatPanel && (
            <MaterialPanel
              material={material} preview={preview}
              onApply={applyPreview}
              onClose={() => setShowMatPanel(false)}
            />
          )}
        </div>
      </div>

      {/* ── Status bar ── */}
      <StatusBar zoomPct={zoomPct} cur={cur} selInfo={selInfo} onFit={fitAll} onDown={doDownload} />

      {/* ── Shortcuts overlay ── */}
      {showShortcuts && <ShortcutsPanel onClose={() => setShowShortcuts(false)} />}

      {/* Hidden file input */}
      <input
        ref={importRef} type="file"
        accept=".svg,.dxf,.png,.jpg,.jpeg,image/svg+xml"
        className="hidden" onChange={handleImport}
      />
    </div>
  );
}
