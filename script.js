document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById("navLinks");
    const icon = document.querySelector(".menu-icon");
    const btt = document.getElementById("backToTop");
    const countdownEl = document.getElementById("countdown");

    // --- 1. PRIORITY SCROLLSPY ---
function updateScrollSpy() {
    // Determine scroll position
    const scrollPos = (window.pageYOffset || document.documentElement.scrollTop) + 100;
    let current = "";
    
    const sections = document.querySelectorAll("section");
    sections.forEach(section => {
        if (scrollPos >= section.offsetTop) {
            current = section.getAttribute("id");
        }
    });

    // Select all potential links
    const allLinks = document.querySelectorAll('#navLinks a, .dropbtn');
    
    allLinks.forEach(a => {
        // 1. Always ensure they are visible
        a.style.opacity = "1";
        
        const href = a.getAttribute("href");
        
        // 2. Remove active class safely
        a.classList.remove("active");

        // 3. Logic to keep "Stories" gold when inside sub-sections
        const storySections = ["video", "article", "gallery", "stories"];
        if (storySections.includes(current)) {
            if (a.innerText.includes("Stories") || a.classList.contains("dropbtn")) {
                a.classList.add("active");
            }
        } 
        
        // 4. Standard match for other sections
        if (href === `#${current}`) {
            a.classList.add("active");
        }
    });
}

    window.addEventListener('scroll', () => {
        updateScrollSpy();
        if (window.pageYOffset > 300) btt.classList.add("visible");
        else btt.classList.remove("visible");
    });

    updateScrollSpy();

    // --- 2. MENU LOGIC (STABLE) ---
window.closeMenu = function() {
    nav.classList.remove("active");
    if (icon) icon.classList.remove("open");

    // ONLY hide the display if we are on a mobile/tablet screen
    if (window.innerWidth <= 1024) {
        setTimeout(() => { 
            if (!nav.classList.contains("active")) {
                nav.style.display = "none"; 
            }
        }, 500);
    } else {
        // Ensure desktop ALWAYS stays flex
        nav.style.display = "flex"; 
    }
};

    window.toggleMenu = function() {
        if (nav.classList.contains("active")) {
            window.closeMenu();
        } else {
            nav.style.display = "flex";
            setTimeout(() => {
                nav.classList.add("active");
                icon.classList.add("open");
            }, 10);
        }
    };

    window.toggleAccordion = function(event, menuId) {
        if (window.innerWidth <= 1024) {
            event.preventDefault();
            event.stopPropagation();
            const target = document.getElementById(menuId);
            document.querySelectorAll('.accordion-menu').forEach(m => {
                if (m.id !== menuId) m.classList.remove('show');
            });
            target.classList.toggle('show');
        }
    };

    nav.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' && !e.target.classList.contains('dropbtn')) {
            window.closeMenu();
        }
    });

    // --- 3. COUNTDOWN (STABLE) ---
    const targetDate = new Date("June 16, 2026 00:00:00").getTime();
    if (countdownEl) {
        setInterval(() => {
            const now = new Date().getTime();
            const diff = targetDate - now;
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            countdownEl.innerHTML = `${d}d ${h}h ${m}m ${s}s`;
        }, 1000);
    }
});

// --- 4. DYNAMIC STORIES & BRIGHTCOVE LOGIC ---
let storiesData = [];
let currentStory = null;

async function loadStories() {
    try {
        const response = await fetch('stories.json');
        storiesData = await response.json();
        
        if (document.getElementById('filterType')) {
            handleCategoryChange(); 
        }
        // Load the very first story into the stage by default
        if(storiesData.length > 0) updatePreview(storiesData[0]);
    } catch (error) {
        console.error("Error loading stories:", error);
    }
}

// Handles the filter dropdown logic
window.handleCategoryChange = function() {
    const typeVal = document.getElementById('filterType').value;
    const speakerSelect = document.getElementById('filterSpeaker');
    if (!speakerSelect) return;
    
    speakerSelect.innerHTML = '';

    if (typeVal === 'article') {
        const opt = document.createElement('option');
        opt.value = 'Wrap up'; opt.innerHTML = 'Wrap up';
        speakerSelect.appendChild(opt);
    } else {
        const options = [
            { val: 'all', text: 'All Categories' },
            { val: 'Dato', text: 'Dato Sri Vijay' },
            { val: 'Japa', text: 'Japa Bismark' },
            { val: 'Chief', text: 'Chief Pathman' },
            { val: 'Highlights', text: 'Highlights' }
        ];
        options.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.val; opt.innerHTML = s.text;
            speakerSelect.appendChild(opt);
        });
    }
    applyFilters();
};

