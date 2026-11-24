/**
 * Defines the calculated warranty status values.
 */
export enum WarrantyStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  LIFETIME = 'lifetime',
  NO_WARRANTY = 'no_warranty',
}

/**
 * Calculates warranty status based on purchase date, warranty option duration, and lifetime flag.
 *
 * @param purchaseDate - The purchase date in ISO/YYYY-MM-DD format or Date object, or null.
 * @param durationMonths - The duration in months (from inventory_warranty_options), or null.
 * @param isLifetime - Whether the warranty is marked as lifetime.
 * @param referenceDate - Reference date to evaluate expiration against (defaults to now).
 * @returns The computed WarrantyStatus enum value.
 */
export function calculateWarrantyStatus(
  purchaseDate: string | Date | null | undefined,
  durationMonths: number | null | undefined,
  isLifetime: boolean | null | undefined,
  referenceDate: Date = new Date(),
): WarrantyStatus {
  if (isLifetime) {
    return WarrantyStatus.LIFETIME;
  }

  if (durationMonths === undefined || durationMonths === null || durationMonths <= 0) {
    return WarrantyStatus.NO_WARRANTY;
  }

  if (!purchaseDate) {
    return WarrantyStatus.NO_WARRANTY;
  }

  const pDate = typeof purchaseDate === 'string' ? new Date(purchaseDate) : purchaseDate;
  if (isNaN(pDate.getTime())) {
    return WarrantyStatus.NO_WARRANTY;
  }

  const expirationDate = new Date(pDate);
  expirationDate.setMonth(expirationDate.getMonth() + durationMonths);

  return referenceDate > expirationDate ? WarrantyStatus.EXPIRED : WarrantyStatus.ACTIVE;
}
