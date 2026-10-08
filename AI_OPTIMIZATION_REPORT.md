# AI Optimization Report

## ApparelFlow ERP — Production Batch Verification & Sewing Queue Gate

### 1. Tools & Prompting

AI assistance was used throughout the development of ApparelFlow ERP as an engineering productivity tool, not as a replacement for architectural ownership, testing, or security decisions.

The primary AI tool used was ChatGPT. It was used for:

- Initial project structure and backend/frontend scaffolding.
- TypeScript, Express, Next.js, Prisma, and database schema implementation.
- Designing the production-state workflow.
- Implementing component quantity calculations and verification rules.
- Drafting RBAC middleware and protected API routes.
- Writing unit and integration tests.
- Debugging compile-time, runtime, API, and frontend integration problems.
- Reviewing implementation against the practical challenge requirements.
- Improving defensive input validation and UI behavior.
- Preparing project documentation and the AI optimization report.

The development environment and supporting tools were IntelliJ IDEA, PowerShell, Git/GitHub, and Supabase PostgreSQL with Prisma ORM.

AI-generated code was treated as a starting point. The implementation was repeatedly compiled, tested, executed through the browser, and manually reviewed. Several generated assumptions were found to be incorrect when integrated with the real application.

### 2. AI-Generated Code That Was Flawed or Broken

#### Example 1 — Cutting Order Submit Response Missing Related Data

One AI-generated implementation updated a cutting order status after submission but returned an incomplete Prisma object. The frontend expected the response to contain the related recipe and verification-item data.

The frontend subsequently attempted to access recipe information from the returned order and produced a runtime error because the relation was missing.

The implementation was refactored so that the repository explicitly includes the required relations:

```ts
return prisma.cuttingOrder.update({
  where: { id },
  data: { status },
  include: {
    recipe: {
      include: {
        components: true,
      },
    },
    verificationItems: {
      include: {
        component: true,
      },
    },
  },
});
```

This was identified through actual browser testing after the supervisor submitted a cutting order.

**Human lesson:** AI can correctly understand an individual database update while still missing the response contract expected by the consuming UI. API response shapes must be verified end-to-end rather than trusted from generated code.

#### Example 2 — Sewing Queue Endpoint Mismatch

The first frontend implementation used the wrong sewing API path. The backend route exposed the sewing queue at:

```text
/api/sewing/queue
```

but the frontend initially requested the sewing module root instead.

This produced an integration failure even though both the frontend and backend code compiled successfully.

The frontend was corrected to request the explicit queue endpoint:

```ts
fetch(`${API_URL}/sewing/queue`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

The result was then verified by logging in as the `sewing_supervisor` role and confirming that only the approved order appeared in the queue.

**Human lesson:** Type checking and compilation do not prove that frontend API paths match backend route definitions. Browser-level integration testing is required for full-stack correctness.

### 3. Human Refactoring and Engineering Decisions

The most important engineering decisions were reviewed and enforced manually rather than relying on AI-generated UI behavior.

#### Server-Side Gatekeeper

The critical production rule was implemented on the backend:

- Every component must have a recorded count.
- A component below the expected quantity becomes `RED`.
- Any `RED` component prevents approval.
- Missing or incomplete verification prevents approval.
- Rejection requires a reason.
- Only a `cutting_verifier` can approve or reject a verification.
- Sewing queue results are filtered server-side to `VERIFIED` orders.

The approval decision is therefore not dependent on a disabled button in the frontend. The backend validates the same rule even if an evaluator calls the API directly.

#### RBAC

Role boundaries were implemented in Express middleware.

The three roles are:

- `cutting_supervisor`
- `cutting_verifier`
- `sewing_supervisor`

The backend uses authenticated JWT identity and role checks before protected operations. This prevents a frontend-only permission bypass.

For example, verification routes require the verifier role:

```ts
router.use(authenticate);
router.use(requireRole("cutting_verifier"));
```

The sewing queue requires:

```ts
router.use(authenticate);
router.use(requireRole("sewing_supervisor"));
```

#### State Machine

The production workflow was explicitly represented using a state machine:

```text
CUTTING_IN_PROGRESS
        ↓
PENDING_VERIFICATION
        ↓
COUNT_QC
        ↓
VERIFIED
        ↓
