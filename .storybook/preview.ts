import type { Preview } from '@storybook/nextjs-vite'
import '@dance/design-tokens/tokens.css'
import './preview.scss'
const preview: Preview = {
  parameters: { backgrounds: { disable: true }, a11y: { test: 'error' } },
}
export default preview
