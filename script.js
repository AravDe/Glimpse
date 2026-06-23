const DB_NAME = 'HomepageDB'
const STORE_NAME = 'collections'
const MAX_IMAGES_PER_COLLECTION = 10

document.addEventListener('DOMContentLoaded', () => {
    // Find the root element for the file manager using a 'js-*' hook
    const fileManagerRoot = document.querySelector('.js-file-manager-root');
    if (fileManagerRoot) {
        initFileManager(fileManagerRoot);
    } else {
        console.error('File manager root element (.js-file-manager-root) not found.');
    }
    loadCollection();
    createHeaderToggles();
    initClock();
    initGreetingEditor();
    initTopSites();

    const collectionsBtn = document.getElementById('collections-btn');
    if (collectionsBtn) {
        collectionsBtn.addEventListener('click', openCollectionsPanel);
    }
});


function initDb() {
    return new Promise((res, rej) => {
        const request = indexedDB.open(DB_NAME, 1)

        request.onupgradeneeded = (e) => {
            const db = e.target.result
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'name' })
            store.add({
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
                ]
            })
        }

        request.onsuccess = (e) => { res(e.target.result) }

        request.onerror = (e) => { rej(e.target.error) }
    });
}

async function getAllCollections(collection) {
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

        for (const file of files) {
            collection.blobs.push(file)
        }

        await saveCollectionToDb(collection)
    }

    input.click()
}

async function loadCollection(collectionKey) {

    const gallery = document.getElementById('pinterest-gallery');
    if (!gallery) return;

    let collection = await getCollection(collectionKey)

    if (!collection) {
        showToast('Collection does not exist... reverting to default')
        collection = await getCollection('default')
    }

    const imageList = [...(collection.imageUrls || []), ...(collection.blobs || [])]


    if (imageList.length === 0) {
        showToast(`Active collection "${collection.name}" is empty. Using gradient fallback.`);
        gallery.style.background = 'linear-gradient(135deg, #717db2ff 0%, #764ba2 100%)';
        return;
    }

    gallery.innerHTML = ''; // Clear previous background image

    let index = parseInt(localStorage.getItem('imageIndex') || '0')

    if (index >= imagelist.length) { index = 0 }

    const currImg = imageList[Math.floor(Math.random() * imageList.length)];

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

function initClock() {
    const timeEl = document.getElementById('time');
    const dateEl = document.getElementById('date');

    if (!timeEl || !dateEl) {
        console.error('Time or date element not found in the DOM.');
        return;
    }

    function updateTime() {
        const now = new Date();

        // Format time as HH:MM:SS
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeEl.textContent = `${hours}:${minutes}`;

        // Format date as "Weekday, Month Day, Year"
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString(undefined, dateOptions);
    }

    updateTime(); // Initial call to display time immediately
    setInterval(updateTime, 1000); // Update every second
}

function initGreetingEditor() {
    const nameSpan = document.getElementById('user-name');
    if (!nameSpan) return;

    // Load name from localStorage or use default
    const savedName = localStorage.getItem('userName');
    if (savedName) {
        nameSpan.textContent = savedName;
    }

    nameSpan.addEventListener('click', () => {
        // Prevent creating multiple inputs
        if (nameSpan.querySelector('input')) return;

        const currentName = nameSpan.textContent;
        nameSpan.innerHTML = ''; // Clear the span

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'greeting-name-edit';

        const saveName = () => {
            const newName = input.value.trim();
            if (newName && newName !== currentName) {
                localStorage.setItem('userName', newName);
                nameSpan.textContent = newName;
            } else {
                // If empty or unchanged, revert to original
                nameSpan.textContent = currentName;
            }
        };

        input.addEventListener('blur', saveName);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur(); // Save on Enter
            if (e.key === 'Escape') nameSpan.textContent = currentName; // Cancel on Escape
        });

        nameSpan.appendChild(input);
        input.focus();
        input.select();
    });
}

function initTopSites() {
    const container = document.getElementById('top-sites-container');
    if (!container) return;

    // The topSites API is asynchronous
    chrome.topSites.get((sites) => {
        // Display up to 8 of the most visited sites
        sites.slice(0, 8).forEach(site => {
            const siteEl = document.createElement('a');
            siteEl.className = 'top-site-item';
            siteEl.href = site.url;
            siteEl.title = site.title;

            const icon = document.createElement('div');
            icon.className = 'top-site-icon';

            const img = document.createElement('img');
            img.src = `https://www.google.com/s2/favicons?domain=${site.url}&sz=64`;
            // Fallback for sites without a favicon
            img.onerror = () => {
                icon.textContent = site.title.charAt(0).toUpperCase();
                icon.style.backgroundColor = 'rgba(0,0,0,0.3)';
                img.remove();
            };

            const title = document.createElement('span');
            title.className = 'top-site-title';
            title.textContent = site.title;

            icon.appendChild(img);
            siteEl.appendChild(icon);
            siteEl.appendChild(title);
            container.appendChild(siteEl);
        });
    });
}

