import { Vue } from 'vue-property-decorator';
import Highcharts from 'highcharts';
import { DVChart } from './../classes/chart';
export default class Chart extends Vue {
    dvchart: DVChart;
    _isLoading: boolean;
    highchartObject: Highcharts.ChartObject;
    rootSectionId: string;
    charts: {
        [name: string]: object;
    };
    readonly id: string;
    mounted(): void;
    renderChart(): void;
}
