# 💰 Personal Budgeting System – Frontend

This project is the **frontend implementation** of a Personal Budgeting Web Application. It provides users with an interactive interface to manage their finances, including tracking income, expenses, budgets, and savings goals.

---

## 📌 Features

### 🔐 Authentication UI

* Login and registration forms
* Client-side validation for user inputs
* Error handling and feedback messages

### 💵 Income & Expense Management

* Add and display income and expense records
* Categorized expense tracking
* Dynamic transaction list rendering

### 📊 Dashboard

* Overview of total income, expenses, and balance
* Recent transactions display
* Visual summaries using charts

### 📉 Budget Tracking

* Display budget limits and usage
* Visual indicators for budget status

### 🎯 Savings Goals

* UI for creating and tracking savings goals
* Progress display (percentage or progress bars)

### 📜 Transaction History

* List all transactions
* Filter by category or date (UI level)

---

## 🏗️ Architecture (Frontend)

The project follows a modular frontend structure:

* **UI Components:** Forms, tables, cards, charts
* **State Handling:** JavaScript-based state updates
* **API Integration:** Fetching and sending data via REST APIs
* **Separation of Concerns:** Organized into reusable components and services

---

## ⚙️ Tech Stack

* HTML5
* CSS3 (Flexbox / Grid)
* JavaScript (Vanilla JS)

### Optional Libraries (if used)

* Chart.js (for data visualization)
* Bootstrap / Tailwind (for styling)

---

## 📂 Project Structure

```id="6wr7w9"
frontend/
│
├── css/
│   └── styles.css
│
├── js/
│   ├── main.js
│   ├── transactions.js
│   └── utils.js
│
├── pages/
│   ├── dashboard.html
│   ├── transactions.html
│   ├── budget.html
│   └── goals.html
│
├── assets/
│   └── images/
│
└── index.html
```

---

## 🚀 Getting Started

### 🔹 Prerequisites

* Web browser (Chrome, Edge, Firefox)

---

### 🔹 Run the Project

1. Clone the repository:

```bash id="c4fy0h"
git clone https://github.com/your-username/personal-budgeting-frontend.git
cd personal-budgeting-frontend
```

2. Open the project:

* Open `index.html` in your browser
  OR
* Use Live Server (VS Code extension)

---

## 🔌 API Integration

The frontend communicates with a backend API using:

* `fetch()` or `XMLHttpRequest`
* JSON data format

Example:

```javascript id="8a5q7k"
fetch('/api/transactions')
  .then(response => response.json())
  .then(data => console.log(data));
```

---

## 📊 UI & UX Highlights

* Responsive design for different screen sizes
* Clean and modern layout
* Interactive elements and real-time updates
* User-friendly navigation

---

## 📧 Notes

* This project focuses only on the **frontend layer**
* Backend services (authentication, database, APIs) are handled separately

---

## 👨‍💻 Author

* Basem Mohamed
* Abdelrahman Tarek

---

## 📄 License

This project is for educational purposes (CS251 – Software Engineering).
