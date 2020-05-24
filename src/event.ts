// Browser may require https://www.npmjs.com/package/events
import { Result } from './result';

/**
 * Event type is 'start' or 'outcome'.
 * Event plyee is the unique test path.
 */
export interface PlyEvent {
    plyee: string
}

export interface ResultEvent extends PlyEvent {
    result: Result
}

export type PlyEventListener = (e: PlyEvent) => void;
