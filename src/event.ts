// Browser may require https://www.npmjs.com/package/events
import { Outcome } from './result';
import { TestType } from './test';

/**
 * Event for 'start' listeners.
 */

export interface PlyEvent {
    /**
     * Unique test/suite path
     */
    plyee: string;
}

/**
 * Event for 'outcome' listeners.
 */
export interface OutcomeEvent extends PlyEvent {
    outcome: Outcome;
}

export interface SuiteEvent extends PlyEvent {
    type: TestType;
    status: 'Started' | 'Finished';
}

export type PlyEventListener = (e: PlyEvent) => void;

export interface Listener<T> {
    (event: T): any;
}

export interface Disposable {
    dispose(): void;
}

export class TypedEvent<T> {
    private listeners: Listener<T>[] = [];
    private oncers: Listener<T>[] = [];

    on(listener: Listener<T>): Disposable {
        this.listeners.push(listener);
        return {
            dispose: () => this.off(listener)
        };
    }

    once(listener: Listener<T>): void {
        this.oncers.push(listener);
    }

    off(listener: Listener<T>) {
        const callbackIndex = this.listeners.indexOf(listener);
        if (callbackIndex > -1) {
            this.listeners.splice(callbackIndex, 1);
        }
    }

    emit(event: T) {
        // notify general listeners
        this.listeners.forEach((listener) => listener(event));

        // clear the oncers queue
        if (this.oncers.length > 0) {
            const toCall = this.oncers;
            this.oncers = [];
            toCall.forEach((listener) => listener(event));
        }
    }

    pipe(te: TypedEvent<T>): Disposable {
        return this.on((e) => te.emit(e));
    }
}
