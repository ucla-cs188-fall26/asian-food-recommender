# Version B: Recipe comparison cards

Branch: `prototype-recipe-cards`. Based on the refined branching-map commit `3ab8d9a`.

Run `npm install` once, then `npm run dev`. The Explore page replaces the map
with Ready now and One change away groups. Each card names the needed change;
recipes requiring multiple changes are available through a separate browse button.
Recipe instructions, beginner/concise steps, bookmarks, and live/sample data remain available.

Walkthrough: choose Korean; enter tofu, egg, soy sauce, garlic; select stove and
Easy, then Find recipes. Locate Dubu Jorim in One change away with Add potato.
Open its ingredient amounts and cooking steps. Add potato to the kitchen and
resubmit: it moves to Ready now. Try saving it and visiting Saved recipes.

Test the same kitchen setup on all three branches to compare interfaces.
Changing the interface does not change ranking or the meaning of a kitchen constraint.
