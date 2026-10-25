'use client'
import { useId, useRef, useState, type ReactNode } from 'react'
import { Button } from '@dance/ui'
import styles from './Shell.module.scss'
export function MobileNavigation({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const id = useId()
  const toggle = useRef<HTMLButtonElement>(null)
  return (
    <div
      className={styles.mobile}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          setIsOpen(false)
          toggle.current?.focus()
        }
      }}
    >
      <Button
        variant="secondary"
        ref={toggle}
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => setIsOpen((value) => !value)}
      >
        {label}
      </Button>
      <div
        id={id}
        hidden={!isOpen}
        className={styles.mobilePanel}
        onClick={(event) => {
          if ((event.target as Element).closest('a')) setIsOpen(false)
        }}
      >
        {children}
      </div>
    </div>
  )
}
