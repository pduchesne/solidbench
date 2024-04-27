import {TextItem, TextMarkedContent, TypedArray} from "pdfjs-dist/types/src/display/api";
import {assert} from "@hilats/utils";
import {getDocument, PDFDocumentProxy} from "pdfjs-dist";
import {Receipt, ReceiptItem} from "../../model";

function findNextReceiptIdx(items: Array<TextItem>, offset: number = 0) {
    return items.findIndex((i, idx) => idx >= offset && i.str.startsWith('Ticket de caisse '));
}

function cellMiddleY(item: TextItem) {
    return item.transform[5] + (item.height / 2);
}

function cellMiddleX(item: TextItem) {
    return item.transform[4] + (item.width / 2);
}

function parseLocaleNumber(str: string) {
    return parseFloat(str.replace(/\./g, "").replace(/\,/g, "."));
}

function parseLocaleDate(str: string) {
    // TODO use moment.js for generic locale date parsing

    // parse as DD/MM/YYYY
    const [DD, MM, YYYY] = str.split('/').map((n) => parseInt(n));
    return new Date(YYYY, MM, DD);
}

export function parseDoc(items: Array<TextItem>): Receipt[] {
    let nextReceiptIdx = -1;

    const receipts: Receipt[] = [];
    let currentOffset = 0;
    while ( (nextReceiptIdx = findNextReceiptIdx(items, currentOffset)) >= 0) {
        const [receipt, nextOffset] = parseReceipt(items, nextReceiptIdx);
        receipts.push(receipt);
        currentOffset = nextOffset;
    }

    return receipts;
}

function parseReceipt(textItems: Array<TextItem>, startOffset: number): [Receipt, number] {

    let currentOffset = startOffset;

    const receiptId = textItems[currentOffset].str.split(' ').pop();
    assert(receiptId, 'Receipt ID is undefined');

    const receipt: Receipt = {
        receiptId,
        date: '',
        items: [],
        //returnedBottles: 0,
        storeId: '',
        storeName: '',
        totalAmount: 0,
        shippingCosts: 0
    }

    try {

        const headerMiddleY = cellMiddleY(textItems[++currentOffset]);
        let headerIdx = 0;
        const headers: Array<{ label: string, middleX: number, width: number }> = [];
        while (Math.abs(cellMiddleY(textItems[currentOffset + headerIdx]) - headerMiddleY) < 0.1) {
            // TODO assert column names
            headers.push({
                label: textItems[currentOffset + headerIdx].str,
                middleX: cellMiddleX(textItems[currentOffset + headerIdx]),
                width: textItems[currentOffset + headerIdx].width
            });
            headerIdx++;
        }

        currentOffset += headerIdx;

        function isSameColumn(item1: TextItem, item2: TextItem) {
            return Math.abs(cellMiddleX(item1) - cellMiddleX(item2)) < 0.1;
        }

        function isColumn(item: TextItem, headerIdx: number) {
            return Math.abs(headers[headerIdx].middleX - cellMiddleX(item)) < 0.1;
        }

        //let rowIdx = 0;
        let currentMiddleY = cellMiddleY(textItems[currentOffset]);
        let currentItem: ReceiptItem = {
            quantity: 0,
            unitPrice: 0,
            amount: 0,
            date: '',
            article: {label: '', vendorId: ''}
        };

        for (; headerIdx < textItems.length; currentOffset++) {

            const currentTextItem = textItems[currentOffset]
            const nextTextItem = textItems[currentOffset + 1];

            if (currentTextItem.str.toLowerCase().startsWith('reduction publi'))
                break;

            const middleY = cellMiddleY(currentTextItem);
            if (Math.abs(middleY - currentMiddleY) > 10) {
                receipt.items.push(currentItem);
                currentItem = {
                    article: {label: '', vendorId: ''},
                    quantity: 0,
                    unitPrice: 0,

                    amount: 0,
                    date: receipt.date
                };
                currentMiddleY = middleY;
            } else if (isSameColumn(currentTextItem, nextTextItem)) {
                currentTextItem.str += ' ' + nextTextItem.str;
                //currentTextItem.width += nextTextItem.width /* + space width ? */;
                currentTextItem.transform[5] = (currentTextItem.transform[5] + nextTextItem.transform[5])/2;
                currentOffset++;
            }

            if (isColumn(currentTextItem, 0)) {
                // Date
                receipt.date = currentItem.date = parseLocaleDate(currentTextItem.str).toISOString();
            }

            else if (isColumn(currentTextItem, 1))
                // Store ID
                receipt.storeId = currentTextItem.str;

            else if (isColumn(currentTextItem, 2))
                // Store Name
                receipt.storeName = currentTextItem.str;

            else if (isColumn(currentTextItem, 3))
                // Article ID
                currentItem.article.vendorId = currentTextItem.str;

            else if (isColumn(currentTextItem, 4))
                // Article Label
                currentItem.article.label = currentTextItem.str;

            else if (isColumn(currentTextItem, 5))
                // Coupon
                {}//TODO currentItem.coupon = currentTextItem.str;

            else if (isColumn(currentTextItem, 6))
                // Quantity
                currentItem.quantity = parseLocaleNumber(currentTextItem.str);

            else if (isColumn(currentTextItem, 7))
                // Unit price
                currentItem.unitPrice = parseLocaleNumber(currentTextItem.str);

            else if (isColumn(currentTextItem, 8))
                // Discount
                {}//TODO currentItem.discount = parseLocaleNumber(currentTextItem.str);

            else if (isColumn(currentTextItem, 9))
                // Amount
                currentItem.amount = parseLocaleNumber(currentTextItem.str);
        }

        assert(textItems[currentOffset].str.toLowerCase().startsWith('reduction publi'), "Unexpected cell: "+textItems[currentOffset].str);

        assert(textItems[++currentOffset].str.toLowerCase().startsWith('vidanges'), "Unexpected cell: "+textItems[currentOffset].str);
        //receipt.returnedBottles = parseLocaleNumber(textItems[currentOffset].str.split(':').pop()!);

        assert(textItems[++currentOffset].str.toLowerCase().startsWith('facture'), "Unexpected cell: "+textItems[currentOffset].str);

        assert(textItems[++currentOffset].str.toLowerCase().startsWith('total'), "Unexpected cell: "+textItems[currentOffset].str);
        receipt.totalAmount = parseLocaleNumber(textItems[currentOffset].str.split(':').pop()!);
    } catch (err) {
        console.warn(err);
    }


    return [receipt, currentOffset];
}


