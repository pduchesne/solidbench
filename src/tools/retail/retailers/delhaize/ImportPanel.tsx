import {useMemo, useState} from "react";
import {PromiseContainer} from "@hilats/react-utils";
import TabContext from "@mui/lab/TabContext/TabContext";
import TabList from "@mui/lab/TabList/TabList";
import TabPanel from "@mui/lab/TabPanel/TabPanel";
import Pagination from "@mui/material/Pagination/Pagination";
import Box from "@mui/material/Box/Box";
import Button from "@mui/material/Button/Button";
import Tab from "@mui/material/Tab/Tab";
import Switch from "@mui/material/Switch/Switch";
import * as React from "react";
import {Receipt, VendorArticle} from "../../model";
import {parseXlsxExport} from "./parser";

export const DelhaizePanel = (props: { blob: Blob , onImport: (receipts: Receipt[]) => void}) => {

    const zipContent$ = useMemo(() => {
        return parseXlsxExport(props.blob);
    }, [
        props.blob
    ]);

    return <>
        <h3>Delhaize Import</h3>
        <PromiseContainer promise={zipContent$}>
            {(receipts) => <DelhaizeImportResult receipts={receipts} onImport={props.onImport}/>}
        </PromiseContainer>
    </>
}

export const DelhaizeImportResult = (props: { receipts: Receipt[], onImport: (receipts: Receipt[]) => void}) => {

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
            <TabPanel value="0" className='vFlow'><DelhaizeReceiptsTable receipts={props.receipts}/></TabPanel>
            <TabPanel value="1" className='vFlow'><DelhaizeArticlesTable articles={uniqueItems}/></TabPanel>
        </TabContext>
    </Box>
}

export const DelhaizeReceiptsTable = (props: { receipts: Array<Receipt>, lastUpdate?: number }) => {

    const [onlyNew, setOnlyNew] = useState(false);

    const showedReceipts = useMemo(() => props.receipts.filter(r => !props.lastUpdate || new Date(r.date).getTime() > props.lastUpdate), [onlyNew, props.lastUpdate, props.receipts])

    const [page, setPage] = useState(1);
    const r = showedReceipts[page - 1];

    return r ? <div>
        <div><Switch checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)}/></div>
        <Pagination count={showedReceipts.length} siblingCount={1} boundaryCount={1}
                    onChange={(e, value) => setPage(value)}/>
        <div style={{padding: 10}}>
            <h2>{r.store.name} ({r.store.id}) - {r.date} - €{r.amount}</h2>
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


export const DelhaizeArticlesTable = (props: { articles: Record<string, VendorArticle> }) => {

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
