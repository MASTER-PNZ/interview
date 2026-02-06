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
