// Custom JavaScript for PrompTab Backend Documentation

// Add smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function () {
	// Smooth scrolling for internal links
	const internalLinks = document.querySelectorAll('a[href^="#"]');
	internalLinks.forEach(link => {
		link.addEventListener('click', function (e) {
			e.preventDefault();
			const targetId = this.getAttribute('href').substring(1);
			const targetElement = document.getElementById(targetId);
			if (targetElement) {
				targetElement.scrollIntoView({
					behavior: 'smooth',
					block: 'start'
				});
			}
		});
	});

	// Add copy button to code blocks
	const codeBlocks = document.querySelectorAll('pre code');
	codeBlocks.forEach(block => {
		const copyButton = document.createElement('button');
		copyButton.textContent = 'Copy';
		copyButton.className = 'copy-button';
		copyButton.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: #2980B9;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 2px 8px;
            font-size: 12px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.3s;
        `;

		const preElement = block.parentElement;
		preElement.style.position = 'relative';
		preElement.appendChild(copyButton);

		// Show/hide copy button on hover
		preElement.addEventListener('mouseenter', () => {
			copyButton.style.opacity = '1';
		});
		preElement.addEventListener('mouseleave', () => {
			copyButton.style.opacity = '0';
		});

		// Copy functionality
		copyButton.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(block.textContent);
				copyButton.textContent = 'Copied!';
				setTimeout(() => {
					copyButton.textContent = 'Copy';
				}, 2000);
			} catch (err) {
				console.error('Failed to copy: ', err);
				copyButton.textContent = 'Failed';
				setTimeout(() => {
					copyButton.textContent = 'Copy';
				}, 2000);
			}
		});
	});

	// Add search functionality
	const searchInput = document.querySelector('.wy-side-nav-search input');
	if (searchInput) {
		searchInput.addEventListener('input', function () {
			const searchTerm = this.value.toLowerCase();
			const searchableElements = document.querySelectorAll('.wy-nav-content .section');

			searchableElements.forEach(element => {
				const text = element.textContent.toLowerCase();
				if (text.includes(searchTerm)) {
					element.style.display = 'block';
				} else {
					element.style.display = 'none';
				}
			});
		});
	}

	// Add table of contents highlighting
	const tocLinks = document.querySelectorAll('.wy-menu-vertical a');
	const sections = document.querySelectorAll('.section');

	function highlightCurrentSection() {
		const scrollPosition = window.scrollY + 100;

		sections.forEach(section => {
			const sectionTop = section.offsetTop;
			const sectionHeight = section.offsetHeight;

			if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
				const sectionId = section.id;
				tocLinks.forEach(link => {
					link.classList.remove('current');
					if (link.getAttribute('href') === '#' + sectionId) {
						link.classList.add('current');
					}
				});
			}
		});
	}

	window.addEventListener('scroll', highlightCurrentSection);

	// Add keyboard navigation
	document.addEventListener('keydown', function (e) {
		if (e.ctrlKey || e.metaKey) {
			switch (e.key) {
				case 'k':
					e.preventDefault();
					const searchInput = document.querySelector('.wy-side-nav-search input');
					if (searchInput) {
						searchInput.focus();
					}
					break;
				case '/':
					e.preventDefault();
					const searchInput2 = document.querySelector('.wy-side-nav-search input');
					if (searchInput2) {
						searchInput2.focus();
					}
					break;
			}
		}
	});

	// Add progress bar
	const progressBar = document.createElement('div');
	progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: #2980B9;
        z-index: 9999;
        transition: width 0.3s;
    `;
	document.body.appendChild(progressBar);

	function updateProgressBar() {
		const scrollTop = window.scrollY;
		const docHeight = document.documentElement.scrollHeight - window.innerHeight;
		const scrollPercent = (scrollTop / docHeight) * 100;
		progressBar.style.width = scrollPercent + '%';
	}

	window.addEventListener('scroll', updateProgressBar);

	// Add "back to top" button
	const backToTopButton = document.createElement('button');
	backToTopButton.innerHTML = '↑';
	backToTopButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        background: #2980B9;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 18px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 1000;
    `;
	document.body.appendChild(backToTopButton);

	function toggleBackToTopButton() {
		if (window.scrollY > 300) {
			backToTopButton.style.opacity = '1';
		} else {
			backToTopButton.style.opacity = '0';
		}
	}

	window.addEventListener('scroll', toggleBackToTopButton);

	backToTopButton.addEventListener('click', () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	});

	// Add dark mode toggle (if supported by theme)
	const darkModeToggle = document.createElement('button');
	darkModeToggle.innerHTML = '🌙';
	darkModeToggle.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        background: #2980B9;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 16px;
        cursor: pointer;
        z-index: 1000;
    `;
	document.body.appendChild(darkModeToggle);

	let isDarkMode = localStorage.getItem('darkMode') === 'true';

	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
		localStorage.setItem('darkMode', isDarkMode);

		if (isDarkMode) {
			document.body.classList.add('dark-mode');
			darkModeToggle.innerHTML = '☀️';
		} else {
			document.body.classList.remove('dark-mode');
			darkModeToggle.innerHTML = '🌙';
		}
	}

	darkModeToggle.addEventListener('click', toggleDarkMode);

	// Apply saved dark mode preference
	if (isDarkMode) {
		document.body.classList.add('dark-mode');
		darkModeToggle.innerHTML = '☀️';
	}

	console.log('PrompTab Documentation enhanced with custom JavaScript');
}); 