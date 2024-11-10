import * as util from '../util';
import { StepExec, ExecResult } from './exec';
import { ExecContext } from './context';
import { ValuesBuilder } from '../values';
import { Ply } from '../ply';
import { PlyRunner } from '../runner';
import { Suite } from '../suite';
import { Test } from '../test';
import { ResultStatus } from '../result';
import { FlowResult } from '../flow';

export class SubflowExec extends StepExec {
    async run(context: ExecContext): Promise<ExecResult> {
        const subflowPath = context.getAttribute('subflow', { required: true })!;
        const subflow = await new Ply(context.runtime.options, context.logger).loadFlow(
            subflowPath
        );

        // bind subflow values
        delete context.runOptions?.values;
        const inValues = context.getAttribute('inValues');
        if (inValues) {
            if (!context.runOptions) context.runOptions = {};
            if (!context.runOptions.values) context.runOptions.values = {};
            const rows = JSON.parse(inValues);
            for (const row of rows) {
                let rowVal: any = row[1];
                if (this.isExpression(rowVal)) {
                    rowVal = context.evaluateToString(rowVal);
                }
                if (('' + rowVal).trim() === '') {
                    rowVal = undefined; // empty string
                } else {
                    const numVal = Number(row[1]);
                    if (!isNaN(numVal)) rowVal = numVal;
                    else if (row[1] === 'true' || row[1] === 'false') rowVal = row[1] === 'true';
                    else if (util.isJson(row[1])) rowVal = JSON.parse(row[1]);
                }
                context.runOptions.values[row[0]] = rowVal;
            }
        }

        const plyValues = new ValuesBuilder(context.runtime.options.valuesFiles, context.logger);
        let subValues = await plyValues.read();

        const substeps = new Map<Suite<Test>, string[]>();
        substeps.set(
            subflow,
            subflow.all().map((step) => {
                return step.step.id;
            })
        );

        const runner = new PlyRunner(context.runtime.options, substeps, subValues, context.logger);
        await runner.runSuiteTests(subValues, context.runOptions);

        let outBindings: { [key: string]: string } | undefined;
        const outValues = context.getAttribute('outValues');
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
                        context.values[flowValName] = returnValues[outBindings[flowValName]];
                    }
                }
            }
        }

        // const dataRes = await this.verifyData(runtime, data, values, runOptions);
        // if (dataRes.status !== 'Passed' && status === 'Passed') status = dataRes.status

        return { status, data };
    }
}
