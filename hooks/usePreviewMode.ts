"use client";

import { useEffect } from "react";
import * as fabric from "fabric";
import type { Canvas, FabricObject, Image as FabricImage } from "fabric";
import { toast } from "sonner";
import { useEditorStore } from "@/store/editorStore";
import {
  getPlacedTemplate,
  getTemplateConfig,
  buildTemplateClipShape,
  isTemplateObject,
  PREVIEW_CLIP_TAG,
} from "@/components/editor/utils/templateGeometry";
import {
  makeSlateCanvas,
  makeWoodCanvas,
} from "@/components/editor/utils/textures";
import { ditherToEngraving } from "@/components/editor/utils/dithering";
import type {
  ProductTemplateConfig,
  TemplateMaterial,
} from "@/lib/template-config";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Custom fields saved into obj.data so they survive toJSON() / undo. */
interface PreviewData {
  tag?: string;
  originalFill?: string | null;
  originalStroke?: string | null;
  /** True when preview colours have been applied to this object. */
  inPreview?: boolean;
}

/** Engraving simulation colours for each material. */
const MATERIAL_COLORS: Record<TemplateMaterial, string> = {
  /** Light slate-grey mark on a dark slate surface (laser burns lighter). */
  slate: "#E2E8F0",
  /** Dark charred mark on a warm wood surface. */
  wood:  "#3E2723",
};

/** Soft studio gradient shown outside the product shape. */
const STUDIO_BACKDROP =
  "radial-gradient(120% 90% at 50% 30%, #f8fafc 0%, #e2e8f0 55%, #cbd5e1 100%)";

// ── Module state (non-serializable — element references, canvas flags) ───────

interface ImageOriginal {
  element: HTMLImageElement | HTMLCanvasElement;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}

interface CanvasPreviewState {
  backgroundColor: string;
  selection: boolean;
  skipTargetFind: boolean;
  wrapperBackground: string;
}

/** Original image elements, swapped out for the dithered preview canvas. */
const imageOriginals = new WeakMap<FabricImage, ImageOriginal>();
/** Dither results cached per source element (keyed by material+colour). */
const ditherCache = new WeakMap<object, Map<string, HTMLCanvasElement>>();
/** Canvas-level state saved while the studio staging is active. */
const canvasStates = new WeakMap<Canvas, CanvasPreviewState>();
/** Monotonic token — invalidates in-flight async applies (photo loading). */
const applyTokens = new WeakMap<Canvas, number>();
/** Procedural texture fallbacks, generated once per session. */
const textureCache = new Map<TemplateMaterial, HTMLCanvasElement>();
/** "Place a template" hint is shown at most once per session. */
let templateHintShown = false;

// ── Helpers ───────────────────────────────────────────────────────────────────

function data(obj: FabricObject): PreviewData {
  return ((obj as unknown as Record<string, unknown>).data ?? {}) as PreviewData;
}

function setData(obj: FabricObject, d: PreviewData): void {
  (obj as unknown as Record<string, unknown>).data = d;
}

function isImage(obj: FabricObject): obj is FabricImage {
  return obj.type === "image";
}

function getTexture(material: TemplateMaterial): HTMLCanvasElement {
  let texture = textureCache.get(material);
  if (!texture) {
    texture = material === "slate" ? makeSlateCanvas() : makeWoodCanvas();
    textureCache.set(material, texture);
  }
  return texture;
}

// ── Apply / restore (pure canvas operations — also used by export/save) ──────

/**
 * Applies the engraving preview to the canvas.
 *
 * Always: vectors get the material's engraving colour; raster images are
 * swapped for a Floyd–Steinberg-dithered rendition (dots of engraving colour
 * on transparent background).
 *
 * With a placed product template additionally:
 *  - every user object is clipped to the template shape,
 *  - the template is filled with the blank photo (or procedural texture),
 *  - the canvas shows a studio backdrop + drop shadow under the product,
 *  - interaction is frozen (preview is a simulation, not an editing mode).
 *
 * The async tail (blank-photo loading) self-cancels when the mode flips or a
 * newer apply/restore starts (token check).
 */
