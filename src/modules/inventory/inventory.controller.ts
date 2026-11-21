
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

import { ResponseHelper } from '../../common/helpers/response.helper';
import { Messages } from '../../messages';

import {
  InventoryItemDto,
  InventoryLookupDto,
  InventoryPageDto,
  InventorySummaryDto,
  InventoryWarrantyDto,
} from './dto/inventory-response.dto';

import {
  CreateInventoryItemDto,
  InventoryPageQueryDto,
} from './dto/inventory.dto';

import {
  InventoryCatalogService,
  PersonalInventoryService,
} from './inventory.service';

import {
  CurrentAccountId,
  InventoryAccountGuard,
  InventoryJwtGuard,
} from './security/inventory-auth';

const inventoryMessages = Messages.en.inventory;

/**
 * Inventory Catalog Controller
 *
 * Handles public inventory lookup requests,
 * including categories, rooms and warranty options.
 */
@ApiTags(inventoryMessages.CATALOG_TAG)
@Controller('inventory')
export class InventoryCatalogController {
  constructor(
      private readonly catalog: InventoryCatalogService,
  ) {}

  /**
   * Retrieves all active inventory categories.
   */
  @Get('categories')
  @ApiOperation({
    summary: inventoryMessages.LIST_CATEGORIES,
    description: inventoryMessages.CATEGORIES_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: inventoryMessages.CATEGORIES_RETRIEVED,
    type: InventoryLookupDto,
    isArray: true,
  })
  async categories() {
    return ResponseHelper.success(
        await this.catalog.categories(),
        inventoryMessages.CATEGORIES_RETRIEVED,
    );
  }

  /**
   * Retrieves all active inventory rooms.
   */
  @Get('rooms')
  @ApiOperation({
    summary: inventoryMessages.LIST_ROOMS,
    description: inventoryMessages.ROOMS_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: inventoryMessages.ROOMS_RETRIEVED,
    type: InventoryLookupDto,
    isArray: true,
  })
  async rooms() {
    return ResponseHelper.success(
        await this.catalog.rooms(),
        inventoryMessages.ROOMS_RETRIEVED,
    );
  }

  /**
   * Retrieves all active inventory warranty options.
   */
  @Get('warranties')
  @ApiOperation({
    summary: inventoryMessages.LIST_WARRANTIES,
    description: inventoryMessages.WARRANTIES_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: inventoryMessages.WARRANTIES_RETRIEVED,
    type: InventoryWarrantyDto,
    isArray: true,
  })
  async warranties() {
    return ResponseHelper.success(
        await this.catalog.warranties(),
        inventoryMessages.WARRANTIES_RETRIEVED,
    );
  }
}

/**
 * Personal Inventory Controller
 *
 * Handles authenticated inventory operations
 * for the current account.
 */
@ApiTags(inventoryMessages.PERSONAL_TAG)
@ApiBearerAuth()
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: inventoryMessages.UNAUTHORIZED,
})
@ApiResponse({
  status: HttpStatus.FORBIDDEN,
  description: inventoryMessages.FORBIDDEN,
})
@UseGuards(InventoryJwtGuard, InventoryAccountGuard)
@Controller('inventory')
export class PersonalInventoryController {
  constructor(
      private readonly inventory: PersonalInventoryService,
  ) {}

  /**
   * Creates a new inventory item.
   */
  @Post('items')
  @ApiOperation({
    summary: inventoryMessages.CREATE_ITEM,
    description: inventoryMessages.CREATE_ITEM_DESCRIPTION,
  })
  @ApiBody({
    type: CreateInventoryItemDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: inventoryMessages.ITEM_CREATED,
    type: InventoryItemDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: inventoryMessages.INVALID_ITEM,
  })
  async create(
      @CurrentAccountId() userId: string,
      @Body() body: CreateInventoryItemDto,
  ) {
    return ResponseHelper.success(
        await this.inventory.create(userId, body),
        inventoryMessages.ITEM_CREATED,
        HttpStatus.CREATED,
    );
  }

  /**
   * Retrieves paginated inventory items.
   */
  @Get('items')
  @ApiOperation({
    summary: inventoryMessages.LIST_ITEMS,
    description: inventoryMessages.LIST_ITEMS_DESCRIPTION,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: inventoryMessages.ITEMS_RETRIEVED,
    type: InventoryPageDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: inventoryMessages.INVALID_PAGINATION,
  })
  async list(
      @CurrentAccountId() userId: string,
      @Query() query: InventoryPageQueryDto,
  ) {
    return ResponseHelper.success(
        await this.inventory.list(userId, query),
        inventoryMessages.ITEMS_RETRIEVED,
    );
  }

  /**
   * Retrieves inventory dashboard metrics.
   */
  @Get('summary')
  @ApiOperation({
    summary: inventoryMessages.INVENTORY_SUMMARY,
    description: inventoryMessages.INVENTORY_SUMMARY_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: inventoryMessages.SUMMARY_RETRIEVED,
    type: InventorySummaryDto,
  })
  async summary(
      @CurrentAccountId() userId: string,
  ) {
    return ResponseHelper.success(
        await this.inventory.summary(userId),
        inventoryMessages.SUMMARY_RETRIEVED,
    );
  }
}
