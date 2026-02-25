document.addEventListener('DOMContentLoaded', () => {
    const moduleList = document.getElementById('module-list');
    const currentModuleTitle = document.getElementById('current-module-title');
    const videoList = document.getElementById('video-list');
    const listViewContainer = document.getElementById('list-view-container');
    const theaterModeContainer = document.getElementById('theater-mode-container');
    const theaterVideoWrapper = document.querySelector('.theater-video-wrapper');
    const theaterTitle = document.getElementById('theater-title');
    const backBtn = document.getElementById('back-to-list');

    // Mobile menu elements
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // Get module names from data
    const modules = Object.keys(videoData);

    // Create Introduction item in sidebar
    const introLi = document.createElement('li');
    introLi.className = 'module-item cursor-pointer active';
    introLi.textContent = 'Introduction';
    introLi.addEventListener('click', () => {
        setActiveSidebarItem(introLi);
        loadIntroduction();
        if (window.innerWidth <= 768) closeMobileMenu();
    });
    moduleList.appendChild(introLi);

    // Render Sidebar Items
    modules.forEach((moduleName) => {
        const li = document.createElement('li');
        li.className = 'module-item cursor-pointer';
        li.textContent = moduleName;

        li.addEventListener('click', () => {
            setActiveSidebarItem(li);
            loadModule(moduleName);
            if (window.innerWidth <= 768) closeMobileMenu();
        });

        moduleList.appendChild(li);
    });

    // Load Introduction by default
    loadIntroduction();

    function setActiveSidebarItem(activeLi) {
        document.querySelectorAll('.module-item').forEach(el => el.classList.remove('active'));
        activeLi.classList.add('active');
        showListView();
    }

    function showListView() {
        theaterModeContainer.classList.add('hidden');
        listViewContainer.classList.remove('hidden');
        theaterVideoWrapper.innerHTML = ''; // Stop video playback
    }

    function showTheaterMode(video) {
        listViewContainer.classList.add('hidden');
        theaterModeContainer.classList.remove('hidden');

        theaterTitle.textContent = video.title;

        let iframeSrc = '';
        if (video.driveId.includes('http')) {
            iframeSrc = video.driveId;
        } else if (video.driveId.startsWith('PLACEHOLDER')) {
            iframeSrc = 'about:blank';
        } else {
            iframeSrc = `https://drive.google.com/file/d/${video.driveId}/preview`;
        }

        let placeholderBg = video.driveId.startsWith('PLACEHOLDER')
            ? 'background-color: #222; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted);'
            : '';

        let placeholderContent = video.driveId.startsWith('PLACEHOLDER')
            ? `<span style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center; font-family:var(--font-heading); color: var(--color-accent-gold);">Video Preview<br><span style="font-size:0.8rem; color:#888;">(Add Drive ID in data.js)</span></span>`
            : '';

        theaterVideoWrapper.innerHTML = `
            <div class="iframe-container" style="${placeholderBg}">
                ${placeholderContent}
                <iframe src="${iframeSrc}" allow="autoplay" allowfullscreen></iframe>
            </div>
        `;

        // Reset scroll to top
        window.scrollTo(0, 0);
    }

    backBtn.addEventListener('click', () => {
        showListView();
    });

    function loadIntroduction() {
        videoList.classList.add('fade-out');
        setTimeout(() => {
            currentModuleTitle.textContent = 'Course Overview';
            videoList.innerHTML = ''; // Clear current videos

            // Render all modules as a summary list
            modules.forEach(moduleName => {
                const moduleVideos = videoData[moduleName];
                if (moduleVideos && moduleVideos.length > 0) {
                    // Create a section header for the module
                    const header = document.createElement('div');
                    header.style.marginTop = '2rem';
                    header.style.marginBottom = '1rem';
                    header.style.fontSize = '1.2rem';
                    header.style.color = 'var(--color-accent-gold)';
                    header.style.fontFamily = 'var(--font-heading)';
                    header.style.borderBottom = '1px solid var(--color-border)';
                    header.style.paddingBottom = '0.5rem';
                    header.textContent = moduleName;
                    videoList.appendChild(header);

                    moduleVideos.forEach((video, index) => {
                        const item = createVideoListItem(video, index + 1);
                        videoList.appendChild(item);
                    });
                }
            });
            videoList.classList.remove('fade-out');
        }, 400);
    }

    // Render videos for a specific module
    function loadModule(moduleName) {
        videoList.classList.add('fade-out');

        setTimeout(() => {
            currentModuleTitle.textContent = moduleName;
            const videos = videoData[moduleName];

            videoList.innerHTML = ''; // Clear current videos

            if (!videos || videos.length === 0) {
                videoList.innerHTML = '<p style="color: var(--color-text-muted);">No videos available for this module.</p>';
            } else {
                videos.forEach((video, index) => {
                    const item = createVideoListItem(video, index + 1);
                    videoList.appendChild(item);
                });
            }
            videoList.classList.remove('fade-out');
        }, 400);
    }

    function createVideoListItem(video, index) {
        const item = document.createElement('div');
        item.className = 'video-list-item cursor-pointer';

        item.innerHTML = `
            <div class="list-item-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
            </div>
            <div class="list-item-content">
                <h3 class="video-title">${video.title}</h3>
                <p class="video-subtitle">Video ${index}</p>
            </div>
        `;

        item.addEventListener('click', () => {
            showTheaterMode(video);
        });

        return item;
    }

    // Mobile Menu Handlers
    function toggleMobileMenu() {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
    }

    function closeMobileMenu() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    }

    menuToggle.addEventListener('click', toggleMobileMenu);
    sidebarOverlay.addEventListener('click', closeMobileMenu);
});