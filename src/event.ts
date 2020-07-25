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
    type: TestType,
    status: 'Started' | 'Finished';
}

export type PlyEventListener = (e: PlyEvent) => void;
