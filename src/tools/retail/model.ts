
export type Article = {
    label: string;
    ean: string;
    vendorIds: Record<string, string>;

    off?: {
       escore: string;
       nscore: string;
       // TODO
    }
}

export {VendorArticle, ReceiptItem, Receipt} from "../../ldo/retail.typings";

import {Receipt, ReceiptItem} from "../../ldo/retail.typings";

export type ReceiptWithRetailer = Receipt & { retailer: string };

export type ReceiptItemWithReceipt = ReceiptItem & {
    receiptId: string
}

export type ItemWithHistory = {
    id: string,
    label: string,
    ean?: string,
    history: ReceiptItemWithReceipt[]
}