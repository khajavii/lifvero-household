export interface NewInventoryItem {
  itemName: string;
  roomCode: string;
  categoryCode: string;
  purchaseDate: string;
  warrantyCode: string;
  purchaseAmount?: string;
}

export interface InventoryItem {
  id: string;
  householdId: string;
  itemName: string;
  roomCode: string;
  categoryCode: string;
  purchaseDate: string | null;
  warrantyCode: string | null;
  purchaseAmount: string | null;
  currency: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventorySummary {
  totalItems: number;
  totalValue: string;
  currency: string;
  valuedItems: number;
  categories: number;
  rooms: number;
}

export interface InventoryLookup {
  code: string;
  translationKey: string;
}

export interface WarrantyLookup extends InventoryLookup {
  durationMonths: number | null;
  isLifetime: boolean;
}

export abstract class InventoryCatalogRepository {
  abstract categories(): Promise<InventoryLookup[]>;
  abstract rooms(): Promise<InventoryLookup[]>;
  abstract warranties(): Promise<WarrantyLookup[]>;
}

export interface InventoryPageQuery { limit: number; offset: number }
export interface InventoryWriteSettings { householdName: string; currency: string }
export class InvalidInventoryLookupError extends Error {}

export abstract class PersonalInventoryRepository {
  abstract create(userId: string, input: NewInventoryItem, settings: InventoryWriteSettings): Promise<InventoryItem>;
  abstract list(userId: string, page: InventoryPageQuery): Promise<InventoryItem[]>;
  abstract summary(userId: string, currency: string): Promise<InventorySummary>;
}
