# 出題アルゴリズム改善提案書

> **✅ 実装完了**: 本提案書の内容は全て実装されました（2024年12月）

## 概要

本ドキュメントでは、TypeFlowの出題アルゴリズムをより効果的なものに改善するための提案と、その実装について説明します。

---

## 1. 現行アルゴリズムの分析

### 1.1 現在の仕組み

```
弱点スコア = Σ(遷移スコア × 3) + Σ(キースコア × 1) + (1 - 精度/100) × 2
最終スコア = 弱点スコア × 0.7 + ランダム × 0.3
```

| 要素 | 重み | 説明 |
|------|------|------|
| キー遷移 | ×3 | 苦手な遷移を含む単語を優先 |
| 弱点キー | ×1 | 苦手なキーを含む単語を優先 |
| 単語精度 | ×2 | 過去にミスが多い単語を優先 |
| ランダム | 30% | 多様性のための乱数要素 |

### 1.2 現行アルゴリズムの課題

| 課題 | 説明 | 影響 |
|------|------|------|
| **新規単語の埋没** | 新しく追加された単語は弱点データがなく、優先度が低い | 追加した単語がなかなか出題されない |
| **時間経過の無視** | 最後に練習した時間を考慮していない | 忘却曲線に反した非効率な練習 |
| **マスター済み単語の再出題** | 十分に習熟した単語も同じ頻度で出題される | 練習効率の低下 |
| **コールドスタート問題** | 最低3回のサンプルがないと弱点として認識されない | 初期段階での最適化が効かない |
| **難易度の偏り** | セッション内で難しい単語が連続する可能性 | ユーザーの挫折・モチベーション低下 |
| **セッション内重複** | 同じ単語が短期間に何度も出る可能性 | 学習効率の低下 |

---

## 2. 改善提案

### 2.1 マルチファクター・スコアリングシステム

複数の要素を組み合わせた総合的なスコアリングシステムを導入します。

```
総合スコア = Σ (各スコア × 重み) / Σ 重み

各スコアは 0.0 〜 1.0 に正規化
```

#### スコア要素

| 要素 | 重み | 計算方法 | 目的 |
|------|------|----------|------|
| **弱点スコア** | 35% | 現行ロジック（正規化版） | 苦手な単語を優先 |
| **時間経過スコア** | 25% | 忘却曲線ベース | 忘れかけの単語を復習 |
| **新規度スコア** | 15% | 練習回数の逆数 | 新しい単語を優先 |
| **難易度調整スコア** | 10% | 現在のパフォーマンスに応じて動的調整 | 適切な難易度を維持 |
| **ランダムスコア** | 15% | 乱数 | 多様性確保 |

### 2.2 間隔反復システム（SRS: Spaced Repetition System）

エビングハウスの忘却曲線に基づいた出題間隔の最適化を行います。

#### 復習間隔の計算

```typescript
// 習熟度レベル（0-5）に応じた基本間隔（時間）
const BASE_INTERVALS = [0, 1, 6, 24, 72, 168, 336] // 時間単位

// 次回復習までの間隔を計算
function calculateNextInterval(masteryLevel: number, wasCorrect: boolean): number {
  if (wasCorrect) {
    // 正解: 次のレベルへ（最大5）
    const newLevel = Math.min(masteryLevel + 1, 5)
    return BASE_INTERVALS[newLevel + 1]
  } else {
    // 不正解: レベルを下げる
    const newLevel = Math.max(masteryLevel - 2, 0)
    return BASE_INTERVALS[newLevel + 1]
  }
}
```

#### 時間経過スコアの計算

```typescript
function calculateTimeScore(lastPlayed: number, interval: number): number {
  const hoursSinceLastPlay = (Date.now() - lastPlayed) / (1000 * 60 * 60)
  
  if (hoursSinceLastPlay < interval * 0.5) {
    // まだ復習には早い
    return 0.1
  } else if (hoursSinceLastPlay < interval) {
    // 復習タイミングが近づいている
    return 0.3 + (hoursSinceLastPlay / interval) * 0.4
  } else if (hoursSinceLastPlay < interval * 2) {
    // 復習タイミング（最適）
    return 1.0
  } else {
    // 復習タイミングを過ぎている（忘却リスク高）
    return 0.8
  }
}
```

