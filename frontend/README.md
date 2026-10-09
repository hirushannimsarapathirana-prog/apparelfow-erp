# ApparelFlow ERP — Frontend

ApparelFlow ERP is a web-based garment production management system designed to support production order management, component verification, and sewing queue operations.

The frontend is built with Next.js and React and communicates with the ApparelFlow ERP backend API.

## Live Application

* **Frontend:** https://apparelfow-erp-nine.vercel.app/
* **Backend API:** https://apparelfow-erp-api.vercel.app/

## Technology Stack

* Next.js
* React
* TypeScript
* CSS and responsive UI components
* REST API integration
* Vercel deployment

## Core Workflows

The application is designed around three factory roles:

### 1. Cutting Supervisor

* Create cutting orders from production recipes.
* Specify batch quantities and fabric usage.
* Track cutting order status.
* Submit batches for verification.

### 2. Cutting Verifier

* Review cutting batches.
* Verify component quantities against expected quantities.
* Identify matching, excess, and shortage components.
* Approve valid batches or reject batches with a reason.

### 3. Sewing Supervisor

* View batches that have passed verification.
* Review verification information.
* Start sewing assembly for eligible batches.

## Getting Started

### Prerequisites

* Node.js compatible with the project dependencies
* npm
* Access to the backend API

### Installation

Clone the repository and navigate to the frontend directory:

```bash
git clone https://github.com/hirushannimsarapathirana-prog/apparelfow-erp.git
cd apparelfow-erp/frontend
npm install
```

### Environment Configuration

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=https://apparelfow-erp-api.vercel.app/api
```

This value assumes that the backend exposes its application routes under `/api`. Confirm the actual API route configuration before using it.

Never store database passwords, JWT secrets, or other private credentials in `NEXT_PUBLIC_` variables.

### Run Locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Production Build

```bash
npm run build
```

To run the production build locally:

```bash
npm run start
```

## Backend Integration and Security

The frontend communicates with the backend through the configured API base URL.

Security-sensitive operations must be validated on the server, including:

* Authentication and role-based access control.
* Component quantity validation.
* Approval and rejection rules.
* Prevention of batches with shortages from entering the sewing queue.
* Verification audit records and status transitions.

Disabling a button or hiding a page in the frontend must not be treated as a security boundary.

## Deployment

The frontend is deployed on Vercel.

Production URL: https://apparelfow-erp-nine.vercel.app/

Configure `NEXT_PUBLIC_API_URL` in the Vercel project environment settings. Redeploy the application after changing environment variables when required.

## Development and Testing

Run the available project checks using the scripts defined in `package.json`.

```bash
npm run build
```

Run automated tests using the test command configured for the project, if available.

## Related Documentation

See the repository root README for the complete system architecture, database schema, backend configuration, demo access instructions, and testing documentation.
