
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