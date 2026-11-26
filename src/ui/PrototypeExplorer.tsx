import { useEffect, useReducer, useRef } from 'react'
import { recipeKey } from '../data/bookmarks'
import { requiredChange } from '../domain/discovery'
import type { FilterState } from '../domain/filters'
import { guideReducer, guidedCandidates, INITIAL_GUIDE } from '../domain/guidedFlow'
import type { Recipe } from '../domain/types'
import { RecipeCard } from './RecipeDetails'
import { button, heading2, hint, kicker, notice, primaryButton } from './styles'

interface ExplorerProps {
  recipes: readonly Recipe[]
  filters: FilterState
  experience: 'beginner' | 'experienced'
  onExperienceChange: (value: 'beginner' | 'experienced') => void
  bookmarks: readonly Recipe[]
  onToggleBookmark: (recipe: Recipe) => void
}

const questions = [
  { key: 'ingredient', title: 'Are you open to adding ingredients?', description: 'We will show the closest recipes either way. Your answer helps prioritize similar matches.', yes: 'Yes, I can get more ingredients', no: 'I prefer to use what I have' },
  { key: 'equipment', title: 'Could you use another kitchen tool?', description: 'For example, you might be able to borrow a steamer or use an oven.', yes: 'Yes, I can access another tool', no: 'I prefer to use my current tools' },
  { key: 'difficulty', title: 'Would you try a harder recipe?', description: 'Your answer helps prioritize recipes around your preferred difficulty.', yes: 'Yes, I am open to harder recipes', no: 'I prefer my current difficulty limit' },
] as const

export function PrototypeExplorer(props: ExplorerProps) {
  const [guide, dispatch] = useReducer(guideReducer, INITIAL_GUIDE)
  const heading = useRef<HTMLHeadingElement>(null)
  const previousStep = useRef(guide.step)
  useEffect(() => {
    if (previousStep.current !== guide.step) {
      heading.current?.focus()
      previousStep.current = guide.step
    }
  }, [guide.step])
  const candidates = guidedCandidates(props.recipes, props.filters, guide.answers)
  const recommendation = candidates[0]
  const question = questions[guide.step]

  return (
    <div>
      <p className={kicker}>02 / A few quick questions</p>
      <ol className="mb-6 flex flex-wrap gap-2 text-xs" aria-label="Your progress">
        {['Ingredients', 'Tools', 'Difficulty', 'Your recipe'].map((label, index) => (
          <li key={label} aria-current={index === guide.step ? 'step' : undefined}
            className={`rounded-full px-3 py-2 ${index === guide.step ? 'bg-forest font-bold text-card' : 'bg-sage text-moss'}`}>
            {index + 1}. {label}
          </li>
        ))}
      </ol>
      {question ? (
        <>
          <h2 ref={heading} tabIndex={-1} className={heading2}>{question.title}</h2>
          <p className={`${hint} my-3`}>{question.description}</p>
          <fieldset className="my-6 grid gap-3">
            <legend className="sr-only">{question.title}</legend>
            {([true, false] as const).map((value) => (
              <label key={String(value)} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm ${guide.answers[question.key] === value ? 'border-forest bg-sage' : 'border-line-soft'}`}>
                <input type="radio" name={question.key} checked={guide.answers[question.key] === value}
                  onChange={() => dispatch({ type: 'answer', value })} />
                {value ? question.yes : question.no}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" className={button} disabled={guide.step === 0} onClick={() => dispatch({ type: 'back' })}>Back</button>
            <button type="button" className={primaryButton} disabled={guide.answers[question.key] === null} onClick={() => dispatch({ type: 'next' })}>
              {guide.step === 2 ? 'Find my recipe' : 'Continue'}
            </button>
          </div>
          <p className={`${hint} mt-4`}>Recipes needing the fewest changes come first. Your answers help prioritize similar matches, rather than hide recipes. Pantry basics are assumed.</p>
        </>
      ) : (
        <>
          <h2 ref={heading} tabIndex={-1} className={heading2}>{recommendation ? 'Your dinner suggestion' : 'Let’s adjust your options'}</h2>
          <p className={`${hint} my-3`}>Based on your kitchen and these answers:</p>
          <ul className="mb-4 flex flex-wrap gap-2 text-xs">
            {questions.map((item) => (
              <li key={item.key} className="rounded-md bg-sage px-3 py-2">
                {item.key === 'ingredient' ? 'Add ingredients' : item.key === 'equipment' ? 'Use another tool' : 'Try harder recipes'}: {guide.answers[item.key] ? 'Yes' : 'Prefer not to'}
              </li>
            ))}
          </ul>
          <div className="mb-5 flex flex-wrap gap-3">
            <button className={button} type="button" onClick={() => dispatch({ type: 'edit' })}>Edit answers</button>
            <button className={button} type="button" onClick={() => dispatch({ type: 'restart' })}>Start over</button>
          </div>
          {!recommendation ? (
            <p className={notice}>No recipes are available for these cuisines. Choose another cuisine in your kitchen and select Find recipes.</p>
          ) : (
            <>
              <p className="mb-4 rounded-lg bg-sage p-4 text-sm text-moss">
                <strong>{requiredChange(recommendation)}</strong>{' '}
                {recommendation.makeable ? 'You can cook this recipe now.' : 'This is one of your closest recipes. It still needs the changes listed above, even if you preferred to avoid them.'}
              </p>
              <fieldset className="mb-4 flex flex-wrap gap-3 text-xs">
                <legend className="mb-2 font-bold">Cooking instructions</legend>
                {(['beginner', 'experienced'] as const).map((value) => (
                  <label key={value} className="flex items-center gap-2">
                    <input type="radio" name="guided-experience" checked={props.experience === value} onChange={() => props.onExperienceChange(value)} />
                    {value === 'beginner' ? 'Beginner steps' : 'Concise steps'}
                  </label>
                ))}
              </fieldset>
              <RecipeCard evaluation={recommendation} experience={props.experience}
                saved={props.bookmarks.some((recipe) => recipeKey(recipe) === recipeKey(recommendation.recipe))}
                onToggleBookmark={props.onToggleBookmark} />
              {candidates.length > 1 ? (
                <button type="button" className={`${button} my-5`} aria-expanded={guide.showAlternatives} aria-controls="guided-alternatives"
                  onClick={() => dispatch({ type: 'alternatives' })}>
                  {guide.showAlternatives ? 'Hide alternatives' : `See alternatives (${candidates.length - 1})`}
                </button>
              ) : <p className={`${hint} mt-4`}>This is the only recipe available for these cuisines. Choose another cuisine to explore more.</p>}
              {guide.showAlternatives && (
                <section id="guided-alternatives" aria-label="Alternative recipes" className="mt-2 grid gap-4 min-[1101px]:grid-cols-2">
                  {candidates.slice(1).map((evaluation) => (
                    <div key={recipeKey(evaluation.recipe)} className="min-w-0">
                      <p className={`${hint} mb-2`}>{requiredChange(evaluation)}</p>
                      <RecipeCard evaluation={evaluation} experience={props.experience}
                        saved={props.bookmarks.some((recipe) => recipeKey(recipe) === recipeKey(evaluation.recipe))}
                        onToggleBookmark={props.onToggleBookmark} />
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
