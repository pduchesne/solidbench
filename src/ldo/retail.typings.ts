import { ContextDefinition } from "jsonld";

/**
 * =============================================================================
 * Typescript Typings for retail
 * =============================================================================
 */

/**
 * VendorArticle Type
 */
export interface VendorArticle {
  "@id"?: string;
  "@context"?: ContextDefinition;
  label: string;
  vendorId: string;
  ean?: string;
}

/**
 * ReceiptItem Type
 */
export interface ReceiptItem {
  "@id"?: string;
  "@context"?: ContextDefinition;
  date: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  article: VendorArticle;
}

/**
 * Receipt Type
 */
export interface Receipt {
  "@id"?: string;
  "@context"?: ContextDefinition;
  receiptId: string;
  date: string;
  storeId: string;
  storeName: string;
  totalAmount: number;
  items: ReceiptItem[];
  shippingCosts: number;
}
