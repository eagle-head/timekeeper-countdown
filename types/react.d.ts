declare module 'react' {
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void
  export function useRef<T>(initialValue: T): { current: T }
  export function useState<T>(initialValue: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void]
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T
}