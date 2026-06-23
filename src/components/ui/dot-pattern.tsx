"use client"

import { useId } from "react"

import { cn } from "@/lib/utils"

/**
 * DotPattern — fundo de pontos via `<pattern>` SVG tileado.
 *
 * Performance: renderiza UM `<rect>` preenchido com um padrão tileado (composto
 * na GPU), em vez de um `<circle>` por ponto. A versão anterior criava um
 * `motion.circle` por ponto — milhares de componentes Framer Motion num herói
 * full-bleed (e, com `glow`, milhares de animações infinitas na main thread),
 * o que travava a página inteira. Sem motion/react e sem medir dimensões em JS.
 *
 * A cor dos pontos vem de `currentColor` (controle via classes `text-*`).
 * Com `glow`, os pontos usam um gradiente radial suave + um pulso de opacidade
 * único na camada (1 animação CSS, respeitando prefers-reduced-motion).
 */
interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  x?: number
  y?: number
  cx?: number
  cy?: number
  cr?: number
  className?: string
  glow?: boolean
}

export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  glow = false,
  ...props
}: DotPatternProps) {
  const id = useId()
  const patternId = `dp${id}`
  const gradientId = `dpg${id}`

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-neutral-400/80",
        glow && "dot-pattern--glow",
        className,
      )}
      {...props}
    >
      <defs>
        {glow && (
          <radialGradient id={gradientId}>
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        )}
        <pattern id={patternId} x={x} y={y} width={width} height={height} patternUnits="userSpaceOnUse">
          <circle cx={cx} cy={cy} r={glow ? cr * 2 : cr} fill={glow ? `url(#${gradientId})` : "currentColor"} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}
