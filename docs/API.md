# ApparelFlow ERP API Documentation

## 1. API Overview

ApparelFlow ERP exposes a REST API built with:

* Node.js
* Express
* TypeScript
* Prisma ORM
* PostgreSQL / Supabase
* JWT authentication
* Zod validation

Base URL for local development:

```text
http://localhost:5000
```

API prefix:

```text
/api
```

Example:

```text
http://localhost:5000/api/auth/login
```

---

# 2. Authentication

Most API endpoints require authentication.

The API uses JWT bearer authentication.

Request header:

```http
Authorization: Bearer <JWT_TOKEN>
```

If authentication is missing:

```http
401 Unauthorized
```

If the authenticated user does not have the required role:

```http
403 Forbidden
```

---

# 3. Response Format

Successful responses generally follow:

```json
{
  "success": true,
  "data": {}
}
```

Error responses generally follow:

```json
{
  "success": false,
  "message": "Error message"
}
```

Validation errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {}
}
```

---

# 4. Health Check

## GET `/health`

Checks whether the API server is running.

### Authentication

Not required.

### Response

`200 OK`

```json
{
  "success": true,
  "message": "ApparelFlow ERP API is running"
}
```

---

# 5. Authentication API

## POST `/api/auth/login`

Authenticates a user and returns a JWT access token.

### Authentication

Not required.

### Request Body

```json
{
  "email": "supervisor@apparelfow.com",
  "password": "Password123!"
}
```

### Success Response

`200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "USER_UUID",
      "email": "supervisor@apparelfow.com",
      "fullName": "Cutting Supervisor",
      "role": "cutting_supervisor"
    },
    "token": "JWT_TOKEN"
  }
}
```

### Possible Errors

`401 Unauthorized`

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

# 6. User Roles

The system has three roles.

## `cutting_supervisor`

Responsibilities:

* Create cutting orders
* Submit cutting orders
* Create recipes
* Edit recipes
* View production data

Cannot:

* Approve verification
* Reject verification
* Access sewing queue

---

## `cutting_verifier`

Responsibilities:

* Review cutting orders
* Enter actual component quantities
* Approve valid batches
* Reject invalid batches

Cannot:

* Create recipes
* Edit recipes
* Create cutting orders
* Access sewing queue

---

## `sewing_supervisor`

Responsibilities:

* View verified production batches
* Manage the sewing queue workflow

Cannot:

* Approve verification
* Modify verification results
* Access unverified batches

---

# 7. Recipe API

## GET `/api/recipes`

Returns available recipes.

### Authentication

Required.

### Roles

All authenticated roles.

### Example Request

```http
GET /api/recipes
Authorization: Bearer <JWT_TOKEN>
```

### Response

`200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "RECIPE_UUID",
      "recipeCode": "REC-BL01",
      "name": "Casual Blouse",
      "category": "Blouse",
      "stdFabricYards": "1.800",
      "wastageCap": "5.00",
      "components": [
        {
          "id": "COMPONENT_UUID",
          "componentName": "Front Body Panel",
          "piecesPerGarment": "1.000"
        }
      ]
    }
  ]
}
```

---

## GET `/api/recipes/:id`

Returns a single recipe and its components.

### Authentication

Required.

### Roles

All authenticated roles.

### Example

```http
GET /api/recipes/RECIPE_UUID
Authorization: Bearer <JWT_TOKEN>
```

### Response

`200 OK`

```json
{
  "success": true,
  "data": {
    "id": "RECIPE_UUID",
    "recipeCode": "REC-BL01",
    "name": "Casual Blouse",
    "category": "Blouse",
    "stdFabricYards": "1.800",
    "wastageCap": "5.00",
    "components": []
  }
}
```

---

# 8. Create Recipe

## POST `/api/recipes`

Creates a new recipe.

### Authentication

Required.

### Required Role

```text
cutting_supervisor
```

### Request Body

```json
{
  "recipeCode": "REC-NEW01",
  "name": "Sample Shirt",
  "category": "Shirt",
  "stdFabricYards": 1.5,
  "wastageCap": 5,
  "components": [
    {
      "componentName": "Front Panel",
      "piecesPerGarment": 1
    },
    {
      "componentName": "Back Panel",
      "piecesPerGarment": 1
    }
  ]
}
```

### Response

`201 Created`

```json
{
  "success": true,
  "data": {}
}
```

### Authorization Failure

A non-supervisor receives:

```text
403 Forbidden
```

---

# 9. Update Recipe

## PUT `/api/recipes/:id`

Updates a recipe.

### Authentication

Required.

### Required Role

```text
cutting_supervisor
```

### Request Body

```json
{
  "name": "Updated Sample Shirt",
  "category": "Shirt",
  "stdFabricYards": 1.6,
  "wastageCap": 6,
  "components": [
    {
      "componentName": "Front Panel",
      "piecesPerGarment": 1
    },
    {
      "componentName": "Back Panel",
      "piecesPerGarment": 1
    }
  ]
}
```

### Response

`200 OK`

```json
{
  "success": true,
  "data": {}
}
```

---

# 10. Cutting Orders

A cutting order connects a production quantity with a recipe and fabric roll.

A newly created order starts in:

```text
CUTTING_IN_PROGRESS
```

---

# 11. Create Cutting Order

## POST `/api/cutting-orders`

Creates a new cutting order.

### Authentication

Required.

### Required Role

```text
cutting_supervisor
```

### Request Body

```json
{
  "recipeId": "RECIPE_UUID",
  "targetQty": 100,
  "fabricRollId": "ROLL-001",
  "actualFabricYds": 185
}
```

### Business Rules

The server:

1. Validates the recipe.
2. Validates the target quantity.
3. Calculates expected component quantities.
4. Creates verification items.
5. Sets initial component quantities to `null`.
6. Sets initial verification status to `RED`.
7. Creates the order in `CUTTING_IN_PROGRESS`.

Expected component quantity:

```text
piecesPerGarment × targetQty
```

### Response

`201 Created`

```json
{
  "success": true,
  "data": {
    "id": "ORDER_UUID",
    "orderNo": "CO-000001",
    "status": "CUTTING_IN_PROGRESS",
    "targetQty": 100
  }
}
```

---

# 12. Get Cutting Orders

## GET `/api/cutting-orders`

Returns cutting orders available to the authenticated user.

### Authentication

Required.

### Example

```http
GET /api/cutting-orders
Authorization: Bearer <JWT_TOKEN>
```

### Response

`200 OK`

```json
{
  "success": true,
  "data": []
}
```

---

# 13. Get Cutting Order

## GET `/api/cutting-orders/:id`

Returns a cutting order with recipe and verification information.

### Authentication

Required.

### Example

```http
GET /api/cutting-orders/ORDER_UUID
Authorization: Bearer <JWT_TOKEN>
```

### Response

`200 OK`

```json
{
  "success": true,
  "data": {
    "id": "ORDER_UUID",
    "orderNo": "CO-000001",
    "targetQty": 100,
    "status": "PENDING_VERIFICATION",
    "recipe": {},
    "verificationItems": []
  }
}
```

---

# 14. Submit Cutting Order

## POST `/api/cutting-orders/:id/submit`

Submits a cutting order for verification.

### Authentication

Required.

### Required Role

```text
cutting_supervisor
```

### State Transition

```text
CUTTING_IN_PROGRESS
        ↓
