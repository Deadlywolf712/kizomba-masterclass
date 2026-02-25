document.addEventListener('DOMContentLoaded', () => {
    const moduleList = document.getElementById('module-list');
    const currentModuleTitle = document.getElementById('current-module-title');
    const videoGrid = document.getElementById('video-grid');
    const mainContent = document.querySelector('.main-content');

    // Inject theater container into main content
    const theaterContainer = document.createElement('div');
    theaterContainer.className = 'theater-container';
    theaterContainer.innerHTML = `
        <div class="video-player-wrapper">
            <video id="main-player" controls controlsList="nodownload"></video>
        </div>
        <div class="ai-summary-container" id="ai-summary"></div>
    `;
    mainContent.appendChild(theaterContainer);

    // Create Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'back-button';
    backBtn.textContent = '← Back to Gallery';
    backBtn.style.display = 'none';
    currentModuleTitle.parentNode.insertBefore(backBtn, currentModuleTitle.nextSibling);

    const mainPlayer = document.getElementById('main-player');
    const aiSummary = document.getElementById('ai-summary');

    // Mobile menu elements
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    const modules = Object.keys(videoData);

    // Render Sidebar Items
    modules.forEach((moduleName, index) => {
        const li = document.createElement('li');
        li.className = 'module-item cursor-pointer';
        li.textContent = moduleName;

        if (index === 0) {
            li.classList.add('active');
            loadModule(moduleName);
        }

        li.addEventListener('click', () => {
            document.querySelectorAll('.module-item').forEach(el => el.classList.remove('active'));
            li.classList.add('active');

            // Switch back to grid view if in theater mode
            closeTheaterMode();

            videoGrid.classList.add('fade-out');
            setTimeout(() => {
                loadModule(moduleName);
                videoGrid.classList.remove('fade-out');
            }, 400);

            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });

        moduleList.appendChild(li);
    });

    backBtn.addEventListener('click', closeTheaterMode);

    function loadModule(moduleName) {
        currentModuleTitle.textContent = moduleName;
        const videos = videoData[moduleName];

        videoGrid.innerHTML = '';

        if (!videos || videos.length === 0) {
            videoGrid.innerHTML = '<p style="color: var(--color-text-muted);">No videos available for this module.</p>';
            return;
        }

        videos.forEach(video => {
            const card = document.createElement('div');
            card.className = 'video-card';

            // Instead of an iframe, we just show a thumbnail placeholder for the gallery
            card.innerHTML = `
                <div class="thumbnail-placeholder">
                    <svg class="thumbnail-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </div>
                <h3 class="video-title">${video.title}</h3>
            `;

            card.addEventListener('click', () => openTheaterMode(video));
            videoGrid.appendChild(card);
        });
    }

    function openTheaterMode(video) {
        videoGrid.style.display = 'none';
        theaterContainer.style.display = 'flex';
        backBtn.style.display = 'inline-block';
        currentModuleTitle.textContent = video.title;

        // Construct raw download link from Drive ID so HTML5 video tag can play it
        // Note: Google Drive blocks direct streaming sometimes, but for small personal use it usually works.
        // A proxy like google drive direct link generator is used here.
        mainPlayer.src = `https://drive.google.com/uc?export=download&id=${video.driveId}`;
        mainPlayer.play().catch(e => console.log("Autoplay prevented:", e));

        // Render AI Summary if it exists
        if (video.description) {
            // Parse markdown
            let htmlContent = marked.parse(video.description);

            // Convert [MM:SS] to clickable buttons
            htmlContent = htmlContent.replace(/\[(\d{2}):(\d{2})\]/g, (match, mins, secs) => {
                const totalSeconds = parseInt(mins) * 60 + parseInt(secs);
                return `<button class="timestamp-btn" data-time="${totalSeconds}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            ${mins}:${secs}
                        </button>`;
            });

            aiSummary.innerHTML = htmlContent;
            aiSummary.style.display = 'block';

            // Attach event listeners to timestamps
            document.querySelectorAll('.timestamp-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const time = parseInt(e.currentTarget.getAttribute('data-time'));
                    mainPlayer.currentTime = time;
                    mainPlayer.play();
                    // Scroll back up to the video
                    mainPlayer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            });
        } else {
            aiSummary.style.display = 'none';
            aiSummary.innerHTML = '';
        }
    }

    function closeTheaterMode() {
        mainPlayer.pause();
        mainPlayer.src = '';
        theaterContainer.style.display = 'none';
        backBtn.style.display = 'none';
        videoGrid.style.display = 'grid';

        // Find active module name
        const activeItem = document.querySelector('.module-item.active');
        if (activeItem) {
            currentModuleTitle.textContent = activeItem.textContent;
        }
    }

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
