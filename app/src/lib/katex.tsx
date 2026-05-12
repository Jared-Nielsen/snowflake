import { useEffect, useRef } from 'react'
import katex from 'katex'

export function Tex({
  tex,
  display = false,
  className = '',
}: {
  tex: string
  display?: boolean
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (ref.current) {
      katex.render(tex, ref.current, {
        displayMode: display,
        throwOnError: false,
        errorColor: '#ef4444',
        strict: 'ignore',
      })
    }
  }, [tex, display])
  return <span ref={ref} className={className} />
}
