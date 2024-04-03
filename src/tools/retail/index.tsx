import * as React from "react";
import {FC, useCallback, useContext, useEffect, useMemo, useState} from "react";
import {GlobalWorkerOptions} from 'pdfjs-dist';
// @ts-ignore
import PdfjsWorker from "pdfjs-dist/build/pdf.worker.js";

GlobalWorkerOptions.workerSrc = PdfjsWorker;

import {Box, Chip, Input, MenuItem, OutlinedInput, Pagination, Select, Tab} from "@mui/material";

import {TabContext, TabList, TabPanel} from '@mui/lab';
import ReactEcharts from "echarts-for-react";
import {EChartsOption, registerTheme} from 'echarts';
import {Receipt, ReceiptItem} from "./model";
import {RetailStorage} from "./storage";
import {useSession} from "@inrupt/solid-ui-react";
import {AppContext} from "../../appContext";
import {ErrorBoundary, PromiseContainer} from "@hilats/react-utils";
import {ColruytPanel} from "./colruyt/ImportPanel";
import Dropzone from "react-dropzone";
import classNames from "classnames";
import {AmazonPanel} from "./amazon/ImportPanel";
import {DelhaizePanel} from "./delhaize/ImportPanel";

import echartsDarkTheme from './echarts_dark.json';

registerTheme('dark', echartsDarkTheme)
/**
 * Import UI components for specific retailers
 */
const RETAILERS: Record<string, {
    label: string,
    comp: FC<{ blob: Blob, onImport: (receipts: Receipt[]) => void }>
}> = {
    colruyt: {
        label: "Colruyt",
        comp: ColruytPanel
    },
    delhaize: {
        label: "Delhaize",
        comp: DelhaizePanel
    },
    amazon: {
        label: "Amazon",
        comp: AmazonPanel
    }
}

type ReceiptWithRetailer = Receipt & { retailer: string };

export const RetailDashboard = () => {

    const {fetch} = useSession();
    const appContext = useContext(AppContext);

    const retailStorage = useMemo(() => appContext.podUrl ? new RetailStorage(appContext.podUrl, {fetch}) : undefined, [appContext.podUrl, fetch]);
    //const preferences$ = useMemo(() => retailStorage?.fetchPreferences(), [retailStorage]);


    const [upload, setUpload] = useState<{ retailer: string, blob: Blob } | { retailer?: undefined }>({});
    const UploadComp = upload.retailer && RETAILERS[upload.retailer].comp;

    const importCallback = useCallback((receipts: Receipt[]) => {
        (upload.retailer && retailStorage) && retailStorage.saveHistory(upload.retailer, receipts);
    }, [retailStorage, upload.retailer]);

    return <div className="retail">
        <div className="hFlow dataproviders">
            {Object.entries(RETAILERS).map(([retailer, config]) => {
                return <div key={retailer}
                            className={classNames('providerCard', {'selected': upload.retailer == retailer})}>
                    {config.label}
                    <FileDrop onData={(blob) => setUpload({retailer, blob})}/>
                </div>
            })}
        </div>
        {UploadComp ?
            /* *Display retailer importer */
            <div className="uploader"><UploadComp blob={upload.blob} onImport={importCallback}/></div> :

            /* Display currenty history*/
            <ErrorBoundary>
                {retailStorage ? <ShoppingDashboardContainer retailStorage={retailStorage}/> : null}
            </ErrorBoundary>
        }
    </div>
}


export const FileDrop = (props: { onData: (blob: Blob) => void }) => {

    return <>
        <Dropzone onDrop={acceptedFiles => props.onData(acceptedFiles[0])}>
            {({getRootProps, getInputProps}) => (
                <section>
                    <div {...getRootProps()}>
                        <input {...getInputProps()} />
                        <p>Drag 'n' drop some files here, or click to select files</p>
                    </div>
                </section>
            )}
        </Dropzone>
    </>
}


