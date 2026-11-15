import { useState, useTransition } from 'react'
import { getRecipes } from './data/recipes'
import type { RecipeLoad } from './data/recipes'
import { SAMPLE_RECIPES } from './data/sampleRecipes'
import { CUISINES, DIFFICULTY_LABELS } from './domain/types'
import type { Cuisine, Recipe } from './domain/types'

// TEMPORARY test page: lists the saved sample recipes, or loads one cuisine
// from the live Spoonacular API so we can eyeball the data. Remove once the
// real filter form and flowgraph exist.

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const substitutions = Object.entries(recipe.substitutions)
    .map(([name, standIns]) => `${name} → ${standIns.join(' or ')}`)
    .join('; ')
  return (
    <article className="rounded-lg border border-stone-300 bg-white p-4 text-sm">
      <h2 className="text-lg font-semibold">{recipe.name}</h2>
      <p className="text-stone-600">
        {recipe.cuisine} · {DIFFICULTY_LABELS[recipe.difficulty]} · listed time{' '}
        {recipe.listedMinutes ? `${recipe.listedMinutes} min` : 'not given'} ·
        equipment: {recipe.requiredEquipment.join(', ') || 'none detected'} ·
        source: {recipe.source}
      </p>
      {recipe.description && <p className="mt-1">{recipe.description}</p>}
      <p className="mt-2">
        <b>Required:</b> {recipe.requiredIngredients.join(', ')}
      </p>
      <p>
        <b>Staples:</b> {recipe.stapleIngredients.join(', ') || 'none'}
      </p>
      <p>
        <b>Optional:</b> {recipe.optionalIngredients.join(', ') || 'none'}
      </p>
      <p>
        <b>Substitutions:</b> {substitutions || 'none'}
      </p>
      <details className="mt-2">
        <summary className="cursor-pointer font-medium">
          Ingredient amounts
        </summary>
        <ul className="list-disc pl-5">
          {recipe.ingredientLines.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      </details>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        {recipe.steps.map((step) => (
          <li key={step.number}>
            {step.text}
            {step.brief && (
              <div className="text-stone-500">Brief: {step.brief}</div>
            )}
            {step.tools.length > 0 && (
              <div className="text-stone-500">
                Tools: {step.tools.join(', ')}
              </div>
            )}
          </li>
        ))}
      </ol>
      {recipe.sourceUrl && (
        <a
          className="mt-2 inline-block text-orange-800 underline"
          href={recipe.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Original recipe{recipe.sourceName ? ` (${recipe.sourceName})` : ''}
        </a>
      )}
    </article>
  )
}

const SAVED: RecipeLoad = { recipes: SAMPLE_RECIPES, source: 'sample' }

export default function App() {
  const [load, setLoad] = useState<RecipeLoad>(SAVED)
  const [label, setLabel] = useState('all saved sample recipes')
  const [isPending, startTransition] = useTransition()

  function loadLive(cuisine: Cuisine) {
    startTransition(async () => {
      const result = await getRecipes([cuisine])
      setLoad(result)
      setLabel(`${cuisine} recipes`)
    })
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">
        Asian Recipe Explorer
      </h1>
      <p className="mt-2 text-stone-700">
        Temporary test page. Each live load uses about 3 of the 50 daily
        Spoonacular points; a cuisine already loaded is not fetched again until
        the page reloads.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded border border-stone-400 bg-white px-3 py-1.5 text-sm font-medium hover:bg-stone-100"
          onClick={() => {
            setLoad(SAVED)
            setLabel('all saved sample recipes')
          }}
        >
          Show saved samples
        </button>
        {CUISINES.map((cuisine) => (
          <button
            key={cuisine}
            type="button"
            disabled={isPending}
            className="rounded bg-orange-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-800 disabled:opacity-50"
            onClick={() => loadLive(cuisine)}
          >
            Load live {cuisine}
          </button>
        ))}
      </div>

      <p className="mt-4 font-medium" role="status">
        {isPending
          ? 'Loading from Spoonacular…'
          : `Showing ${load.recipes.length} ${label} (source: ${load.source}).`}
      </p>
      {load.notice && !isPending && (
        <p className="mt-1 rounded border border-amber-400 bg-amber-50 p-2 text-sm">
          Note: {load.notice}
        </p>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {load.recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      <footer className="mt-8 text-sm text-stone-600">
        Live recipe data from the{' '}
        <a className="underline" href="https://spoonacular.com/food-api">
          spoonacular API
        </a>
        .
      </footer>
    </main>
  )
}
