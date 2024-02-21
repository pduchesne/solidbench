import * as React from "react";
import Dropzone from "react-dropzone";
import {useMemo, useState} from "react";
import { GlobalWorkerOptions} from 'pdfjs-dist';
// @ts-ignore
import PdfjsWorker from "pdfjs-dist/build/pdf.worker.js";

GlobalWorkerOptions.workerSrc = PdfjsWorker;

import {PromiseContainer} from "@hilats/react-utils";
import {TextItem} from "pdfjs-dist/types/src/display/api";
import {Box, Pagination, Switch, Tab} from "@mui/material";
import { parsePdfData, reduceItems} from "./colruyt/parser";

import {TabContext, TabList, TabPanel} from '@mui/lab';
import ReactEcharts from "echarts-for-react";
import {EChartsOption} from 'echarts';
import {Purchase, Receipt} from "./model";


export const ColruytPanel = () => {

    const [pdfBlob, setPdfBlob] = useState<Blob>();

    const pdf$ = useMemo(() => {
        if (pdfBlob) {
            return parsePdfData(pdfBlob);
        } else return undefined;
    }, [
        pdfBlob
    ]);


    return <>
        <div style={{flex: 'none'}}>Colruyt</div>
        {
            pdf$ ?
                <PromiseContainer promise={pdf$}>
                    {(pdf) => <ShoppingDashboard receipts={pdf.receipts} textItems={pdf.pageItems}/>}
                </PromiseContainer> :
                <Dropzone onDrop={acceptedFiles => setPdfBlob(acceptedFiles[0])}>
                    {({getRootProps, getInputProps}) => (
                        <section>
                            <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <p>Drag 'n' drop some files here, or click to select files</p>
                            </div>
                        </section>
                    )}
                </Dropzone>
        }

    </>
}


export const PdfItemsTable = (props: { items: Array<TextItem> }) => {

    const [reduce, setReduce] = useState<boolean>(false)
    const items = useMemo(() => {
        return reduce ? reduceItems(props.items, true) : props.items
    }, [props.items, reduce])

    const [page, setPage] = useState(1);

    return <div>
        <Switch onChange={(e) => setReduce(e.target.checked)} checked={reduce}/>
        <Pagination count={items.length % 100} siblingCount={1} boundaryCount={1}
                    onChange={(e, value) => setPage(value)}/>
        <div style={{padding: 10}}>
            <table>
                <tbody>
                {items.slice((page - 1) * 100, (page) * 100).map(item => (
                    <tr>{Object.entries(item).map(([key, value]) => <td>{JSON.stringify(value)}</td>)}</tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>


    return <div>
        <Switch onChange={(e) => setReduce(e.target.checked)} checked={reduce}/>
        <table>
            {(reduce ? reduceItems(props.items, true) : props.items).map(item => (
                <tr>{Object.entries(item).map(([key, value]) => <td>{JSON.stringify(value)}</td>)}</tr>
            ))}
        </table>
    </div>
}


export const ShoppingDashboard = (props: { receipts: Array<Receipt>, textItems: Array<TextItem> }) => {

    const [tab, setTab] = useState('0');

    return <Box className="vFlow">
        <TabContext value={tab}>
            <Box sx={{borderBottom: 1, borderColor: 'divider', flex: 'none'}}>
                <TabList onChange={(e, value) => setTab(value)} aria-label="lab API tabs example">
                    <Tab label="Dashboard" value="0"/>
                    <Tab label="Receipts" value="1"/>
                    <Tab label="Frequent Items" value="2"/>
                    <Tab label="Expenses" value="3"/>
                    <Tab label="Text Items" value="4"/>
                </TabList>
            </Box>
            <TabPanel value="0" className='vFlow'><Dashboard receipts={props.receipts}/></TabPanel>
            <TabPanel value="1" className='vFlow'><ReceiptsTable receipts={props.receipts}/></TabPanel>
            <TabPanel value="2" className='vFlow'><ItemsTable receipts={props.receipts}/></TabPanel>
            <TabPanel value="3" className='vFlow'><Expenses receipts={props.receipts}/></TabPanel>
            <TabPanel value="4" className='vFlow'>
                <PdfItemsTable items={props.textItems}/>
            </TabPanel>
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
                    <td>{i.articleId}</td>
                    <td>{i.label}</td>
                </tr>)}
            </table>
        </div>
    </div> : null
}


export const Dashboard = (props: { receipts: Array<Receipt> }) => {

    const items = useMemo(() => {
        const items: Record<string, { id: string, label: string, history: Purchase[] }> = {};
        props.receipts.forEach(r => {
            r.items.forEach(i => {
                if (i.articleId in items) {
                    items[i.articleId].history.push(i);
                } else {
                    items[i.articleId] = {
                        id: i.articleId,
                        label: i.label,
                        history: [i]
                    }
                }
            })
        });

        return Object.values(items).sort((i1, i2) => i2.history.length - i1.history.length)
    }, [props.receipts]);

    const oldfavorites = useMemo(() => {
        return items.filter(i => i.history.length > 8 && (new Date().getTime() - new Date(i.history[i.history.length -1].date).getTime()) > 365*24*3600*1000).sort((i1, i2) => i2.history.length - i1.history.length)
    }, [items]);

    return <div>
        <h2>Old time favorites</h2>
        <div>
            {oldfavorites.slice(0, 10).map(i => (<div>{i.label} [{i.history.length}] [{i.history[i.history.length - 1].date}]</div>))}
        </div>
    </div>
}

export const ItemsTable = (props: { receipts: Array<Receipt> }) => {

    const [selectedItem, setSelectedItem] = useState(0);

    const [items, sortedReceipts] = useMemo(() => {
        const items: Record<string, { id: string, label: string, history: Purchase[] }> = {};
        props.receipts.forEach(r => {
            r.items.forEach(i => {
                if (i.articleId in items) {
                    items[i.articleId].history.push(i);
                } else {
                    items[i.articleId] = {
                        id: i.articleId,
                        label: i.label,
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
            {items.map((i, idx) => <div onClick={() => setSelectedItem(idx)}>{i.label} [{i.history.length}]</div>)}
        </div>
        <div style={{flex: 3}}>
            <h2><a href={'https://www.colruyt.be/fr/produits/' + items[selectedItem].id}>{items[selectedItem].label}</a>
            </h2>
            <ReactEcharts option={chartOptions}/>
        </div>
    </div>
}


const AVG_SPAN = 4*30*24*60*60*1000;

export const Expenses = (props: { receipts: Array<Receipt> }) => {

    const [sortedReceipts, mvgAvg] = useMemo(() => {
        const sortedReceipts = props.receipts.sort((r1, r2) => r1.date.localeCompare(r2.date));
        const mvgAvg = sortedReceipts.map( (r, idx) => {
                let total = 0;
                let count = 0;
                for (;
                    (idx-count) >= 0 &&
                    new Date(sortedReceipts[idx].date).getTime() - new Date(sortedReceipts[idx-count].date).getTime() < AVG_SPAN;
                    count ++) {
                    total += sortedReceipts[idx-count].totalAmount;
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