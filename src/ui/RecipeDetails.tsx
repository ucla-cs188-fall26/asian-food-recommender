import { useState } from 'react'
import type { Evaluation } from '../domain/scoring'
import { DIFFICULTY_LABELS } from '../domain/types'
import type { Recipe } from '../domain/types'
import { recipeKey } from '../data/bookmarks'

interface RecipeDetailsProps {
  evaluations: Evaluation[]
  experience: 'beginner' | 'experienced'
  onExperienceChange: (experience: 'beginner' | 'experienced') => void
  bookmarks: readonly Recipe[]
  onToggleBookmark: (recipe: Recipe) => void
  savedView?: boolean
}

export function RecipeDetails({ evaluations, experience, onExperienceChange, bookmarks, onToggleBookmark, savedView = false }: RecipeDetailsProps) {
  const [showAll, setShowAll] = useState(false)
  return <><div className="section-heading"><div><p className="section-kicker">{savedView ? 'Your collection' : '03 / On the menu'}</p><h2>{savedView ? 'Bookmarked recipes' : 'Recipes in this scenario'}</h2></div><fieldset className="step-toggle"><legend>Step detail</legend>{(['beginner', 'experienced'] as const).map((value) => <label key={value}><input type="radio" name="experience" checked={experience === value} onChange={() => onExperienceChange(value)} />{value === 'beginner' ? 'Beginner steps' : 'Concise steps'}</label>)}</fieldset></div>
    <p className="hint">{savedView ? 'Readiness uses your most recently submitted kitchen filters.' : 'Ranked by what you have, equipment, and difficulty.'} Missing counts include all changes needed.</p>
    {!evaluations.length && <p className="notice">{savedView ? 'No saved recipes match these filters. Try a different search or cuisine.' : 'No recipes found for these cuisines. Try another cuisine.'}</p>}
    <div className="recipe-grid">{(showAll ? evaluations : evaluations.slice(0, 8)).map((e) => {
      const { recipe } = e
      const saved = bookmarks.some((bookmark) => recipeKey(bookmark) === recipeKey(recipe))
      return <article className="recipe-card" key={recipeKey(recipe)}>
        <div className="recipe-eyebrow">{recipe.cuisine} / {DIFFICULTY_LABELS[recipe.difficulty]}<span className={e.makeable ? 'status-ready' : 'status-missing'}>{e.makeable ? 'Ready' : `Missing ${e.changesNeeded}`}</span></div>
        <h3>{recipe.name}</h3>{recipe.description && <p className="recipe-description">{recipe.description}</p>}
        <div className="bookmark-action"><button type="button" className="bookmark-button" aria-pressed={saved} aria-label={`${saved ? 'Remove bookmark for' : 'Save recipe'} ${recipe.name}`} onClick={() => onToggleBookmark(recipe)}>{saved ? '★ Saved · Remove' : '☆ Save recipe'}</button>{saved && <span className="hint">{recipe.source === 'spoonacular' ? 'This session' : 'Saved on this device'}</span>}</div>
        <ul className="reasons">{e.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        <details><summary>Ingredients & cooking steps</summary>
          {recipe.listedMinutes !== undefined && <p className="listed-time">Listed time: {recipe.listedMinutes} min{recipe.source === 'spoonacular' && ' (as given by the source; often a placeholder)'}</p>}
          <h4>Ingredient amounts</h4><ul>{recipe.ingredientLines.map((line, i) => <li key={i}>{line}</li>)}</ul>
          <p><strong>Missing ingredients:</strong> {e.missingIngredients.join(', ') || 'none'}</p>
          <p><strong>Missing equipment:</strong> {e.missingEquipment.join(', ') || 'none'}</p>
          {e.missingIngredients.filter((name) => recipe.substitutions[name]?.length).map((name) => <p key={name}><strong>Substitutes for {name}:</strong> {recipe.substitutions[name].join(' or ')}</p>)}
          <h4>Cooking steps</h4><ol>{recipe.steps.map((step) => <li key={step.number}>{experience === 'experienced' ? step.brief ?? step.text : step.text}{experience === 'beginner' && <>{step.tools.length > 0 && <p className="hint">Tools: {step.tools.join(', ')}</p>}{step.minutes !== undefined && <p className="hint">Step time: {step.minutes} min</p>}</>}</li>)}</ol>
          {recipe.sourceUrl && <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">Original recipe ↗</a>}
        </details>
      </article>
    })}</div>
    {!showAll && evaluations.length > 8 && <button type="button" className="show-all" onClick={() => setShowAll(true)}>Show all ({evaluations.length})</button>}
  </>
}
