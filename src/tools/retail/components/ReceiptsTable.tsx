import * as React from "react";
import {Route, Routes, useParams} from "react-router-dom";
import {FormattedDate} from "./Overview";
import Pagination from "@mui/material/Pagination/Pagination";
import {Receipt} from "../model";
import {usePersistentQueryNavigate} from "../../../ui/hooks";


export const ReceiptsTableRoutes = (props: { receipts: Array<Receipt> }) => {
    return <Routes>
        <Route path="/:receiptId" element={<RoutedReceiptsTable {...props} />} />
        <Route path="*" element={<RoutedReceiptsTable {...props} />} />
    </Routes>
}


export const RoutedReceiptsTable = (props: { receipts: Array<Receipt> }) => {

    let { receiptId : pathReceiptId } = useParams();
    const navigate = usePersistentQueryNavigate();

    return <ReceiptsTable receipts={props.receipts}
                          receiptId={pathReceiptId}
                          onChange={(id) => navigate((pathReceiptId? '../' : '') + encodeURIComponent(id))}
                          onItemSelect={(id) => navigate('../../frequent/'+encodeURIComponent(id))}
    />
}

export const ReceiptsTable = (props: { receipts: Array<Receipt>, receiptId?: string, onChange: (receiptId: string) => void, onItemSelect?: (itemId: string) => void }) => {

    const receiptIdx = props.receiptId ? props.receipts.findIndex(r => r.id == props.receiptId) : 0;
    const r = receiptIdx >=0 ? props.receipts[receiptIdx] : undefined;

    return r ? <div className="receiptsTable">
        <Pagination count={props.receipts.length} siblingCount={1} boundaryCount={1} page={receiptIdx+1}
                    onChange={(e, page) => props.onChange(props.receipts[page - 1].id)}/>
        <div style={{padding: 10}}>
            <h2><FormattedDate isoDate={r.date} /> €{r.amount} {r.store.name} ({r.store.id})</h2>
            <table>
                <tr>
                    <th>Quant</th>
                    <th>Unit price</th>
                    <th>Price</th>
                    <th>Vnd Id</th>
                    <th>Label</th>
                </tr>
                <tbody>{r.items?.map((i, idx) =>
                    <tr key={idx} onClick={() => props.onItemSelect && props.onItemSelect(i.article.vendorId)}>
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