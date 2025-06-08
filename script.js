let introProjection, introPath, introSvg, introGraticule;
let mainProjection, mainPath, mainSvg, mainGraticule;
let world, earthquakes;
let autoRotate = true;
let rotationSpeed = 0.15;
let currentMode = 'magnitude';

// Scatter chart global variables
let scatterChart = null;
let scatterChartUnlocked; // Second chart for exploration section
let earthquakeData = [];
let filteredData = [];

// Brush selection state
// Initialize selectedEarthquakes globally
window.selectedEarthquakes = window.selectedEarthquakes || [];
let selectedEarthquakes = window.selectedEarthquakes;
let selectedEarthquakesUnlocked = []; // Selection for unlocked chart

// Major historical earthquakes for intro globe
const majorEarthquakes = [
    { name: "San Diego, USA", magnitude: 5.2, deaths: 0, lat: 32.7157, lon: -117.1611, date: "2025-04-14", highlight: true, recent: true },
    { name: "Turkey-Syria", magnitude: 7.8, deaths: 50000, lat: 37.1662, lon: 37.0897, date: "2023-02-06", major: true },
    { name: "Haiti", magnitude: 7.0, deaths: 316000, lat: 18.5392, lon: -72.335, date: "2010-01-12", devastating: true },
    { name: "Japan Tohoku", magnitude: 9.1, deaths: 19759, lat: 38.2975, lon: 142.373, date: "2011-03-11", major: true },
    { name: "Chile", magnitude: 8.8, deaths: 525, lat: -35.9090, lon: -72.7330, date: "2010-02-27", major: true }
];

// Sample earthquake data for intro
const sampleEarthquakes = [
    { name: "San Diego, USA", magnitude: 5.2, deaths: 0, lat: 32.7157, lon: -117.1611, date: "2025-04-14", highlight: true },
    { name: "Turkey-Syria", magnitude: 7.8, deaths: 50000, lat: 37.1662, lon: 37.0897, date: "2023-02-06" },
    { name: "Haiti", magnitude: 7.0, deaths: 316000, lat: 18.5392, lon: -72.335, date: "2010-01-12" },
    { name: "Japan Tohoku", magnitude: 9.1, deaths: 19759, lat: 38.2975, lon: 142.373, date: "2011-03-11" },
    { name: "Iran", magnitude: 6.6, deaths: 26271, lat: 29.0183, lon: 57.4119, date: "2003-12-26" },
    { name: "Italy L'Aquila", magnitude: 6.3, deaths: 309, lat: 42.3498, lon: 13.3995, date: "2009-04-06" },
    { name: "Nepal", magnitude: 7.8, deaths: 8964, lat: 28.2380, lon: 84.7314, date: "2015-04-25" },
    { name: "Chile", magnitude: 8.8, deaths: 525, lat: -35.9090, lon: -72.7330, date: "2010-02-27" }
];

async function init() {
    // Load world data
    world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
    
    initIntroGlobe();
    initMainGlobe();
    setupScrollAnimation();
    
    // Setup navigation menu
    setupNavigation();
    
    // Load earthquake data for exploration section
    await loadEarthquakeData();
}

function initIntroGlobe() {
    const width = 800, height = 800;
    introSvg = d3.select("#intro-globe-svg")
        .attr("width", width)
        .attr("height", height);

    introProjection = d3.geoOrthographic()
        .scale(350)
        .translate([width / 2, height / 2])
        .clipAngle(90);

    introPath = d3.geoPath().projection(introProjection);
    
    introGraticule = d3.geoGraticule();

    renderIntroGlobe();
    animateIntroGlobe();
}

function initMainGlobe() {
    const container = d3.select("#globe");
    
    // Center on San Diego coordinates
    const sanDiegoLon = -117.1611;
    const sanDiegoLat = 32.7157;
    
    mainProjection = d3.geoOrthographic()
        .scale(350)
        .translate([400, 400])
        .rotate([-sanDiegoLon, -sanDiegoLat])
        .clipAngle(90);

    mainPath = d3.geoPath().projection(mainProjection);
    mainGraticule = d3.geoGraticule();
    
    mainSvg = container;

    renderMainGlobe();
    setupGlobeInteraction();
    animateMainGlobe();
}

function renderIntroGlobe() {
    if (!world) return;

    // Add gradient definitions
    const defs = introSvg.append("defs");
    
    const gradient = defs.append("radialGradient")
        .attr("id", "sphereGradient")
        .attr("cx", "30%")
        .attr("cy", "30%");
    
    gradient.append("stop")
        .attr("offset", "0%")
        .attr("style", "stop-color:#1a1a1a;stop-opacity:1");
    
    gradient.append("stop")
        .attr("offset", "100%")
        .attr("style", "stop-color:#0a0a0a;stop-opacity:1");

    // Sphere background
    introSvg.append("circle")
        .attr("cx", 400)
        .attr("cy", 400)
        .attr("r", 350)
        .attr("fill", "url(#sphereGradient)")
        .attr("stroke", "#333333")
        .attr("stroke-width", 1)
        .attr("opacity", 1);

    // Graticule
    introSvg.append("path")
        .datum(introGraticule())
        .attr("class", "graticule")
        .attr("d", introPath)
        .attr("fill", "none")
        .attr("stroke", "#222222")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.2);

    // Countries
    introSvg.selectAll(".country")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", introPath)
        .attr("fill", "#1a1a1a")
        .attr("stroke", "#2a2a2a")
        .attr("stroke-width", 0.5)
        .attr("opacity", 1);

    // Add major earthquakes to intro globe
    majorEarthquakes.forEach((earthquake, index) => {
        const coords = introProjection([earthquake.lon, earthquake.lat]);
        if (coords && isPointVisible(earthquake, introProjection)) {
            
            // Different styling based on earthquake type
            let color, size, strokeColor, strokeWidth;
            
            if (earthquake.highlight) {
                // San Diego - special highlighting
                color = "#ff5757";
                size = 6;
                strokeColor = "#ff7a7a";
                strokeWidth = 3;
                
                // Add ripple effect for San Diego
                introSvg.append("circle")
                    .attr("class", "san-diego-ripple intro-earthquake")
                    .attr("cx", coords[0])
                    .attr("cy", coords[1])
                    .attr("r", 6)
                    .attr("fill", "none")
                    .attr("stroke", "#ff5757")
                    .attr("stroke-width", 2)
                    .attr("opacity", 0.8);
                    
                introSvg.append("circle")
                    .attr("class", "san-diego-highlight intro-earthquake")
                    .attr("cx", coords[0])
                    .attr("cy", coords[1])
                    .attr("r", size)
                    .attr("fill", color)
                    .attr("stroke", strokeColor)
                    .attr("stroke-width", strokeWidth)
                    .attr("opacity", 0.9);
                    
            } else if (earthquake.devastating) {
                // High death toll - bright red
                color = "#ff3333";
                size = Math.max(4, earthquake.magnitude * 0.8);
                strokeColor = "#ff6666";
                strokeWidth = 2;
                
                introSvg.append("circle")
                    .attr("class", "intro-earthquake")
                    .attr("cx", coords[0])
                    .attr("cy", coords[1])
                    .attr("r", size)
                    .attr("fill", color)
                    .attr("stroke", strokeColor)
                    .attr("stroke-width", strokeWidth)
                    .attr("opacity", 0.8);
                    
            } else if (earthquake.major) {
                // High magnitude - orange/yellow
                color = "#f59e0b";
                size = Math.max(3, earthquake.magnitude * 0.7);
                strokeColor = "#fde047";
                strokeWidth = 1.5;
                
                introSvg.append("circle")
                    .attr("class", "intro-earthquake")
                    .attr("cx", coords[0])
                    .attr("cy", coords[1])
                    .attr("r", size)
                    .attr("fill", color)
                    .attr("stroke", strokeColor)
                    .attr("stroke-width", strokeWidth)
                    .attr("opacity", 0.7);
            }
        }
    });
}

function renderMainGlobe() {
    if (!world) return;

    // Clear existing content
    mainSvg.selectAll("*").remove();

    // Add gradient definitions
    const defs = mainSvg.append("defs");
    
    const gradient = defs.append("radialGradient")
        .attr("id", "sphereGradientMain")
        .attr("cx", "30%")
        .attr("cy", "30%");
    
    gradient.append("stop")
        .attr("offset", "0%")
        .attr("style", "stop-color:#1a1a1a;stop-opacity:1");
    
    gradient.append("stop")
        .attr("offset", "100%")
        .attr("style", "stop-color:#0a0a0a;stop-opacity:1");

    // Sphere background - fully opaque
    mainSvg.append("circle")
        .attr("cx", 400)
        .attr("cy", 400)
        .attr("r", 350)
        .attr("fill", "url(#sphereGradientMain)")
        .attr("stroke", "#333333")
        .attr("stroke-width", 1)
        .attr("opacity", 1);

    // Graticule
    mainSvg.append("path")
        .datum(mainGraticule())
        .attr("class", "graticule")
        .attr("d", mainPath)
        .attr("fill", "none")
        .attr("stroke", "#222222")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.2);

    // Countries
    mainSvg.selectAll(".country")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", mainPath)
        .attr("fill", "#1a1a1a")
        .attr("stroke", "#2a2a2a")
        .attr("stroke-width", 0.5)
        .attr("opacity", 1);

    // Filter earthquakes to only show visible ones
    const visibleEarthquakes = sampleEarthquakes.filter(d => isPointVisible(d, mainProjection));

    // Earthquake points - only visible ones
    mainSvg.selectAll(".earthquake")
        .data(visibleEarthquakes)
        .enter().append("circle")
        .attr("class", d => `earthquake-point ${d.highlight ? 'san-diego-highlight' : ''}`)
        .attr("cx", d => {
            const coords = mainProjection([d.lon, d.lat]);
            return coords ? coords[0] : 0;
        })
        .attr("cy", d => {
            const coords = mainProjection([d.lon, d.lat]);
            return coords ? coords[1] : 0;
        })
        .attr("r", d => {
            if (d.highlight) return 6; // Larger San Diego point
            if (currentMode === 'magnitude') {
                return Math.max(2, d.magnitude);
            } else {
                return Math.max(2, Math.log(d.deaths + 1) * 2);
            }
        })
        .attr("fill", d => {
            if (d.highlight) return "#ff5757";
            if (currentMode === 'magnitude') {
                const intensity = (d.magnitude - 5) / 4;
                return d3.interpolateOrRd(Math.max(0.3, intensity));
            } else {
                const intensity = Math.log(d.deaths + 1) / 15;
                return d3.interpolateOrRd(Math.min(1, intensity + 0.3));
            }
        })
        .attr("stroke", d => d.highlight ? "#ff7a7a" : "#ffffff")
        .attr("stroke-width", d => d.highlight ? 3 : 1)
        .attr("opacity", d => d.highlight ? 0.9 : 0.8)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            // Highlight the point
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", d.highlight ? 8 : Math.max(4, parseFloat(d3.select(this).attr("r")) + 2))
                .attr("stroke-width", 2);
            
            // Show tooltip
            showTooltip(event, d);
        })
        .on("mouseout", function(event, d) {
            // Reset the point
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", d => {
                    if (d.highlight) return 6;
                    if (currentMode === 'magnitude') {
                        return Math.max(2, d.magnitude);
                    } else {
                        return Math.max(2, Math.log(d.deaths + 1) * 2);
                    }
                })
                .attr("stroke-width", d => d.highlight ? 3 : 1);
            
            // Hide tooltip
            hideTooltip();
        })
        .on("click", function(event, d) {
            // Center globe on clicked earthquake
            const coords = mainProjection([d.lon, d.lat]);
            if (coords) {
                mainProjection.rotate([-d.lon, -d.lat]);
                renderMainGlobe();
            }
        });

    // Add ripple effect for San Diego in main globe - only if visible
    const sanDiego = sampleEarthquakes.find(d => d.highlight);
    if (sanDiego && isPointVisible(sanDiego, mainProjection)) {
        const coords = mainProjection([sanDiego.lon, sanDiego.lat]);
        if (coords) {
            mainSvg.append("circle")
                .attr("class", "san-diego-ripple")
                .attr("cx", coords[0])
                .attr("cy", coords[1])
                .attr("r", 6)
                .attr("fill", "none")
                .attr("stroke", "#ff5757")
                .attr("stroke-width", 2)
                .attr("opacity", 0.8);
        }
    }
}

function isPointVisible(earthquake, projection) {
    const coords = projection([earthquake.lon, earthquake.lat]);
    if (!coords) return false;
    
    // Check if the point is within the visible hemisphere
    const distance = d3.geoDistance([earthquake.lon, earthquake.lat], projection.invert([400, 400]));
    return distance < Math.PI / 2;
}

function setupGlobeInteraction() {
    let rotation = [0, 0];

    const drag = d3.drag()
        .on("start", function() {
            autoRotate = false;
        })
        .on("drag", function(event) {
            const rotate = mainProjection.rotate();
            const k = 10; // Reduced from 25 to make dragging even more sensitive
            mainProjection.rotate([
                rotate[0] + event.dx / k,
                rotate[1] - event.dy / k
            ]);
            renderMainGlobe();
        });

    mainSvg.call(drag);
}

function animateIntroGlobe() {
    if (!autoRotate) return;
    
    const rotate = introProjection.rotate();
    introProjection.rotate([rotate[0] + rotationSpeed, rotate[1]]);
    
    // Update paths
    introSvg.selectAll(".country").attr("d", introPath);
    introSvg.selectAll(".graticule").attr("d", introPath);
    
    // Remove existing earthquake points
    introSvg.selectAll(".intro-earthquake").remove();
    
    // Re-render earthquake points based on current rotation
    majorEarthquakes.forEach((earthquake, index) => {
        const coords = introProjection([earthquake.lon, earthquake.lat]);
        if (coords && isPointVisible(earthquake, introProjection)) {
            
            // Different styling based on earthquake type
            let color, size, strokeColor, strokeWidth;
            
            if (earthquake.highlight) {
                // San Diego - special highlighting
                color = "#ff5757";
                size = 6;
                strokeColor = "#ff7a7a";
                strokeWidth = 3;
                
                // Add ripple effect for San Diego
                introSvg.append("circle")
                    .attr("class", "san-diego-ripple intro-earthquake")
                    .attr("cx", coords[0])
                    .attr("cy", coords[1])
                    .attr("r", 6)
                    .attr("fill", "none")
                    .attr("stroke", "#ff5757")
                    .attr("stroke-width", 2)
                    .attr("opacity", 0.8);
                    
                introSvg.append("circle")
                    .attr("class", "san-diego-highlight intro-earthquake")
                    .attr("cx", coords[0])
                    .attr("cy", coords[1])
                    .attr("r", size)
                    .attr("fill", color)
                    .attr("stroke", strokeColor)
                    .attr("stroke-width", strokeWidth)
                    .attr("opacity", 0.9);
                    
            } else if (earthquake.devastating) {
                // High death toll - bright red
                color = "#ff3333";
                size = Math.max(4, earthquake.magnitude * 0.8);
                strokeColor = "#ff6666";
                strokeWidth = 2;
                
                introSvg.append("circle")
                    .attr("class", "intro-earthquake")
                    .attr("cx", coords[0])
                    .attr("cy", coords[1])
                    .attr("r", size)
                    .attr("fill", color)
                    .attr("stroke", strokeColor)
                    .attr("stroke-width", strokeWidth)
                    .attr("opacity", 0.8);
                    
            } else if (earthquake.major) {
                // High magnitude - orange/yellow
                color = "#f59e0b";
                size = Math.max(3, earthquake.magnitude * 0.7);
                strokeColor = "#fde047";
                strokeWidth = 1.5;
                
                introSvg.append("circle")
                    .attr("class", "intro-earthquake")
                    .attr("cx", coords[0])
                    .attr("cy", coords[1])
                    .attr("r", size)
                    .attr("fill", color)
                    .attr("stroke", strokeColor)
                    .attr("stroke-width", strokeWidth)
                    .attr("opacity", 0.7);
            }
        }
    });
    
    requestAnimationFrame(animateIntroGlobe);
}

function animateMainGlobe() {
    if (!autoRotate) return;
    
    const rotate = mainProjection.rotate();
    mainProjection.rotate([rotate[0] + rotationSpeed, rotate[1]]);
    renderMainGlobe();
    
    requestAnimationFrame(animateMainGlobe);
}

