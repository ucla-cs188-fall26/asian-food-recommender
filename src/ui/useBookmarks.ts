import { useState } from 'react'
import type { Recipe } from '../domain/types'
import { readBookmarks, toggleBookmark, writeBookmarks } from '../data/bookmarks'

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Recipe[]>(() => {
    try { return readBookmarks(window.localStorage) } catch { return [] }
  })
  const [storageUnavailable, setStorageUnavailable] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  function toggle(recipe: Recipe) {
    const next = toggleBookmark(bookmarks, recipe)
    setBookmarks(next)
    try {
      setStorageUnavailable(!writeBookmarks(window.localStorage, next))
    } catch {
      setStorageUnavailable(true)
    }
    setAnnouncement(`${recipe.name}: ${bookmarks.some((saved) => saved.source === recipe.source && saved.id === recipe.id) ? 'removed from saved recipes' : 'saved'}.`)
  }

  return { bookmarks, toggle, storageUnavailable, announcement }
}