export const ShoppingDashboardContainer = (props: { retailStorage: RetailStorage }) => {


    // TODO const history$ = useMemo(async () => selectedRetailers.length ? Promise.all(selectedRetailers.map(retailer => props.retailStorage.fetchHistory(retailer))) : [] as Receipt[][], [props.retailStorage, selectedRetailers]);
    const histories$ = useMemo(async () => {
            const retailers = await props.retailStorage.listRetailers();
            const histories = await props.retailStorage.fetchHistory(retailers)
                .then(receiptMap => Object.entries(receiptMap).reduce<ReceiptWithRetailer[]>((result, [retailer, receipts]) => {
                    result.push(...receipts.map<ReceiptWithRetailer>(r => ({...r, retailer})));
                    return result;
                }, []))

            return [retailers, histories] as [string[], ReceiptWithRetailer[]];
        },
        [props.retailStorage]);

    return <div>
        <PromiseContainer promise={histories$}>{([retailers, histories]) => retailers ?
            <ShoppingDashboard receipts={histories} retailers={retailers}/> :
            <div>No retailer history found</div>}
        </PromiseContainer></div>

}


export const ShoppingDashboard = (props: { receipts: Array<ReceiptWithRetailer>, retailers: string[] }) => {

    const [tab, setTab] = useState('0');

    const [selectedRetailers, setSelectedRetailers] = useState<string[]>(props.retailers);

    const receipts = useMemo(() => {
        return props.receipts.filter(r => selectedRetailers.indexOf(r.retailer) >= 0);
    }, [props.receipts, selectedRetailers])

    return <div>
        <Select
            multiple
            value={selectedRetailers}
            onChange={(evt) => setSelectedRetailers(typeof evt.target.value === 'string' ? evt.target.value.split(',') : evt.target.value)}
            input={<OutlinedInput id="select-multiple-chip" label="Retailer"/>}
            renderValue={(selected) => (
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                    {selectedRetailers.map((value) => (
                        <Chip key={value} label={value}/>
                    ))}
                </Box>
            )}
        >
            {props.retailers.map((name) => (
                <MenuItem
                    key={name}
                    value={name}
                >
                    {name}
                </MenuItem>
            ))}
        </Select>
        <Box className="vFlow">
            <TabContext value={tab}>
                <Box sx={{borderBottom: 1, borderColor: 'divider', flex: 'none'}}>
                    <TabList onChange={(e, value) => setTab(value)} aria-label="lab API tabs example">
                        <Tab label="Dashboard" value="0"/>
                        <Tab label="Receipts" value="1"/>
                        <Tab label="Frequent Items" value="2"/>
                        <Tab label="Expenses" value="3"/>
                    </TabList>
                </Box>
                <TabPanel value="0" className='vFlow'><Dashboard receipts={receipts}/></TabPanel>
                <TabPanel value="1" className='vFlow'><ReceiptsTable receipts={receipts}/></TabPanel>
                <TabPanel value="2" className='vFlow'><ItemsTable receipts={receipts}/></TabPanel>
                <TabPanel value="3" className='vFlow'><Expenses receipts={receipts}/></TabPanel>
            </TabContext>
        </Box></div>

}


export const ReceiptsTable = (props: { receipts: Array<Receipt> }) => {

    const [page, setPage] = useState(1);
    const r = props.receipts[page - 1];

    return r ? <div>
        <Pagination count={props.receipts.length} siblingCount={1} boundaryCount={1}
                    onChange={(e, value) => setPage(value)}/>
        <div style={{padding: 10}}>
            <h2>{r.date} €{r.totalAmount} {r.storeName} ({r.storeId})</h2>
            <table>
                <tbody>{r.items?.map((i, idx) =>
                    <tr key={idx}>
                        <td>{i.quantity}</td>
                        <td>{i.unitPrice}</td>
                        <td>{i.amount}</td>
                        <td>{i.article.vendorId}</td>
                        <td>{i.article.label}</td>
                    </tr>)}
                </tbody>
            </table>
        </div>
    </div> : null
}


