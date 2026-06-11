/* components/editor/utils/templateGeometry.ts
   Pure Fabric.js helpers for the product-template boundary:
   building boundary/ghost/clip shapes from a ProductTemplateConfig and
   reading the config back from a placed template object.
   No React — usable from hooks and export code alike. */

import * as fabric from "fabric";
import type { FabricObject } from "fabric";
import { buildHeartPathD } from "./heartPath";
import type {
  ProductTemplateConfig,
  TemplateShape,
} from "@/lib/template-config";

// ── Tags ──────────────────────────────────────────────────────────────────────

/** Placed boundary object — represents the physical blank. */
export const TEMPLATE_TAG = "__product_template__";
/** Translucent cursor-following ghost shown during placement. */
export const GHOST_TAG = "__template_ghost__";
/** Clip shapes installed by the preview — never user-created. */
export const PREVIEW_CLIP_TAG = "__preview_clip__";

/** Corner radius (mm) of the rectangle blank — matches the physical product. */
const RECT_CORNER_RADIUS = 8;

/** Custom fields stored in `obj.data` for template objects. */
export interface TemplateObjectData {
  tag?: string;
  shape?: TemplateShape;
  /** Full product config, written when the template is placed. */
  product?: ProductTemplateConfig;
}

function dataOf(obj: FabricObject): TemplateObjectData {
  return ((obj as unknown as Record<string, unknown>).data ??
    {}) as TemplateObjectData;
}

export function isTemplateObject(obj: FabricObject): boolean {
  return dataOf(obj).tag === TEMPLATE_TAG;
}

// ── Shape construction ────────────────────────────────────────────────────────

/**
 * Builds the raw geometry for a template shape with its bounding box at
 * (left, top) and exactly w × h document units (= mm).
 * The heart path is drawn with side margins, so it is scaled up to make its
 * bounding box match the physical blank dimensions.
 */
function buildShapeGeometry(
  shape: TemplateShape,
  left: number,
  top: number,
  w: number,
  h: number,
  props: Record<string, unknown>,
): FabricObject {
  if (shape === "circle") {
    // Ellipse generalises the circle for non-square admin dimensions
    return new fabric.Ellipse({ ...props, rx: w / 2, ry: h / 2, left, top });
  }
  if (shape === "heart") {
    const path = new fabric.Path(buildHeartPathD(w, h), { ...props, left, top });
    // Scale so the placed bounding box is exactly w × h mm
    path.set({
      scaleX: w / (path.width || w),
      scaleY: h / (path.height || h),
    });
    return path;
  }
  return new fabric.Rect({
    ...props,
    width: w,
    height: h,
    left,
    top,
    rx: shape === "rectangle" ? RECT_CORNER_RADIUS : 0,
    ry: shape === "rectangle" ? RECT_CORNER_RADIUS : 0,
  });
}

/**
 * Builds a boundary object for a product template at (left, top).
 * Ghost objects are translucent, non-interactive, and excluded from export.
 * Real objects are movable but locked from resize/rotate, and carry the full
 * product config in `data.product` (serialized with toJSON via the registered
 * "data" custom property — survives undo/redo and saved designs).
 */
export function buildTemplateBoundary(
  config: ProductTemplateConfig,
  left: number,
  top: number,
  isGhost: boolean,
): FabricObject {
  const base = {
    fill:            "transparent" as const,
    stroke:          "#64748b",
    strokeWidth:     3,
    strokeDashArray: [12, 6] as number[],
    strokeUniform:   true,
    hasControls:     false,
    lockScalingX:    true,
    lockScalingY:    true,
    lockRotation:    true,
    lockSkewingX:    true,
    lockSkewingY:    true,
  };

  const props = isGhost
    ? {
        ...base,
        selectable:        false,
        evented:           false,
        opacity:           0.55,
        excludeFromExport: true,
        data: { tag: GHOST_TAG, shape: config.shape, product: config },
      }
    : {
        ...base,
        selectable:  true,
        evented:     true,
        hoverCursor: "move" as string,
        data: { tag: TEMPLATE_TAG, shape: config.shape, product: config },
      };

  return buildShapeGeometry(
    config.shape,
    left,
    top,
    config.widthMm,
    config.heightMm,
    props,
  );
}

// ── Reading placed templates ──────────────────────────────────────────────────

/** Returns the placed template boundary, if any (one-template-max rule). */
export function getPlacedTemplate(canvas: fabric.Canvas): FabricObject | null {
  return canvas.getObjects().find(isTemplateObject) ?? null;
}

/**
 * Reads the product config from a placed template.
 * Legacy templates (placed before the product-driven dropdown) lack
 * `data.product` — fall back to geometry-derived dimensions and slate.
 */
export function getTemplateConfig(
  template: FabricObject,
): ProductTemplateConfig {
  const d = dataOf(template);
  if (d.product) return d.product;

  return {
    productId: "",
    name: "Șablon",
    shape: d.shape ?? "rectangle",
    widthMm: (template.width ?? 0) * (template.scaleX ?? 1),
    heightMm: (template.height ?? 0) * (template.scaleY ?? 1),
    material: "slate",
    blankPhotoUrl: null,
  };
}

/** Bounding box of the template in document units (mm), stroke excluded. */
export function getTemplateBBox(template: FabricObject): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const config = getTemplateConfig(template);
  return {
    left: template.left ?? 0,
    top: template.top ?? 0,
    width: config.widthMm,
    height: config.heightMm,
  };
}

/**
 * Re-applies the interaction locks on placed templates.
 * Fabric does not serialize the lock flags or hasControls, so templates
 * restored via loadFromJSON (undo/redo, saved designs) would become
 * scalable without this.
 */
export function enforceTemplateLocks(canvas: fabric.Canvas): void {
  canvas.getObjects().filter(isTemplateObject).forEach((template) => {
    template.set({
      hasControls:  false,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      lockSkewingX: true,
      lockSkewingY: true,
      hoverCursor:  "move",
    });
  });
}

/**
 * Builds an absolutely-positioned clip shape matching the template geometry.
 * Used as per-object clipPath in preview mode and as canvas.clipPath during
 * SVG export. A fresh instance is returned on every call — Fabric clip paths
 * should not be shared across objects.
 */
export function buildTemplateClipShape(template: FabricObject): FabricObject {
  const { left, top, width, height } = getTemplateBBox(template);
  const config = getTemplateConfig(template);

  return buildShapeGeometry(config.shape, left, top, width, height, {
    absolutePositioned: true,
    fill: "#000",
    stroke: undefined,
    strokeWidth: 0,
    data: { tag: PREVIEW_CLIP_TAG },
  });
}
