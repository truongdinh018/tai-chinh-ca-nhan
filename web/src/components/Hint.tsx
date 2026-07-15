import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

type Placement = 'top' | 'bottom' | 'left' | 'right'

type HintProps = {
  title: ReactNode
  children?: ReactElement
  placement?: Placement
  /** Use span for the default “?” so it can sit inside another <button>. */
  triggerAs?: 'button' | 'span'
}

type Coord = { top: number; left: number }

/** Soft “island” outline from animal-island-ui Tooltip (objectBoundingBox coords). */
const ISLAND_PATH =
  'M0.501,0.005 L0.523,0.005 L0.549,0.006 C0.704,0.01,0.796,0.017,0.825,0.027 L0.827,0.028 C0.872,0.045,0.939,0.044,0.978,0.17 C1,0.254,1,0.365,0.99,0.505 L0.988,0.513 C0.979,0.558,0.971,0.598,0.965,0.633 C0.956,0.689,0.979,0.77,0.964,0.865 C0.953,0.928,0.921,0.966,0.869,0.979 C0.821,0.986,0.773,0.992,0.726,0.995 L0.712,0.996 L0.694,0.997 C0.648,1,0.586,1,0.507,1 L0.501,1 L0.464,1 C0.385,1,0.325,0.998,0.283,0.995 C0.234,0.992,0.184,0.987,0.133,0.979 C0.081,0.966,0.05,0.928,0.039,0.865 C0.023,0.77,0.047,0.689,0.037,0.633 C0.031,0.595,0.023,0.552,0.013,0.505 C-0.006,0.365,-0.002,0.254,0.024,0.17 C0.064,0.045,0.13,0.045,0.174,0.028 L0.175,0.028 C0.204,0.017,0.303,0.009,0.474,0.005 L0.501,0.005'

function placeRect(rect: DOMRect, tip: DOMRect, placement: Placement, gap = 12): Coord {
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  switch (placement) {
    case 'bottom':
      return { top: rect.bottom + gap, left: cx - tip.width / 2 }
    case 'left':
      return { top: cy - tip.height / 2, left: rect.left - tip.width - gap }
    case 'right':
      return { top: cy - tip.height / 2, left: rect.right + gap }
    case 'top':
    default:
      return { top: rect.top - tip.height - gap, left: cx - tip.width / 2 }
  }
}

function clampToViewport(pos: Coord, tip: DOMRect, pad = 8): Coord {
  const maxLeft = window.innerWidth - tip.width - pad
  const maxTop = window.innerHeight - tip.height - pad
  return {
    left: Math.min(Math.max(pad, pos.left), Math.max(pad, maxLeft)),
    top: Math.min(Math.max(pad, pos.top), Math.max(pad, maxTop)),
  }
}

/** Island tip (template shape) — portaled so panels/cards cannot clip it. */
export function Hint({ title, children, placement = 'top', triggerAs = 'button' }: HintProps) {
  const tipId = useId()
  const clipId = useId().replace(/:/g, '')
  const wrapRef = useRef<HTMLSpanElement | null>(null)
  const bubbleRef = useRef<HTMLDivElement | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<Coord>({ top: 0, left: 0 })
  const TriggerTag = triggerAs

  const clearHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }, [])

  const show = useCallback(() => {
    clearHide()
    setOpen(true)
  }, [clearHide])

  const hideSoon = useCallback(() => {
    clearHide()
    hideTimer.current = setTimeout(() => setOpen(false), 80)
  }, [clearHide])

  useEffect(() => () => clearHide(), [clearHide])

  useLayoutEffect(() => {
    if (!open) return
    const wrap = wrapRef.current
    const bubble = bubbleRef.current
    if (!wrap || !bubble) return

    const update = () => {
      const tRect = wrap.getBoundingClientRect()
      const bRect = bubble.getBoundingClientRect()
      setCoords(clampToViewport(placeRect(tRect, bRect, placement), bRect))
    }

    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, placement, title])

  if (!title) return children ?? null

  const style: CSSProperties = {
    top: coords.top,
    left: coords.left,
  }

  return (
    <>
      <span
        ref={wrapRef}
        className="hint-wrap"
        onMouseEnter={show}
        onMouseLeave={hideSoon}
        onFocusCapture={show}
        onBlurCapture={hideSoon}
      >
        {children ?? (
          <TriggerTag
            type={triggerAs === 'button' ? 'button' : undefined}
            className="hint-btn"
            aria-label="Info"
            aria-describedby={open ? tipId : undefined}
            tabIndex={0}
          >
            ?
          </TriggerTag>
        )}
      </span>
      {open
        ? createPortal(
            <div
              ref={bubbleRef}
              id={tipId}
              role="tooltip"
              className={`hint-island hint-island--${placement}`}
              style={style}
              onMouseEnter={show}
              onMouseLeave={hideSoon}
            >
              <div className="hint-island-body">
                <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden>
                  <clipPath id={clipId} clipPathUnits="objectBoundingBox">
                    <path d={ISLAND_PATH} />
                  </clipPath>
                </svg>
                <svg
                  className="hint-island-svg"
                  viewBox="0 0 1 1"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d={ISLAND_PATH}
                    fill="currentColor"
                    stroke="var(--hint-island-stroke)"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="hint-island-content" style={{ clipPath: `url(#${clipId})` }}>
                  <div className="hint-island-text">{title}</div>
                </div>
              </div>
              <span className="hint-island-tail" aria-hidden />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

export function HintLabel({ label, tip }: { label: ReactNode; tip?: ReactNode }) {
  return (
    <span className="hint-label">
      <span className="hint-label-text">{label}</span>
      {tip ? <Hint title={tip} /> : null}
    </span>
  )
}

/** “?” inside a button label — stops click so the parent button does not fire. */
export function HintInButton({ title }: { title: ReactNode }) {
  if (!title) return null
  return (
    <span
      className="hint-in-btn"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Hint title={title} triggerAs="span" />
    </span>
  )
}
