import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

// Each slice below is named in docs/adr/0002-frontend-structure.md and has one consumer today;
// it stays a separate slice so the ADR layer map holds (merging would move feature logic into pages/widgets).
const single = [
  'entities/member', 'entities/goal', 'entities/material', 'entities/message', 'entities/notification', 'features/admin-crud', 'features/auth-login', 'features/auth-register', 'features/goal-edit', 'features/locale-switch',
  'features/material-upload', 'features/message-send', 'features/notification-read', 'features/profile-edit',
  'features/progress-set', 'features/search-query', 'widgets/admin-table', 'widgets/goals-board', 'widgets/group-chat',
  'widgets/materials-panel', 'widgets/members-list', 'widgets/progress-board', 'widgets/header',
]

export default defineConfig([
  ...fsd.configs.recommended,
  { files: single.map((s) => `./src/${s}/**`), rules: { 'fsd/insignificant-slice': 'off' } },
  { files: ['./src/shared/assets/**'], rules: { 'fsd/segments-by-purpose': 'off' } },
])