PENDING_VERIFICATION
```

### Example

```http
POST /api/cutting-orders/ORDER_UUID/submit
Authorization: Bearer <JWT_TOKEN>
```

### Response

`200 OK`

```json
{
  "success": true,
  "data": {
    "id": "ORDER_UUID",
    "status": "PENDING_VERIFICATION"
  }
}
```

### Invalid State

An order that cannot be submitted from its current state is rejected.

---

# 15. Verification API

Verification is the critical production-control boundary.

Only:

```text
cutting_verifier
```

can perform verification operations.

---

# 16. Get Verification Order

## GET `/api/verification/:orderId`

Returns an order prepared for component verification.

### Authentication

Required.

### Required Role

```text
cutting_verifier
```

### Example

```http
GET /api/verification/ORDER_UUID
Authorization: Bearer <JWT_TOKEN>
```

### Response

`200 OK`

```json
{
  "success": true,
  "data": {
    "id": "ORDER_UUID",
    "orderNo": "CO-000001",
    "status": "COUNT_QC",
    "verificationItems": [
      {
        "componentId": "COMPONENT_UUID",
        "expectedQty": "100.000",
        "actualQty": null,
        "status": "RED"
      }
    ]
  }
}
```

---

# 17. Update Verification Items

## PUT `/api/verification/:orderId/items`

Updates actual quantities for recipe components.

### Authentication

Required.

### Required Role

```text
cutting_verifier
```

### Request Body

```json
{
  "items": [
    {
      "componentId": "COMPONENT_UUID_1",
      "actualQty": 100
    },
    {
      "componentId": "COMPONENT_UUID_2",
      "actualQty": 105
    }
  ]
}
```

### Verification Status Calculation

The server calculates the status.

```text
actual < expected
        → RED

