import { ShapeType } from "@ldo/ldo";
import { retailSchema } from "./retail.schema";
import { retailContext } from "./retail.context";
import { VendorArticle, ReceiptItem, Receipt } from "./retail.typings";

/**
 * =============================================================================
 * LDO ShapeTypes retail
 * =============================================================================
 */

/**
 * VendorArticle ShapeType
 */
export const VendorArticleShapeType: ShapeType<VendorArticle> = {
  schema: retailSchema,
  shape: "http://example.org/VendorArticle",
  context: retailContext,
};

/**
 * ReceiptItem ShapeType
 */
export const ReceiptItemShapeType: ShapeType<ReceiptItem> = {
  schema: retailSchema,
  shape: "http://example.org/ReceiptItem",
  context: retailContext,
};

/**
 * Receipt ShapeType
 */
export const ReceiptShapeType: ShapeType<Receipt> = {
  schema: retailSchema,
  shape: "http://example.org/Receipt",
  context: retailContext,
};
