import type { ComponentProps, HTMLAttributes } from 'react'
import styles from './Primitives.module.scss'
export function Container({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={styles.container + ' ' + className} {...props} />
}
export function Button({
  type = 'button',
  className = '',
  ...props
}: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={styles.button + ' ' + className}
      {...props}
    />
  )
}