window.applyFilters = function() {
    // 1. Get the current values from the dropdowns
    const typeVal = document.getElementById('filterType').value;
    const speakerVal = document.getElementById('filterSpeaker').value;
    const dayVal = document.getElementById('filterDay').value;
    const resetBtn = document.getElementById('resetFilters');

    // 2. Handle Reset Button visibility
    if (resetBtn) {
        if (typeVal !== 'all' || speakerVal !== 'all' || dayVal !== 'all') {
            resetBtn.style.display = 'inline-block';
        } else {
            resetBtn.style.display = 'none';
        }
    }

    // 3. Filter the data (using the variables we just defined above)
    const filtered = storiesData.filter(item => {
        const matchType = (typeVal === 'all' || item.type === typeVal);
        const matchSpeaker = (speakerVal === 'all' || item.speaker === speakerVal);
        const matchDay = (dayVal === 'all' || item.day === dayVal);
        return matchType && matchSpeaker && matchDay;
    });

    // 4. Update the UI
    renderFilteredPlaylist(filtered);
};

function renderFilteredPlaylist(data) {
    const container = document.querySelector('.playlist-scroll');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<p style="padding:20px; color:#666;">No items match.</p>';
        return;
    }

    container.innerHTML = data.map((story) => {
        const storyData = JSON.stringify(story).replace(/'/g, "&apos;").replace(/"/g, "&quot;");
        return `
            <div class="story-item" onclick="updatePreviewByObject('${storyData}')">
                <div class="thumb-wrap">
                    <img src="${story.thumbnail}" alt="${story.title}">
                </div>
                <div class="story-meta">
                    <span class="story-title">${story.title}</span>
                    <small class="story-subtitle">${story.speaker} | ${story.day}</small>
                </div>
            </div>
        `;
    }).join('');
}

window.updatePreviewByObject = function(storyStr) {
    const story = JSON.parse(storyStr.replace(/&quot;/g, '"').replace(/&apos;/g, "'"));
    updatePreview(story);
};

// MASTER FUNCTION: Updates the stage content
window.updatePreview = function(story) {
    currentStory = story;
    const playerWrap = document.getElementById('videoPlayerWrap');
    const stageImg = document.getElementById('stageImage');
    const titleEl = document.getElementById('stageTitle');
    const descEl = document.getElementById('stageDesc');
    const btn = document.getElementById('mainActionButton');

    // 1. Reset View: Show Image, Hide Video Player
    if (playerWrap) playerWrap.style.display = 'none';
    if (stageImg) stageImg.style.display = 'block';
    
    // 2. Stop any video currently playing
    if (typeof videojs !== 'undefined') {
        try {
            const myPlayer = videojs.getPlayer('myBrightcovePlayer');
            if (myPlayer) myPlayer.pause();
        } catch(e) {}
    }

    // 3. Update Text Content
    titleEl.innerText = story.title;
    descEl.innerText = story.description;
    stageImg.src = story.thumbnail;

    // 4. Update Main Button
    btn.innerHTML = (story.type === 'video') ? '▶ PLAY VIDEO' : '📖 READ ARTICLE';

    // 5. Run UI Checks (View More & Title Sizing)
    adjustTitleSize();
    

    // 6. Mobile scroll-to-top of video
    if (window.innerWidth <= 1024) {
        const videoSection = document.getElementById('video');
        if (videoSection) videoSection.scrollIntoView({ behavior: 'smooth' });
    }
};

// FULLSCREEN VIDEO & ARTICLE LAUNCH
window.launchContent = function() {
    if (!currentStory) return;
    
    if (currentStory.type === 'video') {
        document.getElementById('stageImage').style.display = 'none';
        document.getElementById('videoPlayerWrap').style.display = 'block';
        
        if (typeof videojs !== 'undefined') {
            const myPlayer = videojs.getPlayer('myBrightcovePlayer');
            myPlayer.ready(function() {
                myPlayer.catalog.getVideo(currentStory.id, function(error, video) {
                    if (!error) {
                        myPlayer.catalog.load(video);
                        myPlayer.play();
                        // Corrected Variable Reference for Fullscreen
                        if (myPlayer.requestFullscreen) {
                            myPlayer.requestFullscreen();
                        } else if (myPlayer.webkitRequestFullscreen) {
                            myPlayer.webkitRequestFullscreen();
                        }
                    }
                });
            });
        }
    } else {
        if (currentStory.link) window.open(currentStory.link, '_blank');
    }
};




window.adjustTitleSize = function() {
    const titleElement = document.getElementById('stageTitle');
    if (!titleElement) return;
    const isMobile = window.innerWidth <= 768;
    const len = titleElement.innerText.length;

    titleElement.style.fontSize = isMobile ? "1.1rem" : "1.4rem";
    if (len > 70) titleElement.style.fontSize = isMobile ? "0.9rem" : "1.1rem";
    else if (len > 45) titleElement.style.fontSize = isMobile ? "1rem" : "1.25rem";
};

// Start the process
loadStories();

window.resetAllFilters = function() {
    document.getElementById('filterType').value = 'all';
    document.getElementById('filterDay').value = 'all';
    
    if(typeof handleCategoryChange === "function") handleCategoryChange();
    
    document.getElementById('filterSpeaker').value = 'all';
    
    // This will hide the button again because all are back to 'all'
    applyFilters(); 
};