function createHeaderToggles() {
    const container = document.createElement('div');
    container.id = 'header-toggles';

    // --- Visibility Toggle ---
    const visibilityBtn = document.createElement('button');
    visibilityBtn.className = 'header-toggle-btn';
    visibilityBtn.title = 'Hide Bookmarks';

    const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    visibilityBtn.innerHTML = eyeIcon;

    visibilityBtn.addEventListener('click', () => {
        const fmSection = document.getElementById('file-manager-section');
        if (fmSection) {
            const isVisible = fmSection.style.display !== 'none';
            fmSection.style.display = isVisible ? 'none' : 'flex';
            visibilityBtn.innerHTML = isVisible ? eyeOffIcon : eyeIcon;
            visibilityBtn.title = isVisible ? 'Show Bookmarks' : 'Hide Bookmarks';
        }
    });
    container.appendChild(visibilityBtn);

    // --- Theme Toggle ---
    const themeBtn = document.createElement('button');
    themeBtn.className = 'header-toggle-btn';

    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

    const applyTheme = (theme) => {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
            themeBtn.innerHTML = moonIcon;
            themeBtn.title = 'Switch to Dark Mode';
        } else {
            document.body.classList.remove('light-mode');
            themeBtn.innerHTML = sunIcon;
            themeBtn.title = 'Switch to Light Mode';
        }
    };

    themeBtn.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    container.appendChild(themeBtn);
    document.body.appendChild(container);

    // Apply saved theme on load
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
}

// --- File Manager System ---

let currentFolderId = '0'; // Root

function initFileManager(rootElement) {
    const container = document.createElement('div');
    container.id = 'file-manager';
    // All styles are in style.css

    // Header (Breadcrumbs + Controls)
    const header = document.createElement('div');
    header.className = 'fm-header';

    const breadcrumbs = document.createElement('div');
    breadcrumbs.id = 'fm-breadcrumbs';

    const controls = document.createElement('div');
    controls.className = 'fm-controls';

    const newFolderBtn = document.createElement('button');
    newFolderBtn.textContent = '+ New Folder';
    newFolderBtn.className = 'fm-btn';
    newFolderBtn.onclick = handleCreateFolder;

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search bookmarks...';
    searchInput.className = 'fm-search';
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));

    controls.appendChild(newFolderBtn);
    controls.appendChild(searchInput);
    header.appendChild(breadcrumbs);
    header.appendChild(controls);
    container.appendChild(header);

    // Content Area (Grid)
    const content = document.createElement('div');
    content.id = 'fm-content';

    container.appendChild(content);

    // Trash Can
    const trash = document.createElement('div');
    trash.id = 'fm-trash';
    trash.title = 'Drag here to delete';
    trash.innerHTML = '<img src="data:image/svg+xml;charset=utf-8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' shape-rendering=\'crispEdges\'><path d=\'M5 4h14v2H5zM8 2h8v2H8zM6 7h12v15H6zM9 10v9h2v-9zm4 0v9h2v-9z\' fill=\'white\'/></svg>" />';
    trash.addEventListener('dragover', handleDragOver);
    trash.addEventListener('dragleave', handleDragLeave);
    trash.addEventListener('drop', handleTrashDrop);
    container.appendChild(trash);

    // Close context menu on click anywhere
    document.addEventListener('click', closeContextMenu);

    rootElement.appendChild(container);

    loadFolder('0');
}

function loadFolder(folderId) {
    currentFolderId = folderId;
    const content = document.getElementById('fm-content');
    content.innerHTML = '';

    if (folderId === '0') {
        // Flatten root: Combine contents of "Bookmarks Bar", "Other Bookmarks", etc.
        chrome.bookmarks.getChildren('0', (roots) => {
            let allItems = [];
            let pending = roots.length;

            if (pending === 0) return renderItems([]);

            roots.forEach(root => {
                chrome.bookmarks.getChildren(root.id, (children) => {
                    allItems = allItems.concat(children);
                    pending--;
                    if (pending === 0) renderItems(allItems);
                });
            });
        });
    } else {
        chrome.bookmarks.getChildren(folderId, (children) => {
            renderItems(children);
        });
    }
    updateBreadcrumbs(folderId);
}

