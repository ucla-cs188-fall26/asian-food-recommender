# Agent guide

Asian Recipe Explorer: a client-side React app for CS 188. Users enter filters
(ingredients, cuisines, equipment, maximum difficulty) and explore an
interactive flowgraph in which each edge is exactly one filter change and each
node shows the recipes that rank best under that filter state.

**The work to do is in [docs/PLAN.md](docs/PLAN.md). Read it before changing
anything, and implement one task at a time.**

## Commands

| Purpose | Command |
|---|---|
| Install | `npm install` |
| Dev server | `npm run dev` |
| Tests (Vitest) | `npm test` |
| Type check | `npx tsc -b` |
| Lint (oxlint) | `npm run lint` |
| Production build | `npm run build` |

A task is done only when `npm test`, `npx tsc -b`, `npm run lint` and
`npm run build` all pass.

## Stack

- Vite 8, React 19, TypeScript 7 (strict), Tailwind CSS v4 (via
  `@tailwindcss/vite`; there is no `tailwind.config.js`).
- React Compiler is enabled in `vite.config.ts`. Do not add `useMemo`,
  `useCallback` or `React.memo`.
- `@xyflow/react` 12 (React Flow) for the graph, `@dagrejs/dagre` 3 for layout.
- Vitest 5 for tests. Test files sit next to the code as `*.test.ts`.

## Code rules

- Function components and hooks only.
- `tsconfig.app.json` sets `verbatimModuleSyntax` and `erasableSyntaxOnly`:
  use `import type` for types, and no `enum`, `namespace` or parameter
  properties. Use `as const` arrays and union types (see `src/domain/types.ts`).
- `src/domain/` and `src/graph/` must not import React or anything from
  `src/ui/`. They are pure functions and must stay unit-testable.
- Every ingredient name that enters the system goes through
  `canonicalIngredient` / `canonicalIngredients` (`src/domain/ingredients.ts`).
  Never compare raw ingredient strings.
- Do not rely on colour alone to convey state. Pair it with text.

## Hard constraints (decided; do not change)

1. **Spoonacular data is never stored.** Their terms forbid saving ingredients
   or instructions. Recipes fetched from the API live in memory for the page
   session only: no `localStorage`, `sessionStorage`, IndexedDB, files or
   fixtures containing real API responses. Test fixtures must be hand-written.
2. **Tests never call the network.** Pass a mocked `fetchImpl` (see
   `src/data/spoonacular.test.ts`). The free plan allows only 50 points a day
   and one cuisine costs about 3.
3. **Time is not a filter, a score input or an edge type.** Spoonacular reports
   a placeholder 45 minutes for most recipes. `Recipe.listedMinutes` is shown
   only in the recipe details, labelled "Listed time". It never appears on a
   graph node.
4. **The API key stays out of git and out of logs.** It lives in `.env.local`
   as `VITE_SPOONACULAR_API_KEY`. Never print it, commit it or paste it into
   code. The app must work with no key by falling back to the saved samples.
5. **One filter change per edge.** Never combine two changes on one edge.
6. **Keep the Spoonacular backlink** in the page footer (required by the free
   plan).

## Git

- Work on the `prototype` branch. Small commits, one task per commit.
- Do not push, force-push or rewrite history unless a human asks.
