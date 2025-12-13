# TypeFlow 国際化（i18n）仕様書

## 1. 概要

TypeFlow アプリケーションを日本語（ja）と英語（en）の2言語に対応させるための国際化仕様書です。

### 1.1 対応言語
| 言語コード | 言語名 | 優先度 |
|-----------|--------|--------|
| `ja` | 日本語 | プライマリ（デフォルト） |
| `en` | English | セカンダリ |

### 1.2 目標
- すべてのUI文字列を翻訳可能にする
- ユーザーが言語を切り替え可能にする
- ブラウザの言語設定を自動検出
- 将来の言語追加を容易にする設計

---

## 2. 技術選定

### 2.1 推奨ライブラリ: `react-i18next`

```bash
bun add i18next react-i18next i18next-browser-languagedetector
```

#### 選定理由
- React エコシステムで最も広く使われている
- 軽量で高性能
- ブラウザ言語自動検出に対応
- 名前空間による翻訳ファイルの分割が可能
- TypeScript サポートが充実

### 2.2 代替案
| ライブラリ | メリット | デメリット |
|-----------|---------|-----------|
| `react-intl` | ICU メッセージ形式 | 学習コストが高い |
| `lingui` | コンパイル時最適化 | セットアップが複雑 |

---

## 3. ディレクトリ構造

```
src/
├── i18n/
│   ├── index.ts           # i18n 初期化設定
│   ├── types.ts           # 型定義
│   └── locales/
│       ├── ja/
│       │   ├── common.json     # 共通UI
│       │   ├── menu.json       # メニュー画面
│       │   ├── game.json       # ゲーム関連
│       │   ├── settings.json   # 設定画面
│       │   ├── stats.json      # 統計画面
│       │   └── words.json      # 単語管理画面
│       └── en/
│           ├── common.json
│           ├── menu.json
│           ├── game.json
│           ├── settings.json
│           ├── stats.json
│           └── words.json
├── hooks/
│   └── useLanguage.ts     # 言語切り替えフック
└── lib/
    └── types.ts           # Language 型追加
```

---

## 4. 翻訳キー設計

### 4.1 命名規則
- **snake_case** を使用
- 階層は `.` で区切る
- コンポーネント/機能ごとにグループ化

```json
{
  "header": {
    "home": "ホーム",
    "words": "単語",
    "stats": "統計",
    "settings": "設定"
  }
}
```

### 4.2 動的値のプレースホルダー
```json
{
  "words_ready": "{{count}} words ready",
  "words_ready_plural": "{{count}} 語の単語が準備完了"
}
```

---

## 5. 翻訳対象テキスト一覧

### 5.1 共通 (`common.json`)

| キー | 日本語 (ja) | 英語 (en) |
|-----|-------------|-----------|
| `app_name` | TypeFlow | TypeFlow |
| `app_tagline` | デベロッパー向けタイピング練習 | Developer Typing Trainer |
| `cancel` | キャンセル | Cancel |
| `save` | 保存 | Save |
| `delete` | 削除 | Delete |
| `edit` | 編集 | Edit |
| `update` | 更新 | Update |
| `loading` | 読み込み中... | Loading... |
| `confirm` | 確認 | Confirm |
| `close` | 閉じる | Close |
| `back` | 戻る | Back |
| `reset` | リセット | Reset |
| `yes` | はい | Yes |
| `no` | いいえ | No |
| `language` | 言語 | Language |

### 5.2 ヘッダー (`header` namespace in `common.json`)

| キー | 日本語 (ja) | 英語 (en) |
|-----|-------------|-----------|
| `header.home` | ホーム | Home |
| `header.words` | 単語 | Words |
| `header.stats` | 統計 | Stats |
| `header.settings` | 設定 | Settings |

### 5.3 メニュー画面 (`menu.json`)