function renderItems(items) {
    const content = document.getElementById('fm-content');
    content.innerHTML = '';

    // Sort: Folders first, then bookmarks
    items.sort((a, b) => {
        const aIsFolder = !a.url;
        const bIsFolder = !b.url;
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return 0;
    });

    if (items.length === 0) {
        content.innerHTML = '<div class="fm-empty-message">Folder is empty</div>';
        return;
    }

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'fm-item';

        const icon = document.createElement('div');
        icon.className = 'fm-icon';

        if (item.url) {
            // Bookmark
            const img = document.createElement('img');
            img.src = `https://www.google.com/s2/favicons?domain=${item.url}&sz=64`;
            img.onerror = () => {
                // Retro file fallback
                img.src = 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges"><path d="M4 2h10l6 6v14H4V2z" fill="%23FFF" stroke="%23000" stroke-width="2"/><path d="M14 2v6h6" fill="none" stroke="%23000" stroke-width="2"/><path d="M8 12h8M8 16h8M8 20h5" stroke="%23000" stroke-width="2"/></svg>';
            };
            icon.appendChild(img);

            el.addEventListener('click', () => window.location.href = item.url);
            el.title = item.url;
        } else {
            // Folder
            const img = document.createElement('img');
            // Retro folder icon (Individual or Default Color)
            const folderColors = JSON.parse(localStorage.getItem('folderColors') || '{}');
            const userColor = folderColors[item.id] || '#5D9CEC';
            const encodedColor = userColor.replace('#', '%23');
            img.src = `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges"><path d="M2 4h9l2 2h9v14H2V4z" fill="${encodedColor}" fill-opacity="0.6" stroke="%23000" stroke-width="2"/><path d="M2 9h20v11H2V9z" fill="${encodedColor}" stroke="%23000" stroke-width="2"/></svg>`;
            icon.appendChild(img);
            el.addEventListener('click', () => loadFolder(item.id));
            el.addEventListener('contextmenu', (e) => handleContextMenu(e, item));
        }

        // Drag and Drop
        el.draggable = true;
        el.addEventListener('dragstart', (e) => handleDragStart(e, item));
        el.addEventListener('dragover', (e) => handleDragOver(e));
        el.addEventListener('dragleave', (e) => handleDragLeave(e));
        el.addEventListener('drop', (e) => handleDrop(e, item));

        const title = document.createElement('div');
        title.className = 'fm-title';
        title.textContent = item.title;

        el.appendChild(icon);
        el.appendChild(title);
        content.appendChild(el);
    });
}

function updateBreadcrumbs(folderId) {
    const container = document.getElementById('fm-breadcrumbs');
    container.innerHTML = '';

    // Helper to build path recursively
    const buildPath = (id, path = []) => {
        if (id === '0') {
            renderBreadcrumbPath([{ id: '0', title: 'Home' }, ...path]);
            return;
        }
        chrome.bookmarks.get(id, (results) => {
            if (results && results[0]) {
                path.unshift(results[0]);
                buildPath(results[0].parentId, path);
            }
        });
    };

    buildPath(folderId);
}

function renderBreadcrumbPath(pathItems) {
    const container = document.getElementById('fm-breadcrumbs');
    container.innerHTML = '';

    pathItems.forEach((item, index) => {
        const span = document.createElement('span');
        span.className = 'breadcrumb-item';
        span.textContent = item.title || 'Root';
        span.onclick = () => loadFolder(item.id);

        // Allow dropping on breadcrumbs to move items to parent folders
        span.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            span.classList.add('drag-over-breadcrumb');
        });

        span.addEventListener('dragleave', () => {
            span.classList.remove('drag-over-breadcrumb');
        });

        span.addEventListener('drop', (e) => {
            e.preventDefault();
            span.classList.remove('drag-over-breadcrumb');
            const draggedId = e.dataTransfer.getData('text/plain');
            if (draggedId && draggedId !== item.id) {
                chrome.bookmarks.move(draggedId, { parentId: item.id }, () => loadFolder(currentFolderId));
            }
        });

        container.appendChild(span);

        if (index < pathItems.length - 1) {
            const sep = document.createElement('span');
            sep.className = 'breadcrumb-separator';
            sep.textContent = '/';
            container.appendChild(sep);
        }
    });
}

function handleSearch(query) {
    const content = document.getElementById('fm-content');
    const breadcrumbs = document.getElementById('fm-breadcrumbs');

    if (!query) {
        loadFolder(currentFolderId);
        return;
    }

    breadcrumbs.innerHTML = '<span class="breadcrumb-item">Search Results</span>';

    chrome.bookmarks.search(query, (results) => {
        renderItems(results);
    });
}

// --- Drag and Drop Handlers ---

