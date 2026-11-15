import { SAMPLE_RECIPES } from './data/sampleRecipes'
import { DIFFICULTY_LABELS } from './domain/types'

// TEMPORARY: dumps every saved sample recipe so we can eyeball the data.
// Remove once the real filter form and flowgraph exist.
export default function App() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">
        Asian Recipe Explorer
      </h1>
      <p className="mt-2 text-stone-700">
        Temporary test page: all {SAMPLE_RECIPES.length} saved sample recipes.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {SAMPLE_RECIPES.map((recipe) => (
          <article
            key={recipe.id}
            className="rounded-lg border border-stone-300 bg-white p-4 text-sm"
          >
            <h2 className="text-lg font-semibold">{recipe.name}</h2>
            <p className="text-stone-600">
              {recipe.cuisine} · {DIFFICULTY_LABELS[recipe.difficulty]} · listed
              time {recipe.listedMinutes} min · equipment:{' '}
              {recipe.requiredEquipment.join(', ')}
            </p>
            <p className="mt-1">{recipe.description}</p>
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
              <b>Substitutions:</b>{' '}
              {Object.entries(recipe.substitutions)
                .map(([name, standIns]) => `${name} → ${standIns.join(' or ')}`)
                .join('; ') || 'none'}
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">
                Ingredient amounts
              </summary>
              <ul className="list-disc pl-5">
                {recipe.ingredientLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </details>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              {recipe.steps.map((step) => (
                <li key={step.number}>
                  {step.text}
                  <div className="text-stone-500">Brief: {step.brief}</div>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </main>
  )
}
