import { remove, ref, database, storage, sref, uploadBytes, set, onValue, getDownloadURL, get, update } from './firebase.js'
const productImagesInput = document.getElementById('product-images');
document.getElementById("product-images").addEventListener("change", handleImageUpload)
function handleImageUpload(event) {
    const selectedFiles = event.target.files;
    console.log('Selected Files:', selectedFiles);
}
document.getElementById("product-images").addEventListener("change", handleImagePreview);
function handleImagePreview(event) {
    const imagePreviewContainer = document.getElementById('image-preview-container');
    imagePreviewContainer.innerHTML = '';
    const selectedFiles = event.target.files;
    for (const file of selectedFiles) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        img.className = 'image-preview';
        imagePreviewContainer.appendChild(img);
    }
}
async function submitUpdateForm() {
    const productId = document.getElementById('product-id').value;
    const productName = document.getElementById('product-name').value;
    const productType = document.getElementById('product-type').value;
    const productPrice = document.getElementById('product-price').value;
    const availableStock = document.getElementById('available-stock').value;
    const selectedImages = productImagesInput.files;
    const isCustomizable = document.getElementById('isCustomizable').value;
    const productDescription = document.getElementById('product-description').value
    const retrievedMaterials = getProductMaterialsAsString();
    if (isCustomizable == 'true') {
        if (!retrievedMaterials.trim()) {
            alert('Materials are required field');
            return;
        } else {
            console.log(retrievedMaterials)
        }
    }
    if (!productId.trim() || !productName.trim() || !productType.trim() || !productPrice.trim() || !availableStock.trim() || selectedImages.length == 0 || !isCustomizable.trim() || !productDescription.trim()) {
        alert('Please fill out all required fields.');
        return; // Prevent further execution
    }

    try {
        const imageUrls = await uploadImages(selectedImages, productId);
        const productsRef = ref(database, 'products/' + productId);
        await set(productsRef, {
            productName,
            productType,
            productPrice,
            availableStock,
            imageUrls,
            sold: 0,
            isCustomizable,
            productDescription,
            retrievedMaterials
        });
        toggleForm(true)
        clearFormFields();
        console.log('Product added successfully!');
    } catch (error) {
        console.error('Error adding product:', error);
    }
}

async function uploadImages(files, productId) {
    const imageUrls = [];
    for (const file of files) {
        const storageRef = sref(storage, `product-images/${productId}/${file.name}`);
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            imageUrls.push(downloadURL);
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    }
    return imageUrls;
}
function clearFormFields() {
    document.getElementById('isCustomizable').value = '';
    document.getElementById('product-id').value = '';
    document.getElementById('product-name').value = '';
    document.getElementById('product-type').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('available-stock').value = '';
    document.getElementById('product-description').value = '';
    productImagesInput.value = '';
    document.getElementById('image-preview-container').innerHTML = '';
    const productMaterialTagsContainer = document.getElementById('product-material-tags');
    productMaterialTagsContainer.innerHTML = ''
    productMaterials = [];
}
const addButton = document.querySelector('.inventory-add-button');
const updateButton = document.querySelector('.inventory-update-button');
const cancelButton = document.querySelector(".inventory-cancel-button");
const inventoryaddButton = document.querySelector(".inventory-add-product");
cancelButton.addEventListener('click', clearFormFields)
addButton.addEventListener('click', submitUpdateForm);
inventoryaddButton.addEventListener('click', clearFormFields)
addButton.addEventListener('click', toggleForm(true));
cancelButton.addEventListener('click', toggleForm);
inventoryaddButton.addEventListener('click', toggleForm);
updateButton.addEventListener('click', toggleForm(false));

