document.addEventListener('DOMContentLoaded', () => {
    const moduleList = document.getElementById('module-list');
    const currentModuleTitle = document.getElementById('current-module-title');
    const videoList = document.getElementById('video-list');
    const listViewContainer = document.getElementById('list-view-container');
    const theaterModeContainer = document.getElementById('theater-mode-container');
    const theaterVideoWrapper = document.querySelector('.theater-video-wrapper');
    const theaterTitle = document.getElementById('theater-title');
    const backBtn = document.getElementById('back-to-list');

    // Bunny Stream (Player.js) state
    // This prevents seeking before the iframe/player is ready and avoids spamming play/seek commands.
    let bunnyReady = false;
    let bunnyReadyResolve = null;
    let bunnyReadyPromise = Promise.resolve();
    let bunnyIsPlaying = false;
    let bunnySeekNonce = 0;

    function resetBunnyState() {
        bunnyReady = false;
        bunnyIsPlaying = false;
        bunnySeekNonce = 0;
        bunnyReadyPromise = new Promise((resolve) => {
            bunnyReadyResolve = resolve;
        });
    }

    async function seekBunnyTo(seconds, { autoPlay = true } = {}) {
        const iframe = document.getElementById('bunny-player');
        if (!iframe) return;

        if (window.currentBunnyPlayer) {
            window.currentBunnyPlayer.setCurrentTime(seconds);
            if (autoPlay) window.currentBunnyPlayer.play();
        } else {
            // Strip any existing time parameters from the URL
            let src = iframe.src.replace(/&t=\d+/g, '');

            // Reload the iframe exactly at the requested timestamp
            iframe.src = src + `&t=${seconds}`;
        }
    }

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

    async function showTheaterMode(video) {
        listViewContainer.classList.add('hidden');
        theaterModeContainer.classList.remove('hidden');

        theaterTitle.textContent = video.title;

        let iframeSrc = '';
        let isBunny = false;
        let bunnyId = video.bunnyId;

        if (bunnyId) {
            // Bunny Stream format
            iframeSrc = `https://iframe.mediadelivery.net/embed/607260/${bunnyId}?autoplay=true&preload=true`;
            isBunny = true;
        } else if (video.driveId.includes('http')) {
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

        let iframeAttributes = `src="${iframeSrc}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen`;
        if (isBunny) {
            iframeAttributes = `id="bunny-player" src="${iframeSrc}" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowfullscreen="true"`;
        }

        theaterVideoWrapper.innerHTML = `
        <div class="iframe-container" style="${placeholderBg}">
            ${placeholderContent}
            <iframe ${iframeAttributes}></iframe>
        </div>
    `;

        if (isBunny && typeof playerjs !== 'undefined') {
            resetBunnyState();
            const iframe = document.getElementById('bunny-player');
            if (iframe) {
                window.currentBunnyPlayer = new playerjs.Player(iframe);

                // Track readiness + play state to keep seeks stable.
                try {
                    window.currentBunnyPlayer.on('ready', () => {
                        bunnyReady = true;
                        if (bunnyReadyResolve) bunnyReadyResolve();
                    });
                    window.currentBunnyPlayer.on('play', () => { bunnyIsPlaying = true; });
                    window.currentBunnyPlayer.on('pause', () => { bunnyIsPlaying = false; });
                    window.currentBunnyPlayer.on('ended', () => { bunnyIsPlaying = false; });
                } catch (e) {
                    console.warn('Player.js event binding failed:', e);
                    // Don’t block seeking forever if the event API differs.
                    bunnyReady = true;
                    if (bunnyReadyResolve) bunnyReadyResolve();
                }
            }
        } else {
            window.currentBunnyPlayer = null;
        }

        // Reset scroll to top
        window.scrollTo(0, 0);

        // Load AI Summary
        await loadAISummary(video.driveId);
    }

    async function loadAISummary(driveId) {
        const aiContentContainer = document.getElementById('ai-description-content');

        // Add a tiny artificial delay to maintain the "AI analyzing" feeling, even though it's instant
        aiContentContainer.innerHTML = '<p class="placeholder-text" style="opacity:0.6; animation: pulse 1s infinite;">Analyzing technique and biomechanics...</p>';

        setTimeout(() => {
            if (typeof aiSummaries !== 'undefined' && aiSummaries[driveId]) {
                const summaryText = aiSummaries[driveId];
                aiContentContainer.innerHTML = formatAISummary(summaryText);
                attachTimestampListeners();
            } else {
                aiContentContainer.innerHTML = '<p class="placeholder-text">AI analysis is not yet available for this session.</p>';
            }
        }, 300); // 300ms smooth transition
    }

    function formatAISummary(text) {
        // We will transform the plain text list into a beautiful structural list.
        // The text typically has lines like: "- **[01:15]** - **Title**: Description..."

        const lines = text.split('\n').filter(line => line.trim() !== '');

        let html = '<ul class="ai-breakdown-list">';

        lines.forEach(line => {
            // Regex to extract the timestamp, title, and description
            const regex = /-\s*\*\*(?:\[)?(\d{2}:\d{2})(?:\])?\*\*\s*-\s*\*\*(.*?)\*\*(?:\s*[:-]\s*)?(.*)/;
            const match = line.match(regex);

            if (match) {
                const timestamp = match[1]; // format MM:SS
                const title = match[2].trim();
                const description = match[3].trim();

                // Calculate total seconds
                const timeParts = timestamp.split(':');
                const totalSeconds = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);

                html += `
                    <li class="ai-breakdown-item">
                        <div class="ai-timestamp-col">
                            <span class="ai-timestamp cursor-pointer" data-time="${totalSeconds}">[${timestamp}]</span>
                        </div>
                        <div class="ai-content-col">
                            <h4 class="ai-item-title">${title}</h4>
                            <p class="ai-item-desc">${description}</p>
                        </div>
                    </li>
                `;
            } else if (line.startsWith('Warning:')) {
                // Ignore generated warnings
                return;
            } else {
                // Generic line fallback
                html += `<p class="ai-generic-text">${line.replace(/\*\*/g, '')}</p>`;
            }
        });

        html += '</ul>';
        return html;
    }

    function attachTimestampListeners() {
        const timestamps = document.querySelectorAll('.ai-timestamp');
        timestamps.forEach(el => {
            el.addEventListener('click', () => {
                const timeStr = el.getAttribute('data-time');

                if (timeStr) {
                    const seconds = parseInt(timeStr, 10);

                    const iframe = document.getElementById('bunny-player');
                    if (window.currentBunnyPlayer || iframe) {
                        seekBunnyTo(seconds, { autoPlay: true });

                        // Scroll all the way to the top to center the video
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }
            });
        });
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