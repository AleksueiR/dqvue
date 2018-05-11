---
search: english
---

# API

## Initialization / Bootstrapping

### Declarative

The template is defined on the HTML page itself and data is passed to it by reference.

Here, the chart data is provided as part of the chart's config object which is referenced on the
global scope:

```html
<!-- index.html -->
<!-- data (section and chart both) and chart config objects available on the global scope directly referenced in the template -->
<script>
window.dvData1 = {
    title: "Hi",
    message: "This is the first DV instance and a simple chart."
};

window.dvChartConfig1 = {
    xAxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ]
    },
    series: [{
      data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4],
      type: 'column'
    }]
};
</script>

<dv-section dv-data="dvData1" id="dv1">
  <h2>{{ title }}</h2>
  <p>{{ message }}</p>

  <dv-chart dv-config="dvChartConfig1"></dv-chart>
</dv-section>
```

The chart data can be referenced separately from the chart's config object:

```html
// index.html
<script>
window.dvData2 = {
    title: "Hi",
    message: "This is the first DV instance and a simple chart."
};

window.dvChartConfig2 = {
      xAxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]
      },
      series: [{
        // data is provided separatelly
        type: 'column'
      }]
    }
};
window.dvChartData2 = [[29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]];
</script>

<dv-section dv-data="dvData2" id="dv2">
  <h2>{{ title }}</h2>
  <p>{{ message }}</p>

  <dv-chart dv-data="dvChartData2" dv-config="dvChartConfig2"></dv-chart>
</dv-section>
```

When creating a standalone chart without a template section, there is no need to provide data object
to the `dv-section`:

```html
// index.html
<script>
window.dvChartConfig4_1 = {
      xAxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]
      },

      series: [{
        data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4],
        type: 'column'
      }]
    }
  };
</script>

<dv-section>
  <dv-chart dv-config="dvChartConfig4_1"></dv-chart>
</dv-section>
```

Just a template, without a chart:

```html
// index.html
<script>
window.dvData4_2 = {
    title: "Hi",
    message: "This is the first DV instance and a simple chart."
};
</script>

<dv-section dv-data="dvData4_2">
  {{ title }}
  {{ message }}
</dv-section>
```

No extra JavaScript code is required with this setup - DV Sections will be auto-bootstrapped (data or its promise has to be added to the global scope before the template is parsed).

DV Sections can be retrieved using their ids specified in the template:

```js
// index.js
DQV.sections: { [name: string]: DVSection }
```

### Programmatic

The template, data and chart config can be provided using API calls. DQV exposes a single global
object name `DQV` which which provides constructors for Section and Chart.

If there are several charts in a DV Template, each DV Chart needs to be created separately.

<p class="warning">
  The section template should contain exactly one root element.
</p>

```html
// index.html

<div id="dvMountPoint1"></div>
```

```js
// index.js
const template = `
  <dv-section id="dv5">
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>

    <dv-chart id="dvChart5_1"></dv-chart>
    <dv-chart id="dvChart5_2"></dv-chart>
  </dv-section>
`;

const data = {
    title: "Hi",
    message: "This is the first DV instance and a simple chart."
};

// config object includes configs for all the charts in the DV instance
const chartConfig = {
	dvChart5_1: {
      xAxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },

      series: [{
        data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4],
        type: 'column'
      }]
    },
    dvChart5_2: {...}
 };

// create DQV Charts
const dvchart1: DVChart = new DQV.Chart({ id: 'dvChart5_1', config: chartConfig.dvChart5_1 });
const dvchart2: DVChart = new DQV.Chart({ id: 'dvChart5_2', config: chartConfig.dvChart5_2 });

// create a new DV Section and pass the charts into it
const dvsection: DVSection = new DQV.Section({ id: 'dv5', template, data });

// mount it to an HTML element
dvsection.mount(document.getElementById('dvMountPoint1'));
```

`data`, `template`, and `charts` can be supplied separately.

```js
const dvchart: DVChart = new DQV.Chart({ id });
dvchart.config = chartConfig;

const dvSection: DVSection = new DQV.Section({ id });
dvSection.data = data;
dvSection.template = template;

dvSection.mount(document.getElementById('dvMountPoint1'));
```

