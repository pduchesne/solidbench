import {BlobReader, TextWriter, ZipReader} from "@zip.js/zip.js";
import {parse} from "csv-parse/browser/esm/sync";
import {Receipt, ReceiptItem} from "../../model";

export async function parseZipExport(data: Blob) {

    const zipDataReader = new BlobReader(data);
    const zipReader = new ZipReader(zipDataReader);

    const orderHistoryEntries = (await zipReader.getEntries()).filter(e => e.filename.startsWith('Retail.OrderHistory') && e.filename.endsWith('.csv'));

    const receipts: Record<string, Receipt> = {};

    for (let orderHistoryEntry of orderHistoryEntries) {
        if (orderHistoryEntry.getData) {

            const parseRecord = (record: any[]) => {
                const receiptId = record[1];

                const shippingCosts = parseFloat(record[7]);

                const item: ReceiptItem = {
                    quantity: parseFloat(record[14]),
                    //date: record[2],
                    unitPrice: parseFloat(record[5]) + parseFloat(record[6]),
                    amount: parseFloat(record[9]) - shippingCosts, // substract shipping - to be added to receipt
                    article: {
                        label: record[23],
                        vendorId: record[12]
                    }
                }

                let receipt: Receipt;

                if (receiptId in receipts) {
                    receipt = receipts[receiptId];
                } else {
                    receipt = {
                        id: receiptId,
                        date: record[2],
                        items: [],
                        store: {
                            id: "amazon:"+record[0],
                            name: record[0]
                        },
                        amount: 0,
                        shippingCosts: 0
                    };
                    receipts[receiptId] = receipt;
                }

                receipt.items.push(item);
                receipt.shippingCosts += shippingCosts;
                receipt.amount += item.amount + shippingCosts
            }

            /*
            const parser = parse({delimiter: ',', relaxQuotes: true});

            parser.on('readable', function(){
                let record;

                while ((record = parser.read()) !== null) {
                    parseRecord(record)
                }
            });

            const webParser = Duplex.toWeb(parser);
            await orderHistoryEntry.getData(webParser);
            parser.end();

             */


            const textWriter = new TextWriter();
            const csvEntryText = await orderHistoryEntry.getData(textWriter);
            const csvRecords: any[] = parse(csvEntryText, {delimiter: ',', relaxQuotes: true, skipEmptyLines: true});

            csvRecords.slice(1).forEach(parseRecord);
        }
    }

    return Object.values(receipts).sort((r1, r2) => r1.date.localeCompare(r2.date))
}