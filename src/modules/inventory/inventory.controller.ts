
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

import { ResponseHelper } from '../../common/helpers/response.helper';

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
  UpdateInventoryStatusDto,
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
import {messages} from "../../messages";

/**
 * Inventory Catalog Controller
 *
 * Handles public inventory lookup requests,
 * including categories, rooms and warranty options.
 */
@ApiTags(messages.inventory.CATALOG_TAG)
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
    summary: messages.inventory.LIST_CATEGORIES,
    description: messages.inventory.CATEGORIES_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: messages.inventory.CATEGORIES_RETRIEVED,
    type: InventoryLookupDto,
    isArray: true,
  })
  async categories() {
    return ResponseHelper.success(
        await this.catalog.categories(),
        messages.inventory.CATEGORIES_RETRIEVED,
    );
  }

  /**
   * Retrieves all active inventory rooms.
   */
  @Get('rooms')
  @ApiOperation({
    summary: messages.inventory.LIST_ROOMS,
    description: messages.inventory.ROOMS_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: messages.inventory.ROOMS_RETRIEVED,
    type: InventoryLookupDto,
    isArray: true,
  })
  async rooms() {
    return ResponseHelper.success(
        await this.catalog.rooms(),
        messages.inventory.ROOMS_RETRIEVED,
    );
  }

  /**
   * Retrieves all active inventory warranty options.
   */
  @Get('warranties')
  @ApiOperation({
    summary: messages.inventory.LIST_WARRANTIES,
    description: messages.inventory.WARRANTIES_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: messages.inventory.WARRANTIES_RETRIEVED,
    type: InventoryWarrantyDto,
    isArray: true,
  })
  async warranties() {
    return ResponseHelper.success(
        await this.catalog.warranties(),
        messages.inventory.WARRANTIES_RETRIEVED,
    );
  }
}

/**
 * Personal Inventory Controller
 *
 * Handles authenticated inventory operations
 * for the current account.
 */
@ApiTags(messages.inventory.PERSONAL_TAG)
@ApiBearerAuth()
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: messages.inventory.UNAUTHORIZED,
})
@ApiResponse({
  status: HttpStatus.FORBIDDEN,
  description: messages.inventory.FORBIDDEN,
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
    summary: messages.inventory.CREATE_ITEM,
    description: messages.inventory.CREATE_ITEM_DESCRIPTION,
  })
  @ApiBody({
    type: CreateInventoryItemDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: messages.inventory.ITEM_CREATED,
    type: InventoryItemDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: messages.inventory.INVALID_ITEM,
  })
  async create(
      @CurrentAccountId() userId: string,
      @Body() body: CreateInventoryItemDto,
  ) {
    return ResponseHelper.success(
        await this.inventory.create(userId, body),
        messages.inventory.ITEM_CREATED,
        HttpStatus.CREATED,
    );
  }

  /**
   * Retrieves paginated inventory items with optional search and category filters.
   */
  @Get('items')
  @ApiOperation({
    summary: messages.inventory.LIST_ITEMS,
    description: messages.inventory.LIST_ITEMS_DESCRIPTION,
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
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    example: 0,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Laptop',
    description: 'Search term for item name',
  })
  @ApiQuery({
    name: 'categoryCode',
    required: false,
    type: String,
    example: 'electronics',
    description: 'Filter by category code',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: messages.inventory.ITEMS_RETRIEVED,
    type: InventoryPageDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: messages.inventory.INVALID_PAGINATION,
  })
  async list(
      @CurrentAccountId() userId: string,
      @Query() query: InventoryPageQueryDto,
  ) {
    return ResponseHelper.success(
        await this.inventory.list(userId, query),
        messages.inventory.ITEMS_RETRIEVED,
    );
  }

  /**
   * Retrieves an inventory item's details by ID.
   */
  @Get('items/:id')
  @ApiOperation({
    summary: messages.inventory.GET_ITEM,
    description: messages.inventory.GET_ITEM_DESCRIPTION,
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: messages.inventory.ITEM_ID_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: messages.inventory.ITEM_RETRIEVED,
    type: InventoryItemDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: messages.inventory.ITEM_NOT_FOUND,
  })
  async findOne(
      @CurrentAccountId() userId: string,
      @Param('id', ParseUUIDPipe) id: string,
  ) {
    return ResponseHelper.success(
        await this.inventory.findById(userId, id),
        messages.inventory.ITEM_RETRIEVED,
    );
  }

  /**
   * Updates an inventory item's active status (activate or deactivate).
   */
  @Patch('items/:id/status')
  @ApiOperation({
    summary: messages.inventory.UPDATE_ITEM_STATUS,
    description: messages.inventory.UPDATE_ITEM_STATUS_DESCRIPTION,
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: messages.inventory.ITEM_ID_DESCRIPTION,
  })
  @ApiBody({
    type: UpdateInventoryStatusDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: messages.inventory.ITEM_STATUS_UPDATED,
    type: InventoryItemDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: messages.inventory.ITEM_NOT_FOUND,
  })
  async updateStatus(
      @CurrentAccountId() userId: string,
      @Param('id', ParseUUIDPipe) id: string,
      @Body() body: UpdateInventoryStatusDto,
  ) {
    return ResponseHelper.success(
        await this.inventory.updateStatus(userId, id, body.isActive),
        messages.inventory.ITEM_STATUS_UPDATED,
    );
  }

  /**
   * Soft deletes an inventory item.
   */
  @Delete('items/:id')
  @ApiOperation({
    summary: messages.inventory.DELETE_ITEM,
    description: messages.inventory.DELETE_ITEM_DESCRIPTION,
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: messages.inventory.ITEM_ID_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: messages.inventory.ITEM_DELETED,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: messages.inventory.ITEM_NOT_FOUND,
  })
  async delete(
      @CurrentAccountId() userId: string,
      @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.inventory.delete(userId, id);
    return ResponseHelper.success(
        null,
        messages.inventory.ITEM_DELETED,
    );
  }

  /**
   * Retrieves inventory dashboard metrics.
   */
  @Get('summary')
  @ApiOperation({
    summary: messages.inventory.INVENTORY_SUMMARY,
    description: messages.inventory.INVENTORY_SUMMARY_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: messages.inventory.SUMMARY_RETRIEVED,
    type: InventorySummaryDto,
  })
  async summary(
      @CurrentAccountId() userId: string,
  ) {
    return ResponseHelper.success(
        await this.inventory.summary(userId),
        messages.inventory.SUMMARY_RETRIEVED,
    );
  }
}