actual = expected
        → GREEN

actual > expected
        → YELLOW
```

The frontend cannot choose the final verification status.

### Example Response

```json
{
  "success": true,
  "data": [
    {
      "componentId": "COMPONENT_UUID_1",
      "expectedQty": "100.000",
      "actualQty": "100.000",
      "status": "GREEN"
    },
    {
      "componentId": "COMPONENT_UUID_2",
      "expectedQty": "100.000",
      "actualQty": "105.000",
      "status": "YELLOW"
    }
  ]
}
```

---

# 18. Approve Verification

## POST `/api/verification/:orderId/approve`

Approves a cutting batch after verification.

### Authentication

Required.

### Required Role

```text
cutting_verifier
```

### Critical Server-Side Rules

Approval is allowed only when:

1. Order is in `COUNT_QC`.
2. All expected components exist.
3. Every component has an actual quantity.
4. No component is `RED`.
5. All components are `GREEN` or `YELLOW`.
6. Actual fabric usage exists.
7. Wastage is calculated.
8. Verification audit log is created.

### Successful State Transition

```text
COUNT_QC
   ↓
VERIFIED
```

### Example

```http
POST /api/verification/ORDER_UUID/approve
Authorization: Bearer <VERIFIER_TOKEN>
```

### Success Response

`200 OK`

```json
{
  "success": true,
  "data": {
    "id": "ORDER_UUID",
    "status": "VERIFIED"
  }
}
```

---

# 19. RED Component Approval Protection

If any component is RED:

```text
POST /api/verification/:orderId/approve
```

returns:

```text
422 Unprocessable Entity
```

Example:

```json
{
  "success": false,
  "message": "Verification cannot be approved: all components must be GREEN or YELLOW."
}
```

The order must not become:

```text
VERIFIED
```

This rule is enforced on the server.

---

# 20. Missing Component Protection

If a component has not been counted:

```text
actualQty = null
```

the component is considered:

```text
RED
```

Approval is therefore blocked.

This prevents an incomplete verification from entering the sewing workflow.

---

# 21. Reject Verification

## POST `/api/verification/:orderId/reject`

Rejects a cutting batch.

### Authentication

Required.

### Required Role

```text
cutting_verifier
```

### Request Body

```json
{
  "rejectionReason": "Sleeve cuff shortage"
}
```

### Business Rule

A rejection reason is mandatory.

An empty reason:

```json
{
  "rejectionReason": ""
}
```

returns:

```text
422 Unprocessable Entity
```

### State Transition

```text
COUNT_QC
   ↓
REJECTED
```

### Success Response

`200 OK`

```json
{
  "success": true,
  "data": {
    "id": "ORDER_UUID",
    "status": "REJECTED"
  }
}
```

---

# 22. Verification Audit Logs

Every verification decision creates an immutable audit log.

The log records:

* Order
* Verifier
* Decision
* Rejection reason when applicable
* Wastage percentage when approved
* Server-generated timestamp

Possible decisions:

```text
APPROVED
REJECTED
```

Audit records are created by the backend and are not editable through the API.

---

# 23. Wastage Calculation

When a verification is approved, the backend calculates:

```text
Wastage % =
((Actual Fabric - Expected Fabric) / Expected Fabric) × 100
```

Expected fabric:

```text
Standard Fabric Yards × Target Quantity
```

Example:

```text
Standard fabric = 1.8
Target quantity = 100

Expected = 180 yards

Actual = 189 yards

