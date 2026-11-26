import { useState } from 'react'
import { recipeKey } from '../data/bookmarks'
import { rank } from '../domain/scoring'
import { requiredChange } from '../domain/discovery'
import type { FilterState } from '../domain/filters'
import type { Recipe } from '../domain/types'
import { RecipeCard } from './RecipeDetails'
import { button, heading2, hint, kicker, notice } from './styles'

export interface ExplorerProps {
  recipes: readonly Recipe[]
  filters: FilterState
  experience: 'beginner' | 'experienced'
  onExperienceChange: (value: 'beginner' | 'experienced') => void
  bookmarks: readonly Recipe[]
  onToggleBookmark: (recipe: Recipe) => void
}

export function PrototypeExplorer(props: ExplorerProps) {
  const [showMore, setShowMore] = useState(false)
  const evaluations = rank(props.recipes, props.filters)
  const groups = [
    { title: 'Ready now', items: evaluations.filter((e) => e.makeable), empty: 'Nothing is ready yet. Check the one-change options below.' },
    { title: 'One change away', items: evaluations.filter((e) => e.changesNeeded === 1), empty: 'No recipes are exactly one change away. Update your kitchen or browse recipes needing more changes.' },
    ...(showMore ? [{ title: 'More changes needed', items: evaluations.filter((e) => e.changesNeeded > 1), empty: 'No other recipes match these cuisines.' }] : []),
  ]
  return (
    <>
      <p className={kicker}>02 / Compare your options</p>
      <fieldset className="mb-6 flex flex-wrap gap-3 text-xs">
        <legend className="mb-2 font-bold">Cooking instructions</legend>
        {(['beginner', 'experienced'] as const).map((value) => (
          <label key={value} className="flex items-center gap-2">
            <input type="radio" name="card-experience" checked={props.experience === value} onChange={() => props.onExperienceChange(value)} />
            {value === 'beginner' ? 'Beginner steps' : 'Concise steps'}
          </label>
        ))}
      </fieldset>
      {groups.map((group) => (
        <section key={group.title} className="mb-8" aria-label={group.title}>
          <h2 className={heading2}>{group.title} <span className="text-sm text-muted">({group.items.length})</span></h2>
          {!group.items.length && <p className={`${notice} mt-3`}>{group.empty}</p>}
          <div className="mt-4 grid gap-4 min-[1101px]:grid-cols-2">
            {group.items.map((evaluation) => (
              <div key={recipeKey(evaluation.recipe)} className="min-w-0">
                <p className="mb-2 rounded-md bg-sage p-3 text-xs font-semibold text-moss">
                  {evaluation.changesNeeded > 1 ? `${evaluation.changesNeeded} changes needed. See details below.` : requiredChange(evaluation)}
                </p>
                <RecipeCard evaluation={evaluation} experience={props.experience}
                  saved={props.bookmarks.some((recipe) => recipeKey(recipe) === recipeKey(evaluation.recipe))}
                  onToggleBookmark={props.onToggleBookmark} />
              </div>
            ))}
          </div>
        </section>
      ))}
      {!showMore && evaluations.some((e) => e.changesNeeded > 1) && (
        <button className={button} type="button" onClick={() => setShowMore(true)}>Browse recipes needing more changes</button>
      )}
      <p className={`${hint} mt-4`}>A change means one added ingredient, one tool, or one difficulty level. Pantry basics are assumed.</p>
    </>
  )
}
