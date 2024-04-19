import {useState} from "react";
import {Pagination} from "@mui/material";
import * as React from "react";
import {Receipt} from "../model";

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

export default ReceiptsTable;