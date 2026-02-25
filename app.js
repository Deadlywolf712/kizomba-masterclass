document.addEventListener('DOMContentLoaded', () => {
    const moduleList = document.getElementById('module-list');
    const currentModuleTitle = document.getElementById('current-module-title');
    const videoGrid = document.getElementById('video-grid');

    // Mobile menu elements
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // Get module names from data
    const modules = Object.keys(videoData);

    // Render Sidebar Items
    modules.forEach((moduleName, index) => {
        const li = document.createElement('li');
        li.className = 'module-item cursor-pointer';
        li.textContent = moduleName;

        // Load first module by default
        if (index === 0) {
            li.classList.add('active');
            loadModule(moduleName);
        }

        li.addEventListener('click', () => {
            // Update active state
            document.querySelectorAll('.module-item').forEach(el => el.classList.remove('active'));
            li.classList.add('active');

            // Load new module with fade effect
            videoGrid.classList.add('fade-out');
            setTimeout(() => {
                loadModule(moduleName);
                videoGrid.classList.remove('fade-out');
            }, 400);

            // Close mobile menu if open
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });

        moduleList.appendChild(li);
    });

    // Render videos for a specific module
    function loadModule(moduleName) {
        currentModuleTitle.textContent = moduleName;
        const videos = videoData[moduleName];

        videoGrid.innerHTML = ''; // Clear current videos

        if (!videos || videos.length === 0) {
            videoGrid.innerHTML = '<p style="color: var(--color-text-muted);">No videos available for this module.</p>';
            return;
        }

        videos.forEach(video => {
            const card = document.createElement('div');
            card.className = 'video-card';

            // Generate the Google Drive preview URL
            // If the user pastes a full URL instead of an ID, we handle it simply by checking if it contains http
            let iframeSrc = '';
            if (video.driveId.includes('http')) {
                // Assuming they pasted the full preview link
                iframeSrc = video.driveId;
            } else if (video.driveId.startsWith('PLACEHOLDER')) {
                // Placeholder iframe to show layout structure
                iframeSrc = 'about:blank';
            } else {
                // Construct standard drive preview link from ID
                iframeSrc = `https://drive.google.com/file/d/${video.driveId}/preview`;
            }

            // Create placeholder text if it's a placeholder
            let placeholderBg = video.driveId.startsWith('PLACEHOLDER')
                ? 'background-color: #222; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted);'
                : '';

            let placeholderContent = video.driveId.startsWith('PLACEHOLDER')
                ? `<span style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center; font-family:var(--font-heading); color: var(--color-accent-gold);">Video Preview<br><span style="font-size:0.8rem; color:#888;">(Add Drive ID in data.js)</span></span>`
                : '';

            card.innerHTML = `
                <div class="iframe-container" style="${placeholderBg}">
                    ${placeholderContent}
                    <iframe src="${iframeSrc}" allow="autoplay" allowfullscreen></iframe>
                </div>
                <h3 class="video-title">${video.title}</h3>
            `;

            videoGrid.appendChild(card);
        });
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