export const Dashboard = (props: { receipts: Array<Receipt> }) => {

    const items = useMemo(() => {
        const items: Record<string, { id: string, label: string, history: ReceiptItem[] }> = {};
        props.receipts.forEach(r => {
            r.items?.forEach(i => {
                if (i.article.vendorId in items) {
                    items[i.article.vendorId].history.push(i);
                } else {
                    items[i.article.vendorId] = {
                        id: i.article.vendorId,
                        label: i.article.label,
                        history: [i]
                    }
                }
            })
        });

        return Object.values(items).sort((i1, i2) => i2.history.length - i1.history.length)
    }, [props.receipts]);

    const oldfavorites = useMemo(() => {
        return items.filter(i => i.history.length > 8 && (new Date().getTime() - new Date(i.history[i.history.length - 1].date).getTime()) > 365 * 24 * 3600 * 1000).sort((i1, i2) => i2.history.length - i1.history.length)
    }, [items]);

    return <div>
        <h2>Old time favorites</h2>
        <div>
            {oldfavorites.slice(0, 10).map(i => (
                <div key={i.id}>{i.label} [{i.history.length}] [{i.history[i.history.length - 1].date}]</div>))}
        </div>
    </div>
}

export const ItemsTable = (props: { receipts: Array<Receipt> }) => {
    const ctx = useContext(AppContext);

    const [selectedItem, setSelectedItem] = useState(0);

    const [items, sortedReceipts] = useMemo(() => {
        const items: Record<string, { id: string, label: string, ean?: string, history: ReceiptItem[] }> = {};
        props.receipts.forEach(r => {
            r.items?.forEach(i => {
                if (i.article.vendorId in items) {
                    items[i.article.vendorId].history.push(i);
                } else {
                    items[i.article.vendorId] = {
                        id: i.article.vendorId,
                        label: i.article.label,
                        ean: i.article.ean,
                        history: [i]
                    }
                }
            })
        });

        return [
            Object.values(items).sort((i1, i2) => i2.history.length - i1.history.length),
            props.receipts.sort((r1, r2) => r1.date.localeCompare(r2.date))
        ]
    }, [props.receipts]);

    const chartOptions = useMemo(() => {
        const options: EChartsOption = {
            legend: {},
            tooltip: {
                trigger: 'axis',
            },
            xAxis: {
                type: 'time',
                min: sortedReceipts[0].date,
                max: sortedReceipts[props.receipts.length - 1].date
                //boundaryGap: false
            },
            yAxis: [{
                name: 'Quantity',
                type: 'value',
                position: 'left',
                //boundaryGap: [0, '100%']
            },
                {
                    name: 'Unit Price',
                    type: 'value',
                    position: 'right',
                    //boundaryGap: [0, '100%'],
                    axisLabel: {
                        formatter: '{value}€'
                    }
                }],
            series: [
                {
                    tooltip: {},
                    yAxisIndex: 1,
                    name: 'Unit Price',
                    type: 'line',
                    //smooth: true,
                    symbol: 'none',
                    data: items[selectedItem].history.map(h => [h.date, h.unitPrice])
                },
                {
                    name: 'Purchases',
                    type: 'bar',
                    yAxisIndex: 0,
                    data: items[selectedItem].history.map(h => [h.date, h.quantity])
                }
            ]
        };

        return options;
    }, [items, selectedItem]);


    return <div className='hFlow'>
        <div style={{flex: 1}}>
            {items.map((i, idx) => <div key={i.id}
                                        onClick={() => setSelectedItem(idx)}>{i.label} [{i.history.length}] {i.ean ? 'EAN' : null}</div>)}
        </div>
        <div style={{flex: 3}}>
            <h2><a href={'https://www.colruyt.be/fr/produits/' + items[selectedItem].id}>{items[selectedItem].label}</a>
            </h2>
            <div>
                EAN <Input value={items[selectedItem].ean}/>
            </div>
            <ReactEcharts theme={ctx.theme == 'dark' ? 'dark' : undefined} option={chartOptions}/>
        </div>
    </div>
}


const AVG_SPAN = 4 * 30 * 24 * 60 * 60 * 1000;

export const Expenses = (props: { receipts: Array<ReceiptWithRetailer> }) => {

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