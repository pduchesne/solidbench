import {useContext, useEffect, useMemo} from "react";
import {AppContext} from "../../../appContext";
import * as React from "react";
import {ReceiptItem, ReceiptWithRetailer} from "../model";
import ReactEcharts, {EChartsOption } from "../../../ui/echarts";
import {SeriesOption} from "echarts";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import {getEcoscore, getNutriscore, SCORE_COLORS} from "../off";

export const ScoresPanel = (props: { receipts: Array<ReceiptWithRetailer> }) => {

    return <div className="retail-scores">
        <ABCDEScorePanel receipts={props.receipts} logo="/images/logos/ecoscore.png" getCategory={(i) => getEcoscore(i.article.gtin, true)}/>
        <ABCDEScorePanel receipts={props.receipts} logo="/images/logos/nutriscore.png" getCategory={(i) => getNutriscore(i.article.gtin, true)}/>
    </div>
}


export const ABCDEScorePanel = (props: { receipts: Array<ReceiptWithRetailer>, logo: string, getCategory: (item: ReceiptItem) => string | undefined, displayUndefined?: boolean }) => {

    const ctx = useContext(AppContext);

    const eChartsRef = React.useRef<ReactEcharts>(null);

    const chartOptions = useMemo(() => {
        const options: EChartsOption = {
            graphic: {
                zlevel: 5,
                type: 'image',
                left: 'center',
                top: 15,
                style: {
                    image: props.logo,
                    width: 200
                }
            },
            color: [SCORE_COLORS.a, SCORE_COLORS.b, SCORE_COLORS.c, SCORE_COLORS.d, SCORE_COLORS.e],
            legend: {show: false},
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
                },
            series: []
        };

        return options;
    }, []);

    const [periodicRetailerScores, allCategories] = useMemo( () => {
        const scores: Record<string, {
            start: number,
            values: Record<string, number>
        }[]> = {};

        const categories: Record<string, number> = {};

        props.receipts.forEach(r => {
            const receiptDate = new Date(r.date);
            const anchorDate = new Date(receiptDate.getFullYear(), ~~(receiptDate.getMonth() / 3)*3).getTime();

            if (!scores[r.retailer]) scores[r.retailer] = [];

            let periodScores = scores[r.retailer].find(i => i.start == anchorDate);
            if (!periodScores) scores[r.retailer].push(periodScores = {start: anchorDate, values: {}});

            r.items.forEach(i => {
                const category = props.getCategory(i) || (props.displayUndefined ? 'undefined' : undefined);
                if (category) {
                    const value = i.amount;
                    if (periodScores!.values[category]) periodScores!.values[category] += value;
                    else periodScores!.values[category] = value;

                    // keep count of total
                    if (categories[category]) categories[category]++;
                    else categories[category] = value;
                }
            })
        });

        return [scores, categories];
    }, [props.receipts]);

    useEffect(() => {

        const series: SeriesOption[] = [
        ];

        Object.entries(periodicRetailerScores).forEach(([retailer, preiodicScores]) => {
            for (const name of Object.keys(allCategories))
                series.push(  {
                    zlevel: 10,
                    datasetId: retailer,
                    stack: retailer,
                    tooltip: {},
                    name,
                    type: 'bar',
                    barWidth: '95%',
                    barGap: '-20',
                    encode: {
                        x: 'start',
                        y: name,
                        itemId: [0,1],
                        //itemName: [0, 1],
                        //seriesName: 'retailerId',
                    }
                })
        });

        if (eChartsRef && eChartsRef.current) {
            const dataset = Object.entries(periodicRetailerScores).map(([retailer, periodicScores]) => ({
                    id: retailer,
                    dimensions: ['retailerId', 'start', ...Object.keys(allCategories)],
                    source: periodicScores.map(ps => ({start: ps.start, ...ps.values}))
                }));

            eChartsRef.current?.getEchartsInstance().setOption({
                    dataset,
                    series
                } as EChartsOption,
                // see https://github.com/apache/echarts/issues/6202#issuecomment-974761211
                {replaceMerge: ['series']});
        }

        /*
        return [
            sortedReceipts,
            mvgAvg,
            weeklySums
        ]

         */
    }, [periodicRetailerScores, allCategories, chartOptions, eChartsRef.current]);

    const eventHandlers = useMemo(() => ({ /*
        'click': (evt: any) => {
            if (evt.value.receipts) {
                navigate('../receipts/'+evt.value.receipts[0])
            }
            //console.log(JSON.stringify(evt, getCircularReplacer()));
        }
    */ }), []);

    return <Card className="card"><CardContent>
        <ReactEcharts theme={ctx.theme == 'dark' ? 'dark' : undefined} option={chartOptions} onEvents={eventHandlers}
                      ref={eChartsRef}/></CardContent>
    </Card>
}



export default ScoresPanel;