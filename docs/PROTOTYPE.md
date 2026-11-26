# Version C: Guided decision flow

Branch: `prototype-guided-flow`. Based on refined branching-map commit `3ab8d9a`,
independently of the recipe comparison cards branch.

Run `npm install` once, then `npm run dev`. Enter your kitchen in the sidebar,
then answer questions about adding one ingredient, accessing another tool, and
trying one difficulty level harder. Continue is enabled only after choosing an answer.
Back preserves answers. The result shows one ranked recommendation, the exact
required change, recipe instructions, and an expandable list of alternatives.
Edit answers preserves your choices; Start over clears them. Submitting new
kitchen filters starts a new guide. Nothing silently changes your kitchen inventory.

Walkthrough: choose Korean; enter tofu, egg, soy sauce, garlic; select stove and
Easy, then Find recipes. Answer Yes for adding an ingredient, No for tools,
No for difficulty. Dubu Jorim should be suggested with Add potato. Edit answers
and disallow ingredients: this dish must no longer be recommended. If nothing
fits, the app explains how to revise answers or kitchen filters. Save a suggestion
and check Saved recipes; open its ingredient amounts and beginner/concise steps.

All recommendations and alternatives require at most one change total and obey
the answers. Ready recipes are preferred using the existing ranking. Source
notices and live/sample data behavior are retained. Use the same kitchen on all
three prototype branches to compare the interfaces fairly.
