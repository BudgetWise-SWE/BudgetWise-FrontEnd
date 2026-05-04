// total Balance of all Transactions
let total  =0; 
function formatMoney(amount) {
    const sign = amount < 0 ? "-" : "";
    return `${sign}$${Math.abs(amount)}`;
}

function updateTotalBalance(newTransaction){
    const totalBalance = document.getElementById("total_balance")

    console.log(total)
    total += Number(newTransaction);
    console.log(total)

    totalBalance.textContent = `${formatMoney(total)}`
}


function addToTransactionsTable(transaction){
    // const iconOfTransaction = document.getElementById("foodCategory")
   
    const colors  ={
         "Dining & Drinks":"orange",
         "Shopping" : "purple",
        "Transportation":"blue",
        "Heath" : "emerald",
        "Utilities":"red",
        "Entertainment":"gray"
    }

    // get the color of the type dynamically
    const color = colors[transaction.category]



    if(transaction.type =="Expense"){
        transaction.amountOfMoney = -transaction.amountOfMoney
    }    

    // handle money format 
    const formatedTransaction = formatMoney(transaction.amountOfMoney)

    if(transaction){
        
        const tr = document.createElement("tr")
        tr.className = "tx-row"

        tr.innerHTML = `
        <td class="tx-table__td">
        <div class="tx-desc">
            <div class="tx-icon tx-icon--${color}">
            <span class="material-symbols-outlined">restaurant</span>
            </div>
            <div class="tx-desc__text">
            <p class="tx-desc__name">${transaction.name}</p>
            <p class="tx-desc__note">${transaction.notes}</p>
            </div>
        </div>
        </td>

        <td class="tx-table__td">
        <span class="tx-badge tx-badge--${color}">${transaction.category}</span>
        </td>

        <td class="tx-table__td tx-table__td--date">${transaction.dataOfTransaction}</td>

        <td class="tx-table__td tx-table__td--amount">${formatedTransaction}</td>
    `;

    // 3. Append to table body
     document.querySelector("tbody").appendChild(tr)

     
    }
}







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
       addToTransactionsTable(transaction)
       updateTotalBalance(transaction.amountOfMoney)


       
       const transactions = JSON.parse(localStorage.getItem('transactions')) || []
       transactions.push(transaction)

       localStorage.setItem('transactions', JSON.stringify(transactions))
    }
})