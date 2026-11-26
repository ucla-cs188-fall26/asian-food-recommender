import { useState } from 'react'
import { createFilterState } from '../domain/filters'
import type { FilterState } from '../domain/filters'
import { rank } from '../domain/scoring'
import { CUISINES } from '../domain/types'
import type { Cuisine, Recipe } from '../domain/types'
import { Intro } from './Intro'
import { RecipeDetails } from './RecipeDetails'
import { heading2, hint, notice, panel, panelPadding } from './styles'

interface SavedRecipesProps {
  bookmarks: readonly Recipe[]
  filters: FilterState
  experience: 'beginner' | 'experienced'
  onExperienceChange: (experience: 'beginner' | 'experienced') => void
  onToggleBookmark: (recipe: Recipe) => void
  storageUnavailable: boolean
}

const filterLabel = 'grid w-full gap-2 text-xs font-semibold md:w-auto'
const filterControl =
  'max-w-full rounded-md border border-line-strong bg-white p-2.5 text-ink'

function Total({ count, label }: { count: number; label: string }) {
  return (
    <p className="rounded-[10px] border border-line bg-card p-3 text-[11px] text-subtle md:p-5 md:text-[13px]">
      <strong className="mb-1.5 block font-serif text-[26px] font-normal text-ink md:text-[32px]">
        {count}
      </strong>{' '}
      {label}
    </p>
  )
}

export function SavedRecipes({
  bookmarks,
  filters,
  experience,
  onExperienceChange,
  onToggleBookmark,
  storageUnavailable,
}: SavedRecipesProps) {
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState<Cuisine | ''>('')

  const search = query.trim().toLowerCase()
  const matches = bookmarks.filter(
    (recipe) =>
      (!cuisine || recipe.cuisine === cuisine) &&
      recipe.name.toLowerCase().includes(search),
  )
  // Saved recipes are judged against the user's kitchen in every cuisine.
  const evaluations = rank(
    matches,
    createFilterState({ ...filters, cuisines: CUISINES }),
  )
  const sessionCount = bookmarks.filter(
    (recipe) => recipe.source === 'spoonacular',
  ).length

  return (
    <main>
      <Intro
        kicker="Your recipe dashboard"
        title={
          <>
            Good recipes.
            <br />
            Kept close.
          </>
        }
      >
        Your bookmarked recipes, ready for your next meal.
      </Intro>

      <div
        className="grid grid-cols-3 gap-2 md:gap-4"
        aria-label="Bookmark totals"
      >
        <Total count={bookmarks.length} label="recipes saved" />
        <Total
          count={bookmarks.length - sessionCount}
          label="sample recipes"
        />
        <Total count={sessionCount} label="live recipes this session" />
      </div>
      <p className={`${hint} mt-4 mb-6`}>
        Sample bookmarks stay on this device. Live Spoonacular bookmarks last
        until you refresh or close this page.
      </p>
      {storageUnavailable && (
        <p className={notice} role="status">
          Browser storage is unavailable. All bookmarks will last for this
          session only.
        </p>
      )}

      {!bookmarks.length ? (
        <section className="rounded-xl border border-dashed border-[#8a8581] bg-card px-6 py-14 text-center">
          <span className="text-[42px] text-kicker" aria-hidden="true">
            ☆
          </span>
          <h2 className={heading2}>Your next favorite is waiting.</h2>
          <p className="mt-4 mb-6 leading-[1.6] text-subtle">
            Choose “Save recipe” on any recipe in Explore to start your
            collection.
          </p>
          <a
            className="inline-block rounded-[7px] bg-forest px-[18px] py-3 text-card no-underline"
            href="#explore"
          >
            Explore recipes
          </a>
        </section>
      ) : (
        <section className={`${panel} ${panelPadding}`}>
          <div className="mb-6 flex flex-wrap items-end gap-4 border-b border-line-soft pb-5">
            <label className={filterLabel}>
              Search saved recipes
              <input
                type="search"
                className={`${filterControl} w-full md:w-[280px]`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by recipe name"
              />
            </label>
            <label className={filterLabel}>
              Cuisine
              <select
                className={filterControl}
                value={cuisine}
                onChange={(event) =>
                  setCuisine(event.target.value as Cuisine | '')
                }
              >
                <option value="">All cuisines</option>
                {CUISINES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <p className={hint} role="status">
              {matches.length} of {bookmarks.length} saved recipes
            </p>
          </div>
          <RecipeDetails
            key={`${query}:${cuisine}`}
            evaluations={evaluations}
            experience={experience}
            onExperienceChange={onExperienceChange}
            bookmarks={bookmarks}
            onToggleBookmark={onToggleBookmark}
            savedView
          />
        </section>
      )}
    </main>
  )
}
