import {useContext, useEffect, useMemo} from "react";
import {AppContext} from "../../../appContext";
import * as React from "react";
import {ReceiptWithRetailer} from "../model";
import ReactEcharts, {EChartsOption } from "../../../ui/echarts";
import {usePersistentQueryNavigate} from "../../../ui/hooks";

const AVG_SPAN_WEEKS = 4;
const AVG_SPAN = AVG_SPAN_WEEKS * 7 * 24 * 60 * 60 * 1000;

export const ExpensesChart = (props: { receipts: Array<ReceiptWithRetailer> }) => {

    const navigate = usePersistentQueryNavigate();

    const ctx = useContext(AppContext);

    const eChartsRef = React.useRef<ReactEcharts>(null);

    const chartOptions = useMemo(() => {
        const options: EChartsOption = {
            legend: {},
            tooltip: {
                trigger: 'axis',
            },
            xAxis: {
                type: 'time',
                //boundaryGap: false
            },
            yAxis:
                {
                    name: 'Amount',
                    type: 'value',
                    position: 'right',
                    //boundaryGap: [0, '100%'],
                    axisLabel: {
                        formatter: '{value}€'
                    }
                },
            dataZoom: [
                {
                    textStyle: {
                        color: '#8392A5'
                    },
                    handleIcon:
                        'path://M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                    dataBackground: {
                        areaStyle: {
                            color: '#8392A5'
                        },
                        lineStyle: {
                            opacity: 0.8,
                            color: '#8392A5'
                        }
                    },
                    brushSelect: true
                },
                {
                    type: 'inside'
                }
            ],
            series: []
        };

        return options;
    }, []);


    /*const [sortedReceipts, mvgAvg, weeklySums] = */
    useEffect(() => {
        const sortedReceipts = props.receipts.sort((r1, r2) => r1.date.localeCompare(r2.date));
        const mvgAvg = sortedReceipts.map((r, idx) => {
                let total = 0;
                let count = 0;
                for (;
                    (idx - count) >= 0 &&
                    new Date(sortedReceipts[idx].date).getTime() - new Date(sortedReceipts[idx - count].date).getTime() < AVG_SPAN;
                    count++) {
                    total += sortedReceipts[idx - count].amount;
                }

                return [r.date, total / AVG_SPAN_WEEKS];
            }
        )

        const weeklySumsPerRetailer = sortedReceipts.reduce((sumsPerRetailer: Record<string, {
            start: number,
            sum: number,
            receipts: string[]
        }[]>, receipt, idx) => {
            const retailer = receipt.retailer;

            const retailerSum = sumsPerRetailer[retailer] || [];
            if (!sumsPerRetailer[retailer]) sumsPerRetailer[retailer] = retailerSum;

            const receiptDate = new Date(receipt.date);
            let lastWeek = retailerSum.at(-1);

            if (lastWeek && receiptDate.getTime() < lastWeek.start + 7 * 24 * 60 * 60 * 1000) {
                lastWeek.sum += receipt.amount;
                lastWeek.receipts.push(receipt.id);
            } else {
                const weekStart = new Date(receipt.date);
                weekStart.setHours(0);
                weekStart.setMinutes(0);
                weekStart.setSeconds(0);
                weekStart.setMilliseconds(0);
                const diff = (receiptDate.getDay() - 1) * 24 * 60 * 60 * 1000;
                weekStart.setTime(weekStart.getTime() - diff);
                retailerSum.push({
                    start: weekStart.getTime(),
                    sum: receipt.amount,
                    receipts: [receipt.id]
                })
            }
            return sumsPerRetailer;
        }, {});


        /*
        const weeklySumsPerRetailerFlat = Object.entries(weeklySumsPerRetailer)
            .reduce<{retailerId: string, start: number, sum: number}[]>(
                (result, [retailerId, retailerSums]) => {
                    retailerSums.forEach(sum => result.push({...sum, retailerId}))
            return result;
        }, []);

         */

        if (eChartsRef && eChartsRef.current)
            eChartsRef.current?.getEchartsInstance().setOption({
                    dataset: Object.entries(weeklySumsPerRetailer).map(([retailer, sums]) => ({
                        id: retailer,
                        dimensions: ['retailerId', 'start', 'sum'],
                        source: sums
                    })),
                    series: [
                        /*
                        {
                            tooltip: {},
                            name: 'Amount',
                            type: 'bar',
                            //smooth: true,
                            //symbol: 'none',
                            data: sortedReceipts.map(r => [r.date, r.amount])
                        },

    */
                        {
                            tooltip: {},
                            name: 'Weekly Avg',
                            type: 'line',
                            smooth: true,
                            //symbol: 'none',
                            data: mvgAvg
                        },

                        ...Object.keys(weeklySumsPerRetailer).map(retailerId => (
                            {
                                datasetId: retailerId,
                                tooltip: {},
                                name: 'Weekly Sum ' + retailerId,
                                type: 'bar',
                                barGap: 0,
                                //barWidth: 10,
                                stack: 'weeklysum',
                                //symbol: 'none',
                                encode: {
                                    // Map "amount" column to x-axis.
                                    x: 'start',
                                    // Map "product" row to y-axis.
                                    y: 'sum',
                                    itemId: [0,1],
                                    //itemName: [0, 1],
                                    //seriesName: 'retailerId',
                                }
                            }
                        ))


                    ]
                } as EChartsOption,
                // see https://github.com/apache/echarts/issues/6202#issuecomment-974761211
                {replaceMerge: ['series']});

        /*
        return [
            sortedReceipts,
            mvgAvg,
            weeklySums
        ]

         */
    }, [props.receipts, chartOptions, eChartsRef.current]);

    const eventHandlers = useMemo(() => ({
        'click': (evt: any) => {
            if (evt.value.receipts) {
                navigate('../receipts/'+evt.value.receipts[0])
            }
            //console.log(JSON.stringify(evt, getCircularReplacer()));
        }
    }), []);

    return <div>
        <ReactEcharts theme={ctx.theme == 'dark' ? 'dark' : undefined} option={chartOptions} onEvents={eventHandlers}
                      ref={eChartsRef}/>
    </div>
}

export default ExpensesChart;