If chart data is not supplied with the chart config, it needs to be set separately:

```js
// index.js
const template = `
<dv-section id="dv6">
  <dv-chart id="dvChart6"></dv-chart>
</dv-section>`;

const chartConfig = {
    xAxis: {
        categories: [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
        ]
    },

    series: [
        {
            // data provided separately
            type: 'column'
        }
    ]
};

const chartData = [
    [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
];

const dvchart: DVChart = new DQV.Chart({ id: 'dvChart6', config: chartConfig });
dvchart.data = chartData;
// or
const dvchart: DVChart = new DQV.Chart({ id: 'dvChart6', config: chartConfig, data: chartData });

const dv: DVSection = new DQV.Section({ id: 'dv6' });
dv.template = template;
```

Setting `data` or `template` after the DV Section is mounted, will re-compile and re-mount the instance.

It's possible to change data belonging to the template inline, without setting `data` on the
section, but that won't work for charts.

```js
// index.js
const data = {
    title: 'Hi',
    message: 'This is the first DV instance and a simple chart.'
};

const dv: DVSection = new DQV({ id, data, template });
data.title = 'Hi, there!';
```

### [under consideration] Hybrid

Templates are defined on the HTML page, but data and chart configs are supplied using API calls.

```html
// index.html

<dv-section id="dv8" dv-wait>
  <h2>{{ title }}</h2>
  <p>{{ message }}</p>

  <dv-chart id="dvChart8"></dv-chart>
</dv-section>
```

```js
// index.js
const data = {
    title: 'Hi',
    message: 'This is the first DV instance and a simple chart.'
};

// config object includes configs for all the charts in the DV instance
const chartConfig = {
    xAxis: {
        categories: [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
        ]
    },

    series: [
        {
            // data is supplied separately
            type: 'column'
        }
    ]
};

const chartData = [
    [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
];

// a DV instances will not auto-mount when declared on the page without proper data or charts provided

const dvchart: DVChart = new DQV.Chart({ id: 'dvChart8', config: chartConfig, data: chartData });

const dvsection = DQV.sections['dv8'];
dv.data = data;

dvsection.mount();
```

## API and Markup

### Declarative

#### dv-section: node

Marks the root node of a DV Section. Each DV Section must start with `dv-section` even when setting
templates programmatically. Nesting DV Sections is not allowed.

```html
// index.html
<dv-section>
  {{ message }}
</dv-section>
```

##### id: attribute

Can be used to retrieve a DV Section using an API call.

```html
// index.html
<dv-section id="dv1">
  {{ message }}
</dv-section>
```

```js
// index.js
const dv = DQV.sections['dv1'];
```

##### dv-data: attribute

Points to the data source (object) for the DV instance on the global scope.

```html
// index.html
<dv-section dv-data='dataOjbect'>
  {{ message }}
</dv-section>
```

#### dv-chart: node

##### id: attribute

Used to set chart's config and data object; the Highcharts reference can be retreived using an API
call.

```html
// index.html
<dv-section id="dv2">
  <dv-chart id="chart2"></dv-chart>
</dv-section>
```

```js
// index.js
const chart: DVChart = DQV.charts['chart2'];
```

##### dv-config: attribute

Points to the data source (object) for the DV Chart on the global scope. It's possible to provide
chart data in the config object.

```html
// index.html
<dv-section>
  <dv-chart dv-config="configObject"></dv-chart>
</dv-section>
```

##### dv-data: attribute

Points to the data source (object) for the DV Chart on the global scope. A chart config must be
provided separately when using `dv-data`.

```html
// index.html
<dv-section>
  <dv-chart dv-config="configObject" dv-data="dataObject"></dv-chart>
</dv-section>
```

##### dv-auto-generate-table: attribute

If set, all linked chart table nodes are populated with chart's data as soon as the chart itself renders.

```html
<dv-chart id="chartId" dv-config="dataObject" dv-auto-generate-table></dv-chart>
<dv-chart-table dv-chart-id="chartId"></dv-chart-table>
```

###### Note:

