/**
 * Tailwind class strings shared by more than one component. Anything used in
 * only one place is written inline in that component.
 */

const buttonBase =
  'cursor-pointer rounded-[7px] border font-semibold disabled:cursor-wait disabled:opacity-55'
const buttonNeutral = 'border-line-strong bg-[#fffef8] hover:bg-sage'

export const button = `${buttonBase} ${buttonNeutral} px-3 py-2 text-[13px]`
export const smallButton = `${buttonBase} ${buttonNeutral} px-2 py-1 text-[10px]`
export const primaryButton = `${buttonBase} border-forest bg-forest p-3 text-[13px] text-card hover:bg-forest-dark`

export const kicker =
  'mb-3 text-[10px] font-bold uppercase tracking-[.13em] text-kicker'
export const heading2 = 'font-serif text-[25px] leading-[1.2] font-normal'
export const hint = 'text-xs leading-[1.6] text-muted'
export const notice = 'mb-3 rounded-md bg-warn-bg px-3 py-2.5 text-xs text-warn'

/** Bordered card that holds a page section. */
export const panel = 'min-w-0 rounded-xl border border-line bg-card'
export const panelPadding = 'p-[18px] md:p-6'

export const fieldLabel = 'mb-2.5 block text-[13px] font-bold'
export const choiceLabel = 'flex cursor-pointer items-center gap-[7px] text-xs'
export const choiceInput = 'size-[15px] shrink-0'
export const textInput =
  'rounded-md border border-line-strong bg-white text-[13px]'

/** Title row of a section; stacks vertically below the given width. */
export const sectionHeading =
  'mb-2 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'
export const sectionHeadingWide =
  'mb-2 flex flex-col items-start justify-between gap-4 min-[1101px]:flex-row min-[1101px]:items-center'
