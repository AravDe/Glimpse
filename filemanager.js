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

    const folderColors = JSON.parse(localStorage.getItem('folderColors') || '{}');
    input.value = folderColors[item.id] || '#5D9CEC';

    input.addEventListener('input', (ev) => {
        const colors = JSON.parse(localStorage.getItem('folderColors') || '{}');
        colors[item.id] = ev.target.value;
        localStorage.setItem('folderColors', JSON.stringify(colors));
        loadFolder(currentFolderId);
    });

    input.addEventListener('click', (ev) => ev.stopPropagation());

    const label = document.createElement('span');
    label.textContent = 'Change Color';

    colorItem.appendChild(input);
    colorItem.appendChild(label);
    menu.appendChild(colorItem);

    // Reset Option (only if a specific color is set)
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
