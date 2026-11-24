\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE seed_context (
    user_id varchar(255) NOT NULL
        CHECK (length(btrim(user_id)) > 0)
) ON COMMIT DROP;

INSERT INTO seed_context (user_id)
VALUES (:'test_user_id');

INSERT INTO household.households (
    id,
    name
)
VALUES (
    '11111111-1111-4111-8111-111111111111',
    'Demo HouseholdEntity'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO household.household_members (
    household_id,
    user_id,
    role
)
SELECT
    '11111111-1111-4111-8111-111111111111',
    user_id,
    'owner'
FROM seed_context
ON CONFLICT (household_id, user_id) DO NOTHING;

INSERT INTO household.inventory_items (
    id,
    household_id,
    item_name,
    room_code,
    category_code,
    purchase_date,
    warranty_code,
    created_by
)
SELECT
    item.id,
    '11111111-1111-4111-8111-111111111111'::uuid,
    item.item_name,
    item.room_code,
    item.category_code,
    item.purchase_date,
    item.warranty_code,
    context.user_id
FROM (
    VALUES
        (
            '22222222-2222-4222-8222-222222222221'::uuid,
            'Demo Laptop',
            'office',
            'electronics',
            DATE '2025-02-10',
            'two-years'
        ),
        (
            '22222222-2222-4222-8222-222222222222'::uuid,
            'Demo Sofa',
            'living-room',
            'furniture',
            DATE '2024-08-15',
            'none'
        ),
        (
            '22222222-2222-4222-8222-222222222223'::uuid,
            'Demo Refrigerator',
            'kitchen',
            'appliances',
            DATE '2025-01-20',
            'three-years'
        ),
        (
            '22222222-2222-4222-8222-222222222224'::uuid,
            'Demo Document Folder',
            'office',
            'documents',
            NULL::date,
            NULL::text
        )
) AS item (
    id,
    item_name,
    room_code,
    category_code,
    purchase_date,
    warranty_code
)
CROSS JOIN seed_context AS context
ON CONFLICT (id) DO NOTHING;

COMMIT;