export async function applyPreviewToCanvas(canvas: Canvas): Promise<void> {
  const token = (applyTokens.get(canvas) ?? 0) + 1;
  applyTokens.set(canvas, token);

  const template = getPlacedTemplate(canvas);
  const config = template ? getTemplateConfig(template) : null;
  const material = config?.material ?? "slate";
  const engravingColor = MATERIAL_COLORS[material];

  // Engraving look on user objects (skip transient excludeFromExport chrome)
  const userObjects = canvas
    .getObjects()
    .filter((o) => !isTemplateObject(o) && !o.excludeFromExport);
  applyEngravingLook(userObjects, engravingColor, material);

  if (template && config) {
    // Clip the visible content to the physical product shape
    userObjects.forEach((obj) => {
      if (!obj.clipPath) obj.clipPath = buildTemplateClipShape(template);
    });

    stageStudio(canvas);
    // Procedural texture immediately — toggle must feel instant
    styleTemplateSurface(template, config, getTexture(material));
    canvas.requestRenderAll();

    // Upgrade the surface to the real blank photo when one is configured
    if (config.blankPhotoUrl) {
      try {
        const photo = await fabric.util.loadImage(config.blankPhotoUrl, {
          crossOrigin: "anonymous",
        });
        // Bail out if preview was exited / re-applied while loading
        if (applyTokens.get(canvas) !== token) return;
        if (useEditorStore.getState().mode !== "preview") return;
        styleTemplateSurface(template, config, photo);
      } catch (error) {
        console.error(
          "[usePreviewMode] blank photo failed to load — keeping procedural texture",
          error,
        );
      }
    }
  }

  canvas.requestRenderAll();
}

/**
 * Fully restores the design state: original fills/strokes, original image
 * elements, clip paths removed, canvas background/interaction restored.
 */
export function restoreDesignState(canvas: Canvas): void {
  // Invalidate any in-flight async apply (photo still loading)
  applyTokens.set(canvas, (applyTokens.get(canvas) ?? 0) + 1);

  canvas.getObjects().forEach((obj) => {
    // Remove only clips installed by the preview — never user clip paths
    const clip = obj.clipPath as
      | (FabricObject & { data?: { tag?: string } })
      | undefined;
    if (clip?.data?.tag === PREVIEW_CLIP_TAG) obj.clipPath = undefined;

    restoreObjectTree(obj);
  });

  const saved = canvasStates.get(canvas);
  if (saved) {
    canvas.backgroundColor = saved.backgroundColor;
    canvas.selection = saved.selection;
    canvas.skipTargetFind = saved.skipTargetFind;
    if (canvas.wrapperEl) {
      canvas.wrapperEl.style.background = saved.wrapperBackground;
    }
    canvasStates.delete(canvas);
  }

  canvas.requestRenderAll();
}

// ── Internal: engraving look ──────────────────────────────────────────────────

/** Recursively recolours vectors / dithers images. Groups are traversed. */
function applyEngravingLook(
  objects: FabricObject[],
  engravingColor: string,
  material: TemplateMaterial,
): void {
  objects.forEach((obj) => {
    if (obj instanceof fabric.Group) {
      applyEngravingLook(obj.getObjects(), engravingColor, material);
      obj.set("dirty", true);
      return;
    }

    const d = data(obj);
    if (d.inPreview) return; // already transformed — skip

    if (isImage(obj)) {
      applyDitherToImage(obj, engravingColor, material);
    } else {
      // Persist originals so they survive multiple on/off cycles
      d.originalFill   = (obj.fill   as string | null | undefined) ?? null;
      d.originalStroke = (obj.stroke as string | null | undefined) ?? null;
      // Only recolour if the object actually has a visible fill/stroke
      if (obj.fill   !== null && obj.fill   !== "") obj.set("fill",   engravingColor);
      if (obj.stroke !== null && obj.stroke !== "") obj.set("stroke", engravingColor);
    }

    d.inPreview = true;
    setData(obj, d);
  });
}

/** Swaps the image element for a dithered engraving simulation (cached). */
function applyDitherToImage(
  img: FabricImage,
  engravingColor: string,
  material: TemplateMaterial,
): void {
  if (imageOriginals.has(img)) return;
  const element = img.getElement() as
    | HTMLImageElement
    | HTMLCanvasElement
    | undefined;
  if (!element) return;

  const original: ImageOriginal = {
    element,
    width:  img.width  ?? 0,
    height: img.height ?? 0,
    scaleX: img.scaleX ?? 1,
    scaleY: img.scaleY ?? 1,
  };

  const cacheKey = `${material}|${engravingColor}`;
  let byKey = ditherCache.get(element);
  if (!byKey) {
    byKey = new Map();
    ditherCache.set(element, byKey);
  }
  let dithered = byKey.get(cacheKey);
  if (!dithered) {
    dithered = ditherToEngraving(element, engravingColor, material);
    byKey.set(cacheKey, dithered);
  }

  imageOriginals.set(img, original);
  img.setElement(dithered);
  // The dithered canvas is downscaled — compensate so on-canvas size is equal
  img.set({
    scaleX: original.scaleX * (original.width  / dithered.width),
    scaleY: original.scaleY * (original.height / dithered.height),
    dirty:  true,
  });
  img.setCoords();
}

