import { useState } from 'react'
import { recipeKey } from '../data/bookmarks'
import type { Evaluation } from '../domain/scoring'
import { DIFFICULTY_LABELS } from '../domain/types'
import type { Recipe } from '../domain/types'
import {
  button,
  choiceInput,
  heading2,
  hint,
  kicker,
  notice,
  sectionHeadingWide,
} from './styles'

type Experience = 'beginner' | 'experienced'

interface RecipeDetailsProps {
  evaluations: Evaluation[]
  experience: Experience
  onExperienceChange: (experience: Experience) => void
  bookmarks: readonly Recipe[]
  onToggleBookmark: (recipe: Recipe) => void
  savedView?: boolean
}

const VISIBLE_BY_DEFAULT = 8
const subheading = 'mt-3.5 mb-1.5 font-bold'

interface RecipeCardProps {
  evaluation: Evaluation
  experience: Experience
  saved: boolean
  onToggleBookmark: (recipe: Recipe) => void
}

function RecipeCard({
  evaluation,
  experience,
  saved,
  onToggleBookmark,
}: RecipeCardProps) {
  const { recipe } = evaluation
  const withSubstitutes = evaluation.missingIngredients.filter(
    (name) => recipe.substitutions[name]?.length,
  )

  return (
    <article className="rounded-lg border border-line-soft p-[18px] text-xs [overflow-wrap:anywhere]">
      <div className="flex items-center justify-between gap-2.5 text-[10px] text-[#625d59]">
        {recipe.cuisine} / {DIFFICULTY_LABELS[recipe.difficulty]}
        <span
          className={`rounded px-1.5 py-[3px] text-[10px] whitespace-nowrap ${
            evaluation.makeable
              ? 'bg-[#eeece9] text-[#242424]'
              : 'bg-[#fff1e9] text-[#8c3521]'
          }`}
        >
          {evaluation.makeable
            ? 'Ready'
            : `Missing ${evaluation.changesNeeded}`}
        </span>
      </div>

      <h3 className="my-3 font-sans text-[21px] leading-tight font-extrabold tracking-tight">
        {recipe.name}
      </h3>
      {recipe.description && (
        <p className="mb-3 leading-normal text-muted">{recipe.description}</p>
      )}

      <div className="my-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`${button} aria-pressed:border-[#c51e2c] aria-pressed:bg-sage-strong aria-pressed:text-[#a51521]`}
          aria-pressed={saved}
          aria-label={`${saved ? 'Remove bookmark for' : 'Save recipe'} ${recipe.name}`}
          onClick={() => onToggleBookmark(recipe)}
        >
          {saved ? '★ Saved · Remove' : '☆ Save recipe'}
        </button>
        {saved && (
          <span className={hint}>
            {recipe.source === 'spoonacular'
              ? 'This session'
              : 'Saved on this device'}
          </span>
        )}
      </div>

      <ul className="list-disc pl-4 leading-[1.65] text-[#504b47]">
        {evaluation.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>

      <details className="mt-3.5 border-t border-line-soft pt-3 leading-[1.6]">
        <summary className="cursor-pointer font-semibold">
          Ingredients & cooking steps
        </summary>

        {recipe.listedMinutes !== undefined && (
          <p className="mt-3 text-[#625d59]">
            Listed time: {recipe.listedMinutes} min
            {recipe.source === 'spoonacular' &&
              ' (as given by the source; often a placeholder)'}
          </p>
        )}

        <h4 className={subheading}>Ingredient amounts</h4>
        <ul className="my-2 list-disc pl-[18px]">
          {recipe.ingredientLines.map((line, index) => (
            <li key={index} className="mb-2">
              {line}
            </li>
          ))}
        </ul>
        <p>
          <strong>Missing ingredients:</strong>{' '}
          {evaluation.missingIngredients.join(', ') || 'none'}
        </p>
        <p>
          <strong>Missing equipment:</strong>{' '}
          {evaluation.missingEquipment.join(', ') || 'none'}
        </p>
        {withSubstitutes.map((name) => (
          <p key={name}>
            <strong>Substitutes for {name}:</strong>{' '}
            {recipe.substitutions[name].join(' or ')}
          </p>
        ))}

        <h4 className={subheading}>Cooking steps</h4>
        <ol className="my-2 list-decimal pl-[18px]">
          {recipe.steps.map((step) => (
            <li key={step.number} className="mb-2">
              {experience === 'experienced'
                ? (step.brief ?? step.text)
                : step.text}
              {experience === 'beginner' && step.tools.length > 0 && (
                <p className={hint}>Tools: {step.tools.join(', ')}</p>
              )}
              {experience === 'beginner' && step.minutes !== undefined && (
                <p className={hint}>Step time: {step.minutes} min</p>
              )}
            </li>
          ))}
        </ol>

        {recipe.sourceUrl && (
          <a
            className="text-moss underline"
            href={recipe.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Original recipe ↗
          </a>
        )}
      </details>
    </article>
  )
}

export function RecipeDetails({
  evaluations,
  experience,
  onExperienceChange,
  bookmarks,
  onToggleBookmark,
  savedView = false,
}: RecipeDetailsProps) {
  const [showAll, setShowAll] = useState(false)
  const savedKeys = new Set(bookmarks.map(recipeKey))
  const visible = showAll
    ? evaluations
    : evaluations.slice(0, VISIBLE_BY_DEFAULT)

  return (
    <>
      <div className={sectionHeadingWide}>
        <div>
          <p className={kicker}>
            {savedView ? 'Your collection' : '03 / On the menu'}
          </p>
          <h2 className={heading2}>
            {savedView ? 'Bookmarked recipes' : 'Recipes in this scenario'}
          </h2>
        </div>
        <fieldset className="flex shrink-0 gap-2.5">
          <legend className="mb-[5px] text-[10px] text-[#625d59]">
            Step detail
          </legend>
          {(['beginner', 'experienced'] as const).map((value) => (
            <label
              key={value}
              className="flex items-center gap-[5px] text-[11px]"
            >
              <input
                type="radio"
                name="experience"
                className={choiceInput}
                checked={experience === value}
                onChange={() => onExperienceChange(value)}
              />
              {value === 'beginner' ? 'Beginner steps' : 'Concise steps'}
            </label>
          ))}
        </fieldset>
      </div>

      <p className={hint}>
        {savedView
          ? 'Readiness uses your most recently submitted kitchen filters.'
          : 'Ranked by what you have, equipment, and difficulty.'}{' '}
        Missing counts include all changes needed.
      </p>
      {!evaluations.length && (
        <p className={notice}>
          {savedView
            ? 'No saved recipes match these filters. Try a different search or cuisine.'
            : 'No recipes found for these cuisines. Try another cuisine.'}
        </p>
      )}

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3.5 min-[1101px]:grid-cols-2">
        {visible.map((evaluation) => (
          <RecipeCard
            key={recipeKey(evaluation.recipe)}
            evaluation={evaluation}
            experience={experience}
            saved={savedKeys.has(recipeKey(evaluation.recipe))}
            onToggleBookmark={onToggleBookmark}
          />
        ))}
      </div>

      {!showAll && evaluations.length > VISIBLE_BY_DEFAULT && (
        <button
          type="button"
          className={`${button} mt-4`}
          onClick={() => setShowAll(true)}
        >
          Show all ({evaluations.length})
        </button>
      )}
    </>
  )
}