Wastage = 5%
```

The calculated percentage is stored in the verification log.

---

# 24. Sewing Queue API

The sewing queue is intentionally restricted.

Only:

```text
sewing_supervisor
```

can access the queue.

---

# 25. Get Sewing Queue

## GET `/api/sewing/queue`

Returns only verified cutting batches.

### Authentication

Required.

### Required Role

```text
sewing_supervisor
```

### Critical Query Rule

The backend explicitly filters:

```text
status = VERIFIED
```

This is the final server-side production gate.

### Example

```http
GET /api/sewing/queue
Authorization: Bearer <SEWING_TOKEN>
```

### Response

`200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "ORDER_UUID",
      "orderNo": "CO-000001",
      "status": "VERIFIED",
      "targetQty": 100,
      "recipe": {
        "recipeCode": "REC-BL01",
        "name": "Casual Blouse"
      }
    }
  ]
}
```

---

# 26. Get Sewing Queue Item

## GET `/api/sewing/queue/:orderId`

Returns a verified order for the sewing supervisor.

### Authentication

Required.

### Required Role

```text
sewing_supervisor
```

### Security Rule

The query requires:

```text
status = VERIFIED
```

Therefore an unverified order cannot be accessed through the sewing queue endpoint.

---

# 27. State Machine

The production order state machine is:

```text
CUTTING_IN_PROGRESS
        │
        ▼
PENDING_VERIFICATION
        │
        ▼
COUNT_QC
     ┌──┴──┐
     │     │
     ▼     ▼
 VERIFIED REJECTED
     │
     ▼
SEWING_QUEUE
```

Valid transitions include:

```text
CUTTING_IN_PROGRESS → PENDING_VERIFICATION

PENDING_VERIFICATION → COUNT_QC

COUNT_QC → VERIFIED

COUNT_QC → REJECTED

VERIFIED → SEWING_QUEUE
```

Invalid transitions are rejected.

Example:

```text
COUNT_QC → SEWING_QUEUE
```

is invalid.

A batch must first become:

```text
VERIFIED
```

---

# 28. HTTP Status Codes

| Status | Meaning                            |
| ------ | ---------------------------------- |
| `200`  | Successful request                 |
| `201`  | Resource created                   |
| `401`  | Authentication required or invalid |
| `403`  | User does not have permission      |
| `404`  | Resource not found                 |
| `422`  | Validation/business rule failure   |
| `500`  | Internal server error              |

---

# 29. RBAC Security Matrix

| Endpoint             | Supervisor | Verifier | Sewing Supervisor |
| -------------------- | ---------: | -------: | ----------------: |
| Login                |          ✓ |        ✓ |                 ✓ |
| View Recipes         |          ✓ |        ✓ |                 ✓ |
| Create Recipe        |          ✓ |        ✗ |                 ✗ |
| Edit Recipe          |          ✓ |        ✗ |                 ✗ |
| Create Cutting Order |          ✓ |        ✗ |                 ✗ |
| Submit Cutting Order |          ✓ |        ✗ |                 ✗ |
| View Verification    |          ✗ |        ✓ |                 ✗ |
| Update Verification  |          ✗ |        ✓ |                 ✗ |
| Approve Verification |          ✗ |        ✓ |                 ✗ |
| Reject Verification  |          ✗ |        ✓ |                 ✗ |
| View Sewing Queue    |          ✗ |        ✗ |                 ✓ |

---

# 30. Critical Security Boundary

The frontend must never be considered the source of truth for production authorization.

The backend is responsible for enforcing:

```text
Authentication
      ↓
RBAC
      ↓
State Validation
      ↓
Component Verification
      ↓
Approval Rules
      ↓
Database Status
      ↓
Sewing Queue Access
```

The most important rule is:

```text
UNVERIFIED
    ↓
BLOCKED
    ↓
SEWING QUEUE
```

Only:

```text
VERIFIED
    ↓