| キー | 日本語 (ja) | 英語 (en) |
|-----|-------------|-----------|
| `words_ready` | {{count}} 語の単語が準備完了 | {{count}} words ready |
| `press_to_start` | スペースキーでスタート | Press to Start |
| `no_words_yet` | 単語がまだありません。練習を始めるには単語を追加してください！ | No words yet. Add words to start practicing! |
| `go_to_words` | メニューの「単語」から単語を追加してください | Go to Words in the menu to add words |
| `press_esc_to_exit` | ゲーム中は Esc で終了 | Press Esc during game to exit |

### 5.4 ゲーム画面 (`game.json`)

| キー | 日本語 (ja) | 英語 (en) |
|-----|-------------|-----------|
| `kps` | KPS | KPS |
| `accuracy` | 正確率 | Accuracy |
| `keys` | 打鍵数 | Keys |
| `words` | 単語 | Words |
| `exit` | 終了 | Exit |

### 5.5 ゲーム終了画面 (`game.json`)

| キー | 日本語 (ja) | 英語 (en) |
|-----|-------------|-----------|
| `game_over` | ゲーム終了！ | Game Over! |
| `great_session` | お疲れ様でした | Great practice session |
| `keys_per_sec` | 打鍵/秒 | Keys/Sec |
| `total_keystrokes` | 総打鍵数 | Total Keystrokes |
| `perfect_words` | 完璧な単語 | Perfect Words |
| `total_time` | 総時間 | Total Time |
| `retry_weak_words` | 苦手な単語を復習 | Retry Weak Words |
| `play_again` | もう一度プレイ（全単語） | Play Again (All Words) |
| `back_to_menu` | メニューに戻る | Back to Menu |

### 5.6 設定画面 (`settings.json`)

