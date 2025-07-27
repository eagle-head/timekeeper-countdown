# timekeeper-countdown

## 2.0.2

### Patch Changes

- Fix destroy() method to properly transition to STOPPED state instead of bypassing state machine

## 2.0.1

### Patch Changes

- Optimize bundle size by removing CJS format and improving build configuration

## 2.0.0

### Major Changes

- Complete rewrite with simplified API and improved performance

## 1.0.2

### Patch Changes

- Update docs

## 1.0.1

### Patch Changes

- Add Svelte integration example to README

## 1.0.0

### Major Changes

- BREAKING CHANGE: Transform library from React-specific to framework-agnostic

  ## What Changed
  - **Removed**: `useCountdown` React hook
  - **Added**: `TimekeeperCountdown` universal class
  - **Enhanced**: Cross-platform timer support (Browser, Node.js, React Native)
  - **Improved**: Framework compatibility (React, Vue, Angular, Svelte, Vanilla JS)

  ## Why This Change

  The library was previously limited to React applications only. This major refactor makes it universally compatible with any JavaScript environment while maintaining all existing functionality.

  ## Migration Guide

  ### Before (v0.x - React only)

  ```javascript
  import { useCountdown } from 'timekeeper-countdown'

  function MyComponent() {
    const { minutes, seconds, start, pause, reset } = useCountdown(60)
    return (
      <div>
        {minutes}:{seconds}
      </div>
    )
  }
  ```

  ### After (v1.x - Universal)

  ```javascript
  import { TimekeeperCountdown } from 'timekeeper-countdown'

  // React
  function MyComponent() {
    const [timer] = useState(() => new TimekeeperCountdown(60))
    const [time, setTime] = useState(timer.time)

    useEffect(() => {
      timer.on('tick', setTime)
      return () => timer.destroy()
    }, [])

    return (
      <div>
        {time.minutes}:{time.seconds}
      </div>
    )
  }

  // Vue
  const timer = new TimekeeperCountdown(60, {
    onTick: data => (this.time = data),
  })

  // Vanilla JS
  const timer = new TimekeeperCountdown(60)
  timer.start()
  ```

  ## Features Maintained
  - ✅ All timing functionality preserved
  - ✅ Event system (onTick, onComplete, etc.)
  - ✅ State management (start, pause, resume, reset)
  - ✅ Time formatting (days, hours, minutes, seconds)
  - ✅ TypeScript support with full type definitions

## 0.1.4

### Patch Changes

- update homepage link

## 0.1.3

### Patch Changes

- Update peerDependencies and dependencies

## 0.1.2

### Patch Changes

- Updated documentation with a new example showing how to manage countdown states.

## 0.1.1

### Patch Changes

- second version

## 0.1.0

### Minor Changes

- first version
