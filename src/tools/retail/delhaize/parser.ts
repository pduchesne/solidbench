import {Receipt, ReceiptItem} from "../../../ldo/retail.typings";

import officeCrypto from "officecrypto-tool";
import readXlsxFile, {Row} from "read-excel-file";


function parseDate(dateStr: string, timeStr: string) {
    /*
    const year = parseInt(dateStr.substring(0,4));
    const month = parseInt(dateStr.substring(4, 7));
    const day = parseInt(dateStr.substring(7, 9));

     */

    return new Date(dateStr + " " + timeStr);
}

export async function parseXlsxExport(data: Blob | Buffer) {

    let buffer = data instanceof Buffer ? data : Buffer.from(await data.arrayBuffer());

    const isEncrypted = officeCrypto.isEncrypted(buffer);

    if (isEncrypted) {
        buffer = await officeCrypto.decrypt(buffer, {password: 'g4qMBh'});
    }

    // [
    //   null,
    //   "ticket_number",
    //   "date",
    //   "time",
    //   "store",
    //   "total",
    //   "number_of_items"
    // ]
    const receiptRows = await readXlsxFile(buffer, {sheet: 1});


    // [
    //   null,
    //   "ticket_number",
    //   "date",
    //   "time",
    //   "article",
    //   "department",
    //   "number_of_items",
    //   "amount"
    // ]
    const itemRows = await readXlsxFile(buffer, {sheet: 2});

    const receipts: Record<string, Receipt> = {};

    const parseItem = (record: Row) => {

        const [, receiptId, date, time, label, , quantity, amount] = record as [number, string, string, string, string, string, string, number];

        const utcTimestamp = parseDate(date, time).toISOString();

        const item: ReceiptItem = {
            quantity: parseFloat(quantity),
            date: utcTimestamp,
            unitPrice: amount / parseFloat(quantity),
            amount,
            article: {
                label,
                vendorId: label // TODO
            }
        }

        let receipt: Receipt;

        if (receiptId in receipts) {
            receipt = receipts[receiptId];
        } else {
            const store = receiptRows.find(r => r[1] == receiptId);
            const storeName = store![4] as string;

            receipt = {
                receiptId,
                date: utcTimestamp,
                items: [],
                storeId: storeName, // TODO
                storeName,
                totalAmount: 0,
                shippingCosts: 0
            };
            receipts[receiptId] = receipt;
        }

        receipt.items.push(item);
        receipt.totalAmount += item.amount
    }

    itemRows.slice(1).forEach(parseItem);


    return Object.values(receipts).sort((r1, r2) => r1.date.localeCompare(r2.date))
}