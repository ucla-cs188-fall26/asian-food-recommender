# Plan to finish the prototype

Read [AGENTS.md](../AGENTS.md) first for commands, code rules and hard
constraints. This file says what exists, what to build, and in what order.

## 1. What the app must do

1. The user picks starting filters: ingredients they have, cuisines, equipment
   and maximum difficulty. (No time filter. See AGENTS.md constraint 3.)
2. The app loads recipes for those cuisines and ranks them.
3. The app shows a flowgraph. The root node is the starting filters with its
   top recipes.
4. Each edge is exactly one filter change ("Add potato", "Add oven", "Allow
   medium difficulty"). The node it leads to shows the changed filters and the
   top recipes under them.
5. The user can explore any node to generate further one-change alternatives
   from it. The graph is capped at 12 nodes and 2 levels below the root.
6. Selecting a node shows its recipes in a details panel, with reasons, what
   is missing, substitutions and steps.
7. A reset button returns to the starting filters.

## 2. What already exists

All of this is committed on the `prototype` branch and passes tests.

| File | What it provides |
|---|---|
| `src/domain/types.ts` | `CUISINES`, `Cuisine`, `Difficulty` (1/2/3), `DIFFICULTY_LABELS`, `EQUIPMENT`, `Equipment`, `RecipeStep`, `Recipe` |
| `src/domain/normalize.ts` | `normalizeName`, `normalizeList` (lowercase, trim, collapse spaces) |
| `src/domain/ingredients.ts` | `canonicalIngredient`, `canonicalIngredients` (plural, descriptor and alias handling) |
| `src/domain/kitchen.ts` | `isStaple` (pantry basics that never block a recipe), `toEquipment` (tool name to `Equipment`) |
| `src/domain/difficulty.ts` | `deriveDifficulty(ingredientCount, stepCount)` |
| `src/data/spoonacular.ts` | `fetchCuisine`, `loadRecipes`, `toRecipe`, `getApiKey`, `SpoonacularError`, `clearSessionCache` |
| `src/data/sampleRecipes.ts` | `SAMPLE_RECIPES`: 20 hand-written recipes across all 6 cuisines |
| `src/data/recipes.ts` | `getRecipes(cuisines)` returning `{ recipes, source, notice? }`; `sampleRecipesFor` |
| `src/App.tsx` | **Temporary** test page that lists recipes. Replace it in Task 5. |

Facts about `Recipe` that the remaining work depends on:

- `requiredIngredients`, `optionalIngredients`, `stapleIngredients` and the
  keys and values of `substitutions` are already canonical names.
- `requiredIngredients` never contains staples (salt, water, oil, sugar...).
  Staples are assumed to be on hand and are never "missing".
- `substitutions` maps a required ingredient to stand-ins. Only sample recipes
  have entries; for Spoonacular recipes it is `{}`.
- `requiredEquipment` contains only values from `EQUIPMENT`. It may be empty
  for Spoonacular recipes whose steps never name a pan.
- `steps[].brief` exists only on sample recipes.
- `source` is `'spoonacular'` or `'sample'`.

`getRecipes` uses Spoonacular when `VITE_SPOONACULAR_API_KEY` is set and falls
back to the samples (with a `notice` string) when there is no key or the
request fails. Call it; do not call `fetch` anywhere else.

## 3. Task order and who can work in parallel

```
Task 1 filters ──► Task 2 scoring ──► Task 3 branches ──► Task 4 graph state ─┐
      │                                                                       ├─► Task 7 integration
      └──────────► Task 5 filter form + app shell ──► Task 6 node + details ──┘
                                                                              └─► Task 8 README + cleanup
```

- **Person A (logic):** Tasks 1, 2, 3, 4, in that order.
- **Person B (interface):** Task 5 as soon as Task 1 is merged, then Task 6.
  Task 6 can be built against the type contracts in this file before Tasks 2-4
  are finished, using hand-made test data.
- **Together:** Task 7, then Task 8.

The type signatures below are the contract between the two tracks. If one has
to change, update this file in the same commit.

---

## Task 1: Filter state

**Create** `src/domain/filters.ts` and `src/domain/filters.test.ts`.

```ts
import type { Cuisine, Difficulty, Equipment } from './types'

export interface FilterState {
  /** Canonical names, sorted A-Z, no duplicates. */
  readonly ingredients: readonly string[]
  /** In CUISINES order, no duplicates. */
  readonly cuisines: readonly Cuisine[]
  /** In EQUIPMENT order, no duplicates. */
  readonly equipment: readonly Equipment[]
  readonly maxDifficulty: Difficulty
}

export interface FilterInput {
  ingredients: Iterable<string>
  cuisines: Iterable<Cuisine>
  equipment: Iterable<Equipment>
  maxDifficulty: Difficulty
}

export function createFilterState(input: FilterInput): FilterState
export function filterStateId(state: FilterState): string
export function summarizeFilters(state: FilterState): string
export const DEFAULT_FILTERS: FilterState
```

Rules:

- `createFilterState` is the only way to build a `FilterState`. It runs
  ingredients through `canonicalIngredients`, drops staples (`isStaple`),
  removes duplicates and sorts as documented above.
- `filterStateId` returns exactly
  `c=<cuisines joined by ,>|i=<ingredients joined by ,>|e=<equipment joined by ,>|d=<maxDifficulty>`.
  Two states with the same contents must give the same id regardless of the
  order the inputs arrived in. This id is the graph node id.
- `summarizeFilters` returns a short human string, for example
  `Chinese, Korean · tofu, egg · stove · up to Easy`. Use `none` for an empty
  ingredient or equipment list.
- `DEFAULT_FILTERS`: cuisines Chinese, Japanese and Korean; ingredients
  `tofu`, `egg`; equipment `stove`; `maxDifficulty` 1.
- The cook's experience level (beginner or experienced) is **not** part of
  `FilterState`. It only changes how steps are displayed (Task 6).

Tests: same contents in different order give the same id; `" Green Onions "`
and `"scallion"` collapse to one ingredient; staples are dropped; changing any
one field changes the id.

## Task 2: Scoring

**Create** `src/domain/scoring.ts` and `src/domain/scoring.test.ts`.

```ts
import type { FilterState } from './filters'
import type { Equipment, Recipe } from './types'

export interface Evaluation {
  recipe: Recipe
  /** Required ingredients the user has. */
  haveIngredients: string[]
  /** Required ingredients covered by a stand-in the user has. */
  substituted: { ingredient: string; using: string }[]
  /** Required ingredients with no match and no owned stand-in. */
  missingIngredients: string[]
  missingEquipment: Equipment[]
  /** max(0, recipe.difficulty - state.maxDifficulty) */
  difficultyOver: number
  /** missingIngredients.length + missingEquipment.length + difficultyOver */
  changesNeeded: number
  /** changesNeeded === 0 */
  makeable: boolean
  /** Integer 0-100. */
  score: number
  /** Short human-readable reasons, most important first. */
  reasons: string[]
}

export const TOP_N = 3

/** Returns undefined when the recipe's cuisine is not selected. */
export function evaluate(recipe: Recipe, state: FilterState): Evaluation | undefined
export function rank(recipes: readonly Recipe[], state: FilterState): Evaluation[]
export function topRecipes(recipes: readonly Recipe[], state: FilterState): Evaluation[]
```

Rules:

- A required ingredient is **have** if it is in `state.ingredients`; otherwise
  **substituted** if any of `recipe.substitutions[ingredient]` is in
  `state.ingredients` (use the first match, in listed order); otherwise
  **missing**. Optional and staple ingredients are ignored entirely.
- Score, rounded to the nearest integer:
  - Ingredients, 70 points: `70 * (have + 0.5 * substituted) / required`.
  - Equipment, 15 points: `15 * ownedRequired / required`, or 15 when the
    recipe needs no equipment.
  - Difficulty, 15 points: 15 if `difficultyOver` is 0, 7 if 1, 0 if 2.
- `rank` drops `undefined` results and sorts by: makeable first; then higher
  score; then fewer `changesNeeded`; then recipe name A-Z; then recipe id.
  The order must be fully deterministic.
- `topRecipes` is `rank(...).slice(0, TOP_N)`.
- `reasons` use these exact templates, in this order, including only those
  that apply:
  1. `Uses {n} of {m} required ingredients you have`
  2. `Swap in {using} for {ingredient}` (one per substitution)
  3. `Missing: {a}, {b}` (omit when nothing is missing)
  4. `Needs equipment you don't have: {a}, {b}`
  5. `Rated {Label}, above your {Label} limit`
  6. `You can make this now` (only when `makeable`)
- Never describe a recipe as makeable when `changesNeeded > 0`.

Tests (use a few hand-built `Recipe` objects plus `SAMPLE_RECIPES`):

- With ingredients `egg`, `tomato`, `scallion` and equipment `stove`, the
  sample "Tomato and Egg Stir-Fry" is makeable and ranks first among Chinese.
- A substitution counts half and produces the `Swap in` reason.
- A recipe in an unselected cuisine is excluded.
- Missing equipment and over-limit difficulty each add to `changesNeeded`.
- `rank` returns the same order when the input array is shuffled.

## Task 3: Branch generator

**Create** `src/domain/branches.ts` and `src/domain/branches.test.ts`.

```ts
import type { FilterState } from './filters'
import type { Difficulty, Equipment, Recipe } from './types'

export type Change =
  | { kind: 'add-ingredient'; ingredient: string }
  | { kind: 'add-equipment'; equipment: Equipment }
  | { kind: 'raise-difficulty'; to: Difficulty }

export interface Suggestion {
  change: Change
  /** "Add potato" | "Add oven" | "Allow medium difficulty" */
  label: string
  childState: FilterState
  childId: string
  /** Recipes not makeable in the parent that are makeable in the child. */
  newlyMakeable: Recipe[]
  /** Recipes in the child's top N that were not in the parent's top N. */
  enteredTop: Recipe[]
  /** One sentence for the interface. */
  explanation: string
}

export const MAX_SUGGESTIONS = 4

export function applyChange(state: FilterState, change: Change): FilterState
export function changeLabel(change: Change): string
export function suggestChanges(
  recipes: readonly Recipe[],
  state: FilterState,
  limit?: number, // default MAX_SUGGESTIONS
): Suggestion[]
```

Algorithm for `suggestChanges`:

1. `parentRank = rank(recipes, state)`.
2. Collect candidate changes:
   - From every evaluation with `changesNeeded === 1`: the single change that
     fixes it (`add-ingredient` for its one missing ingredient, `add-equipment`
     for its one missing item, or `raise-difficulty` to `maxDifficulty + 1`).
   - If that yields fewer than `limit` distinct candidates, also take, from
     the 10 best-scoring non-makeable evaluations, an `add-ingredient`
     candidate for each of their missing ingredients. These "move closer"
     without finishing a recipe.
   - `raise-difficulty` is only ever one level up and never above 3.
3. De-duplicate candidates by `filterStateId(applyChange(state, change))`.
4. For each candidate compute the child ranking and `newlyMakeable` and
   `enteredTop`. **Discard the candidate if both are empty.** A change that
   reveals nothing must not become a branch.
5. Sort by `newlyMakeable.length` descending, then `enteredTop.length`
   descending, then `label` A-Z. Return the first `limit`.

Other rules:

- `applyChange` must go through `createFilterState` so the result is sorted
  and its id is stable.
- `changeLabel`: `Add {ingredient}`, `Add {equipment}`,
  `Allow {label lowercased} difficulty`.
- `explanation`: `Makes {n} more recipe(s) cookable: {names}` when
  `newlyMakeable` is non-empty, otherwise
  `Brings {names} into your top {TOP_N}`. List at most 3 names.
- An empty array is a valid result. The interface shows "No single change
  reveals new recipes from here" in that case.

Tests:

- The spec example: with `SAMPLE_RECIPES`, cuisines Korean, ingredients
  `tofu`, `egg`, `soy sauce`, `garlic`, equipment `stove`, difficulty 1, the
  suggestions include `Add potato`, and its `newlyMakeable` contains "Dubu
  Jorim (Braised Tofu with Egg and Potato)".
- A recipe that needs only an `oven` produces `Add oven`.
- A recipe one difficulty level over the limit produces
  `Allow medium difficulty`; one two levels over does not produce a
  suggestion by itself.
- Every suggestion changes exactly one field compared with the parent.
- No two suggestions share a `childId`, and none equals the parent id.
- A state where nothing helps returns `[]`.

## Task 4: Graph state and layout

**Create** `src/graph/graphState.ts`, `src/graph/graphState.test.ts`,
`src/graph/layout.ts`, `src/graph/layout.test.ts`.

```ts
// graphState.ts
import type { Change } from '../domain/branches'
import type { FilterState } from '../domain/filters'
import type { Recipe } from '../domain/types'

export const MAX_NODES = 12
export const MAX_DEPTH = 2

export interface GraphNode {
  id: string            // filterStateId(state)
  state: FilterState
  depth: number         // 0 for the root
  parentId?: string     // the node it was first reached from
  change?: Change       // the change on the edge from parentId
  expanded: boolean
  /** Set when expanding produced nothing or hit a limit. */
  note?: string
}

export interface GraphEdge {
  id: string            // `${source}->${target}`
  source: string
  target: string
  label: string         // changeLabel(change)
}

export interface GraphState {
  rootId: string
  nodes: Record<string, GraphNode>
  edges: GraphEdge[]
  selectedId: string
  /** Graph-level message, e.g. the node limit was reached. */
  message?: string
}

export type GraphAction =
  | { type: 'start'; filters: FilterState; recipes: readonly Recipe[] }
  | { type: 'expand'; nodeId: string; recipes: readonly Recipe[] }
  | { type: 'select'; nodeId: string }
  | { type: 'reset'; recipes: readonly Recipe[] }

export function createGraph(filters: FilterState, recipes: readonly Recipe[]): GraphState
export function graphReducer(state: GraphState, action: GraphAction): GraphState
```

Rules:

- `start` builds a graph with only the root, selects it, and then expands the
  root immediately, so the user sees alternatives straight away.
- `expand`:
  - Unknown `nodeId`, or node already `expanded`: return state unchanged.
  - `depth >= MAX_DEPTH`: set the node's `note` to
    `Exploration stops {MAX_DEPTH} levels from the start.` and mark it
    expanded. Add nothing.
  - Otherwise call `suggestChanges(recipes, node.state)`. For each suggestion
    in order:
    - If a node with `childId` already exists: add the edge if that exact edge
      id is not present, and do not create a node (no duplicate states).
    - Else if the node count is below `MAX_NODES`: add the node (depth + 1,
      `parentId`, `change`, `expanded: false`) and the edge.
    - Else: stop, and set `message` to
      `The graph is limited to {MAX_NODES} scenarios. Reset to explore a different path.`
  - No suggestions: set the node's `note` to
    `No single change reveals new recipes from here.`
  - Mark the node expanded.
- `select` sets `selectedId` when the node exists.
- `reset` returns `createGraph(rootNode.state, recipes)`: same starting
  filters, a fresh graph.
- The reducer is pure. Never mutate the previous state.

```ts
// layout.ts
export type Direction = 'LR' | 'TB'
export const NODE_WIDTH = 300
export const NODE_HEIGHT = 220

export function layoutGraph(
  graph: GraphState,
  direction: Direction,
): Record<string, { x: number; y: number }>
```

- Use dagre: `import * as dagre from '@dagrejs/dagre'`, then
  `new dagre.graphlib.Graph()`, `setGraph({ rankdir: direction, nodesep: 40, ranksep: 90 })`,
  `setDefaultEdgeLabel(() => ({}))`, `setNode(id, { width, height })`,
  `setEdge(source, target)`, `dagre.layout(g)`. dagre returns node centres;
  subtract half the width and height to get the top-left position React Flow
  wants. Check `node_modules/@dagrejs/dagre/dist/types/index.d.ts` if the
  types disagree with this.

Tests:

- After `start`, the root exists at depth 0, is selected and is expanded.
- Expanding never creates two nodes with the same id; a state reachable two
  ways gets two edges and one node.
- The node count never exceeds `MAX_NODES`, and `message` is set when the cap
  stops an expansion.
- Nodes at `MAX_DEPTH` do not gain children and get the note.
- `reset` returns to a graph equal to `createGraph` with the original filters.
- The previous state object is not mutated (compare a deep copy).
- `layoutGraph` returns one position per node, and in `LR` every child's `x`
  is greater than its parent's.

## Task 5: App shell and filter form

**Replace** `src/App.tsx` (delete the temporary test page). **Create**
`src/ui/FilterForm.tsx`.

`FilterForm` props:

```ts
interface FilterFormProps {
  initial: FilterState
  /** Canonical ingredient names to offer as suggestions. */
  ingredientOptions: readonly string[]
  isLoading: boolean
  onSubmit: (filters: FilterState) => void
}
```

Form contents, each with a visible `<label>` or `<legend>`:

- **Cuisines:** one checkbox per `CUISINES` entry. At least one is required;
  show a text error and block submit otherwise. Never present "Asian" as a
  single option.
- **Ingredients you have:** a text input with a `<datalist>` of
  `ingredientOptions`. Enter or an "Add" button adds a chip; each chip has a
  remove button with `aria-label="Remove {name}"`. Accept comma-separated
  input. Canonicalise through `createFilterState` before display so the chips
  show what will be matched.
- **Equipment you have:** one checkbox per `EQUIPMENT` entry.
- **Maximum difficulty:** radio group Easy / Medium / Hard.
- **Submit:** `Find recipes`, disabled while `isLoading`.

`App` responsibilities:

- State: `filters` (starts as `DEFAULT_FILTERS`), `recipeLoad`
  (`RecipeLoad | undefined`), the graph via
  `useReducer(graphReducer, ...)` once Task 4 exists, `experience`
  (`'beginner' | 'experienced'`, default `'beginner'`), and a pending flag
  from `useTransition`.
- On submit: `const load = await getRecipes(filters.cuisines)`, store it, then
  dispatch `{ type: 'start', filters, recipes: load.recipes }`.
- `ingredientOptions`: the sorted union of `requiredIngredients` across
  `SAMPLE_RECIPES` plus any currently loaded recipes.
- Layout: a header with the title and one or two sentences explaining that
  changing one condition at a time reveals different recipes; the filter form
  in a left sidebar on wide screens and above the graph below 768px; the
  graph area; the details area below the graph; the footer.
- Show `recipeLoad.notice` in a visible, text-labelled notice when present.
- Show the caption `Up to 12 scenarios, 2 changes deep.` near the graph, built
  from `MAX_NODES` and `MAX_DEPTH`.
- A `Reset exploration` button dispatches `reset`.
- Keep the footer link to `https://spoonacular.com/food-api`.

Until Tasks 4 and 6 land, render a placeholder where the graph and details
will go so this task can be merged independently.

## Task 6: Scenario node, flowgraph and recipe details

**Create** `src/ui/ScenarioNode.tsx`, `src/ui/FlowGraph.tsx`,
`src/ui/RecipeDetails.tsx`.

React Flow 12 imports:
`import { ReactFlow, Background, Controls, Handle, Position } from '@xyflow/react'`
and `import '@xyflow/react/dist/style.css'` (once, in `FlowGraph.tsx`).
The container must have an explicit height or the graph renders empty.

**ScenarioNode** (custom node type `scenario`, fixed to `NODE_WIDTH` x
`NODE_HEIGHT`; let its recipe list scroll if it overflows). It shows:

- A heading: `Start` for the root (plus a double border), otherwise
  `Change: {edge label}`. The text, not the border, carries the meaning.
- `summarizeFilters(state)`, with the item the change added visually
  emphasised **and** marked with text such as `(new)`.
- The top `TOP_N` recipes: name, difficulty label, and status text
  `Ready` when makeable or `Missing {changesNeeded}` otherwise. **No time.**
- A text badge per recipe compared with the parent node: `New` if it was not
  in the parent's top N, `Now ready` if it was not makeable in the parent.
- An `Explore changes` button that dispatches `expand`. When the node is
  expanded, replace it with the node's `note` if there is one, or with
  `Explored`. Add the class `nodrag` to the button so React Flow does not
  swallow the click.
- Clicking the node body dispatches `select`. The selected node has a thicker
  border and the text `Selected`.

**FlowGraph** props: `graph`, `recipes`, `onExpand(nodeId)`,
`onSelect(nodeId)`.

- Build React Flow nodes from `graph.nodes` and positions from
  `layoutGraph(graph, direction)`. Build edges from `graph.edges` with the
  `label` shown on the edge and an arrow marker.
- `direction` is `'TB'` when the viewport is narrower than 768px, otherwise
  `'LR'`. Use `window.matchMedia` in a small hook.
- `fitView` on mount and whenever the node count changes. Enable pan and
  zoom; include `<Controls />`. Nodes are not connectable or deletable.
- When `graph.message` is set, show it as text above the graph.

**RecipeDetails** props: `evaluations` (the full `rank` result for the
selected node), `experience`, `onExperienceChange`.

- A heading naming the selected scenario and a toggle between
  `Beginner steps` and `Concise steps`.
- For each evaluation (show the first 8, with a `Show all` button): name,
  cuisine, difficulty label, status text (`Ready` or `Missing {n}`), the
  `reasons` list, and then inside a `<details>`:
  - `Listed time: {n} min` when `listedMinutes` exists, with the note
    `as given by the source; often a placeholder` for Spoonacular recipes.
  - Ingredient amounts (`ingredientLines`).
  - Missing ingredients and missing equipment as explicit text lists.
  - Substitutions for each missing ingredient that has any.
  - Steps: `step.brief ?? step.text` in concise mode, `step.text` in beginner
    mode. In beginner mode also show `step.tools` and `step.minutes` when
    present.
  - A link to `sourceUrl` when present.

## Task 7: Integration and browser check

- Wire `FlowGraph` and `RecipeDetails` into `App`, replacing the Task 5
  placeholders.
- Run `npm run dev` and check by hand, with no API key (samples) and with a
  key (live data, one cuisine to save quota):
  1. Defaults produce a root with at least one child.
  2. The spec example works: Korean; `tofu`, `egg`, `soy sauce`, `garlic`;
     `stove`; Easy. An `Add potato` edge appears and its node shows the
     braised tofu recipe as `Now ready`.
  3. `Explore changes` on a child adds grandchildren; a grandchild shows the
     depth note instead of expanding.
  4. Selecting a node updates the details panel.
  5. `Reset exploration` returns to root plus first-level children.
  6. Changing filters and submitting rebuilds the graph.
  7. At 375px wide the graph lays out top-to-bottom and nothing overflows the
     page horizontally (the graph pans inside its own box).
  8. No console errors.
- Fix whatever this turns up.

## Task 8: README and cleanup

- Recreate `.env.example` at the repo root and make sure it is committed
  (it has gone missing twice; do not rename it, copy it):
  ```
  # Copy this file to .env.local and paste your Spoonacular API key.
  # .env.local is ignored by git. Get a key at https://spoonacular.com/food-api
  VITE_SPOONACULAR_API_KEY=
  ```
- Rewrite `README.md` with: what the app does (two or three sentences);
  prerequisites (Node 22 or later); install and run steps; the optional API
  key step and what happens without one; a walkthrough of the core scenario
  using the spec example from Task 7; how to run the tests; and a short
  "Data and limitations" section (see section 5 below).
- Confirm nothing temporary is left in `src/App.tsx`.

## 4. Stretch goals (only after Task 8)

1. **Trace a recipe:** selecting a recipe outlines every node whose top N
   contains it.
2. **Make this my starting point:** a node button that dispatches `start`
   with that node's state.
3. **List view:** the same graph as a nested list for keyboard and screen
   reader users.
4. **Substitutes on demand:** Spoonacular's ingredient-substitutes endpoint,
   called only when the user asks about one missing ingredient (it costs
   points).

## 5. Known data limitations (say these in the README and write-up)

- Spoonacular reports 45 minutes for most recipes, so time is display-only.
- Spoonacular has no difficulty field. Ours is derived from ingredient and
  step counts. None of the 20 samples rates as Hard (13 Easy, 7 Medium), so
  the "Allow hard difficulty" edge appears only with live data.
- Spoonacular's catalogue is small for some cuisines (23 Korean and 28
  Japanese recipes in total when checked).
- Some live ingredient names are noisy ("3 thai chili pods", "optional
  peanut"). If time allows, extend `DESCRIPTORS` and `ALIASES` in
  `src/domain/ingredients.ts`, with a test per addition.
- Many live recipes list no equipment because their steps never name a pan.
  Do not guess; an empty `requiredEquipment` means "none detected".
- Live recipes have no substitutions, optional ingredients or brief steps.
- The API key is sent from the browser, so a public deployment would expose
  it. Run locally, or deploy without a key (samples only).
- The 20 sample recipes have not been test-cooked. A team member should
  check their times and heat levels before the demo.
