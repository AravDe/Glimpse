document.addEventListener('DOMContentLoaded', () => {
    // Preserve background element
    const gallery = document.getElementById('pinterest-gallery');
    
    // Clear existing content to implement file manager
    document.body.innerHTML = '';
    
    // Center the container
    document.body.style.display = 'flex';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
    document.body.style.padding = '0';
    
    // Restore background
    if (gallery) {
        document.body.appendChild(gallery);
    } else {
        const newGallery = document.createElement('div');
        newGallery.id = 'pinterest-gallery';
        document.body.appendChild(newGallery);
    }
    
    loadPinterestGallery();
    initFileManager();
});

// --- File Manager System ---

let currentFolderId = '0'; // Root

function initFileManager() {
    const container = document.createElement('div');
    container.id = 'file-manager';
    // Glassmorphism style container
    container.style.cssText = `
        position: relative;
        z-index: 10;
        width: 90%;
        max-width: 1200px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        border: 1px solid rgba(255, 255, 255, 0.18);
        color: white;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-height: 80vh;
        min-height: 300px;
        display: flex;
        flex-direction: column;
    `;
    
    // Header (Breadcrumbs + Search)
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.2);';
    
    const breadcrumbs = document.createElement('div');
    breadcrumbs.id = 'fm-breadcrumbs';
    breadcrumbs.style.cssText = 'display: flex; gap: 8px; align-items: center; font-size: 1.1rem; font-weight: 500;';
    
    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 10px; align-items: center;';

    const newFolderBtn = document.createElement('button');
    newFolderBtn.textContent = '+ New Folder';
    newFolderBtn.className = 'fm-btn';
    newFolderBtn.onclick = handleCreateFolder;

    const search = document.createElement('input');
    search.type = 'text';
    search.placeholder = 'Search bookmarks...';
    search.style.cssText = `
        background: rgba(0,0,0,0.2);
        border: 1px solid rgba(255,255,255,0.1);
        padding: 10px 20px;
        border-radius: 20px;
        color: white;
        outline: none;
        width: 250px;
        transition: all 0.3s ease;
    `;
    search.addEventListener('focus', () => search.style.background = 'rgba(0,0,0,0.4)');
    search.addEventListener('blur', () => search.style.background = 'rgba(0,0,0,0.2)');
    search.addEventListener('input', (e) => handleSearch(e.target.value));

    controls.appendChild(newFolderBtn);
    controls.appendChild(search);
    header.appendChild(breadcrumbs);
    header.appendChild(controls);
    container.appendChild(header);

    // Content Area (Grid)
    const content = document.createElement('div');
    content.id = 'fm-content';
    content.style.cssText = 'flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); grid-auto-rows: min-content; gap: 20px; padding-right: 10px;';
    
    // Custom scrollbar styling
    const style = document.createElement('style');
    style.textContent = `
        #fm-content::-webkit-scrollbar { width: 8px; }
        #fm-content::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
        #fm-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
        #fm-content::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
        .fm-item { cursor: pointer; padding: 10px; border-radius: 8px; transition: background 0.2s; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .fm-item:hover { background: rgba(255,255,255,0.1); }
        .fm-icon { width: 48px; height: 48px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; font-size: 32px; }
        .fm-title { font-size: 0.9rem; word-break: break-word; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; max-width: 100%; }
        .fm-icon img { width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(2px 2px 0 rgba(0,0,0,0.2)); }
        .fm-item.drag-over { background: rgba(255, 255, 255, 0.3); transform: scale(1.05); box-shadow: 0 0 15px rgba(255, 255, 255, 0.2); }
        .fm-btn { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: white; padding: 8px 16px; border-radius: 20px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .fm-btn:hover { background: rgba(255, 255, 255, 0.2); }
        #fm-trash { position: absolute; bottom: 20px; right: 20px; width: 48px; height: 48px; background: rgba(0, 0, 0, 0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 2px dashed rgba(255, 255, 255, 0.3); transition: all 0.2s; z-index: 20; }
        #fm-trash.drag-over { background: rgba(255, 50, 50, 0.3); border-color: #ff6b6b; transform: scale(1.1); }
        #fm-trash img { width: 24px; height: 24px; image-rendering: pixelated; }
        .breadcrumb-item { cursor: pointer; opacity: 0.7; transition: opacity 0.2s; }
        .breadcrumb-item.drag-over-breadcrumb { opacity: 1; text-decoration: underline; color: #bb86fc; transform: scale(1.1); display: inline-block; }
        .breadcrumb-item:hover { opacity: 1; text-decoration: underline; }
        .breadcrumb-separator { opacity: 0.4; margin: 0 4px; }
        
        /* Context Menu */
        #fm-context-menu { position: fixed; background: rgba(40, 40, 40, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px; z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.5); min-width: 180px; animation: fadeIn 0.1s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .ctx-item { padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 12px; color: #eee; font-size: 14px; border-radius: 4px; transition: background 0.2s; }
        .ctx-item:hover { background: rgba(255,255,255,0.1); }
        .ctx-color-picker { -webkit-appearance: none; border: none; width: 24px; height: 24px; padding: 0; background: none; cursor: pointer; border-radius: 50%; overflow: hidden; }
        .ctx-color-picker::-webkit-color-swatch-wrapper { padding: 0; }
        .ctx-color-picker::-webkit-color-swatch { border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; }
    `;
    document.head.appendChild(style);
    
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

    document.body.appendChild(container);

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
        content.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; opacity: 0.6;">Folder is empty</div>';
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
            renderBreadcrumbPath([{id: '0', title: 'Home'}, ...path]);
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

// Function to load full-size background image from Pinterest board
function loadPinterestGallery() {
    const gallery = document.getElementById('pinterest-gallery');
    if (!gallery) return;
    
    const pinterestImages = [

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
    ];
    
    // Pick a random image
    const randomImage = pinterestImages[Math.floor(Math.random() * pinterestImages.length)];
    
    // Create single full-size background image
    const img = document.createElement('img');
    img.src = randomImage;
    img.alt = 'Background image';
    
    // Add error handler to fallback to a gradient if image fails
    img.onerror = function() {
        console.warn('Failed to load background image, using gradient fallback');
        gallery.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    };
    
    // Add load handler to confirm image loaded
    img.onload = function() {
        console.log('Background image loaded successfully');
    };
    
    gallery.appendChild(img);
}