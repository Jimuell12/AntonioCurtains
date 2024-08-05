import { showSection } from './script.js'
import { database, ref, get, update, auth, push, remove } from './firebase.js'
document.getElementById('productContainer').addEventListener('click', (event) => {
    const clickedProductCard = event.target.closest('.product-card');
    if (clickedProductCard) {
        const productId = clickedProductCard.id;
        productCardClicked(productId);
    }
});
document.getElementById('cardContainer').addEventListener('click', (event) => {
    const clickedButton = event.target.closest('.card-button');
    if (clickedButton) {
        const clickedProductCard = clickedButton.closest('.card');
        const productId = clickedProductCard.id;
        productCardClicked(productId);
    }
});
var productkey
var currentstock
let originalprice
async function productCardClicked(productId) {
    showSection(".ProductDetails")
    const productDetails = await fetchProducts(productId)
    const productdescription = document.getElementById('description');
    productdescription.innerText = productDetails.productDescription;

    const materialSelect = document.getElementById('material');
    materialSelect.innerHTML = '';

    const retrievedMaterials = productDetails.retrievedMaterials
    if (retrievedMaterials) {
        if (retrievedMaterials.includes(',')) {
            const materialsArray = retrievedMaterials.split(',');
            materialsArray.forEach(material => {
                const option = document.createElement('option');
                option.value = material.trim();
                option.textContent = material.trim();
                materialSelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = retrievedMaterials.trim();
            option.textContent = retrievedMaterials.trim();
            materialSelect.appendChild(option);
        }
    }

    if (productDetails.isCustomizable === 'false') {
        document.querySelector('.customize').style.visibility = 'hidden';
    } else {
        document.querySelector('.customize').style.visibility = 'visible';
    }

    const productrating = document.getElementById("productrating");
    productrating.innerHTML = "";
    userRatingContainer.innerHTML = ""
    for (let i = 1; i <= 5; i++) {
        const starIcon = document.createElement('i');
        starIcon.className = 'fa-regular fa-star';
        productrating.appendChild(starIcon);
    }
    counter = 0
    totalrating = 0
    if (productDetails.ratings && Object.keys(productDetails.ratings).length > 0) {
        for (const value of Object.entries(productDetails.ratings)) {
            addUserRating(value);
        }
    } else {
        console.log('No ratings available for this product.');
    }
    productkey = productId
    const imageUrls = productDetails.imageUrls
    document.getElementById("soldquantity").textContent = productDetails.sold
    document.getElementById("productName").textContent = productDetails.productName
    document.getElementById("productType").textContent = productDetails.productType
    document.getElementById("productDetailsPrice").textContent = "₱" + productDetails.productPrice
    originalprice = "₱" + productDetails.productPrice
    document.getElementById("availableStock").textContent = productDetails.availableStock + " available"
    currentstock = productDetails.availableStock
    console.log(currentstock)

    document.getElementById("quantityInput").value = 1;
    if (imageUrls) {
        if (imageUrls.length > 5) {
            document.getElementById("imagebuttons").style.display = "flex"
        } else {
            document.getElementById("imagebuttons").style.display = "none"
        }
        const mainImage = document.getElementById('productDetailsImage');
        const subImagesContainer = document.getElementById('subimageContainer');
        subImagesContainer.innerHTML = '';
        imageUrls.forEach((imageUrl, index) => {
            const subImage = document.createElement('img');
            subImage.src = imageUrl;
            subImage.alt = `Subimage ${index + 1}`;
            subImagesContainer.appendChild(subImage);
        });
        const subImages = document.getElementById('subimageContainer').querySelectorAll('img');
        mainImage.src = imageUrls[0];
        subImages[0].className = "redborder"
        subImages.forEach(subImage => {
            subImage.addEventListener('mouseover', () => {
                mainImage.src = subImage.src;
                subImages.forEach(otherSubImage => {
                    if (otherSubImage !== subImage) {
                        otherSubImage.classList.remove('redborder');
                    }
                });
                subImage.classList.add('redborder');
            });
        });
    }
}
async function fetchProducts(productId) {
    const productsRef = ref(database, 'products/' + productId);
    const snapshot = await get(productsRef);
    const product = snapshot.val();
    return product;
}
document.getElementById("right-image").addEventListener('click', () => {
    const subimageContainer = document.querySelector(".subimage");
    subimageContainer.scrollLeft += 99;
});
document.getElementById("left-image").addEventListener('click', () => {
    const subimageContainer = document.querySelector(".subimage");
    subimageContainer.scrollLeft -= 99;
});
const productDetailsOverlay = document.getElementById("productDetailsOverlay")
document.querySelector(".customize").addEventListener('click', () => {
    productDetailsOverlay.style.display = "flex"
})
document.getElementById("cancelProductDetails").addEventListener('click', toggleCustomizeForm)
const addToCartButton = document.querySelector('.addtocart');
addToCartButton.addEventListener('click', () => updatecart(true));
const submitProductDetailsButton = document.getElementById('submitProductDetails');
submitProductDetailsButton.addEventListener('click', () => updatecart(false))
async function updatecart(isAddtoCart) {
    if (currentstock != 0 || currentstock != "0") {
        const user = auth.currentUser;
        if (user) {
            const userUid = user.uid;
            const material = document.getElementById('material').value;
            const height = document.getElementById('height').value;
            const width = document.getElementById('width').value;
            const length = document.getElementById('length').value;
            const color = document.getElementById('color').value;
            const totalPrice = document.getElementById('totalPrice').value;
            const quantity = document.getElementById("quantityInput").value;
            const productPrice = document.getElementById("productDetailsPrice").textContent
            const productName = document.getElementById("productName").textContent
            const productImage = document.getElementById("productDetailsImage").src
            const cartRef = ref(database, `cart/${userUid}`);
            const cartSnapshot = await get(cartRef);
            const cartItems = cartSnapshot.val();
            let existingCartItemKey = null;
            if (cartItems) {
                Object.keys(cartItems).forEach(key => {
                    const item = cartItems[key];
                    if (
                        item.productId === productkey &&
                        item.material === material &&
                        item.height === height &&
                        item.width === width &&
                        item.length === length &&
                        item.color === color
                    ) {
                        existingCartItemKey = key;
                    }
                });
            }
            if (existingCartItemKey !== null) {
                const existingCartItemRef = ref(database, `cart/${userUid}/${existingCartItemKey}`);
                const existingCartItemSnapshot = await get(existingCartItemRef);
                const existingCartItem = existingCartItemSnapshot.val();
                const newQuantity = existingCartItem.quantity ? parseInt(existingCartItem.quantity, 10) + parseInt(quantity) : 2;
                update(existingCartItemRef, { quantity: newQuantity });
            } else {
                const newCartItemRef = push(cartRef);
                const newCartItemKey = newCartItemRef.key;
                const cartItemData = {
                    productId: productkey,
                    material: material,
                    height: height,
                    width: width,
                    length: length,
                    color: color,
                    totalPrice: totalPrice,
                    productPrice: productPrice,
                    quantity: quantity,
                    productName: productName,
                    productImage, productImage
                };
                update(newCartItemRef, cartItemData);
            }
            if (!isAddtoCart) {
                toggleCustomizeForm();
            }
            openModal();
        } else {
            window.location.href = "/templates/login.html"
        }
    } else {
        alert("Product is out of stock.")
    }
}
function resetcustomizeform() {
    document.getElementById('material').value = "";
    document.getElementById('height').value = "";
    document.getElementById('width').value = "";
    document.getElementById('length').value = "";
    document.getElementById('color').value = "";
    document.getElementById('totalPrice').value = "";
}
function toggleCustomizeForm() {
    productDetailsOverlay.style.display = (productDetailsOverlay.style.display === 'none') ? 'flex' : 'none';
    resetcustomizeform()
    document.getElementById("productDetailsPrice").textContent = originalprice
    console.log(originalprice)

}
function openModal() {
    var modal = document.getElementById('addToCartModal');
    var modalMessage = document.getElementById('modalMessage');
    modalMessage.textContent = "Item Added to Cart";
    modal.style.display = 'flex';
    setTimeout(function () {
        closeModal();
    }, 2000);
}
function closeModal() {
    var modal = document.getElementById('addToCartModal');
    modal.style.display = 'none';
}
function changeQuantity(amount) {
    var quantityInput = document.getElementById('quantityInput');
    var currentValue = parseInt(quantityInput.value);
    var newQuantity = currentValue + amount;
    if (newQuantity > currentstock) {
        newQuantity = currentstock;
    } else if (newQuantity < 1) {
        newQuantity = 1;
    }
    quantityInput.value = newQuantity;
}
document.getElementById("increase").addEventListener('click', () => changeQuantity(1))
document.getElementById("decrease").addEventListener('click', () => changeQuantity(-1))
const userRatingContainer = document.getElementById('ratings');
let totalrating = 0
let counter = 0
async function addUserRating(product) {
    const user = auth.currentUser
    if (user) {
        const userUid = user.uid
        if (product && product[1] && product[1].rating !== undefined && product[1].rating !== null && product[1].rating > 0) {
            document.querySelector(".add-review").style.display = "none"
            const userName = product[1].product.name
            const productvariation = product[1].product.productVariation
            const message = product[1].reviewmessage
            const userRating = document.createElement('div');
            userRating.className = 'user-rating';
            userRating.id = product[0]
            const userImageContainer = document.createElement('div');
            userImageContainer.className = 'user-image';
            const userImage = document.createElement('img');
            userImage.alt = '';
            userImage.id = 'user-img-container';

            try {
                // Fetch user profile image from the database
                const userRef = ref(database, 'users/' + userUid);
                const snapshot = await get(userRef);
                const userData = snapshot.val();

                console.log(userData)

                if (userData && userData.profilePicture) {
                    userImage.src = userData.profilePicture;
                } else {
                    // Set a default image if no profile image is found
                    userImage.src = 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg';
                }
            } catch (error) {
                console.error('Error fetching user profile image:', error);
                // Set a default image in case of an error
                userImage.src = 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg';
            }

            userImageContainer.appendChild(userImage);


            const userDetailedReview = document.createElement('div');
            userDetailedReview.className = 'user-detailed-review';
            counter++
            totalrating += parseFloat(product[1].rating)
            const starRating = document.createElement('div');
            starRating.className = 'star-rating';
            for (let i = 1; i <= 5; i++) {
                const starIcon = document.createElement('i');
                if (i <= product[1].rating) {
                    starIcon.className = 'fa-solid fa-star';
                } else {
                    starIcon.className = 'fa-regular fa-star';
                }
                starRating.appendChild(starIcon);
            }
            const productrating = document.getElementById("productrating");
            productrating.innerHTML = ""
            const averageRating = totalrating / counter;
            for (let i = 1; i <= 5; i++) {
                const starIcon = document.createElement('i');
                if (i < averageRating) {
                    starIcon.className = 'fa-solid fa-star';
                } else if (i === Math.ceil(averageRating) && averageRating % 1 >= 0.5) {
                    starIcon.className = 'fa-solid fa-star-half-stroke';
                } else {
                    starIcon.className = 'fa-regular fa-star';
                }
                productrating.appendChild(starIcon);
            }
            const timestamp = product[1].timestamp;
            const date = new Date(parseFloat(timestamp));
            const formattedDate = date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            userDetailedReview.innerHTML = `
            <p class="user-name">${userName}</p>
            <div class="star-rating">${starRating.outerHTML}</div>
            <div class="timestamp-variation">
                <p class="timestamp">${formattedDate}</p>
                <p>|</p>
                <p class="variation">${productvariation}</p>
            </div>
            <div class="sub-review">Product Name: <p>${product[1].product.productName || ''}</p></div>
            <div class="sub-review">Quantity: <p>${product[1].product.quantity || ''}</p></div>
            <p>${message}</p>
        `;
            userRating.appendChild(userImageContainer);
            userRating.appendChild(userDetailedReview);
            const hr = document.createElement('hr');
            userRatingContainer.appendChild(userRating);
            userRatingContainer.appendChild(hr);
        } else if (product[1].userId == userUid && product[1].rating == 0) {
            document.querySelector(".add-review").style.display = "flex"
            document.getElementById("submitreview").addEventListener('click', () => submitReview(product[0]))
        }
    }
}
document.querySelector(".add-review").addEventListener('click', openReviewForm)
document.getElementById("closereview").addEventListener('click', closeReviewForm)
function submitReview(parentId) {
    const productRef = ref(database, `products/${productkey}/ratings/${parentId}`)
    const stars = document.getElementById('stars').value;
    const reviewText = document.getElementById('review').value;
    update(productRef, { rating: stars, reviewmessage: reviewText });
    document.querySelector(".add-review").style.display = "none"
    closeReviewForm();
    productCardClicked(productkey);
}
function closeReviewForm() {
    document.getElementById('rating-overlay').style.display = 'none';
}
function openReviewForm() {
    document.getElementById('rating-overlay').style.display = 'block';
}
document.querySelector(".buynow").addEventListener('click', deleteCartandShowcart)
async function deleteCartandShowcart() {
    if (currentstock != 0 || currentstock != "0") {
        const user = auth.currentUser.uid
        if (user) {
            const productRef = ref(database, `cart/${user}`)
            remove(productRef)
            const material = document.getElementById('material').value;
            const height = document.getElementById('height').value;
            const width = document.getElementById('width').value;
            const length = document.getElementById('length').value;
            const color = document.getElementById('color').value;
            const totalPrice = document.getElementById('totalPrice').value;
            const quantity = document.getElementById("quantityInput").value;
            const productPrice = document.getElementById("productDetailsPrice").textContent
            const productName = document.getElementById("productName").textContent
            const productImage = document.getElementById("productDetailsImage").src
            const cartRef = ref(database, `cart/${user}`);
            const cartSnapshot = await get(cartRef);
            const cartItems = cartSnapshot.val();
            let existingCartItemKey = null;
            if (cartItems) {
                Object.keys(cartItems).forEach(key => {
                    const item = cartItems[key];
                    if (
                        item.productId === productkey &&
                        item.material === material &&
                        item.height === height &&
                        item.width === width &&
                        item.length === length &&
                        item.color === color
                    ) {
                        existingCartItemKey = key;
                    }
                });
            }
            if (existingCartItemKey !== null) {
                const existingCartItemRef = ref(database, `cart/${userUid}/${existingCartItemKey}`);
                const existingCartItemSnapshot = await get(existingCartItemRef);
                const existingCartItem = existingCartItemSnapshot.val();
                const newQuantity = existingCartItem.quantity ? parseInt(existingCartItem.quantity, 10) + parseInt(quantity) : 2;
                update(existingCartItemRef, { quantity: newQuantity });
            } else {
                const newCartItemRef = push(cartRef);
                const newCartItemKey = newCartItemRef.key;
                const cartItemData = {
                    productId: productkey,
                    material: material,
                    height: height,
                    width: width,
                    length: length,
                    color: color,
                    totalPrice: totalPrice,
                    productPrice: productPrice,
                    quantity: quantity,
                    productName: productName,
                    productImage, productImage
                };
                update(newCartItemRef, cartItemData);
                showSection(".Cart")
            }
        } else {
            window.location.href = "./templates/login.html"
        }
    }else {
        alert("Product is out of stock.")
    }
}

document.getElementById("material").addEventListener('change', updateTotalPrice)
document.getElementById("height").addEventListener('input', updateTotalPrice);
document.getElementById("width").addEventListener('input', updateTotalPrice);
document.getElementById("length").addEventListener('input', updateTotalPrice);


function updateTotalPrice() {
    const originalPriceText = originalprice;
    const originalPrice = parseFloat(originalPriceText.replace(/[^0-9.]/g, '')) || 0;

    var selectedMaterial = document.getElementById("material").value;

    var height = parseFloat(document.getElementById("height").value) || 0;
    var width = parseFloat(document.getElementById("width").value) || 0;
    var length = parseFloat(document.getElementById("length").value) || 0;

    var materialPrices = {
        "cotton": 10,
        "leather": 20,
        "silk": 30,
    };

    var basePrice = materialPrices[selectedMaterial] || 0;

    var additionalCost = Math.floor(height / 10) * 100 + Math.floor(width / 10) * 100 + Math.floor(length / 10) * 100;

    var totalPriceInput = document.getElementById("totalPrice");
    totalPriceInput.value = originalPrice + basePrice + additionalCost || 0;

    const productDetailsPrice = document.getElementById("productDetailsPrice");
    productDetailsPrice.textContent = `₱${originalPrice + basePrice + additionalCost || 0}`;
}


const heightInput = document.getElementById('height');
const widthInput = document.getElementById('width');
const lengthInput = document.getElementById('length');

heightInput.addEventListener('input', function () {
    if (parseInt(this.value) < 0) {
        this.value = 0;
    }
});

widthInput.addEventListener('input', function () {
    if (parseInt(this.value) < 0) {
        this.value = 0;
    }
});

lengthInput.addEventListener('input', function () {
    if (parseInt(this.value) < 0) {
        this.value = 0;
    }
});