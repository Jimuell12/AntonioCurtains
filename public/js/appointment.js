import { auth, onValue, database, ref, push, set, update } from './firebase.js'
import { sendEmail } from './apicall.js';
export function submitAppointment() {
    const form = document.getElementById('appointmentForm');
    const name = form.elements['name'].value;
    const contact = form.elements['contact'].value;
    const email = form.elements['email'].value;
    const dateTimeString = form.elements['dateTime'].value;
    const message = form.elements['message'].value;
    const location = form.elements['appoinment-location'].value;
    if (!name || !contact || !email || !dateTimeString || !message || !location) {
        alert('All fields are required. Please fill in all the required information.');
        return;
    }

    if (!validateContact(contact)) {
        alert("Contact number must be 11 digits long and start with '09'.");
        return false;
    }

    if (!validateEmail(email)) {
        alert('Invalid email format.');
        return;
    }


    const formattedDateTime = formatDateTime(dateTimeString);
    const user = auth.currentUser;
    const uid = user ? user.uid : null;
    const appointmentsRef = ref(database, 'appointments');
    const newAppointmentRef = push(appointmentsRef);
    set(newAppointmentRef, {
        name: name,
        contact: contact,
        email: email,
        dateTime: formattedDateTime,
        message: message,
        status: 'Pending',
        location: location,
        ownerUid: uid
    });
    var initialMessage = `Hello ${name},\n\nThank you for scheduling an appointment with Antonio's Curtains & Upholstery! \n\nYour appointment details:\n\nName: ${name}\nContact: ${contact}\nEmail: ${email}\nDate and Time: ${formattedDateTime}\nLocation: ${location}\n\nStatus: Pending\n\nWe look forward to meeting with you!\n\nBest Regards,\nAntonio's Curtains & Upholstery`;
    sendEmail(email, "APPOINTMENT", initialMessage);
    form.reset();
    alert('Your booking has been successfully processed.')
}
function formatDateTime(dateTimeString) {
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
    const formattedDateTime = new Date(dateTimeString).toLocaleString('en-US', options);
    return formattedDateTime;
}
export function retrieveappointment(uid) {
    const userUid = uid
    const appointmentsRef = ref(database, 'appointments');
    const tableBody = document.querySelector('#appointmentTable tbody');
    onValue(appointmentsRef, (snapshot) => {
        tableBody.innerHTML = '';
        if (snapshot.exists()) {
            snapshot.forEach((appointmentSnapshot) => {
                const appointment = appointmentSnapshot.val();
                const appointmentKey = appointmentSnapshot.key;
                if (appointment.ownerUid === userUid) {
                    const row = document.createElement('tr');
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
                    const statusCell = document.createElement('td');
                    statusCell.textContent = appointment.status;
                    row.appendChild(statusCell);
                    switch (appointment.status) {
                        case 'Accepted':
                            statusCell.setAttribute('class', 'green');
                            break;
                        case 'Rejected':
                            statusCell.setAttribute('class', 'red');
                            break;
                        case 'Completed':
                            statusCell.setAttribute('class', 'gray');
                            break;
                        default:
                            break;
                    }
                    tableBody.appendChild(row);
                }
            });
        } else {
            console.log('No appointments found for the user.');
        }
    }, (error) => {
        console.error('Error retrieving appointments:', error);
    });
}

export function displayMessageOverlay(message) {

    document.querySelector('.message-overlay').style.display = "flex";
    document.querySelector('.message').textContent = message;
    document.querySelector('.message-overlay').addEventListener('click', ()=>{
        document.querySelector('.message-overlay').style.display = 'none'
    })
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}
function validateContact(contact) {
    const regex = /^09\d{9}$/;
    return regex.test(contact);
}
