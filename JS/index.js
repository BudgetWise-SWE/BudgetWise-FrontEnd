const loginBtn = document.getElementById("login-btn")

function ifCurrentUser(){
    const currentUser = JSON.parse(localStorage.getItem('currentUser'))

    console.log(currentUser)
    if(currentUser && window.location.pathname.includes("index.html")){
        loginBtn.style.visibility = "hidden"
        return true
    }
    return false
}

loginBtn.addEventListener('click',()=>{
    window.location.href = "login.html"
})


const isCurrentUserFount = ifCurrentUser()


const getStartedButtons = document.getElementsByClassName("btn")

if(isCurrentUserFount){
    Array.from(getStartedButtons).forEach(element => {
        element.addEventListener('click',()=>{
            window.location.href= "../HTML/dashboard.html"
        })
    });
}else{
    Array.from(getStartedButtons).forEach(element => {
            element.addEventListener('click',()=>{
                window.location.href= "../HTML/login.html"
            })
        });
}





// const currentUser = JSON.parse(localStorage.getItem('currentUser'))
// console.log(currentUser)
// ifCurrentUser()