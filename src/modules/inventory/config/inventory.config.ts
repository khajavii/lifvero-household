
import { registerAs } from '@nestjs/config';
import { messages } from '../../../messages';

/**
 * Retrieves a required environment variable.
 *
 * Reads the specified environment variable, trims whitespace,
 * and throws an error if the value is missing or empty.
 *
 * @param name - Name of the required environment variable.
 * @returns The trimmed environment variable value.
 * @throws {Error} If the environment variable is missing or empty.
 */
function required(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
        messages.inventory.MISSING_CONFIGURATION.replace(
            '{name}',
            name,
        ),
    );
  }

  return value;
}

/**
 * Retrieves and validates a positive integer environment variable.
 *
 * The value must:
 * - Contain only decimal digits.
 * - Be a safe JavaScript integer.
 * - Be greater than zero.
 * - Be smaller than the maximum supported database integer value.
 *
 * @param name - Name of the environment variable.
 * @returns The validated positive integer.
 * @throws {Error} If the value is missing or is not a valid positive integer.
 */
function positiveInt(name: string): number {
  const raw = required(name);
  const value = Number(raw);

  if (
      !/^\d+$/.test(raw) ||
      !Number.isSafeInteger(value) ||
      value < 1 ||
      value >= 2147483647
  ) {
    throw new Error(
        messages.inventory.INVALID_POSITIVE_INTEGER.replace(
            '{name}',
            name,
        ),
    );
  }

  return value;
}

/**
 * Personal Inventory configuration namespace.
 *
 * Registers and validates the configuration required by the
 * personal inventory module.
 *
 * Environment variables:
 *
 * - INVENTORY_DEFAULT_HOUSEHOLD_NAME:
 *   Default household name. Must not exceed 100 Unicode code points.
 *
 * - INVENTORY_REPORTING_CURRENCY:
 *   ISO 4217 currency code supported by the runtime.
 *   Must use exactly two fractional digits.
 *
 * - INVENTORY_PAGE_SIZE:
 *   Default number of inventory records returned per page.
 *
 * - INVENTORY_MAX_PAGE_SIZE:
 *   Maximum number of inventory records allowed per page.
 *
 * Validation:
 * - All environment variables are required.
 * - Household name must not exceed 100 Unicode code points.
 * - Reporting currency must be supported and use two decimal places.
 * - Pagination values must be positive integers.
 * - Default page size must not exceed maximum page size.
 *
 * @returns Validated personal inventory configuration.
 * @throws {Error} If any configuration value is missing or invalid.
 *
 * @example
 * ```env
 * INVENTORY_DEFAULT_HOUSEHOLD_NAME=My Household
 * INVENTORY_REPORTING_CURRENCY=USD
 * INVENTORY_PAGE_SIZE=20
 * INVENTORY_MAX_PAGE_SIZE=100
 * ```
 *
 * @example
 * ```typescript
 * const inventory = configService.get('personalInventory');
 *
 * console.log(inventory.pageSize);
 * ```
 */
export const inventoryConfig = registerAs('personalInventory', () => {
  /**
   * Default household name.
   *
   * @type {string}
   */
  const householdName = required('INVENTORY_DEFAULT_HOUSEHOLD_NAME');

  if (Array.from(householdName).length > 100) {
    throw new Error(messages.inventory.INVALID_HOUSEHOLD_NAME);
  }

  /**
   * Reporting currency used for inventory valuations and reports.
   *
   * @type {string}
   */
  const currency = required('INVENTORY_REPORTING_CURRENCY');

  if (
      !Intl.supportedValuesOf('currency').includes(currency) ||
      new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
      }).resolvedOptions().maximumFractionDigits !== 2
  ) {
    throw new Error(
        messages.inventory.INVALID_REPORTING_CURRENCY,
    );
  }

  /**
   * Default pagination size.
   *
   * @type {number}
   */
  const pageSize = positiveInt('INVENTORY_PAGE_SIZE');

  /**
   * Maximum allowed pagination size.
   *
   * @type {number}
   */
  const maxPageSize = positiveInt('INVENTORY_MAX_PAGE_SIZE');

  if (pageSize > maxPageSize) {
    throw new Error(
        messages.inventory.PAGE_SIZE_EXCEEDS_MAXIMUM,
    );
  }

  return {
    householdName,
    currency,
    pageSize,
    maxPageSize,
  };
});
