Role: You are a Senior Next.js Developer and UI/UX Expert.
Context: You are continuing work on the "The White Laser" project (refer to `AI_INSTRUCTIONS.md`). We now need to add professional filtering and sorting to the Product Catalog.

Task: Implement a filtering sidebar and sorting mechanism on the `app/(public)/produse/page.tsx` page using URL Search Parameters. Please follow these exact steps:

1. Install necessary shadcn/ui components by running: `npx shadcn-ui@latest add select checkbox label input sheet`. (We include 'sheet' for a potential mobile filter drawer later).
2. Create a Client Component `components/shared/ProductFilters.tsx` (ensure it has "use client").
   - It should use `useRouter`, `usePathname`, and `useSearchParams` from `next/navigation`.
   - Implement logic to push new URL parameters when filters change (e.g., appending `?category=ardezie` or `?sort=price-asc`).
   - UI should include: A sorting dropdown (Select), and checkboxes for Categories (e.g., "Ardezie", "Lemn", "Accesorii").
3. Update `app/(public)/produse/page.tsx`:
   - Change the layout to include a sidebar for the `ProductFilters` component on the left (e.g., desktop `grid-cols-4`, where col-span-1 is filters and col-span-3 is the product grid).
   - The page component should receive `searchParams` as a prop (standard Next.js Server Component behavior).
   - Update your mock data array (or DB fetch if it exists) to dynamically filter and sort the products based on the current `searchParams` before mapping them to the `ProductCard` components.
4. Keep the styling premium, minimalist, and perfectly aligned with the existing `ProductCard`.

Do not break the existing grid; just wrap it alongside the new sidebar. Use `try/catch` if you implement any async data fetching. 

Confirm when completed and explain how the URL parameter logic was implemented.