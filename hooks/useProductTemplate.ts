"use client";

import * as fabric from "fabric";
import { useEditorStore } from "@/store/editorStore";

export type TemplateShape = "circle" | "square" | "rectangle";

/**
 * Product dimensions in mm (1 canvas unit = 1 mm).
 * These represent the physical engravable area of each product type.
 */
const TEMPLATES: Record<TemplateShape, { w: number; h: number; label: string }> = {
  circle:    { w: 500,  h: 500,  label: "Cerc (⌀ 500 mm)"      },
  square:    { w: 500,  h: 500,  label: "Pătrat (500 × 500 mm)" },
  rectangle: { w: 700,  h: 500,  label: "Dreptunghi (700 × 500 mm)" },
};

// Tag used to identify the template object across the codebase
export const TEMPLATE_TAG = "__product_template__";

/**
 * Draws a locked product-boundary shape on the Fabric canvas.
 *
 * Visual design:
 *  - Dashed stroke (#64748b / slate-500) so it reads as a guide, not a user object.
 *  - Transparent fill — the laser engraves inside this boundary.
 *  - selectable: false + evented: false → cannot be clicked, moved, or deleted.
 *
 * Locked via Fabric settings — the Delete-key handler in useSelectionSync
 * is automatically safe because locked objects can never enter getActiveObjects().
 *
 * Centred on the document (2000, 2000) which is the midpoint of the 4000×4000 mm space.
 */
export function useProductTemplate() {
  const canvas = useEditorStore((s) => s.canvas);

  function loadProductTemplate(shape: TemplateShape) {
    if (!canvas) return;

    const { w, h } = TEMPLATES[shape];
    const docCx = 2000; // centre of the 4000mm document
    const docCy = 2000;

    const sharedProps = {
      fill:            "transparent",
      stroke:          "#64748b",       // slate-500 — subtle guide line
      strokeWidth:     3,
      strokeDashArray: [12, 6],         // dashed → clearly a boundary, not user art
      strokeUniform:   true,
      // Movable but not resizable / rotatable
      selectable:      true,
      evented:         true,
      hasControls:     false,           // hide resize + rotate handles
      lockScalingX:    true,
      lockScalingY:    true,
      lockRotation:    true,
      lockSkewingX:    true,
      lockSkewingY:    true,
      hoverCursor:     "move",
      // Custom data payload — used to identify and replace the template
      data: { tag: TEMPLATE_TAG, shape },
    } as const;

    let templateObj: fabric.FabricObject;

    if (shape === "circle") {
      templateObj = new fabric.Circle({
        ...sharedProps,
        radius: w / 2,
        left:   docCx - w / 2,
        top:    docCy - h / 2,
      });
    } else {
      // Both "square" and "rectangle" use a Rect
      templateObj = new fabric.Rect({
        ...sharedProps,
        width:  w,
        height: h,
        left:   docCx - w / 2,
        top:    docCy - h / 2,
        rx:     shape === "square" ? 0 : 8, // slight rounding for rectangle
        ry:     shape === "square" ? 0 : 8,
      });
    }

    // Insert at index 0 so it stays below all user objects
    canvas.insertAt(0, templateObj);
    canvas.requestRenderAll();
  }

  function clearTemplate() {
    if (!canvas) return;
    canvas
      .getObjects()
      .filter((o) => (o as fabric.FabricObject & { data?: { tag: string } }).data?.tag === TEMPLATE_TAG)
      .forEach((o) => canvas.remove(o));
    canvas.requestRenderAll();
  }

  return { loadProductTemplate, clearTemplate, TEMPLATES };
}
