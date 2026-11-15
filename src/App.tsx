import { useReducer, useState, useTransition } from 'react'
import { getRecipes } from './data/recipes'
import type { RecipeLoad } from './data/recipes'
import { SAMPLE_RECIPES } from './data/sampleRecipes'
import { DEFAULT_FILTERS } from './domain/filters'
import type { FilterState } from './domain/filters'
import { createGraph, graphReducer, MAX_DEPTH, MAX_NODES } from './graph/graphState'
import { FilterForm } from './ui/FilterForm'

export default function App() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [recipeLoad, setRecipeLoad] = useState<RecipeLoad>()
  const [graph, dispatch] = useReducer(graphReducer, DEFAULT_FILTERS, (initial) => createGraph(initial, SAMPLE_RECIPES))
  const [experience, setExperience] = useState<'beginner' | 'experienced'>('beginner')
  const [isPending, startTransition] = useTransition()
  const ingredientOptions = [...new Set([...SAMPLE_RECIPES, ...(recipeLoad?.recipes ?? [])].flatMap((r) => r.requiredIngredients))].sort()
  function submit(next: FilterState) {
    startTransition(async () => {
      const load = await getRecipes(next.cuisines)
      setFilters(next)
      setRecipeLoad(load)
      dispatch({ type: 'start', filters: next, recipes: load.recipes })
    })
  }
  return <div className="app">
    <header className="page-header"><a className="brand" href="./">RECIPE / EXPLORER</a><span className="header-note">A little change. A new possibility.</span></header>
    <section className="intro"><p className="section-kicker">An open mind. A well-stocked kitchen.</p><h1>What's one change<br />away from dinner?</h1><p>Explore Asian recipes with what you have. Change one ingredient, tool, or difficulty limit at a time to see what opens up.</p></section>
    <main className="workspace">
      <aside><FilterForm initial={filters} ingredientOptions={ingredientOptions} isLoading={isPending} onSubmit={submit} /></aside>
      <div className="exploration">
        <section className="graph-section" aria-labelledby="graph-title"><div className="section-heading"><div><p className="section-kicker">02 / Explore the possibilities</p><h2 id="graph-title">One change, new recipes.</h2></div><button type="button" disabled={isPending} onClick={() => dispatch({ type: 'reset', recipes: recipeLoad?.recipes ?? SAMPLE_RECIPES })}>Reset exploration</button></div>
          <p className="hint">Up to {MAX_NODES} scenarios, {MAX_DEPTH} changes deep.</p>
          <p className="data-status" role="status">{isPending ? 'Loading recipes…' : `${recipeLoad?.recipes.length ?? SAMPLE_RECIPES.filter((r) => filters.cuisines.includes(r.cuisine)).length} recipes · ${recipeLoad?.source === 'spoonacular' ? 'Live data' : 'Sample collection'}`}</p>
          {recipeLoad?.notice && <p className="notice">Data notice: {recipeLoad.notice}</p>}
          <div className="empty-panel">Graph ready: {Object.keys(graph.nodes).length} scenarios. The interactive view is coming next.</div>
        </section>
        <section className="details-section"><h2>Recipes in the selected scenario</h2><label><input type="checkbox" checked={experience === 'experienced'} onChange={(e) => setExperience(e.target.checked ? 'experienced' : 'beginner')} />Concise steps</label><p>Select a scenario to see its recipes.</p></section>
      </div>
    </main>
    <footer><span>Asian Recipe Explorer · CS 188</span><span>Live recipe data from the <a href="https://spoonacular.com/food-api">spoonacular API</a>.</span></footer>
  </div>
}
