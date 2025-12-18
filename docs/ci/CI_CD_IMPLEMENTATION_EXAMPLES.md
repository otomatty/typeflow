# CI/CD実装例

このドキュメントでは、提案書で示した改善策の具体的な実装例を提供します。

## Phase 1: 基盤構築の実装例

### 1. Vitestの設定

#### package.jsonへの追加

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^24.0.0"
  }
}
```

#### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'src/__tests__/', '**/*.d.ts', '**/*.config.*', '**/dist/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### src/**tests**/setup.ts

```typescript
import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup()
})
```

### 2. GitHub Actions CIワークフロー

#### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - name: Install dependencies
        run: bun install
      - name: Run ESLint
        run: bun run lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - name: Install dependencies
        run: bun install
      - name: Run type check
        run: bun run typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - name: Install dependencies
        run: bun install
      - name: Run tests
        run: bun run test:run
      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - name: Install dependencies
        run: bun install
      - name: Build
        run: bun run build
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 1
```

### 3. Prettierの設定

#### .prettierrc.json

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

#### .prettierignore

```
node_modules
dist
build
coverage
*.lock
*.log
.DS_Store
```

#### package.jsonへの追加

```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css,md}\""
  },
  "devDependencies": {
    "prettier": "^3.2.0",
    "eslint-config-prettier": "^9.1.0"
  }
}
```

### 4. ESLint設定ファイル

#### eslint.config.mjs

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  }
)
```

### 5. Husky + lint-stagedの設定

#### package.jsonへの追加

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0"
  }
}
```

#### .lintstagedrc.json

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,css,md}": ["prettier --write"]
}
```

#### .husky/pre-commit

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

bun run lint-staged
```

#### .husky/commit-msg

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# コミットメッセージの形式チェック（オプション）
# npx commitlint --edit "$1"
```

## Phase 2: テスト例

### ユーティリティ関数のテスト例

#### src/lib/**tests**/romaji-utils.test.ts

```typescript
import { describe, it, expect } from 'vitest'
import { toRomaji, fromRomaji } from '../romaji-utils'

describe('romaji-utils', () => {
  describe('toRomaji', () => {
    it('should convert hiragana to romaji', () => {
      expect(toRomaji('あいうえお')).toBe('aiueo')
      expect(toRomaji('かきくけこ')).toBe('kakikukeko')
    })

    it('should handle katakana', () => {
      expect(toRomaji('アイウエオ')).toBe('aiueo')
    })

    it('should handle mixed characters', () => {
      expect(toRomaji('あいうABC')).toBe('aiuABC')
    })
  })

  describe('fromRomaji', () => {
    it('should convert romaji to hiragana', () => {
      expect(fromRomaji('aiueo')).toBe('あいうえお')
    })
  })
})
```

### カスタムフックのテスト例

#### src/hooks/**tests**/useSettings.test.tsx

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSettings } from '../useSettings'

describe('useSettings', () => {
  beforeEach(() => {
    // ローカルストレージをクリア
    localStorage.clear()
  })

  it('should initialize with default settings', () => {
    const { result } = renderHook(() => useSettings())
    expect(result.current.settings).toBeDefined()
  })

  it('should update settings', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.updateSettings({ theme: 'dark' })
    })

    expect(result.current.settings.theme).toBe('dark')
  })
})
```

## Phase 3: デプロイワークフロー例

### .github/workflows/deploy.yml

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-cloudflare:
    name: Deploy to Cloudflare Workers
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - name: Install dependencies
        run: bun install
      - name: Build
        run: bun run build
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production
      - name: Health check
        run: |
          sleep 10
          curl -f https://your-app.workers.dev/health || exit 1
```

### .github/workflows/security.yml

```yaml
name: Security

on:
  schedule:
    - cron: '0 0 * * 0' # 毎週日曜日
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  audit:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - name: Run security audit
        run: bun audit
      - name: Check for vulnerabilities
        run: |
          if bun audit --json | jq -e '.vulnerabilities | length > 0' > /dev/null; then
            echo "Vulnerabilities found!"
            exit 1
          fi
```

## 実装のチェックリスト

### Phase 1

- [ ] Vitestのインストールと設定
- [ ] テストセットアップファイルの作成
- [ ] GitHub Actions CIワークフローの作成
- [ ] Prettierのインストールと設定
- [ ] ESLint設定ファイルの作成
- [ ] Huskyとlint-stagedの設定
- [ ] package.jsonスクリプトの更新

### Phase 2

- [ ] ユーティリティ関数のテスト作成
- [ ] カスタムフックのテスト作成
- [ ] コードカバレッジの設定
- [ ] Codecovの統合

### Phase 3

- [ ] デプロイワークフローの作成
- [ ] セキュリティチェックの追加
- [ ] マイグレーション検証の追加
- [ ] ヘルスチェックの実装

## トラブルシューティング

### よくある問題

1. **VitestがTypeScriptを認識しない**
   - `vitest.config.ts`でTypeScriptの設定を確認
   - `tsconfig.json`の`include`にテストファイルを追加

2. **GitHub Actionsでビルドが失敗する**
   - Node.js/Bunのバージョンを確認
   - 依存関係のインストールを確認

3. **PrettierとESLintの競合**
   - `eslint-config-prettier`をインストール
   - ESLint設定でPrettierを最後に拡張

4. **Huskyが動作しない**
   - `bun run prepare`を実行
   - `.husky`ディレクトリの権限を確認
