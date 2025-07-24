# Vanilla JavaScript Integration Guide

Learn how to integrate `timekeeper-countdown` with pure JavaScript/HTML applications without any framework dependencies.

## Installation

### Via NPM

```bash
npm install timekeeper-countdown
```

### Via CDN (ES Modules)

```html
<script type="module">
  import { TimekeeperCountdown } from 'https://unpkg.com/timekeeper-countdown@latest/dist/index.js'
</script>
```

### Via CDN (UMD)

```html
<script src="https://unpkg.com/timekeeper-countdown@latest/dist/index.umd.js"></script>
<script>
  const { TimekeeperCountdown } = TimekeeperCountdown
</script>
```

## Quick Start

### Basic HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Timekeeper Countdown</title>
</head>
<body>
    <div id="countdown-container">
        <h1>⏳ Countdown Timer</h1>
        <div id="time-display">05:00</div>
        <div id="state-display">IDLE</div>
        
        <div id="controls">
            <button id="start-btn">Start</button>
            <button id="pause-btn">Pause</button>
            <button id="resume-btn">Resume</button>
            <button id="reset-btn">Reset</button>
            <button id="restart-btn">Restart</button>
        </div>
    </div>

    <script type="module">
        import { TimekeeperCountdown } from './path/to/timekeeper-countdown/dist/index.js'
        
        // Your countdown logic here
    </script>
</body>
</html>
```

### Basic Implementation

```javascript
// Import the library
import { TimekeeperCountdown } from 'timekeeper-countdown'

// DOM elements
const timeDisplay = document.getElementById('time-display')
const stateDisplay = document.getElementById('state-display')
const startBtn = document.getElementById('start-btn')
const pauseBtn = document.getElementById('pause-btn')
const resumeBtn = document.getElementById('resume-btn')
const resetBtn = document.getElementById('reset-btn')
const restartBtn = document.getElementById('restart-btn')

// Helper function to format time
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Update display function
function updateDisplay(data) {
    timeDisplay.textContent = formatTime(data.totalSeconds)
    stateDisplay.textContent = data.state
    updateButtons(data.state)
}

// Update button states
function updateButtons(state) {
    startBtn.disabled = state === 'RUNNING'
    pauseBtn.disabled = state !== 'RUNNING'
    resumeBtn.disabled = state !== 'PAUSED'
    resetBtn.disabled = state === 'RUNNING'
    restartBtn.disabled = state === 'IDLE'
}

// Create countdown instance
const countdown = new TimekeeperCountdown(300, { // 5 minutes
    onTick: (data) => {
        updateDisplay(data)
    },
    onStart: (data) => {
        updateDisplay(data)
        console.log('Countdown started!')
    },
    onPause: (data) => {
        updateDisplay(data)
        console.log('Countdown paused')
    },
    onResume: (data) => {
        updateDisplay(data)
        console.log('Countdown resumed')
    },
    onReset: (data) => {
        updateDisplay(data)
        console.log('Countdown reset')
    },
    onRestart: (data) => {
        updateDisplay(data)
        console.log('Countdown restarted')
    },
    onComplete: (data) => {
        updateDisplay(data)
        alert('Time\'s up! 🎉')
    }
})

// Initialize display
updateDisplay({
    totalSeconds: countdown.totalSeconds,
    state: countdown.state
})

// Event listeners
startBtn.addEventListener('click', () => countdown.start())
pauseBtn.addEventListener('click', () => countdown.pause())
resumeBtn.addEventListener('click', () => countdown.resume())
resetBtn.addEventListener('click', () => countdown.reset())
restartBtn.addEventListener('click', () => countdown.restart())

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    countdown.destroy()
})
```

## Advanced Examples

### Multiple Countdowns

```html
<div class="countdown-grid">
    <div class="countdown" data-timer="timer1">
        <h3>Timer 1 (5 min)</h3>
        <div class="time-display">05:00</div>
        <div class="controls">
            <button class="start-btn">Start</button>
            <button class="pause-btn">Pause</button>
            <button class="reset-btn">Reset</button>
        </div>
    </div>
    
    <div class="countdown" data-timer="timer2">
        <h3>Timer 2 (10 min)</h3>
        <div class="time-display">10:00</div>
        <div class="controls">
            <button class="start-btn">Start</button>
            <button class="pause-btn">Pause</button>
            <button class="reset-btn">Reset</button>
        </div>
    </div>
