# Angular Integration Guide

Learn how to integrate `timekeeper-countdown` with Angular applications using Services, RxJS, and modern Angular patterns.

## Quick Start

### Basic Service Implementation

Create a countdown service:

```typescript
// services/timekeeper.service.ts
import { Injectable, OnDestroy } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { TimekeeperCountdown } from 'timekeeper-countdown'
import type { 
  CountdownTime, 
  CountdownStateType, 
  TimekeeperCountdownOptions 
} from 'timekeeper-countdown'

export interface TimekeeperState extends CountdownTime {
  state: CountdownStateType
}

@Injectable({
  providedIn: 'root'
})
export class TimekeeperService implements OnDestroy {
  private countdown: TimekeeperCountdown | null = null
  private stateSubject = new BehaviorSubject<TimekeeperState>({
    totalSeconds: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    state: 'IDLE' as CountdownStateType,
  })

  public readonly state$: Observable<TimekeeperState> = this.stateSubject.asObservable()

  initialize(
    initialSeconds: number,
    options: Omit<TimekeeperCountdownOptions, 'onTick' | 'onStart' | 'onPause' | 'onResume' | 'onReset' | 'onRestart' | 'onComplete'> & {
      onTick?: (data: CountdownTime & { state: CountdownStateType }) => void
      onStart?: (data: CountdownTime & { state: CountdownStateType }) => void
      onPause?: (data: CountdownTime & { state: CountdownStateType }) => void
      onResume?: (data: CountdownTime & { state: CountdownStateType }) => void
      onReset?: (data: CountdownTime & { state: CountdownStateType }) => void
      onRestart?: (data: CountdownTime & { state: CountdownStateType }) => void
      onComplete?: (data: CountdownTime & { state: CountdownStateType }) => void
    } = {}
  ): void {
    // Clean up existing countdown
    if (this.countdown) {
      this.countdown.destroy()
    }

    this.countdown = new TimekeeperCountdown(initialSeconds, {
      ...options,
      onTick: (data) => {
        this.updateState(data)
        options.onTick?.(data)
      },
      onStart: (data) => {
        this.updateState({ ...this.stateSubject.value, state: data.state })
        options.onStart?.(data)
      },
      onPause: (data) => {
        this.updateState({ ...this.stateSubject.value, state: data.state })
        options.onPause?.(data)
      },
      onResume: (data) => {
        this.updateState({ ...this.stateSubject.value, state: data.state })
        options.onResume?.(data)
      },
      onReset: (data) => {
        this.updateState(data)
        options.onReset?.(data)
      },
      onRestart: (data) => {
        this.updateState(data)
        options.onRestart?.(data)
      },
      onComplete: (data) => {
        this.updateState({ ...this.stateSubject.value, state: data.state })
        options.onComplete?.(data)
      },
    })

    // Initialize state
    this.updateState({
      totalSeconds: this.countdown.totalSeconds,
      days: this.countdown.days,
      hours: this.countdown.hours,
      minutes: this.countdown.minutes,
      seconds: this.countdown.seconds,
      state: this.countdown.state,
    })
  }

  start(): boolean {
    return this.countdown?.start() ?? false
  }

  pause(): boolean {
    return this.countdown?.pause() ?? false
  }

  resume(): boolean {
    return this.countdown?.resume() ?? false
  }

  reset(newSeconds?: number): boolean {
    return this.countdown?.reset(newSeconds) ?? false
  }

  restart(newSeconds?: number): boolean {
    return this.countdown?.restart(newSeconds) ?? false
  }

  getCurrentState(): TimekeeperState {
    return this.stateSubject.value
  }

  ngOnDestroy(): void {
    this.countdown?.destroy()
    this.stateSubject.complete()
  }

  private updateState(data: TimekeeperState): void {
    this.stateSubject.next(data)
  }
}

// Factory function for scoped instances
export function createTimekeeperService(
  initialSeconds: number,
  options?: Parameters<TimekeeperService['initialize']>[1]
): TimekeeperService {
  const service = new TimekeeperService()
  service.initialize(initialSeconds, options)
  return service
}
```

