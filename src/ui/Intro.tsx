import type { ReactNode } from 'react'
import { kicker } from './styles'
import { BrandArt } from './Brand'

interface IntroProps {
  kicker: string
  title: ReactNode
  children: ReactNode
}

/** Large page heading with a small label above and one line of text below. */
export function Intro({ kicker: label, title, children }: IntroProps) {
  return (
    <section className="my-6 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-ink bg-card px-6 py-8 md:my-8 md:px-10 md:py-10">
      <div className="max-w-[760px] flex-1 basis-[300px]">
        <p className={`${kicker} flex items-center gap-2`}><span aria-hidden="true" className="text-lg text-brand">★</span>{label}</p>
        <h1 className="brand-heading mb-[18px] text-[clamp(34px,4.5vw,68px)] leading-[1.02] tracking-[-.055em]">
          {title}
        </h1>
        <p className="max-w-[560px] text-[15px] leading-[1.65] text-subtle">
          {children}
        </p>
      </div>
      <div className="mx-auto sm:mx-0"><BrandArt /></div>
    </section>
  )
}