function setupScrollAnimation() {
    let ticking = false;
    let scrollTimeout;
    let isSnapping = false;
    
    // Define the 3 main sections
    const SECTION_HEIGHTS = {
        INTRO: 0,
        MAIN: window.innerHeight,
        STORY: window.innerHeight * 2
    };
    
    console.log('🚀 Scroll Animation Setup:', SECTION_HEIGHTS);
    
    function updateScroll(forceUpdate = false) {
        if (isSnapping && !forceUpdate) {
            console.log('⏸️ Scroll blocked - currently snapping');
            return;
        }
        
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        
        console.log(`📍 Scroll Update: ${scrollY}px (${(scrollY/windowHeight).toFixed(2)}vh)${forceUpdate ? ' [FORCED]' : ''}`);
        
        // Get elements
        const globeContainer = document.getElementById('main-globe-container');
        const contentLeft = document.querySelector('.content-left');
        const dataPoints = document.querySelector('.data-points');
        const controls = document.querySelector('.controls');
        const introSection = document.querySelector('.intro-section');
        const mainSection = document.querySelector('.main-section');
        const storySection = document.querySelector('.story-section');
        const butSection = document.querySelector('.but-section');
        const slideIndicator = document.querySelector('.slide-indicator');
        const header = document.querySelector('.header');
        
        // DEBUG: Check if story section exists
        console.log('🔍 DEBUG: Elements found:', {
            introSection: !!introSection,
            mainSection: !!mainSection,
            storySection: !!storySection,
            slideIndicator: !!slideIndicator
        });
        if (!storySection) {
            console.log('❌ Story section not found! Available sections:', document.querySelectorAll('section'));
        }
        
        // Define section boundaries with buffer zones
        const mainSectionStart = windowHeight * 0.5;  // Start main transition at 50vh
        const storySectionStart = windowHeight * 1.5; // Start story transition at 150vh
        
        // Story slide boundaries (each slide gets 40vh for less sensitivity)
        const slide0Start = windowHeight * 1.5; // 150vh
        const slide1Start = windowHeight * 1.9; // 190vh  
        const slide2Start = windowHeight * 2.3; // 230vh
        const slide3Start = windowHeight * 2.7; // 270vh
        const slide4Start = windowHeight * 3.1; // 310vh
        
        const butSectionStart = windowHeight * 3.4; // Start but transition at 340vh (only if story completed)
        const butSectionVisible = windowHeight * 3.6; // Full but section at 360vh
        const explorationSectionVisible = windowHeight * 4.0; // Exploration section at 400vh
        
        // Header visibility
        if (scrollY > windowHeight * 0.3) {
            header?.classList.add('visible');
        } else {
            header?.classList.remove('visible');
        }
        
        if (scrollY >= explorationSectionVisible && storyCompleted) {
            // EXPLORATION SECTION - show unlocked data analysis
            console.log('🔓 Activating EXPLORATION section');
            const explorationSection = document.querySelector('.exploration-section');
            
            // Hide all other sections
            if (introSection) {
                introSection.style.opacity = '0';
                introSection.style.pointerEvents = 'none';
                introSection.classList.add('hidden');
            }
            if (mainSection) {
                mainSection.style.opacity = '0';
                mainSection.classList.remove('visible');
            }
            if (storySection) {
                storySection.style.opacity = '0';
                storySection.style.pointerEvents = 'none';
                storySection.classList.remove('visible');
                storySection.classList.remove('expanding');
            }
            if (butSection) {
                butSection.style.opacity = '0';
                butSection.style.pointerEvents = 'none';
                butSection.classList.remove('visible');
            }
            if (explorationSection) {
                explorationSection.style.opacity = '1';
                explorationSection.style.pointerEvents = 'auto';
                explorationSection.classList.add('visible');
                
                // Initialize exploration section if not already done
                if (!explorationSection.hasAttribute('data-initialized')) {
                    console.log('🔓 Initializing exploration section...');
                    explorationSection.setAttribute('data-initialized', 'true');
                    
                    // Initialize unlocked visualization
                    if (earthquakeData.length > 0) {
                        initializeExplorationSection();
                    }
                }
            }
            
            // Hide all other elements
            if (globeContainer) {
                globeContainer.style.opacity = '0';
                globeContainer.style.pointerEvents = 'none';
                globeContainer.classList.remove('positioned');
            }
            if (contentLeft) {
                contentLeft.style.opacity = '0';
                contentLeft.classList.remove('visible');
            }
            if (dataPoints) {
                dataPoints.style.opacity = '0';
                dataPoints.classList.remove('visible');
            }
            if (controls) {
                controls.style.opacity = '0';
                controls.classList.remove('visible');
            }
            if (slideIndicator) {
                slideIndicator.classList.remove('visible');
            }
            
            // Update navigation active state
            updateNavigationActive('exploration');
            
            autoRotate = false;
            
        } else if (scrollY >= butSectionVisible && storyCompleted) {
            // BUT SECTION - show complexity analysis (only if story is completed)
            console.log('🤔 Activating BUT section');
            const explorationSection = document.querySelector('.exploration-section');
            
            if (introSection) {
                introSection.style.opacity = '0';
                introSection.style.pointerEvents = 'none';
                introSection.classList.add('hidden');
            }
            if (mainSection) {
                mainSection.style.opacity = '0';
                mainSection.classList.remove('visible');
            }
            if (storySection) {
                storySection.style.opacity = '0';
                storySection.style.pointerEvents = 'none';
                storySection.classList.remove('visible');
                storySection.classList.remove('expanding');
            }
            if (butSection) {
                butSection.style.opacity = '1';
                butSection.style.pointerEvents = 'auto';
                butSection.classList.add('visible');
                
                // Initialize but section data controls if not already done
                if (!butSection.hasAttribute('data-initialized')) {
                    console.log('📊 Initializing but section data controls...');
                    butSection.setAttribute('data-initialized', 'true');
                    
                    // Load earthquake data and initialize charts
                    if (earthquakeData.length > 0) {
                        setTimeout(() => {
                            console.log('📊 But section data loaded and charts initialized');
                        }, 100);
                    }
                }
            }
            if (explorationSection) {
                explorationSection.style.opacity = '0';
                explorationSection.style.pointerEvents = 'none';
                explorationSection.classList.remove('visible');
            }
            
            // Hide all other elements
            if (globeContainer) {
                globeContainer.style.opacity = '0';
                globeContainer.style.pointerEvents = 'none';
                globeContainer.classList.remove('positioned');
            }
            if (contentLeft) {
                contentLeft.style.opacity = '0';
                contentLeft.classList.remove('visible');
            }
            if (dataPoints) {
                dataPoints.style.opacity = '0';
                dataPoints.classList.remove('visible');
            }
            if (controls) {
                controls.style.opacity = '0';
                controls.classList.remove('visible');
            }
            if (slideIndicator) {
                slideIndicator.classList.remove('visible');
            }
            
            // Update navigation active state
            updateNavigationActive('but');
            
            autoRotate = false;
            
        } else if (scrollY >= butSectionStart && storyCompleted) {
            // Creative TV power-off flicker then transition to but section
            if (!window.transitionTriggered) {
                window.transitionTriggered = true;
                const tv = document.querySelector('.slideshow-container');
                const story = document.querySelector('.story-section');
                const but = document.querySelector('.but-section');
                // Start power-off flicker
                tv.classList.add('power-off');
                // After flicker completes, hide story and show but section
                setTimeout(() => {
                    // Hide story section (opacity and pointer-events)
                    story.style.setProperty('opacity', '0', 'important');
                    story.style.setProperty('pointer-events', 'none', 'important');
                    story.classList.remove('visible');
                    // Show but section
                    but.classList.add('visible');
                    // Ensure scroll positions to but start
                    window.scrollTo({ top: butSectionVisible, behavior: 'auto' });
                }, 800);
            }
            // Prevent further handling
            autoRotate = false;
        } else if (scrollY >= storySectionStart) {
            // STORY SECTION - show slideshow
            console.log('🎬 Activating STORY section');
            updateNavigationActive('story');
            if (introSection) {
                introSection.style.opacity = '0';
                introSection.style.pointerEvents = 'none';
                introSection.classList.add('hidden');
            }
            if (mainSection) {
                mainSection.style.opacity = '0';
                mainSection.classList.remove('visible');
            }
            if (storySection) {
                console.log('🔧 Story section found:', storySection);
                storySection.style.setProperty('opacity', '1', 'important');
                storySection.style.setProperty('pointer-events', 'auto', 'important');
                storySection.classList.add('visible');
                storySection.classList.remove('expanding'); // Remove expansion during normal story viewing
            }
            if (butSection) {
                butSection.style.opacity = '0';
                butSection.style.pointerEvents = 'none';
                butSection.classList.remove('visible');
            }
            
            // Hide main section elements
            if (globeContainer) {
                globeContainer.style.opacity = '0';
                globeContainer.style.pointerEvents = 'none';
                globeContainer.classList.remove('positioned');
            }
            if (contentLeft) {
                contentLeft.style.opacity = '0';
                contentLeft.classList.remove('visible');
            }
            if (dataPoints) {
                dataPoints.style.opacity = '0';
                dataPoints.classList.remove('visible');
            }
            if (controls) {
                controls.style.opacity = '0';
                controls.classList.remove('visible');
            }
            
            // Show slide indicators
            if (slideIndicator) {
                slideIndicator.classList.add('visible');
            }
            
            // Handle slide progression based on scroll position within story section
            let targetSlide = 0;
            if (scrollY >= slide4Start) {
                targetSlide = 4;
            } else if (scrollY >= slide3Start) {
                targetSlide = 3;
            } else if (scrollY >= slide2Start) {
                targetSlide = 2;
            } else if (scrollY >= slide1Start) {
                targetSlide = 1;
            } else {
                targetSlide = 0;
            }
            
            // Update slide if it has changed
            if (currentEarthquakeSlide !== targetSlide) {
                currentEarthquakeSlide = targetSlide;
                updateEarthquakeSlidePosition();
                
                // Mark story as completed when reaching the last slide
                if (currentEarthquakeSlide === totalEarthquakeSlides - 1) {
                    storyCompleted = true;
                    console.log('📚 Story completed! User can now access "but" section');
                }
            }
            
            autoRotate = false;
            
        } else if (scrollY >= mainSectionStart) {
            // MAIN SECTION - show article content with positioned globe
            console.log('📄 Activating MAIN section');
            updateNavigationActive('main');
            if (introSection) {
                introSection.style.opacity = '0';
                introSection.style.pointerEvents = 'none';
                introSection.classList.add('hidden');
            }
            if (mainSection) {
                mainSection.style.opacity = '1';
                mainSection.classList.add('visible');
            }
            if (storySection) {
                // Clear inline opacity override and hide via CSS class
                storySection.style.removeProperty('opacity');
                storySection.style.removeProperty('pointer-events');
                storySection.classList.remove('visible');
            }
            
            // Show main section elements
            if (globeContainer) {
                globeContainer.classList.add('positioned');
                globeContainer.style.opacity = '1';
                globeContainer.style.pointerEvents = 'auto';
            }
            if (contentLeft) {
                contentLeft.classList.add('visible');
                contentLeft.style.opacity = '1';
            }
            if (dataPoints) {
                dataPoints.classList.add('visible');
                dataPoints.style.opacity = '1';
            }
            if (controls) {
                controls.classList.add('visible');
                controls.style.opacity = '1';
            }
            
            // Hide slide indicators
            if (slideIndicator) {
                slideIndicator.classList.remove('visible');
            }
            
            autoRotate = false;
            
        } else {
            // INTRO SECTION - show spinning globe only
            console.log('🌍 Activating INTRO section');
            updateNavigationActive('intro');
            if (introSection) {
                introSection.style.opacity = '1';
                introSection.style.pointerEvents = 'auto';
                introSection.classList.remove('hidden');
            }
            if (mainSection) {
                mainSection.style.opacity = '0';
                mainSection.classList.remove('visible');
            }
            if (storySection) {
                storySection.style.removeProperty('opacity');
                storySection.style.removeProperty('pointer-events');
                storySection.classList.remove('visible');
                storySection.classList.remove('expanding');
            }
            if (butSection) {
                butSection.style.opacity = '0';
                butSection.style.pointerEvents = 'none';
                butSection.classList.remove('visible');
            }
            
            // Hide main section elements during intro
            if (globeContainer) {
                globeContainer.style.opacity = '0';
                globeContainer.style.pointerEvents = 'none';
                globeContainer.classList.remove('positioned');
            }
            if (contentLeft) {
                contentLeft.style.opacity = '0';
                contentLeft.classList.remove('visible');
            }
            if (dataPoints) {
                dataPoints.style.opacity = '0';
                dataPoints.classList.remove('visible');
            }
            if (controls) {
                controls.style.opacity = '0';
                controls.classList.remove('visible');
            }
            
            // Hide slide indicators
            if (slideIndicator) {
                slideIndicator.classList.remove('visible');
            }
            
            autoRotate = true;
        }
        
        ticking = false;
    }
    
    function snapToSection() {
        if (isSnapping) {
            console.log('⏸️ Snap blocked - already snapping');
            return;
        }
        
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        
        console.log(`🎯 Snap Check: ${scrollY}px (${(scrollY/windowHeight).toFixed(2)}vh)`);
        
        // Define section positions including all story slides
        const sections = [
            SECTION_HEIGHTS.INTRO,    // 0vh
            SECTION_HEIGHTS.MAIN,     // 100vh  
            windowHeight * 1.5,       // 150vh - Slide 0
            windowHeight * 1.9,       // 190vh - Slide 1
            windowHeight * 2.3,       // 230vh - Slide 2
            windowHeight * 2.7,       // 270vh - Slide 3
            windowHeight * 3.1,       // 310vh - Slide 4
        ];
        
        // Only add but section if story is completed
        if (storyCompleted) {
            sections.push(windowHeight * 3.6); // 360vh - BUT section
            sections.push(windowHeight * 4.0); // 400vh - EXPLORATION section
        }
        
        // Find which section we're closest to
        let closestSection = sections[0];
        let minDistance = Math.abs(scrollY - sections[0]);
        let closestIndex = 0;
        
        for (let i = 1; i < sections.length; i++) {
            const distance = Math.abs(scrollY - sections[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closestSection = sections[i];
                closestIndex = i;
            }
        }
        
        console.log(`🎯 Closest section: ${closestIndex} (${closestSection}px), distance: ${minDistance}px`);
        
        // Determine snap threshold based on section
        let snapThreshold = windowHeight * 0.25; // 25vh threshold for most sections
        
        // Special handling for transitions between sections
        if (scrollY > windowHeight * 0.3 && scrollY < windowHeight * 1.2) {
            // Between intro and main - use larger threshold to reduce stickiness
            snapThreshold = windowHeight * 0.35;
            console.log('📍 In intro-main transition zone, threshold:', snapThreshold);
        } else if (scrollY > windowHeight * 1.2 && scrollY < windowHeight * 3.5) {
            // Within story slides - use smaller threshold for precise navigation
            snapThreshold = windowHeight * 0.15;
            console.log('📍 In story slides zone, threshold:', snapThreshold);
        } else if (scrollY > windowHeight * 3.2 && scrollY < windowHeight * 4.0) {
            // Between story and but - use smaller threshold for TV expansion transition
            snapThreshold = windowHeight * 0.15;
            console.log('📍 In story-but transition zone, threshold:', snapThreshold);
        }
        
        console.log(`🎯 Snap threshold: ${snapThreshold}px, distance: ${minDistance}px`);
        
        // Only snap if we're far enough from the target section
        if (minDistance > snapThreshold) {
            console.log(`🚀 SNAPPING to section ${closestIndex} (${closestSection}px)`);
            isSnapping = true;
            
            window.scrollTo({
                top: closestSection,
                behavior: 'smooth'
            });
            
            // Reset snapping flag after animation completes
            setTimeout(() => {
                console.log('✅ Snap completed');
                isSnapping = false;
                updateScroll(true); // Force update after snap
            }, 800);
        } else {
            console.log('✋ No snap needed - within threshold');
        }
    }
    
    function requestTick() {
        if (!ticking && !isSnapping) {
            requestAnimationFrame(updateScroll);
            ticking = true;
        }
        
        // Clear existing timeout
        clearTimeout(scrollTimeout);
        
        // Set snap timeout with shorter delay for more responsive feel
        scrollTimeout = setTimeout(snapToSection, 100);
    }
    
    // Handle wheel events for better control
    function handleWheelEvent(event) {
        if (isSnapping) {
            console.log('🛑 Wheel blocked - currently snapping');
            event.preventDefault();
            return;
        }
        
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const delta = event.deltaY;
        
        console.log(`🖱️ Wheel event: delta=${delta}, scroll=${scrollY}px (${(scrollY/windowHeight).toFixed(2)}vh)`);
        
        const isScrollingDown = delta > 0;
        const isScrollingUp = delta < 0;
        
        // Handle section transitions with wheel - smarter position-based logic
        const sections = [
            SECTION_HEIGHTS.INTRO,    // 0vh
            SECTION_HEIGHTS.MAIN,     // 100vh  
            windowHeight * 1.5,       // 150vh - Slide 0
            windowHeight * 1.9,       // 190vh - Slide 1
            windowHeight * 2.3,       // 230vh - Slide 2
            windowHeight * 2.7,       // 270vh - Slide 3
            windowHeight * 3.1,       // 310vh - Slide 4
        ];
        
        // Only add but section if story is completed
        if (storyCompleted) {
            sections.push(windowHeight * 3.6); // 360vh - BUT section
            sections.push(windowHeight * 4.0); // 400vh - EXPLORATION section
        }
        
        let targetSection = null;
        
        // Determine current section more precisely
        let currentSection = 0; // default to intro
        if (scrollY >= windowHeight * 1.5) {
            currentSection = 2; // story
        } else if (scrollY >= windowHeight * 0.5) {
            currentSection = 1; // main
        }
        
        console.log(`📍 Current section: ${currentSection} (0=intro, 1=main, 2=story)`);
        
        // More precise transition logic based on current section and scroll direction
        if (isScrollingDown) {
            if (currentSection === 0 && scrollY >= windowHeight * 0.6) {
                // From intro section, past 60vh → go to main
                targetSection = 1;
                console.log(`🎯 TRIGGERING wheel snap DOWN: INTRO → MAIN at ${(scrollY/windowHeight).toFixed(2)}vh`);
            } else if (currentSection === 1 && scrollY >= windowHeight * 1.3) {
                // From main section, past 130vh → go to story
                targetSection = 2;
                console.log(`🎯 TRIGGERING wheel snap DOWN: MAIN → STORY at ${(scrollY/windowHeight).toFixed(2)}vh`);
            }
        } else if (isScrollingUp) {
            if (currentSection === 2 && scrollY <= windowHeight * 1.7) {
                // From story section, below 170vh → go to main
                targetSection = 1;
                console.log(`🎯 TRIGGERING wheel snap UP: STORY → MAIN at ${(scrollY/windowHeight).toFixed(2)}vh`);
            } else if (currentSection === 1 && scrollY <= windowHeight * 0.7) {
                // From main section, below 70vh → go to intro
                targetSection = 0;
                console.log(`🎯 TRIGGERING wheel snap UP: MAIN → INTRO at ${(scrollY/windowHeight).toFixed(2)}vh`);
            }
        }
        
        // Perform snap if target section determined
        if (targetSection !== null) {
            console.log(`🎯 WHEEL SNAP to section ${targetSection} (${sections[targetSection]}px)`);
            event.preventDefault();
            isSnapping = true;
            
            window.scrollTo({
                top: sections[targetSection],
                behavior: 'smooth'
            });
            
            setTimeout(() => {
                console.log('✅ Wheel snap completed');
                isSnapping = false;
                updateScroll(true);
            }, 800);
        } else {
            console.log(`❌ No wheel snap triggered - currentSection=${currentSection}, scrollY=${(scrollY/windowHeight).toFixed(2)}vh, direction=${isScrollingDown ? 'DOWN' : 'UP'}`);
        }
    }
    
    // Event listeners
    console.log('🎧 Adding scroll event listeners');
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('wheel', handleWheelEvent, { passive: false });
    
    // Update section heights on resize
    window.addEventListener('resize', () => {
        SECTION_HEIGHTS.MAIN = window.innerHeight;
        SECTION_HEIGHTS.STORY = window.innerHeight * 2;
        console.log('📏 Resize - Updated section heights:', SECTION_HEIGHTS);
    });
    
    // Set initial state
    console.log('🎬 Setting initial page state');
    updateScroll(true);
}

// Control functions
function showMagnitude() {
    document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    currentMode = 'magnitude';
    renderMainGlobe();
}

function showCasualties() {
    document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    currentMode = 'casualties';
    renderMainGlobe();
}

function toggleAutoRotate() {
    autoRotate = !autoRotate;
    const btn = event.target;
    btn.textContent = autoRotate ? 'Auto Rotate' : 'Manual';
    btn.classList.toggle('active');
    
    if (autoRotate) {
        animateIntroGlobe();
        animateMainGlobe();
    }
}

function showTooltip(event, data) {
    const tooltip = document.getElementById('earthquake-tooltip');
    const tooltipTitle = document.getElementById('tooltip-title');
    const tooltipMagnitude = document.getElementById('tooltip-magnitude');
    const tooltipDeaths = document.getElementById('tooltip-deaths');
    const tooltipDate = document.getElementById('tooltip-date');
    
    tooltipTitle.textContent = data.name;
    tooltipMagnitude.textContent = data.magnitude;
    tooltipDeaths.textContent = data.deaths.toLocaleString();
    tooltipDate.textContent = data.date;
    
    tooltip.style.left = (event.pageX + 15) + 'px';
    tooltip.style.top = (event.pageY - 15) + 'px';
    tooltip.classList.add('visible');
}

function hideTooltip() {
    const tooltip = document.getElementById('earthquake-tooltip');
    tooltip.classList.remove('visible');
}

// Navigation Menu Functions
function toggleMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const navOverlay = document.querySelector('.nav-overlay');
    
    navMenu.classList.toggle('open');
    navOverlay.classList.toggle('active');
}

function closeMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const navOverlay = document.querySelector('.nav-overlay');
    
    navMenu.classList.remove('open');
    navOverlay.classList.remove('active');
}

// Handle resize
window.addEventListener('resize', () => {
    // Globe sizes are responsive via viewBox, no need to resize
});

// Initialize
window.addEventListener('load', init);

// Scroll indicator
const scrollIndicator = document.querySelector('.scroll-indicator');
if (scrollIndicator) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            scrollIndicator.style.opacity = '0';
        } else {
            scrollIndicator.style.opacity = '1';
        }
    });
}

// Story Section - Interactive Earthquake Education
let currentEarthquakeSlide = 0;
const totalEarthquakeSlides = 5;
let isScrollingEarthquake = false;
let storyCompleted = false; // Track if user has completed all story slides

// Add subtle screen flicker effect to earthquake slides
function addScreenFlicker() {
    const slides = document.querySelectorAll('.slide.earthquake-slide');
    
    setInterval(() => {
        if (Math.random() < 0.03) { // 3% chance every interval
            slides.forEach(slide => {
                slide.style.filter = 'brightness(1.1)';
                setTimeout(() => {
                    slide.style.filter = 'brightness(1)';
                }, 50 + Math.random() * 50);
            });
        }
    }, 200);
}

// Initialize earthquake slideshow
function initEarthquakeSlideshow() {
    const earthquakeSlideshow = document.getElementById('earthquake-slideshow');
    if (!earthquakeSlideshow) return;

    // Initialize energy calculator
    initEnergyCalculator();
    
    // Add TV screen flicker effect
    addScreenFlicker();
    
    // Set the first slide as active initially
    const slides = document.querySelectorAll('.slide.earthquake-slide');
    if (slides.length > 0) {
        slides[0].classList.add('active');
    }
    
    // Note: Earthquake slide navigation now integrated into main scroll system

    // Handle keyboard navigation
    function handleEarthquakeKeyboard(event) {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const storyStart = windowHeight * 2; // Match the SECTION_HEIGHTS.STORY
        const storyEnd = windowHeight * 4;
        
        if (scrollY >= storyStart && scrollY < storyEnd) {
            switch(event.key) {
                case 'ArrowRight':
                case ' ':
                    event.preventDefault();
                    nextEarthquakeSlide();
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    prevEarthquakeSlide();
                    break;
            }
        }
    }

    // Touch handling for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    function handleEarthquakeTouchStart(event) {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const storyStart = windowHeight * 2; // Match the SECTION_HEIGHTS.STORY
        const storyEnd = windowHeight * 4;
        
        if (scrollY >= storyStart && scrollY < storyEnd) {
            touchStartX = event.touches[0].clientX;
        }
    }

    function handleEarthquakeTouchEnd(event) {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const storyStart = windowHeight * 2; // Match the SECTION_HEIGHTS.STORY
        const storyEnd = windowHeight * 4;
        
        if (scrollY >= storyStart && scrollY < storyEnd) {
            touchEndX = event.changedTouches[0].clientX;
            const deltaX = touchStartX - touchEndX;
            
            if (Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    nextEarthquakeSlide();
                } else {
                    prevEarthquakeSlide();
                }
            }
        }
    }

    // Event listeners (scroll handling now integrated into main scroll system)
    document.addEventListener('keydown', handleEarthquakeKeyboard);
    document.addEventListener('touchstart', handleEarthquakeTouchStart, { passive: true });
    document.addEventListener('touchend', handleEarthquakeTouchEnd, { passive: true });
}

function updateEarthquakeSlidePosition() {
    // Get all slides and update active state
    const slides = document.querySelectorAll('.slide.earthquake-slide');
    
    // Hide all slides first
    slides.forEach((slide, index) => {
        slide.classList.remove('active');
    });
    
    // Show only the current slide
    if (slides[currentEarthquakeSlide]) {
        slides[currentEarthquakeSlide].classList.add('active');
    }
    
    // Update indicators
    document.querySelectorAll('.slide-indicator .indicator-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentEarthquakeSlide);
    });
}

function goToEarthquakeSlide(slideIndex) {
    if (slideIndex >= 0 && slideIndex < totalEarthquakeSlides) {
        // Stop any current slide transition
        isScrollingEarthquake = true;
        
        currentEarthquakeSlide = slideIndex;
        updateEarthquakeSlidePosition();
        
        // Initialize prediction interface when reaching slide 5 (index 4)
        if (slideIndex === 4) {
            setTimeout(() => {
                console.log('Navigated to prediction slide, reinitializing...');
                initPredictionInterface();
            }, 300);
        }
        
        // Reset the scroll lock after transition completes
        setTimeout(() => {
            isScrollingEarthquake = false;
        }, 600);
    }
}

function nextEarthquakeSlide() {
    if (currentEarthquakeSlide < totalEarthquakeSlides - 1) {
        // Stop any current slide transition
        isScrollingEarthquake = true;
        
        currentEarthquakeSlide++;
        updateEarthquakeSlidePosition();
        
        // Mark story as completed when reaching the last slide
        if (currentEarthquakeSlide === totalEarthquakeSlides - 1) {
            storyCompleted = true;
            console.log('📚 Story completed! User can now access "but" section');
        }
        
        // Initialize prediction interface when reaching slide 5 (index 4)
        if (currentEarthquakeSlide === 4) {
            setTimeout(() => {
                console.log('Navigated to prediction slide, reinitializing...');
                initPredictionInterface();
            }, 300);
        }
        
        // Reset the scroll lock after transition completes
        setTimeout(() => {
            isScrollingEarthquake = false;
        }, 600);
    }
}

function prevEarthquakeSlide() {
    if (currentEarthquakeSlide > 0) {
        // Stop any current slide transition
        isScrollingEarthquake = true;
        
        currentEarthquakeSlide--;
        updateEarthquakeSlidePosition();
        
        // Initialize prediction interface when reaching slide 5 (index 4)
        if (currentEarthquakeSlide === 4) {
            setTimeout(() => {
                console.log('Navigated to prediction slide, reinitializing...');
                initPredictionInterface();
            }, 300);
        }
        
        // Reset the scroll lock after transition completes
        setTimeout(() => {
            isScrollingEarthquake = false;
        }, 600);
    }
}

// Energy Calculator Functions
function initEnergyCalculator() {
    const magnitudeSlider = document.getElementById('magnitude-slider');
    const depthSlider = document.getElementById('depth-slider');
    const historicalSelect = document.getElementById('historical-earthquake');
    
    if (!magnitudeSlider || !depthSlider || !historicalSelect) return;

    // Update displays when sliders change
    magnitudeSlider.addEventListener('input', updateEnergyCalculation);
    depthSlider.addEventListener('input', updateEnergyCalculation);
    
    // Handle historical earthquake selection
    historicalSelect.addEventListener('change', function() {
        const selected = this.options[this.selectedIndex];
        if (selected.value !== 'custom') {
            const magnitude = parseFloat(selected.dataset.mag);
            const depth = parseInt(selected.dataset.depth);
            
            magnitudeSlider.value = magnitude;
            depthSlider.value = depth;
            
            updateEnergyCalculation();
        }
    });
    
    // Initial calculation
    updateEnergyCalculation();
}

function updateEnergyCalculation() {
    const magnitude = parseFloat(document.getElementById('magnitude-slider').value);
    const depth = parseInt(document.getElementById('depth-slider').value);
    
    // Update display values
    document.getElementById('magnitude-display').textContent = magnitude.toFixed(1);
    document.getElementById('depth-display').textContent = depth;
    
    // Calculate total seismic energy released (independent of depth)
    // Formula: log10(E) = 11.8 + 1.5 * M (energy in ergs)
    const logEnergy = 11.8 + 1.5 * magnitude;
    const energyErgs = Math.pow(10, logEnergy);
    const totalEnergyJoules = energyErgs * 1e-7;
    
    // Calculate depth attenuation factor (less aggressive)
    // Most energy still reaches surface even from moderate depths
    const depth_attenuation = 1 / (1 + depth / 100); // Gentler attenuation with 100km characteristic depth
    
    // Calculate surface intensity for damage classification
    // Based on empirical relations but calibrated to match real events
    const distance_factor = Math.max(1, Math.sqrt(depth)); // Square root instead of logarithmic for gentler falloff
    const surface_intensity = magnitude - 0.5 * Math.log10(distance_factor) - 1;
    
    // Calculate effective surface energy (what actually affects damage)
    // Calibrated so Japan Tohoku (9.1, 32km) ≈ 3000 Hiroshima bombs
    const base_surface_fraction = 0.1; // 10% of total energy typically reaches surface effectively
    const depth_adjusted_fraction = base_surface_fraction * depth_attenuation;
    const effective_surface_energy = totalEnergyJoules * depth_adjusted_fraction;
    
    // Hiroshima bomb: approximately 6.3 × 10^13 joules
    const hiroshimaJoules = 6.3e13;
    
    // Use effective surface energy for bomb comparison (what matters for damage)
    const bombEquivalent = effective_surface_energy / hiroshimaJoules;
    
    // Update bomb equivalent display with depth-adjusted values
    const bombElement = document.getElementById('bomb-equivalent');
    if (bombEquivalent < 0.1) {
        bombElement.textContent = bombEquivalent.toFixed(2);
    } else if (bombEquivalent < 1) {
        bombElement.textContent = bombEquivalent.toFixed(1);
    } else if (bombEquivalent < 1000) {
        bombElement.textContent = Math.round(bombEquivalent).toLocaleString();
    } else if (bombEquivalent < 10000) {
        bombElement.textContent = (bombEquivalent / 1000).toFixed(1) + 'K';
    } else {
        bombElement.textContent = (bombEquivalent / 1000).toFixed(0) + 'K';
    }
    
    // Generate visual bomb representation
    generateBombVisualization(bombEquivalent);
    
    // Update total energy display (unchanged - this is total seismic energy)
    const totalEnergyElement = document.getElementById('total-energy');
    if (totalEnergyJoules < 1e15) {
        totalEnergyElement.innerHTML = (totalEnergyJoules / 1e12).toFixed(1) + ' × 10<sup>12</sup> J';
    } else if (totalEnergyJoules < 1e18) {
        totalEnergyElement.innerHTML = (totalEnergyJoules / 1e15).toFixed(1) + ' × 10<sup>15</sup> J';
    } else {
        totalEnergyElement.innerHTML = (totalEnergyJoules / 1e18).toFixed(1) + ' × 10<sup>18</sup> J';
    }
    
    // Update comparison with depth-adjusted explanation
    const comparisonElement = document.getElementById('energy-comparison');
    const intensity_description = surface_intensity > 8 ? 'Catastrophic' : 
                                 surface_intensity > 7 ? 'Very Strong' :
                                 surface_intensity > 6 ? 'Strong' :
                                 surface_intensity > 5 ? 'Moderate' : 'Light';
    
    comparisonElement.textContent = `${intensity_description} (Intensity ${surface_intensity.toFixed(1)})`;
}

function generateBombVisualization(bombEquivalent) {
    const bombGrid = document.getElementById('bomb-grid');
    if (!bombGrid) return;
    
    // Clear existing bombs
    bombGrid.innerHTML = '';
    
    // Fixed scale: each visual bomb represents exactly 100 bombs
    const BOMBS_PER_ICON = 100;
    const visualBombs = Math.round(bombEquivalent / BOMBS_PER_ICON);
    
    // Limit visual bombs to prevent overflow (max 25 for readability)
    const maxVisualBombs = Math.min(25, visualBombs);
    
    // Create bomb elements
    for (let i = 0; i < maxVisualBombs; i++) {
        const bomb = document.createElement('div');
        bomb.className = 'nuclear-bomb';
        
        // Add slight delay for animation effect
        setTimeout(() => {
            bombGrid.appendChild(bomb);
        }, i * 60);
    }
    
    // Update the explanation text - always consistent
    const explanationElements = document.querySelectorAll('.bomb-explanation');
    if (explanationElements.length >= 2) {
        if (maxVisualBombs === 25 && visualBombs > 25) {
            explanationElements[1].textContent = `There are ${visualBombs} 💣 and each 💣 = ${BOMBS_PER_ICON} bombs (showing ${maxVisualBombs})`;
        } else {
            explanationElements[1].textContent = `There are ${visualBombs} 💣 and each 💣 = ${BOMBS_PER_ICON} bombs`;
        }
    }
}

// Initialize earthquake slideshow when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initEarthquakeSlideshow();
        setTimeout(loadEarthquakeData, 500); // Delay data loading
    });
} else {
    initEarthquakeSlideshow();
    setTimeout(loadEarthquakeData, 500); // Delay data loading
}

// Prediction Interface - Slide 5
let predictionSvg = null;
let predictionLine = null;
let isDrawing = false;
let userPredictionPoints = [];
let userPredictionSaved = false;
let xScale, yScale;


function initPredictionInterface() {
    const chartElement = document.getElementById('prediction-chart');
    if (!chartElement) {
        console.log('Prediction chart element not found');
        return;
    }
    
    console.log('Initializing prediction interface...');
    
    // Reset prediction state
    userPredictionSaved = false;
    userPredictionPoints = [];
    isDrawing = false;
    
    // Clear any existing event listeners to prevent duplicates
    const clearBtn = document.getElementById('clear-prediction');
    const submitBtn = document.getElementById('submit-prediction');
    
    if (clearBtn) {
        clearBtn.replaceWith(clearBtn.cloneNode(true));
        document.getElementById('clear-prediction').addEventListener('click', clearPrediction);
    }
    
    if (submitBtn) {
        submitBtn.replaceWith(submitBtn.cloneNode(true));
        document.getElementById('submit-prediction').addEventListener('click', submitPrediction);
    }
    
    // Set up D3 chart
    setupPredictionChart();
    
    console.log('Prediction interface initialized with fresh event listeners');
}

