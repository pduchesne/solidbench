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

export type VendorArticle = {
    label: string;
    vendorId: string;
    ean?: string;
}
export type ReceiptItem = {
    date: string
    coupon?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    amount: number;
    article: VendorArticle;
}
export type Receipt = {
    receiptId: string;
    date: string;
    storeId: string;
    storeName: string;
    items: ReceiptItem[];
    returnedBottles: number;
    totalAmount: number;
}