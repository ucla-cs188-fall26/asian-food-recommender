# Version B: Recipe comparison cards

Branch: `prototype-recipe-cards`. Based on the refined branching-map commit `3ab8d9a`.

Run `npm install` once, then `npm run dev`. The Explore page replaces the map
with Ready now and a group showing the fewest changes among recipes that are
not ready yet. Its heading updates to 1 change away, 2 changes away, or whatever
minimum is needed. All recipes tied at that minimum appear. Each card lists all
needed changes; recipes requiring more than the minimum are available through
a separate browse button.
Recipe instructions, beginner/concise steps, bookmarks, and live/sample data remain available.

Walkthrough: choose Korean; enter tofu, egg, soy sauce, garlic; select stove and
Easy, then Find recipes. Locate Dubu Jorim in 1 change away with Add potato.
Open its ingredient amounts and cooking steps. Add potato to the kitchen and
resubmit: it moves to Ready now. Try saving it and visiting Saved recipes.

Test the same kitchen setup on all three branches to compare interfaces.
Changing the interface does not change ranking or the meaning of a kitchen constraint.