function setupPredictionChart() {
    const width = 520; // Increased from 480 to use more space
    const height = 270; // Increased from 250 to use more space
    const margin = { top: 10, right: 15, bottom: 35, left: 50 }; // Further reduced margins
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Clear any existing content
    d3.select('#prediction-chart').selectAll('*').remove();
    
    // Create SVG
    predictionSvg = d3.select('#prediction-chart')
        .attr('width', width)
        .attr('height', height);
    
    // Create scales
    xScale = d3.scaleLinear()
        .domain([5.0, 9.5])
        .range([margin.left, width - margin.right]);
    
    yScale = d3.scaleLinear()  // Changed from scaleLog to scaleLinear
        .domain([0, 300000])   // Linear from 0 to 300K deaths
        .range([height - margin.bottom, margin.top]);
    
    // Create chart background
    predictionSvg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'rgba(0, 0, 0, 0.8)')
        .attr('rx', 6);
    
    // Add chart area rectangle for drawing bounds
    const chartArea = predictionSvg.append('rect')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', chartWidth)
        .attr('height', chartHeight)
        .attr('fill', 'rgba(0, 0, 0, 0.3)')
        .attr('stroke', 'rgba(255, 255, 255, 0.1)')
        .style('cursor', 'crosshair');
    
    // Create X axis
    const xAxis = d3.axisBottom(xScale)
        .ticks(9)
        .tickFormat(d => d.toString());
    
    predictionSvg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(xAxis)
        .selectAll('text')
        .style('fill', 'rgba(255, 138, 101, 0.8)')
        .style('font-size', '12px');
    
    predictionSvg.select('.domain')
        .style('stroke', 'rgba(255, 138, 101, 0.6)');
    
    predictionSvg.selectAll('.tick line')
        .style('stroke', 'rgba(255, 138, 101, 0.6)');
    
    // Create Y axis with linear ticks
    const yAxis = d3.axisLeft(yScale)
        .tickValues([0, 50000, 100000, 150000, 200000, 250000, 300000])
        .tickFormat(d => {
            if (d === 0) return '0';
            if (d === 50000) return '50K';
            if (d === 100000) return '100K';
            if (d === 150000) return '150K';
            if (d === 200000) return '200K';
            if (d === 250000) return '250K';
            if (d === 300000) return '300K';
            return d.toString();
        });
    
    predictionSvg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(yAxis)
        .selectAll('text')
        .style('fill', 'rgba(255, 138, 101, 0.8)')
        .style('font-size', '12px');
    
    predictionSvg.selectAll('.domain')
        .style('stroke', 'rgba(255, 138, 101, 0.6)');
    
    predictionSvg.selectAll('.tick line')
        .style('stroke', 'rgba(255, 138, 101, 0.6)');
    
    // Add axis labels
    predictionSvg.append('text')
        .attr('x', width / 2)
        .attr('y', height - 10)
        .style('text-anchor', 'middle')
        .style('fill', 'rgba(255, 138, 101, 0.8)')
        .style('font-size', '14px')
        .style('font-weight', '500')
        .text('Earthquake Magnitude');
    
    predictionSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', 15)
        .style('text-anchor', 'middle')
        .style('fill', 'rgba(255, 138, 101, 0.8)')
        .style('font-size', '14px')
        .style('font-weight', '500')
        .text('Deaths');
    
    // Add instructions
    predictionSvg.append('text')
        .attr('x', width / 2)
        .attr('y', 15)
        .style('text-anchor', 'middle')
        .style('fill', 'rgba(255, 255, 255, 0.7)')
        .style('font-size', '12px')
        .text('Draw your prediction line from left to right');
    
    // Set up drawing interactions
    setupDrawingInteractions(chartArea);
}

function setupDrawingInteractions(chartArea) {
    console.log('Setting up drawing interactions');
    
    chartArea
        .on('mousedown', function(event) {
            console.log('Mouse down event fired');
            if (userPredictionSaved) {
                console.log('Prediction already saved, ignoring');
                return;
            }
            isDrawing = true;
            userPredictionPoints = [];
            
            const [x, y] = d3.pointer(event, this);
            console.log('Starting draw at:', x, y);
            userPredictionPoints.push({x, y});
            
            // Clear any existing prediction line
            clearPredictionLine();
        })
        .on('mousemove', function(event) {
            if (!isDrawing || userPredictionSaved) {
                console.log('Mousemove ignored: isDrawing=', isDrawing, 'userPredictionSaved=', userPredictionSaved);
                return;
            }
            
            const [x, y] = d3.pointer(event, this);
            console.log('Mousemove at:', x, y);
            
            // TEMPORARILY REMOVE BOUNDS CHECKING FOR DEBUGGING
            userPredictionPoints.push({x, y});
            console.log('Added point:', x, y, 'Total points:', userPredictionPoints.length);
            drawPredictionLine();
        })
        .on('mouseup', function() {
            console.log('Mouse up, stopping draw. Total points:', userPredictionPoints.length);
            isDrawing = false;
        });
    
    // Touch events for mobile
    chartArea
        .on('touchstart', function(event) {
            event.preventDefault();
            if (userPredictionSaved) return;
            
            isDrawing = true;
            userPredictionPoints = [];
            
            const [x, y] = d3.pointer(event.touches[0], this);
            console.log('Touch start at:', x, y);
            userPredictionPoints.push({x, y});
            
            clearPredictionLine();
        })
        .on('touchmove', function(event) {
            event.preventDefault();
            if (!isDrawing || userPredictionSaved) return;
            
            const [x, y] = d3.pointer(event.touches[0], this);
            console.log('Touch move at:', x, y);
            
            const margin = { top: 20, right: 30, bottom: 60, left: 80 };
            const leftBound = margin.left - 10;
            const rightBound = 600 - margin.right + 10;
            const topBound = margin.top - 10;
            const bottomBound = 300 - margin.bottom + 10;
            
            if (x >= leftBound && x <= rightBound && y >= topBound && y <= bottomBound) {
                userPredictionPoints.push({x, y});
                console.log('Touch added point:', x, y, 'Total points:', userPredictionPoints.length);
                drawPredictionLine();
            }
        })
        .on('touchend', function() {
            console.log('Touch end, stopping draw');
            isDrawing = false;
        });
    
    // Clean up any existing global handlers and add new ones
    if (window.predictionMouseMoveHandler) {
        document.removeEventListener('mousemove', window.predictionMouseMoveHandler);
    }
    if (window.predictionMouseUpHandler) {
        document.removeEventListener('mouseup', window.predictionMouseUpHandler);
    }
    
    // Create new handlers and store references for cleanup
    window.predictionMouseMoveHandler = function(event) {
        // Only active if we're on the prediction slide and currently drawing
        if (!isDrawing || userPredictionSaved || !predictionSvg || currentEarthquakeSlide !== 4) return;
        
        // Get coordinates relative to the SVG
        const svgRect = predictionSvg.node().getBoundingClientRect();
        const x = event.clientX - svgRect.left;
        const y = event.clientY - svgRect.top;
        
        console.log('Document mousemove at:', x, y);
        
        // Add points as long as we're drawing, regardless of bounds
        userPredictionPoints.push({x, y});
        console.log('Added point:', x, y, 'Total points:', userPredictionPoints.length);
        drawPredictionLine();
    };
    
    window.predictionMouseUpHandler = function() {
        // Only active if we're on the prediction slide and currently drawing
        if (isDrawing && currentEarthquakeSlide === 4) {
            console.log('Document mouse up, stopping draw. Total points:', userPredictionPoints.length);
            isDrawing = false;
        }
    };
    
    document.addEventListener('mousemove', window.predictionMouseMoveHandler);
    document.addEventListener('mouseup', window.predictionMouseUpHandler);
}

function clearPredictionLine() {
    predictionSvg.select('.prediction-line').remove();
}

function drawPredictionLine() {
    console.log('Drawing prediction line with', userPredictionPoints.length, 'points');
    
    if (userPredictionPoints.length < 1) return;
    
    // Remove existing line
    clearPredictionLine();
    
    if (userPredictionPoints.length === 1) {
        // Draw a single point
        predictionSvg.append('circle')
            .attr('class', 'prediction-line')
            .attr('cx', userPredictionPoints[0].x)
            .attr('cy', userPredictionPoints[0].y)
            .attr('r', 3)
            .attr('fill', '#00ff88');
        return;
    }
    
    // Create line generator for multiple points
    const line = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveLinear); // Changed from curveMonotoneX for more reliable drawing
    
    // Draw the prediction line
    predictionSvg.append('path')
        .datum(userPredictionPoints)
        .attr('class', 'prediction-line')
        .attr('fill', 'none')
        .attr('stroke', '#00ff88')
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('d', line);
}

function clearPrediction() {
    userPredictionPoints = [];
    userPredictionSaved = false;
    clearPredictionLine();
    document.getElementById('prediction-feedback').style.display = 'none';
}

function submitPrediction() {
    if (userPredictionPoints.length < 10) {
        alert('Please draw a more complete prediction line across the chart.');
        return;
    }
    
    // Calculate correlation between user prediction and actual data
    const correlation = calculatePredictionCorrelation();
    
    // Calculate trend direction for user's prediction
    const userTrend = calculateUserTrendDirection();
    
    // Save prediction
    userPredictionSaved = true;
    
    // Show detailed feedback
    document.getElementById('user-correlation').textContent = correlation.toFixed(3);
    
    // Add trend description based on simple logic
    let trendDescription = '';
    if (correlation > 0.4) {
        trendDescription = 'Strong positive - more magnitude, more deaths';
    } else if (correlation > 0.15) {
        trendDescription = 'Moderate positive - deaths increase with magnitude';
    } else if (correlation > 0.04) {
        trendDescription = 'Weak positive - slight increase';
    } else if (correlation > -0.04) {
        trendDescription = 'Nearly flat - no clear pattern';
    } else if (correlation > -0.15) {
        trendDescription = 'Weak negative - slight decrease';
    } else if (correlation > -0.4) {
        trendDescription = 'Moderate negative - deaths decrease with magnitude';
    } else {
        trendDescription = 'Strong negative - more magnitude, fewer deaths';
    }
    
    // Update feedback text
    const feedbackElement = document.getElementById('prediction-feedback');
    feedbackElement.innerHTML = `
        <h3>Your Prediction Saved!</h3>
        <p>Correlation strength: <span id="user-correlation">${correlation.toFixed(3)}</span></p>
        <p><strong>${trendDescription}</strong></p>
    `;
    feedbackElement.style.display = 'block';
    
    // Store for later comparison
    window.userPredictionData = {
        points: [...userPredictionPoints],
        correlation: correlation,
        trend: userTrend,
        timestamp: new Date().toISOString()
    };
    
    console.log('User prediction saved:', window.userPredictionData);
}

function calculatePredictionCorrelation() {
    console.log('=== DEBUGGING CORRELATION CALCULATION ===');
    console.log('Total points drawn:', userPredictionPoints.length);
    
    // Get start and end points of the user's line
    const startPoint = userPredictionPoints[0];
    const endPoint = userPredictionPoints[userPredictionPoints.length - 1];
    
    console.log('Raw start point:', startPoint);
    console.log('Raw end point:', endPoint);
    
    // Convert to magnitude and deaths
    const startMagnitude = xScale.invert(startPoint.x);
    const endMagnitude = xScale.invert(endPoint.x);
    const startDeaths = Math.max(1, yScale.invert(startPoint.y));
    const endDeaths = Math.max(1, yScale.invert(endPoint.y));
    
    console.log('Converted values:');
    console.log('Start: magnitude =', startMagnitude.toFixed(2), 'deaths =', startDeaths.toFixed(0));
    console.log('End: magnitude =', endMagnitude.toFixed(2), 'deaths =', endDeaths.toFixed(0));
    
    // Calculate the ratio of change
    const magnitudeChange = endMagnitude - startMagnitude;
    const deathsRatio = endDeaths / startDeaths;
    const deathsChange = endDeaths - startDeaths;
    const percentChange = ((endDeaths - startDeaths) / startDeaths) * 100;
    
    console.log('Analysis:');
    console.log('- Magnitude change:', magnitudeChange.toFixed(2));
    console.log('- Deaths ratio:', deathsRatio.toFixed(3));
    console.log('- Deaths change:', deathsChange.toFixed(0));
    console.log('- Percent change:', percentChange.toFixed(1) + '%');
    
    // Simple correlation based on actual deaths change (now that we have linear scale)
    let correlation = 0;
    
    // With linear scale, percentage change in deaths is now meaningful and intuitive
    console.log('Deaths analysis (linear scale):');
    console.log('- Deaths change:', deathsChange.toFixed(0));
    console.log('- Deaths percent change:', percentChange.toFixed(1) + '%');
    
    // Use percentage change directly since it's now intuitive with linear scale
    if (Math.abs(percentChange) < 15) {
        // Less than 15% change = essentially flat
        correlation = percentChange / 100; // Direct mapping
        console.log('FLAT LINE detected: < 15% change');
    } else if (percentChange > 15) {
        // Significant increase
        correlation = Math.min(0.9, percentChange / 100); // Scale by percentage
        console.log('INCREASING LINE detected: +' + percentChange.toFixed(1) + '% increase');
    } else {
        // Significant decrease
        correlation = Math.max(-0.9, percentChange / 100); // Scale by percentage  
        console.log('DECREASING LINE detected: ' + percentChange.toFixed(1) + '% decrease');
    }
    
    console.log('Final correlation:', correlation.toFixed(3));
    console.log('=== END DEBUGGING ===');
    
    return correlation;
}

function calculateUserTrendDirection() {
    // Sample points across the magnitude range
    const startPoint = userPredictionPoints[0];
    const endPoint = userPredictionPoints[userPredictionPoints.length - 1];
    
    const startMagnitude = xScale.invert(startPoint.x);
    const endMagnitude = xScale.invert(endPoint.x);
    const startDeaths = Math.max(1, yScale.invert(startPoint.y));
    const endDeaths = Math.max(1, yScale.invert(endPoint.y));
    
    console.log('Trend analysis:', { startMagnitude, endMagnitude, startDeaths, endDeaths });
    
    const deathsRatio = endDeaths / startDeaths;
    
    if (deathsRatio > 10) {
        return 'Exponential increase (deaths grow rapidly with magnitude)';
    } else if (deathsRatio > 3) {
        return 'Strong increase (deaths grow significantly with magnitude)';
    } else if (deathsRatio > 1.5) {
        return 'Moderate increase (deaths grow with magnitude)';
    } else if (deathsRatio > 0.7) {
        return 'Roughly constant (deaths stay similar across magnitudes)';
    } else {
        return 'Decrease (deaths decrease with higher magnitude)';
    }
}

// Initialize prediction interface when slide becomes active
function checkAndInitPrediction() {
    if (currentEarthquakeSlide === 4) {
        console.log('Slide 4 (prediction) is active, initializing prediction interface...');
        // Always reinitialize to ensure clean state
        predictionSvg = null;
        userPredictionPoints = [];
        isDrawing = false;
        userPredictionSaved = false;
        setTimeout(initPredictionInterface, 100);
    } else {
        // Clean up prediction handlers when leaving prediction slide
        console.log('Left prediction slide, cleaning up prediction handlers...');
        isDrawing = false;
        if (window.predictionMouseMoveHandler) {
            document.removeEventListener('mousemove', window.predictionMouseMoveHandler);
            window.predictionMouseMoveHandler = null;
        }
        if (window.predictionMouseUpHandler) {
            document.removeEventListener('mouseup', window.predictionMouseUpHandler);
            window.predictionMouseUpHandler = null;
        }
    }
}

// Add to the slide update function
const originalUpdateSlidePosition = updateEarthquakeSlidePosition;
updateEarthquakeSlidePosition = function() {
    originalUpdateSlidePosition();
    checkAndInitPrediction();
};

// Global variables for earthquake data visualization (declared at top of file)
let userPredictionOverlay = null;
let currentTransform = d3.zoomIdentity;

// Load and process earthquake data
async function loadEarthquakeData() {
    try {
        console.log('Loading earthquake data...');
        const response = await fetch('earthquakes.csv');
        const csvText = await response.text();
        
        // Parse CSV data
        const data = d3.csvParse(csvText);
        console.log('Raw CSV data length:', data.length);
        
        // Check if we have data and what columns are available
        if (data.length === 0) {
            console.error('No data found in CSV file');
            return;
        }
        
        // Debug: Let's see what data we have before filtering
        console.log('First 5 raw records:', data.slice(0, 5));
        console.log('Sample data columns:', Object.keys(data[0] || {}));
        
        // Process and filter the data - EXTREMELY lenient to capture all data
        earthquakeData = data
            .filter(d => {
                // Skip completely empty rows
                if (!d || Object.keys(d).length === 0) return false;
                
                const magnitude = parseFloat(d.Mag);
                const deaths = parseInt(d.Deaths) || parseInt(d['Total Deaths']) || 0;
                const year = parseInt(d.Year);
                const country = d.Country;
                
                // Debug individual filters
                const hasMagnitude = !isNaN(magnitude);
                const magnitudeInRange = magnitude >= 5.0 && magnitude <= 12.0; // Only significant earthquakes (matches drawing interface)
                const hasYear = !isNaN(year);
                const yearInRange = year >= 1000; // Very lenient year check
                const hasCountry = country && country.trim() !== '';
                const validCountry = !country || (
                    country.toLowerCase() !== 'nan' && 
                    country.toLowerCase() !== 'null' && 
                    country.toLowerCase() !== 'undefined'
                );
                const validDeaths = deaths >= 0; // Allow 0 deaths
                
                const passes = hasMagnitude && magnitudeInRange && hasYear && yearInRange && hasCountry && validCountry && validDeaths;
                
                // Log failed records occasionally
                if (!passes && Math.random() < 0.01) {
                    console.log('Filtered out:', {
                        magnitude, deaths, year, country,
                        hasMagnitude, magnitudeInRange, hasYear, yearInRange, hasCountry, validCountry, validDeaths
                    });
                }
                
                return passes;
            })
            .map(d => {
                // Try multiple death columns and handle edge cases
                let deaths = 0;
                if (d.Deaths && d.Deaths !== '' && d.Deaths.toLowerCase() !== 'nan') {
                    deaths = parseInt(d.Deaths) || 0;
                } else if (d['Total Deaths'] && d['Total Deaths'] !== '' && d['Total Deaths'].toLowerCase() !== 'nan') {
                    deaths = parseInt(d['Total Deaths']) || 0;
                }
                
                // Handle location more robustly
                let location = d['Location Name'] || d.Location || d.Country || 'Unknown';
                if (typeof location === 'string') {
                    location = location.trim();
                }
                
                return {
                    magnitude: parseFloat(d.Mag),
                    deaths: Math.max(0, deaths), // Ensure non-negative
                    year: parseInt(d.Year),
                    country: (d.Country || '').trim(),
                    location: location,
                    latitude: parseFloat(d.Latitude) || 0,
                    longitude: parseFloat(d.Longitude) || 0
                };
            })
            .sort((a, b) => a.magnitude - b.magnitude); // Sort by magnitude
        
        console.log('Processing completed:');
        console.log('- Raw CSV records:', data.length);
        console.log('- After filtering:', earthquakeData.length);
        console.log('- Percentage kept:', ((earthquakeData.length / data.length) * 100).toFixed(1) + '%');
        console.log('Sample processed data:', earthquakeData.slice(0, 10));
        
        // Show magnitude and death ranges
        const magnitudes = earthquakeData.map(d => d.magnitude);
        const deaths = earthquakeData.map(d => d.deaths);
        console.log('Magnitude range:', Math.min(...magnitudes), 'to', Math.max(...magnitudes));
        console.log('Deaths range:', Math.min(...deaths), 'to', Math.max(...deaths));
        console.log('Countries:', [...new Set(earthquakeData.map(d => d.country))].slice(0, 10));
        
        // Initialize filters and chart
        setupDataControls();
        
        // Wait a bit for DOM to be ready
        setTimeout(() => {
            initializeScatterChart();
        }, 100);
        
    } catch (error) {
        console.error('Error loading earthquake data:', error);
        // Fallback to sample data if CSV loading fails
        earthquakeData = predictionEarthquakeData.map(d => ({
            ...d,
            year: 2000,
            country: 'Sample',
            location: 'Sample Location',
            latitude: 0,
            longitude: 0
        }));
        setupDataControls();
        setTimeout(() => {
            initializeScatterChart();
        }, 100);
    }
}

