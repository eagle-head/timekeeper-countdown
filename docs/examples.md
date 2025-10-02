# Examples

A handful of examples showing different ways to wire **Timekeeper Countdown** into your application.

## Vanilla: Minutes/Seconds Display

```html
<button id="start">Start</button>
<button id="pause">Pause</button>
<button id="resume">Resume</button>
<button id="reset">Reset</button>
<span id="time">05:00</span>

<script type="module">
  import { Countdown } from 'https://unpkg.com/@timekeeper-countdown/core?module'

  const countdown = Countdown(300, {
    onUpdate: (minutes, seconds) => {
      document.querySelector('#time').textContent = `${minutes}:${seconds}`
    },
  })

  document.querySelector('#start').addEventListener('click', () => countdown.start())
  document.querySelector('#pause').addEventListener('click', () => countdown.pause())
  document.querySelector('#resume').addEventListener('click', () => countdown.resume())
  document.querySelector('#reset').addEventListener('click', () => countdown.reset())
</script>
```

## Engine + Progress Bar

```ts
import { CountdownEngine } from '@timekeeper-countdown/core'

const engine = CountdownEngine(120, {
  onSnapshot: ({ totalSeconds, initialSeconds }) => {
    const percent = 100 - Math.floor((totalSeconds / initialSeconds) * 100)
    progressBar.style.width = `${percent}%`
  },
})

startButton.addEventListener('click', () => engine.start())
pauseButton.addEventListener('click', () => engine.pause())
```

## React Hook

```tsx
import { useCountdown } from '@timekeeper-countdown/react'
import { formatTime } from '@timekeeper-countdown/core/format'

function PomodoroTimer() {
  const { snapshot, isRunning, start, pause, reset } = useCountdown(25 * 60)
  const { minutes, seconds } = formatTime(snapshot)

  return (
    <section>
      <h2>{minutes}:{seconds}</h2>
      <button onClick={start} disabled={isRunning}>Start</button>
      <button onClick={pause} disabled={!isRunning}>Pause</button>
      <button onClick={() => reset(25 * 60)}>Reset</button>
    </section>
  )
}
```

## Swapping Durations on the Fly

```ts
const engine = CountdownEngine(180)
engine.start()

// Jump to the last 30 seconds when a user performs an action
ctaButton.addEventListener('click', () => {
  engine.setSeconds(30)
})
```

## Node.js Script

```ts
import { CountdownEngine, TimerState } from '@timekeeper-countdown/core'

const engine = CountdownEngine(10, {
  onSnapshot: ({ totalSeconds }) => {
    process.stdout.write(`\r${totalSeconds.toString().padStart(2, '0')}s remaining`)
  },
  onStateChange: (state) => {
    if (state === TimerState.STOPPED) {
      process.stdout.write('\nDone!\n')
    }
  },
})

engine.start()
```

Use these snippets as building blocks—the engine is snapshot-first, so you can map it to any UI or workflow.
