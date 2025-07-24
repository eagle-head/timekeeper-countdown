declare module 'vue' {
  export interface Ref<T> {
    value: T
  }
  export function ref<T>(value: T): Ref<T>
  export function onUnmounted(fn: () => void): void
  export function watch(source: any, callback: () => void): void
}