import {useContext, useEffect, useMemo} from "react";
import {AppContext} from "../../../appContext";
import * as React from "react";
import {EChartsOption} from "echarts";
import ReactEcharts from "echarts-for-react";
import {ReceiptWithRetailer} from "../model";


const AVG_SPAN = 4 * 30 * 24 * 60 * 60 * 1000;

export const ExpensesChart = (props: { receipts: Array<ReceiptWithRetailer> }) => {

    const ctx = useContext(AppContext);

    const eChartsRef = React.useRef<any>();

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
                    total += sortedReceipts[idx - count].totalAmount;
                }

                return [r.date, total / 16];
            }
        )
        mvgAvg
        const weeklySumsPerRetailer = sortedReceipts.reduce((sumsPerRetailer: Record<string, {
            start: number,
            sum: number
        }[]>, receipt, idx) => {
            const retailer = receipt.retailer;

            const retailerSum = sumsPerRetailer[retailer] || [];
            if (!sumsPerRetailer[retailer]) sumsPerRetailer[retailer] = retailerSum;

            const receiptDate = new Date(receipt.date);
            let lastWeek = retailerSum.at(-1);

            if (lastWeek && receiptDate.getTime() < lastWeek.start + 7 * 24 * 60 * 60 * 1000) {
                lastWeek.sum += receipt.totalAmount;
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
                    sum: receipt.totalAmount
                })
            }
            return sumsPerRetailer;
        }, {});

        if (eChartsRef && eChartsRef.current)
            eChartsRef.current?.getEchartsInstance().setOption({
                    series: [
                        /*
                        {
                            tooltip: {},
                            name: 'Amount',
                            type: 'bar',
                            //smooth: true,
                            //symbol: 'none',
                            data: sortedReceipts.map(r => [r.date, r.totalAmount])
                        },

    */
                        {
                            tooltip: {},
                            name: '4-months Avg',
                            type: 'line',
                            smooth: true,
                            //symbol: 'none',
                            data: mvgAvg
                        },


                        ...Object.entries(weeklySumsPerRetailer).map(([retailer, sum]) => (
                            {
                                tooltip: {},
                                name: 'Weekly Sum ' + retailer,
                                type: 'bar',
                                barGap: 0,
                                //barWidth: 10,
                                stack: 'weeklysum',
                                //symbol: 'none',
                                data: sum.map(w => [w.start, w.sum])
                            }
                        ))

                    ]
                },
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
        'dataZoom': (evt: any) => {
            console.log(JSON.stringify(evt));
        }
    }), []);

    return <div>
        <ReactEcharts theme={ctx.theme == 'dark' ? 'dark' : undefined} option={chartOptions} onEvents={eventHandlers}
                      ref={eChartsRef}/>
    </div>
}

export default ExpensesChart;