// GALLERY

const galleryBase = "assets/gallery/";

// Example: Day 1 has 40 images
const galleryData = {
    "reg": { folder: "day0", count: 25 },
    "day1": { folder: "day1", count: 40 },
    "day2": { folder: "day2", count: 50 },
    "day3": { folder: "day3", count: 45 },
    "day4": { folder: "day4", count: 35 },
    "day5": { folder: "day5", count: 30 },
    "fashion": { folder: "fashionshow", count: 20 }
};

window.switchGallery = function(cat, element) {
    const stage = document.getElementById('galleryStage');
    const category = galleryData[cat];
    if (!category) return;

    // 1. Update Buttons
    document.querySelectorAll('.g-btn').forEach(btn => btn.classList.remove('active'));
    
    // If we have a clicked element, highlight it. 
    // If not (on load), find the button that matches the 'cat'
    if (element) {
        element.classList.add('active');
    } else {
        const defaultBtn = Array.from(document.querySelectorAll('.g-btn'))
                                .find(btn => btn.innerText.toLowerCase().includes(cat) || btn.getAttribute('onclick').includes(cat));
        if (defaultBtn) defaultBtn.classList.add('active');
    }

    let html = '';
    for (let i = 1; i <= category.count; i++) {
        const fullPath = `${galleryBase}${category.folder}/${i}.webp`;
        html += `
            <div class="m-item">
                <img src="${fullPath}" loading="lazy" alt="Gallery Image">
            </div>`;
    }
    
    stage.innerHTML = html;
    stage.scrollLeft = 0; // Reset scroll position to start
};

window.scrollGallery = function(direction) {
    const container = document.getElementById('galleryStage');
    // Scroll by the width of the container (one full "page" of photos)
    const scrollAmount = container.offsetWidth * 0.8; 
    
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
};

loadStories(); // Assuming this is your main data loader

// Add this to ensure the gallery isn't empty
document.addEventListener('DOMContentLoaded', () => {
    // We pass 'reg' as the category and null for the element 
    // because no button was physically clicked yet.
    if (typeof switchGallery === "function") {
        switchGallery('reg'); 
    }
});

//video modal logic

function openVideoModal(brightcoveUrl) {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    // Brightcove specific autoplay parameter
    const separator = brightcoveUrl.includes('?') ? '&' : '?';
    const finalUrl = `${brightcoveUrl}${separator}autoplay=true`;
    
    player.src = finalUrl;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    modal.style.display = 'none';
    player.src = ""; // This is critical for Brightcove to stop the stream
    document.body.style.overflow = 'auto';
}

// FAQ SECTION

// This data can be moved to your master JSON file
const vFaqData = {
    "en": {
        "title": "Frequently Asked Questions",
        "questions": [
            {
                "q": "V-MALAYSIA 2025 Tickets",
                "a": "1. Go to <a href='https://vshoppe.vtube.net/'>VShoppe</a><br>2. Enter your email and code: <strong>VMYJUN2025</strong><br>3. Fill out your info and click <strong>Proceed to Payment</strong>."
            },
            {
                "q": "Ticket Terms and Conditions",
                "a": "Tickets are strictly non-refundable and non-transferrable except under specific Promoter discretion. Lost tickets will not be replaced."
            },
            {
                "q": "What pre-departure requirements should we prepare?",
                "a": "Ensure you have travel insurance, your <strong>Yellow Fever Certificate</strong> (if applicable), and your flight details submitted to the registration team."
            }
        ]
    }
};

function renderVFAQs(lang) {
    const wrapper = document.getElementById('faq-list-wrapper');
    const title = document.getElementById('faq-main-title');
    const langData = vFaqData[lang];

    title.innerText = langData.title;

    wrapper.innerHTML = langData.questions.map(item => `
        <div class="v-faq-item">
            <button class="v-faq-question" onclick="toggleVFAQ(this)">
                <span>${item.q}</span>
                <span class="v-faq-icon">+</span>
            </button>
            <div class="v-faq-answer-wrapper">
                <div class="v-faq-answer-content">${item.a}</div>
            </div>
        </div>
    `).join('');
}

function toggleVFAQ(btn) {
    const item = btn.parentElement;
    const wrapper = btn.nextElementSibling;
    const isActive = item.classList.contains('active');

    // Close all other items for a clean accordion feel
    document.querySelectorAll('.v-faq-item').forEach(el => {
        el.classList.remove('active');
        el.querySelector('.v-faq-answer-wrapper').style.maxHeight = null;
    });

    // Toggle the clicked item
    if (!isActive) {
        item.classList.add('active');
        // scrollHeight provides the exact height of the hidden content
        wrapper.style.maxHeight = wrapper.scrollHeight + "px";
    }
}

// Initial Render
renderVFAQs('en');