| キー | 日本語 (ja) | 英語 (en) |
|-----|-------------|-----------|
| `title` | 設定 | Settings |
| `description` | ゲームの設定を変更できます | Customize your game settings |
| **出題数** | | |
| `word_count.title` | 出題数 | Word Count |
| `word_count.description` | 1ゲームで出題する単語の数を選択します | Select the number of words per game |
| `word_count.use_all` | 全ての単語を使用 | Use all words |
| `word_count.use_all_description` | 登録されている全ての単語を出題します | Use all registered words |
| `word_count.select` | 出題数を選択 | Select word count |
| `word_count.questions` | 問 | questions |
| `word_count.note` | ※ 登録単語数が選択した数より少ない場合は、登録されている全ての単語が出題されます | Note: If registered words are less than selected, all registered words will be used |
| **難易度** | | |
| `difficulty.title` | 難易度 | Difficulty |
| `difficulty.description` | ゲームの難易度を選択します。制限時間とミスペナルティが調整されます | Select game difficulty. Time limit and miss penalty will be adjusted |
| `difficulty.easy` | やさしい | Easy |
| `difficulty.easy_desc` | 初心者向け。ゆとりのある制限時間と緩やかなペナルティ | For beginners. Generous time limit and mild penalties |
| `difficulty.normal` | ふつう | Normal |
| `difficulty.normal_desc` | バランスの取れた標準設定。多くのユーザーにおすすめ | Balanced standard settings. Recommended for most users |
| `difficulty.hard` | むずかしい | Hard |
| `difficulty.hard_desc` | 上級者向け。タイトな制限時間と厳しめのペナルティ | For advanced users. Tight time limit and strict penalties |
| `difficulty.expert` | エキスパート | Expert |
| `difficulty.expert_desc` | 超上級者向け。限界に挑戦したい方へ | For experts. Push your limits |
| `difficulty.custom` | カスタム | Custom |
| `difficulty.custom_desc` | 自分好みに細かく設定 | Fine-tune to your preference |
| **ミスペナルティ** | | |
| `penalty.title` | ミスペナルティ（段階的割合減少） | Miss Penalty (Progressive Reduction) |
| `penalty.time_nth` | {{n}}回目: {{percent}}% | {{n}}th: {{percent}}% |
| **練習モード** | | |
| `practice_mode.title` | 練習モード | Practice Mode |
| `practice_mode.description` | 出題アルゴリズムを選択します | Select the word selection algorithm |
| `practice_mode.balanced` | バランス | Balanced |
| `practice_mode.balanced_desc` | 弱点・復習・新規をバランスよく出題 | Balanced mix of weaknesses, review, and new words |
| `practice_mode.weakness` | 弱点強化 | Weakness Focus |
| `practice_mode.weakness_desc` | 苦手な単語を重点的に練習 | Focus on words you struggle with |
| `practice_mode.review` | 復習優先 | Review Priority |
| `practice_mode.review_desc` | 忘れかけの単語を優先して復習 | Prioritize words you're forgetting |
| `practice_mode.random` | ランダム | Random |
| `practice_mode.random_desc` | 完全にランダムに出題 | Completely random selection |
| **制限時間** | | |
| `time_limit.title` | 制限時間 | Time Limit |
| `time_limit.description` | ゲームの制限時間を設定します | Set the game time limit |
| `time_limit.adaptive` | 適応型 | Adaptive |
| `time_limit.adaptive_desc` | あなたの実力に合わせて自動調整 | Automatically adjusts to your skill level |
| `time_limit.fixed` | 固定 | Fixed |
| `time_limit.fixed_desc` | 一定の制限時間で練習 | Practice with a constant time limit |
| `time_limit.your_avg_kps` | あなたの平均打鍵速度 | Your Average Typing Speed |
| `time_limit.games_played` | {{count}}ゲーム | {{count}} games |
| `time_limit.keys_per_sec` | 打/秒 | keys/sec |
| `time_limit.confidence` | 信頼度 | Confidence |
| `time_limit.comfort_note` | ※ 制限時間の余裕は難易度設定で調整できます | Note: Time limit comfort can be adjusted in difficulty settings |
| `time_limit.seconds` | 秒 | sec |
| **高度な設定** | | |
| `advanced.title` | 高度な設定 | Advanced Settings |
| `advanced.description` | 出題アルゴリズムの詳細設定 | Fine-tune the word selection algorithm |
| `advanced.srs` | 間隔反復システム（SRS） | Spaced Repetition System (SRS) |
| `advanced.srs_desc` | 忘却曲線に基づいて最適なタイミングで復習単語を出題 | Present review words at optimal timing based on the forgetting curve |
| `advanced.warmup` | ウォームアップフェーズ | Warmup Phase |
| `advanced.warmup_desc` | セッション開始時は易しい単語から徐々に難易度を上げる | Start with easier words and gradually increase difficulty |
| **テーマ** | | |
| `theme.title` | テーマ | Theme |
| `theme.description` | アプリの外観を選択します | Choose the app appearance |
| `theme.light` | ライト | Light |
| `theme.light_desc` | 明るいテーマ | Bright theme |
| `theme.dark` | ダーク | Dark |
| `theme.dark_desc` | 暗いテーマ | Dark theme |
| `theme.system` | システム | System |
| `theme.system_desc` | システム設定に従う | Follow system settings |
| `theme.note` | ※ テーマの変更は今後のアップデートで反映されます | Note: Theme changes will be reflected in future updates |
| **カスタム詳細** | | |
| `custom.title` | 詳細設定 | Detailed Settings |
| `custom.time_comfort` | 制限時間の余裕 | Time Limit Comfort |
| `custom.miss_penalty` | ミスペナルティ | Miss Penalty |
| `custom.base_penalty` | 基本ペナルティ | Base Penalty |
| `custom.escalation_factor` | 増加倍率 | Escalation Factor |
| `custom.max_penalty` | 最大ペナルティ | Max Penalty |
| `custom.min_time` | 最低残り時間 | Minimum Remaining Time |

### 5.7 統計画面 (`stats.json`)

