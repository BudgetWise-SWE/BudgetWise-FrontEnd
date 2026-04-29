





const createAccountForm = document.getElementById("create-acc-form")


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



createAccountForm.addEventListener('submit',(e)=>{
    const confirmPassword = document.getElementById("confirmpass").value.trim();
    const password = document.getElementById("password").value.trim();
    const email = document.getElementById("email").value.trim();
    const username = document.getElementById("username").value.trim();


    let isPassOk = validatePassword(password);
    let 

});