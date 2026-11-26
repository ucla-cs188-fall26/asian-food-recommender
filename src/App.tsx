import { useEffect, useState, useTransition } from 'react'
import { getRecipes } from './data/recipes'
import type { RecipeLoad } from './data/recipes'
import { SAMPLE_RECIPES } from './data/sampleRecipes'
import { DEFAULT_FILTERS, filterStateId } from './domain/filters'
import type { FilterState } from './domain/filters'
import { FilterForm } from './ui/FilterForm'
import { Intro } from './ui/Intro'
import { PrototypeExplorer } from './ui/PrototypeExplorer'
import { prototypeCopy } from './ui/prototypeCopy'
import { SavedRecipes } from './ui/SavedRecipes'
import { hint, notice, panel, panelPadding } from './ui/styles'
import { useBookmarks } from './ui/useBookmarks'

type Page = 'explore' | 'saved'
const currentPage = (): Page => window.location.hash === '#saved' ? 'saved' : 'explore'
const navLink = 'rounded-[7px] p-2 text-[#52674d] no-underline md:px-3 md:py-[9px] aria-[current=page]:bg-sage-strong aria-[current=page]:font-bold aria-[current=page]:text-[#244c36]'

export default function App() {
  const [page, setPage] = useState<Page>(currentPage)
  const { bookmarks, toggle, storageUnavailable, announcement } = useBookmarks()
  useEffect(() => {
    const onHashChange = () => setPage(currentPage())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [recipeLoad, setRecipeLoad] = useState<RecipeLoad>()
  const [experience, setExperience] = useState<'beginner' | 'experienced'>('beginner')
  const [isPending, startTransition] = useTransition()
  const recipes = recipeLoad?.recipes ?? SAMPLE_RECIPES
  const ingredientOptions = [...new Set(
    [...SAMPLE_RECIPES, ...recipes].flatMap((recipe) => recipe.requiredIngredients),
  )].sort()
  const recipeCount = recipes.filter((recipe) => filters.cuisines.includes(recipe.cuisine)).length

  function submit(next: FilterState) {
    startTransition(async () => {
      const load = await getRecipes(next.cuisines)
      setFilters(next)
      setRecipeLoad(load)
    })
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 md:px-9">
      <header className="flex min-h-[76px] flex-wrap items-center justify-between gap-3 border-b border-[#d7ddce] py-3.5">
        <a className="text-sm font-extrabold tracking-[.12em] no-underline" href="#explore">RECIPE / EXPLORER</a>
        <nav className="flex items-center gap-2 text-[13px]" aria-label="Main navigation">
          <a className={navLink} href="#explore" aria-current={page === 'explore' ? 'page' : undefined}>Explore</a>
          <a className={navLink} href="#saved" aria-current={page === 'saved' ? 'page' : undefined}>Saved recipes ({bookmarks.length})</a>
        </nav>
      </header>
      <p className="sr-only" role="status">{announcement}</p>
      {page === 'saved' ? (
        <SavedRecipes bookmarks={bookmarks} filters={filters} experience={experience}
          onExperienceChange={setExperience} onToggleBookmark={toggle} storageUnavailable={storageUnavailable} />
      ) : (
        <>
          <Intro kicker={prototypeCopy.kicker} title={prototypeCopy.title}>{prototypeCopy.description}</Intro>
          <main className="grid grid-cols-[minmax(0,1fr)] items-start gap-[18px] md:grid-cols-[300px_minmax(0,1fr)] md:gap-6">
            <aside className={panel}>
              <FilterForm initial={filters} ingredientOptions={ingredientOptions} isLoading={isPending} onSubmit={submit} />
            </aside>
            <section className={`${panel} ${panelPadding}`} aria-label={prototypeCopy.title} aria-busy={isPending}>
              <p className={`${hint} mb-4`} role="status">
                {isPending ? 'Loading recipes…' : `${recipeCount} recipes · ${recipeLoad?.source === 'spoonacular' ? 'Live data' : 'Sample collection'}`}
              </p>
              {recipeLoad?.notice && <p className={notice}>Data notice: {recipeLoad.notice}</p>}
              {storageUnavailable && <p className={notice}>Browser storage is unavailable. Bookmarks last for this session only.</p>}
              <PrototypeExplorer key={`${filterStateId(filters)}:${recipeLoad?.source ?? 'sample'}`}
                recipes={recipes} filters={filters} experience={experience} onExperienceChange={setExperience}
                bookmarks={bookmarks} onToggleBookmark={toggle} />
            </section>
          </main>
        </>
      )}
      <footer className="flex flex-wrap justify-between gap-3 py-7 text-[11px] text-muted">
        <span>Asian Recipe Explorer · CS 188</span>
        <span>Live recipe data from the <a className="underline" href="https://spoonacular.com/food-api">spoonacular API</a>.</span>
      </footer>
    </div>
  )
}
