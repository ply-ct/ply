// Browser may require https://www.npmjs.com/package/events
import { Outcome } from './result';

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
    status: 'Started' | 'Finished';
}

export type PlyEventListener = (e: PlyEvent) => void;
