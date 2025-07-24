import type { CountdownEventType, CountdownEventListener } from './types'

export class EventEmitter {
  private listeners: Map<CountdownEventType, Set<CountdownEventListener>> = new Map()

  on(event: CountdownEventType, listener: CountdownEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
  }

  off(event: CountdownEventType, listener: CountdownEventListener): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(listener)
      if (eventListeners.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  emit(event: CountdownEventType, data: Parameters<CountdownEventListener>[0]): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`Error in countdown event listener for ${event}:`, error)
        }
      })
    }
  }

  removeAllListeners(event?: CountdownEventType): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  listenerCount(event: CountdownEventType): number {
    return this.listeners.get(event)?.size ?? 0
  }

  hasListeners(event: CountdownEventType): boolean {
    return this.listenerCount(event) > 0
  }
}