### 2.3 新規単語の優先処理

新しく追加された単語や練習回数が少ない単語を適切に出題します。

```typescript
function calculateNoveltyScore(word: Word): number {
  const totalAttempts = word.stats.correct + word.stats.miss
  
  if (totalAttempts === 0) {
    // 未練習の単語は最高優先度
    return 1.0
  } else if (totalAttempts < 3) {
    // 練習回数が少ない単語も優先
    return 0.8 - (totalAttempts * 0.2)
  } else if (totalAttempts < 10) {
    // まだ十分な練習量ではない
    return 0.3 - (totalAttempts * 0.02)
  }
  
  return 0.0
}
```

### 2.4 アダプティブ難易度調整

セッション中のパフォーマンスに基づいて、リアルタイムで難易度を調整します。

```typescript
interface SessionPerformance {
  recentCorrectRate: number  // 直近10問の正答率
  averageKps: number         // 平均打鍵速度
}

function calculateDifficultyAdjustment(
  performance: SessionPerformance,
  wordDifficulty: number  // 0.0-1.0
): number {
  const targetCorrectRate = 0.75  // 目標正答率 75%
  
  if (performance.recentCorrectRate > 0.9) {
    // 調子が良い → 難しい単語を優先
    return wordDifficulty > 0.6 ? 0.8 : 0.2
  } else if (performance.recentCorrectRate < 0.5) {
    // 調子が悪い → 易しい単語を優先
    return wordDifficulty < 0.4 ? 0.8 : 0.2
  }
  
  // 通常: バランスよく
  return 0.5
}
```

#### 単語の難易度計算

```typescript
function calculateWordDifficulty(word: Word, weakKeys: Set<string>, weakTransitions: Set<string>): number {
  const romaji = word.romaji.toLowerCase()
  let difficulty = 0
  
  // 長さによる難易度
  difficulty += Math.min(romaji.length / 15, 0.3)
  
  // 苦手キーの含有率
  const weakKeyCount = [...romaji].filter(c => weakKeys.has(c)).length
  difficulty += (weakKeyCount / romaji.length) * 0.35
  
  // 苦手遷移の含有率
  let weakTransitionCount = 0
  for (let i = 1; i < romaji.length; i++) {
    if (weakTransitions.has(`${romaji[i-1]}->${romaji[i]}`)) {
      weakTransitionCount++
    }
  }
  difficulty += (weakTransitionCount / (romaji.length - 1)) * 0.35
  
  return Math.min(difficulty, 1.0)
}
```

### 2.5 セッション最適化

#### ウォームアップフェーズ

セッション開始時は易しい単語から始め、徐々に難易度を上げます。

```typescript
function applyWarmupBoost(wordIndex: number, totalWords: number, baseDifficulty: number): number {
  const warmupRatio = 0.15  // 最初の15%はウォームアップ
  const warmupEnd = Math.ceil(totalWords * warmupRatio)
  
  if (wordIndex < warmupEnd) {
    // ウォームアップ中は易しい単語を優先
    const progress = wordIndex / warmupEnd
    return baseDifficulty < 0.4 ? 1.0 - progress * 0.5 : 0.2
  }
  
  return 0.5  // 通常
}
```

#### 重複防止

セッション内で同じ単語が連続しないようにします。

```typescript
interface SessionState {
  recentWordIds: string[]  // 直近N問で出題した単語ID
  sessionWordIds: Set<string>  // セッション内で出題済みの単語ID
}

function applyDuplicationPenalty(wordId: string, session: SessionState): number {
  // 直近で出題された単語は大幅にペナルティ
  const recentIndex = session.recentWordIds.indexOf(wordId)
  if (recentIndex !== -1) {
    return 0.0  // 出題しない
  }
  
  // セッション内で既出の単語は軽いペナルティ
  if (session.sessionWordIds.has(wordId)) {
    return 0.7
  }
  
  return 1.0
}
```

---

## 3. 実装詳細

### 3.1 データモデルの拡張

