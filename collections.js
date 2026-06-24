// --- Constants ---
const DB_NAME = 'HomepageDB'
const STORE_NAME = 'collections'
const MAX_IMAGES_PER_COLLECTION = 10

// --- IndexedDB Utilities ---

function initDb() {
    return new Promise((res, rej) => {
        const request = indexedDB.open(DB_NAME, 2)

        const defaultCollection = {
            name: 'default',
            imageUrls: [
                'https://i.pinimg.com/1200x/bb/b4/e2/bbb4e2ccf50d3daa72f62bbe9473f283.jpg',
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&q=80',
                'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&h=1080&fit=crop&q=80',
                'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&h=1080&fit=crop&q=80',
                'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop&q=80',
                'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1920&h=1080&fit=crop&q=80',
                'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&h=1080&fit=crop&q=80',
                'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop&q=80',
                'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1920&h=1080&fit=crop&q=80',
                'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1920&h=1080&fit=crop&q=80',
                'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&h=1080&fit=crop&q=80',
            ],
            blobs: []
        }

        request.onupgradeneeded = (e) => {
            const db = e.target.result
            const { oldVersion } = e

            if (oldVersion < 1) {
                // Fresh install — create the store and seed default
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'name' })
                store.add(defaultCollection)
            }

            if (oldVersion >= 1 && oldVersion < 2) {
                // Existing user upgrading — seed default if missing
                const store = e.target.transaction.objectStore(STORE_NAME)
                store.add(defaultCollection)
            }
        }

        request.onsuccess = (e) => { res(e.target.result) }

        request.onerror = (e) => { rej(e.target.error) }
    });
}

async function getAllCollections() {
    const db = await initDb()

    return new Promise((res, rej) => {
        const transaction = db.transaction([STORE_NAME], "readonly")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.getAll()

        request.onsuccess = (e) => { res(e.target.result) }
        request.onerror = (e) => { rej(e.target.error) }
    })
}

async function getCollection(collectionName) {
    const db = await initDb()

    return new Promise((res, rej) => {
        const transaction = db.transaction([STORE_NAME], "readonly")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(collectionName)

        request.onsuccess = (e) => { res(e.target.result) }
        request.onerror = (e) => { rej(e.target.error) }
    })
}

async function saveCollectionToDb(collectionObj) {
    const db = await initDb()

    return new Promise((res, rej) => {
        const transaction = db.transaction([STORE_NAME], "readwrite")
        const store = transaction.objectStore(STORE_NAME)
        store.put(collectionObj)

        transaction.oncomplete = () => { res() }
        transaction.onerror = (e) => { rej(e.target.error) }
    })
}

async function deleteCollection(collectionName) {
    const db = await initDb()

    return new Promise((res, rej) => {
        const request = db
            .transaction([STORE_NAME], "readwrite")
            .objectStore(STORE_NAME)
            .delete(collectionName)

        request.onsuccess = (e) => { res(e.target.result) }
        request.onerror = (e) => { rej(e.target.error) }
    })
}

// --- Image Upload ---

async function handleImageUpload(collectionKey) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true

    input.onchange = async (e) => {
        const collection = await getCollection(collectionKey)
        const files = e.target.files

        if ((collection.blobs || []).length + files.length > MAX_IMAGES_PER_COLLECTION) {
            alert('Too many images!')
            return
        }

        collection.blobs = collection.blobs || []  // guard for old collections without blobs field
        for (const file of files) {
            collection.blobs.push(file)
        }

        await saveCollectionToDb(collection)
    }

    input.click()
}

// --- Shared UI Utility ---

function showToast(message) {
    alert(message)
    const toast = document.createElement('div')
    toast.textContent = message
    toast.style.cssText = `
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.75); color: white; padding: 10px 20px;
        border-radius: 8px; z-index: 9999; font-size: 14px; pointer-events: none;
    `
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
}

// --- Background Image Loader ---

