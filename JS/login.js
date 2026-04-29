const form = document.getElementById('login-form')



//mail validation
function validateMail(email){
    const emailInput = document.getElementById("email")
    const email_error = document.getElementById("email-error")

    const regEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if(email === ""){
        emailInput.classList.remove("input-ok");
        emailInput.classList.add("input-error");

        email_error.textContent ="Please enter a your email"
        email_error.style.visibility = "visible"
        return false
    }
    else if(!regEx.test(email)){
        emailInput.classList.remove("input-ok");
        emailInput.classList.add("input-error");

        email_error.textContent ="Please enter a correct email"
        email_error.style.visibility = "visible"
        console.log("Email is good send it")
        return false
    }

    emailInput.classList.remove("input-error");
    
        
    email_error.style.visibility = "hidden"
    return true

}



//password Validation
function validatePassword(password){

    const passwordInput = document.getElementById("password")

    const password_error = document.getElementById("password-error");

    let hasUpper = /[A-Z]/.test(password);
    let hasLower = /[a-z]/.test(password);
    let hasNum = /[0-9]/.test(password);
    let hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if(password === ""){

        passwordInput.classList.remove("input-ok");
        passwordInput.classList.add("input-error");

        password_error.textContent ="Please enter a valid Password"
        password_error.style.visibility = "visible"
        return false
    }else if(password.length < 8){

        passwordInput.classList.remove("input-ok");
        passwordInput.classList.add("input-error");

        password_error.textContent ="Password must contain more that 8 elements"
        password_error.style.visibility = "visible"
        return false

    }else if(!hasUpper || !hasLower || !hasNum ||!hasSpecial){

        passwordInput.classList.remove("input-ok");
        passwordInput.classList.add("input-error");

        password_error.textContent ="Password must contain '123$%^UPae' "
        password_error.style.visibility = "visible"
        return false

    }
    else{
        passwordInput.classList.remove("input-error");
        passwordInput.classList.add("input-ok");
        
        password_error.style.visibility= "hidden"
        return true
    }
}







form.addEventListener('submit',(e)=> {
    e.preventDefault();

    const password = document.getElementById("password").value.trim()
    const email = document.getElementById("email").value.trim()
    

    console.log(email);
    console.log(password);

   const isEmailGood = validateMail(email)
   const isPasswordGood = validatePassword(password)

   if(isEmailGood && isPasswordGood ) {
    console.log("Every thing is good")
   }



});

