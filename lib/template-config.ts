/* lib/template-config.ts
   Shared types + enum mappings for product engraving templates.
   Used by the editor (client), the admin form and the API routes — keep this
   file free of Fabric.js / React imports. */

import type {
  TemplateShape as DbTemplateShape,
  Material as DbMaterial,
} from "@/lib/generated/prisma/client";

// ── Editor-side unions (lowercase, historical editor convention) ─────────────

export type TemplateShape = "circle" | "square" | "heart" | "rectangle";
export type TemplateMaterial = "slate" | "wood";

/** Everything the editor needs to know about a product's engraving template. */
export interface ProductTemplateConfig {
  productId: string;
  name: string;
  shape: TemplateShape;
  widthMm: number;
  heightMm: number;
  material: TemplateMaterial;
  blankPhotoUrl: string | null;
}

// ── DB enum ⇄ editor union mappings ──────────────────────────────────────────

export const DB_SHAPE_TO_EDITOR: Record<DbTemplateShape, TemplateShape> = {
  CIRCLE: "circle",
  SQUARE: "square",
  HEART: "heart",
  RECTANGLE: "rectangle",
};

export const DB_MATERIAL_TO_EDITOR: Record<DbMaterial, TemplateMaterial> = {
  SLATE: "slate",
  WOOD: "wood",
};

// ── Romanian labels (admin form + editor dropdown) ───────────────────────────

export const SHAPE_LABELS_RO: Record<DbTemplateShape, string> = {
  CIRCLE: "Cerc",
  SQUARE: "Pătrat",
  HEART: "Inimă",
  RECTANGLE: "Dreptunghi",
};

export const MATERIAL_LABELS_RO: Record<DbMaterial, string> = {
  SLATE: "Ardezie",
  WOOD: "Lemn",
};
