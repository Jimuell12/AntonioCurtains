import { auth, database, ref, get, update } from './firebase.js';
import { showSection } from './script.js'
function createProductCard(productId, product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card slide-out';
    productCard.id = productId;
    const productsold = product.sold ? product.sold : 0;
    let mainimage;
    if (product.imageUrls) {
        mainimage = product.imageUrls[0];
    } else {
        mainimage = 'https://www.komysafety.com/images/banner/no-image.png';
    }
    productCard.innerHTML = `
        <div class="product-tumb">
            <img src="${mainimage}" alt="">
        </div>
        <div class="product-details">
            <span class="product-catagory">${product.productType}</span>
            <h4><a>${product.productName}</a></h4>
            <p>${productsold} sold</p>
            <div class="product-bottom-details">
                <div class="product-price">₱${product.productPrice}</div>
            </div>
        </div>
    `;
    return productCard;
}
document.getElementById("searchInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        document.getElementById("searchButton").click();
        document.getElementById("searchInput").blur()
    }
});
document.getElementById("searchButton").addEventListener('click', () => {
    const searchQuery = document.getElementById("searchInput").value;
    showSection('.Products')
    renderProducts(searchQuery);
});
async function fetchProducts(searchQuery) {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    const allProducts = snapshot.val();
    const filteredProducts = Object.fromEntries(
        Object.entries(allProducts).filter(([productId, product]) => {
            const productNameLowerCase = product.productName.toLowerCase();
            const productTypeLowerCase = product.productType.toLowerCase();
            return (
                productNameLowerCase.includes(searchQuery.toLowerCase()) ||
                productTypeLowerCase.includes(searchQuery.toLowerCase())
            );
        })
    );
    return filteredProducts;
}
async function renderProducts(searchQuery = '') {
    const productContainer = document.getElementById('productContainer');
    productContainer.innerHTML = '';
    const filteredProducts = await fetchProducts(searchQuery);
    for (const [productId, product] of Object.entries(filteredProducts)) {
        if (product.availableStock != 0) {
            const productCard = createProductCard(productId, product);
            productContainer.appendChild(productCard);
        }
    }
}
renderProducts();
document.querySelector(".sort-button").addEventListener('click', toggleSortForm)
function toggleSortForm() {
    const sortFormContainer = document.getElementById('sort-form-container');
    sortFormContainer.style.display = (sortFormContainer.style.display === 'none') ? 'block' : 'none';
}
document.querySelector(".Applyfilter").addEventListener('click', (event) => {
    event.preventDefault();
    var searchQuery = document.getElementById("searchInput").value;
    const selectedProductType = document.querySelector('input[name="productType"]:checked');
    if (selectedProductType) {
        const selectedValue = selectedProductType.value;
        searchQuery = selectedValue
        document.getElementById("searchButton").click
    } else {
        console.log("No product type selected");
    }
    renderProducts(searchQuery);
    toggleSortForm();
});
document.querySelector(".Cancelfilter").addEventListener('click', () => {
    event.preventDefault()
    toggleSortForm();
});
document.querySelector(".navproducts").addEventListener('click', () => {
    renderProducts("");
});
const productContainer = document.querySelector('.product-container');
productContainer.addEventListener('wheel', function (event) {
    if (event.deltaY < 0) {
        const container = document.querySelector(".product-container");
        const cardWidth = 380;
        container.scrollLeft -= cardWidth + 33;
    } else if (event.deltaY > 0) {
        const container = document.querySelector(".product-container");
        const cardWidth = 380;
        container.scrollLeft += cardWidth + 33;
    }
});
