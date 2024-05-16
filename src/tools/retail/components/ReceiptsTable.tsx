import * as React from "react";
import {Receipt} from "../model";
import {Route, Routes, useParams} from "react-router-dom";
import {useNavigate} from "react-router";
import {FormattedDate} from "./Overview";
import Pagination from "@mui/material/Pagination/Pagination";


export const ReceiptsTableRoutes = (props: { receipts: Array<Receipt> }) => {
    return <Routes>
        <Route path="/:receiptId" element={<ReceiptsTable {...props} />} />
        <Route path="*" element={<ReceiptsTable {...props} />} />
    </Routes>
}


export const ReceiptsTable = (props: { receipts: Array<Receipt> }) => {

    let { receiptId : pathReceiptId } = useParams();
    const navigate = useNavigate();

    const receiptIdx = pathReceiptId ? props.receipts.findIndex(r => r.receiptId == pathReceiptId) : 0;
    const r = receiptIdx >=0 ? props.receipts[receiptIdx] : undefined;

    return r ? <div className="receiptsTable">
        <Pagination count={props.receipts.length} siblingCount={1} boundaryCount={1} page={receiptIdx+1}
                    onChange={(e, page) => navigate((pathReceiptId? '../' : '') + props.receipts[page - 1].receiptId)}/>
        <div style={{padding: 10}}>
            <h2><FormattedDate isoDate={r.date} /> €{r.totalAmount} {r.storeName} ({r.storeId})</h2>
            <table>
                <thead>
                <th>Quant</th>
                <th>Unit price</th>
                <th>Price</th>
                <th>Vnd Id</th>
                <th>Label</th>
                </thead>
                <tbody>{r.items?.map((i, idx) =>
                    <tr key={idx} onClick={() => navigate('../../frequent/'+i.article.vendorId)}>
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

export default ReceiptsTableRoutes;