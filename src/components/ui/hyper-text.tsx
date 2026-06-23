"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

type CharacterSet = string[] | readonly string[]

type HyperTextTag = "div" | "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

interface HyperTextProps extends React.HTMLAttributes<HTMLElement> {
  /** The text content to be animated */
  children: string
  /** Optional className for styling */
  className?: string
  /** Duration of the animation in milliseconds */
  duration?: number
  /** Delay before animation starts in milliseconds */
  delay?: number
  /** Element to render as — defaults to span (usado inline pelo construtor) */
  as?: HyperTextTag
  /** Whether to start animation when element comes into view */
  startOnView?: boolean
  /** Whether to trigger animation on hover */
  animateOnHover?: boolean
  /** Custom character set for scramble effect. Defaults to uppercase alphabet */
  characterSet?: CharacterSet
}

const DEFAULT_CHARACTER_SET = Object.freeze(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
) as readonly string[]

const getRandomInt = (max: number): number => Math.floor(Math.random() * max)

/**
 * Efeito "scramble": revela o texto da esquerda p/ direita embaralhando letras.
 *
 * Performance: NÃO usa motion/react (os elementos animados não tinham nenhuma
 * prop de animação — eram peso morto) e NÃO re-renderiza o React a cada frame.
 * O texto real é renderizado de cara (SSR + primeiro paint = caminho do LCP) e o
 * embaralhamento muta `textContent` direto via ref (mesmo padrão do NumberTicker),
 * sem disparar reconciliação. Acessível: `aria-label` mantém o texto real para
 * leitores de tela mesmo durante o embaralhamento.
 */
export function HyperText({
  children,
  className,
  duration = 800,
  delay = 0,
  as: Component = "span",
  startOnView = true,
  animateOnHover = true,
  characterSet = DEFAULT_CHARACTER_SET,
  ...props
}: HyperTextProps) {
  const elementRef = useRef<HTMLSpanElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const runningRef = useRef(false)

  const finalText = children.toUpperCase()

  const scramble = () => {
    const el = elementRef.current
    if (!el || runningRef.current) return
    runningRef.current = true
    const startTime = performance.now()
    const max = children.length

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const revealed = progress * max
      let out = ""
      for (let i = 0; i < children.length; i++) {
        out +=
          children[i] === " "
            ? " "
            : i <= revealed
              ? children[i]
              : characterSet[getRandomInt(characterSet.length)]
      }
      // Muta o DOM diretamente — sem setState, sem re-render.
      el.textContent = out.toUpperCase()
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        el.textContent = finalText
        runningRef.current = false
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null
    let observer: IntersectionObserver | null = null

    if (!startOnView) {
      timeout = setTimeout(scramble, delay)
    } else {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            timeout = setTimeout(scramble, delay)
            observer?.disconnect()
          }
        },
        { threshold: 0.1, rootMargin: "-20% 0px -20% 0px" },
      )
      if (elementRef.current) observer.observe(elementRef.current)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
      if (observer) observer.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOnView, delay])

  const Tag = Component

  return (
    <Tag
      aria-label={children}
      className={cn("overflow-hidden py-2 text-4xl font-bold", className)}
      onMouseEnter={animateOnHover ? scramble : undefined}
      {...props}
    >
      {/* Ref no span interno (tipagem limpa); o scramble muta o textContent dele. */}
      <span ref={elementRef} className="font-mono" aria-hidden="true">
        {finalText}
      </span>
    </Tag>
  )
}