SEWING QUEUE
```

is allowed.

---

# 31. Example End-to-End Flow

## Step 1 — Login

```http
POST /api/auth/login
```

Supervisor receives JWT.

---

## Step 2 — Create Cutting Order

```http
POST /api/cutting-orders
```

Order becomes:

```text
CUTTING_IN_PROGRESS
```

---

## Step 3 — Submit

```http
POST /api/cutting-orders/:id/submit
```

Order becomes:

```text
PENDING_VERIFICATION
```

---

## Step 4 — Verification

Verifier accesses:

```http
GET /api/verification/:orderId
```

Order enters:

```text
COUNT_QC
```

---

## Step 5 — Enter Actual Counts

```http
PUT /api/verification/:orderId/items
```

Server calculates:

```text
GREEN
YELLOW
RED
```

for each component.

---

## Step 6 — Approve

If all components are GREEN/YELLOW:

```http
POST /api/verification/:orderId/approve
```

Order becomes:

```text
VERIFIED
```

---

## Step 7 — Sewing Queue

Sewing supervisor requests:

```http
GET /api/sewing/queue
```

The verified batch is returned.

---

# 32. Failed Approval Example

Suppose expected quantities are:

```text
Front Body Panel = 100
Back Body Panel  = 100
Sleeves           = 200
```

Actual quantities:

```text
Front Body Panel = 100 → GREEN
Back Body Panel  = 95  → RED
Sleeves           = 200 → GREEN
```

Approval request:

```http
POST /api/verification/:orderId/approve
```

returns:

```text
422 Unprocessable Entity
```

The order remains unverified.

It cannot appear in:

```http
GET /api/sewing/queue
```

---

# 33. Successful Approval Example

Expected:

```text
Front Body Panel = 100
Back Body Panel  = 100
Sleeves           = 200
```

Actual:

```text
Front Body Panel = 100 → GREEN
Back Body Panel  = 102 → YELLOW
Sleeves           = 200 → GREEN
```

All components are acceptable.

Approval succeeds:

```text
200 OK
```

Order status:

```text
VERIFIED
```

The order can then appear in the sewing queue.

---

# 34. Testing Coverage

The API is covered by unit and integration tests.

Current result:

```text
Test Suites: 7 passed, 7 total
Tests:       27 passed, 27 total
```

Integration coverage includes:

```text
Approval
Rejection
RBAC
Sewing Queue
```

Unit coverage includes:

```text
Verification Rules
Wastage Calculator
State Machine
```

Critical requirements tested include:

* GREEN approval succeeds
* RED blocks approval
* Missing quantities block approval
* Rejection without reason fails
* Valid rejection succeeds
* Unauthorized roles receive `403`
* Unverified batches never appear in sewing queue
* Verified batches appear in sewing queue
* Invalid state transitions are rejected
* Wastage calculation is correct

---

# 35. Development Commands

Install dependencies:

```powershell
npm install
```

Generate Prisma client:

```powershell
npx prisma generate
```

Apply database schema:

```powershell
npx prisma db push
```

Seed database:

```powershell
npm run seed
```

Start development server:

```powershell
npm run dev
```

Run tests:

```powershell
npm test -- --runInBand
```

Type-check:

```powershell
npx tsc --noEmit
```

Build:

```powershell
npm run build
```

---

# 36. Demo Credentials

For local development:

### Cutting Supervisor

```text
Email: supervisor@apparelfow.com
Password: Password123!
Role: cutting_supervisor
```

### Cutting Verifier

```text
Email: verifier@apparelfow.com
Password: Password123!
Role: cutting_verifier
```

### Sewing Supervisor

```text
Email: sewing@apparelfow.com
Password: Password123!
Role: sewing_supervisor
```

These credentials are intended for the assessment/demo environment.

Production credentials must be changed.

---

# 37. Environment Variables

The backend requires:

```env
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_secure_jwt_secret
PORT=5000
```

Never commit the actual `.env` file to Git.

The repository should contain:

```text
.env.example
```

instead.

---

# 38. API Design Principles

The API follows these principles:

1. Authentication is enforced server-side.
2. Authorization is enforced server-side.
3. Business rules are implemented in domain services.
4. Validation occurs before business operations.
5. Critical approval operations use database transactions.
6. Verification decisions create immutable audit records.
7. Frontend state is never trusted for authorization.
8. Sewing access is protected by database status.
9. Numeric quantities are validated defensively.
10. Production state transitions are explicit.

---

# 39. Production Gate Summary

The complete production gate is:

```text
CUTTING
   │
   ▼
PENDING VERIFICATION
   │
   ▼
COUNT QC
   │
   ├── RED / MISSING
   │       │
   │       ▼
   │    BLOCKED
   │
   └── GREEN / YELLOW
           │
           ▼
        VERIFIED
           │
           ▼
      SEWING QUEUE
```

This server-side gate is the core business requirement of ApparelFlow ERP.
