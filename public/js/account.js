import { updatePassword, getDownloadURL, uploadBytes, sref, storage, update, child, auth, logout, database, ref, get } from './firebase.js'
document.querySelector(".logout-button").addEventListener('click', logout)
document.querySelector(".cancel-button").addEventListener('click', toggleUpdateForm)
document.querySelector(".update-button").addEventListener('click', () => {
    const user = auth.currentUser
    if (user) {
        populateUpdateFormsetting(user.uid)
        populateUpdateForm(user.uid)
        toggleUpdateForm(true)
    }
})
export function toggleUpdateForm(isSetting) {
    const updateForm = document.querySelector('#overlay');
    updateForm.style.display = updateForm.style.display === 'none' ? 'flex' : 'none';
}
const usersRef = ref(database, 'users');
var updateUsernameInput = document.getElementById('update-username');
var updatePasswordInput = document.getElementById('update-password');
var updateNameInput = document.getElementById('update-name');
var updateContactInput = document.getElementById('update-contact');
var updateEmailInput = document.getElementById('update-email');
var updateAddressInput = document.getElementById('update-address');
var updateaccounttype = document.getElementById('update-account-type');
var userUserName = document.getElementById("userUserName");
var userName = document.getElementById("userName")
var userContact = document.getElementById("userContact")
var userEmail = document.getElementById("userEmail")
var userAddress = document.getElementById("userAddress")
var profilePicture = document.getElementById("profilePicture");
const updateSubmitButton = document.querySelector('.update-submit-button');
export async function populateUpdateForm(uid) {
    const userKey = uid
    if (userKey) {
        const userSnapshot = await get(child(usersRef, userKey));
        const userData = userSnapshot.val();
        updateUsernameInput.value = userData.username || '';
        updatePasswordInput.value = userData.password || '';
        updateNameInput.value = userData.name || '';
        updateContactInput.value = userData.pnumber || '';
        updateEmailInput.value = userData.email || '';
        updateAddressInput.value = userData.address || '';
        if (updateaccounttype) {
            updateaccounttype.value = userData.userlevel || '';
        }
        updateSubmitButton.setAttribute('id', userKey);
    } else {
        updateUsernameInput.value = '';
        updatePasswordInput.value = '';
        updateNameInput.value = '';
        updateContactInput.value = '';
        updateEmailInput.value = '';
        updateAddressInput.value = '';
        updateaccounttype.value = "Customer";
    }
}
export async function populateUpdateFormsetting(uid) {
    const userKey = uid
    if (userKey) {
        const userSnapshot = await get(child(usersRef, userKey));
        const userData = userSnapshot.val();
        userUserName.textContent = userData.username || '';
        userName.textContent = userData.name || '';
        userContact.textContent = userData.pnumber || '';
        userEmail.textContent = userData.email || '';
        userAddress.textContent = userData.address || '';
        profilePicture.src = userData.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
    }
}
updateSubmitButton.addEventListener('click', updateDetails);
async function updateDetails() {
    const userkey = updateSubmitButton.getAttribute("id")
    const updatedUsername = updateUsernameInput.value;
    const updatedPassword = updatePasswordInput.value;
    const updatedName = updateNameInput.value;
    const updatedContact = updateContactInput.value;
    const updatedEmail = updateEmailInput.value;
    const updatedAddress = updateAddressInput.value;
    const profileURL = profilePicture.src;
    const userlevel = updateaccounttype.value;

    if (!validateContact(updatedContact)) {
        alert("Contact number must be 11 digits long and start with '09'.");
        return false;
    }
    const usersRef = ref(database, 'users');
    if (userkey) {
        const postData = {
            username: updatedUsername,
            name: updatedName,
            password: updatedPassword,
            pnumber: updatedContact,
            email: updatedEmail,
            userlevel: userlevel,
            profilePicture: profileURL,
            address: updatedAddress,
        }
        const updates = {};
        updates[userkey] = postData
        update(usersRef, updates)
        toggleUpdateForm();
        populateUpdateFormsetting(userkey)
    }
    const user = auth.currentUser
    const newPassword = updatedPassword
    updatePassword(user, newPassword).then((mess) => {
        alert('Details have been successfully updated.')
    }).catch((error) => {
        console.log(error)
    });
}
document.getElementById('profilePictureInput').addEventListener('change', handleProfilePictureChange);
function handleProfilePictureChange(event) {
    const user = auth.currentUser;
    const userKey = user ? user.uid : null;
    const usersRef = ref(database, 'users');
    const storageRef = sref(storage, 'profile-pictures/' + userKey);
    const file = event.target.files[0];
    if (file) {
        const uploadTask = uploadBytes(storageRef, file);
        uploadTask.then((snapshot) => {
            getDownloadURL(snapshot.ref).then((downloadURL) => {
                const updates = {};
                updates[`${userKey}/profilePicture`] = downloadURL;
                update(usersRef, updates);
                document.getElementById('profilePicture').src = downloadURL;
            }).catch((error) => {
                console.error('Error getting download URL:', error);
            });
        }).catch((error) => {
            console.error('Error uploading file:', error);
        });
    }
}
export async function addNewAccount() {
    const usersRef = ref(database, 'users');
    var updateUsernameInput = document.getElementById('update-username');
    var updatePasswordInput = document.getElementById('update-password');
    var updateNameInput = document.getElementById('update-name');
    var updateContactInput = document.getElementById('update-contact');
    var updateEmailInput = document.getElementById('update-email');
    var updateAddressInput = document.getElementById('update-address');
    var updateaccounttype = document.getElementById('update-account-type');
    const newUsername = updateUsernameInput.value;
    const newPassword = updatePasswordInput.value;
    const newName = updateNameInput.value;
    const newContact = updateContactInput.value;
    const newEmail = updateEmailInput.value;
    const newAddress = updateAddressInput.value;
    const newAccountType = updateaccounttype.value;

    if (!validateContact(newContact)) {
        alert("Contact number must be 11 digits long and start with '09'.");
        return false;
    }
    
    const user = auth.currentUser;
    const userKey = user ? user.uid : null;
    if (userKey) {
        const postData = {
            username: newUsername,
            name: newName,
            password: newPassword,
            pnumber: newContact,
            email: newEmail,
            userlevel: newAccountType,
            address: newAddress,
        };
        const newAccountRef = push(usersRef);
        const newAccountKey = key(newAccountRef);
        set(newAccountRef, postData);
        toggleNewAccountForm();
    }
}
function validateContact(contact) {
    const regex = /^09\d{9}$/;
    return regex.test(contact);
}
document.getElementById('update-contact').addEventListener('input', function(event) {
    const input = event.target;
    if (input.value.length > 11) {
        input.value = input.value.slice(0, 11); // Truncate input to 11 characters
    }
});