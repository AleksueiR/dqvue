import { Vue } from 'vue-property-decorator';
import { DVChart } from './../classes/chart';
import { Observable } from 'rxjs/Observable';
import { DVHighcharts } from './../api/main';
export type RenderedEvent = { chartId: string; highchartObject: DVHighcharts.ChartObject };
export type ViewDataEvent = { chartId: string };
export default class Chart extends Vue {
    static rendered: Observable<RenderedEvent>;
    static viewData: Observable<ViewDataEvent>;
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