| キー | 日本語 (ja) | 英語 (en) |
|-----|-------------|-----------|
| `title` | 統計 | Statistics |
| `description` | タイピングの弱点を分析して効率的に練習しましょう | Analyze your typing weaknesses and practice efficiently |
| `no_data` | データがありません | No Data Yet |
| `no_data_desc` | ゲームをプレイして統計を確認しましょう | Play some games to see your statistics here |
| `keystrokes` | 打鍵数 | Keystrokes |
| `accuracy` | 正確率 | Accuracy |
| `errors` | エラー | Errors |
| `avg_latency` | 平均反応時間 | Avg Latency |
| `performance_history` | パフォーマンス履歴 | Performance History |
| `kps_chart` | 打鍵速度 (KPS) | Keys Per Second (KPS) |
| `accuracy_chart` | 正確率 (%) | Accuracy (%) |
| `words_chart` | 完了単語数 | Words Completed |
| `last_n_games` | 直近 {{count}} ゲーム | Last {{count}} games |
| `keyboard_heatmap` | キーボードヒートマップ | Keyboard Heatmap |
| `difficult_transitions` | 苦手なキー遷移 | Difficult Transitions |
| `common_mistakes` | よくあるミス | Common Mistakes |
| `times` | 回 | times |
| `reset_stats` | 統計をリセット | Reset Statistics |
| `reset_stats_desc` | すべての統計データを削除します | Delete all statistics data |

### 5.8 単語管理画面 (`words.json`)

| キー | 日本語 (ja) | 英語 (en) |
|-----|-------------|-----------|
| `title` | 単語管理 | Word Management |
| `description` | タイピング練習用の単語を追加・管理します | Add and manage your typing practice words |
| `add_word` | 単語を追加 | Add Word |
| `delete_all` | 全削除 | Delete All |
| `delete_all_confirm` | すべての単語を削除しますか？ | Delete all words? |
| `delete_all_desc` | この操作は取り消せません。登録されている {{count}} 件の単語がすべて削除されます。 | This action cannot be undone. All {{count}} registered words will be deleted. |
| `deleting` | 削除中... | Deleting... |
| `delete_confirm` | 削除する | Delete |
| `no_words` | 単語がありません。最初の単語を追加するか、プリセットを読み込んでください！ | No words yet. Add your first word or load a preset! |
| `preset` | プリセット | Preset |
| `preset_title` | プリセットを読み込む | Load Preset |
| `preset_desc` | あらかじめ用意された単語リストを読み込んで練習を開始できます | Load pre-made word lists to start practicing |
| `preset_clear_existing` | 既存の単語を削除してから読み込む | Clear existing words before loading |
| `preset_load` | 読み込む | Load |
| `preset_hint` | 💡 ヒント: 寿司打など外部サイトの単語リストをインポートする機能は近日追加予定です | 💡 Hint: Import feature for external word lists (like Sushida) coming soon |
| `difficulty_beginner` | 初級 | Beginner |
| `difficulty_intermediate` | 中級 | Intermediate |
| `difficulty_advanced` | 上級 | Advanced |
| `n_words` | {{count}}語 | {{count}} words |
| **単語追加ダイアログ** | | |
| `dialog.add_title` | 新しい単語を追加 | Add New Word |
| `dialog.edit_title` | 単語を編集 | Edit Word |
| `dialog.word_text` | 単語 / テキスト | Word / Text |
| `dialog.word_placeholder` | 例: Promise.all, 非同期処理, ひらがな | e.g. Promise.all, async processing |
| `dialog.reading` | 読み仮名（ひらがな） | Reading (Hiragana) |
| `dialog.reading_required` | 要入力 | Required |
| `dialog.reading_placeholder_manual` | ひらがなで入力してください | Enter in hiragana |
| `dialog.reading_placeholder_auto` | 自動生成 | Auto-generated |
| `dialog.reading_hint` | 漢字を含む場合は、読み仮名を手動で入力してください | For kanji, please enter the reading manually |
| `dialog.romaji` | ローマ字（タイピング用） | Romaji (for typing) |
| `dialog.romaji_placeholder` | 自動生成 / 手動入力可 | Auto-generated / Manual entry |
| **CSVインポート** | | |
| `csv.import` | CSVインポート | Import CSV |
| `csv.title` | CSVから単語をインポート | Import Words from CSV |