async function loadCollection(collectionKey) {
    const gallery = document.getElementById('pinterest-gallery');
    if (!gallery) return;

    let collection = await getCollection(collectionKey || localStorage.getItem('activeCollectionKey') || 'default')

    if (!collection) {
        showToast('Collection does not exist... reverting to default')
        collection = await getCollection('default')
    }

    const imageList = [...(collection.imageUrls || []), ...(collection.blobs || [])]

    if (imageList.length === 0) {
        showToast(`"${collection.name}" is empty... reverting to default`);
        localStorage.setItem('activeCollectionKey', 'default')
        await renderCollectionsList()
        loadCollection('default')
        return;
    }

    gallery.innerHTML = ''; // Clear previous background image

    let index = parseInt(localStorage.getItem('imageIndex') || '0')
    if (index >= imageList.length) { index = 0 }

    const currImg = imageList[index]
    localStorage.setItem('imageIndex', index + 1)

    const img = document.createElement('img');
    img.src = typeof currImg === 'string' ? currImg : URL.createObjectURL(currImg);
    img.alt = 'Background image';

    img.onerror = function () {
        console.warn('Failed to load background image, using gradient fallback');
        gallery.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    };

    img.onload = function () {
        console.log('Background image loaded successfully');
    };

    gallery.appendChild(img);
}

// --- Collections Panel UI ---

function openCollectionsPanel() {
    if (document.getElementById('collections-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'collections-panel';
    panel.innerHTML = `
        <div class="collections-modal">
            <div class="collections-header">
                <h2>Image Collections</h2>
                <button id="close-collections-btn">&times;</button>
            </div>
            <div class="collections-body"></div>
            <div class="collections-footer">
                <button id="add-collection-btn" class="fm-btn">+ Add New Collection</button>
            </div>
        </div>
    `;

    document.body.appendChild(panel);
    renderCollectionsList();

    panel.querySelector('#close-collections-btn').addEventListener('click', () => panel.remove());
    panel.querySelector('#add-collection-btn').addEventListener('click', handleAddCollection);
    panel.addEventListener('click', (e) => {
        if (e.target.id === 'collections-panel') panel.remove();
    });
}

async function renderCollectionsList() {
    const body = document.querySelector('.collections-body');
    if (!body) return;

    const data = await getAllCollections();
    body.innerHTML = '';

    data.forEach(collection => {
        const key = collection.name
        const item = document.createElement('div');
        item.className = 'collection-item';
        item.dataset.key = key;
        if (localStorage.getItem('activeCollectionKey') === key) {
            item.classList.add('active');
        }

        let controls = '';
        if (key !== 'default') {
            controls = `
                <div class="collection-controls">
                    <button class="upload-to-collection-btn" title="Add Images"><i class="fa-solid fa-upload"></i></button>
                    <button class="delete-collection-btn" title="Delete Collection"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
        }

        item.innerHTML = `<span class="collection-name">${key}</span> ${controls}`;
        body.appendChild(item);
    });

    // Add event listeners after rendering
    body.querySelectorAll('.collection-item').forEach(el => {
        el.addEventListener('click', async (e) => {
            if (e.target.closest('.collection-controls')) return;
            const key = el.dataset.key;
            localStorage.setItem("activeCollectionKey", key);
            loadCollection(key);
            await renderCollectionsList();
        });
    });

    body.querySelectorAll('.delete-collection-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const key = e.target.closest('.collection-item').dataset.key;
            if (confirm(`Are you sure you want to delete the "${key}" collection?`)) {
                await deleteCollection(key)
                await renderCollectionsList();
                loadCollection('default');
            }
        });
    });

    body.querySelectorAll('.upload-to-collection-btn').forEach(btn => {
        const key = btn.closest('.collection-item').dataset.key;
        btn.addEventListener('click', () => handleImageUpload(key));
    });
}

async function handleAddCollection() {
    const name = prompt('Enter new collection name:');
    if (!name) return

    const existing = await getCollection(name);
    if (existing) {
        showToast('A collection with this name already exists.')
        return
    }
    await saveCollectionToDb({ name, imageUrls: [], blobs: [] })
    await renderCollectionsList()
}
