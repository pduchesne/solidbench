export type Article = {
    articleId: string;
    label: string;
}
export type Purchase = {
    date: string
    coupon?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    amount: number;
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
export type ReceiptItem = Article & Purchase