
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

    INVENTORY_SUMMARY_DESCRIPTION:
        'Returns aggregated inventory metrics for the authenticated user, including ' +
        'total item count, total estimated value, number of distinct categories, ' +
        'and number of distinct rooms.',

    // Success messages
    CATEGORIES_RETRIEVED: 'Inventory categories retrieved',
    ROOMS_RETRIEVED: 'Inventory rooms retrieved',
    WARRANTIES_RETRIEVED: 'Inventory warranties retrieved',
    ITEM_CREATED: 'Inventory item created',
    ITEMS_RETRIEVED: 'Inventory items retrieved',
    SUMMARY_RETRIEVED: 'Inventory summary retrieved',

    // Error messages
    UNAUTHORIZED: 'Missing or invalid access token',
    FORBIDDEN: 'A verified account is required',
    INVALID_ITEM: 'Invalid item data or inactive lookup code',
    INVALID_PAGINATION: 'Invalid pagination parameters',
} as const;