```typescript
// Word型の拡張
interface WordStats {
  correct: number
  miss: number
  lastPlayed: number
  accuracy: number
  createdAt: number
  // 新規追加
  masteryLevel: number      // 習熟度レベル (0-5)
  nextReviewAt: number      // 次回復習推奨時刻
  totalAttempts: number     // 総練習回数
  consecutiveCorrect: number // 連続正解数
}
```

### 3.2 新しいスコアリング関数

```typescript
interface WordScore {
  wordId: string
  totalScore: number
  breakdown: {
    weakness: number
    timeDecay: number
    novelty: number
    difficultyAdjust: number
    random: number
  }
}

function calculateWordScore(
  word: Word,
  context: ScoringContext
): WordScore {
  const weights = {
    weakness: 0.35,
    timeDecay: 0.25,
    novelty: 0.15,
    difficultyAdjust: 0.10,
    random: 0.15,
  }
  
  const scores = {
    weakness: calculateWeaknessScore(word, context.weakKeys, context.weakTransitions),
    timeDecay: calculateTimeScore(word.stats.lastPlayed, calculateInterval(word.stats.masteryLevel)),
    novelty: calculateNoveltyScore(word),
    difficultyAdjust: calculateDifficultyAdjustment(context.sessionPerformance, calculateWordDifficulty(word, context.weakKeys, context.weakTransitions)),
    random: Math.random(),
  }
  
  const totalScore = Object.entries(scores).reduce(
    (sum, [key, score]) => sum + score * weights[key as keyof typeof weights],
    0
  )
  
  return {
    wordId: word.id,
    totalScore,
    breakdown: scores,
  }
}
```

### 3.3 セッション管理

```typescript
interface GameSession {
  startedAt: number
  wordsPlayed: number
  recentResults: boolean[]  // 直近の正誤履歴
  recentWordIds: string[]   // 直近の出題単語ID
  sessionWordIds: Set<string>
}

function selectNextWord(
  words: Word[],
  session: GameSession,
  context: ScoringContext
): Word {
  // スコア計算
  const scoredWords = words
    .map(word => ({
      word,
      score: calculateWordScore(word, context),
      penalty: applyDuplicationPenalty(word.id, session),
    }))
    .filter(sw => sw.penalty > 0)  // 重複を除外
    .map(sw => ({
      ...sw,
      finalScore: sw.score.totalScore * sw.penalty * applyWarmupBoost(
        session.wordsPlayed,
        words.length,
        calculateWordDifficulty(sw.word, context.weakKeys, context.weakTransitions)
      ),
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
  
  // 上位からある程度のランダム性を持って選択
  const topN = Math.min(5, scoredWords.length)
  const randomIndex = Math.floor(Math.random() * topN)
  
  return scoredWords[randomIndex].word
}
```

---

## 4. 設定オプション

ユーザーが練習スタイルをカスタマイズできるようにします。

### 4.1 新規設定項目

| 設定 | デフォルト | 説明 |
|------|------------|------|
| `practiceMode` | `balanced` | 練習モード（balanced/weakness-focus/review/random） |
| `difficultyLevel` | `adaptive` | 難易度（easy/normal/hard/adaptive） |
| `srsEnabled` | `true` | 間隔反復システムの有効化 |
| `warmupEnabled` | `true` | ウォームアップフェーズの有効化 |
| `newWordPriority` | `high` | 新規単語の優先度（low/medium/high） |

### 4.2 練習モードの詳細

| モード | 説明 | 重み配分 |
|--------|------|----------|
| `balanced` | バランス型（推奨） | 標準の重み配分 |
| `weakness-focus` | 弱点集中 | 弱点スコア: 60%, 時間経過: 20%, その他: 20% |
| `review` | 復習重視 | 時間経過: 50%, 弱点: 25%, その他: 25% |
| `random` | ランダム | ランダム: 100% |

---

## 5. 期待される効果

### 5.1 定量的な改善目標

