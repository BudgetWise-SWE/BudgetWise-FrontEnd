# 💰 Personal Budgeting System

A web-based application that helps users manage their personal finances by tracking income, expenses, budgets, and savings goals. The system provides insights through dashboards, reports, and alerts to support better financial decisions.

---

## 📌 Features

### 🔐 Authentication

* User registration (name, email, password)
* Secure login
* Error handling for invalid credentials

### 💵 Income Management

* Add income (amount, source, date)
* Automatic balance updates

### 💸 Expense Management

* Add expenses (amount, category, notes)
* Expense categorization
* Real-time expense tracking

### 🗂️ Category Management

* Predefined categories
* Create, edit, and delete custom categories

### 📊 Budget Management

* Create monthly budgets
* Set category-based spending limits
* Automatic budget tracking

### 📉 Budget Tracking

* Remaining budget calculation
* Alerts for exceeding limits

### 📈 Reports & Analytics

* Monthly financial summaries
* Charts and visualizations

### 🎯 Savings Goals

* Create savings targets
* Track progress percentage

### 📜 Transaction History

* View all transactions
* Filter by date and category

### 🏠 Dashboard

* Overview of income, expenses, and balance
* Recent transactions display

---

## 🏗️ System Architecture

The system follows the **C4 Model**:

* **Level 1 (Context):** User interacts with the system
* **Level 2 (Container):**

  * Web Application (Frontend)
  * Backend API
  * Database
* **Level 3 (Component):**

  * Auth, Transactions, Budget, Goals, Reports, Profile modules

---

## ⚙️ Tech Stack

### Frontend

* React.js
* HTML, CSS, JavaScript

### Backend

* Django REST Framework

### Database

* PostgreSQL

### External Services

* Email System (SMTP) for notifications

---

## 📂 Project Structure

```
personal-budgeting-system/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── backend/
│   ├── auth/
│   ├── transactions/
│   ├── budgets/
│   ├── goals/
│   └── reports/
│
├── database/
│
├── diagrams/
│   ├── context.puml
│   ├── container.puml
│   └── component.puml
│
└── README.md
```

---

## 🚀 Getting Started

### 🔹 Prerequisites

* Node.js
* Python 3.x
* PostgreSQL

---

### 🔹 Installation

#### 1. Clone the repository

```bash
git clone https://github.com/your-username/personal-budgeting-system.git
cd personal-budgeting-system
```

#### 2. Setup Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### 3. Setup Frontend

```bash
cd frontend
npm install
npm start
```

---

## 🔌 API Overview

| Method | Endpoint       | Description      |
| ------ | -------------- | ---------------- |
| POST   | /auth/register | Register user    |
| POST   | /auth/login    | Login user       |
| GET    | /transactions  | Get transactions |
| POST   | /transactions  | Add transaction  |
| GET    | /budgets       | Get budgets      |
| POST   | /goals         | Create goal      |

---

## 📧 Notifications

The system integrates with an email service to:

* Send verification emails
* Notify users about budget limits
* Send monthly reports

---

## 📊 Diagrams

The project includes:

* Context Diagram (C4 Level 1)
* Container Diagram (C4 Level 2)
* Component Diagram (C4 Level 3)

---

## 👨‍💻 Authors

* Your Name Here

---

## 📄 License

This project is for educational purposes (CS251 – Software Engineering).

---