// Setup control panel interactions
function setupDataControls() {
    console.log('Setting up data controls...');
    
    // Get unique countries for dropdown
    const countries = [...new Set(earthquakeData.map(d => d.country))].sort();
    const countrySelect = document.getElementById('country-filter');
    
    if (countrySelect) {
        // Clear existing options except "All Countries"
        countrySelect.innerHTML = '<option value="">All Countries</option>';
        
        // Add country options
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
    }
    
    // Determine data ranges for sliders
    const magnitudes = earthquakeData.map(d => d.magnitude);
    const deaths = earthquakeData.map(d => d.deaths);
    const minMag = Math.min(...magnitudes) || 3;
    const maxMag = Math.max(...magnitudes) || 10;
    const maxDeaths = Math.max(...deaths) || 1000000;
    
    console.log('Setting up sliders with ranges:', { minMag, maxMag, maxDeaths });
    
    // Setup magnitude range slider to match data exactly
    setupDualSlider('magnitude', minMag, maxMag, 0.1, updateFilters);
    
    // Setup deaths range slider with full range but initialized to 0-330k
    setupDualSlider('deaths', 0, maxDeaths, Math.max(1000, Math.floor(maxDeaths / 100)), updateFilters);
    
    // Setup toggle for user prediction
    const predictionToggle = document.getElementById('show-prediction');
    if (predictionToggle) {
        predictionToggle.addEventListener('change', toggleUserPrediction);
    }
    
    // Setup country filter
    if (countrySelect) {
        countrySelect.addEventListener('change', updateFilters);
    }
    
    // Initial filter update
    updateFilters();
    
    // Lock all controls for this section (users should only view data/prediction overlap)
    lockDataControls();
}

// Lock all data control panel elements to prevent user interaction
function lockDataControls() {
    console.log('🔒 Locking data controls for view-only mode...');
    
    // Disable all sliders
    const sliders = [
        'magnitude-min', 'magnitude-max',
        'deaths-min', 'deaths-max'
    ];
    
    sliders.forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.disabled = true;
            // Remove inline styles - let CSS handle the visual appearance
        }
    });
    
    // Disable country filter dropdown
    const countrySelect = document.getElementById('country-filter');
    if (countrySelect) {
        countrySelect.disabled = true;
        // Remove inline styles - let CSS handle the visual appearance
    }
    
    // Keep prediction toggle enabled (users need this to see overlap)
    const predictionToggle = document.getElementById('show-prediction');
    if (predictionToggle) {
        predictionToggle.disabled = false; // Keep this enabled
        console.log('✅ Prediction toggle remains enabled for data comparison');
    }
    
    // Add subtle visual indicator that controls are locked
    const controlPanel = document.querySelector('.control-panel');
    if (controlPanel) {
        // Make the overall panel slightly more subdued
        controlPanel.style.opacity = '0.8';
        controlPanel.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        
        // Add subtle locked indicator text (much smaller and less intrusive)
        const lockedIndicator = document.createElement('div');
        lockedIndicator.innerHTML = '🔒 View only';
        lockedIndicator.style.cssText = `
            position: absolute;
            top: 8px;
            right: 12px;
            color: rgba(255, 138, 101, 0.4);
            font-size: 10px;
            font-weight: 400;
            opacity: 0.6;
            z-index: 10;
        `;
        controlPanel.style.position = 'relative';
        controlPanel.appendChild(lockedIndicator);
    }
    
    console.log('🔒 Data controls locked - users can only view data and toggle prediction overlay');
}

// Setup dual range slider functionality
function setupDualSlider(type, min, max, step, callback) {
    const minSlider = document.getElementById(`${type}-min`);
    const maxSlider = document.getElementById(`${type}-max`);
    const display = document.getElementById(`${type}-range-display`);
    
    if (!minSlider || !maxSlider || !display) return;
    
    minSlider.min = min;
    minSlider.max = max;
    minSlider.step = step;
    minSlider.value = min;
    
    maxSlider.min = min;
    maxSlider.max = max;
    maxSlider.step = step;
    
    // Set initial max value - for deaths, use 330k instead of full max
    if (type === 'deaths') {
        maxSlider.value = Math.min(330000, max);
    } else {
        maxSlider.value = max;
    }
    
    function updateDisplay() {
        const minVal = parseFloat(minSlider.value);
        const maxVal = parseFloat(maxSlider.value);
        
        // Ensure min doesn't exceed max
        if (minVal >= maxVal) {
            if (minSlider === document.activeElement) {
                maxSlider.value = minVal;
            } else {
                minSlider.value = maxVal;
            }
        }
        
        const finalMin = parseFloat(minSlider.value);
        const finalMax = parseFloat(maxSlider.value);
        
        if (type === 'magnitude') {
            display.textContent = `${finalMin.toFixed(1)} - ${finalMax.toFixed(1)}`;
        } else {
            display.textContent = `${finalMin.toLocaleString()} - ${finalMax.toLocaleString()}`;
        }
        
        callback();
    }
    
    minSlider.addEventListener('input', updateDisplay);
    maxSlider.addEventListener('input', updateDisplay);
    
    // Initial display update
    updateDisplay();
}

// Update filtered data and axes based on controls
function updateFilters() {
    const magnitudeMinInput = parseFloat(document.getElementById('magnitude-min')?.value || 3);
    const magnitudeMaxInput = parseFloat(document.getElementById('magnitude-max')?.value || 10);
    const deathsMinInput = parseFloat(document.getElementById('deaths-min')?.value || 0);
    const deathsMaxInput = parseFloat(document.getElementById('deaths-max')?.value || 1000000);
    const selectedCountry = document.getElementById('country-filter')?.value || '';
    
    // Filter data based on current slider ranges and country
    filteredData = earthquakeData.filter(d => {
        const matchesMagnitude = d.magnitude >= magnitudeMinInput && d.magnitude <= magnitudeMaxInput;
        const matchesDeaths = d.deaths >= deathsMinInput && d.deaths <= deathsMaxInput;
        const matchesCountry = !selectedCountry || d.country === selectedCountry;
        return matchesMagnitude && matchesDeaths && matchesCountry;
    });
    
    // Update data count display
    const dataCountElement = document.getElementById('data-count');
    if (dataCountElement) {
        dataCountElement.textContent = `${filteredData.length.toLocaleString()} earthquakes`;
    }
    
    // Rescale axes based on slider ranges (not data extents) to respect locked ranges
    if (scatterChart && filteredData.length) {
        // Use slider values for axes, not data extents
        updateChartAxes(magnitudeMinInput, magnitudeMaxInput, deathsMinInput, deathsMaxInput);
        updateScatterChart();
    }
}

// Setup canvas mouse/wheel interactions for zoom and pan
function setupCanvasInteractions() {
    const { canvas, zoomTransform } = scatterChart;
    let isDragging = false;
    let lastMouseX = 0;
    
    // Mouse wheel for zooming (magnitude-constrained)
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left - scatterChart.margin.left;
        
        // Zoom factor
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        let newScale = zoomTransform.scale * zoomFactor;
        
        // Calculate what magnitude range this scale would show
        const getVisibleMagnitudeRange = (scale, x) => {
            const leftPixel = -x / scale;
            const rightPixel = (scatterChart.width - x) / scale;
            const leftMag = scatterChart.xScale.invert(leftPixel);
            const rightMag = scatterChart.xScale.invert(rightPixel);
            return { left: leftMag, right: rightMag, width: rightMag - leftMag };
        };
        
        // Constrain scale first, before calculating position
        const minMagnitude = 5.0;
        const maxMagnitude = 9.5;
        const maxAllowedRange = maxMagnitude - minMagnitude; // 4.5
        const minAllowedRange = 0.5; // Minimum zoom range
        
        // Test what range this scale would show at current position
        let testX = mouseX - (mouseX - zoomTransform.x) * (newScale / zoomTransform.scale);
        let visibleRange = getVisibleMagnitudeRange(newScale, testX);
        
        // Constrain scale if range is too wide (zooming out too far)
        if (visibleRange.width > maxAllowedRange) {
            const magRange = scatterChart.xScale(maxMagnitude) - scatterChart.xScale(minMagnitude);
            newScale = scatterChart.width / magRange;
        }
        // Constrain scale if range is too narrow (zooming in too far)
        else if (visibleRange.width < minAllowedRange) {
            const magRange = scatterChart.xScale(minMagnitude + minAllowedRange) - scatterChart.xScale(minMagnitude);
            newScale = scatterChart.width / magRange;
        }
        
        // Only proceed if scale actually changed
        if (Math.abs(newScale - zoomTransform.scale) > 0.001) {
            // Calculate new position to zoom toward mouse
            let newX = mouseX - (mouseX - zoomTransform.x) * (newScale / zoomTransform.scale);
            
            // Check final range and adjust position only if needed to stay in bounds
            visibleRange = getVisibleMagnitudeRange(newScale, newX);
            
            if (visibleRange.left < minMagnitude) {
                const overshoot = minMagnitude - visibleRange.left;
                newX += overshoot * newScale;
            } else if (visibleRange.right > maxMagnitude) {
                const overshoot = visibleRange.right - maxMagnitude;
                newX -= overshoot * newScale;
            }
            
            zoomTransform.scale = newScale;
            zoomTransform.x = newX;
            updateScatterChart();
        }
    });
    
    // Mouse down - start dragging or brushing
    canvas.addEventListener('mousedown', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left - scatterChart.margin.left;
        const mouseY = event.clientY - rect.top - scatterChart.margin.top;
        
        // Check if Shift key is held for brush selection
        if (event.shiftKey || shiftPressed) {
            isBrushing = true;
            brushStart = { x: mouseX, y: mouseY };
            brushCurrent = { x: mouseX, y: mouseY };
            canvas.style.cursor = 'crosshair';
        } else {
            isDragging = true;
            lastMouseX = event.clientX;
            canvas.style.cursor = 'grabbing';
        }
    });
    
    // Mouse move - pan while dragging or update brush selection
    canvas.addEventListener('mousemove', (event) => {
        if (isBrushing) {
            // Update brush selection
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left - scatterChart.margin.left;
            const mouseY = event.clientY - rect.top - scatterChart.margin.top;
            
            brushCurrent = { x: mouseX, y: mouseY };
            updateScatterChart(); // Redraw with brush rectangle
        } else if (isDragging) {
            const deltaX = event.clientX - lastMouseX;
            let newX = zoomTransform.x + deltaX;
            
            // Calculate what magnitude range this position would show
            const getVisibleMagnitudeRange = (scale, x) => {
                const leftPixel = -x / scale;
                const rightPixel = (scatterChart.width - x) / scale;
                const leftMag = scatterChart.xScale.invert(leftPixel);
                const rightMag = scatterChart.xScale.invert(rightPixel);
                return { left: leftMag, right: rightMag };
            };
            
            const visibleRange = getVisibleMagnitudeRange(zoomTransform.scale, newX);
            const minMagnitude = 5.0;
            const maxMagnitude = 9.5;
            
            // Constrain panning to stay within magnitude bounds
            if (visibleRange.left < minMagnitude) {
                const overshoot = minMagnitude - visibleRange.left;
                newX += overshoot * zoomTransform.scale;
            } else if (visibleRange.right > maxMagnitude) {
                const overshoot = visibleRange.right - maxMagnitude;
                newX -= overshoot * zoomTransform.scale;
            }
            
            zoomTransform.x = newX;
            lastMouseX = event.clientX;
            updateScatterChart();
        } else {
            // Handle hover for tooltips
            handleCanvasHover(event);
        }
    });
    
    // Mouse up - stop dragging or complete brush selection
    canvas.addEventListener('mouseup', () => {
        if (isBrushing) {
            // Complete brush selection
            finalizeBrushSelection();
            isBrushing = false;
            brushStart = null;
            brushCurrent = null;
            canvas.style.cursor = 'grab';
        } else {
            isDragging = false;
            canvas.style.cursor = 'grab';
        }
    });
    
    // Mouse leave - stop dragging/brushing
    canvas.addEventListener('mouseleave', () => {
        if (isBrushing) {
            isBrushing = false;
            brushStart = null;
            brushCurrent = null;
            updateScatterChart();
        }
        isDragging = false;
        canvas.style.cursor = 'grab';
        hideDataTooltip();
    });
    
    // Note: Shift key handling is now managed by setupD3Interactions()
    // These old Canvas-based listeners have been removed to prevent conflicts
    
    // Set initial cursor
    canvas.style.cursor = 'grab';
}

// Handle canvas hover for tooltips
function handleCanvasHover(event) {
    const rect = scatterChart.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left - scatterChart.margin.left;
    const mouseY = event.clientY - rect.top - scatterChart.margin.top;
    
    // Find closest data point
    let closestPoint = null;
    let minDistance = Infinity;
    const threshold = 8; // pixels
    
    filteredData.forEach(d => {
        const x = getTransformedX(d.magnitude);
        const y = scatterChart.yScale(d.deaths);
        const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
        
        if (distance < threshold && distance < minDistance) {
            minDistance = distance;
            closestPoint = d;
        }
    });
    
    if (closestPoint) {
        showDataTooltip(event, closestPoint);
        // Only change cursor if not in brushing mode
        if (!isBrushing && !shiftPressed) {
            scatterChart.canvas.style.cursor = 'pointer';
        }
    } else {
        hideDataTooltip();
        // Only change cursor if not in brushing mode  
        if (!isBrushing && !shiftPressed) {
            scatterChart.canvas.style.cursor = 'grab';
        }
    }
}

// Get transformed x coordinate
function getTransformedX(magnitude) {
    return (scatterChart.xScale(magnitude) + scatterChart.zoomTransform.x) * scatterChart.zoomTransform.scale;
}

// Update chart axes dynamically based on slider ranges
function updateChartAxes(magnitudeMin, magnitudeMax, deathsMin, deathsMax) {
    if (!scatterChart) return;
    
    const { width, height } = scatterChart;
    
    // Add small padding to the ranges for better visualization
    const magPadding = (magnitudeMax - magnitudeMin) * 0.05;
    const deathsPadding = (deathsMax - deathsMin) * 0.05;
    
    // Ensure minimum x-axis magnitude is 5 (to match drawing interface)
    const actualMagnitudeMin = Math.max(5.0, magnitudeMin - magPadding);
    const actualMagnitudeMax = Math.max(actualMagnitudeMin + 0.5, magnitudeMax + magPadding);
    
    // Update the stored scales with new domains
    scatterChart.xScale.domain([
        actualMagnitudeMin, 
        actualMagnitudeMax
    ]);
    
    scatterChart.yScale.domain([
        Math.max(0, deathsMin - deathsPadding), 
        deathsMax + deathsPadding
    ]);
    
    // Reset zoom transform since we're changing the base scales
    scatterChart.currentTransform = d3.zoomIdentity;
    
    console.log('Updated axis domains (magnitude min constrained to 5.0):', {
        xDomain: scatterChart.xScale.domain(),
        yDomain: scatterChart.yScale.domain()
    });
}

// Initialize Canvas scatter chart
function initializeScatterChart() {
    console.log('Initializing D3.js scatter chart...');
    
    const container = document.getElementById('earthquake-scatter-chart');
    if (!container) {
        console.error('Chart container not found');
        return;
    }
    
    // Clear any existing content
    d3.select(container).selectAll('*').remove();
    
    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 60, left: 80 };
    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width - margin.left - margin.right;
    const height = (containerRect.height || 500) - margin.top - margin.bottom;
    
    console.log('Chart dimensions:', width, 'x', height);
    
    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', containerRect.width)
        .attr('height', containerRect.height)
        .style('background', 'rgba(0, 0, 0, 0.3)')
        .style('border-radius', '8px');
    
    // Create main chart group
    const chartGroup = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales with proper domains based on actual data
    const xExtent = d3.extent(earthquakeData, d => d.magnitude);
    const yExtent = d3.extent(earthquakeData, d => d.deaths);
    
    console.log('Data extents - Magnitude:', xExtent, 'Deaths:', yExtent);
    
    // Set domains with magnitude minimum of 5.0 (to match drawing interface)
    const xScale = d3.scaleLinear()
        .domain([5.0, Math.max(9.0, (xExtent[1] || 9) + 0.2)]) // Start at 5.0, not lower
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, (yExtent[1] || 100000) * 1.1]) // 10% padding at top
        .range([height, 0]);
    
    // Create clip path for data points
    svg.append('defs')
        .append('clipPath')
        .attr('id', 'chart-clip')
        .append('rect')
        .attr('width', width)
        .attr('height', height);
    
    // Create layers
    const gridGroup = chartGroup.append('g').attr('class', 'grid-group');
    const dataGroup = chartGroup.append('g').attr('class', 'data-group')
        .attr('clip-path', 'url(#chart-clip)');
    const predictionGroup = chartGroup.append('g').attr('class', 'prediction-group')
        .attr('clip-path', 'url(#chart-clip)');
    const axisGroup = chartGroup.append('g').attr('class', 'axis-group');
    
    // Create zoom behavior with magnitude constraints (scroll zoom only, no drag)
    const zoom = d3.zoom()
        .scaleExtent([1, 20])
        .filter(event => event.type === 'wheel') // Only allow wheel/scroll events, no dragging
        .on('zoom', handleD3Zoom);
    
    // Brush will be created dynamically in setupD3Interactions
    
    // Store chart state
    scatterChart = {
        svg,
        chartGroup,
        gridGroup,
        dataGroup,
        predictionGroup,
        axisGroup,
        xScale,
        yScale,
        width,
        height,
        margin,
        zoom,
        currentTransform: d3.zoomIdentity
    };
    
    // Apply zoom behavior to SVG
    svg.call(zoom);
    
    // Ensure global variables are properly initialized for brush system
    window.selectedEarthquakes = window.selectedEarthquakes || [];
    
    // Set up interactions with permanent brush fixes applied
    setupD3Interactions();
    
    // Initialize brush system with enhanced debugging
    initializeBrushSystem();
    
    // Ensure stats panel is ready for brush selections
    ensureStatsPanelExists();
    
    // Initial chart render
    updateScatterChart();
    
    // Enforce slider-based axes for locked controls (uses slider values: 0-330k for deaths)
    updateFilters();
    
    // Setup clear selection button
    const clearSelectionBtn = document.getElementById('clear-selection');
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', clearBrushSelection);
    }
}

