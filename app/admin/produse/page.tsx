import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { AddProductModal } from "@/components/admin/AddProductModal";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export default async function AdminProduseePage() {
  const products = await db.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Product Management</h1>
          <p className="mt-1 text-sm text-slate-400">
            {products.length} product{products.length !== 1 ? "s" : ""} in the catalog.
          </p>
        </div>
        <AddProductModal />
      </div>

      {/* Products table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="w-20 text-slate-400">Image</TableHead>
              <TableHead className="text-slate-400">Name</TableHead>
              <TableHead className="text-slate-400">Price</TableHead>
              <TableHead className="text-slate-400">Category</TableHead>
              <TableHead className="text-slate-400">Customizable</TableHead>
              <TableHead className="text-right text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow className="border-slate-800">
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-slate-500"
                >
                  No products yet. Click &quot;Add New Product&quot; to get started.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className="border-slate-800 hover:bg-slate-800/50">
                  {/* Image */}
                  <TableCell>
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-800 text-slate-600 text-xs">
                        N/A
                      </div>
                    )}
                  </TableCell>

                  {/* Name + description */}
                  <TableCell>
                    <p className="font-medium text-white">{product.name}</p>
                    {product.description && (
                      <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">
                        {product.description}
                      </p>
                    )}
                  </TableCell>

                  {/* Price */}
                  <TableCell className="text-slate-300">
                    {formatPrice(product.price)}
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                      {product.category}
                    </span>
                  </TableCell>

                  {/* Customizable */}
                  <TableCell>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        product.isCustomizable
                          ? "bg-emerald-950 text-emerald-400"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {product.isCustomizable ? "Yes" : "No"}
                    </span>
                  </TableCell>

                  {/* Actions — placeholder for edit/delete (next step) */}
                  <TableCell className="text-right">
                    <span className="text-xs text-slate-600">—</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
