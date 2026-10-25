import type { StorybookConfig } from '@storybook/nextjs-vite'
const config: StorybookConfig = {
  stories: ['../packages/ui/stories/**/*.stories.tsx'],
  framework: '@storybook/nextjs-vite',
  addons: ['@storybook/addon-a11y'],
  core: { disableTelemetry: true },
}
export default config