/** Restores fills/strokes/elements for an object and (recursively) groups. */
function restoreObjectTree(obj: FabricObject): void {
  if (obj instanceof fabric.Group) {
    obj.getObjects().forEach(restoreObjectTree);
    obj.set("dirty", true);
    return;
  }

  const d = data(obj);
  if (!d.inPreview) return; // was never transformed

  if (isImage(obj)) {
    const original = imageOriginals.get(obj);
    if (original) {
      obj.setElement(original.element);
      obj.set({
        scaleX: original.scaleX,
        scaleY: original.scaleY,
        dirty:  true,
      });
      obj.setCoords();
      imageOriginals.delete(obj);
    }
  } else {
    obj.set("fill",   d.originalFill   ?? "");
    obj.set("stroke", d.originalStroke ?? "");
    if (isTemplateObject(obj)) obj.shadow = null;
  }

  d.inPreview = false;
  setData(obj, d);
}

// ── Internal: studio staging ──────────────────────────────────────────────────

/**
 * Saves canvas-level state, freezes interaction and swaps the editor surface
 * for a neutral studio backdrop. Preview is a visual simulation — objects are
 * not editable while it is active (clips would go stale otherwise).
 */
function stageStudio(canvas: Canvas): void {
  if (!canvasStates.has(canvas)) {
    canvasStates.set(canvas, {
      backgroundColor: (canvas.backgroundColor as string) ?? "",
      selection: canvas.selection,
      skipTargetFind: canvas.skipTargetFind,
      wrapperBackground: canvas.wrapperEl?.style.background ?? "",
    });
  }
  canvas.discardActiveObject();
  canvas.selection = false;
  canvas.skipTargetFind = true;
  // Transparent Fabric background — the wrapper div provides the gradient,
  // so it stays fixed under pan/zoom like a real photo studio sweep.
  canvas.backgroundColor = "";
  if (canvas.wrapperEl) canvas.wrapperEl.style.background = STUDIO_BACKDROP;
}

/**
 * Fills the template with the material surface (blank photo or procedural
 * texture, cover-fitted and centred) and adds a soft drop shadow scaled to
 * the physical product size.
 */
function styleTemplateSurface(
  template: FabricObject,
  config: ProductTemplateConfig,
  source: HTMLImageElement | HTMLCanvasElement,
): void {
  const d = data(template);
  if (!d.inPreview) {
    d.originalFill   = (template.fill   as string | null | undefined) ?? null;
    d.originalStroke = (template.stroke as string | null | undefined) ?? null;
    d.inPreview = true;
    setData(template, d);
  }

  // Cover-fit in object space: pattern origin is the object's top-left
  const objW = template.width  ?? config.widthMm;
  const objH = template.height ?? config.heightMm;
  const srcW = source.width  || 1;
  const srcH = source.height || 1;
  const scale = Math.max(objW / srcW, objH / srcH);
  const pattern = new fabric.Pattern({
    source,
    repeat: "no-repeat",
    patternTransform: [
      scale, 0, 0, scale,
      (objW - srcW * scale) / 2,
      (objH - srcH * scale) / 2,
    ],
  });

  const size = Math.max(config.widthMm, config.heightMm);
  template.set({
    fill:   pattern,
    stroke: "transparent",
    dirty:  true,
  });
  template.shadow = new fabric.Shadow({
    color:   "rgba(15, 23, 42, 0.45)",
    blur:    size * 0.08,
    offsetX: 0,
    offsetY: size * 0.05,
  });
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Reacts to `editorStore.mode` changes:
 *  - "preview" → applyPreviewToCanvas (material comes from the placed
 *    product template; defaults to slate when none is placed)
 *  - "design"  → restoreDesignState
 *
 * Also owns the Tab keyboard shortcut that toggles preview, and shows a
 * one-time hint when preview is entered without a product template.
 */
export function usePreviewMode() {
  const canvas = useEditorStore((s) => s.canvas);
  const mode   = useEditorStore((s) => s.mode);

  useEffect(() => {
    if (!canvas) return;

    if (mode === "preview") {
      if (!getPlacedTemplate(canvas) && !templateHintShown) {
        templateHintShown = true;
        toast.info(
          "Sfat: alege un produs din meniul „Șablon…” pentru o previzualizare realistă a materialului.",
        );
      }
      void applyPreviewToCanvas(canvas);
    } else {
      restoreDesignState(canvas);
    }
  }, [canvas, mode]);

  // Tab toggles preview (ignored while typing or editing canvas text)
  useEffect(() => {
    if (!canvas) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;
      const active = canvas.getActiveObject() as
        | (FabricObject & { isEditing?: boolean })
        | null;
      if (active?.isEditing) return;

      e.preventDefault();
      const { mode: current, setMode } = useEditorStore.getState();
      setMode(current === "preview" ? "design" : "preview");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canvas]);
}
