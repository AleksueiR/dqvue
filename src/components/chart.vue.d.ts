import { Vue } from 'vue-property-decorator';
import Highcharts from 'highcharts';
import { DVChart } from './../classes/chart';
import { Observable } from 'rxjs/Observable';
export type RenderedEventType = { chartId: string; highchartObject: Highcharts.ChartObject };
export type ViewDataClickedEventType = { chartId: string };
export default class Chart extends Vue {
    static rendered: Observable<RenderedEventType>;
    static viewDataClicked: Observable<ViewDataClickedEventType>;
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