// Update D3.js scatter chart with current data and filters
function updateScatterChart() {
    if (!scatterChart || !filteredData) return;
    
    // Draw all chart components
    drawD3GridLines();
    drawD3DataPoints();
    drawD3Axes();
    
    // Draw user prediction overlay if user has saved one
    if (userPredictionSaved && document.getElementById('show-prediction')?.checked) {
        drawD3PredictionOverlay();
    }
    
    // Update data count
    document.getElementById('data-count').textContent = `${filteredData.length.toLocaleString()} earthquakes`;
}

// Draw D3.js grid lines
function drawD3GridLines() {
    const { gridGroup, xScale, yScale, width, height, currentTransform } = scatterChart;
    
    // Clear previous grid
    gridGroup.selectAll('*').remove();
    
    // Create transformed scales
    const transformedXScale = currentTransform.rescaleX(xScale);
    
    // Vertical grid lines (magnitude)
    const xTicks = transformedXScale.ticks(8);
    gridGroup.selectAll('.grid-x')
        .data(xTicks)
        .enter()
        .append('line')
        .attr('class', 'grid-x')
        .attr('x1', d => transformedXScale(d))
        .attr('x2', d => transformedXScale(d))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', 'rgba(255, 107, 71, 0.1)')
        .attr('stroke-width', 1);
    
    // Horizontal grid lines (deaths)
    const yTicks = yScale.ticks(6);
    gridGroup.selectAll('.grid-y')
        .data(yTicks)
        .enter()
        .append('line')
        .attr('class', 'grid-y')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', 'rgba(255, 107, 71, 0.1)')
        .attr('stroke-width', 1);
}

// Draw D3.js data points
function drawD3DataPoints() {
    const { dataGroup, xScale, yScale, currentTransform } = scatterChart;
    
    // Create transformed scales
    const transformedXScale = currentTransform.rescaleX(xScale);
    
    // Bind data to circles
    const circles = dataGroup.selectAll('.data-point')
        .data(filteredData, d => `${d.magnitude}-${d.deaths}-${d.year}-${d.country}`);
    
    // Remove old points
    circles.exit().remove();
    
    // Add new points
    circles.enter()
        .append('circle')
        .attr('class', 'data-point')
        .merge(circles)
        .attr('cx', d => transformedXScale(d.magnitude))
        .attr('cy', d => yScale(d.deaths))
        .attr('r', d => {
            const isSelected = selectedEarthquakes.some(selected => 
                selected.magnitude === d.magnitude && 
                selected.deaths === d.deaths && 
                selected.year === d.year && 
                selected.country === d.country
            );
            return isSelected ? 4 : 3;
        })
        .attr('fill', d => {
            const isSelected = selectedEarthquakes.some(selected => 
                selected.magnitude === d.magnitude && 
                selected.deaths === d.deaths && 
                selected.year === d.year && 
                selected.country === d.country
            );
            return isSelected ? '#00ff88' : '#ff6b47';
        })
        .attr('stroke', d => {
            const isSelected = selectedEarthquakes.some(selected => 
                selected.magnitude === d.magnitude && 
                selected.deaths === d.deaths && 
                selected.year === d.year && 
                selected.country === d.country
            );
            return isSelected ? '#00ff88' : '#ff6b47';
        })
        .attr('stroke-width', d => {
            const isSelected = selectedEarthquakes.some(selected => 
                selected.magnitude === d.magnitude && 
                selected.deaths === d.deaths && 
                selected.year === d.year && 
                selected.country === d.country
            );
            return isSelected ? 2 : 0.5;
        })
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            // Only show tooltip if brush mode is disabled
            if (!scatterChart.isBrushEnabled || !scatterChart.isBrushEnabled()) {
                showD3Tooltip(event, d);
            }
        })
        .on('mouseout', function() {
            // Only hide tooltip if brush mode is disabled
            if (!scatterChart.isBrushEnabled || !scatterChart.isBrushEnabled()) {
                hideD3Tooltip();
            }
        });
}

// Draw D3.js axes
function drawD3Axes() {
    const { axisGroup, xScale, yScale, width, height, currentTransform } = scatterChart;
    
    // Clear previous axes
    axisGroup.selectAll('*').remove();
    
    // Create transformed scales
    const transformedXScale = currentTransform.rescaleX(xScale);
    
    // Create axes
    const xAxis = d3.axisBottom(transformedXScale)
        .ticks(8)
        .tickFormat(d => d.toFixed(1));
    
    const yAxis = d3.axisLeft(yScale)
        .ticks(6)
        .tickFormat(d => d === 0 ? '0' : d3.format('.1s')(d));
    
    // Add X axis
    axisGroup.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .selectAll('text')
        .style('fill', '#ff6b47')
        .style('font-size', '12px');
    
    // Add Y axis
    axisGroup.append('g')
        .attr('class', 'y-axis')
        .call(yAxis)
        .selectAll('text')
        .style('fill', '#ff6b47')
        .style('font-size', '12px');
    
    // Style axis lines and ticks
    axisGroup.selectAll('.domain, .tick line')
        .style('stroke', '#ff6b47');
    
    // Add axis labels
    axisGroup.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', width / 2)
        .attr('y', height + 45)
        .style('text-anchor', 'middle')
        .style('fill', '#ff6b47')
        .style('font-size', '14px')
        .text('Earthquake Magnitude');
    
    axisGroup.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -50)
        .style('text-anchor', 'middle')
        .style('fill', '#ff6b47')
        .style('font-size', '14px')
        .text('Deaths');
}

// Clean D3.js brush system implementation with proper cursor management
function setupD3Interactions() {
    const { svg, chartGroup } = scatterChart;
    
    // Brush state management
    let brushEnabled = false;
    let currentBrush = null;
    let brushGroup = null;
    
    // Create brush instance with proper coordinate handling
    function createBrush() {
        return d3.brush()
            .extent([[0, 0], [scatterChart.width, scatterChart.height]])
            .on('start', handleBrushStart)
            .on('brush', handleBrushMove)
            .on('end', handleBrushEnd)
            .filter(function(event) {
                // Ensure all mouse events are captured properly
                return !event.ctrlKey && !event.button;
            });
    }
    
    // Enable brushing mode with proper cursor management
    function enableBrushing() {
        if (brushEnabled) return;
        
        console.log('Enabling brush mode with permanent fixes applied');
        brushEnabled = true;
        
        // Remove any existing brush first
        chartGroup.selectAll('.brush-group').remove();
        
        // Create a dedicated group for the brush with explicit positioning
        brushGroup = chartGroup.append('g')
            .attr('class', 'brush-group')
            .attr('transform', 'translate(0,0)'); // Ensure no translation issues
        
        // Create and apply new brush
        currentBrush = createBrush();
        brushGroup.call(currentBrush);
        
        // Force brush to recognize the full area and disable conflicting behaviors
        brushGroup.select('.overlay')
            .attr('cursor', 'crosshair')
            .style('pointer-events', 'all')
            .on('mousedown.zoom', null)  // Disable zoom during brush
            .on('touchstart.zoom', null)
            .on('dblclick.zoom', null);
        
        // Temporarily disable zoom while brushing
        if (scatterChart.zoomBehavior) {
            svg.on('.zoom', null);
        }
        
        // Ensure brush selection is visible with proper styling
        brushGroup.selectAll('.selection')
            .style('fill', 'rgba(0, 255, 136, 0.1)')
            .style('stroke', '#00ff88')
            .style('stroke-width', '2px')
            .style('stroke-dasharray', '5,5');
        
        // Set cursor styles on all relevant elements
        svg.style('cursor', 'crosshair');
        chartGroup.style('cursor', 'crosshair');
        brushGroup.style('cursor', 'crosshair');
        
        // Ensure brush overlay and selection get crosshair cursor
        brushGroup.selectAll('.overlay').style('cursor', 'crosshair');
        brushGroup.selectAll('.selection').style('cursor', 'crosshair');
        
        // Override data point cursors during brush mode
        chartGroup.selectAll('.data-point').style('cursor', 'crosshair');
    }
    
    // Disable brushing mode with complete cleanup
    function disableBrushing() {
        if (!brushEnabled) return;
        
        console.log('Disabling brush mode');
        brushEnabled = false;
        
        // Remove brush interface but KEEP the selection data
        if (currentBrush && brushGroup) {
            brushGroup.call(currentBrush.move, null);
        }
        
        // Completely remove the brush group
        chartGroup.selectAll('.brush-group').remove();
        brushGroup = null;
        currentBrush = null;
        
        // Reset all cursors
        resetAllCursors();
        
        // Re-enable zoom functionality
        if (scatterChart.zoomBehavior) {
            svg.call(scatterChart.zoomBehavior);
        }
        
        // DON'T clear selection data - keep it persistent
        // selectedEarthquakes = [];
        // updateSelectionStatistics();
        // updateD3DataPoints();
        
        console.log(`Brush disabled, keeping ${selectedEarthquakes.length} selected earthquakes`);
    }
    
    // Comprehensive cursor reset function
    function resetAllCursors() {
        // Reset SVG and chart group cursors
        svg.style('cursor', null);
        chartGroup.style('cursor', null);
        
        // Reset data points to pointer cursor
        chartGroup.selectAll('.data-point').style('cursor', 'pointer');
        
        // Remove any lingering brush elements and their cursors
        d3.selectAll('.brush').remove();
        d3.selectAll('.brush-group').remove();
        
        // Clear any inline cursor styles that might have been set
        svg.node().style.cursor = '';
        chartGroup.node().style.cursor = '';
        
        // Ensure document body cursor is reset
        document.body.style.cursor = '';
    }
    
    // Brush event handlers
    function handleBrushStart(event) {
        if (!brushEnabled) return;
        
        // Clear previous selection
        selectedEarthquakes = [];
        updateSelectionStatistics();
        
        // Maintain crosshair during brushing
        if (event.sourceEvent) {
            event.sourceEvent.stopPropagation();
        }
    }
    
    function handleBrushMove(event) {
        if (!brushEnabled || !event.selection) return;
        
        const [[x0, y0], [x1, y1]] = event.selection;
        
        // DEBUG: Log the raw coordinates to see what's happening
        console.log(`🔧 RAW BRUSH: x0=${x0.toFixed(1)}, y0=${y0.toFixed(1)}, x1=${x1.toFixed(1)}, y1=${y1.toFixed(1)}`);
        console.log(`🔧 DIMENSIONS: width=${Math.abs(x1-x0).toFixed(1)}, height=${Math.abs(y1-y0).toFixed(1)}`);
        
        // The main issue: if width is 0, we're only capturing vertical lines!
        if (Math.abs(x1 - x0) < 1) {
            console.warn(`⚠️  BRUSH WIDTH IS ${Math.abs(x1-x0).toFixed(1)}px - Only capturing vertical line!`);
            console.warn(`⚠️  This indicates a D3 brush setup issue`);
        }
        
        // Convert brush coordinates to data coordinates
        const { xScale, yScale, currentTransform } = scatterChart;
        const transformedXScale = currentTransform.rescaleX(xScale);
        
        // Get data ranges (ensure correct min/max)
        const magMin = transformedXScale.invert(Math.min(x0, x1));
        const magMax = transformedXScale.invert(Math.max(x0, x1));
        const deathMin = yScale.invert(Math.max(y0, y1)); // Max y = min deaths (inverted axis)
        const deathMax = yScale.invert(Math.min(y0, y1)); // Min y = max deaths
        
        // DEBUG: Log coordinate transformations
        console.log(`🔧 SCALES: magMin=${magMin.toFixed(3)}, magMax=${magMax.toFixed(3)} (diff=${(magMax-magMin).toFixed(3)})`);
        console.log(`🔧 SCALES: deathMin=${deathMin.toFixed(0)}, deathMax=${deathMax.toFixed(0)} (diff=${(deathMax-deathMin).toFixed(0)})`);
        
        // Ensure we have data
        if (!filteredData || filteredData.length === 0) {
            console.warn('No filtered data available for brush selection');
            selectedEarthquakes = [];
            return;
        }
        
        // Select earthquakes within the brush area - use window.selectedEarthquakes
        window.selectedEarthquakes = filteredData.filter(d => {
            // Check both conditions
            const inMagRange = d.magnitude >= magMin && d.magnitude <= magMax;
            const inDeathRange = d.deaths >= deathMin && d.deaths <= deathMax;
            return inMagRange && inDeathRange;
        });
        
        console.log(`Brush selection: ${window.selectedEarthquakes.length} earthquakes selected (${Math.abs(x1-x0).toFixed(0)}x${Math.abs(y1-y0).toFixed(0)}px)`);
        
        // Debug if no selection
        if (window.selectedEarthquakes.length === 0) {
            console.log(`🔍 No selection - Mag: ${magMin.toFixed(2)}-${magMax.toFixed(2)}, Deaths: ${deathMin.toFixed(0)}-${deathMax.toFixed(0)}`);
            console.log(`🔍 Sample data:`, filteredData.slice(0, 3).map(d => `${d.magnitude}M, ${d.deaths}d`));
            
            // Test if it's a coordinate system issue
            if (Math.abs(magMax - magMin) < 0.01) {
                console.warn(`🚨 MAGNITUDE RANGE TOO NARROW: ${(magMax-magMin).toFixed(4)} - brush not capturing X dimension!`);
            }
        } else {
            console.log(`✅ SUCCESS: Selected ${window.selectedEarthquakes.length} earthquakes`);
        }
        
        // Update visual selection
        updateSelectionHighlights();
        
        // Ensure brush selection styling persists
        if (brushGroup) {
            brushGroup.selectAll('.selection')
                .style('fill', 'rgba(0, 255, 136, 0.1)')
                .style('stroke', '#00ff88')
                .style('stroke-width', '2px')
                .style('stroke-dasharray', '5,5');
        }
        
        // Update statistics display (with debouncing)
        clearTimeout(window.brushStatsTimeout);
        window.brushStatsTimeout = setTimeout(() => {
            updateSelectionStatistics();
        }, 50);
    }
    
    function handleBrushEnd(event) {
        if (!brushEnabled) return;
        
        if (!event.selection) {
            // Clear selection if no brush area
            selectedEarthquakes = [];
            updateSelectionStatistics();
            updateD3DataPoints();
        }
        
        console.log(`Selection complete: ${selectedEarthquakes.length} earthquakes`);
    }
    
    // Efficient selection highlighting
    function updateSelectionHighlights() {
        if (!scatterChart || !scatterChart.dataGroup) {
            console.warn('ScatterChart or dataGroup not available for selection highlighting');
            return;
        }
        
        scatterChart.dataGroup.selectAll('.data-point')
            .attr('fill', d => isEarthquakeSelected(d) ? '#00ff88' : '#ff6b47')
            .attr('r', d => isEarthquakeSelected(d) ? 4 : 3)
            .attr('stroke-width', d => isEarthquakeSelected(d) ? 2 : 0.5)
            .attr('stroke', d => isEarthquakeSelected(d) ? '#00ff88' : '#ff6b47');
    }
    
    // FIX 5: Update isEarthquakeSelected to use global variable
    function isEarthquakeSelected(earthquake) {
        return (window.selectedEarthquakes || []).some(selected => 
            selected.magnitude === earthquake.magnitude && 
            selected.deaths === earthquake.deaths && 
            selected.year === earthquake.year && 
            selected.country === earthquake.country
        );
    }
    
    // Keyboard event handlers with better state management
    function handleKeyDown(event) {
        // Only respond to Shift key, ignore if already pressed
        if (event.key === 'Shift' && !event.repeat && !brushEnabled) {
            enableBrushing();
        }
    }
    
    function handleKeyUp(event) {
        // Disable on any Shift key release
        if (event.key === 'Shift' && brushEnabled) {
            disableBrushing();
        }
    }
    
    function handleWindowBlur() {
        // Disable brush mode when window loses focus
        if (brushEnabled) {
            disableBrushing();
        }
    }
    
    // Clean up any existing event listeners
    if (window.brushEventCleanup) {
        window.brushEventCleanup();
    }
    
    // Create cleanup function
    window.brushEventCleanup = function() {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleWindowBlur);
        
        // Ensure brush is disabled and cursors are reset
        if (brushEnabled) {
            disableBrushing();
        }
        resetAllCursors();
    };
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    
    // Store state accessors and methods
    scatterChart.isBrushEnabled = () => brushEnabled;
    scatterChart.clearBrush = () => {
        if (currentBrush && brushGroup) {
            brushGroup.call(currentBrush.move, null);
        }
        selectedEarthquakes = [];
        updateSelectionStatistics();
        updateSelectionHighlights(); // Use the new highlighting function
        console.log('Manual brush selection cleared');
    };
    scatterChart.disableBrush = disableBrushing;
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', window.brushEventCleanup);
    
    console.log('D3 interactions setup complete');
}
function handleD3Zoom(event) {
    const { transform } = event;
    const { xScale, width } = scatterChart;

    // Enforce minimum zoom (no zoom-out past initial scale)
    let k = transform.k < 1 ? 1 : transform.k;

    // Clamp translation so the domain [5.0,9.5] always stays within [0,width]
    // xScale(5.0) = 0; xScale(9.5) = width
    // After scaling: domain pixel positions = xScale(value)*k + x
    // To ensure xScale(5.0)*k + x >= 0 => x >= 0
    // To ensure xScale(9.5)*k + x <= width => x <= width - width*k
    const minX = 0; // because x >= 0
    const maxX = width - width * k;
    let x = transform.x;
    if (x < maxX) x = maxX;
    if (x > minX) x = minX;

    // Apply the clamped transform
    scatterChart.currentTransform = d3.zoomIdentity.translate(x, 0).scale(k);
    updateScatterChart();
}

