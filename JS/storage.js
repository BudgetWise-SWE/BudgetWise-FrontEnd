export function getFromStorage(key, defaultValue) {
    const data = localStorage.getItem(key);

    if (!data) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
    }

    return JSON.parse(data);
}


export function setToStore(key, value) {
    try {
        const data = JSON.stringify(value ?? null);
        localStorage.setItem(key, data);
    } catch (error) {
        console.error("Error saving to localStorage:", error);
    }
}


export function formatMoney(amount) {
    const sign = amount < 0 ? "-" : "";
    return `${sign}$${Math.abs(amount)}`;
}


export function formatExpenses(amount){
    return `$${Math.abs(amount)}`
}



// add transaction to the table
export function addTransactionsToTable(transaction){
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