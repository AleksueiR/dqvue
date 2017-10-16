import { Vue } from 'vue-property-decorator';
import * as Highcharts from 'highcharts';
import { DVChart } from './../classes/chart';
export default class Chart extends Vue {
    dvchart: DVChart;
    isLoading: boolean;
    highchartObject: Highcharts.ChartObject;
    charts: {
        [name: string]: object;
    };
    readonly id: string;
    mounted(): void;
    renderChart(): void;
}
