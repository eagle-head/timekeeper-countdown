# Vanilla JavaScript Integration Guide

This guide demonstrates how to use `@timekeeper-countdown/core` in plain HTML/JavaScript projects.

## Installation Options

### NPM / Bundlers

```bash
npm install @timekeeper-countdown/core
```

Then import it from your bundler entry point:

```ts
import { Countdown } from '@timekeeper-countdown/core'
```

### CDN (ES Modules)

```html
<script type="module">
  import { Countdown } from 'https://unpkg.com/@timekeeper-countdown/core?module'

  const timer = Countdown(120)
  timer.start()
</script>
```

> The project publishes ESM bundles only. Legacy UMD builds are not provided.

## Basic Setup

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Timekeeper Countdown</title>
    <style>
      body { font-family: system-ui, sans-serif; }
      .controls { display: flex; gap: 0.5rem; margin-top: 1rem; }
    </style>
  </head>
  <body>
    <h1>Sale ends in <span id="display">05:00</span></h1>
    <div class="controls">
      <button id="start">Start</button>
      <button id="pause">Pause</button>
      <button id="resume">Resume</button>
      <button id="reset">Reset</button>
    </div>

    <script type="module">
      import { Countdown } from 'https://unpkg.com/@timekeeper-countdown/core?module'

      const countdown = Countdown(300, {
        onUpdate: (minutes, seconds) => {
          document.getElementById('display').textContent = `${minutes}:${seconds}`
        },
      })

      document.getElementById('start').onclick = () => countdown.start()
      document.getElementById('pause').onclick = () => countdown.pause()
      document.getElementById('resume').onclick = () => countdown.resume()
      document.getElementById('reset').onclick = () => countdown.reset(300)
    </script>
  </body>
</html>
```

## Using the Engine Directly

When you need manual control or access to all time parts, instantiate `CountdownEngine`:

```ts
import { CountdownEngine } from '@timekeeper-countdown/core'

const engine = CountdownEngine(45, {
  onSnapshot: (snapshot) => {
    console.log(snapshot.parts.minutes, snapshot.parts.seconds)
  },
})

engine.start()
```

Remember to call `engine.destroy()` when you no longer need it (for example, before removing a widget from the DOM).

## Formatting Helpers

The formatter module saves you from writing `padStart` everywhere:

```ts
import { formatTime } from '@timekeeper-countdown/core/format'

const { minutes, seconds } = formatTime(engine.getSnapshot())
```

## Node and CLI Scripts

`@timekeeper-countdown/core` works in Node.js ≥ 16. Example:

```ts
import { CountdownEngine } from '@timekeeper-countdown/core'

const engine = CountdownEngine(10, {
  onSnapshot: ({ totalSeconds }) => process.stdout.write(`\r${totalSeconds}s`),
  onStateChange: (state) => state === 'STOPPED' && process.stdout.write('\nDone!\n'),
})

engine.start()
```

That’s it—drop the engine into any environment that supports ESM imports and `setInterval`.
