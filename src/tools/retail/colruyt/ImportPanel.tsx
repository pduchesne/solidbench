import {useMemo, useState} from "react";
import {parsePdfData, reduceItems} from "./parser";
import {PromiseContainer} from "@hilats/react-utils";
import {TextItem} from "pdfjs-dist/types/src/display/api";
import {Button, Pagination, Switch} from "@mui/material";
import * as React from "react";
import {ReceiptsTable} from "../index";
import {Receipt} from "../model";

export const ColruytPanel = (props: { blob: Blob , saveReceipts: (receipts: Receipt[]) => void}) => {

    const pdf$ = useMemo(() => {
        return parsePdfData(props.blob);
    }, [
        props.blob
    ]);

    return <>
        <h3>Colruyt Import</h3>
        <PromiseContainer promise={pdf$}>
            {(pdf) => <div>
                {pdf.receipts.length} receipts <Button onClick={() => props.saveReceipts(pdf.receipts)}>Save</Button>
                <ReceiptsTable receipts={pdf.receipts}/>
            </div>}
        </PromiseContainer>
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