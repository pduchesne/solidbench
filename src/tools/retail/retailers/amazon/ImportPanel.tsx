import {useMemo, useState} from "react";
import {PromiseContainer} from "@hilats/react-utils";
import {Box, Button, Pagination, Switch, Tab} from "@mui/material";
import * as React from "react";
import {Receipt, VendorArticle} from "../../model";
import {parseZipExport} from "./parser";
import {TabContext, TabList, TabPanel} from "@mui/lab";

export const AmazonPanel = (props: { blob: Blob , onImport: (receipts: Receipt[]) => void}) => {

    const zipContent$ = useMemo(() => {
        return parseZipExport(props.blob);
    }, [
        props.blob
    ]);

    return <>
        <h3>Amazon Import</h3>
        <PromiseContainer promise={zipContent$}>
            {(receipts) => <AmazonImportResult receipts={receipts} onImport={props.onImport}/>}
        </PromiseContainer>
    </>
}

export const AmazonImportResult = (props: { receipts: Receipt[], onImport: (receipts: Receipt[]) => void}) => {

    const [tab, setTab] = useState('0');

    const uniqueItems = useMemo( () => {
        const items: Record<string, VendorArticle> = {};

        props.receipts.forEach(r => {
            r.items.forEach(i => {
                if (! (i.article.vendorId in items)) {
                    items[i.article.vendorId] = i.article
                }
            })
        })

        return items;
    }, [
        props.receipts
    ])

    return <Box className="vFlow">
        <div>
            <Button onClick={() => props.onImport(props.receipts)}>Save receipts</Button>
        </div>
        <TabContext value={tab}>
            <Box sx={{borderBottom: 1, borderColor: 'divider', flex: 'none'}}>
                <TabList onChange={(e, value) => setTab(value)} aria-label="lab API tabs example">
                    <Tab label="Receipts" value="0"/>
                    <Tab label="Items" value="1"/>
                </TabList>
            </Box>
            <TabPanel value="0" className='vFlow'><AmazonReceiptsTable receipts={props.receipts}/></TabPanel>
            <TabPanel value="1" className='vFlow'><AmazonArticlesTable articles={uniqueItems}/></TabPanel>
        </TabContext>
    </Box>
}

export const AmazonReceiptsTable = (props: { receipts: Array<Receipt>, lastUpdate?: number }) => {

    const [onlyNew, setOnlyNew] = useState(false);

    const showedReceipts = useMemo(() => props.receipts.filter(r => !props.lastUpdate || new Date(r.date).getTime() > props.lastUpdate), [onlyNew, props.lastUpdate, props.receipts])

    const [page, setPage] = useState(1);
    const r = showedReceipts[page - 1];

    return r ? <div>
        <div><Switch checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)}/></div>
        <Pagination count={showedReceipts.length} siblingCount={1} boundaryCount={1}
                    onChange={(e, value) => setPage(value)}/>
        <div style={{padding: 10}}>
            <h2>{r.storeName} ({r.storeId}) - {r.date} - €{r.totalAmount}</h2>
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


export const AmazonArticlesTable = (props: { articles: Record<string, VendorArticle> }) => {

    const [filterMissingEan, setFilterMissingEan] = useState(false);
    const [page, setPage] = useState(1);

    const filteredArticles = useMemo( () => Object.values(props.articles).filter(a => !filterMissingEan || !a.ean), [filterMissingEan, props.articles])

    const showedArticles = filteredArticles.slice( (page-1) * 25, (page) * 25);

    return <div>
        <div>
            <Switch checked={filterMissingEan} onChange={(e) => setFilterMissingEan(e.target.checked)}/>
        </div>
        <Pagination count={filteredArticles.length / 25} siblingCount={1} boundaryCount={1}
                    onChange={(e, value) => setPage(value)}/>
        <div style={{padding: 10}}>
            <table>{showedArticles.map(i =>
                <tr>
                    <td>{i.label}</td>
                    <td><a href={"https://fic.colruytgroup.com/productinfo/fr/cogo/"+i.vendorId} target="NEW">{i.vendorId}</a></td>
                    <td>{i.ean == null ? 'null' : i.ean}</td>
                </tr>)}
            </table>
        </div>
    </div>
}
