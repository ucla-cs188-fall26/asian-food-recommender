# WOKSTAR 

<img src="https://i.imgur.com/y8yfdoF.png" alt="Alt text" width="200" />

Explore recipes through a graph of small changes to your kitchen constraints.
Each edge adds exactly one ingredient or piece of equipment, or raises the
maximum difficulty by one level, showing which recipes that change opens up.
Select a scenario for ranked recipes, missing items, substitutions and steps.

## Run locally

Prerequisites: Node.js 22 or later and npm.

```sh
git checkout prototype
npm install
npm run dev
```

Open the local URL Vite prints. The app starts with sample recipes and works
without an API key. Choose cuisines, add the ingredients and equipment you
have, set a difficulty limit, and click **Find recipes**.

### Optional live data

Copy `.env.example` to `.env.local` and set:

```dotenv
VITE_SPOONACULAR_API_KEY=your_key_here
```

Get a key from the [Spoonacular API](https://spoonacular.com/food-api) and
restart Vite after changing the environment file. `.env.local` is ignored;
never commit it or log the key. When a key is configured, submitting filters
loads live recipes; failures fall back to samples with a visible data notice.
Without a key the app uses 20 hand-written samples across six cuisines.

The team's free-plan budget is 50 points per day; each cuisine load costs
about 3. Start with one cuisine for a live check. Already loaded cuisine data
is cached in memory for the page session only. Reloading clears that cache.

## Core scenario walkthrough

1. Select **Korean** only.
2. Set ingredients to **tofu, egg, soy sauce, garlic**, equipment to **stove**,
   and maximum difficulty to **Easy**.
3. Click **Find recipes**. The start scenario is missing potato for the
   braised tofu recipe.
4. Follow **Add potato**. Its scenario shows **Dubu Jorim (Braised Tofu with
   Egg and Potato)** as **Now ready**, showing the effect of one constraint.
5. Select that scenario to read its ranking reasons, ingredient amounts and
   cooking steps. Switch between **Beginner steps** and **Concise steps**.
6. Use **Explore changes** on an unexplored node. Branches appear only when
   they reveal a newly cookable recipe or a new top-three recipe. An empty
   result is valid; the small Korean collection can stop at this point.
7. **Reset exploration** restores the original filters and first-level
   alternatives. Submitting different filters creates a fresh graph.

The graph supports pan, zoom and fit-to-view controls, with at most 12
scenarios and two changes below the start. Narrow screens use vertical
layout. The selected scenario and readiness always have text labels.

## Checks

Run all four before committing a task:

```sh
npm test
npx tsc -b
npm run lint
npm run build
```

Tests use hand-written fixtures and mocked network responses; they never
call the real API. The integration test forces sample mode even if a local
key is configured. See [verification notes](docs/VERIFICATION.md) for manual
browser checks still needed and the sample timing/heat review.

## Data and limitations

- Live Spoonacular recipes stay in memory only. Never save responses,
  ingredient lists or instructions to files, fixtures or browser storage.
- Time is display-only, labelled **Listed time** inside recipe details.
  Spoonacular commonly supplies a placeholder of 45 minutes.
- Difficulty is derived from ingredient and step counts, rather than supplied
  by Spoonacular. Samples include 13 Easy and 7 Medium recipes; none is Hard.
- Some cuisine catalogues are small (23 Korean and 28 Japanese recipes when
  the team checked). Live ingredient names can be noisy.
- An empty equipment list means none was detected; equipment is not guessed.
  Live recipes have no substitutions, optional ingredients or brief steps.
- Substitutions cover ingredient matching, but do not rewrite cooking steps.
  All samples were read for timing and heat; they have not been test-cooked.
  The review records specific follow-ups before the demo.
- The browser sends the API key. For public deployment, use samples without
  a key; keep keyed use local.
- API quota or outages can interrupt live loads; the sample fallback keeps
  exploration available. Dense graphs require panning/zooming on small screens.

## Project

React, TypeScript, Vite, Tailwind CSS, React Flow, dagre and Vitest.
[AGENTS.md](AGENTS.md) contains project rules and [docs/PLAN.md](docs/PLAN.md)
contains the task contracts. Work uses a separate branch and one commit per
task, merged locally into `prototype` after checks. Nothing is pushed automatically.