When auto generating a chart table, consider disabling Highcharts `View data table` menu option. It longer serves no purpose after the table is created. To do that, add the following to the top level of the chart config:

```json
exporting: {
    menuItemDefinitions: {
      viewData: null
    }
}
```

#### dv-chart-table: node

A node where chart's data table will be rendered upon user request or on initial loading. Because chart ids are unique, `dv-chart-table` nodes are not restricted to the same `dv-section` as their parent chart, and can be placed in any of the `dv-section` nodes.

```html
<dv-section id="section1">
    <dv-chart id="chartId" dv-config="configObject"></dv-chart>
</dv-section>

<dv-section>
    <dv-chart-table dv-chart-id="chartId"></dv-chart-table>
</dv-section>
```

Chart table nodes can be placed inside their parent `dv-chart` nodes. In such cases, no `dv-chart-id` attribute is required:

```html
<dv-section id="section1">
    <dv-chart id="chartId" dv-config="configObject">
        <dv-chart-table></dv-chart-table>
    </dv-chart>
</dv-section>
```

##### dv-chart-id: attribute

This links a `dv-chart-table` node to its parent chart. Only one table can be rendered for any given chart. This is limitation of Highcharts.

```html
<dv-section id="section1">
    <!-- this will render a table in front of the chart node -->
    <dv-chart-table dv-chart-id="chartId"></dv-chart-table>

    <dv-chart id="chartId" dv-config="configObject"></dv-chart>
</dv-section>
```

##### dv-table-class: attribute

A space separated list of CSS class names which will be applied to the actual `table` node when it is rendered. This can be useful if there is other code which uses a specific selector to manipulate the table.

```html
<dv-section id="section1">
    <dv-chart id="chartId" dv-config="configObject">
        <dv-chart-table dv-table-class="fancy-table zebra"></dv-chart-table>
    </dv-chart>
</dv-section>
```

This example will be rendered as:

```html
<div ... dv-table-class="fancy-table zebra">
    <div ... class="highcharts-data-table">
        <table ... class="fancy-table zebra">
            ...
        </table>
    </div>
</div>
```

### Programmatic

#### DQSection

##### constructor( options ): DVSection

Creates a new instance of DV Section; takes a single optional argument in the form of:

```json
options: {
    id: string, // required;
    template?: string | Promise<string>, // valid HTML string
    data?: object | Promise<object>, // free form object to provide data to the template,
    mount?: HTMLElement,
    automount?: boolean // if `true`, the section will attempt to mount using the `mount` provided in the constructor
}
```

```js
// index.js
const dv: DVSection = new DQV.Section({ template, data });
```

##### template: string

Sets the section's template, re-compiles, and re-mounts it:

<p class="warning">
  The section template should contain exactly one root element.
</p>

```js
// index.js
const dv: DVSection = new DQV.Section({ ... });
dv.template = newTemplate;
```

##### setTemplate(value): void

```js
value: Promise<object>
```

In cases when the template value is returned by an external promise, use the `setTemplate` function.

<p class="warning">
  The section template should contain exactly one root element.
</p>

```js
// index.js
const dv: DVSection = new DQV.Section({ ... });
dv.setTemplate(new Promise(resolve => resolve('{{ message }}')));
```

##### data: object

Sets the section's data, re-compiles, and re-mounts it:

```js
// index.js
const dv: DVSection = new DQV.Section({ ... });
dv.data = newData;
```

##### setData(value): void

```js
value: Promise<object>
```

In cases when the data value is returned by an external promise, use the `setData` function.

```js
// index.js
const dv: DVSection = new DQV.Section({ ... });
dv.setData(new Promise(resolve => resolve('{ message: "hello" }')));
```

##### mount(element): DVSection

```js
element: : HTMLelement | null
```

Called against a DV Section. Compiles and mounts this section replacing the element provided:

```js
// index.js
const dv: DVSection = new DQV.Section({ ... });
dv.mount(element);
```

Calling on already moounted instance is not allowed and will result in an error. To move the
instance, dismount first, then mount using a new target.

If the mount element is provided as part of the constructor, the call to `mount` can be made with no
arguments:

