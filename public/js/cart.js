import { push, database, ref, onValue, auth, remove, get, update, set, child } from './firebase.js'
import { sendEmail } from './apicall.js';
const cartBody = document.getElementById('product-cart-body');
function addRow(productData) {
    const newRow = document.createElement('tr');
    newRow.id = productData.productKey
    newRow.className = productData.productId
    newRow.innerHTML = `
            <td>
                <div class="product-cart">
                    <div class="product-image-cart">
                        <img src="${productData.imageUrl}" alt="${productData.productName}">
                    </div>
                    <div class="product-details-cart">
                        <div class="product-name">${productData.productName}</div>
                    </div>
                    <div class="product-variations-cart">
                        Variations: ${productData.productvariation}
                    </div>
                </div>
            </td>
            <td>
                <div class="product-price-cart">${productData.price}</div>
            </td>
            <td>
                <div class="product-quantity-cart">${productData.quantity}</div>
            </td>
            <td>
                <div class="product-total">${productData.totalPrice}</div>
            </td>
            <td>
                <div class="product-actions">Delete</div>
            </td>
        `;
    cartBody.appendChild(newRow);
}
export function retrieveCart() {
    const user = auth.currentUser;
    if (user) {
        const userUid = user.uid;
        const cartRef = ref(database, `cart/${userUid}`);
        onValue(cartRef, async (snapshot) => {
            const cartItems = snapshot.val();
            cartBody.innerHTML = "";
            let overallTotal = 0;
            if (cartItems) {
                for (const key in cartItems) {
                    if (cartItems.hasOwnProperty(key)) {
                        const item = cartItems[key];
                        const material = item.material;
                        const height = item.height;
                        const width = item.width;
                        const length = item.length;
                        const color = item.color;
                        const itemDetailsArray = [];
                        if (material !== "") {
                            itemDetailsArray.push(material);
                        }
                        if (height !== "") {
                            itemDetailsArray.push(height);
                        }
                        if (width !== "") {
                            itemDetailsArray.push(width);
                        }
                        if (length !== "") {
                            itemDetailsArray.push(length);
                        }
                        if (color !== "") {
                            itemDetailsArray.push(color);
                        }
                        let quantity = item.quantity;
                        const productRef = ref(database, `products/${item.productId}`);
                        try {
                            const productSnapshot = await get(productRef);
                            const product = productSnapshot.val();
                            if (product && product.availableStock < item.quantity) {
                                quantity = product.availableStock;
                            }
                            const productPrice = item.productPrice;
                            const numericPrice = parseFloat(productPrice.replace(/[^\d.]/g, ''));
                            const total = quantity * numericPrice;
                            overallTotal += total;
                            const productData = {
                                productKey: key,
                                productId: item.productId,
                                imageUrl: item.productImage,
                                productName: item.productName,
                                price: productPrice,
                                quantity: quantity || 'N/A',
                                totalPrice: "₱" + total,
                                productvariation: itemDetailsArray,
                            };
                            addRow(productData);
                        } catch (error) {
                            console.error("Error fetching product details:", error);
                        }
                    }
                }
            }
            const shipping = document.getElementById("shippingtotal").textContent
            const shippingcost = parseFloat(shipping.replace(/[^\d.]/g, ''));
            document.getElementById("overalltotal").textContent = `₱${overallTotal}`;
            document.getElementById("totalpayment").textContent = `₱${overallTotal + shippingcost}`;
        });
    } else {
        console.error('No authenticated user.');
    }
}
cartBody.addEventListener('click', (event) => {
    const target = event.target;
    if (target.classList.contains('product-actions')) {
        const parentId = target.parentNode.parentNode.id
        const parentclass = target.parentNode.parentNode.className
        const user = auth.currentUser;
        if (user) {
            const userUid = user.uid;
            const cartRef = ref(database, `cart/${userUid}/${parentId}`);
            remove(cartRef);
        } else {
            console.error('No authenticated user.');
        }
    }
});
const newaddressButton = document.getElementById("edit-new-address")
const deliveryOverlay = document.getElementById("delivery-overlay")
const CancelButton = document.querySelector(".btn-cancel")
newaddressButton.addEventListener('click', toggledeliveryoverlay)
CancelButton.addEventListener('click', toggledeliveryoverlay)
function toggledeliveryoverlay() {
    deliveryOverlay.style.display = deliveryOverlay.style.display === 'none' ? 'flex' : 'none';
}
const userAddress = document.getElementById("cart-address")
export function retrieveAddress() {
    const userUid = auth.currentUser.uid;
    const userAddressRef = ref(database, `users/${userUid}/deliveryaddress`);
    onValue(userAddressRef, (snapshot) => {
        const address = snapshot.val();
        userAddress.innerText = address
    });
}
document.querySelector(".btn-success").addEventListener('click', editAddress)
function editAddress() {
    const deliveryName = document.getElementById("delivery-name").value
    const deliveryNumber = document.getElementById("deliver-number").value
    const deliveryRegion = document.getElementById("region-text").value
    const deliveryProvince = document.getElementById("province-text").value
    const deliveryCity = document.getElementById("city-text").value
    const deliveryBarangay = document.getElementById("barangay-text").value
    const deliverStreet = document.getElementById("street-text").value
    const newData = `${deliveryName}, ${deliveryNumber}, ${deliverStreet}, ${deliveryBarangay}, ${deliveryCity}, ${deliveryProvince}`;
    
    if (!deliveryName || !deliveryNumber || !deliveryRegion || !deliveryProvince || !deliveryCity || !deliveryBarangay || !deliverStreet) {
        alert("Please fill in all fields.");
        return false;
    }

    if (!validateContact(deliveryNumber)) {
        alert("Contact number must be 11 digits long and start with '09'.");
        return false;
    }

    const userUid = auth.currentUser.uid;
    const userAddressRef = ref(database, `users/${userUid}/`);
    update(userAddressRef, { deliveryaddress: newData })
        .then(() => {
            toggledeliveryoverlay()
        })
        .catch((error) => {
            console.error("Error updating data:", error);
        });
}
document.getElementById("checkoutButton").addEventListener('click', () => {
    const overallTotal = document.getElementById("totalpayment").textContent;
    if (!userAddress.textContent.trim()) {
        alert("Please provide a delivery address.");
        return;
    }
    if (cartBody.querySelectorAll('tr').length === 0) {
        alert("Your cart is empty. Add products to proceed.");
        return;
    }
    const selectedDeliveryOption = document.querySelector(".selected2");
    if (!selectedDeliveryOption) {
        alert("Please select a delivery option.");
        return;
    }
    const confirmation = confirm("Are you sure you want to proceed with the checkout?");
    if (!confirmation) {
        return;
    }
    const products = [];
    const address = userAddress.textContent;
    const addressParts = address.split(',');
    const paymentoption = document.querySelector(".selected").textContent
    const deliveryoption = document.querySelector(".selected2").textContent
    const name = addressParts[0].trim();
    const phonenumber = addressParts[1].trim();
    const fulladdress = `${addressParts[2].trim()}, ${addressParts[3].trim()}, ${addressParts[4].trim()}, ${addressParts[5].trim()}`;
    cartBody.querySelectorAll('tr').forEach((row) => {
        const productKey = row.id;
        const productId = row.className;
        const productName = row.querySelector('.product-name').textContent;
        const productPrice = row.querySelector('.product-price-cart').textContent;
        const quantity = row.querySelector('.product-quantity-cart').textContent;
        const totalPrice = row.querySelector('.product-total').textContent;
        const productVariation = row.querySelector('.product-variations-cart').textContent;
        const product = {
            productKey: productKey,
            productId: productId,
            productName: productName,
            productPrice: productPrice,
            quantity: quantity,
            totalPrice: totalPrice,
            productVariation: productVariation,
            fulladdress: fulladdress,
            name: name,
            phonenumber: phonenumber,
            deliveryoption: deliveryoption,
            paymentoption: paymentoption,
            status: "Pending"
        };
        products.push(product);
        deletefromcart(product)
    });
    checkoutItem(products, overallTotal);
    saveOrderToDatabaseForGraph(overallTotal)
});
async function saveOrderToDatabaseForGraph(overallTotal) {
    const ordersForGraphRef = ref(database, 'ordersForGraph');
    const newOrderRef = push(ordersForGraphRef);
    const timestamp = Date.now();
    const orderDataForGraph = {
        timestamp: timestamp,
        overallTotal: overallTotal,
    };
    await set(newOrderRef, orderDataForGraph);
}
function checkoutItem(products, overallTotal) {
    const user = auth.currentUser;
    if (user) {
        const userUid = user.uid;
        const checkoutId = Date.now().toString();
        const checkoutRef = ref(database, `checkouts/${userUid}/${checkoutId}`);
        const shippingCost = document.getElementById("shippingtotal").textContent;
        set(checkoutRef, products)
            .then(async () => {
                const invoiceHTML = createInvoice(products, overallTotal, shippingCost);
                displayInvoiceOverlay(invoiceHTML);
                await sendInvoiceByEmail(products, overallTotal, shippingCost);
            })
            .catch((error) => {
                console.error("Error saving products to checkout:", error);
            });
    } else {
        console.error('No authenticated user.');
    }
}
document.querySelectorAll(".cod").forEach((button) => {
    button.addEventListener('click', () => {
        if (!button.classList.contains("notallowed") && !button.classList.contains("selected")) {
            document.querySelectorAll(".cod").forEach((btn) => {
                btn.classList.remove("selected");
            });
            button.classList.add("selected");
        }
    });
});
document.querySelectorAll(".cod2").forEach((button) => {
    button.addEventListener('click', () => {
        if (!button.classList.contains("notallowed") && !button.classList.contains("selected2")) {
            document.querySelectorAll(".cod2").forEach((btn) => {
                btn.classList.remove("selected2");
            });
            button.classList.add("selected2");
            const totalpayment = document.getElementById("totalpayment")
            const totalpaymenttextContent = totalpayment.textContent
            const totalpaymentoint = parseFloat(totalpaymenttextContent.replace(/[^\d.]/g, ''));
            if (button.textContent == "Door-to-Door") {
                document.getElementById("shippingtotal").textContent = "₱500"
                totalpayment.textContent = `₱${totalpaymentoint + 500}`
            } else {
                if (!(parseFloat(document.getElementById("shippingtotal").textContent.replace(/[^\d.]/g, '')) === 0)) {
                    document.getElementById("shippingtotal").textContent = "₱0";
                    totalpayment.textContent = `₱${totalpaymentoint - 500}`;
                }
            }
        }
    });
});
function deletefromcart(key) {
    const userUid = auth.currentUser.uid
    const cartRef = ref(database, `cart/${userUid}/`)
    remove(cartRef, key.productKey)
    const productRef = ref(database, `products/${key.productId}`);
    onValue(productRef, (snapshot) => {
        const currentStock = parseFloat(snapshot.val().availableStock)
        const currentSold = parseFloat(snapshot.val().sold)
        if (currentStock != null && currentStock >= key.quantity) {
            const newStock = currentStock - parseFloat(key.quantity);
            let newSold = parseFloat(key.quantity);
        
            if (currentSold !== undefined) {
                newSold = currentSold + parseFloat(key.quantity);
            }
        
            if (isNaN(newStock) || isNaN(newSold)) {
                console.error("Invalid values for newStock or newSold:", newStock, newSold);
                return;  // Stop further execution to prevent updating with NaN values
            }
        
            const timestamp = Date.now().toString();
            const ratings = {
                userId: userUid,
                rating: 0,
                timestamp: timestamp,
                reviewmessage: "",
                product: key
            };
        
            const newRatingKey = push(child(productRef, 'ratings')).key;
            
            update(productRef, {
                availableStock: newStock,
                sold: newSold,
                [`ratings/${newRatingKey}`]: ratings,
            });
            alert('Item deletion was successful.')
        } else {
            console.error(`Insufficient stock for product ${key.productId}`);
        }
        
        
    }, {
        onlyOnce: true
    });
}
export function createInvoice(checkoutData, overallTotal, shippingCost) {
    const productsHTML = checkoutData
        .map(
            product => `
                <tr>
                    <td>${product.productName}</td>
                    <td>${product.quantity}</td>
                    <td>${product.productPrice}</td>
                    <td>${product.totalPrice}</td>
                </tr>
            `
        )
        .join('');
    const invoiceHTML = `
        <div class="invoice-container" onclick()>
            <div class="invoice-header">
                <h2>Invoice</h2>
                <button id="printButton" onclick="window.print()"><i class="fas fa-print"></i> Print Invoice</button>
            </div>
            <p><strong>Name:</strong> ${checkoutData[0].name}</p>
            <p><strong>Phone Number:</strong> ${checkoutData[0].phonenumber}</p>
            <p><strong>Delivery Address:</strong> ${checkoutData[0].fulladdress}</p>
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsHTML}
                </tbody>
            </table>
            <p><strong>Shipping Option:</strong> ${checkoutData[0].deliveryoption}</p>
            <p><strong>Payment Option:</strong> ${checkoutData[0].paymentoption}</p>
            <p><strong>Shipping Cost:</strong> ${shippingCost}</p>
            <p><strong>Total Amount:</strong> ${overallTotal}</p>
            <p>Thank you for shopping with us!</p>
        </div>
    `;
    
    return invoiceHTML;
}
function closeInvoice() {
    const invoiceContainer = document.querySelector('#displayInvoiceOverlay');
    invoiceContainer.style.display = 'none';
}
async function sendInvoiceByEmail(products, overallTotal, shippingCost) {
    const user = auth.currentUser;
    const invoiceTextMessage = createTextInvoiceMessage(products, overallTotal, shippingCost);
    const confirmationTextMessage = createOrderConfirmationMessage(products, overallTotal, shippingCost);
    if (user) {
        const email = user.email;
        const subject = "Your Order Invoice";
        try {
            await sendEmail(email, subject, invoiceTextMessage);
            await sendEmail(email, "Order Confirmation", confirmationTextMessage);
        } catch (error) {
            console.error("Error sending invoice:", error);
        }
    } else {
        console.error('No authenticated user.');
    }
}
function displayInvoiceOverlay(invoiceHTML) {
    alert('The order has been successfully placed.')
    const displayInvoiceOverlay = document.getElementById("displayInvoiceOverlay");
    const invoiceoverlaycontainer = document.querySelector(".invoiceoverlaycontainer");
    displayInvoiceOverlay.style.display = 'flex'
    invoiceoverlaycontainer.innerHTML = invoiceHTML
}
document.getElementById("displayInvoiceOverlay").addEventListener('click', closeInvoice)
export function createTextInvoiceMessage(checkoutData, overallTotal, shippingCost) {
    const productsText = checkoutData
        .map(product => {
            return `${product.productName} - Quantity: ${product.quantity}, Unit Price: ${product.productPrice}, Total: ${product.totalPrice}`;
        })
        .join('\n');
    const textInvoiceMessage = `
        Invoice
        Name: ${checkoutData[0].name}
        Phone Number: ${checkoutData[0].phonenumber}
        Delivery Address: ${checkoutData[0].fulladdress}
        Products:
        ${productsText}
        Shipping Option: ${checkoutData[0].deliveryoption}
        Payment Option: ${checkoutData[0].paymentoption}
        Shipping Cost: ${shippingCost}
        Total Amount: ${overallTotal}
        Thank you for shopping with us!
    `;
    const textInvoiceMessageWithoutPeso = textInvoiceMessage.replace(/₱/g, 'P');
    return textInvoiceMessageWithoutPeso;
}
function createOrderConfirmationMessage(checkoutData, overallTotal, shippingCost) {
    const productsText = checkoutData
        .map(product => {
            return `${product.productName} - Quantity: ${product.quantity}, Unit Price: ${product.productPrice}, Total: ${product.totalPrice}`;
        })
        .join('\n');
    const confirmationTextMessage = `
        Order Confirmation
        Thank you for placing an order with Antonio's Curtains & Upholstery! Below are the details of your purchase:
        Name: ${checkoutData[0].name}
        Phone Number: ${checkoutData[0].phonenumber}
        Delivery Address: ${checkoutData[0].fulladdress}
        Products:
        ${productsText}
        Shipping Option: ${checkoutData[0].deliveryoption}
        Payment Option: ${checkoutData[0].paymentoption}
        Shipping Cost: ${shippingCost}
        Total Amount: ${overallTotal}
        Your order is now being processed. We will notify you once it is shipped. If you have any questions, feel free to contact us.
        Thank you for choosing Antonio's Curtains & Upholstery!
    `;
    const confirmationTextMessageWithoutPeso = confirmationTextMessage.replace(/₱/g, 'P');
    return confirmationTextMessageWithoutPeso;
}
document.getElementById('deliver-number').addEventListener('input', function(event) {
    const input = event.target;
    if (input.value.length > 11) {
        input.value = input.value.slice(0, 11); // Truncate input to 11 characters
    }
});
function validateContact(contact) {
    const regex = /^09\d{9}$/;
    return regex.test(contact);
}