function handleDragStart(e, item) {
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e, targetItem) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const draggedId = e.dataTransfer.getData('text/plain');

    if (draggedId === targetItem.id) return;

    if (!targetItem.url) {
        // Target is a folder: Move dragged item into it
        chrome.bookmarks.move(draggedId, { parentId: targetItem.id }, () => loadFolder(currentFolderId));
    } else {
        // Target is a file: Create new folder and move both
        chrome.bookmarks.get(targetItem.id, (results) => {
            if (!results || !results[0]) return;
            const parentId = results[0].parentId;
            chrome.bookmarks.create({ parentId: parentId, title: 'New Folder' }, (newFolder) => {
                chrome.bookmarks.move(targetItem.id, { parentId: newFolder.id }, () => {
                    chrome.bookmarks.move(draggedId, { parentId: newFolder.id }, () => loadFolder(currentFolderId));
                });
            });
        });
    }
}

function handleCreateFolder() {
    const name = prompt("Enter folder name:");
    if (name) {
        // If at root (0), default to Bookmarks Bar (1)
        const parentId = currentFolderId === '0' ? '1' : currentFolderId;
        chrome.bookmarks.create({
            parentId: parentId,
            title: name
        }, () => loadFolder(currentFolderId));
    }
}

function handleTrashDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    if (confirm('Are you sure you want to delete this item?')) {
        chrome.bookmarks.removeTree(id, () => {
            if (chrome.runtime.lastError) {
                // Fallback if removeTree fails (though it shouldn't for valid IDs)
                chrome.bookmarks.remove(id, () => loadFolder(currentFolderId));
            } else {
                loadFolder(currentFolderId);
            }
        });
    }
}

function closeContextMenu() {
    const existing = document.getElementById('fm-context-menu');
    if (existing) existing.remove();
}

function handleContextMenu(e, item) {
    e.preventDefault();
    closeContextMenu();

    const menu = document.createElement('div');
    menu.id = 'fm-context-menu';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;

    // Change Color Option
    const colorItem = document.createElement('div');
    colorItem.className = 'ctx-item';

    const input = document.createElement('input');
    input.type = 'color';
    input.className = 'ctx-color-picker';

    // Set current value
    const folderColors = JSON.parse(localStorage.getItem('folderColors') || '{}');
    input.value = folderColors[item.id] || '#5D9CEC';

    input.addEventListener('input', (ev) => {
        const colors = JSON.parse(localStorage.getItem('folderColors') || '{}');
        colors[item.id] = ev.target.value;
        localStorage.setItem('folderColors', JSON.stringify(colors));
        loadFolder(currentFolderId); // Re-render to show change
    });

    // Prevent menu closing when clicking the input
    input.addEventListener('click', (ev) => ev.stopPropagation());

    const label = document.createElement('span');
    label.textContent = 'Change Color';

    colorItem.appendChild(input);
    colorItem.appendChild(label);
    menu.appendChild(colorItem);

    // Reset Option (only if specific color is set)
    if (folderColors[item.id]) {
        const resetItem = document.createElement('div');
        resetItem.className = 'ctx-item';
        resetItem.textContent = 'Reset to Default';
        resetItem.onclick = () => {
            const colors = JSON.parse(localStorage.getItem('folderColors') || '{}');
            delete colors[item.id];
            localStorage.setItem('folderColors', JSON.stringify(colors));
            loadFolder(currentFolderId);
        };
        menu.appendChild(resetItem);
    }

    document.body.appendChild(menu);
}



const MAX_COLLECTIONS = 100000;

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

    dataforEach(collection => {
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
            await renderCollectionsList();
            loadCollection(key); // Reload background
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

    // Note: Upload functionality is complex and requires a file input handler.
    // This is a placeholder for where that logic would go.
    body.querySelectorAll('.upload-to-collection-btn').forEach(btn => {
        const key = btn.closest('.collection-item').dataset.key;
        btn.addEventListener('click', () => handleImageUpload(key));
    });
}

function handleAddCollection() {
    const data = getCollections();
    if (Object.keys(data.collections).length >= MAX_COLLECTIONS) {
        alert(`You can only have a maximum of ${MAX_COLLECTIONS} collections.`);
        return;
    }
    const name = prompt('Enter new collection name:');
    if (name && !data.collections[name]) {
        data.collections[name] = [];
        saveCollections(data);
        renderCollectionsList();
    } else if (name) {
        alert('A collection with this name already exists.');
    }
}

function addImageToCollection(key, imageDataUrl) {
    const data = getCollections();
    if (data.collections[key]) {
        data.collections[key].push(imageDataUrl);
        saveCollections(data);
        // If the updated collection is the active one, reload the background to potentially show the new image
        if (data.active === key) {
            loadCollection();
        }
    }
}