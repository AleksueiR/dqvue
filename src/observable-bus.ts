import { Subject } from 'rxjs/Subject';

import { DVSection } from './classes/section';
import { DVChart } from './classes/chart';

const sectionCreatedSubject: Subject<DVSection> = new Subject<DVSection>();
const chartCreatedSubject: Subject<DVChart> = new Subject<DVChart>();

export { sectionCreatedSubject, chartCreatedSubject };
