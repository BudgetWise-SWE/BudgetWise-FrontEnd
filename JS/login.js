const form = document.getElementById('login-form')

function simpleHash(str) {
    return btoa(str); // base64 encoding (NOT real hashing, just learning)
}

function login(email,password){

    const emailInput = document.getElementById("email")
    const email_error = document.getElementById("email-error")

    const passwordInput = document.getElementById("password")
    const password_error = document.getElementById("password-error");
    

    if(email === ""){

        emailInput.classList.remove("input-ok");
        emailInput.classList.add("input-error");

        email_error.textContent ="Please enter a your email"
        email_error.style.visibility = "visible"
        return false

    }

    if(password === ""){

        passwordInput.classList.remove("input-ok");
        passwordInput.classList.add("input-error");

        password_error.textContent ="Please enter a valid Password"
        password_error.style.visibility = "visible"
        return false
    }

    const users = JSON.parse(window.localStorage.getItem("users") )|| []
    
    console.log(typeof users)
    console.log(users)

    const foundUser = users.find(user => user.email == email);
    


    if(foundUser && foundUser.password === simpleHash(password)){


        localStorage.setItem('currentUser',
            JSON.stringify(foundUser)
        )
        return true;
        
    }else if(!foundUser){
        emailInput.classList.remove("input-ok");
        emailInput.classList.add("input-error");

        email_error.textContent ="user not found"
        email_error.style.visibility = "visible"
        return false
    }else{
        emailInput.classList.remove("input-ok");
        emailInput.classList.add("input-error");

        email_error.textContent ="email or password is incorrect"
        email_error.style.visibility = "visible"
        return false
    }

}





form.addEventListener('submit',(e)=> {
    e.preventDefault();

    const password = document.getElementById("password").value.trim()
    const email = document.getElementById("email").value.trim()
    
    console.log(email);
    console.log(password);

   const loginStatus = login(email,password)

    if(loginStatus){
        window.location.href = "index.html"
    }

});

