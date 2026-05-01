"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  Pencil,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface PresetDesign {
  id: string;
  name: string;
  category: string;
  svgContent: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

interface PresetForm {
  name: string;
  category: string;
  svgContent: string;
  sortOrder: number;
}

const CATEGORIES = ["Borduri", "Colțuri", "Florale", "Geometrice"];

// ── Component ────────────────────────────────────────────────────────────────

export function PresetsAdminClient() {
  const [presets, setPresets] = useState<PresetDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Upload / Create form
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<PresetForm>({
    name: "",
    category: CATEGORIES[0],
    svgContent: "",
    sortOrder: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit dialog
  const [editPreset, setEditPreset] = useState<PresetDesign | null>(null);
  const [editForm, setEditForm] = useState<PresetForm>({
    name: "",
    category: "",
    svgContent: "",
    sortOrder: 0,
  });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<PresetDesign | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchPresets = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/presets");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: PresetDesign[] = await res.json();
      setPresets(data);
    } catch (err) {
      console.error("[AdminPresets]", err);
      toast.error("Nu s-au putut încărca preset-urile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPresets();
  }, [fetchPresets]);

  // ── Create ───────────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!form.name.trim() || !form.svgContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create");
      setForm({ name: "", category: CATEGORIES[0], svgContent: "", sortOrder: 0 });
      setShowCreate(false);
      toast.success("Preset creat");
      await fetchPresets();
    } catch (err) {
      console.error("[AdminPresets] create", err);
      toast.error("Eroare la crearea preset-ului");
    } finally {
      setSaving(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setForm((prev) => ({
        ...prev,
        svgContent: content,
        name: prev.name || file.name.replace(/\.svg$/i, ""),
      }));
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ── Update ───────────────────────────────────────────────────────────────

  async function handleUpdate() {
    if (!editPreset) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/presets/${editPreset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditPreset(null);
      toast.success("Preset actualizat");
      await fetchPresets();
    } catch (err) {
      console.error("[AdminPresets] update", err);
      toast.error("Eroare la actualizarea preset-ului");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(preset: PresetDesign) {
    try {
      const res = await fetch(`/api/admin/presets/${preset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !preset.active }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      await fetchPresets();
    } catch (err) {
      console.error("[AdminPresets] toggle", err);
      toast.error("Eroare la actualizarea preset-ului");
    }
  }

  async function changeSortOrder(preset: PresetDesign, delta: number) {
    try {
      const res = await fetch(`/api/admin/presets/${preset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: preset.sortOrder + delta }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
      await fetchPresets();
    } catch (err) {
      console.error("[AdminPresets] reorder", err);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/presets/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteTarget(null);
      toast.success("Preset șters");
      await fetchPresets();
    } catch (err) {
      console.error("[AdminPresets] delete", err);
      toast.error("Eroare la ștergerea preset-ului");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  // Group presets by category for display
  const grouped: Record<string, PresetDesign[]> = {};
  for (const p of presets) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Administrare Preset-uri
        </h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" />
          Adaugă preset
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      )}

      {/* ── Create / Upload dialog ────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adaugă preset nou</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Nume</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Bordură Art Deco"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Categorie</label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Ordine sortare</label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Fișier SVG</label>
              <div className="mt-1 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} className="mr-2" />
                  Încarcă SVG
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg,image/svg+xml"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                {form.svgContent && (
                  <span className="text-xs text-green-600 self-center">SVG încărcat</span>
                )}
              </div>
            </div>

            {form.svgContent && (
              <div className="border rounded-md p-4 bg-white">
                <p className="text-xs text-slate-500 mb-2">Previzualizare:</p>
                <div
                  className="w-32 h-32 mx-auto overflow-hidden [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
                  dangerouslySetInnerHTML={{ __html: form.svgContent }}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Anulează
              </Button>
              <Button
                onClick={() => void handleCreate()}
                disabled={saving || !form.name.trim() || !form.svgContent.trim()}
              >
                {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                Creează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ───────────────────────────────────────────────────── */}
      <Dialog open={!!editPreset} onOpenChange={(open) => !open && setEditPreset(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editează preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Nume</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Categorie</label>
              <Select
                value={editForm.category}
                onValueChange={(v) => setEditForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Ordine sortare</label>
              <Input
                type="number"
                value={editForm.sortOrder}
                onChange={(e) => setEditForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
              />
            </div>

            {editForm.svgContent && (
              <div className="border rounded-md p-4 bg-white">
                <p className="text-xs text-slate-500 mb-2">Previzualizare:</p>
                <div
                  className="w-32 h-32 mx-auto overflow-hidden [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
                  dangerouslySetInnerHTML={{ __html: editForm.svgContent }}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditPreset(null)}>
                Anulează
              </Button>
              <Button onClick={() => void handleUpdate()} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                Salvează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation dialog ────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmă ștergerea</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-2">
            Ești sigur că vrei să ștergi preset-ul <strong>{deleteTarget?.name}</strong>? Acțiunea este ireversibilă.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Anulează
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Șterge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Preset list by category ───────────────────────────────────────── */}
      {!loading && Object.keys(grouped).length === 0 && (
        <p className="text-slate-500 text-center py-12">Niciun preset. Apasă &quot;Adaugă preset&quot; pentru a începe.</p>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">{category}</h2>
          <Separator className="mb-4" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((preset) => (
              <div
                key={preset.id}
                className={`border rounded-lg p-4 bg-white transition-opacity ${
                  !preset.active ? "opacity-50 border-dashed" : ""
                }`}
              >
                {/* SVG preview */}
                <div
                  className="w-full h-28 bg-slate-50 rounded mb-3 overflow-hidden p-2 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
                  dangerouslySetInnerHTML={{ __html: preset.svgContent }}
                />

                {/* Info */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-slate-800 truncate">
                    {preset.name}
                  </span>
                  <span className="text-xs text-slate-400">#{preset.sortOrder}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title={preset.active ? "Dezactivează" : "Activează"}
                    onClick={() => void toggleActive(preset)}
                  >
                    {preset.active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Editează"
                    onClick={() => {
                      setEditPreset(preset);
                      setEditForm({
                        name: preset.name,
                        category: preset.category,
                        svgContent: preset.svgContent,
                        sortOrder: preset.sortOrder,
                      });
                    }}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Mută sus"
                    onClick={() => void changeSortOrder(preset, -1)}
                  >
                    <ArrowUp size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Mută jos"
                    onClick={() => void changeSortOrder(preset, 1)}
                  >
                    <ArrowDown size={14} />
                  </Button>
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Șterge"
                    onClick={() => setDeleteTarget(preset)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
