/**
 * UOM (Unit of Measure) Conversion Utilities for Frontend
 *
 * This module handles all UOM conversions and display formatting for the frontend.
 * The key principle: Inventory is ALWAYS stored in BASE UNITS in the database.
 *
 * Examples:
 * - Pharmacy: 1000 pieces in stock, display as "1000 pcs (10 boxes)"
 * - Grocery: 500 kg in stock, display as "500 kg (10 bags)"
 */

import type { Product, Unit } from "@/types";

/**
 * UOM Configuration extracted from a product
 */
export interface UOMConfig {
  enableUOMConversion: boolean;
  baseUnitId?: string;
  baseUnitName?: string;
  baseUnitSymbol?: string;
  purchaseUnit?: {
    unitId: string;
    unitName?: string;
    unitSymbol?: string;
    conversionFactor: number;
  };
  saleUnit?: {
    unitId: string;
    unitName?: string;
    unitSymbol?: string;
    conversionFactor: number;
  };
}

/**
 * Display result for quantity with optional alternate unit
 */
export interface QuantityDisplay {
  /** Primary display: "1000 pieces" */
  primary: string;
  /** Alternate display: "≈ 10 boxes" */
  alternate?: string;
  /** Combined display: "1000 pieces (≈ 10 boxes)" */
  combined: string;
  /** Raw base quantity */
  baseQuantity: number;
  /** Raw alternate quantity (if applicable) */
  alternateQuantity?: number;
}

/**
 * Convert quantity to base units
 * @param quantity - Quantity in source unit
 * @param conversionFactor - How many base units in 1 source unit
 * @returns Quantity in base units
 */
export function toBaseUnit(
  quantity: number,
  conversionFactor: number
): number {
  if (conversionFactor <= 0) {
    console.warn("Invalid conversion factor:", conversionFactor);
    return quantity;
  }
  return quantity * conversionFactor;
}

/**
 * Convert quantity from base units to target unit
 * @param baseQuantity - Quantity in base units
 * @param conversionFactor - How many base units in 1 target unit
 * @returns Quantity in target units
 */
export function fromBaseUnit(
  baseQuantity: number,
  conversionFactor: number
): number {
  if (conversionFactor <= 0) {
    console.warn("Invalid conversion factor:", conversionFactor);
    return baseQuantity;
  }
  return baseQuantity / conversionFactor;
}

/**
 * Convert purchase quantity to inventory quantity (base units)
 * @example purchaseToInventory(10, { purchaseUnit: { conversionFactor: 100 } }) // 1000
 */
export function purchaseToInventory(
  purchaseQuantity: number,
  config: UOMConfig
): number {
  if (!config.enableUOMConversion || !config.purchaseUnit) {
    return purchaseQuantity;
  }
  return toBaseUnit(purchaseQuantity, config.purchaseUnit.conversionFactor);
}

/**
 * Convert sale quantity to inventory quantity (base units)
 * @example saleToInventory(50, { saleUnit: { conversionFactor: 1 } }) // 50
 */
export function saleToInventory(
  saleQuantity: number,
  config: UOMConfig
): number {
  if (!config.enableUOMConversion || !config.saleUnit) {
    return saleQuantity;
  }
  return toBaseUnit(saleQuantity, config.saleUnit.conversionFactor);
}

/**
 * Format a quantity for display with unit name
 * @param quantity - The quantity to format
 * @param unitName - The unit name (e.g., "pieces", "boxes")
 * @param decimals - Number of decimal places (default: 2, shows only if needed)
 */
export function formatQuantity(
  quantity: number,
  unitName: string = "",
  decimals: number = 2
): string {
  // Round to specified decimals, but strip trailing zeros
  const rounded = Math.round(quantity * Math.pow(10, decimals)) / Math.pow(10, decimals);
  const formatted = Number.isInteger(rounded)
    ? rounded.toString()
    : rounded.toFixed(decimals).replace(/\.?0+$/, "");

  return unitName ? `${formatted} ${unitName}` : formatted;
}

/**
 * Get inventory display with optional alternate unit
 * @param inventoryQuantity - Quantity in inventory (base units)
 * @param config - UOM configuration from product
 * @param mode - Which alternate unit to show ("purchase" or "sale")
 */
export function getInventoryDisplay(
  inventoryQuantity: number,
  config: UOMConfig,
  mode: "purchase" | "sale" = "purchase"
): QuantityDisplay {
  const baseDisplay = formatQuantity(
    inventoryQuantity,
    config.baseUnitSymbol || config.baseUnitName || ""
  );

  // No UOM conversion - just return base display
  if (!config.enableUOMConversion) {
    return {
      primary: baseDisplay,
      combined: baseDisplay,
      baseQuantity: inventoryQuantity,
    };
  }

  const altUnit = mode === "purchase" ? config.purchaseUnit : config.saleUnit;

  if (!altUnit || !altUnit.conversionFactor) {
    return {
      primary: baseDisplay,
      combined: baseDisplay,
      baseQuantity: inventoryQuantity,
    };
  }

  const alternateQuantity = fromBaseUnit(inventoryQuantity, altUnit.conversionFactor);
  const alternateDisplay = formatQuantity(
    alternateQuantity,
    altUnit.unitSymbol || altUnit.unitName || ""
  );

  return {
    primary: baseDisplay,
    alternate: `≈ ${alternateDisplay}`,
    combined: `${baseDisplay} (≈ ${alternateDisplay})`,
    baseQuantity: inventoryQuantity,
    alternateQuantity: alternateQuantity,
  };
}

