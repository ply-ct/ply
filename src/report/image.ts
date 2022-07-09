import * as fs from 'fs';
import { Reporter, ReportOptions } from '../runs/model';
import { Log } from '../logger';
import { Runs } from '../runs/runs';
import { ChartCallback, ChartJSNodeCanvas, ChartJSNodeCanvasOptions } from 'chartjs-node-canvas';
import { TestRunData } from './chart/data';
import { ResultsChart } from './chart/chart';

export class ImageReporter implements Reporter {
    constructor(readonly logger: Log) {}

    async report(options: ReportOptions) {
        const runs = new Runs(options.runsLocation);
        const plyResults = await runs.loadPlyResults();
        const testRunData = new TestRunData(plyResults, { intervals: 10 });
        const chart = new ResultsChart(testRunData);

        const chartCallback: ChartCallback = (ChartJS) => {
            ChartJS.defaults.responsive = true;
            ChartJS.defaults.maintainAspectRatio = false;
        };

        const width = 2400;
        const height = 1350;
        const backgroundColour = '#ffffff';

        const canvasOptions: ChartJSNodeCanvasOptions = {
            width,
            height,
            backgroundColour,
            chartCallback
        };
        const chartConfig = chart.getChartConfig(testRunData.getRequestThroughput());

        let buffer: Buffer;
        if (options.format === 'svg' || options.format === 'pdf') {
            const chartJSNodeCanvas = new ChartJSNodeCanvas({
                ...canvasOptions,
                type: options.format
            });
            buffer = chartJSNodeCanvas.renderToBufferSync(
                chartConfig,
                options.format === 'pdf' ? 'application/pdf' : 'image/svg+xml'
            );
        } else {
            const chartJSNodeCanvas = new ChartJSNodeCanvas(canvasOptions);
            buffer = await chartJSNodeCanvas.renderToBuffer(chartConfig);
        }

        await fs.promises.writeFile(
            `${options.outputLocation}/ply-runs.${options.format}`,
            buffer,
            'base64'
        );
    }
}
