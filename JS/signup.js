
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

        console.log(password_error)
        password_error.textContent ="Please enter a valid Password"
        password_error.style.visibility = "visible"
        return false

    }else if(password.length < 8){

        passwordInput.classList.remove("input-ok");
        passwordInput.classList.add("input-error");

        password_error.textContent ="Password must be at least 8 characters"
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


function ValidateFullName(username){

    let full_name_regex = /^[A-Za-z]+(?:\s[A-Za-z]+)+$/
    

    const fullName = document.getElementById("fullname")
    const fullNameError = document.getElementById("fullname-error")

    let is_full_name_validation = full_name_regex.test(username)


    if(username===""){

        fullName.classList.remove("input-ok");
        fullName.classList.add("input-error");

        fullNameError.textContent ="Please enter your full name"
        fullNameError.style.visibility = "visible"
        return false

    }else if(username.length > 50){

        fullName.classList.remove("input-ok");
        fullName.classList.add("input-error");

        fullNameError.textContent ="Full name must be less than 50 char"
        fullNameError.style.visibility = "visible"
        return false

    }else if(!is_full_name_validation) {

        fullName.classList.remove("input-ok");
        fullName.classList.add("input-error");

        fullNameError.textContent ="Please enter a valid full name"
        fullNameError.style.visibility = "visible"
        return false
    }

    fullName.classList.remove("input-error");
    fullName.classList.add("input-ok");
        
    fullNameError.style.visibility = "hidden"
    return true


}


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


function validateConfirmPassword(confirmpass,password){

    const confirmpassInput = document.getElementById("confirmpass")
    const confirmpassError = document.getElementById("confirmpass-error");

    let hasUpper = /[A-Z]/.test(password);
    let hasLower = /[a-z]/.test(password);
    let hasNum = /[0-9]/.test(password);
    let hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);


    
    if(confirmpass === ""){

        confirmpassInput.classList.remove("input-ok");
        confirmpassInput.classList.add("input-error");

        confirmpassError.textContent ="Please confirm your Password"
        confirmpassError.style.visibility = "visible"
        return false}

    else if(confirmpass !== password){
        confirmpassInput.classList.remove("input-ok");
        confirmpassInput.classList.add("input-error");

        confirmpassError.textContent ="does not match your password"
        confirmpassError.style.visibility = "visible"
        return false
    
    }else if(confirmpass.length < 8){

        confirmpassInput.classList.remove("input-ok");
        confirmpassInput.classList.add("input-error");

        confirmpassError.textContent ="Password must be at least 8 characters"
        confirmpassError.style.visibility = "visible"
        return false

    }else if(!hasUpper || !hasLower || !hasNum ||!hasSpecial){

        confirmpassInput.classList.remove("input-ok");
        confirmpassInput.classList.add("input-error");

        confirmpassError.textContent ="Password must contain somthing like '123$%^UPae' "
        confirmpassError.style.visibility = "visible"
        return false

    }
    else{
        confirmpassInput.classList.remove("input-error");
        confirmpassInput.classList.add("input-ok");
        
        confirmpassError.style.visibility= "hidden"
        return true
    }
}

function simpleHash(str) {
    return btoa(str); // base64 encoding (NOT real hashing, just learning)
}




const users = JSON.parse(localStorage.getItem("users")) || []



createAccountForm.addEventListener('submit',(e) => {
    
    e.preventDefault()
    const confirmPassword = document.getElementById("confirmpass").value.trim();
    const password = document.getElementById("password").value.trim();
    const email = document.getElementById("email").value.trim();
    const fullName = document.getElementById("fullname").value.trim();

    

    let is_password_Ok = validatePassword(password);
    let is_full_name_ok = ValidateFullName(fullName);
    let is_email_ok = validateMail(email);
    let is_confirm_pass_ok = validateConfirmPassword(confirmPassword,password)

    if(is_full_name_ok && is_password_Ok && is_email_ok &&is_confirm_pass_ok ){
        const user ={
            fullname:fullName,
            email:email,
            password: simpleHash(password) // "hashed",
        }

        users.push(user)
        window.localStorage.setItem("users",JSON.stringify(users))
        console.log("information is added")
        
    }
    

});