## Usage Examples

### Basic Component

```typescript
// components/countdown-timer.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core'
import { Observable } from 'rxjs'
import { TimekeeperService, TimekeeperState } from '../services/timekeeper.service'

@Component({
  selector: 'app-countdown-timer',
  template: `
    <div class="countdown-timer">
      <h1>⏳ Countdown Timer</h1>
      
      <div class="time-display" *ngIf="state$ | async as state">
        {{ formatTime(state.totalSeconds) }}
      </div>
      
      <div class="state-display" *ngIf="state$ | async as state">
        Status: {{ state.state }}
      </div>
      
      <div class="controls" *ngIf="state$ | async as state">
        <button 
          (click)="start()" 
          [disabled]="state.state === 'RUNNING'"
          class="btn btn-primary"
        >
          Start
        </button>
        
        <button 
          (click)="pause()" 
          [disabled]="state.state !== 'RUNNING'"
          class="btn btn-warning"  
        >
          Pause
        </button>
        
        <button 
          (click)="resume()" 
          [disabled]="state.state !== 'PAUSED'"
          class="btn btn-success"
        >
          Resume
        </button>
        
        <button 
          (click)="reset()" 
          [disabled]="state.state === 'RUNNING'"
          class="btn btn-secondary"
        >
          Reset
        </button>
        
        <button 
          (click)="restart()" 
          [disabled]="state.state === 'IDLE'"
          class="btn btn-info"
        >
          Restart
        </button>
      </div>
      
      <div class="time-breakdown" *ngIf="state$ | async as state">
        <span class="time-unit">{{ state.days }}d</span>
        <span class="time-unit">{{ state.hours }}h</span>
        <span class="time-unit">{{ state.minutes }}m</span>
        <span class="time-unit">{{ state.seconds }}s</span>
      </div>
    </div>
  `,
  styles: [`
    .countdown-timer {
      text-align: center;
      padding: 2rem;
      font-family: Arial, sans-serif;
    }
    
    .time-display {
      font-size: 3rem;
      font-weight: bold;
      font-family: 'Courier New', monospace;
      margin: 1rem 0;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 10px;
    }
    
    .state-display {
      font-size: 1.2rem;
      margin: 1rem 0;
      padding: 0.5rem 1rem;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 20px;
      display: inline-block;
    }
    
    .controls {
      margin: 1.5rem 0;
    }
    
    .btn {
      margin: 0.25rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 5px;
      font-size: 1rem;
      cursor: pointer;
      color: white;
      transition: all 0.3s ease;
    }
    
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .btn-primary { background: #007bff; }
    .btn-warning { background: #ffc107; color: black; }
    .btn-success { background: #28a745; }
    .btn-secondary { background: #6c757d; }
    .btn-info { background: #17a2b8; }
    
    .time-breakdown {
      margin-top: 1rem;
    }
    
    .time-unit {
      margin: 0 0.5rem;
      font-size: 1.1rem;
      font-weight: bold;
    }
  `],
  providers: [TimekeeperService] // Provide a scoped instance
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  @Input() initialSeconds: number = 300
  
  state$: Observable<TimekeeperState>

  constructor(private timekeeperService: TimekeeperService) {
    this.state$ = this.timekeeperService.state$
  }

  ngOnInit(): void {
    this.timekeeperService.initialize(this.initialSeconds, {
      onComplete: () => {
        alert('Time\'s up! 🎉')
      },
      onTick: (data) => {
        if (data.totalSeconds <= 10 && data.totalSeconds > 0) {
          console.warn(`⚠️ Only ${data.totalSeconds} seconds left!`)
        }
      }
    })
  }

  ngOnDestroy(): void {
    this.timekeeperService.ngOnDestroy()
  }

  start(): void {
    this.timekeeperService.start()
  }

  pause(): void {
    this.timekeeperService.pause()
  }

  resume(): void {
    this.timekeeperService.resume()
  }

  reset(): void {
    this.timekeeperService.reset()
  }

  restart(): void {
    this.timekeeperService.restart()
  }

  formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
}
```

### Advanced Component with RxJS Operators

```typescript
// components/advanced-countdown.component.ts
import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core'
import { Observable, combineLatest, map, startWith, distinctUntilChanged } from 'rxjs'
import { TimekeeperService, TimekeeperState } from '../services/timekeeper.service'

interface CountdownViewModel {
  state: TimekeeperState
  formattedTime: string
  progress: number
  isWarning: boolean
  canStart: boolean
  canPause: boolean
  canResume: boolean
  canReset: boolean
  canRestart: boolean
}

@Component({
  selector: 'app-advanced-countdown',
  template: `
    <div class="advanced-countdown" *ngIf="viewModel$ | async as vm">
      <div class="countdown-header">
        <h2>{{ title }}</h2>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            [style.width.%]="vm.progress"
            [class.warning]="vm.isWarning"
          ></div>
        </div>
      </div>
      
      <div class="time-display" [class.warning]="vm.isWarning">
        <div class="time-segments">
          <div class="time-segment" *ngIf="vm.state.days > 0">
            <span class="number">{{ vm.state.days }}</span>
            <span class="label">DAYS</span>
          </div>
          <div class="time-segment">
            <span class="number">{{ vm.state.hours.toString().padStart(2, '0') }}</span>
            <span class="label">HOURS</span>
          </div>
          <div class="time-segment">
            <span class="number">{{ vm.state.minutes.toString().padStart(2, '0') }}</span>
            <span class="label">MINUTES</span>
          </div>
          <div class="time-segment">
            <span class="number">{{ vm.state.seconds.toString().padStart(2, '0') }}</span>
            <span class="label">SECONDS</span>
          </div>
        </div>
      </div>
      
      <div class="state-indicator" [attr.data-state]="vm.state.state">
        {{ vm.state.state }}
      </div>
      
      <div class="controls">
        <button 
          *ngIf="vm.canStart"
          (click)="start()" 
          class="control-btn start-btn"
          [attr.aria-label]="'Start countdown'"
        >
          <i class="icon-play"></i> Start
        </button>
        
        <button 
          *ngIf="vm.canPause"
          (click)="pause()" 
          class="control-btn pause-btn"
          [attr.aria-label]="'Pause countdown'"
        >
          <i class="icon-pause"></i> Pause
        </button>
        
        <button 
          *ngIf="vm.canResume"
          (click)="resume()" 
          class="control-btn resume-btn"
          [attr.aria-label]="'Resume countdown'"
        >
          <i class="icon-play"></i> Resume
        </button>
        
        <button 
          *ngIf="vm.canReset"
          (click)="reset()" 
          class="control-btn reset-btn"
          [attr.aria-label]="'Reset countdown'"
        >
          <i class="icon-refresh"></i> Reset
        </button>
        
        <button 
          *ngIf="vm.canRestart"
          (click)="restart()" 
          class="control-btn restart-btn"
          [attr.aria-label]="'Restart countdown'"
        >
          <i class="icon-repeat"></i> Restart
        </button>
      </div>
      
      <div class="quick-actions">
        <button 
          (click)="reset(60)" 
          [disabled]="vm.state.state === 'RUNNING'"
          class="quick-btn"
        >
          1 Min
        </button>
        <button 
          (click)="reset(300)" 
          [disabled]="vm.state.state === 'RUNNING'"
          class="quick-btn"
        >
          5 Min
        </button>
        <button 
          (click)="reset(600)" 
          [disabled]="vm.state.state === 'RUNNING'"
          class="quick-btn"
        >
          10 Min
        </button>
      </div>
    </div>
  `,
  styles: [`
    .advanced-countdown {
      max-width: 500px;
      margin: 0 auto;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 15px;
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .countdown-header h2 {
      margin: 0 0 1rem 0;
      text-align: center;
    }
    
    .progress-bar {
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 2rem;
    }
    
    .progress-fill {
      height: 100%;
      background: #28a745;
      transition: width 1s ease-in-out, background-color 0.3s ease;
    }
    
    .progress-fill.warning {
      background: #ffc107;
    }
    
    .time-display {
      text-align: center;
      margin: 2rem 0;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      transition: all 0.3s ease;
    }
    
    .time-display.warning {
      animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    .time-segments {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    
    .time-segment {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;
    }
    
    .number {
      font-size: 2.5rem;
      font-weight: bold;
      font-family: 'Courier New', monospace;
      line-height: 1;
    }
    
    .label {
      font-size: 0.7rem;
      opacity: 0.8;
      margin-top: 0.25rem;
      letter-spacing: 1px;
    }
    
    .state-indicator {
      text-align: center;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: bold;
      font-size: 0.9rem;
      letter-spacing: 1px;
      margin: 1rem 0;
    }
    
    .state-indicator[data-state="IDLE"] { background: #6c757d; }
    .state-indicator[data-state="RUNNING"] { background: #28a745; }
    .state-indicator[data-state="PAUSED"] { background: #ffc107; color: black; }
    .state-indicator[data-state="COMPLETED"] { background: #dc3545; }
    
    .controls {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin: 1.5rem 0;
      flex-wrap: wrap;
    }
    
    .control-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .control-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .start-btn, .resume-btn { background: #28a745; color: white; }
    .pause-btn { background: #ffc107; color: black; }
    .reset-btn { background: #6c757d; color: white; }
    .restart-btn { background: #17a2b8; color: white; }
    
    .quick-actions {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    
    .quick-btn {
      padding: 0.5rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }
    
    .quick-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .quick-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TimekeeperService]
})
export class AdvancedCountdownComponent implements OnInit, OnDestroy {
  @Input() initialSeconds: number = 300
  @Input() title: string = 'Advanced Countdown'
  @Input() warningThreshold: number = 10

  viewModel$: Observable<CountdownViewModel>

  constructor(private timekeeperService: TimekeeperService) {
    this.viewModel$ = this.createViewModel()
  }

  ngOnInit(): void {
    this.timekeeperService.initialize(this.initialSeconds, {
      onComplete: () => {
        // Could emit to parent component or show notification
        console.log('Countdown completed!')
      }
    })
  }

  ngOnDestroy(): void {
    this.timekeeperService.ngOnDestroy()
  }

  private createViewModel(): Observable<CountdownViewModel> {
    return this.timekeeperService.state$.pipe(
      map(state => ({
        state,
        formattedTime: this.formatTime(state.totalSeconds),
        progress: this.calculateProgress(state.totalSeconds),
        isWarning: state.totalSeconds <= this.warningThreshold && state.totalSeconds > 0,
        canStart: state.state === 'IDLE',
        canPause: state.state === 'RUNNING',
        canResume: state.state === 'PAUSED',
        canReset: state.state !== 'RUNNING',
        canRestart: state.state !== 'IDLE'
      })),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    )
  }

  private formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  private calculateProgress(currentSeconds: number): number {
    return ((this.initialSeconds - currentSeconds) / this.initialSeconds) * 100
  }

  start(): void {
    this.timekeeperService.start()
  }

  pause(): void {
    this.timekeeperService.pause()
  }

  resume(): void {
    this.timekeeperService.resume()
  }

  reset(seconds?: number): void {
    this.timekeeperService.reset(seconds)
  }

  restart(): void {
    this.timekeeperService.restart()
  }
}
```

## Integration Patterns

### Multiple Timers with State Management

```typescript
// services/multi-timer.service.ts
import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable, combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'
import { TimekeeperService, TimekeeperState } from './timekeeper.service'

export interface TimerConfig {
  id: string
  label: string
  initialSeconds: number
}

export interface MultiTimerState {
  timers: Record<string, TimekeeperState>
  activeCount: number
  allCompleted: boolean
}

@Injectable({
  providedIn: 'root'
})
export class MultiTimerService {
  private timers: Record<string, TimekeeperService> = {}
  private configsSubject = new BehaviorSubject<TimerConfig[]>([])
  
  public readonly multiState$: Observable<MultiTimerState>

  constructor() {
    this.multiState$ = this.createMultiState()
  }

  initializeTimers(configs: TimerConfig[]): void {
    // Clean up existing timers
    Object.values(this.timers).forEach(timer => timer.ngOnDestroy())
    this.timers = {}

    // Create new timers
    configs.forEach(config => {
      const service = new TimekeeperService()
      service.initialize(config.initialSeconds)
      this.timers[config.id] = service
    })

    this.configsSubject.next(configs)
  }

  getTimer(id: string): TimekeeperService | undefined {
    return this.timers[id]
  }

  startAll(): void {
    Object.values(this.timers).forEach(timer => timer.start())
  }

  pauseAll(): void {
    Object.values(this.timers).forEach(timer => timer.pause())
  }

  resetAll(): void {
    Object.values(this.timers).forEach(timer => timer.reset())
  }

  private createMultiState(): Observable<MultiTimerState> {
    return this.configsSubject.pipe(
      map(configs => {
        if (configs.length === 0) {
          return { timers: {}, activeCount: 0, allCompleted: false }
        }

        const timerObservables = configs.map(config => 
          this.timers[config.id]?.state$ || new BehaviorSubject({
            totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0, state: 'IDLE' as const
          })
        )

        return combineLatest(timerObservables).pipe(
          map(states => {
            const timers: Record<string, TimekeeperState> = {}
            let activeCount = 0
            let completedCount = 0

            configs.forEach((config, index) => {
              timers[config.id] = states[index]
              if (states[index].state === 'RUNNING') activeCount++
              if (states[index].state === 'COMPLETED') completedCount++
            })

            return {
              timers,
              activeCount,
              allCompleted: completedCount === configs.length && configs.length > 0
            }
          })
        )
      })
    ).pipe(
      // Flatten the nested observable
      map(obs => obs || { timers: {}, activeCount: 0, allCompleted: false })
    ) as Observable<MultiTimerState>
  }
}
```

### Directive for Inline Timers

```typescript
// directives/countdown.directive.ts
import { Directive, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef } from '@angular/core'
import { TimekeeperCountdown } from 'timekeeper-countdown'
import type { CountdownTime, CountdownStateType } from 'timekeeper-countdown'

@Directive({
  selector: '[appCountdown]'
})
export class CountdownDirective implements OnInit, OnDestroy {
  @Input('appCountdown') initialSeconds: number = 0
  @Input() format: 'short' | 'long' = 'short'
  @Input() autoStart: boolean = false

  @Output() tick = new EventEmitter<CountdownTime & { state: CountdownStateType }>()
  @Output() complete = new EventEmitter<void>()
  @Output() stateChange = new EventEmitter<CountdownStateType>()

  private countdown: TimekeeperCountdown | null = null

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    if (this.initialSeconds > 0) {
      this.initializeCountdown()
    }
  }

  ngOnDestroy(): void {
    this.countdown?.destroy()
  }

  private initializeCountdown(): void {
    this.countdown = new TimekeeperCountdown(this.initialSeconds, {
      autoStart: this.autoStart,
      onTick: (data) => {
        this.updateElement(data)
        this.tick.emit(data)
      },
      onStart: (data) => this.stateChange.emit(data.state),
      onPause: (data) => this.stateChange.emit(data.state),
      onResume: (data) => this.stateChange.emit(data.state),
      onReset: (data) => {
        this.updateElement(data)
        this.stateChange.emit(data.state)
      },
      onComplete: (data) => {
        this.updateElement(data)
        this.complete.emit()
        this.stateChange.emit(data.state)
      }
    })

    // Initial update
    this.updateElement({
      totalSeconds: this.countdown.totalSeconds,
      days: this.countdown.days,
      hours: this.countdown.hours,
      minutes: this.countdown.minutes,
      seconds: this.countdown.seconds,
      state: this.countdown.state
    })
  }

  private updateElement(data: CountdownTime & { state: CountdownStateType }): void {
    const formatted = this.format === 'short' 
      ? this.formatShort(data.totalSeconds)
      : this.formatLong(data)

    this.elementRef.nativeElement.textContent = formatted
    this.elementRef.nativeElement.setAttribute('data-state', data.state)
  }

  private formatShort(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  private formatLong(data: CountdownTime): string {
    const parts: string[] = []
    if (data.days > 0) parts.push(`${data.days}d`)
    if (data.hours > 0) parts.push(`${data.hours}h`)
    if (data.minutes > 0) parts.push(`${data.minutes}m`)
    parts.push(`${data.seconds}s`)
    return parts.join(' ')
  }

  // Public methods for template access
  start(): boolean {
    return this.countdown?.start() ?? false
  }

  pause(): boolean {
    return this.countdown?.pause() ?? false
  }

  reset(): boolean {
    return this.countdown?.reset() ?? false
  }
}
```

Usage:
```html
<span 
  appCountdown="300" 
  format="short"
  [autoStart]="true"
  (complete)="onTimerComplete()"
  (tick)="onTimerTick($event)"
>
</span>
```

## Testing

```typescript
// services/timekeeper.service.spec.ts
import { TestBed } from '@angular/core/testing'
import { TimekeeperService } from './timekeeper.service'

describe('TimekeeperService', () => {
  let service: TimekeeperService
  
  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(TimekeeperService)
    jasmine.clock().install()
  })

  afterEach(() => {
    jasmine.clock().uninstall()
    service.ngOnDestroy()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should initialize with correct state', () => {
    service.initialize(60)
    const state = service.getCurrentState()
    
    expect(state.totalSeconds).toBe(60)
    expect(state.state).toBe('IDLE')
  })

  it('should start and tick correctly', (done) => {
    service.initialize(5)
    
    service.state$.subscribe(state => {
      if (state.state === 'RUNNING' && state.totalSeconds === 4) {
        expect(state.totalSeconds).toBe(4)
        done()
      }
    })

    service.start()
    jasmine.clock().tick(1000)
  })

  it('should complete when reaching zero', (done) => {
    service.initialize(1)
    
    service.state$.subscribe(state => {
      if (state.state === 'COMPLETED') {
        expect(state.totalSeconds).toBe(0)
        done()
      }
    })

    service.start()
    jasmine.clock().tick(1000)
  })
})
```

## Best Practices

1. **Service Scope**: Use providedIn: 'root' for global timers, component-level providers for scoped instances
2. **Memory Management**: Always call ngOnDestroy to clean up countdown instances
3. **RxJS Patterns**: Use operators like distinctUntilChanged to optimize change detection
4. **Change Detection**: Consider OnPush strategy for performance-sensitive components
5. **Error Handling**: Wrap countdown operations in try-catch blocks
6. **Accessibility**: Add proper ARIA labels and keyboard navigation support
7. **Testing**: Use Jasmine's clock utilities for testing time-based functionality

## Module Setup

```typescript
// countdown.module.ts
import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CountdownTimerComponent } from './components/countdown-timer.component'
import { AdvancedCountdownComponent } from './components/advanced-countdown.component'
import { CountdownDirective } from './directives/countdown.directive'
import { TimekeeperService } from './services/timekeeper.service'
import { MultiTimerService } from './services/multi-timer.service'

@NgModule({
  declarations: [
    CountdownTimerComponent,
    AdvancedCountdownComponent,
    CountdownDirective
  ],
  imports: [
    CommonModule
  ],
  providers: [
    TimekeeperService,
    MultiTimerService
  ],
  exports: [
    CountdownTimerComponent,
    AdvancedCountdownComponent,
    CountdownDirective
  ]
})
export class CountdownModule { }
```