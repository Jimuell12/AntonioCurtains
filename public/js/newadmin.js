import { onValue, signInWithEmailAndPassword, set, auth, createUserWithEmailAndPassword, database, ref, sendEmailVerification, signOut } from './firebase.js';

let currentUserUID = null; // Global variable to store the current user's UID
let authInitialized = false;

document.getElementById("submitButton").addEventListener('click', (event) => {
    Register(event);
});

function Register(event) {
    event.preventDefault();
    console.log(currentUserUID)
    const username = document.getElementById("Username").value;
    const email = document.getElementById("Email").value;
    const password = document.getElementById("Password").value;
    const confirmpassword = document.getElementById("confirmPassword").value;
    const name = document.getElementById("Name").value;
    const error = document.getElementById("logerror");

    if (!validatePasswordStrength(password)) {
        error.innerHTML = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
        error.style.display = 'flex';
        error.style.fontSize = '12px';
        return false;
    }

    if (!validateEmail(email)) {
        error.innerHTML = "Invalid email format.";
        error.style.display = 'flex';
        return false;
    }



    if (!username || !email || !password || !name) {
        error.innerHTML = "Please fill in all fields.";
        error.style.display = 'flex';
        return false;
    }

    if (password != confirmpassword) {
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
                userlevel: "Admin"
            })
                .then(() => {
                    if (currentUserUID != null) {
                        signOut(auth).then(() => {
                            const usersRef = ref(database, 'users/' + currentUserUID);
                            onValue(usersRef, (snapshot) => {
                                const userData = snapshot.val();
                                const email = userData.email
                                const password = userData.password;
                                console.log(userData)

                                signInWithEmailAndPassword(auth, email, password)
                                    .then((userCredential) => {
                                        window.location.href = './admin.html';
                                    })
                                    .catch((error) => {
                                        console.log("may eror")
                                    });
                            });
                        }).catch((error) => {
                            console.log(error)
                        });
                    } else {
                        window.location.href = "./admin.html";
                    }
                })
                .catch((error) => {
                    console.error("Error writing user details to the database", error);
                });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            var error = document.getElementById("logerror")
            if (errorCode == "auth/email-already-in-use") {
                error.innerHTML = "Email already in use"
            } else if (errorCode == "auth/weak-password") {
                error.innerHTML = "Weak password";
            }
            error.style.display = 'flex';
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

auth.onAuthStateChanged((user) => {
    if (user && !authInitialized) {
        currentUserUID = user.uid; // Set the current user's UID
        authInitialized = true; // Set the flag to indicate that authentication state has been initialized
    }
});