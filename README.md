# ApparelFlow ERP

**Production Batch Verification & Sewing Queue Gate**

ApparelFlow ERP is a full-stack apparel production workflow application designed to manage cutting orders, component verification, fabric wastage calculations, and sewing queue eligibility.

The system enforces a server-side verification gate to prevent unverified, incomplete, or mismatched cutting batches from entering the sewing workflow.

## Live Demo

* **Frontend:** https://apparelfow-erp-nine.vercel.app/
* **Backend API:** https://apparelfow-erp-api.vercel.app/
* **Repository:** https://github.com/hirushannimsarapathirana-prog/apparelfow-erp

> Deployment URLs are provided for demonstration. Availability depends on the current deployment configuration.

## Key Features

* JWT-based authentication
* Role-based access control (RBAC)
* Recipe and recipe-component management
* Cutting order creation and submission
* Component quantity verification
* GREEN, YELLOW, and RED verification results
* Server-side approval and rejection rules
* Mandatory rejection reasons
* Fabric consumption and wastage calculations
* Immutable verification audit records
* Database-enforced sewing queue eligibility
* Request validation and defensive error handling
* Unit and integration testing

## Business Rule

A cutting batch cannot be approved for sewing unless every required recipe component has been counted and verified.

| Verification condition                     | Result           | Approval |
| ------------------------------------------ | ---------------- | -------- |
| Actual quantity equals expected quantity   | GREEN            | Allowed  |
| Actual quantity exceeds expected quantity  | YELLOW           | Allowed  |
| Actual quantity is below expected quantity | RED              | Blocked  |
| Component is missing or uncounted          | RED / incomplete | Blocked  |

The backend is responsible for enforcing these rules. Frontend visibility alone is not considered an authorization or verification control.

An approval attempt with invalid verification data is rejected with HTTP `422`. Unauthorized requests are rejected with HTTP `403`.

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript

### Backend

* Node.js
* Express
* TypeScript
* Prisma ORM
* PostgreSQL / Supabase
* JWT authentication
* bcrypt password hashing
* Zod request validation

### Testing

* Jest
* Supertest

### Deployment

* Vercel for the deployed application components, according to the configured deployment setup
* Supabase PostgreSQL for persistent database storage, if configured as described below

## Architecture

```text
┌─────────────────────────┐
│       Next.js UI        │
│        Frontend         │
└────────────┬────────────┘
             │ REST API
             ▼
┌─────────────────────────┐
│    Express + TypeScript │
│         Backend         │
│                         │
│ Auth / RBAC / Validation│
│ Verification / Audit    │
└────────────┬────────────┘
             │ Prisma ORM
             ▼
┌─────────────────────────┐
│   PostgreSQL Database   │
│   Supabase (if used)    │
└─────────────────────────┘
```

## Repository Structure

```text
apparelfow-erp/
├── frontend/
│   └── Next.js application
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   ├── database/
│   │   ├── domain/
│   │   ├── routes/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── prisma/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   └── API.md
├── AI_OPTIMIZATION_REPORT.md
└── README.md
```

> Keep this tree aligned with the actual files in the repository. If the AI report currently lives in `docs/AI-OPTIMIZATION-REPORT.md`, either retain that path here or move it to the assessment-required root-level filename.

## Production Workflow

```text
CUTTING_IN_PROGRESS
        |
        v
PENDING_VERIFICATION
        |
        v
     COUNT_QC
      /    \
     v      v
 VERIFIED  REJECTED
     |
     v
 SEWING_QUEUE
```

The backend must validate the current order state before allowing a transition. The sewing queue must return only orders whose persisted status is `VERIFIED`.

## Roles and Permissions

### Cutting Supervisor

* Log in
* View, create, and edit recipes
* Create cutting orders
* Submit cutting orders for verification

Cannot verify batches, approve verification, or access the sewing queue.

### Cutting Verifier

* Log in
* View pending verification batches
* Enter actual component quantities
* Approve batches that pass verification
* Reject batches with a reason

Cannot create or edit recipes, create cutting orders, or access the sewing queue.

### Sewing Supervisor

* Log in
* View verified batches
* View the sewing queue

Cannot approve verification, modify verification results, or access unverified batches.

> The backend must enforce role permissions for every protected endpoint, independently of frontend navigation or visibility.

## Server-Side Verification Gate

Before approval, the backend must confirm that:

1. The cutting order is in `COUNT_QC`.
2. Every required recipe component is present.
3. Every component has an actual quantity.
4. No component has a RED result.
5. Actual fabric usage is supplied and valid.
6. Wastage is calculated using the configured formula.
7. An audit record is created for the verification action.
8. The order status is updated to `VERIFIED`.

Approval and its related audit records should be handled transactionally so a failed operation does not leave partially updated verification data.

The sewing queue must query persisted records using:

```text
status = VERIFIED
```

This prevents an unverified batch from entering the sewing workflow by bypassing the frontend.

## Recipe Definitions

### Casual Blouse

* **Recipe code:** `REC-BL01`
* **Standard fabric:** 1.8 yards per garment
* **Wastage cap:** 5%

| Component          | Expected quantity per garment |
| ------------------ | ----------------------------: |
| Front Body Panel   |                             1 |
| Back Body Panel    |                             1 |
| Sleeves Left/Right |                             2 |
| Collar & Stand     |                             1 |
| Sleeve Cuffs       |                             2 |

### Crop Top

* **Recipe code:** `REC-CT02`
* **Standard fabric:** 1.1 yards per garment
* **Wastage cap:** 8%

| Component          | Expected quantity per garment |
| ------------------ | ----------------------------: |
| Front Chest Panel  |                             1 |
| Back Support Panel |                             1 |
| Neck Binding Strip |                             1 |
| Hem Elastic Casing |                             1 |
| Side Strap Accents |                             2 |

## Fabric and Wastage Calculation

Expected fabric usage:

```text
Expected Fabric = Standard Fabric per Garment × Target Quantity
```

Wastage percentage:

```text
Wastage % =
((Actual Fabric - Expected Fabric) / Expected Fabric) × 100
```

Example:

```text
Standard fabric = 1.8 yards
Target quantity = 100 garments

Expected fabric = 1.8 × 100
                = 180 yards

Actual fabric   = 189 yards

Wastage %       = ((189 - 180) / 180) × 100
                = 5%
```

Numeric inputs should be validated on the server to reject invalid values, including non-numeric quantities, negative quantities, and invalid fabric measurements.

## Database Model

The main entities are:

* `users`
* `recipes`
* `recipe_components`
* `cutting_orders`
* `verification_items`
* `verification_logs`

Conceptual relationships:

```text
User
 ├── Cutting Orders
 └── Verification Logs

Recipe
 ├── Recipe Components
 └── Cutting Orders

Cutting Order
 ├── Verification Items
 └── Verification Logs

Recipe Component
 └── Verification Items
```

Verification logs serve as audit records and should be append-only through the application's normal workflows. Audit records should capture the verifier identity from the authenticated session, the verification timestamp, component count variances, and wastage information where applicable.

## Authentication and Security

The application uses JWT bearer authentication.

Example request header:

```http
Authorization: Bearer <token>
```

The JWT payload contains the authenticated user's identity and role, for example:

```json
{
  "userId": "user-id",
  "role": "cutting_verifier"
}
```

Token expiration and signing configuration must match the backend implementation. The current intended token lifetime is eight hours.

Security measures include:

* JWT authentication
* Server-side role authorization
* bcrypt password hashing
* Zod request validation
* Server-side verification rules
* Explicit order-status checks
* Transactional approval operations
* Verification audit records
* Defensive numeric validation
* No reliance on frontend-only approval checks

The authenticated user identity and audit timestamp must be derived by the backend, not trusted from client-supplied request fields.

## Local Development Setup

### Prerequisites

Install the versions of Node.js and npm supported by the project. A configured PostgreSQL database is also required.

### 1. Clone the repository

```powershell
git clone https://github.com/hirushannimsarapathirana-prog/apparelfow-erp.git
cd apparelfow-erp
```

### 2. Configure the backend

```powershell
cd backend
npm install
```

Create a `.env` file using `.env.example` as a reference. Configure the environment variables required by the actual backend implementation. Typical variables include:

```env
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_secure_random_secret
PORT=5000
```

If Prisma uses a separate direct database connection for migrations, configure `DIRECT_URL` as required by the project's Prisma schema and database provider.

Do not commit `.env` or production secrets to Git.

### 3. Prepare the database

```powershell
npx prisma generate
npx prisma db push
```

Run the seed command only if a seed script is configured in `backend/package.json`:

```powershell
npm run seed
```

For a production database, use the project's intended migration workflow rather than applying schema changes without review.

