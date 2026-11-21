import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { inventoryConfig } from './config/inventory.config';
import { CreateInventoryItemDto, InventoryPageQueryDto } from './dto/inventory.dto';
import { InvalidInventoryLookupError, InventoryCatalogRepository, PersonalInventoryRepository } from './repositories/inventory.repository';

@Injectable()
export class InventoryCatalogService {
  constructor(private readonly catalog: InventoryCatalogRepository) {}

  categories() { return this.catalog.categories(); }
  rooms() { return this.catalog.rooms(); }
  warranties() { return this.catalog.warranties(); }
}

@Injectable()
export class PersonalInventoryService {
  constructor(
    private readonly items: PersonalInventoryRepository,
    @Inject(inventoryConfig.KEY) private readonly config: ConfigType<typeof inventoryConfig>,
  ) {}

  async create(userId: string, item: CreateInventoryItemDto) {
    try {
      return await this.items.create(userId, item, {
        householdName: this.config.householdName, currency: this.config.currency,
      });
    } catch (error) {
      if (error instanceof InvalidInventoryLookupError) {
        throw new BadRequestException('The selected room, category or warranty does not exist or is inactive');
      }
      throw error;
    }
  }

  async list(userId: string, query: InventoryPageQueryDto) {
    const limit = query.limit ?? this.config.pageSize;
    const offset = query.offset ?? 0;
    if (limit > this.config.maxPageSize || !Number.isSafeInteger(offset + limit)) {
      throw new BadRequestException('Invalid inventory pagination bounds');
    }
    const rows = await this.items.list(userId, { limit, offset });
    return { items: rows.slice(0, limit), nextOffset: rows.length > limit ? offset + limit : null };
  }

  summary(userId: string) { return this.items.summary(userId, this.config.currency); }
}
