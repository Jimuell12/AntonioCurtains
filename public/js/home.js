import { database, ref, get } from './firebase.js'
async function loadTopSoldProducts() {
  const cardContainer = document.getElementById('cardContainer');
  const productsRef = ref(database, 'products');
  const productsSnapshot = await get(productsRef);
  const productsArray = [];
  productsSnapshot.forEach((productSnapshot) => {
    productsArray.push({ key: productSnapshot.key, ...productSnapshot.val() });
  });
  const sortedProducts = productsArray.sort((a, b) => b.sold - a.sold);
  const topSoldProducts = sortedProducts.slice(0, 4);
  topSoldProducts.forEach((productData) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.id = productData.key
    card.style.backgroundImage = `url("${productData.imageUrls[0]}")`
    card.innerHTML = `
        <div class="card-content">
          <div class="card-title">${productData.productName}</div>
          <!-- Add more content or images as needed -->
        </div>
        <button class="card-button">Order</button>
      `;
    cardContainer.appendChild(card);
  });
}
loadTopSoldProducts();