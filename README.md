# BudgetWise – Frontend

A personal budgeting web application for tracking income, expenses, budgets, and savings goals.

## Features

- **Authentication** — Login and registration with client-side validation
- **Income & Expense Management** — Add, edit, and delete transactions with categorized tracking
- **Dashboard** — Overview of total income, expenses, and balance with Chart.js visualizations
- **Budget Tracking** — Budget limits with status indicators per category
- **Savings Goals** — Goal creation with progress bars
- **Transaction History** — Full history with edit/delete actions

## Tech Stack

- HTML5
- CSS3 (Flexbox / Grid)
- JavaScript (Vanilla JS, ES Modules)
- Chart.js
- JSDoc

## Project Structure

```
BudgetWise-FrontEnd/
├── CSS/          # Stylesheets
├── HTML/         # Page templates
├── JS/           # JavaScript modules (ES modules)
├── assets/       # Static assets
├── jsdoc.json    # JSDoc configuration
├── package.json
└── README.md
```

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/BudgetWise-SWE/BudgetWise-FrontEnd.git
cd BudgetWise-FrontEnd
```

2. Open `index.html` in your browser, or use Live Server (VS Code extension).

3. Generate API documentation:

```bash
npm install
npm run docs
```

## API Integration

The frontend communicates with a Django REST backend via `fetch()`. All API calls are centralized in `JS/api.js`.

## Documentation

Generated JSDoc documentation is available in the `docs/` directory. Run `npm run docs` to regenerate.

## Authors

- Basem Mohamed
- Abdelrahman Tarek

## License

Educational project for CS251 – Software Engineering.