| 指標 | 現状（推定） | 目標 | 改善率 |
|------|--------------|------|--------|
| 単語習熟までの平均練習回数 | 20回 | 12回 | 40%削減 |
| 弱点遷移の改善速度 | 基準 | +30% | 30%向上 |
| ユーザー離脱率（挫折） | 基準 | -25% | 25%減少 |
| 1セッションあたりの効果的練習量 | 基準 | +35% | 35%向上 |

### 5.2 定性的な改善

- **新規単語の確実な出題**: 追加した単語がすぐに練習に組み込まれる
- **効率的な復習**: 忘れかけのタイミングで適切に復習
- **挫折防止**: 難易度の自動調整により、常に適切なチャレンジレベルを維持
- **多様性の確保**: ランダム要素により、練習が単調にならない

---

## 6. 実装ロードマップ（✅ 完了）

### Phase 1: 基盤整備 ✅

1. ✅ データモデルの拡張（`masteryLevel`, `nextReviewAt`, `consecutiveCorrect` を追加）
2. ✅ DBマイグレーション（SQLiteスキーマ更新）
3. ✅ SRSユーティリティ関数の実装（`src/lib/srs-utils.ts`）

### Phase 2: コアアルゴリズム ✅

1. ✅ マルチファクター・スコアリングの実装
2. ✅ 時間経過スコアの実装
3. ✅ 新規度スコアの実装
4. ✅ セッション管理の実装

### Phase 3: 高度な機能 ✅

1. ✅ アダプティブ難易度調整
2. ✅ ウォームアップフェーズ
3. ✅ 間隔反復システム（SRS）

### Phase 4: 設定・UI ✅

1. ✅ 設定画面への練習モード追加
2. ✅ SRS/ウォームアップのトグル設定

---

## 7. 移行戦略

### 既存データの取り扱い

```typescript
// マイグレーション: 既存の単語に初期値を設定
async function migrateWordStats(word: Word): Promise<void> {
  const totalAttempts = word.stats.correct + word.stats.miss
  
  // 習熟度の推定
  let masteryLevel = 0
  if (word.stats.accuracy >= 95 && totalAttempts >= 10) {
    masteryLevel = 4
  } else if (word.stats.accuracy >= 85 && totalAttempts >= 5) {
    masteryLevel = 3
  } else if (word.stats.accuracy >= 70 && totalAttempts >= 3) {
    masteryLevel = 2
  } else if (totalAttempts >= 1) {
    masteryLevel = 1
  }
  
  await updateWord(word.id, {
    masteryLevel,
    nextReviewAt: calculateNextReviewTime(masteryLevel, word.stats.lastPlayed),
    totalAttempts,
    consecutiveCorrect: 0,  // リセット
  })
}
```

---

## 8. まとめ

本提案により、TypeFlowの出題アルゴリズムは以下の点で大幅に改善されました：

1. **科学的根拠に基づく学習**: 忘却曲線とSRSにより、最適なタイミングで復習
2. **パーソナライズ**: ユーザーの弱点と学習進度に応じた適応的な出題
3. **バランスの取れた難易度**: ウォームアップと動的調整により、常に適切なチャレンジ
4. **公平な新規単語の扱い**: 追加した単語が埋もれずに確実に練習可能
5. **多様性の維持**: ランダム要素により、練習の単調化を防止

これらの改善により、ユーザーのタイピングスキル向上速度の加速と、学習継続率の向上が期待できます。

---

## 9. 実装ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/lib/types.ts` | Word型にSRSフィールド追加、PracticeMode型追加、ScoringContext型追加 |
| `src/lib/db.ts` | WordRecord/SettingsRecord拡張、DEFAULT_SETTINGS更新 |
| `src/lib/srs-utils.ts` | **新規** - SRS計算、スコアリング関数群 |
| `src/hooks/useTypingAnalytics.ts` | マルチファクター・スコアリング、セッション管理 |
| `src/hooks/useSettings.ts` | 練習モード、SRS、ウォームアップ設定追加 |
| `src/hooks/useWords.ts` | SRS情報の更新処理追加 |
| `src/components/SettingsScreen.tsx` | 練習モード選択UI、高度な設定UI |
| `src/App.tsx` | 新しい設定の適用 |
| `server/index.ts` | DBスキーマ更新、APIハンドラー拡張 |