/**
 * Extract UOM configuration from a product object
 * @param product - Product with UOM fields
 * @param units - Map of unitId to Unit object for name lookup
 */
export function getUOMConfigFromProduct(
  product: Partial<Product>,
  units?: Record<string, Unit>
): UOMConfig {
  const getUnitInfo = (unitId?: string) => {
    if (!unitId || !units?.[unitId]) return undefined;
    const unit = units[unitId];
    return {
      name: unit.name,
      symbol: unit.shortName || unit.name,
    };
  };

  const baseUnit = getUnitInfo(product.unitId);
  const purchaseUnitInfo = getUnitInfo(product.purchaseUnit?.unitId);
  const saleUnitInfo = getUnitInfo(product.saleUnit?.unitId);

  return {
    enableUOMConversion: product.enableUOMConversion || false,
    baseUnitId: product.unitId,
    baseUnitName: baseUnit?.name,
    baseUnitSymbol: baseUnit?.symbol,
    purchaseUnit: product.purchaseUnit?.unitId
      ? {
          unitId: product.purchaseUnit.unitId,
          unitName: purchaseUnitInfo?.name,
          unitSymbol: purchaseUnitInfo?.symbol,
          conversionFactor: product.purchaseUnit.conversionFactor || 1,
        }
      : undefined,
    saleUnit: product.saleUnit?.unitId
      ? {
          unitId: product.saleUnit.unitId,
          unitName: saleUnitInfo?.name,
          unitSymbol: saleUnitInfo?.symbol,
          conversionFactor: product.saleUnit.conversionFactor || 1,
        }
      : undefined,
  };
}

/**
 * Validate UOM configuration
 * @returns Array of error messages (empty if valid)
 */
export function validateUOMConfig(config: Partial<UOMConfig>): string[] {
  const errors: string[] = [];

  if (config.enableUOMConversion) {
    if (!config.baseUnitId) {
      errors.push("Base unit is required when UOM conversion is enabled");
    }

    if (config.purchaseUnit) {
      if (!config.purchaseUnit.unitId) {
        errors.push("Purchase unit is required");
      }
      if (!config.purchaseUnit.conversionFactor || config.purchaseUnit.conversionFactor <= 0) {
        errors.push("Purchase conversion factor must be greater than 0");
      }
    }

    if (config.saleUnit) {
      if (!config.saleUnit.unitId) {
        errors.push("Sale unit is required");
      }
      if (!config.saleUnit.conversionFactor || config.saleUnit.conversionFactor <= 0) {
        errors.push("Sale conversion factor must be greater than 0");
      }
    }

    // At least one alternative unit should be configured
    if (!config.purchaseUnit && !config.saleUnit) {
      errors.push("At least one unit (purchase or sale) must be configured");
    }
  }

  return errors;
}

/**
 * Check if product has valid UOM configuration
 */
export function hasValidUOMConfig(product: Partial<Product>): boolean {
  if (!product.enableUOMConversion) return false;
  if (!product.unitId) return false;

  const hasPurchaseUnit =
    !!product.purchaseUnit?.unitId && (product.purchaseUnit?.conversionFactor || 0) > 0;
  const hasSaleUnit =
    !!product.saleUnit?.unitId && (product.saleUnit?.conversionFactor || 0) > 0;

  return hasPurchaseUnit || hasSaleUnit;
}

/**
 * Calculate cost per base unit
 * @param purchasePrice - Price for purchase unit
 * @param conversionFactor - How many base units in purchase unit
 * @returns Cost per base unit
 */
export function costPerBaseUnit(
  purchasePrice: number,
  conversionFactor: number
): number {
  if (conversionFactor <= 0) return purchasePrice;
  return purchasePrice / conversionFactor;
}

/**
 * Calculate price per base unit
 * @param salePrice - Price for sale unit
 * @param conversionFactor - How many base units in sale unit
 * @returns Price per base unit
 */
export function pricePerBaseUnit(
  salePrice: number,
  conversionFactor: number
): number {
  if (conversionFactor <= 0) return salePrice;
  return salePrice / conversionFactor;
}

/**
 * Generate example text for UOM configuration
 * @example getUOMExample({ purchaseUnit: { unitName: "Box", conversionFactor: 100 } }, "Piece")
 * // Returns: "1 Box = 100 Pieces"
 */
export function getUOMExample(config: UOMConfig, baseUnitName: string = "units"): string | null {
  if (!config.enableUOMConversion) return null;

  const examples: string[] = [];

  if (config.purchaseUnit) {
    const purchaseName = config.purchaseUnit.unitName || "Purchase Unit";
    examples.push(`1 ${purchaseName} = ${config.purchaseUnit.conversionFactor} ${baseUnitName}`);
  }

  if (config.saleUnit && config.saleUnit.conversionFactor !== 1) {
    const saleName = config.saleUnit.unitName || "Sale Unit";
    examples.push(`1 ${saleName} = ${config.saleUnit.conversionFactor} ${baseUnitName}`);
  }

  return examples.length > 0 ? examples.join(" | ") : null;
}
