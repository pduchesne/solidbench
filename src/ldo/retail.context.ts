import { ContextDefinition } from "jsonld";

/**
 * =============================================================================
 * retailContext: JSONLD Context for retail
 * =============================================================================
 */
export const retailContext: ContextDefinition = {
  label: {
    "@id": "http://example.org/label",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  vendorId: {
    "@id": "http://example.org/vendorId",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  ean: {
    "@id": "http://example.org/ean",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  date: {
    "@id": "http://example.org/date",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  quantity: {
    "@id": "http://example.org/quantity",
    "@type": "http://www.w3.org/2001/XMLSchema#double",
  },
  unitPrice: {
    "@id": "http://example.org/unitPrice",
    "@type": "http://www.w3.org/2001/XMLSchema#double",
  },
  amount: {
    "@id": "http://example.org/amount",
    "@type": "http://www.w3.org/2001/XMLSchema#number",
  },
  article: {
    "@id": "http://example.org/article",
    "@type": "@id",
  },
  receiptId: {
    "@id": "http://example.org/receiptId",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  storeId: {
    "@id": "http://example.org/storeId",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  storeName: {
    "@id": "http://example.org/storeName",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  totalAmount: {
    "@id": "http://example.org/totalAmount",
    "@type": "http://www.w3.org/2001/XMLSchema#double",
  },
  items: {
    "@id": "http://example.org/items",
    "@type": "@id",
    "@container": "@set",
  },
};
