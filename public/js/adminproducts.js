import { onValue, ref, database, set, get } from "./firebase.js";
import { sendEmail } from "./apicall.js"
const productsTableBody = document.getElementById('productsTableBody').querySelector('tbody');
function addRow(checkoutData, grandparentkey, parentkey, key) {
    const newRow = document.createElement('tr');
    newRow.id = grandparentkey
    newRow.className = parentkey
    newRow.innerHTML = `
        <td>${checkoutData.productId}</td>
        <td>${checkoutData.name}</td>
        <td>${checkoutData.phonenumber}</td>
        <td>${checkoutData.quantity}</td>
        <td>${checkoutData.productVariation}</td>
        <td>${checkoutData.paymentoption}</td>
        <td>${checkoutData.deliveryoption}</td>
        <td>${checkoutData.fulladdress}</td>
    `;
    const actionCell = document.createElement('td');
    const selectProduct = document.createElement('select');
    selectProduct.name = 'product-status';
    const options = ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed'];
    selectProduct.addEventListener('change', async function () {
        const selectedStatus = selectProduct.value;
        const grandparentId = grandparentkey;
        const parentId = parentkey;
        const statusRef = ref(database, `checkouts/${grandparentId}/${parentId}/${key}/status`);
        set(statusRef, selectedStatus);
        const userRef = ref(database, `users/${grandparentId}`);
        try {
            const userSnapshot = await get(userRef);
            const userData = userSnapshot.val();
            if (userData && userData.email) {
                const email = userData.email;
                const message = `
Hello ${checkoutData.name},
We hope this message finds you well. Thank you for choosing Antonio's Curtains & Upholstery for your recent order. We would like to update you on the current status of your order.
Order Details:
- Product ID: ${checkoutData.productId}
- Name: ${checkoutData.name}
- Phone Number: ${checkoutData.phonenumber}
- Quantity: ${checkoutData.quantity}
- Product Variation: ${checkoutData.productVariation}
- Payment Option: ${checkoutData.paymentoption}
- Delivery Option: ${checkoutData.deliveryoption}
- Full Address: ${checkoutData.fulladdress}
Order Status: ${selectedStatus}
If you have any questions or concerns about your order, feel free to reach out to us. We are committed to providing you with the best service.
Best Regards,
The Team at Antonio's Curtains & Upholstery
`;
                await sendEmail(email, "ORDER STATUS", message);
            } else {
                console.log('User not found or does not have an email.');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    });
    options.forEach((optionValue, index) => {
        const optionElement = document.createElement('option');
        optionElement.value = optionValue;
        optionElement.text = optionValue;
        if (optionValue === checkoutData.status) {
            optionElement.selected = true;
        }
        selectProduct.appendChild(optionElement);
    });
    actionCell.appendChild(selectProduct);
    newRow.appendChild(actionCell);
    productsTableBody.appendChild(newRow);
}

document.querySelector(".orders-sort-button").addEventListener('click', toggleSortForm)
document.querySelector('.orders-Cancelfilter').addEventListener('click', toggleSortForm);

document.querySelector('.orders-Applyfilter').addEventListener('click', (event) => {
    event.preventDefault();

    const ordersRef = ref(database, 'checkouts');
    onValue(ordersRef, snapshot => {
        const checkouts = snapshot.val();
        const selectedOrders = document.querySelector('input[name="Orders"]:checked').value;
        productsTableBody.innerHTML = ''
        for (const userId in checkouts) {
            const user = checkouts[userId];
            for (const checkoutTime in user){
                const checkoutNumber = user[checkoutTime]
                for (const orderId in checkoutNumber){
                    const order = checkoutNumber[orderId]
                    if (order.paymentoption == selectedOrders || selectedOrders == "") {
                        addRow(order, userId, checkoutTime, orderId)
                    }
                    if(order.deliveryoption == selectedOrders){
                        addRow(order, userId, checkoutTime, orderId)
                    }
                }
            }
        }
        const rows = Array.from(productsTableBody.querySelectorAll('tr'));
            rows.reverse();
            rows.forEach(row => productsTableBody.appendChild(row));
    });
    toggleSortForm();
});

document.querySelector('.orders-inbox-button')
document.querySelector('.orders-archive-button').addEventListener('click', (event) => {
    event.preventDefault();

    const ordersRef = ref(database, 'checkouts');
    onValue(ordersRef, snapshot => {
        const checkouts = snapshot.val();

        productsTableBody.innerHTML = ''
        for (const userId in checkouts) {
            const user = checkouts[userId];
            for (const checkoutTime in user){
                const checkoutNumber = user[checkoutTime]
                for (const orderId in checkoutNumber){
                    const order = checkoutNumber[orderId]
                    if (order.status === "Rejected" || order.status === "Cancelled" || order.status === "Completed") {
                        addRow(order, userId, checkoutTime, orderId)
                    }
                }
            }
        }
    });
});
document.querySelector('.orders-inbox-button').addEventListener('click', retrieveOrders);

function retrieveOrders() {
    event.preventDefault();

    const ordersRef = ref(database, 'checkouts');
    onValue(ordersRef, snapshot => {
        const checkouts = snapshot.val();
        
        productsTableBody.innerHTML = ''
        for (const userId in checkouts) {
            const user = checkouts[userId];
            for (const checkoutTime in user){
                const checkoutNumber = user[checkoutTime]
                for (const orderId in checkoutNumber){
                    const order = checkoutNumber[orderId]
                    if (order.status != "Rejected" && order.status != "Cancelled" && order.status != "Completed") {
                        addRow(order, userId, checkoutTime, orderId)
                    }
                }
            }
        }
        const rows = Array.from(productsTableBody.querySelectorAll('tr'));
            rows.reverse();
            rows.forEach(row => productsTableBody.appendChild(row));
    });
}
function toggleSortForm() {
    event.preventDefault();
    const sortFormContainer = document.getElementById('orders-sort-form-container');
    sortFormContainer.style.display = (sortFormContainer.style.display === 'none') ? 'block' : 'none';
}
document.querySelector('.orders-inbox-button').click();
