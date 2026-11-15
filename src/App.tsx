import { useEffect, useReducer, useState, useTransition } from 'react'
import { getRecipes } from './data/recipes'
import type { RecipeLoad } from './data/recipes'
import { SAMPLE_RECIPES } from './data/sampleRecipes'
import { changeLabel } from './domain/branches'
import { DEFAULT_FILTERS, summarizeFilters } from './domain/filters'
import type { FilterState } from './domain/filters'
import { rank } from './domain/scoring'
import {
  createGraph,
  graphReducer,
  MAX_DEPTH,
  MAX_NODES,
} from './graph/graphState'
import { FilterForm } from './ui/FilterForm'
import { FlowGraph } from './ui/FlowGraph'
import { Intro } from './ui/Intro'
import { RecipeDetails } from './ui/RecipeDetails'
import { SavedRecipes } from './ui/SavedRecipes'
import {
  button,
  heading2,
  hint,
  kicker,
  notice,
  panel,
  panelPadding,
  sectionHeading,
} from './ui/styles'
import { useBookmarks } from './ui/useBookmarks'

type Page = 'explore' | 'saved'

function currentPage(): Page {
  return window.location.hash === '#saved' ? 'saved' : 'explore'
}

const navLink =
  'rounded-[7px] p-2 text-[#52674d] no-underline md:px-3 md:py-[9px] aria-[current=page]:bg-sage-strong aria-[current=page]:font-bold aria-[current=page]:text-[#244c36]'

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
  const [graph, dispatch] = useReducer(
    graphReducer,
    DEFAULT_FILTERS,
    (initial) => createGraph(initial, SAMPLE_RECIPES),
  )
  const [experience, setExperience] = useState<'beginner' | 'experienced'>(
    'beginner',
  )
  const [isPending, startTransition] = useTransition()

  // Until the user submits the form, the graph runs on the saved samples.
  const recipes = recipeLoad?.recipes ?? SAMPLE_RECIPES
  const selected = graph.nodes[graph.selectedId]
  const ingredientOptions = [
    ...new Set(
      [...SAMPLE_RECIPES, ...(recipeLoad?.recipes ?? [])].flatMap(
        (recipe) => recipe.requiredIngredients,
      ),
    ),
  ].sort()
  const recipeCount =
    recipeLoad?.recipes.length ??
    SAMPLE_RECIPES.filter((r) => filters.cuisines.includes(r.cuisine)).length
  const sourceLabel =
    recipeLoad?.source === 'spoonacular' ? 'Live data' : 'Sample collection'

  function submit(next: FilterState) {
    startTransition(async () => {
      const load = await getRecipes(next.cuisines)
      setFilters(next)
      setRecipeLoad(load)
      dispatch({ type: 'start', filters: next, recipes: load.recipes })
    })
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 md:px-9">
      <header className="flex min-h-[76px] flex-wrap items-center justify-between gap-3 border-b border-[#d7ddce] py-3.5 md:h-[76px] md:flex-nowrap md:gap-5 md:py-0">
        <a
          className="text-sm font-extrabold tracking-[.12em] no-underline"
          href="#explore"
        >
          RECIPE / EXPLORER
        </a>
        <nav
          className="flex items-center gap-2 text-[13px]"
          aria-label="Main navigation"
        >
          <a
            className={navLink}
            href="#explore"
            aria-current={page === 'explore' ? 'page' : undefined}
          >
            Explore
          </a>
          <a
            className={navLink}
            href="#saved"
            aria-current={page === 'saved' ? 'page' : undefined}
          >
            Saved recipes{' '}
            <span className="ml-[3px] inline-block rounded-xl bg-card px-1.5 py-px">
              {bookmarks.length}
            </span>
          </a>
        </nav>
      </header>
      <p className="sr-only" role="status">
        {announcement}
      </p>

      {page === 'saved' ? (
        <SavedRecipes
          bookmarks={bookmarks}
          filters={filters}
          experience={experience}
          onExperienceChange={setExperience}
          onToggleBookmark={toggle}
          storageUnavailable={storageUnavailable}
        />
      ) : (
        <>
          <Intro
            kicker="An open mind. A well-stocked kitchen."
            title={
              <>
                What's one change
                <br />
                away from dinner?
              </>
            }
          >
            Explore Asian recipes with what you have. Change one ingredient,
            tool, or difficulty limit at a time to see what opens up.
          </Intro>

          <main className="grid grid-cols-[minmax(0,1fr)] items-start gap-[18px] md:grid-cols-[300px_minmax(0,1fr)] md:gap-6">
            <aside className={panel}>
              <FilterForm
                initial={filters}
                ingredientOptions={ingredientOptions}
                isLoading={isPending}
                onSubmit={submit}
              />
            </aside>

            <div className="grid min-w-0 gap-6">
              <section
                className={`${panel} ${panelPadding}`}
                aria-labelledby="graph-title"
              >
                <div className={sectionHeading}>
                  <div>
                    <p className={kicker}>02 / Explore the possibilities</p>
                    <h2 id="graph-title" className={heading2}>
                      One change, new recipes.
                    </h2>
                  </div>
                  <button
                    type="button"
                    className={button}
                    disabled={isPending}
                    onClick={() => dispatch({ type: 'reset', recipes })}
                  >
                    Reset exploration
                  </button>
                </div>
                <p className={hint}>
                  Up to {MAX_NODES} scenarios, {MAX_DEPTH} changes deep.
                </p>
                <p
                  className="py-3 text-[11px] font-semibold text-[#52705a]"
                  role="status"
                >
                  {isPending
                    ? 'Loading recipes…'
                    : `${recipeCount} recipes · ${sourceLabel}`}
                </p>
                {recipeLoad?.notice && (
                  <p className={notice}>Data notice: {recipeLoad.notice}</p>
                )}
                <FlowGraph
                  graph={graph}
                  recipes={recipes}
                  onExpand={(nodeId) =>
                    dispatch({ type: 'expand', nodeId, recipes })
                  }
                  onSelect={(nodeId) => dispatch({ type: 'select', nodeId })}
                />
              </section>

              <section
                className={`${panel} ${panelPadding}`}
                aria-label="Selected scenario recipes"
              >
                <p
                  className="mb-5 border-b border-line-soft pb-3.5 text-xs leading-[1.6] text-[#64765c] [overflow-wrap:anywhere]"
                  aria-live="polite"
                >
                  Selected scenario:{' '}
                  {graph.selectedId === graph.rootId
                    ? 'Start'
                    : changeLabel(selected.change!)}{' '}
                  · {summarizeFilters(selected.state)}
                </p>
                {storageUnavailable && (
                  <p className={notice}>
                    Browser storage is unavailable. Bookmarks last for this
                    session only.
                  </p>
                )}
                <RecipeDetails
                  key={graph.selectedId}
                  evaluations={rank(recipes, selected.state)}
                  experience={experience}
                  onExperienceChange={setExperience}
                  bookmarks={bookmarks}
                  onToggleBookmark={toggle}
                />
              </section>
            </div>
          </main>
        </>
      )}

      <footer className="flex flex-col justify-between gap-3 py-7 text-[11px] text-muted md:flex-row">
        <span>Asian Recipe Explorer · CS 188</span>
        <span>
          Live recipe data from the{' '}
          <a className="underline" href="https://spoonacular.com/food-api">
            spoonacular API
          </a>
          .
        </span>
      </footer>
    </div>
  )
}
