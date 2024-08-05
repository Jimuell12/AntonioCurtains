import { sendPasswordResetEmail, set, auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, database, ref, onValue, sendEmailVerification } from './firebase.js';
document.getElementById("registerbutton").addEventListener('click', (event) => {
    Register(event);
});
function Register(event) {
    event.preventDefault();
    const username = document.getElementById("Username").value;
    const email = document.getElementById("Email").value;
    const password = document.getElementById("Password").value;
    const confirmpassword = document.getElementById("ConfirmPassword").value;
    const name = document.getElementById("Name").value;
    const address = document.getElementById("Address").value;
    const contact = document.getElementById("Contact").value;

    if (!validateEmail(email)) {
        const error = document.getElementById("regerror");
        error.innerHTML = "Invalid email format.";
        error.style.display = 'flex';
        return false;
    }

    if (!validatePasswordStrength(password)) {
        const error = document.getElementById("regerror");
        error.innerHTML = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
        error.style.display = 'flex';
        error.style.fontSize = '12px';
        return false;
    }

    if (!validateContact(contact)) {
        const error = document.getElementById("regerror");
        error.innerHTML = "Contact number must be 11 digits long and start with '09'.";
        error.style.display = 'flex';
        return false;
    }
    
    

    if (!username || !email || !password || !name || !address || !contact) {
        const error = document.getElementById("regerror");
        error.innerHTML = "Please fill in all fields.";
        error.style.display = 'flex';
        return false;
    }

    if(password != confirmpassword){
        const error = document.getElementById("regerror");
        error.innerHTML = "Password didn't Match";
        error.style.display = 'flex';
        return false;
    }
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            sendEmailVerification(user)
                .then(() => {
                    console.log("Email verification sent successfully");
                })
                .catch((error) => {
                    console.error("Error sending email verification", error);
                });
            const usersRef = ref(database, 'users/' + user.uid);
            set(usersRef, {
                username: username,
                password: password,
                email: email,
                name: name,
                address: address,
                pnumber: contact,
                userlevel: "Customer"
            })
                .then(() => {
                    console.log("User details written to the database successfully");
                    window.location.href = "../index.html";
                })
                .catch((error) => {
                    console.error("Error writing user details to the database", error);
                });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            var error = document.getElementById("regerror")
            if(errorCode == "auth/email-already-in-use"){
                error.innerHTML = "Email already in use"
            }else if (errorCode == "auth/weak-password"){
                error.innerHTML = "Weak password";
            }
            error.style.display = 'flex';
        });
    return false;
}
document.getElementById("loginbutton").addEventListener('click', (event) => {
    Login(event);
});
function Login(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!validateEmail(email)) {
        const error = document.getElementById("logerror");
        error.innerHTML = "Invalid email format.";
        error.style.display = 'flex';
        return false;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const usersRef = ref(database, 'users/' + user.uid);
            onValue(usersRef, (snapshot) => {
                const userData = snapshot.val();
                if (userData && userData.userlevel === 'Admin') {
                    window.location.href = './admin.html';
                } else {
                    window.location.href = '../index.html';
                }
            });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            if (errorCode == "auth/invalid-email") {
                document.getElementById("logerror").innerHTML = "Invalid email";
            } else if (errorCode == "auth/invalid-login-credentials") {
                document.getElementById("logerror").innerHTML = "Invalid password";
            } else if (errorCode == "auth/too-many-requests") {
                document.getElementById("logerror").innerHTML = "Too many requests, try again later";
            }
            document.getElementById("logerror").style.display = "flex";
        });
    return false;
}

function validatePasswordStrength(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}
function validateContact(contact) {
    const regex = /^09\d{9}$/;
    return regex.test(contact);
}

document.getElementById("forgot-password").addEventListener('click', () => {
    const email = document.getElementById("email").value
    if (email) {
        sendPasswordResetEmail(auth, email)
            .then(() => {
                alert('password reset link has been successfully sent to your email address.')
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log(errorMessage)
            });
    }else {
        alert("Please enter your email address in the provided input field.")
    }
})
document.getElementById('Contact').addEventListener('input', function(event) {
    const input = event.target;
    if (input.value.length > 11) {
        input.value = input.value.slice(0, 11); // Truncate input to 11 characters
    }
});
