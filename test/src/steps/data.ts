import { StepExec, ExecResult } from '../../../src/exec/exec';
import { ExecContext } from '../../../src/exec/context';

export default class DataStep extends StepExec {
    async run(context: ExecContext): Promise<ExecResult> {
        const data = {
            title: 'Dracula',
            year: 1931,
            id: '269b34c1',
            poster: 'drac.jpg',
            rating: 5,
            webRef: {
                ref: 'tt0021814',
                site: 'imdb.com'
            }
        };

        return await context.verifyData(data);
    }
}