```js
// index.js
const dv: DVSection = new DQV.Section({ ..., mount: element });
dv.mount();
```

##### dismount(removeMount): DVSection

Removes the DV Section from the page (the mount element is left intact); after dismounting, the
instance is available to be mounted on the old (if the old mount node is not removed) or new target.

```ts
removeMount: boolean = false // if true, the mount node is also removed from the DOM
```

```js
// index.js
const dv: DVSection = new DQV.Section({ ... });
dv.mount(element1);

dv.dismount().mount(element2);
```

##### destroy(): DVSection

Removes the DV Section at its mount element from the page; after destroying, the instance is
available to be mounted on the new target.

```js
// index.js
const dv: DVSection = new DQV.Section({ ... });
dv.mount(element1);

dv.destroy().mount(element2);
```

##### remount(): DVSection

A shortcut to dismount and mount the DV Section on the same element.

```
// index.js
const dv: DVSection = new DQV.Section({ ... });
dv.mount(element);

dv.remount(element);
```

##### [under consideration] duplicate(): DVSection

Creates a shallow copy of the current DV Section with a new id.

```js
// index.js
const dv: DVSection = new DQV.Section({ ... });
dv.mount(element1);

dv.clone().mount(element2);
```

If the original `data` object is modified, the changes will affect all copies of the DV Section.
Only works if `data` is set using a setter, not through a Promise.

#### DVChart

##### constructor(options): DVChart

Creates a new instance of DV Chart; takes a single optional argument in the form of:

```json
options: {
    id: string, // must be provided and match id on one of the <dv-chart> nodes in the template
    config: object | Promise<object>,
    data: object | Promise<object>
}
```

```js
// index.js
const dv: DVChart = new DQV.Chart({ id, config, data });
```

##### config: object

Sets chart config optionally including chart data.

Each chart data object is an array of data arrays, one for each series of the chart.

```js
// index.js
const newConfig = {
  ...,
  series: [{
         data: [1,2,3,4],
         type: 'column'
      },
      {
         data: [5,6,7,8],
         type: 'line'
      }]
};

const dvchart: DVChart = new DQV.Chart();
dvchart.config = newConfig;

const dv: DVSection = new DQV.Section({ ... });
dv.charts = { [dvchart.id]: dvchart };
```

Setting the `config` value will update the chart's appearance by calling `.update()` internally.

##### setConfig(value): void

```js
value: Promise<object>
```

In cases when the `config` value is returned by an external promise, use the `setConfig` function.
Chart config object can optionally including chart data.

Each chart data object is an array of data arrays, one for each series of the chart.

```js
// index.js
const newConfig = new Promise(resolve => resolve({
  ...,
  series: [{
         data: [1,2,3,4],
         type: 'column'
      },
      {
         data: [5,6,7,8],
         type: 'line'
      }]
}));

const dvchart: DVChart = new DQV.Chart();
dvchart.setConfig(newConfig);

const dv: DVSection = new DQV.Section({ ... });
dv.charts = { [dvchart.id]: dvchart };
```

This call will update the chart's appearance by calling `.update()` internally.

##### data: object

Sets chart data. Chart must have config and data to be mounted properly

```js
// index.js
const newConfig = {...};

const newData = {
  chart1: [
    [1,2,3,4],
    [5,6,7,8]
  ]
};

const dvchart: DVChart = new DQV.Chart({ config: newConfig });
dvchart.data = newData;

const dv: DVSection = new DQV.Section({ ... });
dv.charts = { [dvchart.id]: dvchart };
```

Setting the `data` value will update the chart's appearance by calling `.update()` internally.

##### setData(value): void

```js
value: Promise<object>
```

In cases when the data value is returned by an external promise, use the `setData` function. Chart
must have config and data to be mounted properly.

```js
// index.js
const newConfig = {...};

const newData = new Promise(resolve => resolve({
  chart1: [
    [1,2,3,4],
    [5,6,7,8]
  ]
}));;

const dvchart: DVChart = new DQV.Chart({ config: newConfig });
dvchart.setData(newData);

const dv: DVSection = new DQV.Section({ ... });
dv.charts = { [dvchart.id]: dvchart };
```