// More efficient brush functions


// Draw D3.js prediction overlay
function drawD3PredictionOverlay() {
    if (!userPredictionPoints.length || !xScale || !yScale) return;
    
    const { predictionGroup, xScale: scatterXScale, yScale: scatterYScale, currentTransform } = scatterChart;
    
    // Clear previous prediction
    predictionGroup.selectAll('*').remove();
    
    // Create transformed scale
    const transformedXScale = currentTransform.rescaleX(scatterXScale);
    
    // Convert prediction points to scatter chart coordinates
    const predictionData = userPredictionPoints
        .map(point => {
            // Convert from prediction SVG coordinates to data values
            const magnitude = xScale.invert(point.x);
            const deaths = yScale.invert(point.y);
            
            // Check if point is valid
            if (magnitude >= 5.0 && magnitude <= 9.5 && deaths >= 0) {
                return {
                    x: transformedXScale(magnitude),
                    y: scatterYScale(deaths)
                };
            }
            return null;
        })
        .filter(d => d !== null);
    
    if (predictionData.length > 1) {
        // Create line generator
        const line = d3.line()
            .x(d => d.x)
            .y(d => d.y)
            .curve(d3.curveLinear);
        
        // Draw prediction line
        predictionGroup.append('path')
            .datum(predictionData)
            .attr('fill', 'none')
            .attr('stroke', '#00ff88')
            .attr('stroke-width', 3)
            .attr('stroke-dasharray', '5,5')
            .attr('opacity', 0.8)
            .attr('d', line);
        
        // Add prediction label
        predictionGroup.append('text')
            .attr('x', scatterChart.width - 10)
            .attr('y', 20)
            .attr('text-anchor', 'end')
            .attr('fill', '#00ff88')
            .attr('font-size', '12px')
            .text('Your Prediction');
    }
}

// D3.js tooltip functions
function showD3Tooltip(event, d) {
    // Remove existing tooltip
    d3.select('body').selectAll('.d3-tooltip').remove();
    
    // Create tooltip
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'd3-tooltip')
        .style('position', 'absolute')
        .style('background', 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(26, 26, 26, 0.9))')
        .style('border', '1px solid #ff5757')
        .style('border-radius', '8px')
        .style('padding', '12px')
        .style('color', '#ffffff')
        .style('font-size', '14px')
        .style('pointer-events', 'none')
        .style('z-index', '1000')
        .style('backdrop-filter', 'blur(15px)')
        .style('box-shadow', '0 8px 25px rgba(0,0,0,0.4)')
        .style('opacity', '0');
    
    // Add content
    tooltip.html(`
        <div style="color: #ff5757; font-weight: 500; margin-bottom: 8px;">${d.location || d.country}</div>
        <div><strong>Magnitude:</strong> ${d.magnitude}</div>
        <div><strong>Deaths:</strong> ${d.deaths.toLocaleString()}</div>
        <div><strong>Year:</strong> ${d.year}</div>
        <div><strong>Country:</strong> ${d.country}</div>
    `);
    
    // Position tooltip
    const [mouseX, mouseY] = d3.pointer(event, document.body);
    tooltip
        .style('left', (mouseX + 10) + 'px')
        .style('top', (mouseY - 10) + 'px')
        .transition()
        .duration(200)
        .style('opacity', '1');
}

function hideD3Tooltip() {
    // Immediately remove all tooltips without transition for instant cleanup
    d3.select('body').selectAll('.d3-tooltip').remove();
    
    // Also try common tooltip class names as fallback
    d3.select('body').selectAll('.tooltip').remove();
    d3.select('body').selectAll('[class*="tooltip"]').remove();
}

// Helper function to update just the data points
function updateD3DataPoints() {
    drawD3DataPoints();
}

// Ensure the stats panel HTML exists
function ensureStatsPanelExists() {
    if (!document.getElementById('selection-stats')) {
        console.log('Creating stats panel...');
        
        const statsHTML = `
        <div class="selection-stats" id="selection-stats" style="display: none;">
            <div class="selection-header">
                <h4>Brush Selection</h4>
                <button class="clear-selection-btn" onclick="clearBrushSelection()">×</button>
            </div>
            <div class="selection-grid">
                <div class="selection-item">
                    <div class="selection-label">Count</div>
                    <div class="selection-value" id="selected-count">0</div>
                </div>
                <div class="selection-item">
                    <div class="selection-label">Mag Range</div>
                    <div class="selection-value" id="selected-mag-range">-</div>
                </div>
                <div class="selection-item">
                    <div class="selection-label">Total Deaths</div>
                    <div class="selection-value" id="selected-total-deaths">0</div>
                </div>
                <div class="selection-item">
                    <div class="selection-label">Avg Deaths</div>
                    <div class="selection-value" id="selected-avg-deaths">0</div>
                </div>
                <div class="selection-item">
                    <div class="selection-label">Deadliest</div>
                    <div class="selection-value" id="selected-deadliest">-</div>
                </div>
                <div class="selection-item">
                    <div class="selection-label">Countries</div>
                    <div class="selection-value" id="selected-countries">0</div>
                </div>
            </div>
        </div>`;
        
        // Find chart container and add stats panel
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.insertAdjacentHTML('beforeend', statsHTML);
            console.log('✅ Stats panel created');
        } else {
            console.error('❌ Could not find chart container for stats panel');
        }
    }
}

// Clear brush selection using new system
// FIX 7: Clear selection function that uses global variable
function clearBrushSelection() {
    console.log('Clearing brush selection');
    
    // Clear global variable
    window.selectedEarthquakes = [];
    
    // Update statistics
    updateSelectionStatistics();
    
    // Update visual selection
    if (scatterChart && scatterChart.dataGroup) {
        scatterChart.dataGroup.selectAll('.data-point')
            .attr('fill', '#ff6b47')
            .attr('r', 3)
            .attr('stroke-width', 0.5)
            .attr('stroke', '#ff6b47');
    }
    
    // Clear brush if exists
    if (scatterChart && scatterChart.clearBrush) {
        scatterChart.clearBrush();
    }
    
    console.log('Brush selection cleared');
}

// Update brush selection statistics display
// FIX 3: Update updateSelectionStatistics to use window.selectedEarthquakes
function updateSelectionStatistics() {
    // Use window.selectedEarthquakes explicitly
    const earthquakes = window.selectedEarthquakes || [];
    console.log('updateSelectionStatistics called with', earthquakes.length, 'earthquakes from window.selectedEarthquakes');
    
    const statsPanel = document.getElementById('selection-stats');
    if (!statsPanel) {
        console.error('Stats panel not found!');
        return;
    }
    
    if (earthquakes.length === 0) {
        console.log('No earthquakes selected, hiding stats panel');
        statsPanel.style.display = 'none';
        return;
    }
    
    console.log('Showing stats panel for', earthquakes.length, 'earthquakes');
    statsPanel.style.display = 'block';
    
    // Calculate statistics
    const count = earthquakes.length;
    const magnitudes = earthquakes.map(d => d.magnitude);
    const deaths = earthquakes.map(d => d.deaths);
    const countries = [...new Set(earthquakes.map(d => d.country))];
    
    const minMag = Math.min(...magnitudes);
    const maxMag = Math.max(...magnitudes);
    const totalDeaths = deaths.reduce((sum, d) => sum + d, 0);
    const avgDeaths = Math.round(totalDeaths / count);
    
    // Find deadliest earthquake
    const deadliest = earthquakes.reduce((max, current) => 
        current.deaths > max.deaths ? current : max
    );
    
    // Update display elements
    document.getElementById('selected-count').textContent = count.toLocaleString();
    document.getElementById('selected-mag-range').textContent = `${minMag.toFixed(1)} - ${maxMag.toFixed(1)}`;
    document.getElementById('selected-total-deaths').textContent = totalDeaths.toLocaleString();
    document.getElementById('selected-avg-deaths').textContent = avgDeaths.toLocaleString();
    document.getElementById('selected-deadliest').textContent = 
        `${deadliest.location || deadliest.country} (${deadliest.deaths.toLocaleString()})`;
    document.getElementById('selected-countries').textContent = countries.length.toString();
}

// Toggle user prediction overlay
function toggleUserPrediction() {
    // Just trigger a redraw - the prediction will be drawn if the toggle is checked
    if (scatterChart) {
        updateScatterChart();
    }
}

// Initialize brush system with permanent fixes
function initializeBrushSystem() {
    console.log('🎯 Initializing brush system with permanent fixes applied...');
    
    // Ensure stats panel exists
    ensureStatsPanelExists();
    
    // Initialize selected earthquakes array
    window.selectedEarthquakes = window.selectedEarthquakes || [];
    selectedEarthquakes = window.selectedEarthquakes;
    
    // Set up D3 interactions (brush)
    if (scatterChart) {
        setupD3Interactions();
        console.log('✅ Brush system initialized');
    } else {
        console.error('❌ ScatterChart not available for brush initialization');
    }
}

// Debug helper functions
function runBrushDebugChecks() {
    console.log('🔍 Running brush debug checks...');
    
    // Check global variable
    console.log('1. selectedEarthquakes exists:', typeof selectedEarthquakes !== 'undefined');
    console.log('   Value:', selectedEarthquakes);
    
    // Check data
    console.log('2. filteredData:', filteredData ? `${filteredData.length} items` : 'not loaded');
    
    // Check stats panel elements
    const statsPanel = document.getElementById('selection-stats');
    console.log('3. Stats panel exists:', !!statsPanel);
    
    const requiredIds = ['selected-count', 'selected-mag-range', 'selected-total-deaths', 
                        'selected-avg-deaths', 'selected-deadliest', 'selected-countries'];
    requiredIds.forEach(id => {
        console.log(`   ${id}:`, !!document.getElementById(id));
    });
    
    // Check chart components
    console.log('4. scatterChart exists:', !!scatterChart);
    if (scatterChart) {
        console.log('   dataGroup exists:', !!scatterChart.dataGroup);
        console.log('   xScale exists:', !!scatterChart.xScale);
        console.log('   yScale exists:', !!scatterChart.yScale);
        console.log('   currentTransform exists:', !!scatterChart.currentTransform);
    }
    
    // Check brush system
    console.log('5. setupD3Interactions function exists:', typeof setupD3Interactions === 'function');
    
    return {
        selectedEarthquakes: typeof selectedEarthquakes !== 'undefined',
        filteredData: !!filteredData,
        statsPanel: !!statsPanel,
        scatterChart: !!scatterChart,
        allElementsExist: requiredIds.every(id => !!document.getElementById(id))
    };
}

function testBrushSystem() {
    console.log('🧪 Testing brush system...');
    
    const debugResults = runBrushDebugChecks();
    
    if (!debugResults.allElementsExist) {
        console.log('⚠️  Missing elements, attempting to create stats panel...');
        ensureStatsPanelExists();
    }
    
    // Try selecting some data manually
    if (filteredData && filteredData.length > 0) {
        selectedEarthquakes = filteredData.slice(0, 5);
        console.log('📋 Manually selected 5 earthquakes:', selectedEarthquakes.map(d => `${d.magnitude}M, ${d.deaths} deaths`));
        updateSelectionStatistics();
        console.log('✅ Stats should now be visible');
    } else {
        console.log('❌ No data available for testing');
    }
    
    return debugResults;
}

// Make functions globally available for console testing
window.runBrushDebugChecks = runBrushDebugChecks;
window.testBrushSystem = testBrushSystem;

// FIX 6: Debug function to check why selection might be failing
function debugBrushSelection() {
    console.log('=== BRUSH SELECTION DEBUG ===');
    
    // Check data
    console.log('1. Data check:');
    console.log('   filteredData:', filteredData ? filteredData.length + ' items' : 'undefined');
    if (filteredData && filteredData.length > 0) {
        const sample = filteredData.slice(0, 5);
        console.log('   Sample data:');
        sample.forEach(d => {
            console.log(`     Mag=${d.magnitude}, Deaths=${d.deaths}, Country=${d.country}`);
        });
        
        // Check data distribution
        const magRange = d3.extent(filteredData, d => d.magnitude);
        const deathRange = d3.extent(filteredData, d => d.deaths);
        console.log(`   Magnitude range: ${magRange[0]} to ${magRange[1]}`);
        console.log(`   Deaths range: ${deathRange[0]} to ${deathRange[1]}`);
    }
    
    // Test manual selection
    console.log('\n2. Testing manual selection:');
    if (filteredData && filteredData.length >= 5) {
        // Select earthquakes with magnitude between 6 and 7
        window.selectedEarthquakes = filteredData.filter(d => 
            d.magnitude >= 6.0 && d.magnitude <= 7.0
        );
        console.log(`   Selected ${window.selectedEarthquakes.length} earthquakes with magnitude 6-7`);
        
        // Force update
        updateSelectionStatistics();
        
        // Make stats panel visible
        const panel = document.getElementById('selection-stats');
        if (panel) {
            panel.style.display = 'block';
            panel.style.border = '3px solid lime';
            console.log('   Stats panel should be visible with lime border');
        }
    }
}

// FIX 7: Run this to test everything
function testBrushFix() {
    console.log('=== TESTING BRUSH FIX ===');
    
    // First ensure the stats panel is visible
    const panel = document.getElementById('selection-stats');
    if (panel) {
        panel.style.display = 'block';
        panel.style.border = '3px solid cyan';
    }
    
    // Test with manual selection
    if (filteredData && filteredData.length > 0) {
        // Find some earthquakes with significant deaths
        const significantQuakes = filteredData
            .filter(d => d.deaths > 1000)
            .slice(0, 10);
        
        if (significantQuakes.length > 0) {
            window.selectedEarthquakes = significantQuakes;
            console.log(`Selected ${significantQuakes.length} earthquakes with >1000 deaths`);
            updateSelectionStatistics();
            console.log('Stats panel should show data now');
        } else {
            // If no significant quakes, just take first 10
            window.selectedEarthquakes = filteredData.slice(0, 10);
            console.log('Selected first 10 earthquakes');
            updateSelectionStatistics();
        }
    }
}

// Make debug functions globally available
window.debugBrushSelection = debugBrushSelection;
window.testBrushFix = testBrushFix;

// Additional debug function to test brush coordinates
function testBrushCoordinates() {
    console.log('=== TESTING BRUSH COORDINATES ===');
    
    if (!scatterChart) {
        console.error('No scatter chart found');
        return;
    }
    
    // Get chart dimensions
    console.log('Chart dimensions:', {
        width: scatterChart.width,
        height: scatterChart.height,
        margin: scatterChart.margin
    });
    
    // Test scale domains
    console.log('Scale domains:', {
        x: scatterChart.xScale.domain(),
        y: scatterChart.yScale.domain()
    });
    
    // Test a few data points
    if (filteredData && filteredData.length > 0) {
        const testPoints = filteredData.slice(0, 3);
        console.log('Test point positions:');
        testPoints.forEach(d => {
            const x = scatterChart.xScale(d.magnitude);
            const y = scatterChart.yScale(d.deaths);
            console.log(`  Mag ${d.magnitude}, Deaths ${d.deaths} => (${x.toFixed(1)}, ${y.toFixed(1)})`);
        });
    }
    
    // Create a test selection programmatically
    if (scatterChart.brushGroup && scatterChart.currentBrush) {
        // Select middle 50% of chart
        const x0 = scatterChart.width * 0.25;
        const x1 = scatterChart.width * 0.75;
        const y0 = scatterChart.height * 0.25;
        const y1 = scatterChart.height * 0.75;
        
        console.log('Creating test selection:', { x0, y0, x1, y1 });
        
        // Programmatically set brush selection
        scatterChart.brushGroup
            .call(scatterChart.currentBrush.move, [[x0, y0], [x1, y1]]);
    }
}

// PERMANENTLY APPLIED: Brush fixes now automatically integrated
function applyBrushFix() {
    console.log('🔧 Brush fixes are now permanently applied during initialization');
    console.log('✅ No need to run this manually anymore - brush should work correctly');
    console.log('📝 Hold Shift and drag to select earthquakes');
}

