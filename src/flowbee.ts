export interface Flow {
    type: 'flow';
    id?: string;
    path: string;
    attributes?: { [key: string]: string };
    readonly?: boolean;
    steps?: Step[];
    subflows?: Subflow[];
    variables?: { [key: string]: { type: 'string' | 'boolean' | 'number' | 'Date' | 'object' } };
}

export interface Step {
    id: string;
    name: string;
    /**
     * Logical path for descriptor, or for custom steps
     * this is the module path to ts file.
     */
    path: string;
    attributes?: { [key: string]: string };
    type: 'step';
    links?: Link[];
}

export interface Link {
    id: string;
    to: string;
    attributes?: { [key: string]: string };
    type: 'link';
    event?: 'Finish' | 'Error' | 'Cancel' | 'Delay' | 'Resume';
    result?: string;
}

export interface Subflow {
    id: string;
    name: string;
    steps?: Step[];
    attributes?: { [key: string]: string };
    type: 'subflow';
}

export type FlowElementStatus =
    | 'Pending'
    | 'In Progress'
    | 'Waiting'
    | 'Failed'
    | 'Errored'
    | 'Completed'
    | 'Canceled';

export type Values = { [key: string]: string | boolean | number | Date | object };

export interface FlowInstance {
    id: string;
    runId?: string;
    flowPath: string;
    status: FlowElementStatus;
    stepInstances?: StepInstance[];
    subflowInstances?: SubflowInstance[];
    values?: { [key: string]: string | boolean | number | Date | object };
    start?: Date;
    end?: Date;
    data?: any;
}

export interface StepInstance {
    id: string;
    flowInstanceId: string;
    stepId: string;
    status: FlowElementStatus;
    message?: string;
    result?: string;
    start?: Date;
    end?: Date;
    data?: any;
}

export interface SubflowInstance {
    id: string;
    flowInstanceId: string;
    subflowId: string;
    status: FlowElementStatus;
    stepInstances?: StepInstance[];
    start?: Date;
    end?: Date;
}

export type FlowEventType = 'start' | 'exec' | 'finish' | 'error';
export type FlowElementType = 'flow' | 'step' | 'link' | 'subflow' | 'note';
export interface FlowEvent {
    eventType: FlowEventType;
    elementType: FlowElementType;
    flowPath: string;
    flowInstanceId: string;
    instance: FlowInstance | SubflowInstance | StepInstance;
}

/**
 * Without path
 */
export const getFlowName = (flow: Flow): string => {
    let name = flow.path;
    const lastSlash = name.lastIndexOf('/');
    if (lastSlash > 0 && lastSlash < name.length - 1) {
        name = name.substring(lastSlash + 1);
    }
    return name;
};
