import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Foundation ships empty layers and a kit used by one page; relax until the frontend agent fills them.
    files: ['./src/**'],
    rules: {
      'fsd/insignificant-slice': 'off',
      'fsd/no-reserved-folder-names': 'off',
    },
  },
  { files: ['./src/shared/assets/**'], rules: { 'fsd/segments-by-purpose': 'off' } },
])
