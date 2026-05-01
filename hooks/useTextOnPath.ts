"use client";

import * as fabric from "fabric";
import type { FabricObject, IText } from "fabric";
import { useEditorStore } from "@/store/editorStore";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TextOnPathParams {
  text: string;
  fontFamily: string;
  fontSize: number; // mm (1 fabric unit = 1 mm)
  fill: string;
  startAngleDeg: number; // 0 = top (12 o'clock), positive = clockwise
  position: "outside" | "inside";
}

export interface TextOnPathMeta extends TextOnPathParams {
  tag: "__text_on_path__";
  cx: number;
  cy: number; // ellipse center in canvas coords
  rx: number;
  ry: number; // semi-axes
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Access the custom data bag on a Fabric object without `any`. */
function getData(obj: FabricObject): unknown {
  return (obj as FabricObject & { data?: unknown }).data;
}

/**
 * Measure the pixel width of a single grapheme using a temporary FabricText.
 * The temporary object is never added to the canvas.
 */
async function measureCharWidth(
  char: string,
  fontFamily: string,
  fontSize: number,
): Promise<number> {
  // Wait for webfonts so that measurement is accurate
  await document.fonts.ready;

  const tmp = new fabric.FabricText(char, { fontFamily, fontSize });
  // initDimensions populates __lineWidths; we can then call measureLine
  // In Fabric v7 FabricText, calling measureLine directly works after construction
  // because the constructor calls initDimensions internally.
  const result = tmp.measureLine(0);
  return result.width;
}

/**
 * Build an array of Fabric IText glyphs arranged along an ellipse path.
 * Each glyph is a single character positioned and rotated to follow the curve.
 */
async function buildGlyphs(
  params: TextOnPathParams,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): Promise<IText[]> {
  const { text, fontFamily, fontSize, fill, startAngleDeg, position } = params;

  // Use the mean radius for arc-length approximation on non-circular ellipses.
  const r = (rx + ry) / 2;

  // startAngleDeg=0 means 12 o'clock. Convert to math angle:
  // 12 o'clock in screen coords = -90° (top), then rotating clockwise = increasing angle.
  const baseAngle = (startAngleDeg - 90) * (Math.PI / 180);

  // Measure each character in parallel for efficiency.
  const chars = Array.from(text);
  const advances = await Promise.all(
    chars.map((ch) => measureCharWidth(ch, fontFamily, fontSize)),
  );

  // Total text arc length — used to optionally center the text in future.
  // Currently we start from startAngleDeg exactly.
  let arcLen = 0;

  const glyphs: IText[] = chars.map((char, i) => {
    // Advance arc to the center of this character.
    const halfWidth = advances[i] / 2;
    arcLen += halfWidth;

    // Angle in canvas coordinate space for this character's center position.
    const charAngle = baseAngle + arcLen / r;

    // Position on the ellipse.
    const x = cx + rx * Math.cos(charAngle);
    const y = cy + ry * Math.sin(charAngle);

    // Tangent direction at this angle on an ellipse:
    // dx/d(theta) = -rx*sin(theta), dy/d(theta) = ry*cos(theta)
    const tangentAngle = Math.atan2(
      ry * Math.cos(charAngle),
      -rx * Math.sin(charAngle),
    );

    // Outside: character stands upright relative to tangent, bottom on the curve.
    // Inside: character is flipped 180° relative to outside, top on the curve.
    const baseDeg = tangentAngle * (180 / Math.PI) + 90;
    const rotationDeg = position === "outside" ? baseDeg : baseDeg + 180;

    // After this character, advance by the second half-width.
    arcLen += halfWidth;

    return new fabric.IText(char, {
      left: x,
      top: y,
      originX: "center",
      originY: position === "outside" ? "bottom" : "top",
      angle: rotationDeg,
      fontFamily,
      fontSize,
      fill,
      selectable: false,
      evented: false,
    });
  });

  return glyphs;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTextOnPath(): {
  canWrap: (obj: FabricObject | null) => boolean;
  wrapText: (target: FabricObject, params: TextOnPathParams) => Promise<void>;
  updateWrapped: (
    group: FabricObject,
    params: TextOnPathParams,
  ) => Promise<void>;
  editMeta: (group: FabricObject) => TextOnPathMeta | null;
} {
  const canvas = useEditorStore((s) => s.canvas);

  function canWrap(obj: FabricObject | null): boolean {
    if (!obj) return false;
    return obj.type === "ellipse" || obj.type === "circle";
  }

  async function wrapText(
    target: FabricObject,
    params: TextOnPathParams,
  ): Promise<void> {
    if (!canvas) return;

    // Compute ellipse center and semi-axes from the fabric object's transform.
    const cx =
      ((target.left ?? 0) as number) +
      (((target.width ?? 0) as number) * ((target.scaleX ?? 1) as number)) / 2;
    const cy =
      ((target.top ?? 0) as number) +
      (((target.height ?? 0) as number) * ((target.scaleY ?? 1) as number)) / 2;
    const rx =
      (((target.width ?? 0) as number) / 2) * ((target.scaleX ?? 1) as number);
    const ry =
      (((target.height ?? 0) as number) / 2) *
      ((target.scaleY ?? 1) as number);

    const glyphs = await buildGlyphs(params, cx, cy, rx, ry);

    const meta: TextOnPathMeta = {
      tag: "__text_on_path__",
      ...params,
      cx,
      cy,
      rx,
      ry,
    };

    const store = useEditorStore.getState();
    store.pauseHistory();

    const group = new fabric.Group(glyphs, {
      selectable: true,
      evented: true,
    });
    // `data` is a Fabric custom property bucket — not in GroupProps types, so we assign directly.
    (group as unknown as { data: TextOnPathMeta }).data = meta;

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();

    store.resumeHistory();
    store.takeSnapshot();
  }

  async function updateWrapped(
    group: FabricObject,
    params: TextOnPathParams,
  ): Promise<void> {
    if (!canvas) return;

    // Extract stored ellipse geometry — the ellipse itself doesn't move when
    // we edit the text, so we keep the original cx/cy/rx/ry.
    const existingMeta = editMeta(group);
    if (!existingMeta) return;

    const { cx, cy, rx, ry } = existingMeta;

    const glyphs = await buildGlyphs(params, cx, cy, rx, ry);

    const meta: TextOnPathMeta = {
      tag: "__text_on_path__",
      ...params,
      cx,
      cy,
      rx,
      ry,
    };

    const store = useEditorStore.getState();
    store.pauseHistory();

    canvas.remove(group);

    const newGroup = new fabric.Group(glyphs, {
      selectable: true,
      evented: true,
    });
    (newGroup as unknown as { data: TextOnPathMeta }).data = meta;

    canvas.add(newGroup);
    canvas.setActiveObject(newGroup);
    canvas.requestRenderAll();

    store.resumeHistory();
    store.takeSnapshot();
  }

  function editMeta(group: FabricObject): TextOnPathMeta | null {
    const d = getData(group);
    if (
      typeof d === "object" &&
      d !== null &&
      (d as Record<string, unknown>).tag === "__text_on_path__"
    ) {
      return d as TextOnPathMeta;
    }
    return null;
  }

  return { canWrap, wrapText, updateWrapped, editMeta };
}
