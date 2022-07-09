import { ChartConfiguration } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Dataset, TestRunData } from './data';
import { chartOptions } from './options';

export class ResultsChart {
    constructor(readonly data: TestRunData) {
        // this.chart = this.buildDetail(this.data.getRequestThroughput());
    }

    getChartConfig(datasets: Dataset[]): ChartConfiguration {
        return {
            type: 'line',
            data: { datasets },
            options: {
                ...chartOptions
                // onClick: (_evt: ChartEvent, elems: ActiveElement[], chart: Chart) => {
                //     if (elems.length) {
                //         const label = chart.data.datasets[elems[0].datasetIndex].label;
                //         if (label) {
                //             this._onChartAction.emit({ action: 'select', requestName: label });
                //         }
                //     }
                // }
            }
        };
    }
}
