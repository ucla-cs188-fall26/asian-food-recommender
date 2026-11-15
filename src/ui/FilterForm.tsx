import { useState } from 'react'
import { createFilterState } from '../domain/filters'
import type { FilterState } from '../domain/filters'
import { CUISINES, DIFFICULTY_LABELS, EQUIPMENT } from '../domain/types'
import {
  button,
  choiceInput,
  choiceLabel,
  fieldLabel,
  heading2,
  hint,
  kicker,
  primaryButton,
  textInput,
} from './styles'

interface FilterFormProps {
  initial: FilterState
  ingredientOptions: readonly string[]
  isLoading: boolean
  onSubmit: (filters: FilterState) => void
}

/** Adds or removes one item from a list. */
function toggled<T>(list: readonly T[], item: T, on: boolean): T[] {
  return on ? [...list, item] : list.filter((existing) => existing !== item)
}

export function FilterForm({
  initial,
  ingredientOptions,
  isLoading,
  onSubmit,
}: FilterFormProps) {
  const [draft, setDraft] = useState(initial)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  /** The draft plus whatever is still typed in the ingredient box. */
  function withInput() {
    return createFilterState({
      ...draft,
      ingredients: [...draft.ingredients, ...input.split(',')],
    })
  }

  function addIngredients() {
    setDraft(withInput())
    setInput('')
  }

  return (
    <form
      className="flex flex-col gap-[22px] p-[18px] md:p-6"
      onSubmit={(event) => {
        event.preventDefault()
        if (!draft.cuisines.length) {
          setError('Choose at least one cuisine.')
          return
        }
        const filters = withInput()
        setDraft(filters)
        setInput('')
        setError('')
        onSubmit(filters)
      }}
    >
      <div className={kicker}>01 / Your kitchen</div>
      <h2 className={`${heading2} -mt-2.5`}>Start with what you have.</h2>

      <fieldset className="min-w-0">
        <legend className={fieldLabel}>Cuisines</legend>
        <div className="grid grid-cols-2 gap-x-2 gap-y-2.5">
          {CUISINES.map((cuisine) => (
            <label key={cuisine} className={choiceLabel}>
              <input
                type="checkbox"
                className={choiceInput}
                checked={draft.cuisines.includes(cuisine)}
                onChange={(event) =>
                  setDraft(
                    createFilterState({
                      ...draft,
                      cuisines: toggled(
                        draft.cuisines,
                        cuisine,
                        event.target.checked,
                      ),
                    }),
                  )
                }
              />
              {cuisine}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="text-[13px] text-[#a23c24]" role="alert">
          {error}
        </p>
      )}

      <div>
        <label className={fieldLabel} htmlFor="ingredient-input">
          Ingredients you have
        </label>
        <p className={hint}>
          Add one or several, separated by commas. Pantry basics are assumed.
        </p>
        <div className="mt-2.5 flex gap-1.5">
          <input
            id="ingredient-input"
            className={`${textInput} w-full min-w-0 p-[9px]`}
            list="ingredient-options"
            placeholder="e.g. tofu, egg"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addIngredients()
              }
            }}
          />
          <button type="button" className={button} onClick={addIngredients}>
            Add
          </button>
        </div>
        <datalist id="ingredient-options">
          {ingredientOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {draft.ingredients.map((name) => (
            <span
              key={name}
              className="flex items-center gap-[5px] rounded-[5px] bg-sage px-[7px] py-[3px] text-xs"
            >
              {name}
              <button
                type="button"
                className="cursor-pointer rounded-[7px] px-[3px] text-[17px] font-semibold"
                aria-label={`Remove ${name}`}
                onClick={() =>
                  setDraft(
                    createFilterState({
                      ...draft,
                      ingredients: toggled(draft.ingredients, name, false),
                    }),
                  )
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <fieldset className="min-w-0">
        <legend className={fieldLabel}>Equipment you have</legend>
        <div className="grid grid-cols-2 gap-x-2 gap-y-[11px]">
          {EQUIPMENT.map((item) => (
            <label key={item} className={choiceLabel}>
              <input
                type="checkbox"
                className={choiceInput}
                checked={draft.equipment.includes(item)}
                onChange={(event) =>
                  setDraft(
                    createFilterState({
                      ...draft,
                      equipment: toggled(
                        draft.equipment,
                        item,
                        event.target.checked,
                      ),
                    }),
                  )
                }
              />
              {item}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className={fieldLabel}>Maximum difficulty</legend>
        <div className="flex gap-3.5">
          {([1, 2, 3] as const).map((level) => (
            <label key={level} className={choiceLabel}>
              <input
                type="radio"
                name="difficulty"
                className={choiceInput}
                checked={draft.maxDifficulty === level}
                onChange={() =>
                  setDraft(createFilterState({ ...draft, maxDifficulty: level }))
                }
              />
              {DIFFICULTY_LABELS[level]}
            </label>
          ))}
        </div>
      </fieldset>

      <button className={primaryButton} type="submit" disabled={isLoading}>
        {isLoading ? 'Finding recipes…' : 'Find recipes →'}
      </button>
    </form>
  )
}
