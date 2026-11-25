export const InventoryMessages = {
    // Swagger tags
    CATALOG_TAG: 'Inventory lookups',
    PERSONAL_TAG: 'My inventory',

    // Swagger summaries
    LIST_CATEGORIES: 'List active inventory categories',
    LIST_ROOMS: 'List active inventory rooms',
    LIST_WARRANTIES: 'List active inventory warranty options',
    CREATE_ITEM: 'Create an inventory item',
    LIST_ITEMS: 'List my inventory items',
    GET_ITEM: 'Get inventory item details',
    UPDATE_ITEM_STATUS: 'Update inventory item active status',
    DELETE_ITEM: 'Soft delete an inventory item',
    INVENTORY_SUMMARY: 'Get my inventory summary',

    // Swagger descriptions
    CATEGORIES_DESCRIPTION:
        'Returns all active categories available for inventory items.',

    ROOMS_DESCRIPTION:
        'Returns all active room options available for inventory items.',

    WARRANTIES_DESCRIPTION:
        'Returns all active warranty options available for inventory items.',

    CREATE_ITEM_DESCRIPTION:
        'Creates an inventory item for the authenticated user. ' +
        'The oldest owned household is used automatically. ' +
        'If the user does not own a household, one is created automatically. ' +
        'The user must complete email verification through the Auth service before accessing this endpoint.',

    LIST_ITEMS_DESCRIPTION:
        'Returns paginated inventory items belonging to households ' +
        'where the authenticated user is currently an active member.',

    GET_ITEM_DESCRIPTION:
        'Retrieves complete details of an inventory item belonging to the authenticated user, including dynamically evaluated warranty expiration status.',

    UPDATE_ITEM_STATUS_DESCRIPTION:
        'Enables or disables an inventory item for the authenticated user without removing it.',

    DELETE_ITEM_DESCRIPTION:
        'Deactivates and soft-deletes an inventory item from the user view while retaining the record in the database.',

    INVENTORY_SUMMARY_DESCRIPTION:
        'Returns aggregated inventory metrics for the authenticated user, including ' +
        'total item count, total estimated value, number of distinct categories, ' +
        'and number of distinct rooms.',

    // DTO descriptions
    ITEM_NAME_DESCRIPTION: 'The name of the inventory item.',
    ROOM_CODE_DESCRIPTION: 'Code returned by GET /inventory/rooms.',
    CATEGORY_CODE_DESCRIPTION: 'Code returned by GET /inventory/categories.',
    PURCHASE_DATE_DESCRIPTION: 'The purchase date in YYYY-MM-DD format.',
    WARRANTY_CODE_DESCRIPTION: 'Code returned by GET /inventory/warranties.',
    PURCHASE_AMOUNT_DESCRIPTION:
        'Decimal purchase amount in the configured reporting currency.',

    LIMIT_DESCRIPTION:
        'Maximum number of items to return. The default and maximum values are configured by the server.',

    OFFSET_DESCRIPTION:
        'Number of items to skip. Defaults to 0.',

    // Response descriptions
    LOOKUP_CODE_DESCRIPTION: 'Unique lookup code.',
    TRANSLATION_KEY_DESCRIPTION:
        'Translation key used to resolve the display label.',

    WARRANTY_DURATION_DESCRIPTION:
        'Warranty duration in months. Null when the duration is not applicable.',

    WARRANTY_LIFETIME_DESCRIPTION:
        'Indicates whether the warranty is lifetime.',

    ITEM_ID_DESCRIPTION: 'Unique inventory item identifier.',
    HOUSEHOLD_ID_DESCRIPTION: 'Identifier of the household containing this item.',
    CREATED_AT_DESCRIPTION: 'Date and time when the item was created.',
    UPDATED_AT_DESCRIPTION: 'Date and time when the item was last updated.',

    TOTAL_ITEMS_DESCRIPTION: 'Total number of inventory items.',
    TOTAL_VALUE_DESCRIPTION:
        'Sum of known purchase amounts in the configured reporting currency.',
    CURRENCY_DESCRIPTION: 'Currency used for monetary calculations.',
    VALUED_ITEMS_DESCRIPTION:
        'Number of items included in totalValue, including items valued at zero.',
    CATEGORIES_COUNT_DESCRIPTION:
        'Number of distinct categories in the inventory.',
    ROOMS_COUNT_DESCRIPTION:
        'Number of distinct rooms in the inventory.',

    // Success messages
    CATEGORIES_RETRIEVED: 'Inventory categories retrieved',
    ROOMS_RETRIEVED: 'Inventory rooms retrieved',
    WARRANTIES_RETRIEVED: 'Inventory warranties retrieved',
    ITEM_CREATED: 'Inventory item created',
    ITEM_RETRIEVED: 'Inventory item retrieved',
    ITEMS_RETRIEVED: 'Inventory items retrieved',
    ITEM_STATUS_UPDATED: 'Inventory item status updated',
    ITEM_DELETED: 'Inventory item deleted successfully',
    SUMMARY_RETRIEVED: 'Inventory summary retrieved',

    // Error messages
    ITEM_NOT_FOUND: 'Inventory item not found',
    UNAUTHORIZED: 'Missing or invalid access token',
    FORBIDDEN: 'A verified account is required',
    INVALID_ITEM: 'Invalid item data or inactive lookup code',
    INVALID_LOOKUP:
        'The selected room, category or warranty does not exist or is inactive.',
    INVALID_PAGINATION: 'Invalid pagination parameters',
    INVALID_PAGINATION_BOUNDS: 'Invalid inventory pagination bounds',

    // Configuration errors
    MISSING_CONFIGURATION: 'Missing configuration: {name}',
    INVALID_POSITIVE_INTEGER: 'Invalid positive integer: {name}',
    INVALID_HOUSEHOLD_NAME: 'Invalid default household name',
    INVALID_REPORTING_CURRENCY:
        'INVENTORY_REPORTING_CURRENCY must be a supported two-decimal currency',
    PAGE_SIZE_EXCEEDS_MAXIMUM:
        'Inventory page size exceeds maximum',

    // Repository errors
    FAILED_TO_CREATE_ITEM: 'Failed to create inventory item',
    FAILED_TO_RETRIEVE_CREATED_ITEM:
        'Failed to retrieve the created inventory item',
    FAILED_TO_CREATE_HOUSEHOLD: 'Failed to create household',
    // Validation messages
    VALIDATION_ITEM_NAME_REQUIRED: 'Item name is required',
    VALIDATION_ITEM_NAME_LENGTH: 'Item name must not exceed 150 characters',
    VALIDATION_ITEM_NAME_INVALID: 'Item name contains invalid characters',

    VALIDATION_ROOM_CODE_REQUIRED: 'Room code is required',
    VALIDATION_ROOM_CODE_INVALID: 'Invalid room code',

    VALIDATION_CATEGORY_CODE_REQUIRED: 'Category code is required',
    VALIDATION_CATEGORY_CODE_INVALID: 'Invalid category code',

    VALIDATION_PURCHASE_DATE_REQUIRED: 'Purchase date is required',
    VALIDATION_PURCHASE_DATE_INVALID: 'Purchase date must be a valid date in YYYY-MM-DD format',

    VALIDATION_WARRANTY_CODE_REQUIRED: 'Warranty code is required',
    VALIDATION_WARRANTY_CODE_INVALID: 'Invalid warranty code',

    VALIDATION_PURCHASE_AMOUNT_INVALID:
        'Purchase amount must be a non-negative decimal with up to 2 decimal places',

    VALIDATION_IS_ACTIVE_INVALID: 'isActive must be a boolean',

    VALIDATION_LIMIT_INVALID: 'Limit must be a positive integer',
    VALIDATION_OFFSET_INVALID: 'Offset must be a non-negative integer',
} as const;