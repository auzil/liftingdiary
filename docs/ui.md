# UI Coding Standards

## Core Rule

> **ABSOLUTELY NO custom components. No exceptions.**

**Only shadcn/ui components may be used for UI.** This means:

- **Never** use raw HTML UI elements: no `<button>`, `<input>`, `<select>`, `<textarea>`, `<a>` as interactive UI — always use the shadcn equivalent.
- **Never** create a file in `src/components/` (outside of `src/components/ui/`).
- **Never** hand-roll UI with `<div className="...">` when a shadcn component exists for the job (cards, badges, separators, etc.).

If a shadcn/ui component exists for the use case, use it. If it does not exist, add it via the CLI:

```bash
npx shadcn add <component-name>
```

Components are installed to `src/components/ui/` and imported as `@/components/ui/<component>`.

---

## Configuration

- **Style:** `new-york`
- **Base color:** `neutral`
- **CSS variables:** enabled
- **Icons:** `lucide-react`

These are set in `components.json` and must not be changed.

---

## What "no custom components" means

| Allowed | Not allowed |
|---|---|
| `<Button>` from `@/components/ui/button` | `<MyButton>` wrapping a `<button>` |
| `<Card>`, `<CardHeader>`, `<CardContent>` | A hand-rolled `<div className="rounded-lg border p-4">` card |
| `<Input>` from `@/components/ui/input` | `<input className="...">` directly in a page |
| Composing shadcn primitives on a page | A `src/components/WorkoutCard.tsx` with custom markup |

Page-level JSX should compose shadcn primitives directly. There is no `src/components/` layer between pages and `src/components/ui/`.

---

## Icons

Use `lucide-react` exclusively. Import named icons directly:

```tsx
import { Dumbbell, Plus, Trash2 } from "lucide-react"
```

Do not use other icon libraries or inline SVGs.

---

## Styling

- Use Tailwind CSS utility classes for spacing, layout, and color.
- Color tokens come from shadcn's CSS variables (`bg-background`, `text-foreground`, `text-muted-foreground`, etc.). Prefer these over raw zinc/gray values.
- Use `cn()` from `@/lib/utils` when conditionally merging classes:

```tsx
import { cn } from "@/lib/utils"

<div className={cn("p-4", isActive && "bg-accent")} />
```

- Do not write CSS files or `<style>` blocks.

---

## Available shadcn components

Run `npx shadcn add` to see the full list. Commonly needed components for this app:

- `button` — primary actions
- `card` — workout/exercise tiles
- `input` — text and number fields
- `label` — form labels
- `badge` — status indicators
- `separator` — visual dividers
- `skeleton` — loading states
- `table` — tabular data
- `dialog` — modals
- `dropdown-menu` — context menus
- `form` — form wrappers with validation

Add components on demand; do not pre-install everything.

---

## Dates

Install `date-fns` before formatting any dates:

```bash
npm install date-fns
```

All dates displayed in the UI must be formatted with `date-fns`. The required format is `dd.MM.yyyy` (e.g. `31.02.2025`).

```tsx
import { format } from "date-fns"

format(new Date(workout.date), "dd.MM.yyyy")
```

Do not use `Date.prototype.toLocaleDateString()`, `Intl.DateTimeFormat`, or string manipulation to format dates.