</div>
```

```javascript
class CountdownManager {
    constructor() {
        this.timers = new Map()
        this.init()
    }

    init() {
        // Initialize all countdown containers
        document.querySelectorAll('.countdown').forEach(container => {
            const timerId = container.dataset.timer
            const initialTime = this.getInitialTime(timerId)
            
            const countdown = new TimekeeperCountdown(initialTime, {
                onTick: (data) => this.updateDisplay(container, data),
                onStart: (data) => this.updateDisplay(container, data),
                onPause: (data) => this.updateDisplay(container, data),
                onReset: (data) => this.updateDisplay(container, data),
                onComplete: (data) => {
                    this.updateDisplay(container, data)
                    this.onTimerComplete(timerId)
                }
            })

            this.timers.set(timerId, countdown)
            this.setupEventListeners(container, countdown)
            
            // Initialize display
            this.updateDisplay(container, {
                totalSeconds: countdown.totalSeconds,
                state: countdown.state
            })
        })
    }

    getInitialTime(timerId) {
        const times = {
            'timer1': 300,  // 5 minutes
            'timer2': 600   // 10 minutes
        }
        return times[timerId] || 300
    }

    updateDisplay(container, data) {
        const timeDisplay = container.querySelector('.time-display')
        timeDisplay.textContent = this.formatTime(data.totalSeconds)
        
        const startBtn = container.querySelector('.start-btn')
        const pauseBtn = container.querySelector('.pause-btn')
        const resetBtn = container.querySelector('.reset-btn')
        
        startBtn.disabled = data.state === 'RUNNING'
        pauseBtn.disabled = data.state !== 'RUNNING'
        resetBtn.disabled = data.state === 'RUNNING'
    }

    setupEventListeners(container, countdown) {
        container.querySelector('.start-btn').addEventListener('click', () => {
            countdown.start()
        })
        
        container.querySelector('.pause-btn').addEventListener('click', () => {
            countdown.pause()
        })
        
        container.querySelector('.reset-btn').addEventListener('click', () => {
            countdown.reset()
        })
    }

    formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    onTimerComplete(timerId) {
        console.log(`Timer ${timerId} completed!`)
        // Send notification, play sound, etc.
    }

    destroy() {
        this.timers.forEach(countdown => countdown.destroy())
        this.timers.clear()
    }
}

// Initialize the countdown manager
const manager = new CountdownManager()

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    manager.destroy()
})
```

### Styled Countdown with CSS

```html
<div class="modern-countdown">
    <div class="countdown-circle">
        <svg class="progress-ring" width="200" height="200">
            <circle class="progress-ring-circle" 
                    cx="100" cy="100" r="90"
                    stroke="#e2e8f0" 
                    stroke-width="8" 
                    fill="transparent"/>
            <circle class="progress-ring-progress" 
                    cx="100" cy="100" r="90"
                    stroke="#3b82f6" 
                    stroke-width="8" 
                    fill="transparent"
                    stroke-dasharray="565.48"
                    stroke-dashoffset="565.48"/>
        </svg>
        <div class="countdown-text">
            <div class="time-display">05:00</div>
            <div class="state-display">IDLE</div>
        </div>
    </div>
    
    <div class="countdown-controls">
        <button class="btn btn-primary" id="start-btn">Start</button>
        <button class="btn btn-warning" id="pause-btn">Pause</button>
        <button class="btn btn-success" id="resume-btn">Resume</button>
        <button class="btn btn-secondary" id="reset-btn">Reset</button>
    </div>
</div>
```

```css
.modern-countdown {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    color: white;
    max-width: 400px;
    margin: 2rem auto;
}

.countdown-circle {
    position: relative;
    margin-bottom: 2rem;
}

.progress-ring {
    transform: rotate(-90deg);
}

