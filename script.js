// --- Entry Point ---

document.addEventListener('DOMContentLoaded', () => {
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

// --- Clock ---

function initClock() {
    const timeEl = document.getElementById('time');
    const dateEl = document.getElementById('date');

    if (!timeEl || !dateEl) {
        console.error('Time or date element not found in the DOM.');
        return;
    }

    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeEl.textContent = `${hours}:${minutes}`;

        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString(undefined, dateOptions);
    }

    updateTime();
    setInterval(updateTime, 1000);
}

// --- Greeting Editor ---

function initGreetingEditor() {
    const nameSpan = document.getElementById('user-name');
    if (!nameSpan) return;

    const savedName = localStorage.getItem('userName');
    if (savedName) {
        nameSpan.textContent = savedName;
    }

    nameSpan.addEventListener('click', () => {
        if (nameSpan.querySelector('input')) return;

        const currentName = nameSpan.textContent;
        nameSpan.innerHTML = '';

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
                nameSpan.textContent = currentName;
            }
        };

        input.addEventListener('blur', saveName);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') nameSpan.textContent = currentName;
        });

        nameSpan.appendChild(input);
        input.focus();
        input.select();
    });
}

// --- Top Sites ---

function initTopSites() {
    const container = document.getElementById('top-sites-container');
    if (!container) return;

    chrome.topSites.get((sites) => {
        sites.slice(0, 8).forEach(site => {
            const siteEl = document.createElement('a');
            siteEl.className = 'top-site-item';
            siteEl.href = site.url;
            siteEl.title = site.title;

            const icon = document.createElement('div');
            icon.className = 'top-site-icon';

            const img = document.createElement('img');
            img.src = `https://www.google.com/s2/favicons?domain=${site.url}&sz=64`;
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

// --- Header Toggles (Bookmarks visibility + Theme) ---

function createHeaderToggles() {
    const container = document.createElement('div');
    container.id = 'header-toggles';

    // Visibility Toggle
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

    // Theme Toggle
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

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
}
