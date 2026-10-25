'use client'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import styles from './Primitives.module.scss'
export type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  children: ReactNode
}
export function Dialog({
  open,
  onClose,
  title,
  closeLabel,
  children,
}: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const node = dialog.current
    if (!open || !node) return
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const previousOverflow = document.body.style.overflow
    node.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      node.close()
      document.body.style.overflow = previousOverflow
      if (trigger?.isConnected) trigger.focus()
    }
  }, [open])
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className={styles.dialogHeader}>
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className={styles.dialogClose}
          onClick={onClose}
          aria-label={closeLabel}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  )
}
