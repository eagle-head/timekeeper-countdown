declare module '@angular/core' {
  export function Injectable(): ClassDecorator
  export interface OnDestroy {
    ngOnDestroy(): void
  }
}

declare module 'rxjs' {
  export class BehaviorSubject<T> {
    constructor(initialValue: T)
    next(value: T): void
    complete(): void
    get value(): T
    asObservable(): Observable<T>
  }
  
  export class Observable<T> {
    // Basic observable interface
  }
}