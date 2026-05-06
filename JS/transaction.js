
import { setToStore , getFromStorage ,formatMoney ,addTransactionsToTable} from "./storage.js";


// for last transaction
const itemsPerPage = 8;
const total = document.getElementById("total_balance")

let currentPage = Number(getFromStorage('currentPage', 1));
total.textContent = formatMoney(getFromStorage('totalBalance',0))



// For rendering the transactiono the first time 
renderTransactions()



// formating the money



// update the total balance
function updateTotalBalance(newTransaction){
    let total  = JSON.parse(localStorage.getItem('totalBalance')); 
    const totalBalance = document.getElementById("total_balance")

    console.log(total)
    total += Number(newTransaction);
    
    localStorage.setItem('totalBalance',JSON.stringify(total))

    totalBalance.textContent = `${formatMoney(total)}`
}








// update the pagination bar
function updatePagination() {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || []

    const nextBtn = document.getElementById("next-btn")
    const prevBtn = document.getElementById("prev-btn")

    nextBtn.addEventListener('click',goToNextPage)
    prevBtn.addEventListener('click',goToPrevPage)


    const totalPages = Math.ceil(transactions.length / itemsPerPage);

    nextBtn.disabled = currentPage >= totalPages;
    prevBtn.disabled = currentPage === 1;
    console.log(currentPage)
}



//render the table of transactions
function renderTransactions() {

    let currentPage = getFromStorage('currentPage',1);

    const tableBody = document.querySelector("tbody");
    tableBody.innerHTML = "";

    const transactions = JSON.parse(localStorage.getItem('transactions')) || []
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    const pageItems = transactions.slice(start, end);

    pageItems.forEach(tran => {
        addTransactionsToTable(tran);
    });

    updatePagination();

}

// go to the next page and render
function goToNextPage() {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || []
    const totalPage = Math.ceil(transactions.length / itemsPerPage);

    if (currentPage < totalPage) {
        
        currentPage++;

        setToStore('currentPage',currentPage)

        renderTransactions();
    }
}

// go to the prev page and render 
function goToPrevPage() {
    if (currentPage > 1) {

        currentPage--;

        setToStore('currentPage',currentPage)

        renderTransactions();
    }
}




// validation of the transaction inputs
function validateTransaction(name,amountOfMoney,dataOfTransaction){


    if(name.value === "" ) {
        console.log("money is empty")
        name.classList.remove("input-ok");
        name.classList.add("input-error");
        return false
    }
    
    name.classList.remove("input-error");
    name.classList.add("input-ok");
   
    if(amountOfMoney.value === "" ) {
        console.log("money is empty")
        amountOfMoney.classList.remove("input-ok");
        amountOfMoney.classList.add("input-error");
        return false
    }
    
    amountOfMoney.classList.remove("input-error");
    amountOfMoney.classList.add("input-ok");
    
    if(dataOfTransaction.value === ""){
        console.log("no date")

        dataOfTransaction.classList.remove("input-ok");
        dataOfTransaction.classList.add("input-error");

        return false
    }
    
    dataOfTransaction.classList.remove("input-error");
    dataOfTransaction.classList.add("input-ok");

    return true;
}



// get the transaction
const transactionForm = document.getElementById("transaction-form")

transactionForm.addEventListener('submit',(e)=>{

    //Type of the transaction
    const type = document.getElementById("type")

    //name of the transaction
    const name = document.getElementById("name")

    // the transaction amout of money
    const amountOfMoney = document.getElementById("amount")

    // the category the money spent in 
    const category = document.getElementById("category")

    // data of transaction
    const dataOfTransaction = document.getElementById("tx-date")

    // note about the transaction 
    const notes  = document.getElementById("notes")

    e.preventDefault()
    if(validateTransaction(name,amountOfMoney,dataOfTransaction)){

       const transaction= {
            type : type.value,
            name : name.value,
            amountOfMoney : amountOfMoney.value ,
            dataOfTransaction : dataOfTransaction.value,
            category : category.value,
            notes : notes.value,
       }

        // updating the page table and total balance
        addTransactionsToTable(transaction)
        updateTotalBalance(transaction.amountOfMoney)


        

        //Push transactions to the local storage
        const transactions = JSON.parse(localStorage.getItem('transactions')) || []
        transactions.push(transaction)
        localStorage.setItem('transactions', JSON.stringify(transactions))


        // render the page for every transaction
        renderTransactions();


    }
})