function toggleForm(isAdding) {
    const updateForm = document.querySelector('.inventoryOverlay');
    var productid = document.getElementById('product-id')
    if (isAdding) {
        initializeForm();
        addButton.style.display = '';
        updateButton.style.display = 'none';
        document.getElementById('product-id').setAttribute("readonly", null)
        productid.setAttribute("class", "gray")
    } else {
        addButton.style.display = 'none';
        updateButton.style.display = '';
        document.getElementById('product-id').setAttribute("readonly", null)
        productid.setAttribute("class", "gray")
    }
    updateForm.style.display = updateForm.style.display === 'none' ? 'flex' : 'none';
}
const productsRef = ref(database, 'products');
const tableBody = document.querySelector('#inventoryuserTableBody tbody');
let imagesUrlslocal
onValue(productsRef, (snapshot) => {
    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }
    if (snapshot.exists()) {
        snapshot.forEach((productSnapshot) => {
            const product = productSnapshot.val();
            const productId = productSnapshot.key;
            const row = document.createElement('tr');
            row.id = productId;
            const cells = [
                document.createElement('td'),
                document.createElement('td'),
                document.createElement('td'),
                document.createElement('td'),
                document.createElement('td'),
                document.createElement('td')
            ];
            cells[0].textContent = productId;
            cells[1].textContent = product.productName;
            cells[2].textContent = product.productType;
            cells[3].textContent = product.productPrice;
            cells[4].textContent = product.availableStock;
            const editButton = document.createElement('button');
            editButton.className = 'editbutton action';
            editButton.textContent = 'Edit';
            const deleteButton = document.createElement('button');
            deleteButton.className = 'deletebutton action';
            deleteButton.textContent = 'Delete';
            cells[5].appendChild(editButton);
            cells[5].appendChild(deleteButton);
            cells.forEach(cell => row.appendChild(cell));
            tableBody.appendChild(row);
        });
    } else {
        console.log('No products found.');
    }
}, (error) => {
    console.error('Error retrieving products:', error);
});
document.getElementById('inventoryuserTableBody').addEventListener('click', function (event) {
    const target = event.target;
    const row = target.closest('tr');
    if (row && row.id) {
        const rowId = row.id;
        if (target.classList.contains('editbutton')) {
            handleEdit(rowId);
        } else if (target.classList.contains('deletebutton')) {
            handleDelete(rowId);
        }
    }
});
function handleDelete(rowId) {
    const productRef = ref(database, 'products/' + rowId);
    const confirmDeletion = confirm('Are you sure you want to delete this product?');
    if (confirmDeletion) {
        remove(productRef)
            .then(() => {
                console.log('Product deleted successfully.');
            })
            .catch((error) => {
                console.error('Error deleting account:', error);
            });
    }
}
function handleEdit(rowId) {
    const productRef = ref(database, 'products/' + rowId);
    get(productRef)
        .then((snapshot) => {
            const product = snapshot.val();
            document.getElementById('isCustomizable').value = product.isCustomizable;
            document.getElementById('product-id').value = rowId;
            document.getElementById('product-name').value = product.productName;
            document.getElementById('product-type').value = product.productType;
            document.getElementById('product-price').value = product.productPrice;
            document.getElementById('available-stock').value = product.availableStock;
            document.getElementById('product-description').value = product.productDescription;
            toggleForm();
            if (product.imageUrls) {
                imagesUrlslocal = product.imageUrls
                displayImages(product.imageUrls)
            }
        })
        .catch((error) => {
            console.error('Error retrieving product details:', error);
        });
}
function displayImages(imageUrls) {
    const imagePreviewContainer = document.getElementById('image-preview-container');
    imagePreviewContainer.innerHTML = '';
    for (const imageUrl of imageUrls) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Product Image';
        img.className = 'image-preview';
        imagePreviewContainer.appendChild(img);
    }
}
// Function to get the next product ID
async function getNextProductId() {
    const productsRef = ref(database, 'products');
    try {
        const snapshot = await get(productsRef);
        if (snapshot.exists()) {
            let maxProductId = 0;
            snapshot.forEach((productSnapshot) => {
                const productId = parseInt(productSnapshot.key);
                if (!isNaN(productId) && productId > maxProductId) {
                    maxProductId = productId;
                }
            });
            return maxProductId + 1;
        } else {
            return 1; // Start from 1 if no products exist
        }
    } catch (error) {
        throw error;
    }
}

// Function to initialize the form
async function initializeForm() {
    try {
        const nextProductId = await getNextProductId();
        document.getElementById('product-id').value = nextProductId.toString();
    } catch (error) {
        console.error('Error initializing form:', error);
    }
}

