'use client'
import { useId, useRef, useState, type ReactNode } from 'react'
import styles from './Primitives.module.scss'
export type TabItem = {
  id: string
  label: string
  content: ReactNode
  disabled?: boolean
}
export type TabsProps = {
  label: string
  items: readonly TabItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}
export function Tabs({
  label,
  items,
  value,
  defaultValue,
  onValueChange,
}: TabsProps) {
  const [localValue, setLocalValue] = useState(defaultValue)
  const enabled = items.filter((item) => !item.disabled)
  const selected =
    enabled.find((item) => item.id === (value ?? localValue))?.id ??
    enabled[0]?.id
  const prefix = useId()
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  function select(id: string) {
    if (value === undefined) setLocalValue(id)
    if (id !== selected) onValueChange?.(id)
  }
  return (
    <div>
      <div role="tablist" aria-label={label} className={styles.tabList}>
        {items.map((item) => (
          <button
            key={item.id}
            ref={(node) => {
              if (node) buttons.current.set(item.id, node)
              else buttons.current.delete(item.id)
            }}
            type="button"
            role="tab"
            id={prefix + '-tab-' + item.id}
            aria-controls={prefix + '-panel-' + item.id}
            aria-selected={selected === item.id}
            disabled={item.disabled}
            tabIndex={selected === item.id ? 0 : -1}
            className={styles.tab}
            onClick={() => select(item.id)}
            onKeyDown={(event) => {
              const index = enabled.findIndex((tab) => tab.id === item.id)
              let next: TabItem | undefined
              if (event.key === 'ArrowRight')
                next = enabled[(index + 1) % enabled.length]
              else if (event.key === 'ArrowLeft')
                next = enabled[(index - 1 + enabled.length) % enabled.length]
              else if (event.key === 'Home') next = enabled[0]
              else if (event.key === 'End') next = enabled.at(-1)
              else return
              event.preventDefault()
              if (next) {
                select(next.id)
                buttons.current.get(next.id)?.focus()
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          id={prefix + '-panel-' + item.id}
          role="tabpanel"
          aria-labelledby={prefix + '-tab-' + item.id}
          hidden={selected !== item.id}
          tabIndex={0}
          className={styles.tabPanel}
        >
          {item.content}
        </div>
      ))}
    </div>
  )
}
