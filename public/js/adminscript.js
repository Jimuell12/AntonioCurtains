import { auth, onAuthStateChanged, onValue, database, ref, remove, set } from './firebase.js'
import { populateUpdateForm, populateUpdateFormsetting } from './account.js';
import { displayMessageOverlay } from './appointment.js';
import { sendEmail } from './apicall.js';
function showSection(section) {
  const sections = ['.Accounts', '.Products', '.Appointment', '.Inventory', '.POS', '.Account'];
  sections.forEach((s) => {
    const currentSection = document.querySelector(s);
    currentSection.style.display = s === section ? 'block' : 'none';
  });
}
document.querySelector(".site-name").addEventListener('click', () => showSection('.Accounts'));
document.querySelector(".navhome").addEventListener('click', () => showSection('.Accounts'));
document.querySelector(".navproducts").addEventListener('click', () => showSection('.Products'));
document.querySelector(".navappointment").addEventListener('click', () => showSection('.Appointment'));
document.querySelector(".navaboutus").addEventListener('click', () => showSection('.Inventory'));
document.querySelector(".navcart").addEventListener('click', () => showSection('.POS'));
document.querySelector(".useraccount").addEventListener('click', () => showSection('.Account'));
showSection('.Accounts')
const usersRef = ref(database, 'users');
const itemsPerPage = 10;
let currentPage = 1;
onValue(usersRef, (snapshot) => {
  const users = snapshot.val();
  document.getElementById('userTableBody').innerHTML = '';
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const usersArray = Object.entries(users);
  const usersToShow = usersArray.slice(startIndex, endIndex);
  for (const [key, user] of usersToShow) {
    const row = `
          <tr id="${key}">
              <td>${user.email}</td>
              <td>${user.password}</td>
              <td>${user.name}</td>
              <td>${user.pnumber}</td>
              <td>${user.userlevel}</td>
              <td><button class="editbutton action">Edit</button><button class="deletebutton action">Delete</button></td>
          </tr>
      `;
    document.getElementById('userTableBody').innerHTML += row;
  }
  attachEventListeners();
  displayPagination(usersArray.length);
});
onAuthStateChanged(auth, (user) => {
  if (user) {
    const uid = user.uid;
    retrieveAppointments()
    populateUpdateForm(uid)
    populateUpdateFormsetting(uid)
    document.querySelector(".useraccount").style.display = 'flex'
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
      const users = snapshot.val();
      for (const key in users) {
        if (key === uid) {
          var name = users[key].username
          var profilepic = users[key].profilePicture
          var userlevel = users[key].userlevel
          if (profilepic) {
            document.querySelector(".useraccount").innerHTML = name + "<div class='circle'><img src=" + profilepic + "></div>"
          } else {
            document.querySelector(".useraccount").innerHTML = name + "<div class='circle'><i class='fa-solid fa-user fa-lg'></i></div>"
          }
          if (userlevel !== "Admin") {
            window.location.href = "../index.html"
          }
        }
      }
    })
  } else {
    window.location.href = "../index.html"
  }
});
function attachEventListeners() {
  document.querySelectorAll(".editbutton").forEach(button => {
    button.addEventListener('click', accountedit);
  });
  document.querySelectorAll(".deletebutton").forEach(button => {
    button.addEventListener('click', accountdelete);
  });
}
function accountedit(event) {
  const updateForm = document.querySelector('.overlay');
  updateForm.style.display = updateForm.style.display === 'none' ? 'flex' : 'none';
  const parentElement = event.currentTarget.parentNode.parentNode;
  const parentId = parentElement.getAttribute('id');
  populateUpdateForm(parentId)
}
function accountdelete(event) {
  const parentElement = event.currentTarget.parentNode.parentNode;
  const parentId = parentElement.getAttribute('id');
  const usersRef = ref(database, 'users/' + parentId);
  const confirmDeletion = confirm('Are you sure you want to delete this account?');
  if (confirmDeletion) {
    remove(usersRef)
      .then(() => {
        console.log('Account deleted successfully.');
      })
      .catch((error) => {
        console.error('Error deleting account:', error);
      });
  }
}
function displayPagination(totalUsers) {
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const paginationElement = document.getElementById('userPagination');
  paginationElement.innerHTML = '';
  const prevButton = document.createElement('button');
  prevButton.textContent = 'Previous';
  prevButton.addEventListener('click', function () {
    currentPage = Math.max(1, currentPage - 1);
    onValue(usersRef, snapshot => { updateTable(snapshot); });
  });
  paginationElement.appendChild(prevButton);
  const nextButton = document.createElement('button');
  nextButton.textContent = 'Next';
  nextButton.addEventListener('click', function () {
    currentPage = Math.min(totalPages, currentPage + 1);
    onValue(usersRef, snapshot => { updateTable(snapshot); });
  });
  paginationElement.appendChild(nextButton);
}
function updateTable(snapshot) {
  const users = snapshot.val();
  document.getElementById('userTableBody').innerHTML = '';
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const usersArray = Object.entries(users);
  const usersToShow = usersArray.slice(startIndex, endIndex);
  for (const [key, user] of usersToShow) {
    const row = `
          <tr id="${key}">
              <td>${user.email}</td>
              <td>${user.password}</td>
              <td>${user.name}</td>
              <td>${user.pnumber}</td>
              <td>${user.userlevel}</td>
              <td><button class="editbutton action">Edit</button><button class="deletebutton action">Delete</button></td>
          </tr>
      `;
    document.getElementById('userTableBody').innerHTML += row;
  }
  attachEventListeners();
}

document.querySelector(".appointment-sort-button").addEventListener('click', toggleSortForm)
document.querySelector('.appointment-Cancelfilter').addEventListener('click', toggleSortForm);

