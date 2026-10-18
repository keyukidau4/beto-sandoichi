# Database Models Documentation

This document describes all the database models used in the BanhMi App backend.

## Overview

All models implement soft delete functionality using the `del_flg` field. When a document is "deleted", the `del_flg` field is set to `true` instead of physically removing the document from the database.

## Models

### User Model (`User.ts`)

Represents system users with different roles.

**Fields:**
- `email`: Unique email address (required)
- `password`: Hashed password using bcrypt (required)
- `role`: User role - 'admin', 'staff', or 'buyer' (default: 'buyer')
- `status`: Account status - 'pending', 'approved', or 'blacklisted' (default: 'pending')
- `del_flg`: Soft delete flag (default: false)
- `lastLogin`: Last login timestamp (optional)
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `email` (unique)
- `role + status` (compound)
- `del_flg`

**Methods:**
- `comparePassword(candidatePassword)`: Compare plain text password with hashed password

### BuyerProfile Model (`BuyerProfile.ts`)

Stores detailed information for buyer users.

**Fields:**
- `userId`: Reference to User document (required, unique)
- `name`: Full name (required, max 100 chars)
- `tel`: Phone number (required)
- `zip1`: First part of zip code (required, 3 digits)
- `zip2`: Second part of zip code (required, 4 digits)
- `address1`: Primary address (required, max 200 chars)
- `address2`: Secondary address (optional, max 200 chars)
- `point`: Point balance (default: 0, min: 0)
- `del_flg`: Soft delete flag (default: false)
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `userId` (unique)
- `del_flg`
- `point` (descending)

### Product Model (`Product.ts`)

Represents products available for order.

**Fields:**
- `name`: Product name (required, max 100 chars)
- `type`: Product type - 'banhmi' or 'drink' (required)
- `description`: Product description (required, max 500 chars)
- `price`: Product price (required, min: 0)
- `stock`: Available quantity (required, min: 0, default: 0)
- `options`: Array of product options with name and extra cost
- `imageUrl`: Cloudinary image URL (optional)
- `del_flg`: Soft delete flag (default: false)
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `type + del_flg` (compound)
- `name`
- `stock`
- `createdAt` (descending)

### Order Model (`Order.ts`)

Represents customer orders.

**Fields:**
- `buyerId`: Reference to User document (required)
- `items`: Array of order items with product, quantity, options, and subtotal
- `paymentType`: Payment method - '代引き' (COD) or 'ポイント' (Points)
- `totalAmount`: Total order amount (required, min: 0)
- `pointsUsed`: Points used for payment (optional, min: 0)
- `pointsEarned`: Points earned from order (optional, min: 0)
- `status`: Order status - 'pending', 'paid', or 'cancelled' (default: 'pending')
- `del_flg`: Soft delete flag (default: false)
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `buyerId + createdAt` (compound, createdAt descending)
- `status`
- `paymentType`
- `del_flg`
- `createdAt` (descending)

### PointTransaction Model (`PointTransaction.ts`)

Tracks all point-related transactions.

**Fields:**
- `userId`: Reference to User document (required)
- `orderId`: Reference to Order document (optional)
- `type`: Transaction type - 'purchase_reward', 'bank_deposit_transfer_add', or 'purchase_deduction'
- `amount`: Point amount (can be positive or negative, cannot be 0)
- `note`: Transaction description (required, max 200 chars)
- `del_flg`: Soft delete flag (default: false)
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `userId + createdAt` (compound, createdAt descending)
- `type`
- `orderId`
- `del_flg`

### ContactRequest Model (`ContactRequest.ts`)

Stores customer contact requests and inquiries.

**Fields:**
- `buyerId`: Reference to User document (required)
- `type`: Request type - 'update-info', 'general-inquiry', or 'complaint'
- `content`: Request content (required, max 1000 chars)
- `adminResponse`: Admin response (optional, max 1000 chars)
- `status`: Request status - 'pending' or 'done' (default: 'pending')
- `del_flg`: Soft delete flag (default: false)
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `buyerId + createdAt` (compound, createdAt descending)
- `status`
- `type`
- `del_flg`

### EmailTemplate Model (`EmailTemplate.ts`)

Stores email templates for admin use.

**Fields:**
- `title`: Email subject (required, max 200 chars)
- `content`: Email body (required, max 5000 chars)
- `type`: Template type - 'approval', 'general', or 'promotion'
- `del_flg`: Soft delete flag (default: false)
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `type`
- `del_flg`
- `createdAt` (descending)

### ProductView Model (`ProductView.ts`)

Tracks product view analytics.

**Fields:**
- `productId`: Reference to Product document (required)
- `date`: View date in 'YYYY-MM-DD' format (required)
- `count`: Number of views (required, min: 0, default: 0)
- `del_flg`: Soft delete flag (default: false)
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `productId + date` (compound, unique)
- `date` (descending)
- `count` (descending)
- `del_flg`

## Soft Delete Implementation

All models include soft delete functionality:

1. **del_flg field**: Boolean field that marks documents as deleted
2. **Query middleware**: Automatically excludes soft-deleted documents from queries
3. **Utility functions**: Helper functions in `utils/database.ts` for soft delete operations

## Database Utilities

The `utils/database.ts` file provides helper functions:

- `softDelete(model, id)`: Soft delete a document
- `restoreDocument(model, id)`: Restore a soft-deleted document
- `findWithDeleted(model, query)`: Find including soft-deleted documents
- `isValidObjectId(id)`: Validate MongoDB ObjectId
- `paginate(model, query, options)`: Pagination helper

## Usage Examples

```typescript
import { User, BuyerProfile, Product } from './models';

// Create a new user
const user = new User({
  email: 'user@example.com',
  password: 'password123',
  role: 'buyer'
});
await user.save();

// Find active products
const products = await Product.find({ type: 'banhmi' });

// Soft delete a product
await softDelete(Product, productId);

// Find with pagination
const result = await paginate(Order, { buyerId }, { page: 1, limit: 10 });
```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **10.3**: Soft delete functionality with del_flg
- **2.1**: Product management with type, stock, and options
- **3.1**: Order management with items and payment types
- **4.1**: Point system with transactions
- **5.1**: User profiles and contact requests

All models include proper validation, indexing for performance, and comprehensive error handling.