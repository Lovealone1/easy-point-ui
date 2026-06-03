import type { UnitOfMeasure } from "@/features/supplies/types/supplies.types"

/**
 * Convierte una cantidad de la base de datos (donde GRAM/MILLILITER están en kg/L, ej: 0.3)
 * a su valor real en gramos/mililitros/unidades.
 */
export function convertSupplyQuantity(quantity: number, unitOfMeasure: UnitOfMeasure): number {
  if (unitOfMeasure === "GRAM" || unitOfMeasure === "MILLILITER") {
    // 0.3 -> 300
    // Usamos Math.round para evitar problemas de precisión de punto flotante
    return Math.round(quantity * 1000 * 10000) / 10000
  }
  return quantity
}

/**
 * Formatea una cantidad de la base de datos con su unidad de medida adecuada.
 * Ej: 0.3 GRAM -> "300 g"
 * Ej: 1.5 MILLILITER -> "1500 ml"
 * Ej: 5 UNIT -> "5 und"
 */
export function formatSupplyQuantity(quantity: number, unitOfMeasure: UnitOfMeasure): string {
  const converted = convertSupplyQuantity(quantity, unitOfMeasure)
  const unitLabel = unitOfMeasure === "GRAM" ? "g" : unitOfMeasure === "MILLILITER" ? "ml" : "und"
  return `${converted} ${unitLabel}`
}
