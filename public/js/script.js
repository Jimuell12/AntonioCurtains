import { auth, onAuthStateChanged, onValue, database, ref } from './firebase.js'
import { retrieveappointment, submitAppointment } from './appointment.js';
import { populateUpdateForm, populateUpdateFormsetting } from './account.js';
import { retrieveCart } from './cart.js'
import { retrieveAddress } from './cart.js';

export function showSection(section) {
  const sections = ['.Home', '.Products', '.Appointment', '.AboutUs', '.Cart', '.Account', '.ProductDetails'];
  sections.forEach((s) => {
    const currentSection = document.querySelector(s);
    currentSection.style.display = s === section ? 'block' : 'none';
  });
}

document.querySelector(".site-name").addEventListener('click', () => showSection('.Home'));
document.querySelector(".navhome").addEventListener('click', () => showSection('.Home'));
document.querySelector(".navproducts").addEventListener('click', () => showSection('.Products'));
document.querySelector(".navappointment").addEventListener('click', () => showSection('.Appointment'));
document.querySelector(".navaboutus").addEventListener('click', () => showSection('.AboutUs'));
document.querySelector(".navcart").addEventListener('click', () => showSection('.Cart'));
document.querySelector(".useraccount").addEventListener('click', () => showSection('.Account'));

showSection('.Home')

onAuthStateChanged(auth, (user) => {
  if (user) {
    const uid = user.uid;
    retrieveappointment(uid)
    populateUpdateForm(uid)
    populateUpdateFormsetting(uid)
    retrieveCart()
    retrieveAddress()
    document.querySelector(".useraccount").style.display = 'flex'
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
      const users = snapshot.val();
      for (const key in users) {
        if (key === uid) {
          var profilepic = users[key].profilePicture
          if (profilepic) {
            document.querySelector(".useraccount").innerHTML = "<div class='circle'><img src=" + profilepic + "></div>"
          } else {
            document.querySelector(".useraccount").innerHTML = "<div class='circle'><i class='fa-solid fa-user fa-lg'></i></div>"
          }

        }
      }
    })
  } else {
    document.querySelector(".account-button").style.display = "flex"
  }
  setTimeout(() => {
    document.querySelector(".pixel-spinner").style.display = 'none'
  }, 2000)
});

document.getElementById("submitappointment").addEventListener('click', submitAppointment)