// FIX: Critical brush debugging function
function diagnoseBrushSetup() {
    console.log('=== BRUSH SETUP DIAGNOSIS ===');
    
    if (!scatterChart) {
        console.error('❌ No scatterChart found');
        return;
    }
    
    console.log('📊 Chart info:', {
        width: scatterChart.width,
        height: scatterChart.height,
        xScale: scatterChart.xScale ? 'exists' : 'missing',
        yScale: scatterChart.yScale ? 'exists' : 'missing',
        currentTransform: scatterChart.currentTransform ? 'exists' : 'missing'
    });
    
    if (scatterChart.xScale) {
        console.log('🔍 X Scale domain:', scatterChart.xScale.domain());
        console.log('🔍 X Scale range:', scatterChart.xScale.range());
    }
    
    if (scatterChart.yScale) {
        console.log('🔍 Y Scale domain:', scatterChart.yScale.domain());
        console.log('🔍 Y Scale range:', scatterChart.yScale.range());
    }
    
    // Check brush groups
    const brushGroups = d3.selectAll('.brush-group');
    console.log('🖌️ Brush groups found:', brushGroups.size());
    
    if (brushGroups.size() > 0) {
        brushGroups.each(function(d, i) {
            const group = d3.select(this);
            console.log(`🖌️ Brush group ${i}:`, {
                transform: group.attr('transform'),
                selection: group.select('.selection').size() > 0 ? 'has selection' : 'no selection',
                overlay: group.select('.overlay').size() > 0 ? 'has overlay' : 'no overlay'
            });
        });
    }
    
    // Test manual brush creation
    console.log('🧪 Testing manual brush creation...');
    if (scatterChart.width && scatterChart.height) {
        const testBrush = d3.brush()
            .extent([[0, 0], [scatterChart.width, scatterChart.height]]);
        
        console.log('✅ Manual brush created successfully');
        console.log('📏 Brush extent:', testBrush.extent());
        
        // Test coordinates
        const testCoords = [[100, 50], [200, 150]];
        console.log('🧪 Test coordinates:', testCoords);
        
        // Simulate what should happen
        const [[tx0, ty0], [tx1, ty1]] = testCoords;
        const tMagMin = scatterChart.xScale.invert(Math.min(tx0, tx1));
        const tMagMax = scatterChart.xScale.invert(Math.max(tx0, tx1));
        console.log(`🧪 Would convert to magnitude range: ${tMagMin.toFixed(2)} - ${tMagMax.toFixed(2)}`);
        
        if (Math.abs(tMagMax - tMagMin) > 0.1) {
            console.log('✅ Coordinate conversion working correctly');
        } else {
            console.error('❌ Coordinate conversion problem detected');
        }
    }
}

// Make all test functions globally available
window.testBrushCoordinates = testBrushCoordinates;
window.applyBrushFix = applyBrushFix;
window.diagnoseBrushSetup = diagnoseBrushSetup;

// Navigation Functions
function setupNavigation() {
    console.log('🧭 Setting up navigation menu...');
    
    // Initialize nav menu state
    updateNavigationActive('intro');
}

function navigateToSection(sectionName) {
    const sectionMap = {
        'intro': 0,
        'main': 100,
        'story': 200,
        'but': 300,
        'exploration': 400,
        'japan': 500
    };
    
    const targetScroll = (sectionMap[sectionName] || 0) * window.innerHeight / 100;
    
    // Check if section is accessible
    if (sectionName === 'but' || sectionName === 'exploration') {
        if (!window.storyCompleted) {
            console.log('📚 Section locked - complete the story first');
            // You could show a notification here
            return;
        }
    }
    
    console.log(`🧭 Navigating to ${sectionName} section (${targetScroll}px)`);
    window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
    });
    
    // Update active state
    updateNavigationActive(sectionName);
}

function updateNavigationActive(currentSection) {
    const navLinks = document.querySelectorAll('.nav-menu a[data-section]');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === currentSection) {
            link.classList.add('active');
        }
    });
    
    console.log(`🧭 Navigation active state updated: ${currentSection}`);
}

// Exploration Section Functions
function initializeExplorationSection() {
    console.log('🔓 Initializing exploration section...');
    
    // Ensure we have earthquake data
    if (!earthquakeData || earthquakeData.length === 0) {
        console.log('⏳ Waiting for earthquake data...');
        setTimeout(() => initializeExplorationSection(), 100);
        return;
    }
    
    // Setup explore data controls (exact copy of but section functionality)
    setupExploreDataControls();
    
    // Initialize explore scatter chart
    initializeExploreScatterChart();
    
    // Initialize filtered data to full dataset
    window.filteredExploreData = earthquakeData;
    
    // Apply initial filters to explore chart
    updateExploreFilters();
    
    console.log('✅ Exploration section fully initialized with', earthquakeData.length, 'earthquakes');
}

function setupExploreDataControls() {
    console.log('Setting up explore data controls...');
    
    // Setup magnitude slider
    setupDualSliderExplore('magnitude', 0, 10, 0.1, updateExploreFilters);
    
    // Setup deaths slider  
    setupDualSliderExplore('deaths', 0, 1000000, 1000, updateExploreFilters);
    
    // Setup country filter
    const countrySelect = document.getElementById('country-filter-explore');
    if (countrySelect && earthquakeData.length > 0) {
        const countries = [...new Set(earthquakeData.map(d => d.country).filter(c => c))].sort();
        countrySelect.innerHTML = '<option value="">All Countries</option>';
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
        countrySelect.addEventListener('change', updateExploreFilters);
    }
    
    // Setup prediction toggle
    const predictionToggle = document.getElementById('show-prediction-explore');
    if (predictionToggle) {
        predictionToggle.addEventListener('change', updateExploreScatterChart);
    }
}

function setupDualSliderExplore(type, min, max, step, callback) {
    const minSlider = document.getElementById(`${type}-min-explore`);
    const maxSlider = document.getElementById(`${type}-max-explore`);
    const display = document.getElementById(`${type}-range-display-explore`);
    
    if (!minSlider || !maxSlider || !display) return;
    
    minSlider.min = min;
    minSlider.max = max;
    minSlider.step = step;
    minSlider.value = min;
    
    maxSlider.min = min;
    maxSlider.max = max;
    maxSlider.step = step;
    maxSlider.value = max;
    
    function updateDisplay() {
        const minVal = parseFloat(minSlider.value);
        const maxVal = parseFloat(maxSlider.value);
        
        // Ensure min <= max
        if (minVal >= maxVal) {
            minSlider.value = maxVal - step;
        }
        if (maxVal <= minVal) {
            maxSlider.value = minVal + step;
        }
        
        const displayMin = type === 'deaths' ? 
            parseInt(minSlider.value).toLocaleString() : 
            parseFloat(minSlider.value).toFixed(1);
        const displayMax = type === 'deaths' ? 
            parseInt(maxSlider.value).toLocaleString() : 
            parseFloat(maxSlider.value).toFixed(1);
        
        display.textContent = `${displayMin} - ${displayMax}`;
    }
    
    minSlider.addEventListener('input', () => {
        updateDisplay();
        callback();
    });
    
    maxSlider.addEventListener('input', () => {
        updateDisplay();
        callback();
    });
    
    updateDisplay();
}

function updateExploreFilters() {
    const magnitudeMinInput = parseFloat(document.getElementById('magnitude-min-explore')?.value || 0);
    const magnitudeMaxInput = parseFloat(document.getElementById('magnitude-max-explore')?.value || 10);
    const deathsMinInput = parseFloat(document.getElementById('deaths-min-explore')?.value || 0);
    const deathsMaxInput = parseFloat(document.getElementById('deaths-max-explore')?.value || 1000000);
    const countryFilter = document.getElementById('country-filter-explore')?.value || '';
    
    // Filter the data (use same logic as main chart)
    const filteredExploreData = earthquakeData.filter(d => {
        const magnitudeMatch = d.magnitude >= magnitudeMinInput && d.magnitude <= magnitudeMaxInput;
        const deathsMatch = d.deaths >= deathsMinInput && d.deaths <= deathsMaxInput;
        const countryMatch = !countryFilter || d.country === countryFilter;
        
        return magnitudeMatch && deathsMatch && countryMatch;
    });
    
    // Update data count
    const dataCountElement = document.getElementById('data-count-explore');
    if (dataCountElement) {
        dataCountElement.textContent = filteredExploreData.length.toLocaleString();
    }
    
            // Update chart with new data
        if (window.exploreChart) {
            // Store filtered data globally for explore chart
            window.filteredExploreData = filteredExploreData;
            
            // Update chart axes based on slider ranges  
            updateExploreChartAxes(magnitudeMinInput, magnitudeMaxInput, deathsMinInput, deathsMaxInput);
            updateExploreChart();
        }
}

function initializeExploreScatterChart() {
    console.log('Initializing explore scatter chart (using D3 system)...');
    
    const chartContainer = document.getElementById('earthquake-scatter-chart-explore');
    if (!chartContainer) {
        console.error('Explore chart container not found');
        return;
    }
    
    // Clear any existing content
    d3.select('#earthquake-scatter-chart-explore').selectAll('*').remove();
    
    // Use same approach as main scatter chart initialization 
    const containerRect = chartContainer.getBoundingClientRect();
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = Math.max(400, containerRect.width - margin.left - margin.right);
    const height = Math.max(300, Math.min(500, containerRect.height - margin.top - margin.bottom));
    
    // Create SVG with exact same setup as main chart
    const svg = d3.select('#earthquake-scatter-chart-explore')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .style('background', 'rgba(0, 0, 0, 0.1)')
        .style('border-radius', '8px');
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales with full ranges (unlocked)
    const xScale = d3.scaleLinear()
        .domain([0, 10])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, 1000000])
        .range([height, 0]);
    
    // Store globally for explore chart
    window.exploreChart = {
        svg,
        g,
        xScale,
        yScale,
        width,
        height,
        margin
    };
    
    // Initialize chart with data
    updateExploreChart();
    
    // Add brush functionality
    setupExploreD3Brush();
    
    console.log('✅ Explore scatter chart initialized with D3');
}

function updateExploreChartAxes(magnitudeMin, magnitudeMax, deathsMin, deathsMax) {
    if (!window.exploreChart) return;
    
    window.exploreChart.xScale.domain([magnitudeMin, magnitudeMax]);
    window.exploreChart.yScale.domain([deathsMin, deathsMax]);
}

function updateExploreChart() {
    if (!window.exploreChart || !window.filteredExploreData) return;
    
    const { g, xScale, yScale, width, height } = window.exploreChart;
    
    // Clear existing content except brush
    g.selectAll('*:not(.brush-explore)').remove();
    
    // Draw grid lines (same as main chart)
    drawExploreD3GridLines();
    
    // Draw axes (same as main chart)
    drawExploreD3Axes();
    
    // Draw data points (same as main chart)
    drawExploreD3DataPoints();
    
    // Draw prediction overlay if enabled
    if (userPredictionSaved && document.getElementById('show-prediction-explore')?.checked) {
        drawExploreD3PredictionOverlay();
    }
}

function drawExploreD3GridLines() {
    const { g, xScale, yScale, width, height } = window.exploreChart;
    
    // X-axis grid lines (exact copy from main chart)
    g.selectAll('.grid-line-x')
        .data(xScale.ticks(10))
        .enter().append('line')
        .attr('class', 'grid-line-x')
        .attr('x1', d => xScale(d))
        .attr('x2', d => xScale(d))
        .attr('y1', 0)
        .attr('y2', height)
        .style('stroke', 'rgba(255, 255, 255, 0.1)')
        .style('stroke-width', 0.5);
    
    // Y-axis grid lines (exact copy from main chart)
    g.selectAll('.grid-line-y')
        .data(yScale.ticks(8))
        .enter().append('line')
        .attr('class', 'grid-line-y')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .style('stroke', 'rgba(255, 255, 255, 0.1)')
        .style('stroke-width', 0.5);
}

function drawExploreD3Axes() {
    const { g, xScale, yScale, width, height } = window.exploreChart;
    
    // Create axes (exact copy from main chart)
    const xAxis = d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat(d => d.toString());
    
    const yAxis = d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat(d => {
            if (d >= 1000000) return (d / 1000000).toFixed(0) + 'M';
            if (d >= 1000) return (d / 1000).toFixed(0) + 'K';
            return d.toString();
        });
    
    // Add X-axis
    g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .selectAll('line')
        .style('stroke', 'rgba(255, 255, 255, 0.1)');
    
    // Add Y-axis
    g.append('g')
        .attr('class', 'y-axis')
        .call(yAxis)
        .selectAll('line')
        .style('stroke', 'rgba(255, 255, 255, 0.1)');
    
    // Style axis text
    g.selectAll('.x-axis text, .y-axis text')
        .style('fill', '#ffffff')
        .style('font-size', '12px');
    
    // Add axis labels
    g.append('text')
        .attr('class', 'x-label')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .style('fill', '#ff8a65')
        .style('font-size', '14px')
        .style('font-weight', '500')
        .text('Earthquake Magnitude');
    
    g.append('text')
        .attr('class', 'y-label')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -40)
        .style('fill', '#ff8a65')
        .style('font-size', '14px')
        .style('font-weight', '500')
        .text('Deaths');
}

function drawExploreD3DataPoints() {
    const { g, xScale, yScale } = window.exploreChart;
    const data = window.filteredExploreData;
    
    if (!data || data.length === 0) {
        console.log('No data to draw for explore chart');
        return;
    }
    
    // Draw earthquake points (exact copy from main chart)
    g.selectAll('.earthquake-dot-explore')
        .data(data)
        .enter().append('circle')
        .attr('class', 'earthquake-dot-explore')
        .attr('cx', d => xScale(d.magnitude))
        .attr('cy', d => yScale(d.deaths))
        .attr('r', 4)
        .attr('fill', d => {
            // Use same color logic as main chart
            if (d.deaths > 100000) return '#ff2b47';
            if (d.deaths > 10000) return '#ff5757'; 
            if (d.deaths > 1000) return '#ff7b47';
            return '#ff9f47';
        })
        .attr('stroke', 'rgba(255, 255, 255, 0.3)')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.8)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(150)
                .attr('r', 6)
                .attr('opacity', 1);
            showExploreD3Tooltip(event, d);
        })
        .on('mouseout', function(event, d) {
            d3.select(this)
                .transition()
                .duration(150)
                .attr('r', 4)
                .attr('opacity', 0.8);
            hideExploreD3Tooltip();
        });
    
    console.log(`Drew ${data.length} earthquake points for explore chart`);
}

function drawExploreD3PredictionOverlay() {
    if (!userPredictionData || userPredictionData.length === 0) return;
    
    const { g, xScale, yScale } = window.exploreChart;
    
    const line = d3.line()
        .x(d => xScale(d.magnitude))
        .y(d => yScale(d.deaths))
        .curve(d3.curveCardinal);
    
    g.append('path')
        .datum(userPredictionData)
        .attr('class', 'prediction-overlay-explore')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', '#00ff88')
        .attr('stroke-width', 3)
        .attr('opacity', 0.8);
}

function showExploreD3Tooltip(event, d) {
    // Use same tooltip system as main chart
    showD3Tooltip(event, d);
}

function hideExploreD3Tooltip() {
    // Use same tooltip system as main chart
    hideD3Tooltip();
}

function setupExploreD3Brush() {
    if (!window.exploreChart) return;
    
    const { g, width, height } = window.exploreChart;
    
    const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on('start brush end', function(event) {
            handleExploreD3Brush(event);
        });
    
    // Add brush group
    g.append('g')
        .attr('class', 'brush-explore')
        .call(brush);
    
    // Style the brush (same as main chart)
    g.select('.brush-explore .selection')
        .style('fill', 'rgba(0, 255, 136, 0.1)')
        .style('stroke', '#00ff88')
        .style('stroke-width', 2)
        .style('stroke-dasharray', '5,5');
}

function handleExploreD3Brush(event) {
    if (!event.selection) {
        clearExploreSelection();
        return;
    }
    
    const [[x0, y0], [x1, y1]] = event.selection;
    const { xScale, yScale } = window.exploreChart;
    
    // Convert pixel coordinates to data coordinates
    const magnitudeRange = [xScale.invert(x0), xScale.invert(x1)];
    const deathsRange = [yScale.invert(y1), yScale.invert(y0)]; // y is inverted
    
    // Find selected points
    const selectedData = (window.filteredExploreData || earthquakeData).filter(d => 
        d.magnitude >= magnitudeRange[0] && d.magnitude <= magnitudeRange[1] &&
        d.deaths >= deathsRange[0] && d.deaths <= deathsRange[1]
    );
    
    // Update selection statistics
    updateExploreSelectionStats(selectedData);
    
    if (event.type === 'end') {
        console.log(`Explore Selection: ${selectedData.length} earthquakes selected`);
        console.log(`Magnitude range: ${magnitudeRange[0].toFixed(1)} - ${magnitudeRange[1].toFixed(1)}`);
        console.log(`Deaths range: ${deathsRange[0].toFixed(0)} - ${deathsRange[1].toFixed(0)}`);
    }
}

// Selection and interaction functions for explore chart
function clearExploreSelection() {
    const selectionStats = document.getElementById('selection-stats-explore');
    if (selectionStats) {
        selectionStats.style.display = 'none';
    }
}

function updateExploreSelectionStats(selectedData) {
    if (!selectedData || selectedData.length === 0) {
        clearExploreSelection();
        return;
    }
    
    const avgMagnitude = selectedData.reduce((sum, d) => sum + d.magnitude, 0) / selectedData.length;
    const avgDeaths = selectedData.reduce((sum, d) => sum + d.deaths, 0) / selectedData.length;
    
    document.getElementById('selection-count-explore').textContent = selectedData.length;
    document.getElementById('selection-avg-mag-explore').textContent = avgMagnitude.toFixed(1);
    document.getElementById('selection-avg-deaths-explore').textContent = Math.round(avgDeaths).toLocaleString();
    
    const selectionStats = document.getElementById('selection-stats-explore');
    if (selectionStats) {
        selectionStats.style.display = 'block';
    }
}



// Setup clear selection button for explore chart
document.addEventListener('DOMContentLoaded', function() {
    const clearBtn = document.getElementById('clear-selection-explore');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            clearExploreSelection();
            // Clear the brush selection
            if (window.exploreChart && window.exploreChart.g) {
                window.exploreChart.g.select('.brush-explore').call(d3.brush().clear);
            }
        });
    }
});

// Make navigation functions globally available
window.navigateToSection = navigateToSection;
window.updateNavigationActive = updateNavigationActive;


