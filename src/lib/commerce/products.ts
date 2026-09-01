export const SIGNATURE_PRODUCT_ID = "signature_relationship" as const;
export const REPORT_VERSION = "signature-v1";

export type ProductId = typeof SIGNATURE_PRODUCT_ID;

export interface ProductDefinition {
  productId: ProductId;
  name: string;
  amount: number;
  currency: "KRW";
}

/** 서버 Product Catalog — 가격 Source of Truth */
export const PRODUCTS: Record<ProductId, ProductDefinition> = {
  [SIGNATURE_PRODUCT_ID]: {
    productId: SIGNATURE_PRODUCT_ID,
    name: "우리 아이 × 나 관계 사용설명서",
    amount: 12900,
    currency: "KRW",
  },
};

export function getProductPrice(productId: string): number {
  const product = PRODUCTS[productId as ProductId];
  if (!product) {
    throw new Error("UNKNOWN_PRODUCT");
  }
  return product.amount;
}

export function getProduct(productId: string): ProductDefinition {
  const product = PRODUCTS[productId as ProductId];
  if (!product) {
    throw new Error("UNKNOWN_PRODUCT");
  }
  return product;
}
