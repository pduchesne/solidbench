import * as React from "react";
import {FC, useCallback, useContext, useMemo, useState} from "react";
import {GlobalWorkerOptions} from 'pdfjs-dist';
// @ts-ignore
import PdfjsWorker from "pdfjs-dist/build/pdf.worker.js";

GlobalWorkerOptions.workerSrc = PdfjsWorker;

import {Box, Input, Pagination, Tab} from "@mui/material";

import {TabContext, TabList, TabPanel} from '@mui/lab';
import ReactEcharts from "echarts-for-react";
import {EChartsOption} from 'echarts';
import {Receipt, ReceiptItem} from "./model";
import {RetailStorage} from "./storage";
import {useSession} from "@inrupt/solid-ui-react";
import {AppContext} from "../../appContext";
import {ErrorBoundary, PromiseContainer} from "@hilats/react-utils";
import {ColruytPanel} from "./colruyt/ImportPanel";
import Dropzone from "react-dropzone";
import classNames from "classnames";

/**
 * Import UI components for specific retailers
 */
const RETAILERS: Record<string, { label: string, comp: FC<{ blob: Blob, onImport: (receipts: Receipt[]) => void }> }> = {
    colruyt: {
        label: "Colruyt",
        comp: ColruytPanel
    },
    delhaize: {
        label: "Delhaize",
        comp: ColruytPanel
    },
    amazon: {
        label: "Amazon",
        comp: ColruytPanel
    }
}

export const RetailDashboard = () => {

    const {fetch} = useSession();
    const appContext = useContext(AppContext);

    const retailStorage = useMemo(() => appContext.podUrl ? new RetailStorage(appContext.podUrl, {fetch}) : undefined, [appContext.podUrl, fetch]);
    //const preferences$ = useMemo(() => retailStorage?.fetchPreferences(), [retailStorage]);

    // TODO allow selection of retailer - merge all retailers
    const history$ = useMemo(async () => retailStorage?.fetchHistory('colruyt'), [retailStorage]);

    const [upload, setUpload] = useState<{ retailer: string, blob: Blob } | { retailer?: undefined }>({});
    const UploadComp = upload.retailer && RETAILERS[upload.retailer].comp;

    const importCallback = useCallback((receipts: Receipt[]) => {
        (upload.retailer && retailStorage) && retailStorage.saveHistory(upload.retailer, receipts);
    }, [retailStorage, upload.retailer]);

    return <div className="retail">
        <div className="hFlow dataproviders">
            {Object.entries(RETAILERS).map(([retailer, config]) => {
                return <div className={classNames('providerCard', {'selected': upload.retailer == retailer})}>
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
            <PromiseContainer promise={history$}>{(history) => history ?
                <ShoppingDashboard receipts={history}/> :
                <div>No purchase history found</div>}
            </PromiseContainer>
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


export const ShoppingDashboard = (props: { receipts: Array<Receipt> }) => {

    const [tab, setTab] = useState('0');

    return <Box className="vFlow">
        <TabContext value={tab}>
            <Box sx={{borderBottom: 1, borderColor: 'divider', flex: 'none'}}>
                <TabList onChange={(e, value) => setTab(value)} aria-label="lab API tabs example">
                    <Tab label="Dashboard" value="0"/>
                    <Tab label="Receipts" value="1"/>
                    <Tab label="Frequent Items" value="2"/>
                    <Tab label="Expenses" value="3"/>
                </TabList>
            </Box>
            <TabPanel value="0" className='vFlow'><Dashboard receipts={props.receipts}/></TabPanel>
            <TabPanel value="1" className='vFlow'><ReceiptsTable receipts={props.receipts}/></TabPanel>
            <TabPanel value="2" className='vFlow'><ItemsTable receipts={props.receipts}/></TabPanel>
            <TabPanel value="3" className='vFlow'><Expenses receipts={props.receipts}/></TabPanel>
        </TabContext>
    </Box>
}


export const ReceiptsTable = (props: { receipts: Array<Receipt> }) => {

    const [page, setPage] = useState(1);
    const r = props.receipts[page - 1];

    return r ? <div>
        <Pagination count={props.receipts.length} siblingCount={1} boundaryCount={1}
                    onChange={(e, value) => setPage(value)}/>
        <div style={{padding: 10}}>
            <h2>{r.date} €{r.totalAmount} {r.storeName} ({r.storeId})</h2>
            <table>{r.items.map(i =>
                <tr>
                    <td>{i.quantity}</td>
                    <td>{i.unitPrice}</td>
                    <td>{i.amount}</td>
                    <td>{i.article.vendorId}</td>
                    <td>{i.article.label}</td>
                </tr>)}
            </table>
        </div>
    </div> : null
}


export const Dashboard = (props: { receipts: Array<Receipt> }) => {

    const items = useMemo(() => {
        const items: Record<string, { id: string, label: string, history: ReceiptItem[] }> = {};
        props.receipts.forEach(r => {
            r.items.forEach(i => {
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
                <div>{i.label} [{i.history.length}] [{i.history[i.history.length - 1].date}]</div>))}
        </div>
    </div>
}

export const ItemsTable = (props: { receipts: Array<Receipt> }) => {

    const [selectedItem, setSelectedItem] = useState(0);

    const [items, sortedReceipts] = useMemo(() => {
        const items: Record<string, { id: string, label: string, ean?: string, history: ReceiptItem[] }> = {};
        props.receipts.forEach(r => {
            r.items.forEach(i => {
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
            {items.map((i, idx) => <div
                onClick={() => setSelectedItem(idx)}>{i.label} [{i.history.length}] {i.ean ? 'EAN' : null}</div>)}
        </div>
        <div style={{flex: 3}}>
            <h2><a href={'https://www.colruyt.be/fr/produits/' + items[selectedItem].id}>{items[selectedItem].label}</a>
            </h2>
            <div>
                EAN <Input value={items[selectedItem].ean}/>
            </div>
            <ReactEcharts option={chartOptions}/>
        </div>
    </div>
}


const AVG_SPAN = 4 * 30 * 24 * 60 * 60 * 1000;

export const Expenses = (props: { receipts: Array<Receipt> }) => {

    const [sortedReceipts, mvgAvg] = useMemo(() => {
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

        return [
            sortedReceipts,
            mvgAvg
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
            series: [
                {
                    tooltip: {},
                    name: 'Amount',
                    type: 'bar',
                    //smooth: true,
                    //symbol: 'none',
                    data: sortedReceipts.map(r => [r.date, r.totalAmount])
                },
                {
                    tooltip: {},
                    name: '4-months Avg',
                    type: 'line',
                    smooth: true,
                    //symbol: 'none',
                    data: mvgAvg
                }
            ]
        };

        return options;
    }, [props.receipts]);


    return <div>
        <ReactEcharts option={chartOptions}/>
    </div>
}