import { SuiteRun } from '../runs/model';

export type DataColumns = { [column: string]: (string | number | boolean | Date | null)[] };
export class ReportData {
    readonly dataColumns: DataColumns;

    constructor(readonly suiteRuns: SuiteRun[]) {
        this.dataColumns = {
            Run: [],
            Suite: [],
            Name: [],
            Test: [],
            Type: [],
            Start: [],
            End: [],
            Status: [],
            Message: [],
            Submitted: [],
            Method: [],
            URL: [],
            'Response Status': [],
            'Response Time': []
        };

        suiteRuns.forEach((suiteRun) => {
            suiteRun.testRuns.forEach((testRun) => {
                this.dataColumns.Run.push(suiteRun.run + 1);
                this.dataColumns.Suite.push(suiteRun.suite);
                this.dataColumns.Name.push(testRun.name);
                this.dataColumns.Test.push(testRun.test);
                this.dataColumns.Type.push(testRun.type);
                this.dataColumns.Start.push(testRun.start || null);
                this.dataColumns.End.push(testRun.end || null);
                this.dataColumns.Status.push(testRun.result.status);
                this.dataColumns.Message.push(testRun.result.message || null);
                this.dataColumns.Submitted.push(testRun.request?.submitted || null);
                this.dataColumns.Method.push(testRun.request?.method || null);
                this.dataColumns.URL.push(testRun.request?.url || null);
                this.dataColumns['Response Status'].push(testRun.response?.status.code || null);
                this.dataColumns['Response Time'].push(testRun.response?.time || null);
            });
        });
    }
}
