import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

/**
 * 탭. 화살표·Home·End로 탭을 옮기고, 탭 하나만 Tab 키로 들어간다 (WAI-ARIA tabs 패턴).
 */
export default function Tabs({ label, items, className }: { label: string; items: TabItem[]; className?: string }) {
  const baseId = useId()
  const [active, setActive] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function move(event: KeyboardEvent<HTMLDivElement>) {
    const last = items.length - 1
    const next =
      event.key === 'ArrowRight'
        ? (active + 1) % items.length
        : event.key === 'ArrowLeft'
          ? (active - 1 + items.length) % items.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (next === null) return
    event.preventDefault()
    setActive(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className={['tabs', className].filter(Boolean).join(' ')}>
      <div role="tablist" aria-label={label} className="tabs__list" onKeyDown={move}>
        {items.map((item, i) => (
          <button
            key={item.id}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${item.id}`}
            aria-selected={i === active}
            aria-controls={`${baseId}-panel-${item.id}`}
            tabIndex={i === active ? 0 : -1}
            className="tabs__tab"
            onClick={() => setActive(i)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, i) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={i !== active}
          className="tabs__panel"
        >
          {item.content}
        </div>
      ))}
    </div>
  )
}