This call will update the chart's appearance by calling `.update()` internally.

##### [under consideration] duplicate(): DVChart

Creates a shallow copy of the current DV Chart with a new id.

```js
// index.js
const dvchart1: DVChart = new DQV.Chart({ config: newConfig });
dvchart1.data = newData;

const dvchart2 = dvchart1.clone();

const dv: DVSection = new DQV.Section({ ... });
```

If the original `data` or `config` values are modified, it will affect all duplicates. Only works if `data` or `config` values are set using a setter, not through a Promise.

Need to call `update` on the DVChart instance or `remount` on its parent DVSection instance to have the changes to the `config` or `data` properties reflected on the page. Highcharts does create direct binding and cannot detect changes automatically.

##### refresh(): void

Reloads the Highcharts instance reflowing the chart if its container changed dimensions. Highcharts does create direct binding and cannot detect changes to the `config` and `data` properties automatically.

This is cheaper then calling `remount` on the parent DV Instance.

```js
// index.js
const dvchart: DVChart = new DQV.Chart({ config: newConfig });
const dv: DVSection = new DQV.Section({ charts: dvchart });

newConfig.title = 'new title';

dvchart.refresh();
```

##### highchart: Highcharts

Returns a Highcharts reference.

```js
// index.js
const chart: DVChart = DQV.charts['chart2'];
const highchart = chart.highchart; // returns an instance of Highcharts chart
```

## Chart Configuration

DV Chart object accepts any Highcharts configuration valid under the currently loaded Highcharts version.

### Zoom Range Slider

Highcharts provides an ability for the user to zoom into the data along X, Y, or both dimensions. This is done by dragging a rectangle on top of the chart. This is done by setting `zoomType` to `x`, `y` or `xy` on the `chart` section of the chart config:

```json
chart: {
    zoomType: 'xy'
}
```

DQV will automatically provide a keyboard-accessible double-sided slider control to modify the chart range when zoom type is set (X axis only for now). To not show the slider, set `zoomSlider` to `null` on the `chart` section of the chart config:

```json
chart: {
    zoomType: 'x',
    zoomSlider: null
}
```

The slider is created using the [noUiSlider](https://refreshless.com/nouislider/) library and is highly configurable. To change the appearance or behaviour of the slider, set `zoomSlider` to a valid noUiSlider config object.

```json
chart: {
    zoomType: 'x',
    zoomSlider: {
        step: 2,
        connect: false,
        tooltips: [ false, true ],
        pips: {
          mode: 'range',
          density: 3
      }
    }
}
```

If no slider options are provided, it configuration defaults to the following:

```json
{
    // axisObject = highchart.xAxis;
    // extremes = axisObject.getExtremes();
    // https://api.highcharts.com/class-reference/Highcharts.Axis#getExtremes

    start: [extremes.dataMin, extremes.dataMax],
    connect: true,
    behaviour: 'tap-drag',
    animate: false,
    margin: axisObject.minRange
    range: {
        min: extremes.dataMin,
        max: extremes.dataMax
    }
}
```

#### Keyboard Navigation

Focus on a slider handle by clicking on or tabbing to it to activate keyboard support:

##### Movement Keys

*   `Right` and `Up` keys move the focused handle to the right by a single step
*   `Left` and `Down` keys move the focused handle to the left by a single step
*   `Home` key moves the focused handle all the way to the left
*   `End` key moves the focused handles all the way to the right

##### Modifier Keys

*   holding `Shift` key while pressing a movement key moves the focused handle by ten steps at a time
*   holding `Ctrl` key while pressing a moment key moves both handles at the same time effectively shifting the current range

##### Key Combinations

*   `Ctrl` + `Home|End` moves the selected range all the way to the left|right
*   `Shift` + `Ctrl` + `Right|Up|Left|Down` moves the selected range left|right by ten steps

## Future Enhancements

### Deep linking

Allow to deep link objects on global scope in declarative mode:

```html
// index.html

<dv-section dv-data="main.container.one.data" id="dv1">

  <dv-chart dv-config="main.article.charts.config"></dv-chart>
</dv-section>
```
