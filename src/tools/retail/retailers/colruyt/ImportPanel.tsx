import {useMemo, useState} from "react";
import {parsePdfData, reduceItems} from "./parser";
import {PromiseContainer} from "@hilats/react-utils";
import {TextItem} from "pdfjs-dist/types/src/display/api";
import Switch from "@mui/material/Switch/Switch";
import * as React from "react";
import {Receipt} from "../../model";
import {enrichArticlesFromCache} from "./services";
import Pagination from "@mui/material/Pagination/Pagination";
import {FileDrop, getUniqueItems, ImportResult} from "../../components/Import";

export const ColruytPanel = (props: { onImport: (receipts: Receipt[]) => void}) => {

    const [blob, setBlob] = useState<Blob>();

    const pdf$ = useMemo(() => {
        return blob && parsePdfData(blob).then(data => {
            const items = getUniqueItems(data.receipts);
            enrichArticlesFromCache(Object.values(items));

            return data;
        });

    }, [
        blob
    ]);

    return <>
        {pdf$ ?
        <PromiseContainer promise={pdf$}>
            {(pdf) => <ImportResult receipts={pdf.receipts} onImport={props.onImport}/>}
        </PromiseContainer> : <div className="dataprovider">
                <FileDrop onData={(blob) => setBlob(blob)} text="Drop or select your Colruyt PDF here" />
                <div>
                    Colruyt history data can be obtained by logging into your XTRA dashboard and going to the
                    <a href="https://profil.monxtra.be/manage-privacy/my-data/right-of-access">"My Data" tab</a> where
                    you can ask for your personal history to be sent by email.<br/>
                    Upon reception of the email after a few days, take the pdf and upload it in this panel.<br/><br/>
                </div>
            </div>}
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