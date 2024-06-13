import { retail } from "@hilats/data-modules";

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

export type ReceiptWithRetailer = retail.Receipt & { retailer: string };

export type ReceiptItemWithReceipt = retail.ReceiptItem & {
    receiptId: string,
    date: string
}

export type ItemWithHistory = {
    id: string,
    label: string,
    gtin?: string,
    history: ReceiptItemWithReceipt[]
}

export type Receipt = retail.Receipt;
export type ReceiptItem = retail.ReceiptItem;
export type VendorArticle = retail.VendorArticle;