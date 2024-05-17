
// Centralizes echarts imports and its static init so as to be able to lazy load a single entry point

// register the echarts dark theme for use throughout the app
import echartsDarkTheme from './echarts_dark.json';
import {registerTheme} from 'echarts';
registerTheme('dark', echartsDarkTheme);

import * as ReactEcharts from "echarts-for-react";
export { EChartsOption } from "echarts";
export { OptionSourceData } from "echarts/types/src/util/types";
export default ReactEcharts.default;