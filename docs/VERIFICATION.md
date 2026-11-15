# Prototype verification

The automated suite covers canonical filters, scoring, branch usefulness,
shared graph states, caps, layout direction, and the Korean core scenario
through loading, expansion, selection, reset and changing the start filters.
API tests use mocked fetch; the integration test explicitly disables the key.

## Browser checks still required

This environment could start Vite but could not expose a browser: Browser Use
reported no available browser, and the Windows Computer Use native pipe was
unavailable. There was no `.env.local`, so no live API request was made.

Before the demo, complete Task 7's browser checklist in `docs/PLAN.md`:
defaults, Korean Add potato / Now ready, grandchildren and depth note, details
selection, reset, filter resubmission, 375px layout without page overflow,
and no console errors. Repeat with one live cuisine if a key is available.
Do not save responses, browser storage, HAR files or screenshots containing
live recipe instructions or ingredients.

## Sample time and heat read-through

All 20 hand-written samples were read against their full and concise steps.
These are editorial observations, not test-cooking validation. Listed totals
include preparation unless an assumption is called out below. No recipe data
was changed based on untested estimates.

| Sample | Listed min | Review / demo follow-up |
| --- | ---: | --- |
| Tomato and Egg Stir-Fry | 15 | Heat reductions and short egg/tomato stages are explicit; total allows preparation. |
| Mapo Tofu | 25 | Medium-high pork stage drops to medium for aromatics, then gentle simmer. Validate pork doneness wording. |
| Egg Fried Rice | 15 | Assumes cooked, cold rice; cooking and cooling rice are outside this total. |
| Steamed Fish with Ginger and Scallion | 20 | Allow water heating as well as 7–9 min steaming; review smoking-hot oil instruction before a cooking demo. |
| Oyakodon | 20 | Assumes cooked rice. Review chicken doneness wording and barely-set egg instruction. |
| Miso Soup with Tofu | 10 | Wakame soak can overlap preparation and water heating; low heat after miso is explicit. |
| Teriyaki Chicken | 25 | 13–15 min pan/sauce stages leave preparation time. Review juices-run-clear wording. |
| Kimchi Fried Rice | 15 | Assumes cooked, cold rice; timing is tight if eggs are not cooked in parallel. |
| Tteokbokki | 20 | Hard rice cakes need 10 min soaking plus 9–11 min simmering and preparation/heating; total may understate elapsed time. |
| Gamja Jorim | 25 | 15–19 min cooking plus cutting is plausible; use fork-tender cue. |
| Dubu Jorim | 25 | About 16–17 min cooking plus prep; thin potato slices matter for the 8 min simmer. |
| Pad Kra Pao | 15 | Assumes cooked rice; review ground chicken doneness wording. High-heat aromatics have a short 15–20 second stage. |
| Thai Green Curry | 30 | Gentle simmer and vegetable cues are explicit; review chicken doneness and optional shrimp substitution instructions. |
| Thai Omelette | 10 | Assumes cooked rice; review instruction to pour eggs from a height into hot oil. |
| Lemongrass Chicken | 25 | 10 min marinade plus 7–8 min cooking leaves little preparation time; review chicken doneness wording. |
| Goi Cuon | 25 | Description says no-cook but noodles are boiled. Shrimp is specified cooked; chicken substitution lacks a cooking instruction. Resolve before using that substitution in a demo. |
| Thit Kho | 75 | Sequential timed stages total 75–76 min before preparation/heating; boiling eggs in parallel helps, but total needs test-cooking. |
| Dal Tadka | 35 | Tempering explicitly runs in parallel with lentils; total is plausible. |
| Aloo Gobi | 35 | 24–26 min cooking leaves limited prep time; keep medium-low heat after potatoes enter. |
| Oven Tandoori-Style Chicken | 50 | 15 min marinade plus 25–30 min roasting leaves 5–10 min for prep; preheat can overlap marinade. Review juices-run-clear wording. |

A team member still needs to test-cook or independently validate timing and
doneness instructions before presenting these as cooking guidance. Ingredient
substitutions can need different cooking steps; the explorer currently ranks
ingredient matches without rewriting instructions.
