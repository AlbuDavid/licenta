# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
npm run db:seed      # Seed the database (uses tsx)

npx prisma migrate dev --name <description>   # Create and apply a migration
npx prisma generate                            # Regenerate the Prisma client after schema changes
npx prisma studio                              # Open Prisma Studio (DB GUI)
```

There are no automated tests in this project.

## Style

- Use comments sparingly. Only comment complex or non-obvious code.

---

## Architecture

### Routing & Layouts

The app uses Next.js App Router with two distinct layout groups:

- **`app/layout.tsx`** — Root layout (default). Wraps everything with `<Providers>` (NextAuth `SessionProvider`), renders `<SiteHeader>` and `<CartDrawer>` globally.
- **`app/(editor)/layout.tsx`** — Editor layout group. The `/editor` route lives here and renders full-screen without the site header/cart.
- **`app/auth/`** — Auth pages (login, register, error) with their own layout.
- **`app/produse/`** — Product catalog and customization pages.

### Auth

NextAuth v4 with JWT strategy. Config lives in `lib/auth.ts` (`authOptions`). Uses `CredentialsProvider` only — email + bcrypt password. Email must be verified (`emailVerified` field) before login succeeds. The session is extended with `id` and `role` (USER | ADMIN) via JWT callbacks.

Verification flow: register → `VerificationToken` created → email sent via `lib/mail.ts` (Nodemailer) → `POST /api/auth/verify` validates token and sets `emailVerified`.

### Database

Prisma 7 with Neon PostgreSQL. Key architectural rules:

- Import `db` from `@/lib/db` — never instantiate `PrismaClient` directly.
- Generated client is at `lib/generated/prisma/` — import from `@/lib/generated/prisma/client`.
- **No `url` field in `schema.prisma`** — the datasource URL lives in `prisma.config.ts` (Prisma 7 requirement).
- `Product.price` is `Float` — always use `formatPrice()` from `lib/utils.ts` for display (`139.99` → `"139,99 RON"`).

Models: `User`, `Design` (Fabric.js canvas JSON), `VerificationToken`, `Product`.

### Vector Editor

The editor (`/editor`) is a full-screen Fabric.js canvas split into focused hooks:

| Hook | Responsibility |
|---|---|
| `useFabricCanvas` | Canvas init, ResizeObserver, zoom-to-fit on load, saves canvas to Zustand |
| `useEditorTools` | Tool activation (select/rect/ellipse/line/text/pan), object creation |
| `useCanvasEvents` | Fabric event listeners, selection sync |
| `useSelectionSync` | Keeps `editorStore.selectedObjects` in sync with canvas selection |
| `useHistory` | Undo/redo via snapshot stack in `editorStore` |
| `useAlignment` | Align/distribute selected objects |
| `useGrouping` | Group/ungroup objects |
| `useCornerRadius` | Apply rounded corners to rectangles |
| `useSnapping` | Object snapping guides |
| `useDrawingMode` | Freehand drawing toggle |
| `useCanvasNavigation` | Pan and keyboard navigation |
| `useExport` | Export canvas to PNG/SVG |
| `useSave` | Save design JSON to DB via `/api/designs` |
| `useProductTemplate` | Load product boundary/template onto canvas |
| `useObjectUpdater` | Batch-update properties on selected objects |

**Critical:** Page components call hook APIs only — no raw `fabric.*` calls outside hooks. Canvas state goes through `store/editorStore.ts` (Zustand), not React state.

Fabric.js requires the browser DOM — always load canvas components with `dynamic(..., { ssr: false })`.

The document coordinate space is 4000mm wide; initial zoom is calculated as `containerWidth / 4000`.

### State Management (Zustand)

- **`store/editorStore.ts`** — Canvas ref, selected objects, zoom, active tool, undo/redo history stack (max 50 snapshots). History uses `isRestoringHistory` guard to prevent recursive snapshot recording during undo/redo.
- **`store/cartStore.ts`** — Cart items with `persist` middleware (localStorage key: `white-laser-cart`). Prices stored as raw floats.

### API Routes

- `POST/GET /api/designs` — Save and list user designs (requires auth session).
- `POST /api/auth/verify` — Email verification token validation.
- `GET|POST /api/auth/[...nextauth]` — NextAuth handler.
