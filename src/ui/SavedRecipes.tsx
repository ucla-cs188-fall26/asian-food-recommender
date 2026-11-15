import { useState } from 'react'
import type { FilterState } from '../domain/filters'
import { createFilterState } from '../domain/filters'
import { rank } from '../domain/scoring'
import { CUISINES } from '../domain/types'
import type { Cuisine, Recipe } from '../domain/types'
import { RecipeDetails } from './RecipeDetails'

interface SavedRecipesProps {
  bookmarks: readonly Recipe[]
  filters: FilterState
  experience: 'beginner' | 'experienced'
  onExperienceChange: (experience: 'beginner' | 'experienced') => void
  onToggleBookmark: (recipe: Recipe) => void
  storageUnavailable: boolean
}

export function SavedRecipes({ bookmarks, filters, experience, onExperienceChange, onToggleBookmark, storageUnavailable }: SavedRecipesProps) {
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState<Cuisine | ''>('')
  const matches = bookmarks.filter((recipe) => (!cuisine || recipe.cuisine === cuisine) && recipe.name.toLowerCase().includes(query.trim().toLowerCase()))
  const evaluations = rank(matches, createFilterState({ ...filters, cuisines: CUISINES }))
  const sessionCount = bookmarks.filter((recipe) => recipe.source === 'spoonacular').length

  return <main className="saved-dashboard">
    <section className="intro"><p className="section-kicker">Your recipe dashboard</p><h1>Good recipes.<br />Kept close.</h1><p>Your bookmarked recipes, ready for your next meal.</p></section>
    <div className="saved-summary" aria-label="Bookmark totals"><p><strong>{bookmarks.length}</strong> recipes saved</p><p><strong>{bookmarks.length - sessionCount}</strong> sample recipes</p><p><strong>{sessionCount}</strong> live recipes this session</p></div>
    <p className="hint saved-storage-note">Sample bookmarks stay on this device. Live Spoonacular bookmarks last until you refresh or close this page.</p>
    {storageUnavailable && <p className="notice" role="status">Browser storage is unavailable. All bookmarks will last for this session only.</p>}
    {!bookmarks.length ? <section className="empty-bookmarks"><span aria-hidden="true">☆</span><h2>Your next favorite is waiting.</h2><p>Choose “Save recipe” on any recipe in Explore to start your collection.</p><a className="dashboard-link" href="#explore">Explore recipes</a></section> : <section className="details-section">
      <div className="saved-filters"><label>Search saved recipes<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by recipe name" /></label><label>Cuisine<select value={cuisine} onChange={(event) => setCuisine(event.target.value as Cuisine | '')}><option value="">All cuisines</option>{CUISINES.map((value) => <option key={value}>{value}</option>)}</select></label><p className="hint" role="status">{matches.length} of {bookmarks.length} saved recipes</p></div>
      <RecipeDetails key={`${query}:${cuisine}`} evaluations={evaluations} experience={experience} onExperienceChange={onExperienceChange} bookmarks={bookmarks} onToggleBookmark={onToggleBookmark} savedView />
    </section>}
  </main>
}
