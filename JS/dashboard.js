import { formatMoney, getFromStorage ,setToStore, formatExpenses ,addTransactionsToTable} from "./storage.js"
// import { addTransactionsToTable } from "./transaction.js"

const numberOfTransaction = document.getElementById("num-of-trans")
const totalIncome = document.getElementById("total-income")
const totalExpenses = document.getElementById("total-expenses")
const remaining = document.getElementById("remaining")

const transactions = getFromStorage('transactions',[])
console.log(transactions)

totalIncome.textContent = formatMoney(total_income())
totalExpenses.textContent = formatExpenses(total_expenses())
remaining.textContent = formatMoney(total_income() + total_expenses())
numberOfTransaction.textContent = transactions.length


let resentTransactions  = transactions;
if(transactions.length > 4) {
     resentTransactions = transactions.slice(-4).reverse()
}


for(let i in resentTransactions){
    addTransactionsToTable(resentTransactions[i])
}














function total_income(){

    let income = 0;
    transactions.forEach(element => {
        if(element.type === 'Income'){
            income += Number(element.amountOfMoney)
        }
    });

    return income
}

function total_expenses(){

    let expenses = 0;
    transactions.forEach(element => {
        if(element.type === 'Expense'){
            expenses += Number(element.amountOfMoney)
        }
    });

    return expenses
}



