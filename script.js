document.addEventListener('DOMContentLoaded', () => {
    loadTabGroups();
    loadBookmarks();
    loadHistory();
    loadPinterestGallery();
    
    // Add refresh button listener
    const refreshBtn = document.getElementById('refresh-tab-groups');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            console.log('Manually refreshing tab groups...');
            loadTabGroups();
        });
    }
});
// Function to load and display active tab groups
function loadTabGroups() {
    const container = document.getElementById('tab-groups-list');
    const searchInput = document.getElementById('search-tab-groups');
    
    if (!container) {
        console.error('Group list element not found');
        return;
    }
    
    // Check if the Tab Groups API is available
    if (!chrome.tabGroups) {
        console.warn('Tab Groups API not available');
        container.innerHTML = '<div class="empty-message">Tab Groups API not available in this browser.<br><small>Make sure you\'re using Chrome/Brave 89+ or Edge 89+</small></div>';
        return;
    }
    
    chrome.tabGroups.query({}, (groups) => {
        if (chrome.runtime.lastError) {
            console.error('Error querying groups:', chrome.runtime.lastError);
            container.innerHTML = `<div class="empty-message">Error loading tab groups: ${chrome.runtime.lastError.message}</div>`;
            return;
        }
        
        console.log(`Found ${groups ? groups.length : 0} groups:`, groups);
        
        if (!groups || groups.length === 0) {
            container.innerHTML = '<div class="empty-message">No tab groups found.<br><small>Create a tab group to see it here!</small></div>';
            return;
        }
        
        // Render the groups with search functionality
        renderGroupsWithSearch(groups, container, searchInput);
    });
}

function renderGroupsWithSearch(allGroups, container, searchInput) {
    function renderGroups(groupsToShow) {
        container.innerHTML = ''; // Clear the container
        
        if (groupsToShow.length === 0) {
            container.innerHTML = '<div class="empty-message">No matches found.</div>';
            searchInput.classList.add('no-results');
            return;
        }
        
        searchInput.classList.remove('no-results');
        
        groupsToShow.forEach(group => {
            console.log('Rendering group:', group);
            
            const block = document.createElement('div');
            block.className = 'item-block';
            
            const colorBar = document.createElement('div');
            colorBar.className = 'group-color-bar';
            colorBar.style.backgroundColor = group.color;
            
            const content = document.createElement('div');
            content.className = 'block-content';
            
            const title = document.createElement('div');
            title.className = 'block-title';
            title.textContent = group.title || 'Untitled Group';
            
            if (group.collapsed) {
                const collapsedBadge = document.createElement('span');
                collapsedBadge.className = 'collapsed-badge';
                collapsedBadge.textContent = 'collapsed';
                title.appendChild(collapsedBadge);
            }
            
            if (group.synthetic) {
                const syntheticBadge = document.createElement('span');
                syntheticBadge.className = 'collapsed-badge';
                syntheticBadge.style.background = 'rgba(255, 193, 7, 0.2)';
                syntheticBadge.style.color = '#ffc107';
                syntheticBadge.textContent = 'inactive';
                title.appendChild(syntheticBadge);
            }
            
            // Add window ID info for debugging
            const windowInfo = document.createElement('div');
            windowInfo.className = 'block-url';
            
            content.appendChild(title);
            content.appendChild(windowInfo);
            block.appendChild(colorBar);
            block.appendChild(content);
            container.appendChild(block);
        });
    }
    
    renderGroups(allGroups);
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            renderGroups(allGroups);
            return;
        }
        
        const filtered = allGroups.filter(group => {
            const title = (group.title || 'Untitled Group').toLowerCase();
            return title.includes(searchTerm);
        });
        
        renderGroups(filtered);
    });
}