document.querySelector('.appointment-Applyfilter').addEventListener('click', (event) => {
  event.preventDefault();
  const selectedLocation = document.querySelector('input[name="Location"]:checked').value;

  // Get all appointments
  const appointmentsRef = ref(database, 'appointments');
  onValue(appointmentsRef, snapshot => {
    const appointments = snapshot.val();
    const filteredAppointments = [];

    for (const appointmentId in appointments) {
      const appointment = appointments[appointmentId];

      // Check if the appointment matches the selected location and status
      if (appointment.location === selectedLocation || selectedLocation == "") {
        filteredAppointments.push({ id: appointmentId, ...appointment });
      }
    }

    // Display the filtered appointments
    displayFilteredAppointments(filteredAppointments);
  });
  toggleSortForm();
});
document.querySelector('.appointment-archive-button').addEventListener('click', (event) => {
  event.preventDefault();

  const appointmentsRef = ref(database, 'appointments');
  onValue(appointmentsRef, snapshot => {
    const appointments = snapshot.val();
    const filteredAppointments = [];

    for (const appointmentId in appointments) {
      const appointment = appointments[appointmentId];

      // Check if the appointment matches the selected location and status
      if (appointment.status === "Rejected" || appointment.status === "Completed") {
        filteredAppointments.push({ id: appointmentId, ...appointment });
      }
    }

    // Display the filtered appointments
    displayFilteredAppointments(filteredAppointments);
  });
});
document.querySelector('.appointment-inbox-button').addEventListener('click', retrieveAppointments);

function displayFilteredAppointments(appointments) {
  const appointmentTableBody = document.querySelector('#appointmentuserTableBody tbody');
  appointmentTableBody.innerHTML = '';

  appointments.forEach(appointment => {
    const row = document.createElement('tr');
    row.setAttribute("id", appointment.id);
    const nameCell = document.createElement('td');
    nameCell.textContent = appointment.name;
    row.appendChild(nameCell);
    const contactCell = document.createElement('td');
    contactCell.textContent = appointment.contact;
    row.appendChild(contactCell);
    const emailCell = document.createElement('td');
    emailCell.textContent = appointment.email;
    row.appendChild(emailCell);
    const dateTimeCell = document.createElement('td');
    dateTimeCell.textContent = appointment.dateTime;
    row.appendChild(dateTimeCell);
    const locationCell = document.createElement('td');
    locationCell.textContent = appointment.location;
    row.appendChild(locationCell);
    const messageCell = document.createElement('td'); // Create message cell
    const messageButton = document.createElement('button'); // Create button for displaying message
    messageButton.textContent = 'View Message'; // Set button text

    messageButton.addEventListener('click', () => {
      displayMessageOverlay(appointment.message); // Call function to display message overlay
    });

    messageCell.appendChild(messageButton); // Append button to cell
    row.appendChild(messageCell);

    const statusCell = document.createElement('td');
    statusCell.textContent = appointment.status;
    row.appendChild(statusCell);
    const actionCell = document.createElement('td');
    const selectElement = document.createElement('select');
    selectElement.name = 'appoinment-status';
    const options = ['Pending', 'Accepted', 'Rejected', 'Completed'];
    selectElement.addEventListener('change', function () {
      const selectedStatus = selectElement.value;
      const parentId = row.getAttribute('id');
      const appointmentRef = ref(database, `appointments/${parentId}/status`);
      set(appointmentRef, selectedStatus);
      var message = `Hello ${appointment.name},\n\nWe hope this message finds you well. On behalf of the entire team at Antonio's Curtains & Upholstery, we want to express our sincere gratitude for choosing our services. We are pleased to inform you about the status of your scheduled appointment.\n\nAppointment Details:\n- Name: ${appointment.name}\n- Contact: ${appointment.contact}\n- Email: ${appointment.email}\n- Date and Time: ${appointment.dateTime}\n- Location: ${appointment.location}\n- Message: ${appointment.message}\n\nStatus: ${selectedStatus}\n\nIf you have any further inquiries or need assistance, please feel free to reach out to us. We look forward to serving you and ensuring your experience with Antonio's Curtains & Upholstery is exceptional.\n\nBest Regards,\nThe Team at Antonio's Curtains & Upholstery`;
      sendEmail(appointment.email, "APPOINTMENT", message);
    });
    options.forEach((optionValue, index) => {
      const optionElement = document.createElement('option');
      optionElement.value = optionValue;
      optionElement.text = optionValue;
      if (optionValue === appointment.status) {
        optionElement.selected = true;
      }
      selectElement.appendChild(optionElement);
    });
    actionCell.appendChild(selectElement);
    row.appendChild(actionCell);
    appointmentTableBody.appendChild(row);
  });
  
}

function retrieveAppointments() {
  event.preventDefault();

  const appointmentsRef = ref(database, 'appointments');
  onValue(appointmentsRef, snapshot => {
    const appointments = snapshot.val();
    const filteredAppointments = [];

    for (const appointmentId in appointments) {
      const appointment = appointments[appointmentId];

      // Check if the appointment matches the selected location and status
      if (appointment.status != "Rejected" && appointment.status != "Completed") {
        filteredAppointments.push({ id: appointmentId, ...appointment });
      }
    }

    // Display the filtered appointments
    displayFilteredAppointments(filteredAppointments);
  });
}
function toggleSortForm() {
  event.preventDefault();
  const sortFormContainer = document.getElementById('appointment-sort-form-container');
  sortFormContainer.style.display = (sortFormContainer.style.display === 'none') ? 'block' : 'none';
}

document.querySelector('.admin').addEventListener('click', ()=>{
  
  window.location.href='./newadmin.html'
})