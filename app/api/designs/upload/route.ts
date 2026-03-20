/* app/api/designs/upload/route.ts */
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Lipsește fișierul." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tip de fișier neacceptat. Folosește JPG, PNG, WEBP, SVG sau PDF." },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Fișierul depășește limita de 10 MB." },
        { status: 400 },
      );
    }

    // Read bytes before any async ops
    const bytes = Buffer.from(await file.arrayBuffer());

    // Save file to public/uploads/designs/
    const ext = path.extname(file.name) || ".bin";
    const designId = randomUUID();
    const savedFileName = `${designId}${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "designs");

    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, savedFileName), bytes);

    return NextResponse.json({
      designId,
      fileUrl: `/uploads/designs/${savedFileName}`,
      fileName: file.name,
    });
  } catch (error) {
    console.error("[POST /api/designs/upload]", error);
    const message =
      error instanceof Error ? error.message : "Încărcarea a eșuat. Încearcă din nou.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