function loadBookmarks() {
    const container = document.getElementById('bookmarks-list');
    const searchInput = document.getElementById('search-bookmarks');
    
    if (!container) {
        console.error('Bookmarks list element not found');
        return;
    }
    
    chrome.bookmarks.getRecent(20, (bookmarks) => {
        if (bookmarks.length === 0) {
            container.innerHTML = '<div class="empty-message">No recent bookmarks.</div>';
            return;
        }
        
        // Filter to only include actual bookmarks (not folders) and store them
        const allBookmarks = bookmarks.filter(bookmark => bookmark.url);
        
        if (allBookmarks.length === 0) {
            container.innerHTML = '<div class="empty-message">No recent bookmarks.</div>';
            return;
        }
        
        function renderBookmarks(bookmarksToShow) {
            container.innerHTML = ''; // Clear container
            
            if (bookmarksToShow.length === 0) {
                container.innerHTML = '<div class="empty-message">No matches found.</div>';
                searchInput.classList.add('no-results');
                return;
            }
            
            searchInput.classList.remove('no-results');
            
            bookmarksToShow.forEach(bookmark => {
                const block = document.createElement('div');
                block.className = 'item-block';
                
                const link = document.createElement('a');
                link.href = bookmark.url;
                link.className = 'block-link';
                
                const icon = document.createElement('img');
                icon.src = `https://www.google.com/s2/favicons?domain=${bookmark.url}&sz=32`;
                icon.className = 'block-icon';
                
                const content = document.createElement('div');
                content.className = 'block-content';
                
                const title = document.createElement('div');
                title.className = 'block-title';
                title.textContent = bookmark.title || bookmark.url;
                
                content.appendChild(title);
                link.appendChild(icon);
                link.appendChild(content);
                block.appendChild(link);
                container.appendChild(block);
            });
        }
        
        // Initial render
        renderBookmarks(allBookmarks);
        
        // Add search functionality
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                renderBookmarks(allBookmarks);
                return;
            }
            
            const filtered = allBookmarks.filter(bookmark => {
                const title = (bookmark.title || '').toLowerCase();
                const url = (bookmark.url || '').toLowerCase();
                return title.includes(searchTerm) || url.includes(searchTerm);
            });
            
            renderBookmarks(filtered);
        });
    });
}

function loadHistory() {
    const container = document.getElementById('history-list');
    const searchInput = document.getElementById('search-history');
    
    if (!container) return;

    chrome.history.search({ text: '', maxResults: 100 }, (historyItems) => {
        if (historyItems.length === 0) {
            container.innerHTML = '<div class="empty-message">No recent history.</div>';
            return;
        }

        const filteredHistory = [];
        const seenHostnames = new Set();

        for (const item of historyItems) {
            if (item.url) {
                try {
                    const hostname = new URL(item.url).hostname;

                    if (!seenHostnames.has(hostname)) {
                        seenHostnames.add(hostname);
                        filteredHistory.push(item);
                    }
                } catch (e) {
                    console.warn("Could not parse URL from history:", item.url);
                }
            }
            if (filteredHistory.length >= 10) {
                break;
            }
        }
        
        // Store all history items for filtering
        const allHistory = filteredHistory;
        
        // Function to render history items
        function renderHistory(historyToShow) {
            container.innerHTML = ''; // Clear old items
            
            if (historyToShow.length === 0) {
                container.innerHTML = '<div class="empty-message">No matches found.</div>';
                searchInput.classList.add('no-results');
                return;
            }
            
            searchInput.classList.remove('no-results');
            
            historyToShow.forEach(item => {
                const block = document.createElement('div');
                block.className = 'item-block';

                const link = document.createElement('a');
                link.href = item.url;
                link.className = 'block-link';
                link.title = item.url;

                const icon = document.createElement('img');
                icon.src = `https://www.google.com/s2/favicons?domain=${item.url}&sz=32`;
                icon.className = 'block-icon';

                const content = document.createElement('div');
                content.className = 'block-content';
                
                const title = document.createElement('div');
                title.className = 'block-title';
                title.textContent = item.title || item.url;

                content.appendChild(title);
                link.appendChild(icon);
                link.appendChild(content);
                block.appendChild(link);
                container.appendChild(block);
            });
        }
        
        // Initial render
        renderHistory(allHistory);
        
        // Add search functionality
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                renderHistory(allHistory);
                return;
            }
            
            const filtered = allHistory.filter(item => {
                const title = (item.title || '').toLowerCase();
                const url = (item.url || '').toLowerCase();
                return title.includes(searchTerm) || url.includes(searchTerm);
            });
            
            renderHistory(filtered);
        });
    });
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