
import { registerAs } from '@nestjs/config';

function required(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing configuration: ${name}`);
  }

  return value;
}

function positiveInt(name: string): number {
  const raw = required(name);
  const value = Number(raw);

  if (
      !/^\d+$/.test(raw) ||
      !Number.isSafeInteger(value) ||
      value < 1 ||
      value >= 2147483647
  ) {
    throw new Error(`Invalid positive integer: ${name}`);
  }

  return value;
}

export const inventoryConfig = registerAs('personalInventory', () => {
  const householdName = required('INVENTORY_DEFAULT_HOUSEHOLD_NAME');

  if (Array.from(householdName).length > 100) {
    throw new Error('Invalid default household name');
  }

  const currency = required('INVENTORY_REPORTING_CURRENCY');

  if (
      !Intl.supportedValuesOf('currency').includes(currency) ||
      new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
      }).resolvedOptions().maximumFractionDigits !== 2
  ) {
    throw new Error(
        'INVENTORY_REPORTING_CURRENCY must be a supported two-decimal currency',
    );
  }

  const pageSize = positiveInt('INVENTORY_PAGE_SIZE');
  const maxPageSize = positiveInt('INVENTORY_MAX_PAGE_SIZE');

  if (pageSize > maxPageSize) {
    throw new Error('Inventory page size exceeds maximum');
  }

  return {
    householdName,
    currency,
    pageSize,
    maxPageSize,
  };
});
