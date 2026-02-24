# Playwright Automation Framework Exercise

## Getting Started
1. Fork the repository
2. Clone it locally
3. Navigate to the `qa` directory
   ```bash
   cd qa
   ```
4. Install dependencies
   ```bash
   npm install
   ```


## Testing Website
https://automationintesting.online/

## Repository
https://github.com/mwinteringham/restful-booker-platform  
https://github.com/mwinteringham/restful-booker  

## API Docs
https://restful-booker.herokuapp.com/apidoc/index.html  



## Purpose of This Exercise

This exercise is designed to evaluate how you **design, structure, and reason about test automation**, not just how many tests you write.

We care about:
- Framework design and maintainability
- Thoughtful test strategy and layering
- Reliable state and data management
- Debuggability and CI readiness
- Your ability to explain tradeoffs and decisions

Quality and clarity matter more than volume.

Time expectation: 3 days.




## UI Automation Goals

### Booking Flow End to End
1. Select a room  
2. Pick check in and check out dates  
3. Enter guest details  
4. Submit booking  
5. Assert confirmation state in the UI  

### One Additional UI Scenario That Adds Real Coverage
Pick any additional scenario(s) of your choosing. This is an opportunity to demonstrate your QA judgement and how you think about risk and coverage.



## API Automation Goals

### Booking API Coverage
Automate at least two of the following operations:
1. Create booking  
2. Get booking  
3. Update booking  
4. Delete booking  



## Bonus Goal (Optional)

### Admin Authentication via API and Browser Session Reuse
Authenticate as an admin via API, store the authenticated session in the browser, and access an admin only URL without performing a UI login flow.

Notes:
- This application uses cookie based authentication with a `token` cookie
- The goal is to demonstrate clean session reuse and state management
- You do not need to automate the admin login UI



## Architecture and Design Expectations

We are intentionally leaving parts of this exercise open ended to understand how you approach automation design.

As part of your solution, be prepared to discuss:
- How your framework is structured and why
- What logic lives in tests vs fixtures vs helpers
- How authentication and state are handled
- How your approach reduces flake and maintenance cost
- What tradeoffs you made due to time constraints
- How this framework would scale with more tests and contributors



## Required Documentation

Include a README section in your submission that covers:

- High level framework architecture  
- Key design decisions and reasoning  
- How UI and API tests interact in your approach  
- How test data and dates are managed  
- How tests are executed locally  
- How you would run this in CI  
- What you would improve next with more time  



## Submission Instructions

1. Fork the repository to your own GitHub account  
2. Clone your fork locally  
3. Complete the exercise in your forked repository  
4. Push your changes to your fork  
5. Open a pull request back in https://github.com/Tekmetric/interview

Your pull request should include:
- Your implementation
- Any documentation added or updated
- Clear commit history where appropriate


## Interview Discussion

This is where your work comes to life. During the interview, you’ll walk us through your solution using the code you wrote and talk through your approach, decisions, and assumptions. We’re excited to understand how you think, not just what you built, so come ready to explain your reasoning and explore what you might improve with more time.

## Submission Notes

### High-Level Framework Architecture
- `playwright.config.ts` contains shared execution defaults and browser projects.
- `tests/ui/booking.spec.ts` contains three UI scenarios:
  - booking happy path
  - booking validation failure
  - double-booking prevention
- `tests/api/booking.spec.ts` covers create, get, and delete for bookings.
- `tests/helpers/date.ts` contains date utilities.
- `tests/helpers/booking-api.ts` contains API helper functions for auth and booking operations.

### Test File Map
| File | Layer | Purpose |
|---|---|---|
| `tests/ui/booking.spec.ts` | UI | Happy path booking, validation error scenario, and double-booking prevention scenario. |
| `tests/api/booking.spec.ts` | API | Authenticated create/get/delete booking flow. |
| `tests/helpers/date.ts` | Helper | Shared date math and UI/API date formatting. |
| `tests/helpers/booking-api.ts` | Helper | Shared API auth + booking CRUD helpers. |

### Key Design Decisions and Reasoning
- Dates are generated dynamically in tests to avoid stale-date failures.
- Booking creation is intentionally fail-fast: single room, single date window, explicit assertion.
- UI tests use resilient selectors (`role`, input `name`, URL patterns).
- UI scenarios are validated in Chrome and Firefox.
- The target site is a shared public environment. Fixed far-future date offsets are used to reduce booking collisions while keeping the tests deterministic and fail-fast.

### Refactoring and Iteration Process
This solution was built iteratively. I initially scaffolded the Playwright structure and test flows using AI-assisted tooling, then manually explored the application to validate behavior and refine selectors.

During refactoring I intentionally:
- Removed retry loops and session abstractions that added complexity without improving clarity.
- Replaced index-based selectors with label-anchored or role-based selectors where possible.
- Moved repeated UI actions (e.g., `Reserve Now` interactions) into small page-scoped helper functions to reduce duplication without introducing a full page-object layer.
- Simplified booking creation to a fail-fast model rather than masking collisions with retries.

The final structure reflects deliberate pruning. I preferred transparency and deterministic behavior over defensive abstraction, especially given this is a shared public demo environment.

### How UI and API Tests Interact
- UI tests validate complete user workflows and visible confirmation/error behavior.
- API tests validate service behavior directly (auth + create/get/delete).
- Shared helper functions keep authentication and date handling consistent across both layers.

### Setup and Teardown Strategy
- Each spec keeps explicit test-owned cleanup using `createdBookingIds`.
- `test.afterEach` logs in and deletes any created bookings for that spec file.
- This keeps lifecycle behavior transparent without fixture indirection.

### How Test Data and Dates Are Managed
- Guest identity data is generated uniquely where needed (`Date.now()`) to avoid duplicate collisions.
- Booking dates are calculated from the current date and formatted for each interface:
  - UI inputs: `DD/MM/YYYY`
  - API payloads: `YYYY-MM-DD`

### How Tests Are Executed Locally
```bash
npm install
npx playwright install
npm test
```

Focused runs:
```bash
npm run test:ui
npm run test:api
npm run test:headed
npm run test:debug
```

### How This Would Run in CI
- Run on every PR and main branch push.
- Install dependencies and Playwright browsers in the CI job.
- Run `npm test` with HTML/trace artifacts uploaded on failure.
- Optionally split UI/API into separate CI jobs for faster feedback.

### Improvements With More Time
- Add API update coverage if environment consistency allows it.
- Add optional room-availability or concurrency scenarios as non-blocking additional coverage.
- Add linting/formatting quality gates and a CI matrix.
- Introduce per-worker test data isolation (for example, room allocation or namespaced date offsets) to safely support parallel execution in a shared environment.
- Implement Playwright `storageState` session reuse to demonstrate API-authenticated browser context seeding (bonus objective).
