import { applyActionCode, set, ref, database, onValue, signInWithEmailAndPassword, auth, verifyPasswordResetCode, confirmPasswordReset } from "./firebase.js";

const error = document.getElementById("logerror");
document.getElementById('submitButton').addEventListener('click', (event) => {
    error.style.display = "none"
    event.preventDefault();
    const password = document.getElementById('password').value
    const confirmpassword = document.getElementById('confirmPassword').value

    if (!validatePasswordStrength(password)) {
        error.innerHTML = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
        error.style.display = 'flex';
        error.style.fontSize = '12px';
        return false;
    }

    if (password === confirmpassword) {
        handleResetPassword(auth, oobCode, password)
    } else {
        alert("password is too weak or mismatched")
        return
    }
})

function validatePasswordStrength(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}

// Function to parse URL parameters
function getUrlParameter(name) {
    name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Retrieve the oobCode parameter from the URL
var oobCode = getUrlParameter('oobCode');
var mode = getUrlParameter('mode');

if(mode == "verifyEmail"){
    document.querySelector('.mainDiv').style.display = "none"
}else {
    document.querySelector('.mainDiv').style.display = "flex"
}

function updateUserPassword(uid, newPassword) {
    const userRef = ref(database, 'users/' + uid + '/password');
    set(userRef, newPassword).then(() => {

    }).catch((error) => {

    });
}

function handleResetPassword(auth, actionCode, newPassword) {

    verifyPasswordResetCode(auth, actionCode).then((email) => {
        const accountEmail = email;

        confirmPasswordReset(auth, actionCode, newPassword).then((resp) => {
            const user = auth.currentUser;
            if (user) {
                updateUserPassword(user.uid, newPassword);
            }
            alert("Password changed successfully!");
            signInWithEmailAndPassword(auth, accountEmail, newPassword)
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
                    const errorp = document.getElementById("logerror");
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    if (errorCode == "auth/invalid-email") {
                        errorp.innerHTML = "Invalid email";
                    } else if (errorCode == "auth/invalid-login-credentials") {
                        errorp.innerHTML = "Invalid password";
                    } else if (errorCode == "auth/too-many-requests") {
                        errorp.innerHTML = "Too many requests, try again later";
                    }
                    errorp.style.display = "flex";
                });
        }).catch((error) => {
            console.log(error)
        });
    }).catch((error) => {
        const errorp = document.getElementById("logerror");
        const errorCode = error.code;
        if (errorCode == "auth/invalid-action-code") {
            errorp.textContent = "Code Expires, Try reset password again.";
        }
        console.log(errorCode)
        errorp.style.display = 'flex';
    });
}

applyActionCode(auth, oobCode).then((resp) => {

    alert("Email has been verified.");
    window.location.href = '../index.html';
}).catch((error) => {
    console.log(error)
});