updateButton.addEventListener('click', updateProduct);
async function updateProduct() {
    const productId = document.getElementById('product-id').value;
    const productName = document.getElementById('product-name').value;
    const productType = document.getElementById('product-type').value;
    const productPrice = document.getElementById('product-price').value;
    const availableStock = document.getElementById('available-stock').value;
    const isCustomizable = document.getElementById('isCustomizable').value;
    const productDescription = document.getElementById('product-description').value
    const retrievedMaterials = getProductMaterialsAsString();
    if (isCustomizable == 'true') {
        if (!retrievedMaterials.trim()) {
            alert('Materials are required field');
            return;
        } else {
            console.log(retrievedMaterials)
        }
    }
    if (!productId.trim() || !productName.trim() || !productType.trim() || !productPrice.trim() || !availableStock.trim() || !isCustomizable.trim() || !productDescription.trim()) {
        alert('Please fill out all required fields.');
        return; // Prevent further execution
    }

    try {
        const selectedImages = productImagesInput.files;
        let imageUrls = [];
        if (selectedImages && selectedImages.length > 0) {
            imageUrls = await uploadImages(selectedImages, productId);
        } else {
            imageUrls = imagesUrlslocal;
        }
        console.log(imageUrls)
        const productRef = ref(database, 'products/' + productId);
        await update(productRef, {
            productName,
            productType,
            productPrice,
            availableStock,
            isCustomizable,
            productDescription,
            retrievedMaterials,
            imageUrls: imageUrls,
        });
        clearFormFields();
        toggleForm()
        console.log('Product updated successfully!');
    } catch (error) {
        console.error('Error updating product:', error);
    }
}
document.getElementById("inventorysearchButton").addEventListener('click', handleInventorySearch)
function handleInventorySearch() {
    const searchInput = document.getElementById("inventoryInput").value.trim().toLowerCase();
    const productsRef = ref(database, 'products');
    const tableBody = document.querySelector('#inventoryuserTableBody tbody');
    onValue(productsRef, (snapshot) => {
        while (tableBody.firstChild) {
            tableBody.removeChild(tableBody.firstChild);
        }
        if (snapshot.exists()) {
            snapshot.forEach((productSnapshot) => {
                const product = productSnapshot.val();
                const productId = productSnapshot.key;
                if (
                    product.productName.toLowerCase().includes(searchInput) ||
                    product.productType.toLowerCase().includes(searchInput) ||
                    productId.toLowerCase().includes(searchInput)
                ) {
                    const row = document.createElement('tr');
                    row.id = productId;
                    const cells = [
                        document.createElement('td'),
                        document.createElement('td'),
                        document.createElement('td'),
                        document.createElement('td'),
                        document.createElement('td'),
                        document.createElement('td')
                    ];
                    cells[0].textContent = productId;
                    cells[1].textContent = product.productName;
                    cells[2].textContent = product.productType;
                    cells[3].textContent = product.productPrice;
                    cells[4].textContent = product.availableStock;
                    const editButton = document.createElement('button');
                    editButton.className = 'editbutton action';
                    editButton.textContent = 'Edit';
                    const deleteButton = document.createElement('button');
                    deleteButton.className = 'deletebutton action';
                    deleteButton.textContent = 'Delete';
                    cells[5].appendChild(editButton);
                    cells[5].appendChild(deleteButton);
                    cells.forEach(cell => row.appendChild(cell));
                    tableBody.appendChild(row);
                }
            });
        } else {
            console.log('No products found.');
        }
    }, (error) => {
        console.error('Error retrieving products:', error);
    });
}
document.getElementById("inventoryInput").addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handleInventorySearch();
    }
});

const productMaterialInput = document.getElementById('product-material-input');
const productMaterialTagsContainer = document.getElementById('product-material-tags');

let productMaterials = [];

productMaterialInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && productMaterialInput.value.trim() !== '') {
        const material = productMaterialInput.value.trim();
        productMaterials.push(material);
        renderProductMaterials();
        productMaterialInput.value = '';
    }
});

function renderProductMaterials() {
    productMaterialTagsContainer.innerHTML = '';
    productMaterials.forEach((material, index) => {
        const tag = document.createElement('div');
        tag.classList.add('product-material-tag');
        tag.innerHTML = `
                <span class="product-material-tag-text">${material}</span>
                <span class="product-material-tag-close" data-index="${index}">&times;</span>
            `;
        tag.querySelector('.product-material-tag-close').addEventListener('click', function () {
            removeProductMaterial(index);
        });
        productMaterialTagsContainer.appendChild(tag);
    });
}

function removeProductMaterial(index) {
    productMaterials.splice(index, 1);
    renderProductMaterials();
}

function getProductMaterialsAsString() {
    return productMaterials.join(', ');
}
