"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UploadDropzone } from "@/lib/uploadthing";
import { createProduct } from "@/app/admin/produse/actions";

export function AddProductModal() {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleClose(next: boolean) {
    if (!next) {
      // Reset state when closing
      setImageUrl("");
      setUploadError("");
      setFormError("");
      formRef.current?.reset();
    }
    setOpen(next);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!imageUrl) {
      setFormError("Please upload a product image before saving.");
      return;
    }
    setFormError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await createProduct(formData, imageUrl);
        handleClose(false);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-white text-slate-900 hover:bg-slate-100">
          <Plus size={16} />
          Add New Product
        </Button>
      </DialogTrigger>

      <DialogContent className="border-slate-800 bg-slate-900 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Product</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="name">
              Name <span className="text-red-400">*</span>
            </label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g. Tablou Ardezie 20x30cm"
              className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-slate-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Short product description (optional)"
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
            />
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="price">
                Price (RON) <span className="text-red-400">*</span>
              </label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="category">
                Category / Material
              </label>
              <Input
                id="category"
                name="category"
                placeholder="e.g. Ardezie, Lemn, Metal"
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-slate-500"
              />
            </div>
          </div>

          {/* isCustomizable */}
          <div className="flex items-center gap-3">
            <input
              id="isCustomizable"
              name="isCustomizable"
              type="checkbox"
              value="true"
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-white"
            />
            <label className="text-sm font-medium text-slate-300" htmlFor="isCustomizable">
              Customizable (can be personalised in the editor)
            </label>
          </div>

          {/* Image upload */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">
              Product Image <span className="text-red-400">*</span>
            </label>

            {imageUrl ? (
              <div className="flex items-center gap-3 rounded-md border border-slate-700 bg-slate-800 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Uploaded preview"
                  className="h-16 w-16 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">Image uploaded</p>
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="mt-1 text-xs text-red-400 hover:text-red-300"
                  >
                    Remove &amp; re-upload
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-700 bg-slate-800/50">
                <UploadDropzone
                  endpoint="productImage"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]?.url) {
                      setImageUrl(res[0].url);
                      setUploadError("");
                    }
                  }}
                  onUploadError={(err) => {
                    setUploadError(err.message ?? "Upload failed.");
                  }}
                  appearance={{
                    container: "border-none bg-transparent p-4",
                    label: "text-slate-400 text-sm",
                    allowedContent: "text-slate-500 text-xs",
                    button:
                      "bg-white text-slate-900 text-sm font-medium hover:bg-slate-100 ut-readying:bg-slate-300 ut-uploading:bg-slate-300",
                  }}
                  content={{
                    label: (
                      <span className="flex flex-col items-center gap-1 text-slate-400">
                        <ImageIcon size={28} className="text-slate-500" />
                        Drag &amp; drop or click to upload
                      </span>
                    ),
                    allowedContent: "Images up to 4MB",
                  }}
                />
                {uploadError && (
                  <p className="px-4 pb-3 text-xs text-red-400">{uploadError}</p>
                )}
              </div>
            )}
          </div>

          {formError && (
            <p className="rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {formError}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="text-slate-400 hover:text-white"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