function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
    return 'transform' in item;
}

export function reduceItems(items: Array<TextItem>, collapseEOL?: boolean) {
    const firstPass: Array<TextItem> = [];

    items.forEach((i, idx) => {

        //const prevOriginalItem = idx > 0 && items[idx-1];
        const prevItem = firstPass.length > 0 && firstPass[firstPass.length - 1];

        if (prevItem) {
            // this is a whitespace chunk with an abnormal width
            // probably a column separator, ignore it
            if (!i.hasEOL && i.str.trim().length == 0 && i.width > 6 * i.str.length) {
                return;
            }

            // item on same baseline and is adjacent to previous one, without white space
            if (!prevItem.hasEOL && i.transform[5] == prevItem.transform[5] && Math.abs(prevItem.transform[4] + prevItem.width - i.transform[4]) < 0.01) {
                prevItem.str += i.str;
                prevItem.hasEOL = i.hasEOL;
                prevItem.width += i.width;
                prevItem.height = Math.max(prevItem.height, i.height);
                return;
            }
        }

        if (i.width > 0 || i.hasEOL)
            firstPass.push({...i, transform: [...i.transform]});

    });

    const secondPass: Array<TextItem> = [];

    firstPass.forEach((i, idx) => {
        const prevItem = secondPass.length > 0 ? secondPass[secondPass.length - 1] : undefined;

        // previous item has EOL --> merge with a whitespace
        if (prevItem?.hasEOL && collapseEOL && prevItem.transform[5] > i.transform[5] && Math.abs(prevItem.transform[5] - i.transform[5]) < 1.3 * i.height) {
            prevItem.str = (prevItem.str + ' ' + i.str).trim();
            prevItem.hasEOL = i.hasEOL;
            prevItem.width = (Math.max(prevItem.transform[4] + prevItem.width, i.transform[4] + i.width)) - (Math.min(prevItem.transform[4], i.transform[4]));
            prevItem.transform[4] = Math.min(prevItem.transform[4], i.transform[4]);
            prevItem.height = Math.max(prevItem.transform[5] + prevItem.height, i.transform[5] + i.height) - Math.min(prevItem.transform[5], i.transform[5]);
            prevItem.transform[5] = Math.min(prevItem.transform[5], i.transform[5]);

            return;
        }

        /*
        const nextItem = firstPass[idx + 1];
        // it's one of these case where the EOL char has been sent to the next line already --> merge it with the upper line
        if (prevItem && !prevItem.hasEOL && i?.hasEOL && collapseEOL && i.height == 0 && i.width == 0 && i.str.length == 0 && nextItem && i.transform[5] == nextItem.transform[5]) {
            prevItem.hasEOL = i.hasEOL;

            return;
        }
         */

        secondPass.push({...i, transform: [...i.transform]});
    });

    return secondPass.filter(i => i.str.trim().length);
}

export async function aggregatePages(doc: PDFDocumentProxy) {
    const items: TextItem[] = [];

    for (let idx = 1; idx <= doc.numPages; idx++) {
        const page = await doc.getPage(idx);
        const content = await page.getTextContent();

        items.push(...content.items.filter(isTextItem));
    }

    return items;
}

export async function parsePdfData(data: Blob | string | URL | TypedArray | ArrayBuffer) {
    if (data instanceof Blob)
        data = await data.arrayBuffer();

    const doc = await getDocument(data).promise;
    const pageItems = await aggregatePages(doc);
    const receipts = parseDoc(reduceItems(pageItems, true));

    return {
        receipts,
        doc,
        pageItems
    };
}