---

## 6. 実装計画

### 6.1 Phase 1: 基盤構築
1. `react-i18next` のインストールと設定
2. 翻訳ファイルの作成（日本語・英語）
3. i18n 初期化設定
4. `useTranslation` フックの導入

### 6.2 Phase 2: コンポーネント移行
1. 共通コンポーネント（Header, Button labels）
2. MenuScreen
3. GameScreen & GameOverScreen
4. SettingsScreen
5. StatsScreen
6. WordManagementScreen
7. ダイアログ類

### 6.3 Phase 3: 設定画面への言語切り替え追加
1. 言語設定を `AppSettings` に追加
2. 設定画面に言語選択UIを追加
3. localStorage への保存
4. 言語切り替え時の即時反映

### 6.4 Phase 4: 最終調整
1. フォールバック処理の確認
2. 日付・数値フォーマットの地域化
3. RTL対応の検討（将来の言語拡張用）

---

## 7. 設定への言語追加

### 7.1 型定義の更新 (`src/lib/types.ts`)

```typescript
// 言語設定
export type Language = 'ja' | 'en'

// AppSettings に追加
export interface AppSettings {
  // ... 既存の設定
  language: Language  // 追加
}
```

### 7.2 設定画面への追加

設定画面に以下のセクションを追加：

```tsx
{/* Language Setting */}
<Card className="p-6">
  <div className="space-y-4">
    <div>
      <Label className="text-base font-semibold">{t('settings.language.title')}</Label>
      <p className="text-sm text-muted-foreground mt-1">
        {t('settings.language.description')}
      </p>
    </div>
    
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => changeLanguage('ja')}
        className={cn(/* ... */)}
      >
        <span className="text-2xl">🇯🇵</span>
        <span>日本語</span>
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={cn(/* ... */)}
      >
        <span className="text-2xl">🇺🇸</span>
        <span>English</span>
      </button>
    </div>
  </div>
</Card>
```

---

## 8. i18n 初期化設定例

```typescript
// src/i18n/index.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 翻訳リソース
import jaCommon from './locales/ja/common.json'
import jaMenu from './locales/ja/menu.json'
import jaGame from './locales/ja/game.json'
import jaSettings from './locales/ja/settings.json'
import jaStats from './locales/ja/stats.json'
import jaWords from './locales/ja/words.json'

import enCommon from './locales/en/common.json'
import enMenu from './locales/en/menu.json'
import enGame from './locales/en/game.json'
import enSettings from './locales/en/settings.json'
import enStats from './locales/en/stats.json'
import enWords from './locales/en/words.json'

const resources = {
  ja: {
    common: jaCommon,
    menu: jaMenu,
    game: jaGame,
    settings: jaSettings,
    stats: jaStats,
    words: jaWords,
  },
  en: {
    common: enCommon,
    menu: enMenu,
    game: enGame,
    settings: enSettings,
    stats: enStats,
    words: enWords,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ja',
    defaultNS: 'common',
    ns: ['common', 'menu', 'game', 'settings', 'stats', 'words'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
```

---

## 9. 使用例

### 9.1 基本的な使用

```tsx
import { useTranslation } from 'react-i18next'

function Header() {
  const { t } = useTranslation()
  
  return (
    <nav>
      <Button>{t('header.home')}</Button>
      <Button>{t('header.settings')}</Button>
    </nav>
  )
}
```

### 9.2 名前空間を指定

