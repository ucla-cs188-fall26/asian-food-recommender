import { useState } from 'react'
import { createFilterState } from '../domain/filters'
import type { FilterState } from '../domain/filters'
import { CUISINES, EQUIPMENT, DIFFICULTY_LABELS } from '../domain/types'

interface FilterFormProps {
  initial: FilterState
  ingredientOptions: readonly string[]
  isLoading: boolean
  onSubmit: (filters: FilterState) => void
}

export function FilterForm({ initial, ingredientOptions, isLoading, onSubmit }: FilterFormProps) {
  const [draft, setDraft] = useState(initial)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  function withInput() {
    return createFilterState({ ...draft, ingredients: [...draft.ingredients, ...input.split(',')] })
  }
  function addIngredients() { setDraft(withInput()); setInput('') }
  return <form className="filter-form" onSubmit={(event) => {
    event.preventDefault()
    if (!draft.cuisines.length) { setError('Choose at least one cuisine.'); return }
    const filters = withInput()
    setDraft(filters); setInput(''); setError(''); onSubmit(filters)
  }}>
    <div className="section-kicker">01 / Your kitchen</div>
    <h2>Start with what you have.</h2>
    <fieldset><legend>Cuisines</legend><div className="choice-grid">{CUISINES.map((cuisine) => <label key={cuisine}><input type="checkbox" checked={draft.cuisines.includes(cuisine)} onChange={(e) => setDraft(createFilterState({ ...draft, cuisines: e.target.checked ? [...draft.cuisines, cuisine] : draft.cuisines.filter((c) => c !== cuisine) }))} />{cuisine}</label>)}</div></fieldset>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div><label className="field-label" htmlFor="ingredient-input">Ingredients you have</label><p className="hint">Add one or several, separated by commas. Pantry basics are assumed.</p>
      <div className="input-row"><input id="ingredient-input" list="ingredient-options" placeholder="e.g. tofu, egg" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIngredients() } }} /><button type="button" onClick={addIngredients}>Add</button></div>
      <datalist id="ingredient-options">{ingredientOptions.map((name) => <option key={name} value={name} />)}</datalist>
      <div className="chips">{draft.ingredients.map((name) => <span className="chip" key={name}>{name}<button type="button" aria-label={`Remove ${name}`} onClick={() => setDraft(createFilterState({ ...draft, ingredients: draft.ingredients.filter((i) => i !== name) }))}>×</button></span>)}</div>
    </div>
    <fieldset><legend>Equipment you have</legend><div className="choice-grid equipment">{EQUIPMENT.map((item) => <label key={item}><input type="checkbox" checked={draft.equipment.includes(item)} onChange={(e) => setDraft(createFilterState({ ...draft, equipment: e.target.checked ? [...draft.equipment, item] : draft.equipment.filter((i) => i !== item) }))} />{item}</label>)}</div></fieldset>
    <fieldset><legend>Maximum difficulty</legend><div className="difficulty-options">{([1, 2, 3] as const).map((level) => <label key={level}><input type="radio" name="difficulty" checked={draft.maxDifficulty === level} onChange={() => setDraft(createFilterState({ ...draft, maxDifficulty: level }))} />{DIFFICULTY_LABELS[level]}</label>)}</div></fieldset>
    <button className="primary" type="submit" disabled={isLoading}>{isLoading ? 'Finding recipes…' : 'Find recipes →'}</button>
  </form>
}