### 4. Start the backend

```powershell
npm run dev
```

The local API is expected to run at `http://localhost:5000` when configured with `PORT=5000`.

Health check:

```text
GET /health
```

Expected response:

```json
{
  "success": true,
  "message": "ApparelFlow ERP API is running"
}
```

### 5. Configure the frontend

Open another PowerShell terminal:

```powershell
cd frontend
npm install
```

Create `frontend/.env.local` and set the API base URL to the local backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

This value assumes the frontend appends API routes to `NEXT_PUBLIC_API_URL`. Match the variable and URL format to the actual frontend API client.

Start the frontend:

```powershell
npm run dev
```

Open the local URL shown by Next.js, usually `http://localhost:3000`.

## Testing and Build

Run the commands from the `backend` directory.

### Run automated tests

```powershell
npm test -- --runInBand
```

### TypeScript validation

```powershell
npx tsc --noEmit
```

### Production build

```powershell
npm run build
```

The test suite should verify:

* GREEN and YELLOW approval
* RED component rejection
* Missing or uncounted component protection
* Mandatory rejection reason
* Unauthorized role rejection
* Sewing queue filtering
* Valid state transitions
* Wastage calculations
* Audit logging

> Update the test totals below only after running the tests successfully in the current repository.

```text
Test Suites: [verify actual result]
Tests:       [verify actual result]
```

## API Overview

The following endpoints describe the intended API surface. Confirm the paths against the actual Express routes.

### Authentication

```text
POST /api/auth/login
```

### Recipes

```text
GET    /api/recipes
GET    /api/recipes/:id
POST   /api/recipes
PUT    /api/recipes/:id
```

### Cutting Orders

```text
GET    /api/cutting-orders
GET    /api/cutting-orders/:id
POST   /api/cutting-orders
POST   /api/cutting-orders/:id/submit
```

### Verification

```text
GET    /api/verification/:orderId
PUT    /api/verification/:orderId/items
POST   /api/verification/:orderId/approve
POST   /api/verification/:orderId/reject
```

### Sewing Queue

```text
GET /api/sewing/queue
GET /api/sewing/queue/:orderId
```

See `docs/API.md` for detailed request formats, response structures, validation errors, and authorization requirements.

## Demo Accounts

Use only accounts that have actually been created by the project's seed script or demo database.

If the following accounts are configured in your local demo database, they can be documented as follows:

| Role               | Email                       | Password       |
| ------------------ | --------------------------- | -------------- |
| Cutting Supervisor | `supervisor@apparelfow.com` | `Password123!` |
| Cutting Verifier   | `verifier@apparelfow.com`   | `Password123!` |
| Sewing Supervisor  | `sewing@apparelfow.com`     | `Password123!` |

These credentials are examples for local assessment/demo use, not production credentials. Do not expose real production credentials in this README. Change default passwords before deploying any demo account publicly.

## AI-Assisted Development

AI assistance may be used to accelerate architecture planning, domain-rule design, test-case generation, API structure, validation design, documentation, and edge-case identification.

Human review remains responsible for checking:

* Business-rule correctness
* Authorization and security boundaries
* Database design and data integrity
* Test execution and interpretation
* Production deployment decisions

See `AI_OPTIMIZATION_REPORT.md` in the repository root for the assessment report. Keep the report aligned with the actual AI-assisted workflow and the work that was reviewed and tested.

## Project Status

Keep this checklist synchronized with the implementation in the repository.

### Backend

* [ ] Database schema and persistence verified
* [ ] Authentication and RBAC verified
* [ ] Recipe management verified
* [ ] Cutting-order workflow verified
* [ ] Component verification rules verified
* [ ] Approval and rejection gates verified
* [ ] Audit logging verified
* [ ] Wastage calculations verified
* [ ] Sewing queue filtering verified
* [ ] Automated tests passing
* [ ] TypeScript validation and build passing

### Frontend

* [ ] Login UI verified
* [ ] Role-based views verified
* [ ] Cutting-order UI verified
* [ ] Verification UI verified
* [ ] Sewing queue UI verified
* [ ] Error and loading states verified
* [ ] Responsive layout verified

### Documentation

* [ ] README matches the actual repository
* [ ] API documentation checked
* [ ] Root-level AI optimization report added
* [ ] Environment example checked
* [ ] Setup and demo instructions tested

## License

This project was created as an engineering assessment/demo application.
