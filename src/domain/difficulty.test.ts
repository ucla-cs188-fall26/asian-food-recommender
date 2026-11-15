import { expect, test } from 'vitest'
import { deriveDifficulty } from './difficulty'

test('few ingredients and few steps is easy', () => {
  expect(deriveDifficulty(6, 4)).toBe(1)
})

test('a longer ingredient list or more steps makes it medium', () => {
  expect(deriveDifficulty(10, 4)).toBe(2)
  expect(deriveDifficulty(6, 8)).toBe(2)
  expect(deriveDifficulty(10, 8)).toBe(2)
})

test('many ingredients and many steps is hard', () => {
  expect(deriveDifficulty(15, 12)).toBe(3)
  expect(deriveDifficulty(9, 22)).toBe(3)
})