```tsx
function SettingsScreen() {
  const { t } = useTranslation('settings')
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('word_count.description')}</p>
    </div>
  )
}
```

### 9.3 変数を含む翻訳

```tsx
function MenuScreen({ wordCount }: { wordCount: number }) {
  const { t } = useTranslation('menu')
  
  return (
    <p>{t('words_ready', { count: wordCount })}</p>
  )
}
```

### 9.4 言語切り替え

```tsx
import { useTranslation } from 'react-i18next'

function LanguageSwitcher() {
  const { i18n } = useTranslation()
  
  const changeLanguage = (lang: 'ja' | 'en') => {
    i18n.changeLanguage(lang)
  }
  
  return (
    <div>
      <button onClick={() => changeLanguage('ja')}>日本語</button>
      <button onClick={() => changeLanguage('en')}>English</button>
    </div>
  )
}
```

---

## 10. 考慮事項

### 10.1 現在のハードコードされたテキスト

現在のコードベースには日本語と英語が混在しています：
- **英語**: Header, GameOverScreen, StatsScreen の大部分
- **日本語**: SettingsScreen, PresetDialog, difficulty labels

統一性のため、すべてのテキストを翻訳キーに置き換える必要があります。

### 10.2 動的コンテンツ

以下は翻訳対象外：
- ユーザーが登録した単語（text, reading, romaji）
- 統計データの数値
- プリセット単語のコンテンツ

### 10.3 日付・数値フォーマット

```typescript
// 日付フォーマット
const formatDate = (date: Date, language: Language) => {
  return new Intl.DateTimeFormat(language === 'ja' ? 'ja-JP' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// 数値フォーマット
const formatNumber = (num: number, language: Language) => {
  return new Intl.NumberFormat(language === 'ja' ? 'ja-JP' : 'en-US').format(num)
}
```

### 10.4 プリセットの国際化

`difficulty-presets.ts` の `DIFFICULTY_LABELS` も翻訳対象：

```typescript
// 翻訳キーを返すように変更
export const getDifficultyLabelKey = (preset: DifficultyPreset) => {
  return `difficulty.${preset}`
}
```

---

## 11. テスト項目

### 11.1 機能テスト
- [ ] 言語切り替えが即座に反映される
- [ ] ブラウザ言語が自動検出される
- [ ] 設定が localStorage に保存される
- [ ] アプリ再起動後も言語設定が維持される

### 11.2 UIテスト
- [ ] すべての画面で翻訳が適用されている
- [ ] プレースホルダーが正しく表示される
- [ ] 長いテキストでレイアウトが崩れない
- [ ] 数値・日付が適切にフォーマットされる

### 11.3 エッジケース
- [ ] 翻訳キーが見つからない場合のフォールバック
- [ ] 空の翻訳値の処理
- [ ] 特殊文字の表示

---

## 12. 今後の拡張

### 12.1 追加言語対応
1. `src/i18n/locales/{lang}/` にフォルダ追加
2. 翻訳ファイルを作成
3. `resources` オブジェクトに追加
4. 言語選択UIに追加

### 12.2 翻訳管理ツール
将来的に翻訳量が増えた場合：
- Crowdin, Lokalise などの翻訳管理サービスとの連携
- JSON ファイルの自動同期

---

## 13. 工数見積もり

| タスク | 見積もり時間 |
|--------|-------------|
| ライブラリ導入・設定 | 1時間 |
| 翻訳ファイル作成 | 3時間 |
| コンポーネント移行 | 4時間 |
| 言語設定UI追加 | 1時間 |
| テスト・デバッグ | 2時間 |
| **合計** | **約11時間** |

---

## 14. 参考リンク

- [react-i18next ドキュメント](https://react.i18next.com/)
- [i18next ドキュメント](https://www.i18next.com/)
- [i18next-browser-languagedetector](https://github.com/i18next/i18next-browser-languageDetector)

