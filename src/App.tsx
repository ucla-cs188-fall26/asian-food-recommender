import { useReducer, useState, useTransition } from 'react'
import { getRecipes } from './data/recipes'
import type { RecipeLoad } from './data/recipes'
import { SAMPLE_RECIPES } from './data/sampleRecipes'
import { DEFAULT_FILTERS } from './domain/filters'
import type { FilterState } from './domain/filters'
import { createGraph, graphReducer, MAX_DEPTH, MAX_NODES } from './graph/graphState'
import { FilterForm } from './ui/FilterForm'
import { FlowGraph } from './ui/FlowGraph'
import { RecipeDetails } from './ui/RecipeDetails'
import { rank } from './domain/scoring'
import { summarizeFilters } from './domain/filters'
import { changeLabel } from './domain/branches'

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
          <FlowGraph graph={graph} recipes={recipeLoad?.recipes ?? SAMPLE_RECIPES} onExpand={(nodeId) => dispatch({ type: 'expand', nodeId, recipes: recipeLoad?.recipes ?? SAMPLE_RECIPES })} onSelect={(nodeId) => dispatch({ type: 'select', nodeId })} />
        </section>
        <section className="details-section" aria-label="Selected scenario recipes"><p className="scenario-caption" aria-live="polite">Selected scenario: {graph.selectedId === graph.rootId ? 'Start' : changeLabel(graph.nodes[graph.selectedId].change!)} · {summarizeFilters(graph.nodes[graph.selectedId].state)}</p><RecipeDetails key={graph.selectedId} evaluations={rank(recipeLoad?.recipes ?? SAMPLE_RECIPES, graph.nodes[graph.selectedId].state)} experience={experience} onExperienceChange={setExperience} /></section>
      </div>
    </main>
    <footer><span>Asian Recipe Explorer · CS 188</span><span>Live recipe data from the <a href="https://spoonacular.com/food-api">spoonacular API</a>.</span></footer>
  </div>
}
