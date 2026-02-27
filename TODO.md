# Order Creation Fix - TODO

## Tasks:
- [x] Fix app/meal/page.tsx - Calculate and pass totalPrice in checkout
- [x] Fix app/api/orders/route.ts - Handle grocery items and calculate totalPrice
- [ ] Test the order creation flow


## Changes Needed:

### 1. app/meal/page.tsx
- Calculate totalPrice from cart items
- Pass totalPrice in the API request body
- Ensure grocery items are properly identified

### 2. app/api/orders/route.ts
- Calculate totalPrice from items if not provided
- Properly set foodId or groceryItemId based on item type
- Handle both food and grocery items in order creation