.progress-ring-progress {
    transition: stroke-dashoffset 0.5s ease-in-out;
}

.countdown-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

.time-display {
    font-size: 2rem;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    margin-bottom: 0.5rem;
}

.state-display {
    font-size: 0.875rem;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 0.1em;
}

.countdown-controls {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary { background: #3b82f6; color: white; }
.btn-warning { background: #f59e0b; color: white; }
.btn-success { background: #10b981; color: white; }
.btn-secondary { background: #6b7280; color: white; }

.btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
```

```javascript
import { TimekeeperCountdown } from 'timekeeper-countdown'

class ModernCountdown {
    constructor(containerId, initialSeconds = 300) {
        this.container = document.getElementById(containerId)
        this.initialSeconds = initialSeconds
        this.progressCircle = this.container.querySelector('.progress-ring-progress')
        this.timeDisplay = this.container.querySelector('.time-display')
        this.stateDisplay = this.container.querySelector('.state-display')
        
        // Calculate circle circumference for progress animation
        this.circumference = 2 * Math.PI * 90 // radius = 90
        
        this.init()
    }

    init() {
        this.countdown = new TimekeeperCountdown(this.initialSeconds, {
            onTick: (data) => this.updateDisplay(data),
            onStart: (data) => this.updateDisplay(data),
            onPause: (data) => this.updateDisplay(data),
            onResume: (data) => this.updateDisplay(data),
            onReset: (data) => this.updateDisplay(data),
            onComplete: (data) => {
                this.updateDisplay(data)
                this.showCompletionAnimation()
            }
        })

        this.setupEventListeners()
        this.updateDisplay({
            totalSeconds: this.countdown.totalSeconds,
            state: this.countdown.state
        })
    }

    updateDisplay(data) {
        // Update time display
        this.timeDisplay.textContent = this.formatTime(data.totalSeconds)
        this.stateDisplay.textContent = data.state

        // Update progress circle
        const progress = data.totalSeconds / this.initialSeconds
        const offset = this.circumference * (1 - progress)
        this.progressCircle.style.strokeDashoffset = offset

        // Update button states
        this.updateButtons(data.state)
    }

    updateButtons(state) {
        const buttons = {
            start: this.container.querySelector('#start-btn'),
            pause: this.container.querySelector('#pause-btn'),
            resume: this.container.querySelector('#resume-btn'),
            reset: this.container.querySelector('#reset-btn')
        }

        buttons.start.disabled = state === 'RUNNING'
        buttons.pause.disabled = state !== 'RUNNING'
        buttons.resume.disabled = state !== 'PAUSED'
        buttons.reset.disabled = state === 'RUNNING'
    }

    setupEventListeners() {
        this.container.querySelector('#start-btn').addEventListener('click', () => {
            this.countdown.start()
        })

        this.container.querySelector('#pause-btn').addEventListener('click', () => {
            this.countdown.pause()
        })

        this.container.querySelector('#resume-btn').addEventListener('click', () => {
            this.countdown.resume()
        })

        this.container.querySelector('#reset-btn').addEventListener('click', () => {
            this.countdown.reset()
        })
    }

    formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    showCompletionAnimation() {
        // Add completion animation
        this.container.style.animation = 'pulse 1s ease-in-out 3'
        
        // Reset animation after completion
        setTimeout(() => {
            this.container.style.animation = ''
        }, 3000)
    }

    destroy() {
        this.countdown.destroy()
    }
}

// Usage
const modernTimer = new ModernCountdown('modern-countdown-container', 300)

// Cleanup
window.addEventListener('beforeunload', () => {
    modernTimer.destroy()
})
```

## Integration Patterns

### Utility Helper

```javascript
// countdown-utils.js
export class CountdownUtils {
    static formatTime(totalSeconds, format = 'mm:ss') {
        const days = Math.floor(totalSeconds / 86400)
        const hours = Math.floor((totalSeconds % 86400) / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        const formats = {
            'mm:ss': `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
            'hh:mm:ss': `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
            'dd:hh:mm:ss': `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
            'human': this.humanReadable(days, hours, minutes, seconds)
        }

        return formats[format] || formats['mm:ss']
    }

    static humanReadable(days, hours, minutes, seconds) {
        const parts = []
        if (days > 0) parts.push(`${days}d`)
        if (hours > 0) parts.push(`${hours}h`)
        if (minutes > 0) parts.push(`${minutes}m`)
        if (seconds > 0) parts.push(`${seconds}s`)
        return parts.join(' ') || '0s'
    }

    static parseTimeString(timeStr) {
        // Parse strings like "5:30", "1:30:45", "2d 3h 30m"
        if (timeStr.includes(':')) {
            const parts = timeStr.split(':').map(Number)
            if (parts.length === 2) {
                return parts[0] * 60 + parts[1] // mm:ss
            } else if (parts.length === 3) {
                return parts[0] * 3600 + parts[1] * 60 + parts[2] // hh:mm:ss
            }
        }
        
        // Handle human readable format
        const dayMatch = timeStr.match(/(\d+)d/)
        const hourMatch = timeStr.match(/(\d+)h/)
        const minMatch = timeStr.match(/(\d+)m/)
        const secMatch = timeStr.match(/(\d+)s/)
        
        return (dayMatch ? parseInt(dayMatch[1]) * 86400 : 0) +
               (hourMatch ? parseInt(hourMatch[1]) * 3600 : 0) +
               (minMatch ? parseInt(minMatch[1]) * 60 : 0) +
               (secMatch ? parseInt(secMatch[1]) : 0)
    }

    static createCountdownFromInput(inputElement, options = {}) {
        const value = inputElement.value
        const seconds = this.parseTimeString(value) || 300
        
        return new TimekeeperCountdown(seconds, options)
    }
}
```

### Event System

```javascript
// countdown-events.js
export class CountdownEventBus {
    constructor() {
        this.events = new Map()
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, [])
        }
        this.events.get(event).push(callback)
    }

    off(event, callback) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event)
            const index = callbacks.indexOf(callback)
            if (index > -1) {
                callbacks.splice(index, 1)
            }
        }
    }

    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                callback(data)
            })
        }
    }
}

// Usage
const eventBus = new CountdownEventBus()

const countdown = new TimekeeperCountdown(300, {
    onTick: (data) => eventBus.emit('tick', data),
    onComplete: (data) => eventBus.emit('complete', data)
})

// Listen to events
eventBus.on('tick', (data) => {
    console.log(`${data.totalSeconds} seconds remaining`)
})

eventBus.on('complete', () => {
    console.log('Timer completed!')
    // Send notification, update UI, etc.
})
```

## Best Practices

1. **Memory Management**: Always call `destroy()` when the countdown is no longer needed
2. **Error Handling**: Wrap countdown operations in try-catch blocks
3. **Performance**: Avoid creating multiple countdown instances unnecessarily
4. **Accessibility**: Include proper ARIA labels and keyboard navigation
5. **Mobile Support**: Ensure touch-friendly button sizes and responsive design

## Common Patterns

### Auto-start on Page Load

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const countdown = new TimekeeperCountdown(300, { autoStart: true })
    // Setup UI updates...
})
```

### Save State to localStorage

```javascript
const countdown = new TimekeeperCountdown(300, {
    onTick: (data) => {
        localStorage.setItem('countdown-state', JSON.stringify({
            totalSeconds: data.totalSeconds,
            state: data.state
        }))
    }
})

// Restore state on page load
const savedState = localStorage.getItem('countdown-state')
if (savedState) {
    const { totalSeconds } = JSON.parse(savedState)
    countdown.reset(totalSeconds)
}
```

### Keyboard Shortcuts

```javascript
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return // Don't interfere with inputs
    
    switch (e.key) {
        case ' ': // Spacebar
            e.preventDefault()
            if (countdown.state === 'RUNNING') {
                countdown.pause()
            } else if (countdown.state === 'PAUSED') {
                countdown.resume()
            } else {
                countdown.start()
            }
            break
        case 'r':
            countdown.reset()
            break
        case 'Escape':
            countdown.pause()
            break
    }
})
```