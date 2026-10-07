export const SIGNATURE_PRODUCT_ID = "signature_relationship" as const;
export const REPORT_VERSION = "signature-v1";

export type ProductId = typeof SIGNATURE_PRODUCT_ID;

export interface ProductDefinition {
  productId: ProductId;
  name: string;
  amount: number;
  currency: "KRW";
  description: string;
  contentType: string;
  deliveryMethod: string;
  reAccessMethod: string;
}

/** 서버 Product Catalog — 가격 Source of Truth */
export const PRODUCTS: Record<ProductId, ProductDefinition> = {
  [SIGNATURE_PRODUCT_ID]: {
    productId: SIGNATURE_PRODUCT_ID,
    name: "우리 아이 × 나 관계 사용설명서",
    amount: 12900,
    currency: "KRW",
    description:
      "아이의 실제 행동과 보호자의 반응, 반복되는 장면을 함께 보고 관계에서 엇갈리는 지점을 정리하는 리포트입니다.",
    contentType: "개인 맞춤형 디지털 콘텐츠 (배송 상품이 아닙니다)",
    deliveryMethod: "결제 확인 후 웹사이트 결과 페이지에서 제공",
    reAccessMethod: "같은 브라우저 또는 결과 보관 코드로 다시 확인",
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
