import type { ReactNode } from 'react'
import { kicker } from './styles'

interface IntroProps {
  kicker: string
  title: ReactNode
  children: ReactNode
}

/** Large page heading with a small label above and one line of text below. */
export function Intro({ kicker: label, title, children }: IntroProps) {
  return (
    <section className="max-w-[700px] py-7 md:pt-[42px] md:pb-[35px]">
      <p className={kicker}>{label}</p>
      <h1 className="mb-[18px] font-serif text-[clamp(38px,4.4vw,64px)] leading-[1.04] font-normal tracking-[-.04em]">
        {title}
      </h1>
      <p className="max-w-[560px] text-[15px] leading-[1.65] text-subtle">
        {children}
      </p>
    </section>
  )
}
