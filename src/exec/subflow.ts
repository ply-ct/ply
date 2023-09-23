import { Values, ValuesBuilder } from '../values';
import { Step, StepInstance, SubflowInstance } from '../flowbee';
import { ExecResult, PlyExecBase } from './exec';
import { Runtime } from '../runtime';
import { Log } from '../log';
import { RunOptions } from '../options';
import { Ply } from '../ply';
import * as util from '../util';
import { PlyRunner } from '../runner';
import { Suite } from '../suite';
import { Test } from '../test';
import { ResultStatus } from '../result';
import { FlowResult } from '../flow';

export class SubflowExec extends PlyExecBase {
    constructor(readonly step: Step, readonly instance: StepInstance, readonly logger: Log) {
        super(step, instance, logger);
    }

    async run(runtime: Runtime, values: Values, runOptions?: RunOptions): Promise<ExecResult> {
        const subflowPath = this.getAttribute('subflow', values, {
            trusted: runOptions?.trusted,
            required: true
        })!;
        const subflow = await new Ply(runtime.options, this.logger).loadFlow(subflowPath);

        // bind subflow values
        delete runOptions?.values;
        const inValues = this.getAttribute('inValues', values, {
            trusted: runOptions?.trusted
        });
        if (inValues) {
            if (!runOptions) runOptions = {};
            if (!runOptions.values) runOptions.values = {};
            const rows = JSON.parse(inValues);
            for (const row of rows) {
                let rowVal: any = row[1];
                if (this.isExpression(rowVal)) {
                    rowVal = this.evaluateToString(rowVal, values, runOptions.trusted);
                }
                if (('' + rowVal).trim() === '') {
                    rowVal = undefined; // empty string
                } else {
                    const numVal = Number(row[1]);
                    if (!isNaN(numVal)) rowVal = numVal;
                    else if (row[1] === 'true' || row[1] === 'false') rowVal = row[1] === 'true';
                    else if (util.isJson(row[1])) rowVal = JSON.parse(row[1]);
                }
                runOptions.values[row[0]] = rowVal;
            }
        }

        const plyValues = new ValuesBuilder(runtime.options.valuesFiles, this.logger);
        let subValues = await plyValues.read();

        const substeps = new Map<Suite<Test>, string[]>();
        substeps.set(
            subflow,
            subflow.all().map((step) => {
                return step.step.id;
            })
        );

        const runner = new PlyRunner(runtime.options, substeps, subValues, this.logger);
        await runner.runSuiteTests(subValues, runOptions);

        let outBindings: { [key: string]: string } | undefined;
        const outValues = this.getAttribute('outValues', values, {
            trusted: runOptions?.trusted
        });
        if (outValues) {
            outBindings = {}; // flow value name to return value name
            for (const row of JSON.parse(outValues)) {
                if (row[1]) {
                    outBindings[row[1]] = row[0];
                }
            }
        }

        let status: ResultStatus = 'Passed';
        const data: (string | number)[][] = [];
        for (const result of runner.results) {
            data.push([
                subflowPath,
                result.status,
                result.start || '',
                result.end || '',
                result.message || ''
            ]);
            if (result.status !== 'Passed') {
                status = result.status;
            }
            if (outBindings) {
                const returnValues = (result as FlowResult).return;
                if (returnValues) {
                    for (const flowValName of Object.keys(outBindings)) {
                        values[flowValName] = returnValues[outBindings[flowValName]];
                    }
                }
            }
        }

        // const dataRes = await this.verifyData(runtime, data, values, runOptions);
        // if (dataRes.status !== 'Passed' && status === 'Passed') status = dataRes.status

        return { status, data };
    }
}