SEWING_QUEUE
```

Rejected batches follow the rejection path from `COUNT_QC` and cannot continue into production.

Invalid state transitions are rejected by domain logic rather than being left to frontend navigation.

#### Defensive Validation

Zod validation was added to API routes.

Additional domain-level guards reject invalid values such as:

- Negative quantities.
- Zero or invalid target quantities.
- Negative fabric values.
- Missing verification counts.
- Empty rejection reasons.
- Invalid state transitions.

The frontend also guards numeric inputs to reduce invalid requests before they reach the API.

#### Auditability

Verification logs record server-derived information including:

- Verifier identity.
- Verification decision.
- Rejection reason where applicable.
- Wastage percentage.
- Server-generated timestamp.

The verifier identity is obtained from the authenticated JWT rather than trusting an ID supplied by the client.

### 4. Defensive Architecture

The architecture was intentionally designed around the principle that the browser is an untrusted client.

#### Authentication Boundary

JWT authentication establishes the user identity before protected operations are executed.

The backend derives the user ID and role from the verified JWT.

The client cannot legitimately choose another verifier identity in the approval request.

#### Authorization Boundary

RBAC middleware checks the authenticated role before allowing access to role-specific endpoints.

This protects against direct API calls that bypass the UI.

#### Domain Boundary

Business rules are kept in domain functions such as:

- `verification-rules.ts`
- `state-machine.ts`
- `component-calculator.ts`
- `wastage-calculator.ts`

This makes the critical production rules independently testable.

#### Persistence Boundary

The database stores the order status and verification information. The application does not depend on browser state for the final production decision.

The sewing queue uses a server-side database condition:

```ts
where: {
  status: "VERIFIED",
}
```

Therefore, an unverified, pending, or rejected order cannot enter the sewing queue merely because a frontend request is manipulated.

#### Verification Boundary

Approval is allowed only when every verification item is `GREEN` or `YELLOW`.

The key rule is:

```text
GREEN  = actual == expected
YELLOW = actual > expected
RED    = actual < expected
```

Any `RED` component makes approval invalid.

This was tested both through automated tests and through the actual browser workflow.

### 5. Testing and Validation

AI-generated tests were reviewed and supplemented with actual integration verification.

The final automated test suite contains:

- Verification rule tests.
- Wastage calculation tests.
- State-machine tests.
- Approval tests.
- Rejection tests.
- RBAC tests.
- Sewing queue tests.

Final test result:

```text
Test Suites: 7 passed, 7 total
Tests:       27 passed, 27 total
Snapshots:   0 total
```

Additional validation performed during development included:

```text
Backend TypeScript check: PASSED
Backend production build: PASSED
Frontend TypeScript check: PASSED
Frontend production build: PASSED
```

Manual browser verification covered:

1. Cutting supervisor login.
2. Recipe visibility.
3. Cutting order creation.
4. Order submission for verification.
5. Cutting verifier login.
6. Component verification.
7. Successful GREEN approval.
8. Sewing supervisor login.
9. Verified order appearing in the sewing queue.
10. RED component hard-stop behavior.
11. Mandatory rejection reason.
12. Rejected order remaining outside the sewing queue.

### 6. Human Ownership of AI-Assisted Code

AI was used to accelerate implementation, but the final system was validated against real application behavior and the assessment requirements.

The development process followed this pattern:

```text
AI suggestion
    ↓
Human review
    ↓
Implementation
    ↓
TypeScript/build validation
    ↓
Automated tests
    ↓
Browser/API testing
    ↓
Defect discovered
    ↓
Human refactoring
    ↓
Retest
```

This process was particularly important for the production gatekeeper because a visually correct interface is not sufficient. The security and workflow constraints must survive direct API access, manipulated requests, refreshes, and invalid input.

The final implementation therefore prioritizes server-side enforcement over frontend assumptions.

### 7. Optimization Summary

AI provided significant acceleration for repetitive scaffolding, implementation, testing, debugging, and documentation. However, the development process demonstrated that generated code still requires engineering verification.

The main optimization was not simply generating more code. It was using AI iteratively while keeping the following responsibilities under human control:

- Defining the production workflow.
- Confirming the relational data model.
- Enforcing RBAC on the server.
- Enforcing the shortage hard stop on the server.
- Validating state transitions.
- Checking API contracts against frontend consumers.
- Running automated tests.
- Performing real browser verification.
- Reviewing generated code for defensive behavior.
- Maintaining the final Git history and project structure.

The resulting approach uses AI as an engineering assistant while retaining human ownership of correctness, security boundaries, integration behavior, and production readiness.
