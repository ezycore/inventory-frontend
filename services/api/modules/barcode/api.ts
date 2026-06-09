import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export interface BarcodeLookupResult {
  _id: string | null; // inventoryId (null if no inventory at this location)
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  productId: string;
  variantId: string | null;
  unitName: string | null;
  saleUnitName: string | null;
  barcode?: string;
  hasInventoryAtLocation: boolean;
}

export const barcodeApi = {
  lookup: (code: string): Promise<ApiResponse<BarcodeLookupResult>> =>
    apiClient.get(`/products/lookup?code=${encodeURIComponent(code)}`),
  /** Build absolute URL for `<img src>` (server-rendered PNG) */
  imageUrl: (
    code: string,
    opts?: {
      symbology?: "CODE128" | "EAN13" | "UPC_A" | "ITF14" | "QR";
      scale?: number;
      includetext?: boolean;
    },
  ) => {
    const base = process.env.NEXT_PUBLIC_API_URL || "/api";
    const params = new URLSearchParams({ code });
    if (opts?.symbology) params.set("symbology", opts.symbology);
    if (opts?.scale) params.set("scale", String(opts.scale));
    if (opts?.includetext === false) params.set("includetext", "false");
    return `${base}/products/labels/image?${params.toString()}`;
  },
};
