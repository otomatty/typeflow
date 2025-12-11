# Planning Guide

A minimalist typing practice application for engineers to train muscle memory on technical terms and code syntax in a widget-like interface that can run in a narrow window alongside their development environment.

**Experience Qualities**:
1. **Focused** - Strip away all distractions to create a pure typing practice experience that fits in a tiny window
2. **Instant** - Zero loading times, immediate feedback, and instant word generation without server calls
3. **Adaptive** - Intelligently surfaces difficult words and tracks weaknesses to optimize learning

**Complexity Level**: Light Application (multiple features with basic state)
This is a focused typing trainer with word management, game logic, and statistics tracking - more than a micro tool but not requiring complex multi-view navigation.

## Essential Features

**Word Management with Auto-Processing**
- Functionality: Users input Japanese/English technical terms, system auto-generates furigana and romaji using browser-side processing
- Purpose: Eliminates tedious manual entry while building a personalized vocabulary for practice
- Trigger: User clicks "Add Word" button or uses keyboard shortcut
- Progression: Input text → Auto-generate readings → Preview/edit if needed → Save to local storage
- Success criteria: Words are saved with accurate romaji conversion and can be immediately used in practice

**Time Attack Typing Game**
- Functionality: Display words one at a time with a depleting time gauge; correct input advances to next word, timeout ends game
- Purpose: Creates urgency and game-like engagement to make practice sessions addictive
- Trigger: User clicks "Start" or presses Enter on home screen
- Progression: Word displays → Timer starts depleting → User types → Correct input refills time and shows next word → Mistakes flash red → Time runs out triggers game over
- Success criteria: Smooth typing flow with accurate romaji input validation (including variations like shi/si)

**Weakness Tracking & Retry**
- Functionality: Track accuracy per word and allow instant retry of only the words missed in last session
- Purpose: Optimize learning by focusing repetition on difficult words
- Trigger: Game over screen shows "Retry Weak Words" option; statistics page shows weakness list
- Progression: Game ends → System identifies missed words → User presses Enter → New game with only those words
- Success criteria: Weak words appear more frequently and users can see measurable improvement over time

**Real-time Performance Metrics**
- Functionality: Display WPM, accuracy, and remaining time during gameplay with live updates
- Purpose: Provide immediate feedback to motivate improvement and track progress
- Trigger: Automatically displayed during gameplay
- Progression: User types → Metrics update in real-time → Final stats shown at game over
- Success criteria: Metrics are accurate and update smoothly without affecting typing responsiveness

## Edge Case Handling
- **Empty Word List**: Show onboarding prompt to add words before playing
- **Window Resize**: Layout gracefully adapts from 150px height widget mode to full screen
- **Rapid Input**: Debounce and queue keystrokes to prevent input loss during fast typing
- **Ambiguous Romaji**: Accept common variations (shi/si, tsu/tu, fu/hu, n/nn) in input validation
- **Long Words**: Truncate or wrap text elegantly in mini-widget mode

## Design Direction
The design should evoke a developer's terminal or code editor - dark, high-contrast, monospaced, with subtle neon accents that pulse and flash during gameplay. It should feel like a tool, not a toy, with every pixel serving a functional purpose in the extremely constrained widget layout.

## Color Selection
A cyberpunk-inspired dark terminal aesthetic with electric accent colors.

- **Primary Color**: Electric Cyan `oklch(0.75 0.15 195)` - Represents active typing state and primary actions, evoking the glow of terminal text
- **Secondary Colors**: 
  - Deep Space Gray `oklch(0.20 0.01 240)` - Background that reduces eye strain during long practice sessions
  - Slate `oklch(0.35 0.02 240)` - Secondary surfaces like cards
- **Accent Color**: Hot Pink `oklch(0.70 0.20 350)` - Error flashes and urgent notifications that demand attention
- **Foreground/Background Pairings**: 
  - Background (Deep Space Gray #2a2c3e): Electric Cyan text (#6be9ff) - Ratio 8.2:1 ✓
  - Card (Slate #494d64): White text (#ffffff) - Ratio 7.1:1 ✓
  - Accent (Hot Pink #e94b96): White text (#ffffff) - Ratio 5.2:1 ✓

## Font Selection
Typography must be monospaced for precise character alignment during typing, with a technical aesthetic that feels native to development tools.

- **Typographic Hierarchy**: 
  - Display Word (Current typing target): JetBrains Mono Bold/32px/tight tracking for maximum readability
  - Romaji Guide (Input helper): JetBrains Mono Regular/20px/loose tracking to show typing progress
  - Metrics (WPM/Accuracy): JetBrains Mono Medium/14px/tabular numbers for consistent alignment
  - UI Labels: JetBrains Mono Regular/12px/uppercase for compact button labels

## Animations
Animations should provide instant tactile feedback without delaying input - every animation reinforces the game state.

Use framer-motion for micro-interactions: red flash on incorrect keystrokes (100ms), smooth gauge depletion with spring physics, word transitions that slide up (200ms), and celebration pulses on completion. The time gauge should have a subtle pulse that intensifies as time runs low, creating natural urgency without explicit warnings.

## Component Selection
- **Components**: 
  - Dialog (word entry modal with keyboard shortcuts)
  - Button (primary actions with distinct pressed states)
  - Progress (time gauge with animated depletion)
  - Card (word list items and stat displays)
  - Badge (accuracy indicators and difficulty tags)
  - Input (word entry field with auto-focus)
- **Customizations**: 
  - Custom typing display component with character-by-character state tracking
  - Custom gauge that depletes smoothly with CSS transitions
  - Flash overlay component for error feedback
- **States**: 
  - Buttons glow on hover with cyan border, scale slightly on press
  - Input fields have thick cyan bottom border on focus
  - Gauge changes from cyan to orange to red as time depletes
- **Icon Selection**: 
  - Plus (add words)
  - Play (start game)
  - ArrowCounterClockwise (retry)
  - ChartLine (statistics)
  - Keyboard (typing indicator)
- **Spacing**: 
  - Tight spacing throughout (p-2, gap-2) to maximize widget density
  - Cards use p-4 for comfortable tap targets
  - Consistent 8px (space-2) gaps between UI elements
- **Mobile**: 
  - Stack metrics vertically on narrow screens
  - Reduce font sizes proportionally below 400px width
  - Hide secondary UI elements in extreme widget mode (<200px height)
  - Touch-friendly button sizes (min 44px) even in compact mode
