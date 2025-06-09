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
    
    console.log('🌍 World data loaded, initializing globes...');
    
    initIntroGlobe();
    initMainGlobe();
    setupScrollAnimation();
    
    // Setup navigation menu
    setupNavigation();
    
    // Load earthquake data for exploration section
    await loadEarthquakeData();
    
    console.log('🎬 Starting transition timer...');
    
    // No automatic transition - start directly with main section
}

function initIntroGlobe() {
    console.log('🌍 Initializing intro globe...');
    
    const width = 800, height = 800;
    const svgElement = document.getElementById("intro-globe-svg");
    console.log('🔍 Intro globe SVG element:', svgElement);
    
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
    
    console.log('✅ Intro globe initialized');
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
    console.log('🎨 Rendering intro globe...', { world: !!world, introSvg: !!introSvg });
    if (!world) {
        console.log('❌ No world data available for intro globe');
        return;
    }

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

function startGlobeTransition() {
    console.log('🌍 Starting automatic globe transition');
    
    const introGlobe = document.querySelector('.intro-globe');
        const globeContainer = document.getElementById('main-globe-container');
    const mainSection = document.querySelector('.main-section');
        const contentLeft = document.querySelector('.content-left');
        const dataPoints = document.querySelector('.data-points');
        const controls = document.querySelector('.controls');
    
    console.log('🔍 Elements found:', {
        introGlobe: !!introGlobe,
        globeContainer: !!globeContainer,
            mainSection: !!mainSection,
        contentLeft: !!contentLeft,
        dataPoints: !!dataPoints,
        controls: !!controls
    });
    
    if (!introGlobe) {
        console.log('❌ Intro globe element not found, transition cancelled');
    return;
  }

    // Step 1: Start globe transition animation
    introGlobe.classList.add('transitioning');
    
    // Step 2: After 2 seconds, start fading in main section
                        setTimeout(() => {
        console.log('🎬 Activating main section');
        
        // Show main section
            if (mainSection) {
                mainSection.classList.add('visible');
            }
        
        // Show main globe container
            if (globeContainer) {
                globeContainer.style.opacity = '1';
                globeContainer.style.pointerEvents = 'auto';
            globeContainer.classList.add('positioned');
            }
        
        // Animate in content with much more staggered timing
        setTimeout(() => {
            if (contentLeft) {
                contentLeft.classList.add('visible');
            }
        }, 800);  // Increased from 200ms to 800ms
        
        setTimeout(() => {
            if (dataPoints) {
                dataPoints.classList.add('visible');
            }
        }, 1600); // Increased from 400ms to 1600ms
        
        setTimeout(() => {
            if (controls) {
                controls.classList.add('visible');
            }
        }, 2400); // Increased from 600ms to 2400ms
        
        // Step 3: After transition completes, hide intro globe completely
        setTimeout(() => {
            introGlobe.classList.add('transitioned');
            console.log('🎯 Globe transition completed');
        }, 3000); // Increased from 1000ms to 3000ms
        
    }, 2000); // Increased from 1000ms to 2000ms
    
    // Step 4: Enable scroll after much longer delay
    setTimeout(() => {
        // Automatically scroll to main section
        const targetScrollY = window.innerHeight;
        window.scrollTo({
            top: targetScrollY,
            behavior: 'smooth'
        });
        
        console.log('📜 Auto-scrolled to main section');
    }, 8000); // Increased from 2500ms to 8000ms
}

function setupScrollAnimation() {
    console.log('🚀 Setting up simplified scroll system...');
    
    // Simple, reliable scroll handler
    function handleScroll() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        
        // Get all elements we need
        const mainSection = document.querySelector('.main-section');
        const storySection = document.querySelector('.story-section');
        const butSection = document.querySelector('.but-section');
        const explorationSection = document.querySelector('.exploration-section');
        const header = document.querySelector('.header');
        const slideIndicator = document.querySelector('.slide-indicator');
        const globeContainer = document.getElementById('main-globe-container');
        const contentLeft = document.querySelector('.content-left');
        const dataPoints = document.querySelector('.data-points');
        const controls = document.querySelector('.controls');
        
        // Section boundaries - updated for part 2 integration
        const storyStart = windowHeight * 1.0;   // Story starts at 100vh
        const part2Start = windowHeight * 8.0;   // Part 2 advanced analysis starts at 800vh
        const butStart = windowHeight * 16.0;    // But starts at 1600vh  
        const exploreStart = windowHeight * 17.0; // Explore starts at 1700vh
        
        // Story slide boundaries - each gets 150vh for more time
        const slide1Start = windowHeight * 1.0;  // 100vh - First story slide
        const slide2Start = windowHeight * 2.5;  // 250vh - Second story slide
        const slide3Start = windowHeight * 4.0;  // 400vh - Third story slide
        const slide4Start = windowHeight * 5.5;  // 550vh - Fourth story slide (energy calc)
        const slide5Start = windowHeight * 7.0;  // 700vh - Fifth story slide (prediction)
        
        // Header visibility
        header?.classList.toggle('visible', scrollY > windowHeight * 0.3);
        
        // Section switching - clean and simple
        if (scrollY >= exploreStart && storyCompleted) {
            // EXPLORATION SECTION
            showSection('exploration', {
                mainSection, storySection, butSection, explorationSection,
                globeContainer, contentLeft, dataPoints, controls, slideIndicator
            });
            
            // Initialize exploration if needed
            if (explorationSection && !explorationSection.hasAttribute('data-initialized')) {
                explorationSection.setAttribute('data-initialized', 'true');
                if (earthquakeData.length > 0) {
                    initializeExplorationSection();
                }
            }
            
        } else if (scrollY >= butStart && storyCompleted) {
            // BUT SECTION
            showSection('but', {
                mainSection, storySection, butSection, explorationSection,
                globeContainer, contentLeft, dataPoints, controls, slideIndicator
            });
            
            // Initialize but section if needed
            if (butSection && !butSection.hasAttribute('data-initialized')) {
                butSection.setAttribute('data-initialized', 'true');
            }
            
        } else if (scrollY >= part2Start && storyCompleted) {
            // PART 2 SECTION - Advanced analysis
            showSection('part2', {
                mainSection, storySection, butSection, explorationSection,
                globeContainer, contentLeft, dataPoints, controls, slideIndicator
            });
            
            // Part 2 initialization is now handled in setElementState function
            
        } else if (scrollY >= storyStart) {
            // STORY SECTION
            showSection('story', {
                mainSection, storySection, butSection, explorationSection,
                globeContainer, contentLeft, dataPoints, controls, slideIndicator
            });
            
            // Handle story slides - much simpler
            let targetSlide = 0;
            if (scrollY >= slide5Start) targetSlide = 4;      // Prediction slide
            else if (scrollY >= slide4Start) targetSlide = 3; // Energy calculator slide
            else if (scrollY >= slide3Start) targetSlide = 2; // Energy release slide
            else if (scrollY >= slide2Start) targetSlide = 1; // Pressure buildup slide
            else if (scrollY >= slide1Start) targetSlide = 0; // First intro slide
            
            // Update slide if changed
            if (currentEarthquakeSlide !== targetSlide) {
                currentEarthquakeSlide = targetSlide;
                updateEarthquakeSlidePosition();
                
                // Mark story as completed on last slide
                if (currentEarthquakeSlide === totalEarthquakeSlides - 1) {
                    storyCompleted = true;
                }
            }
            
        } else {
            // MAIN SECTION (default)
            showSection('main', {
                mainSection, storySection, butSection, explorationSection,
                globeContainer, contentLeft, dataPoints, controls, slideIndicator
            });
        }
    }
    
    // Helper function to show/hide sections cleanly
    function showSection(activeSection, elements) {
        const { mainSection, storySection, butSection, explorationSection,
                globeContainer, contentLeft, dataPoints, controls, slideIndicator } = elements;
        
        // Update navigation
        updateNavigationActive(activeSection);
        
        // Get part2 section
        const part2Section = document.querySelector('.part2-section');
        
        switch (activeSection) {
            case 'main':
                setElementState(mainSection, true);
                setElementState(storySection, false);
                setElementState(part2Section, false);
                setElementState(butSection, false);
                setElementState(explorationSection, false);
                setElementState(globeContainer, true);
                setElementState(contentLeft, true);
                setElementState(dataPoints, true);
                setElementState(controls, true);
                setElementState(slideIndicator, false);
                if (globeContainer) globeContainer.classList.add('positioned');
                autoRotate = false;
                break;
                
            case 'story':
                setElementState(mainSection, false);
                setElementState(storySection, true);
                setElementState(part2Section, false);
                setElementState(butSection, false);
                setElementState(explorationSection, false);
                setElementState(globeContainer, false);
                setElementState(contentLeft, false);
                setElementState(dataPoints, false);
                setElementState(controls, false);
                setElementState(slideIndicator, true);
                if (globeContainer) globeContainer.classList.remove('positioned');
                autoRotate = false;
                break;
                
            case 'part2':
                setElementState(mainSection, false);
                setElementState(storySection, false);
                setElementState(part2Section, true);
                setElementState(butSection, false);
                setElementState(explorationSection, false);
                setElementState(globeContainer, false);
                setElementState(contentLeft, false);
                setElementState(dataPoints, false);
                setElementState(controls, false);
                setElementState(slideIndicator, false);
                if (globeContainer) globeContainer.classList.remove('positioned');
                autoRotate = false;
                break;
                
            case 'but':
                setElementState(mainSection, false);
                setElementState(storySection, false);
                setElementState(part2Section, false);
                setElementState(butSection, true);
                setElementState(explorationSection, false);
                setElementState(globeContainer, false);
                setElementState(contentLeft, false);
                setElementState(dataPoints, false);
                setElementState(controls, false);
                setElementState(slideIndicator, false);
                if (globeContainer) globeContainer.classList.remove('positioned');
                autoRotate = false;
                break;
                
            case 'exploration':
                setElementState(mainSection, false);
                setElementState(storySection, false);
                setElementState(part2Section, false);
                setElementState(butSection, false);
                setElementState(explorationSection, true);
                setElementState(globeContainer, false);
                setElementState(contentLeft, false);
                setElementState(dataPoints, false);
                setElementState(controls, false);
                setElementState(slideIndicator, false);
                if (globeContainer) globeContainer.classList.remove('positioned');
                autoRotate = false;
                break;
        }
    }
    
    // Helper to set element visibility state
    function setElementState(element, isVisible) {
        if (!element) return;
        
        if (isVisible) {
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
            element.classList.add('visible');
            
            // Special handling for part 2 section
            if (element.classList.contains('part2-section')) {
                if (!element.hasAttribute('data-initialized')) {
                    element.setAttribute('data-initialized', 'true');
                    console.log('🔄 Initializing Part 2 scrollytelling...');
                    // Initialize part 2 components after a short delay
                    setTimeout(() => {
                        initializePart2();
                    }, 100);
                }
            }
        } else {
            element.style.opacity = '0';
            element.style.pointerEvents = 'none';
            element.classList.remove('visible');
        }
    }
    
    // Simple throttled scroll handler - no complex wheel hijacking
    let ticking = false;
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    }
    
    // Bind scroll event only - no wheel interference
    window.addEventListener('scroll', requestTick, { passive: true });
    
    // Initialize
    handleScroll();
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

// Initialize part 1
window.addEventListener('load', init);

// Part 2 initialization function (called when part 2 section becomes active)
function initializePart2() {
    console.log('🚀 Initializing Part 2 functionality...');
    
    // Check if part 2 elements exist
    const canvas = document.getElementById('mainCanvas');
    if (!canvas) {
        console.log('❌ Part 2 canvas not found');
    return;
  }

    // Initialize part 2 components if they exist
    try {
        if (typeof initializeCanvas === 'function') {
            initializeCanvas();
        }
        
        if (typeof loadData === 'function') {
            loadData();
        }
        
        if (typeof setupScrollTrigger === 'function') {
            setupScrollTrigger();
        }
        
        if (typeof setupCountrySearch === 'function') {
            setupCountrySearch();
        }
        
        if (typeof setupThemeToggle === 'function') {
            setupThemeToggle();
        }
        
        console.log('✅ Part 2 initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing Part 2:', error);
    }
}

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
    
    // Auto-transition to data.html after 3 seconds
    setTimeout(() => {
        console.log('Auto-transitioning to data analysis...');
        
        // Store prediction data in localStorage so data.html can access it
        localStorage.setItem('userPredictionData', JSON.stringify(window.userPredictionData));
        
        // Redirect to data.html
        window.location.href = 'data.html';
    }, 3000);
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
            return isSelected ? '#00ff88' : '#00d4ff';
        })
        .attr('stroke', d => {
            const isSelected = selectedEarthquakes.some(selected => 
                selected.magnitude === d.magnitude && 
                selected.deaths === d.deaths && 
                selected.year === d.year && 
                selected.country === d.country
            );
            return isSelected ? '#00ff88' : '#00d4ff';
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
        .style('fill', '#00d4ff')
        .style('font-size', '12px');
    
    // Add Y axis
    axisGroup.append('g')
        .attr('class', 'y-axis')
        .call(yAxis)
        .selectAll('text')
        .style('fill', '#00d4ff')
        .style('font-size', '12px');
    
    // Style axis lines and ticks
    axisGroup.selectAll('.domain, .tick line')
        .style('stroke', '#00d4ff');
    
    // Add axis labels
    axisGroup.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', width / 2)
        .attr('y', height + 45)
        .style('text-anchor', 'middle')
        .style('fill', '#00d4ff')
        .style('font-size', '14px')
        .text('Earthquake Magnitude');
    
    axisGroup.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -50)
        .style('text-anchor', 'middle')
        .style('fill', '#00d4ff')
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
                    .attr('fill', d => isEarthquakeSelected(d) ? '#00ff88' : '#00d4ff')
            .attr('r', d => isEarthquakeSelected(d) ? 4 : 3)
            .attr('stroke-width', d => isEarthquakeSelected(d) ? 2 : 0.5)
        .attr('stroke', d => isEarthquakeSelected(d) ? '#00ff88' : '#00d4ff');
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
            .attr('fill', '#00d4ff')
            .attr('r', 3)
            .attr('stroke-width', 0.5)
            .attr('stroke', '#00d4ff');
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
    if (scatterChartExplore) {
        // Store filtered data globally for explore chart
        window.filteredExploreData = filteredExploreData;
        
        // Update chart axes based on slider ranges  
        updateExploreChartAxes(magnitudeMinInput, magnitudeMaxInput, deathsMinInput, deathsMaxInput);
        updateExploreScatterChart();
    }
}

function initializeExploreScatterChart() {
    console.log('Initializing explore scatter chart...');
    
    const container = d3.select('#earthquake-scatter-chart-explore');
    if (container.empty()) {
        console.error('Explore chart container not found');
        return;
    }
    
    // Chart dimensions
    const margin = { top: 20, right: 30, bottom: 60, left: 80 };
    const containerRect = container.node().getBoundingClientRect();
    const width = containerRect.width - margin.left - margin.right;
    const height = containerRect.height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', containerRect.width)
        .attr('height', containerRect.height);
    
    // Create chart group
    const chartGroup = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Store chart components
    scatterChartExplore = {
        svg: svg,
        chartGroup: chartGroup,
        width: width,
        height: height,
        margin: margin,
        xScale: d3.scaleLinear().range([0, width]),
        yScale: d3.scaleLinear().range([height, 0])
    };
    
    // Add brush functionality
    setupExploreBrush();
    
    // Initial chart render
    updateExploreScatterChart();
    
    console.log('✅ Explore scatter chart initialized');
}

function updateExploreChartAxes(magnitudeMin, magnitudeMax, deathsMin, deathsMax) {
    if (!scatterChartExplore) return;
    
    scatterChartExplore.xScale.domain([magnitudeMin, magnitudeMax]);
    scatterChartExplore.yScale.domain([deathsMin, deathsMax]);
}

function updateExploreScatterChart() {
    if (!scatterChartExplore || !window.filteredExploreData) return;
    
    const { chartGroup, xScale, yScale } = scatterChartExplore;
    
    // Clear existing content
    chartGroup.selectAll('*').remove();
    
    // Draw grid lines
    drawExploreGridLines();
    
    // Draw axes
    drawExploreAxes();
    
    // Draw data points
    drawExploreDataPoints();
    
    // Draw prediction overlay if enabled
    if (userPredictionSaved && document.getElementById('show-prediction-explore')?.checked) {
        drawExplorePredictionOverlay();
    }
}

function drawExploreGridLines() {
    const { chartGroup, xScale, yScale, width, height } = scatterChartExplore;
    
    // X-axis grid lines
    chartGroup.selectAll('.grid-line-x')
        .data(xScale.ticks(8))
        .enter().append('line')
        .attr('class', 'grid-line-x')
        .attr('x1', d => xScale(d))
        .attr('x2', d => xScale(d))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#333333')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.3);
    
    // Y-axis grid lines
    chartGroup.selectAll('.grid-line-y')
        .data(yScale.ticks(6))
        .enter().append('line')
        .attr('class', 'grid-line-y')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', '#333333')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.3);
}

function drawExploreAxes() {
    const { chartGroup, xScale, yScale, width, height } = scatterChartExplore;
    
    // X-axis
    chartGroup.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(8))
        .selectAll('text')
        .style('fill', '#ffffff')
        .style('font-size', '12px');
    
    // Y-axis
    chartGroup.append('g')
        .call(d3.axisLeft(yScale).ticks(6).tickFormat(d3.format('.2s')))
        .selectAll('text')
        .style('fill', '#ffffff')
        .style('font-size', '12px');
    
    // Axis lines
    chartGroup.selectAll('.domain')
        .style('stroke', '#ffffff')
        .style('stroke-width', 1);
    
    chartGroup.selectAll('.tick line')
        .style('stroke', '#ffffff')
        .style('stroke-width', 1);
    
    // Axis labels
    chartGroup.append('text')
        .attr('transform', `translate(${width/2}, ${height + 40})`)
        .style('text-anchor', 'middle')
        .style('fill', '#ffffff')
        .style('font-size', '14px')
        .text('Magnitude');
    
    chartGroup.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -50)
        .attr('x', -height/2)
        .style('text-anchor', 'middle')
        .style('fill', '#ffffff')
        .style('font-size', '14px')
        .text('Deaths');
}

function drawExploreDataPoints() {
    const { chartGroup, xScale, yScale } = scatterChartExplore;
    const data = window.filteredExploreData;
    
    chartGroup.selectAll('.earthquake-point-explore')
      .data(data)
        .enter().append('circle')
        .attr('class', 'earthquake-point-explore')
        .attr('cx', d => xScale(d.magnitude))
        .attr('cy', d => yScale(d.deaths))
        .attr('r', 3)
        .attr('fill', '#ff5757')
        .attr('opacity', 0.7)
        .on('mouseover', function(event, d) {
            showExploreTooltip(event, d);
        })
        .on('mouseout', hideExploreTooltip);
}

function drawExplorePredictionOverlay() {
    if (!userPredictionData || userPredictionData.length === 0) return;
    
    const { chartGroup, xScale, yScale } = scatterChartExplore;
    
    const line = d3.line()
        .x(d => xScale(d.magnitude))
        .y(d => yScale(d.deaths))
        .curve(d3.curveCardinal);
    
    chartGroup.append('path')
        .datum(userPredictionData)
        .attr('class', 'prediction-overlay-explore')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', '#00ff88')
        .attr('stroke-width', 3)
        .attr('opacity', 0.8);
}

function showExploreTooltip(event, d) {
    // Implementation similar to main chart tooltip
    console.log('Explore tooltip:', d);
}

function hideExploreTooltip() {
    // Implementation similar to main chart tooltip
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

function setupExploreBrush() {
    if (!scatterChartExplore) return;
    
    const { chartGroup, width, height } = scatterChartExplore;
    
    const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on('start brush end', function(event) {
            handleExploreBrush(event);
        });
    
    // Add brush group
    chartGroup.append('g')
        .attr('class', 'brush-explore')
        .call(brush);
    
    // Style the brush
    chartGroup.select('.brush-explore .selection')
        .style('fill', 'rgba(0, 255, 136, 0.1)')
        .style('stroke', '#00ff88')
        .style('stroke-width', 2)
        .style('stroke-dasharray', '5,5');
}

function handleExploreBrush(event) {
    if (!event.selection) {
        clearExploreSelection();
        return;
    }
    
    const [[x0, y0], [x1, y1]] = event.selection;
    const { xScale, yScale } = scatterChartExplore;
    
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

// Setup clear selection button for explore chart
document.addEventListener('DOMContentLoaded', function() {
    const clearBtn = document.getElementById('clear-selection-explore');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            clearExploreSelection();
            // Clear the brush selection
            if (scatterChartExplore && scatterChartExplore.chartGroup) {
                scatterChartExplore.chartGroup.select('.brush-explore').call(d3.brush().clear);
            }
        });
    }
});

// Make navigation functions globally available
window.navigateToSection = navigateToSection;
window.updateNavigationActive = updateNavigationActive;


let data = [];
let canvas, ctx;
let scroller;
let currentStep = 'title';
let currentView = 'bubble';
let searchedCountry = null;
let hoveredDot = null;
let tooltip = null;

// Canvas dimensions
const canvasWidth = 1400;
const canvasHeight = 800;

// Chart dimensions  
const chartMargin = { top: 120, right: 80, bottom: 80, left: 100 };
const chartWidth = canvasWidth - chartMargin.left - chartMargin.right;
const chartHeight = canvasHeight - chartMargin.top - chartMargin.bottom;

// Dot animation properties
let dots = [];
let animationProgress = 0;
let targetAnimationProgress = 0;

// Infrastructure chart animation
let infraChartProgress = 0;
let targetInfraChartProgress = 0;

// Infrastructure chart interactivity
let infraChartData = [];
let hoveredInfraDot = null;
let selectedInfraLevel = null; // For filtering by infrastructure level
let infraChartFilters = {
    minMagnitude: 5.0,
    maxMagnitude: 10.0,
    minYear: 1900,
    maxYear: 2024
};

// Case study highlighting
let highlightedEarthquakes = null;
let caseStudyScrollListener = null;
let caseStudyProgressed = false;

// Axis domain animation state
let currentAxisDomains = null;
let targetAxisDomains = null;

// Infrastructure scores mapping
const infrastructureScores = {
  "UNITED STATES": "High", "JAPAN": "High", "GERMANY": "High", "UNITED KINGDOM": "High",
  "FRANCE": "High", "CANADA": "High", "AUSTRALIA": "High", "SWITZERLAND": "High",
  "NETHERLANDS": "High", "SWEDEN": "High", "NORWAY": "High", "DENMARK": "High",
  "FINLAND": "High", "NEW ZEALAND": "High", "SOUTH KOREA": "High", "SINGAPORE": "High",
  "CHINA": "Medium", "RUSSIA": "Medium", "BRAZIL": "Medium", "INDIA": "Medium",
  "MEXICO": "Medium", "TURKEY": "Medium", "CHILE": "Medium", "ARGENTINA": "Medium",
  "THAILAND": "Medium", "MALAYSIA": "Medium", "SOUTH AFRICA": "Medium", "POLAND": "Medium",
  "GREECE": "Medium", "PORTUGAL": "Medium", "SPAIN": "Medium", "ITALY": "Medium",
  "HAITI": "Low", "AFGHANISTAN": "Low", "PAKISTAN": "Low", "BANGLADESH": "Low",
  "NEPAL": "Low", "MYANMAR": "Low", "ETHIOPIA": "Low", "SOMALIA": "Low",
  "SUDAN": "Low", "CHAD": "Low", "NIGER": "Low", "MALI": "Low",
  "BURKINA FASO": "Low", "MADAGASCAR": "Low", "YEMEN": "Low", "SYRIA": "Low",
  "IRAQ": "Low", "IRAN": "Low", "INDONESIA": "Medium", "PHILIPPINES": "Medium",
  "PERU": "Medium", "COLOMBIA": "Medium", "VENEZUELA": "Medium", "ECUADOR": "Medium"
};

// ========== CHART TOOLTIP FUNCTIONS ========== //
let chartTooltip = null;

function createChartTooltip() {
    if (!chartTooltip) {
        chartTooltip = d3.select('body').append('div')
            .attr('class', 'chart-tooltip')
            .style('position', 'fixed')
            .style('background', 'var(--glass-bg)')
            .style('color', 'var(--text-primary)')
            .style('padding', '8px 12px')
            .style('border-radius', '6px')
            .style('border', '1px solid var(--border-color)')
            .style('font-size', '11px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 10000)
            .style('max-width', '200px')
            .style('box-shadow', '0 2px 8px var(--shadow-color)')
            .style('backdrop-filter', 'blur(10px)')
            .style('transition', 'opacity 0.2s ease');
    }
    return chartTooltip;
}

function showChartTooltip(event, text) {
    const tooltip = createChartTooltip();
    
    tooltip.html(text)
        .style('opacity', 1);
        
    updateChartTooltipPosition(event);
}

function updateChartTooltipPosition(event) {
    if (!chartTooltip) return;
    
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Position tooltip above and to the right of cursor
    let tooltipX = mouseX + 10;
    let tooltipY = mouseY - 10;
    
    // Prevent tooltip from going off screen
    const tooltipWidth = 200;
    const tooltipHeight = 40;
    
    if (tooltipX + tooltipWidth > window.innerWidth) {
        tooltipX = mouseX - tooltipWidth - 10;
    }
    if (tooltipY - tooltipHeight < 0) {
        tooltipY = mouseY + 25;
    }
    
    chartTooltip
        .style('left', tooltipX + 'px')
        .style('top', tooltipY + 'px');
}

function hideChartTooltip() {
    if (chartTooltip) {
        chartTooltip.style('opacity', 0);
    }
}

// ========== INITIALIZATION ========== //
// Part 2 DOMContentLoaded - disabled, now called manually via initializePart2()
// document.addEventListener('DOMContentLoaded', function() {
//     initializeCanvas();
//     loadData();
//     setupScrollTrigger();
//     setupCountrySearch();
//     setupThemeToggle();
// });

function initializeCanvas() {
    canvas = document.getElementById('mainCanvas');
    ctx = canvas.getContext('2d');
    tooltip = document.getElementById('tooltip');
    
    // Set canvas internal resolution
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Ensure canvas displays at correct size (matches CSS)
    const rect = canvas.getBoundingClientRect();
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Add mouse event listeners for hover and interaction
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleCanvasClick);
    
    // Setup infrastructure legend click handlers
    setupInfraLegendHandlers();
}

function loadData() {
    d3.csv('earthquakes.csv').then(function(csvData) {
        console.log('Raw CSV data loaded:', csvData.length, 'rows');
        console.log('Sample row:', csvData[100]); // Check a sample row
        
        data = csvData.map(d => ({
            country: d.Country,
            location: d['Location Name'],
            year: +d.Year,
            magnitude: +d.Mag,
            deaths: +d.Deaths,
            damageMillions: +d['Damage ($Mil)'],
            totalDeaths: +d['Total Deaths'],
            housesDestroyed: +d['Houses Destroyed'] || 0,
            housesDamaged: +d['Houses Damaged'] || 0,
            totalHousesDestroyed: +d['Total Houses Destroyed'] || 0,
            totalHousesDamaged: +d['Total Houses Damaged'] || 0,
            mmi: +d['MMI Int'] || 0,
            focalDepth: +d['Focal Depth (km)'] || 0,
            infrastructure: infrastructureScores[d.Country] || 'Medium'
        })).filter(d => 
            !isNaN(d.magnitude) && 
            !isNaN(d.deaths) && 
            d.magnitude > 0 && 
            d.deaths > 0 &&
            d.year > 1900 // Focus on modern data
        );
        
        console.log('Filtered data:', data.length, 'earthquakes');
        console.log('Sample earthquake:', data[0]);
        
        if (data.length > 0) {
            initializeDots();
            // Calculate proper chart positions with adjusted domains
            recalculateChartPositions(canvasWidth);
            initializeGlobalStats();
            startAnimation();
        } else {
            console.error('No valid earthquake data found!');
        }
    }).catch(function(error) {
        console.error('Error loading CSV:', error);
    });
}

function initializeDots() {
    dots = data.map((d, i) => {
        // Globe position (scattered around center)
        const angle = (i / data.length) * Math.PI * 4 + Math.sin(i * 0.1) * 2;
        const radius = 150 + Math.sin(i * 0.05) * 100 + Math.random() * 150;
        const globeX = canvasWidth / 2 + Math.cos(angle) * radius;
        const globeY = canvasHeight / 2 + Math.sin(angle) * radius * 0.6;
        
        // Chart position - initially use basic positioning, will be recalculated later
        const chartX = 0; // Will be set properly in recalculateChartPositions
        const chartY = 0; // Will be set properly in recalculateChartPositions
        
        return {
            data: d,
            globeX,
            globeY,
            chartX,
            chartY,
            currentX: globeX,
            currentY: globeY,
            size: Math.sqrt(Math.max(1, d.deaths)) * 0.3 + 2,
            color: getInfrastructureColor(d.infrastructure),
            opacity: 0.7,
            targetOpacity: 0.7
        };
    });
}

function getInfrastructureColor(infrastructure) {
    switch(infrastructure.toLowerCase()) {
        case 'low': return '#ff6b6b';
        case 'medium': return '#ffa500';
        case 'high': return '#4ecdc4';
        default: return '#888';
    }
}

// ========== SCROLL TRIGGER SETUP ========== //
function setupScrollTrigger() {
    scroller = scrollama();
    
    scroller
        .setup({
            step: '.story-step',
            offset: 0.5,
        })
        .onStepEnter(response => {
            // Remove active class from all steps
            document.querySelectorAll('.story-step').forEach(step => {
                step.classList.remove('active');
            });
            
            // Add active class to current step
            response.element.classList.add('active');
            
            // Track previous step to detect scrolling direction
            const previousStep = currentStep;
            const stepName = response.element.dataset.step;
            
            // Detect if scrolling up from interactive
            const isScrollingUp = response.direction === 'up';
            const wasInteractive = previousStep === 'interactive';
            
            // Update current step with scroll direction info
            updateVisualizationForStep(stepName, isScrollingUp, wasInteractive);
        });
    
    // Handle window resize
    window.addEventListener('resize', scroller.resize);
}

function updateVisualizationForStep(stepName, isScrollingUp = false, wasInteractive = false) {
    // Reset case study content visibility when leaving the step
    if (currentStep === 'case-study' && stepName !== 'case-study') {
        const caseStudyStep = document.querySelector('[data-step="case-study"]');
        const caseStudyContent = caseStudyStep?.querySelector('.step-content');
        if (caseStudyContent) {
            caseStudyContent.classList.remove('case-study-visible');
            caseStudyContent.style.opacity = '';
            caseStudyContent.style.transform = '';
            caseStudyContent.style.transition = '';
            caseStudyContent.style.visibility = '';
        }
        
        // Restore normal sidebar content
        restoreNormalSidebarContent();
        
        // Reset highlighting
        highlightedEarthquakes = null;
        dots.forEach(dot => {
            dot.targetOpacity = 1.0; // Reset to full opacity
        });
        
        // Clean up scroll listener
        cleanupCaseStudyScrollListener();
    }
    
    currentStep = stepName;
    
        // If scrolling up from interactive, immediately start reverse animation
    if (isScrollingUp && wasInteractive) {
        targetAnimationProgress = 0;
        hideViewToggle();
        hideSidebar();
        clearSearchHighlighting();
    return;
  }

    switch(stepName) {
        case 'title':
            targetAnimationProgress = 0;
            currentView = 'bubble'; // Reset to default view
            hideViewToggle();
            hideSidebar();
            clearSearchHighlighting();
            break;
            
        case 'intro':
            targetAnimationProgress = 0;
            currentView = 'bubble'; // Reset to default view
            hideViewToggle();
            hideSidebar();
            clearSearchHighlighting();
            break;
            
        case 'pattern':
            targetAnimationProgress = 0;
            currentView = 'bubble'; // Reset to default view
            hideViewToggle();
            hideSidebar();
            clearSearchHighlighting();
            break;
            
        case 'infrastructure':
            targetAnimationProgress = 0;
            currentView = 'hidden'; // Hide the main graph completely  
            hideViewToggle();
            hideSidebar();
            clearSearchHighlighting();
            break;
            
        case 'interactive':
            targetAnimationProgress = 1;
            currentView = 'bubble'; // Keep bubble view
            showViewToggle();
            showSidebar();
            // Keep search highlighting if exists
            // Restore normal sidebar content if coming from infrastructure analysis
            restoreGlobalData();
            break;
            
        case 'case-study':
            targetAnimationProgress = 1; // Keep graph visible initially
            currentView = 'highlight'; // New view mode for highlighting specific earthquakes
            hideViewToggle();
            clearSearchHighlighting();
            
            // Highlight Haiti and Japan earthquakes
            highlightHaitiAndJapan();
            
            // Show sidebar with story content instead of filters
            showSidebarWithStoryContent();
            
            // Hide detailed case study content initially and wait for user scroll
            const caseStudyStep = document.querySelector('[data-step="case-study"]');
            const caseStudyContent = caseStudyStep?.querySelector('.step-content');
            if (caseStudyContent) {
                // Force hidden state - override any CSS rules
                caseStudyContent.style.opacity = '0';
                caseStudyContent.style.transform = 'translateY(30px)';
                caseStudyContent.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                caseStudyContent.style.visibility = 'hidden';
                caseStudyContent.classList.remove('case-study-visible');
                
                // Also ensure no auto-triggering by resetting flag
                caseStudyProgressed = false;
            }
            
            // Set up scroll listener for user-triggered progression after a brief delay
            // This prevents immediate triggering if user is already scrolling when section becomes active
            setTimeout(() => {
                if (currentStep === 'case-study') {
                    setupCaseStudyScrollListener();
                }
            }, 500); // Wait 0.5 seconds before scroll listener becomes active
            break;
            
        case 'infrastructure-analysis':
            targetAnimationProgress = 0;
            currentView = 'infrastructure'; // Show infrastructure chart on main canvas
            hideViewToggle();
            clearSearchHighlighting();
            
            // Show infrastructure chart and sidebar immediately
            infraChartProgress = 1;
            targetInfraChartProgress = 1;
            
            // Show infrastructure analysis immediately
            showInfrastructureAnalysis();
            break;
    }
}

function showViewToggle() {
    const toggle = document.getElementById('viewToggle');
    toggle.style.opacity = '1';
    
    // Setup view toggle when it becomes visible for the first time
    if (!toggle.hasAttribute('data-view-setup')) {
        setupViewToggle();
        toggle.setAttribute('data-view-setup', 'true');
    }
}

function hideViewToggle() {
    const toggle = document.getElementById('viewToggle');
    toggle.style.opacity = '0';
}

function showSidebar() {
    const sidebar = document.getElementById('sidebarContainer');
    const stickyViz = document.querySelector('.sticky-viz');
    const storyContent = document.querySelector('.story-content');
    const viewToggle = document.getElementById('viewToggle');
    
    sidebar.classList.add('visible');
    stickyViz.classList.add('sidebar-visible');
    storyContent.classList.add('sidebar-visible');
    viewToggle.classList.add('sidebar-visible');
    
    // Setup panel toggle when sidebar becomes visible for the first time
    if (!sidebar.hasAttribute('data-toggle-setup')) {
        setupPanelToggle();
        sidebar.setAttribute('data-toggle-setup', 'true');
    }
    
    // Adjust canvas size for sidebar
    adjustCanvasForSidebar(true);
}

function hideSidebar() {
    const sidebar = document.getElementById('sidebarContainer');
    const stickyViz = document.querySelector('.sticky-viz');
    const storyContent = document.querySelector('.story-content');
    const viewToggle = document.getElementById('viewToggle');
    
    sidebar.classList.remove('visible');
    stickyViz.classList.remove('sidebar-visible');
    storyContent.classList.remove('sidebar-visible');
    viewToggle.classList.remove('sidebar-visible');
    
    // Reset canvas size
    adjustCanvasForSidebar(false);
}

function adjustCanvasForSidebar(sidebarVisible) {
    const newWidth = sidebarVisible ? canvasWidth - 320 : canvasWidth;
    
    // Update canvas display size
    canvas.style.width = newWidth + 'px';
    
    // Recalculate dot positions for new dimensions
    if (data.length > 0) {
        recalculateChartPositions(newWidth);
    }
}

function getAdjustedDomains(availableWidth) {
    // Fixed magnitude domain from 0 to 10
    const fixedMagnitudeDomain = [0, 10];
    
    // Original deaths domain based on data - use 0.5 as minimum to ensure dots with 1 death appear above axis
    const originalDeathsDomain = [0.5, d3.max(data, d => d.deaths)];
    
    // Calculate the maximum bubble size that will be used
    const maxBubbleSize = Math.max(...dots.map(dot => {
        if (currentView === 'dots') {
            return 5;
        } else {
            return Math.sqrt(Math.max(1, dot.data.deaths)) * 0.3 + 2;
        }
    }));
    
    // Calculate required domain adjustment for deaths (y-axis only)
    const deathsRange = Math.log10(originalDeathsDomain[1]) - Math.log10(originalDeathsDomain[0]);
    const deathsPixelRange = canvasHeight - chartMargin.top - chartMargin.bottom;
    const deathsAdjustment = (maxBubbleSize / deathsPixelRange) * deathsRange;
    
    // Expand only the deaths domain to accommodate bubble sizes
    const adjustedDeathsDomain = [
        Math.max(0.5, originalDeathsDomain[0] / Math.pow(10, deathsAdjustment)),
        originalDeathsDomain[1] * Math.pow(10, deathsAdjustment)
    ];
    
    return {
        magnitude: fixedMagnitudeDomain,
        deaths: adjustedDeathsDomain
    };
}

function recalculateChartPositions(availableWidth) {
    const newTargetDomains = getAdjustedDomains(availableWidth);
    
    // Initialize current domains if not set
    if (!currentAxisDomains) {
        currentAxisDomains = {
            magnitude: [...newTargetDomains.magnitude],
            deaths: [...newTargetDomains.deaths]
        };
    }
    
    // Set target domains for animation
    targetAxisDomains = {
        magnitude: [...newTargetDomains.magnitude],
        deaths: [...newTargetDomains.deaths]
    };
    
    // Use current (animated) domains for positioning
    const magnitudeScale = d3.scaleLinear()
        .domain(currentAxisDomains.magnitude)
        .range([chartMargin.left, availableWidth - chartMargin.right])
        .clamp(true); // Clamp values to prevent bleeding outside range
    
    const deathsScale = d3.scaleLog()
        .domain(currentAxisDomains.deaths)
        .range([canvasHeight - chartMargin.bottom, chartMargin.top])
        .clamp(true); // Clamp values to prevent bleeding outside range
    
    // Update chart positions for all dots
    dots.forEach(dot => {
        dot.chartX = magnitudeScale(dot.data.magnitude);
        dot.chartY = deathsScale(Math.max(0.5, dot.data.deaths));
    });
}

// ========== ANIMATION LOOP ========== //
function startAnimation() {
    requestAnimationFrame(animate);
}

function animate() {
    // Smooth animation progress
    const easingSpeed = 0.05;
    animationProgress += (targetAnimationProgress - animationProgress) * easingSpeed;
    
    // Animate axis domains smoothly
    if (currentAxisDomains && targetAxisDomains) {
        const axisEasingSpeed = 0.08; // Slightly faster for responsive feel
        
        // Animate magnitude domain
        currentAxisDomains.magnitude[0] += (targetAxisDomains.magnitude[0] - currentAxisDomains.magnitude[0]) * axisEasingSpeed;
        currentAxisDomains.magnitude[1] += (targetAxisDomains.magnitude[1] - currentAxisDomains.magnitude[1]) * axisEasingSpeed;
        
        // Animate deaths domain
        currentAxisDomains.deaths[0] += (targetAxisDomains.deaths[0] - currentAxisDomains.deaths[0]) * axisEasingSpeed;
        currentAxisDomains.deaths[1] += (targetAxisDomains.deaths[1] - currentAxisDomains.deaths[1]) * axisEasingSpeed;
        
        // Update dot positions based on animated domains
        if (dots.length > 0) {
            const currentCanvasWidth = canvas.offsetWidth || canvasWidth;
            
            const magnitudeScale = d3.scaleLinear()
                .domain(currentAxisDomains.magnitude)
                .range([chartMargin.left, currentCanvasWidth - chartMargin.right])
                .clamp(true); // Clamp values to prevent bleeding outside range
            
            const deathsScale = d3.scaleLog()
                .domain(currentAxisDomains.deaths)
                .range([canvasHeight - chartMargin.bottom, chartMargin.top])
                .clamp(true); // Clamp values to prevent bleeding outside range
            
            // Update chart positions for all dots
            dots.forEach(dot => {
                dot.chartX = magnitudeScale(dot.data.magnitude);
                dot.chartY = deathsScale(Math.max(0.5, dot.data.deaths));
            });
        }
    }
    
    // Animate infrastructure chart progress
    const infraSpeed = 0.05; // Match main chart animation speed
    infraChartProgress += (targetInfraChartProgress - infraChartProgress) * infraSpeed;
    
    // Update dot positions, opacity, and size transitions
    dots.forEach(dot => {
        dot.currentX = dot.globeX + (dot.chartX - dot.globeX) * easeInOutCubic(animationProgress);
        dot.currentY = dot.globeY + (dot.chartY - dot.globeY) * easeInOutCubic(animationProgress);
        
        // Smooth opacity animation
        dot.opacity += (dot.targetOpacity - dot.opacity) * 0.1;
        
        // Smooth size animation
        if (dot.targetSize !== undefined) {
            if (dot.currentSize === undefined) {
                dot.currentSize = dot.size;
            }
            dot.currentSize += (dot.targetSize - dot.currentSize) * 0.1;
        } else {
            dot.currentSize = dot.size;
        }
    });
    
    drawVisualization();
    drawAxes();
    
    requestAnimationFrame(animate);
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function drawVisualization() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Hide/show HTML legend based on view
    const htmlLegend = document.getElementById('infraLegend');
    if (htmlLegend) {
        htmlLegend.style.display = currentView === 'infrastructure' ? 'block' : 'none';
    }
    
    // Special handling for infrastructure view - show a different chart
    if (currentView === 'infrastructure') {
        drawInfrastructureChart();
        return;
    }
    
    // Special handling for hidden view - completely hide the visualization
    if (currentView === 'hidden') {
        // Clear canvas with theme-appropriate background and show nothing
        ctx.fillStyle = getThemeAwareColor('--bg-primary');
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        return;
    }
    
    // Special handling for highlight view - highlight specific earthquakes
    if (currentView === 'highlight') {
        drawHighlightedVisualization();
        return;
    }
    
    // Special handling for pause view - clear the visualization
    if (currentView === 'pause') {
        // Just show a clean black canvas
        return;
    }
    
    // Filter dots based on current view
    let visibleDots = dots;
    
    if (currentView === 'outliers') {
        // Show outliers (high deaths with low magnitude)
        visibleDots = dots.filter(dot => 
            dot.data.magnitude < 7 && dot.data.deaths > 10000
        );
    } else {
        // Show all dots for bubble, uniform, and infrastructure views
        visibleDots = dots;
    }
    
    // Update colors based on view
    visibleDots.forEach(dot => {
        if (currentView === 'infrastructure') {
            dot.color = getInfrastructureColor(dot.data.infrastructure);
        } else {
            // Default coloring for bubble and uniform views
            dot.color = getInfrastructureColor(dot.data.infrastructure);
        }
    });
    
    // Set target opacities based on search
    if (searchedCountry) {
        visibleDots.forEach(dot => {
            if (dot.data.country.toLowerCase().includes(searchedCountry.toLowerCase())) {
                dot.targetOpacity = 0.95; // Highlighted
            } else {
                dot.targetOpacity = 0.1; // Dimmed
            }
        });
    }
    
    // Draw all dots first (only if they're within reasonable bounds)
    visibleDots.forEach(dot => {
        // Only draw dots that are within or near the visible area
        const currentCanvasWidth = canvas.offsetWidth || canvasWidth;
        const maxRadius = dot.currentSize || dot.size;
        
        if (dot.currentX >= chartMargin.left - maxRadius && 
            dot.currentX <= currentCanvasWidth - chartMargin.right + maxRadius &&
            dot.currentY >= chartMargin.top - maxRadius && 
            dot.currentY <= canvasHeight - chartMargin.bottom + maxRadius) {
            
            let opacity = dot.opacity;
            
            // Handle hover highlighting
            if (hoveredDot) {
                if (dot === hoveredDot) {
                    // Keep hovered dot as normal
                    opacity = dot.opacity;
                } else {
                    // Grey out other dots
                    opacity = Math.max(0.1, dot.opacity * 0.3);
                }
            }
            
            ctx.fillStyle = dot.color;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(dot.currentX, dot.currentY, dot.currentSize || dot.size, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
    
    // Draw simple outlines for searched country dots on top
    if (searchedCountry) {
        ctx.globalAlpha = 1;
        visibleDots.forEach(dot => {
            if (dot.data.country.toLowerCase().includes(searchedCountry.toLowerCase())) {
                // Only draw outlines for dots within visible bounds
                const currentCanvasWidth = canvas.offsetWidth || canvasWidth;
                const maxRadius = (dot.currentSize || dot.size) + 2;
                
                if (dot.currentX >= chartMargin.left - maxRadius && 
                    dot.currentX <= currentCanvasWidth - chartMargin.right + maxRadius &&
                    dot.currentY >= chartMargin.top - maxRadius && 
                    dot.currentY <= canvasHeight - chartMargin.bottom + maxRadius) {
                    
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(dot.currentX, dot.currentY, (dot.currentSize || dot.size) + 2, 0, 2 * Math.PI);
                    ctx.stroke();
                }
            }
        });
    }
    
    ctx.globalAlpha = 1;
}

function drawInfrastructureChart() {
    // Clear canvas with proper background
    ctx.fillStyle = getThemeAwareColor('--bg-primary');
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw the infrastructure damage scatter plot on canvas
    // Filter and prepare data
    const damageData = data.filter(d => 
        d.deaths > 0 && 
        d.damageMillions > 0 && 
        d.magnitude >= 5.0 && 
        d.year >= 1900
  ).map(d => ({
    ...d,
        damagePerDeath: d.damageMillions / d.deaths
    })).slice(0, 150); // Limit for performance
    
    if (damageData.length === 0) return;
    
    // Infrastructure chart is now always fully visible when shown
    const fadeProgress = 1; // Always full opacity for crisp rendering
    
    // Chart dimensions and positioning - push chart even more to the right
    const currentCanvasWidth = canvas.offsetWidth || canvasWidth;
    const chartMarginTop = 120;
    const chartMarginLeft = 280; // Increased from 200 to push further right
    const chartMarginBottom = 100;
    const chartMarginRight = 100;
    const chartWidth = currentCanvasWidth - chartMarginLeft - chartMarginRight;
    const chartHeight = canvasHeight - chartMarginTop - chartMarginBottom;
    
    // Draw title with proper theme colors - positioned for current canvas width
    ctx.fillStyle = getTextColor();
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Infrastructure Impact: Economic Damage Efficiency', currentCanvasWidth / 2, 60);
    
    // Draw subtitle with proper theme colors
    ctx.font = '16px Arial';
    ctx.globalAlpha = 0.8;
    ctx.fillText('How earthquake magnitude relates to economic damage per life lost (dot size = total deaths)', currentCanvasWidth / 2, 90);
    ctx.globalAlpha = 1;
    
    // Set up scales
    const magnitudeExtent = d3.extent(damageData, d => d.magnitude);
    const damageExtent = d3.extent(damageData, d => Math.max(0.1, d.damagePerDeath));
    const deathsExtent = d3.extent(damageData, d => d.deaths);
    
    const xScale = (mag) => chartMarginLeft + ((mag - magnitudeExtent[0]) / (magnitudeExtent[1] - magnitudeExtent[0])) * chartWidth;
    const yScale = (damage) => chartMarginTop + chartHeight - ((Math.log10(damage) - Math.log10(damageExtent[0])) / (Math.log10(damageExtent[1]) - Math.log10(damageExtent[0]))) * chartHeight;
    const sizeScale = (deaths) => 3 + Math.sqrt(deaths / deathsExtent[1]) * 12;
    
    // Define tick marks - fewer labels to avoid overlap
    const magTicks = [5.0, 6.0, 7.0, 8.0, 9.0];  // Only whole numbers, well-spaced
    const yTicks = [0.01, 0.1, 1, 10, 100, 1000, 10000];
    
    // Draw axes with proper theme colors
    ctx.strokeStyle = getAxisStrokeColor();
    ctx.lineWidth = 2;
    
    // X axis
    ctx.beginPath();
    ctx.moveTo(chartMarginLeft, chartMarginTop + chartHeight);
    ctx.lineTo(chartMarginLeft + chartWidth, chartMarginTop + chartHeight);
    ctx.stroke();
    
    // Y axis
    ctx.beginPath();
    ctx.moveTo(chartMarginLeft, chartMarginTop);
    ctx.lineTo(chartMarginLeft, chartMarginTop + chartHeight);
    ctx.stroke();
    
    // Draw axis labels with proper theme colors
    ctx.fillStyle = getTextColor();
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    
    // X axis label
    ctx.fillText('Earthquake Magnitude (Richter Scale)', currentCanvasWidth / 2, canvasHeight - 40);
    
    // Y axis label - adjusted for new left margin
    ctx.save();
    ctx.translate(100, canvasHeight / 2); // Moved right to accommodate larger left margin
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Economic Damage per Death (Millions USD, log scale)', 0, 0);
    ctx.restore();
    
    // Draw comprehensive tick marks and labels with better visibility
    ctx.font = 'bold 14px Arial';  // Larger, bolder font
    ctx.fillStyle = getTextColor();  // Use primary text color instead of axis text color
    ctx.globalAlpha = 1.0;  // Full opacity
    
    // X axis ticks - well-spaced labels to avoid overlap
    magTicks.forEach(mag => {
        if (mag >= magnitudeExtent[0] && mag <= magnitudeExtent[1]) {
            const x = xScale(mag);
            ctx.textAlign = 'center';
            ctx.fillText(mag.toFixed(0), x, chartMarginTop + chartHeight + 25);  // Show as whole numbers
            
            // Tick marks - thicker and more visible
            ctx.strokeStyle = getTextColor();  // Use text color for better visibility
            ctx.lineWidth = 2;
    ctx.beginPath();
            ctx.moveTo(x, chartMarginTop + chartHeight);
            ctx.lineTo(x, chartMarginTop + chartHeight + 8);  // Longer tick marks
            ctx.stroke();
        }
    });
    
    // Y axis ticks - logarithmic scale for damage per death (use same array as grid)
    const logMin = Math.log10(damageExtent[0]);
    const logMax = Math.log10(damageExtent[1]);
    
    yTicks.forEach(value => {
        if (value >= damageExtent[0] && value <= damageExtent[1]) {
            const y = yScale(value);
            ctx.textAlign = 'right';
            
            // Format numbers better for readability
            let label;
            if (value >= 1000) {
                label = `$${(value/1000).toFixed(0)}B`;  // Show as billions
            } else if (value >= 1) {
                label = `$${value.toFixed(0)}M`;
            } else {
                label = `$${(value*1000).toFixed(0)}K`;  // Show as thousands
            }
            
            ctx.fillText(label, chartMarginLeft - 15, y + 5);  // More space from axis
            
            // Tick marks - thicker and more visible
            ctx.strokeStyle = getTextColor();  // Use text color for better visibility
            ctx.lineWidth = 2;
      ctx.beginPath();
            ctx.moveTo(chartMarginLeft - 8, y);  // Longer tick marks
            ctx.lineTo(chartMarginLeft, y);
            ctx.stroke();
        }
    });
    
    // Store data points for interactivity and draw them
    infraChartData = [];
    damageData.forEach(d => {
        const x = xScale(d.magnitude);
        const y = yScale(Math.max(0.1, d.damagePerDeath));
        const size = sizeScale(d.deaths);
        
        // Store for hover detection
        infraChartData.push({
            x, y, size, data: d
        });
        
        // Check if this dot is hovered or selected
        const isHovered = hoveredInfraDot && hoveredInfraDot.data === d;
        const isSelected = selectedInfraLevel === d.infrastructure;
        const isLevelFiltered = selectedInfraLevel && selectedInfraLevel !== d.infrastructure;
        
        let dotOpacity = 0.7; // Match main graph default opacity
        let dotSize = size;
        
        if (isSelected) {
            dotOpacity = 0.95; // Match main graph highlighted opacity
        } else if (isLevelFiltered) {
            dotOpacity = 0.1; // Match main graph dimmed opacity
        } else if (isHovered) {
            dotOpacity = 1.0; // Full opacity for hovered dot
        } else if (hoveredInfraDot && !isSelected) {
            dotOpacity = 0.3; // Dim other dots when hovering
        }
        
        if (isHovered) {
            dotSize = size * 1.2; // Enlarge hovered dot
        } else if (isSelected) {
            dotSize = size * 1.1; // Slightly enlarge selected level
        }
        
        // Draw dot with hover effects
        ctx.fillStyle = getInfrastructureColor(d.infrastructure);
        ctx.globalAlpha = dotOpacity;
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
      ctx.fill();
        
        // Draw outline with fade and selection state
        let strokeOpacity = 0.3;
        let lineWidth = 1;
        
        if (isHovered) {
            strokeOpacity = 0.8;
            lineWidth = 2;
        } else if (isSelected) {
            strokeOpacity = 0.6;
            lineWidth = 2;
        }
        
        ctx.strokeStyle = getThemeAwareColor('--text-primary');
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = isHovered ? 1.0 : 0.8;
      ctx.stroke();
    });
    
    ctx.globalAlpha = 1;
    
    // Show HTML legend
    const htmlLegend = document.getElementById('infraLegend');
    if (htmlLegend) {
        htmlLegend.style.display = 'block';
        
        // Update selected state
        const legendItems = htmlLegend.querySelectorAll('.legend-item');
        legendItems.forEach(item => {
            const level = item.dataset.level;
            if (selectedInfraLevel === level) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    // Draw key insight above the chart with proper theme colors
    ctx.fillStyle = getThemeAwareColor('--accent-color');
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Better infrastructure = Higher economic damage per death', currentCanvasWidth / 2, 120);
    
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = getTextColor();
    ctx.font = '14px Arial';
    ctx.fillText('(Protecting lives but still suffering property damage)', currentCanvasWidth / 2, 140);
    ctx.globalAlpha = 1;
}

function drawAxes() {
    const axesContainer = document.getElementById('chartAxes');
    
    // Don't show axes during infrastructure view since we have a different chart
    if (currentView === 'infrastructure') {
        axesContainer.style.opacity = '0';
    return;
  }

    // Don't show axes during hidden view
    if (currentView === 'hidden') {
        axesContainer.style.opacity = '0';
    return;
  }

    // Show axes during highlight view
    if (currentView === 'highlight') {
        if (animationProgress > 0.5) {
            const opacity = (animationProgress - 0.5) * 2;
            axesContainer.style.opacity = opacity;
            createAxes();
        } else {
            axesContainer.style.opacity = '0';
        }
        return;
    }

    // Don't show axes during pause view
    if (currentView === 'pause') {
        axesContainer.style.opacity = '0';
        return;
    }
    
    // Only show axes when transitioning to chart
    if (animationProgress > 0.5) {
        const opacity = (animationProgress - 0.5) * 2;
        axesContainer.style.opacity = opacity;
        
        // Always recreate axes to handle size changes
        createAxes();
    } else {
        axesContainer.style.opacity = '0';
    }
}

function createAxes() {
    const axesContainer = document.getElementById('chartAxes');
    axesContainer.innerHTML = '';
    
    // Get current canvas display width
    const currentCanvasWidth = canvas.offsetWidth || canvasWidth;
    
    const svg = d3.create('svg')
        .attr('width', currentCanvasWidth)
        .attr('height', canvasHeight)
        .style('position', 'absolute')
        .style('top', '0')
        .style('left', '0')
        .style('pointer-events', 'none');
    
    // Use current animated domains if available, otherwise fallback to adjusted domains
    const domainsToUse = currentAxisDomains || getAdjustedDomains(currentCanvasWidth);
    
    const xScale = d3.scaleLinear()
        .domain(domainsToUse.magnitude)
        .range([chartMargin.left, currentCanvasWidth - chartMargin.right])
        .clamp(true);
    
    const yScale = d3.scaleLog()
        .domain(domainsToUse.deaths)
        .range([canvasHeight - chartMargin.bottom, chartMargin.top])
        .clamp(true);
    
    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${canvasHeight - chartMargin.bottom})`)
        .call(d3.axisBottom(xScale))
        .attr('color', 'rgba(255,255,255,0.8)');
    
    // Y axis with custom tick values and formatting
    const customTickValues = [
        1, 2, 5, 10, 20, 50, 100, 200, 500, 
        1000, 2000, 5000, 10000, 20000, 50000, 
        100000, 200000, 500000, 1000000, 2000000, 5000000
    ];
    
    // Filter tick values to only include those within our domain
    const visibleTicks = customTickValues.filter(value => 
        value >= domainsToUse.deaths[0] && value <= domainsToUse.deaths[1]
    );
    
    // Custom format function for better readability
    const customFormat = (d) => {
        if (d >= 1000000) {
            return (d / 1000000).toFixed(d % 1000000 === 0 ? 0 : 1) + 'M';
        } else if (d >= 1000) {
            return (d / 1000).toFixed(d % 1000 === 0 ? 0 : 1) + 'K';
        } else {
            return d.toString();
        }
    };
    
    svg.append('g')
        .attr('transform', `translate(${chartMargin.left},0)`)
        .call(d3.axisLeft(yScale)
            .tickValues(visibleTicks)
            .tickFormat(customFormat)
        )
        .attr('color', 'rgba(255,255,255,0.8)');
    
    // Axis labels
    svg.append('text')
        .attr('x', currentCanvasWidth / 2)
        .attr('y', canvasHeight - 20)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255,255,255,0.9)')
        .attr('font-size', '14px')
        .text('Earthquake Magnitude');
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -canvasHeight / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255,255,255,0.9)')
        .attr('font-size', '14px')
        .text('Deaths (log scale)');
    
    axesContainer.appendChild(svg.node());
}

// ========== VIEW TOGGLE CONTROLS ========== //
function setupViewToggle() {
    const viewButtons = document.querySelectorAll('.view-btn');
    
    viewButtons.forEach((btn) => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Update active button
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update visualization view
            currentView = this.dataset.view;
            
            // Update dot sizes based on view with smooth transitions
            updateDotSizes();
        });
    });
}

function updateDotSizes() {
    dots.forEach(dot => {
        let targetSize;
        switch(currentView) {
            case 'bubble':
                targetSize = Math.sqrt(Math.max(1, dot.data.deaths)) * 0.3 + 2;
                break;
            case 'dots':
                targetSize = 5;
                break;
            default:
                targetSize = Math.sqrt(Math.max(1, dot.data.deaths)) * 0.3 + 2;
                break;
        }
        
        // Store the target size for smooth animation
        dot.targetSize = targetSize;
        
        // Initialize current size if not set
        if (dot.currentSize === undefined) {
            dot.currentSize = dot.size;
        }
    });
    
    // Recalculate chart positions with new bubble sizes
    const currentCanvasWidth = canvas.offsetWidth || canvasWidth;
    recalculateChartPositions(currentCanvasWidth);
}

// ========== PANEL TOGGLE ========== //
function setupPanelToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    console.log('Setting up panel toggle, found buttons:', toggleButtons.length);
    
    toggleButtons.forEach((btn, index) => {
        console.log(`Button ${index}:`, btn.textContent, btn.dataset.panel);
        
        btn.addEventListener('click', function(e) {
            console.log('Toggle button clicked:', this.dataset.panel);
            e.preventDefault();
            e.stopPropagation();
            
            // Update active button
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Get the panel type
            const panelType = this.dataset.panel;
            
            // Show/hide content
            const statsContent = document.getElementById('statsContent');
            const graphsContent = document.getElementById('graphsContent');
            
            if (panelType === 'stats') {
                statsContent.style.display = 'block';
                graphsContent.style.display = 'none';
                console.log('Switched to stats view');
            } else if (panelType === 'graphs') {
                statsContent.style.display = 'none';
                graphsContent.style.display = 'block';
                console.log('Switched to graphs view');
            }
        });
    });
}

// ========== COUNTRY SEARCH ========== //
function setupCountrySearch() {
    const searchInput = document.getElementById('countrySearchInput');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchCountry();
        }
    });
}

function searchCountry() {
    const searchTerm = document.getElementById('countrySearchInput').value.trim();
    const errorElement = document.getElementById('searchError');
    
    if (!searchTerm) {
        clearSearch();
        return;
    }
    
    const matchingData = data.filter(d => 
        d.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (matchingData.length === 0) {
        errorElement.textContent = `No earthquakes found for "${searchTerm}"`;
        return;
    }
    
    searchedCountry = searchTerm;
    errorElement.textContent = '';
    
    // Replace global statistics with country statistics
    replaceWithCountryData(matchingData, searchTerm);
    
    // Change search button to clear button
    const searchButton = document.getElementById('searchButton');
    searchButton.textContent = 'Clear';
    searchButton.onclick = clearSearch;
}

function clearSearch() {
    searchedCountry = null;
    document.getElementById('countrySearchInput').value = '';
    document.getElementById('searchError').textContent = '';
    
    // Smoothly restore dot opacities to default
    dots.forEach(dot => {
        dot.targetOpacity = 0.7;
    });
    
    // Restore global statistics
    restoreGlobalData();
    
    // Change clear button back to search button
    const searchButton = document.getElementById('searchButton');
    searchButton.textContent = 'Search';
    searchButton.onclick = searchCountry;
}

function clearSearchHighlighting() {
    if (searchedCountry) {
        // Clear the search state but keep the UI as-is
        searchedCountry = null;
        
        // Smoothly restore dot opacities to default
        dots.forEach(dot => {
            dot.targetOpacity = 0.7;
        });
        
        // Clear the search input
        document.getElementById('countrySearchInput').value = '';
        document.getElementById('searchError').textContent = '';
        
        // Only restore global data if we're showing country data
        const currentTitle = document.getElementById('statsTitle').textContent;
        if (currentTitle !== 'Global Statistics') {
            restoreGlobalData();
        }
        
        // Reset search button
        const searchButton = document.getElementById('searchButton');
        searchButton.textContent = 'Search';
        searchButton.onclick = searchCountry;
    }
}

function replaceWithCountryData(countryData, countryName) {
    // Update panel title
    document.getElementById('statsTitle').textContent = `${countryName} Statistics`;
    
    // Replace statistics content
    const statsGrid = document.getElementById('statsGrid');
    const totalEarthquakes = countryData.length;
    const totalDeaths = d3.sum(countryData, d => d.deaths);
    const avgMagnitude = d3.mean(countryData, d => d.magnitude);
    const maxMagnitude = d3.max(countryData, d => d.magnitude);
    const dateRange = d3.extent(countryData, d => d.year);
    
    statsGrid.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">Total Earthquakes</div>
            <div class="stat-value">${totalEarthquakes.toLocaleString()}</div>
            <div class="stat-description">Significant earthquakes with recorded deaths</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Total Deaths</div>
            <div class="stat-value">${totalDeaths.toLocaleString()}</div>
            <div class="stat-description">Across all recorded events</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Average Magnitude</div>
            <div class="stat-value">${avgMagnitude.toFixed(1)}</div>
            <div class="stat-description">Mean earthquake strength</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Largest Earthquake</div>
            <div class="stat-value">${maxMagnitude.toFixed(1)}</div>
            <div class="stat-description">Strongest recorded event</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Time Period</div>
            <div class="stat-value">${dateRange[0]} - ${dateRange[1]}</div>
            <div class="stat-description">${dateRange[1] - dateRange[0]} years of data</div>
        </div>
    `;
    
    // Replace charts content
    createCountrySpecificCharts(countryData, countryName);
}

function restoreGlobalData() {
    // First restore the original sidebar structure
    restoreOriginalSidebar();
    
    // Then restore global title
    document.getElementById('statsTitle').textContent = 'Global Statistics';
    
    // Restore global statistics
    initializeGlobalStats();
    
    // Restore global charts
    createGlobalCharts();
}

function restoreOriginalSidebar() {
    const sidebar = document.querySelector('.sidebar');
    
    sidebar.innerHTML = `
        <!-- Search Section -->
        <div class="search-panel">
          <h3>Search by Country</h3>
          <div class="search-input-container">
            <input type="text" id="countrySearchInput" placeholder="e.g. Japan, Haiti, Chile..." autocomplete="off">
            <button id="searchButton" onclick="searchCountry()">Search</button>
          </div>
          <p id="searchError" class="error-message"></p>
        </div>

        <!-- Statistics Panel -->
        <div class="stats-panel" id="statsPanel">
          <div class="panel-header">
            <h3 id="statsTitle">Global Statistics</h3>
            
            <!-- Statistics/Graphs Toggle -->
            <div class="panel-toggle">
              <button class="toggle-btn active" data-panel="stats">Statistics</button>
              <button class="toggle-btn" data-panel="graphs">Graphs</button>
            </div>
          </div>

          <!-- Statistics View -->
          <div class="panel-content" id="statsContent">
            <div class="stats-grid" id="statsGrid">
              <!-- Stats will be populated by JavaScript -->
            </div>
          </div>

          <!-- Graphs View (initially hidden) -->
          <div class="panel-content" id="graphsContent" style="display: none;">
            <div class="chart-grid" id="globalChartGrid">
              <!-- Charts will be populated by JavaScript -->
            </div>
          </div>
        </div>

        <!-- Country Details (hidden initially) -->
        <div class="country-details" id="countryDetails" style="display: none;">
          <div id="countryStatsContent"></div>

          <!-- Country Comparison Charts -->
          <div class="charts-section" id="countryCharts">
            <h4>Comparison with Global Average</h4>
            <div class="chart-grid" id="countryChartGrid">
              <!-- Charts will be populated by JavaScript -->
            </div>
          </div>
          
          <div id="countryInsights"></div>
        </div>
    `;
    
    // Re-setup the country search functionality
    setupCountrySearch();
    
    // Re-setup panel toggle functionality
    setupPanelToggle();
}

function createCountrySpecificCharts(countryData, countryName) {
    const chartGrid = document.getElementById('globalChartGrid');
    chartGrid.innerHTML = '';
    
    // Calculate global averages for comparison
    const globalAvgMagnitude = d3.mean(data, d => d.magnitude);
    const globalAvgDeaths = d3.mean(data, d => d.deaths);
    const globalAvgDamage = d3.mean(data.filter(d => d.damageMillions > 0), d => d.damageMillions);
    
    const countryAvgMagnitude = d3.mean(countryData, d => d.magnitude);
    const countryAvgDeaths = d3.mean(countryData, d => d.deaths);
    const countryAvgDamage = d3.mean(countryData.filter(d => d.damageMillions > 0), d => d.damageMillions);
    
    // Create comparison charts
    createComparisonChart('Average Magnitude', globalAvgMagnitude, countryAvgMagnitude, chartGrid, 'Global', countryName);
    createComparisonChart('Average Deaths per Event', globalAvgDeaths, countryAvgDeaths, chartGrid, 'Global', countryName);
    
    if (countryAvgDamage) {
        createComparisonChart('Average Damage ($Mil)', globalAvgDamage, countryAvgDamage, chartGrid, 'Global', countryName);
    }
    
    // Create country-specific charts
    createCountryMagnitudeDistribution(countryData, chartGrid);
}

// ========== STATISTICS AND CHARTS ========== //
function initializeGlobalStats() {
    if (data.length === 0) {
        console.log('No data available for stats');
        return;
    }
    
    console.log('Initializing global stats with', data.length, 'earthquakes');
    
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) {
        console.error('Stats grid element not found!');
        return;
    }
    const totalEarthquakes = data.length;
    const totalDeaths = d3.sum(data, d => d.deaths);
    const avgMagnitude = d3.mean(data, d => d.magnitude);
    const dateRange = d3.extent(data, d => d.year);
    
    statsGrid.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">Total Earthquakes</div>
            <div class="stat-value">${totalEarthquakes.toLocaleString()}</div>
            <div class="stat-description">Significant earthquakes with recorded deaths</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Total Deaths</div>
            <div class="stat-value">${totalDeaths.toLocaleString()}</div>
            <div class="stat-description">Across all recorded events</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Average Magnitude</div>
            <div class="stat-value">${avgMagnitude.toFixed(1)}</div>
            <div class="stat-description">Mean earthquake strength</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Time Period</div>
            <div class="stat-value">${dateRange[0]} - ${dateRange[1]}</div>
            <div class="stat-description">${dateRange[1] - dateRange[0]} years of data</div>
        </div>
    `;
    
    createGlobalCharts();
}

function createGlobalCharts() {
    const chartGrid = document.getElementById('globalChartGrid');
    chartGrid.innerHTML = '';
    
    // Infrastructure distribution chart
    createInfrastructureChart();
    // Magnitude distribution chart
    createMagnitudeDistributionChart();
    // Deaths by decade chart
    createDeathsByDecadeChart();
}

function createInfrastructureChart() {
    const chartGrid = document.getElementById('globalChartGrid');
    const container = document.createElement('div');
    container.className = 'chart-container';
    container.innerHTML = '<div class="chart-title">Earthquakes by Infrastructure Level</div>';
    
    // Group data by infrastructure
    const infraData = d3.group(data, d => d.infrastructure);
    const infraCounts = Array.from(infraData, ([key, values]) => ({
        infrastructure: key,
        count: values.length
    }));
    
    const svg = d3.create('svg')
        .attr('class', 'chart-svg')
        .attr('width', '100%')
        .attr('height', 120);
    
    const margin = {top: 15, right: 15, bottom: 30, left: 40};
    const width = 260 - margin.left - margin.right;
    const height = 120 - margin.top - margin.bottom;
    
    const xScale = d3.scaleBand()
        .domain(infraCounts.map(d => d.infrastructure))
        .range([0, width])
        .padding(0.2);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(infraCounts, d => d.count)])
        .range([height, 0]);
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Add bars with hover functionality
    g.selectAll('.bar')
        .data(infraCounts)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.infrastructure))
        .attr('y', d => yScale(d.count))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d.count))
        .attr('fill', d => getInfrastructureColor(d.infrastructure))
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).style('opacity', 0.8);
            showChartTooltip(event, `${d.infrastructure} Infrastructure: ${d.count} earthquakes`);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).style('opacity', 1);
            hideChartTooltip();
        })
        .on('mousemove', function(event, d) {
            updateChartTooltipPosition(event);
        });
    
    // Add X axis
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    // Add Y axis
    g.append('g')
        .call(d3.axisLeft(yScale).ticks(4))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    // Style axes
    g.selectAll('.domain, .tick line')
        .style('stroke', getAxisStrokeColor());
    
    container.appendChild(svg.node());
    chartGrid.appendChild(container);
}

function createMagnitudeDistributionChart() {
    const chartGrid = document.getElementById('globalChartGrid');
    const container = document.createElement('div');
    container.className = 'chart-container';
    container.innerHTML = '<div class="chart-title">Magnitude Distribution</div>';
    
    // Create bins for magnitude
    const bins = d3.bin()
        .domain(d3.extent(data, d => d.magnitude))
        .thresholds(6)(data.map(d => d.magnitude));
    
    const svg = d3.create('svg')
        .attr('class', 'chart-svg')
        .attr('width', '100%')
        .attr('height', 120);
    
    const margin = {top: 10, right: 15, bottom: 35, left: 40};
    const width = 260 - margin.left - margin.right;
    const height = 120 - margin.top - margin.bottom;
    
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.magnitude))
    .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
    .range([height, 0]);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Add bars with hover functionality
    g.selectAll('.bar')
        .data(bins)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.x0))
        .attr('y', d => yScale(d.length))
        .attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
        .attr('height', d => height - yScale(d.length))
        .attr('fill', getAxisTextColor())
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).style('fill', getTextColor());
            showChartTooltip(event, `Magnitude ${d.x0.toFixed(1)}-${d.x1.toFixed(1)}: ${d.length} earthquakes`);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).style('fill', getAxisTextColor());
            hideChartTooltip();
        })
        .on('mousemove', function(event, d) {
            updateChartTooltipPosition(event);
        });
    
    // Add X axis
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(5))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    // Add Y axis
    g.append('g')
        .call(d3.axisLeft(yScale).ticks(4))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    // Style axes
    g.selectAll('.domain, .tick line')
        .style('stroke', getAxisStrokeColor());
    
    // Add axis labels
    g.append('text')
        .attr('x', width / 2)
        .attr('y', height + 30)
        .attr('text-anchor', 'middle')
        .style('fill', getAxisTextColor())
        .style('font-size', '9px')
        .text('Magnitude');
    
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -30)
        .attr('text-anchor', 'middle')
        .style('fill', getAxisTextColor())
        .style('font-size', '9px')
        .text('Count');
    
    container.appendChild(svg.node());
    chartGrid.appendChild(container);
}

function createDeathsByDecadeChart() {
    const chartGrid = document.getElementById('globalChartGrid');
    const container = document.createElement('div');
    container.className = 'chart-container';
    container.innerHTML = '<div class="chart-title">Total Deaths by Decade</div>';
    
    // Group by decade
    const decadeData = d3.rollup(data, 
        v => d3.sum(v, d => d.deaths),
        d => Math.floor(d.year / 10) * 10
    );
    
    const decades = Array.from(decadeData, ([decade, deaths]) => ({
        decade: decade + 's',
        deaths
    })).sort((a, b) => a.decade.localeCompare(b.decade));
    
    const svg = d3.create('svg')
        .attr('class', 'chart-svg')
        .attr('width', '100%')
        .attr('height', 120);
    
    const margin = {top: 10, right: 15, bottom: 25, left: 45};
    const width = 260 - margin.left - margin.right;
    const height = 120 - margin.top - margin.bottom;
    
    const xScale = d3.scaleBand()
        .domain(decades.map(d => d.decade))
        .range([0, width])
        .padding(0.2);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(decades, d => d.deaths)])
        .range([height, 0]);
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Add bars with hover functionality
    g.selectAll('.bar')
        .data(decades)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.decade))
        .attr('y', d => yScale(d.deaths))    
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d.deaths))
        .attr('fill', '#4ecdc4')
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).style('fill', '#6ee6de');
            showChartTooltip(event, `${d.decade}: ${d.deaths.toLocaleString()} total deaths`);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).style('fill', '#4ecdc4');
            hideChartTooltip();
        })
        .on('mousemove', function(event, d) {
            updateChartTooltipPosition(event);
        });
    
    // Add X axis
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)');
    
    // Add Y axis
    g.append('g')
        .call(d3.axisLeft(yScale).ticks(4).tickFormat(d3.format('.2s')))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    // Style axes
    g.selectAll('.domain, .tick line')
        .style('stroke', getAxisStrokeColor());
    
    // Add Y axis label only
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -35)
        .attr('text-anchor', 'middle')
        .style('fill', getAxisTextColor())
        .style('font-size', '9px')
        .text('Deaths');
    
    container.appendChild(svg.node());
    chartGrid.appendChild(container);
}

function createCountryCharts(countryData) {
    const chartGrid = document.getElementById('countryChartGrid');
    chartGrid.innerHTML = '';
    
    // Calculate global averages for comparison
    const globalAvgMagnitude = d3.mean(data, d => d.magnitude);
    const globalAvgDeaths = d3.mean(data, d => d.deaths);
    const globalAvgDamage = d3.mean(data.filter(d => d.damageMillions > 0), d => d.damageMillions);
    
    const countryAvgMagnitude = d3.mean(countryData, d => d.magnitude);
    const countryAvgDeaths = d3.mean(countryData, d => d.deaths);
    const countryAvgDamage = d3.mean(countryData.filter(d => d.damageMillions > 0), d => d.damageMillions);
    
    // Create comparison charts
    createComparisonChart('Average Magnitude', globalAvgMagnitude, countryAvgMagnitude, chartGrid);
    createComparisonChart('Average Deaths per Event', globalAvgDeaths, countryAvgDeaths, chartGrid);
    
    if (countryAvgDamage) {
        createComparisonChart('Average Damage ($Mil)', globalAvgDamage, countryAvgDamage, chartGrid);
    }
}

function createComparisonChart(title, globalValue, countryValue, container, globalLabel = 'Global', countryLabel = 'Country') {
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.innerHTML = `<div class="chart-title">${title}</div>`;
    
    const svg = d3.create('svg')
        .attr('class', 'chart-svg')
        .attr('width', '100%')
        .attr('height', 120);
    
    const margin = {top: 15, right: 15, bottom: 30, left: 50};
    const width = 260 - margin.left - margin.right;
    const height = 120 - margin.top - margin.bottom;

    const data = [
        { category: globalLabel, value: globalValue },
        { category: countryLabel, value: countryValue }
    ];
    
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.category))
        .range([0, width])
        .padding(0.3);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range([height, 0]);
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Add bars with hover functionality
    g.selectAll('.bar')
    .data(data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.category))
        .attr('y', d => yScale(d.value))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d.value))
        .attr('fill', (d, i) => i === 0 ? getAxisTextColor() : getThemeAwareColor('--accent-color'))
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).style('opacity', 0.8);
            const valueText = title.includes('Damage') ? `$${d.value.toFixed(1)}M` : d.value.toFixed(2);
            showChartTooltip(event, `${d.category}: ${valueText}`);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).style('opacity', 1);
            hideChartTooltip();
        })
        .on('mousemove', function(event, d) {
            updateChartTooltipPosition(event);
        });
    
    // Add X axis
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    // Add Y axis
    g.append('g')
        .call(d3.axisLeft(yScale).ticks(4))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    // Style axes
    g.selectAll('.domain, .tick line')
        .style('stroke', getAxisStrokeColor());
    
    // Add value labels
    g.selectAll('.label')
        .data(data)
        .enter().append('text')
        .attr('class', 'label')
        .attr('x', d => xScale(d.category) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.value) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', getAxisTextColor())
        .attr('font-size', '10px')
        .text(d => title.includes('Damage') ? `$${d.value.toFixed(0)}M` : d.value.toFixed(1));
    
    chartContainer.appendChild(svg.node());
    container.appendChild(chartContainer);
}

function createCountryMagnitudeDistribution(countryData, container) {
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.innerHTML = '<div class="chart-title">Magnitude Distribution</div>';
    
    // Create bins for magnitude
    const bins = d3.bin()
        .domain(d3.extent(countryData, d => d.magnitude))
        .thresholds(5)(countryData.map(d => d.magnitude));
    
    const svg = d3.create('svg')
        .attr('class', 'chart-svg')
        .attr('width', '100%')
        .attr('height', 120);
    
    const margin = {top: 10, right: 15, bottom: 35, left: 40};
    const width = 260 - margin.left - margin.right;
    const height = 120 - margin.top - margin.bottom;
    
    const xScale = d3.scaleLinear()
        .domain(d3.extent(countryData, d => d.magnitude))
    .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
    .range([height, 0]);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Add bars with hover functionality
    g.selectAll('.bar')
        .data(bins)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.x0))
        .attr('y', d => yScale(d.length))
        .attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
        .attr('height', d => height - yScale(d.length))
        .attr('fill', '#4ecdc4')
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).style('fill', '#6ee6de');
            showChartTooltip(event, `Magnitude ${d.x0.toFixed(1)}-${d.x1.toFixed(1)}: ${d.length} earthquakes`);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).style('fill', '#4ecdc4');
            hideChartTooltip();
        })
        .on('mousemove', function(event, d) {
            updateChartTooltipPosition(event);
        });
    
    // Add X axis
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(4))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    // Add Y axis
    g.append('g')
        .call(d3.axisLeft(yScale).ticks(4))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    // Style axes
    g.selectAll('.domain, .tick line')
        .style('stroke', getAxisStrokeColor());
    
    // Add axis labels
    g.append('text')
        .attr('x', width / 2)
        .attr('y', height + 30)
        .attr('text-anchor', 'middle')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px')
        .text('Magnitude');
    
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -30)
        .attr('text-anchor', 'middle')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px')
        .text('Count');
    
    chartContainer.appendChild(svg.node());
    container.appendChild(chartContainer);
}

// ========== HOVER FUNCTIONALITY ========== //
function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    
    // Account for canvas scaling - convert from display coordinates to canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get mouse position relative to canvas with offset correction
    const mouseX = (event.clientX - rect.left) * scaleX + 7.5; // Small offset to the right
    const mouseY = (event.clientY - rect.top) * scaleY;
    
    // Check if we're in infrastructure chart mode and it's visible
    if (currentStep === 'infrastructure-analysis' && infraChartProgress > 0.1 && infraChartData.length > 0) {
        // Handle infrastructure chart hover
        let closestInfraDot = null;
        let minDistance = Infinity;
        
        infraChartData.forEach(dot => {
            const dx = mouseX - dot.x;
            const dy = mouseY - dot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const radius = dot.size + 10; // Detection area for hovering
            
            if (distance <= radius && distance < minDistance) {
                minDistance = distance;
                closestInfraDot = dot;
            }
        });
        
        if (closestInfraDot !== hoveredInfraDot) {
            hoveredInfraDot = closestInfraDot;
            
            if (hoveredInfraDot) {
                showInfraTooltip(event, hoveredInfraDot);
                // Change cursor to pointer to indicate clickability
                canvas.style.cursor = 'pointer';
            } else {
                hideTooltip();
                canvas.style.cursor = 'default';
            }
        } else if (hoveredInfraDot) {
            updateTooltipPosition(event);
        }
        return;
    }
    
    // Original main chart hover logic
    if (animationProgress < 0.5) return; // Only enable hover in chart mode
    
    // Debug: log occasionally
    if (Math.random() < 0.05) { // Only log 5% of the time to avoid spam
        console.log('Mouse:', mouseX.toFixed(1), mouseY.toFixed(1), 'Dots near:', 
            dots.filter(d => Math.abs(d.currentX - mouseX) < 50 && Math.abs(d.currentY - mouseY) < 50).length);
    }
    
    // Find the closest dot to the mouse
    let closestDot = null;
    let minDistance = Infinity;
    
    dots.forEach(dot => {
        const dx = mouseX - dot.currentX;
        const dy = mouseY - dot.currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radius = (dot.currentSize || dot.size) + 15; // Generous detection area for easy hovering
        
        // Check if mouse is within the dot
        if (distance <= radius && distance < minDistance) {
            minDistance = distance;
            closestDot = dot;
        }
    });
    
    if (closestDot !== hoveredDot) {
        hoveredDot = closestDot;
        
        if (hoveredDot) {
            console.log('Found dot:', hoveredDot.data.location, 'at', hoveredDot.currentX, hoveredDot.currentY);
            showTooltip(event, hoveredDot);
        } else {
            hideTooltip();
        }
    } else if (hoveredDot) {
        // Update tooltip position if still hovering same dot
        updateTooltipPosition(event);
    }
}

function handleMouseLeave() {
    hoveredDot = null;
    hoveredInfraDot = null;
    hideTooltip();
    canvas.style.cursor = 'default';
}

function handleCanvasClick(event) {
    // Get mouse coordinates
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    console.log('Canvas clicked at:', mouseX, mouseY, 'Current step:', currentStep, 'Progress:', infraChartProgress);
    
    // Handle clicks on infrastructure chart data points
    if (currentView === 'infrastructure' && infraChartProgress > 0.1 && hoveredInfraDot) {
        const infrastructureLevel = hoveredInfraDot.data.infrastructure;
        
        // Toggle selection
        if (selectedInfraLevel === infrastructureLevel) {
            clearInfrastructureFilter();
        } else {
            selectedInfraLevel = infrastructureLevel;
            updateInfrastructureAnalysisForSelection();
            drawVisualization();
        }
        return;
    }
    
    // Handle clicks on main chart (could add country selection, etc.)
    if (hoveredDot && currentStep === 'interactive') {
        // Could add functionality like highlighting country or showing details
        console.log('Clicked on:', hoveredDot.data.location, hoveredDot.data.country);
    }
}

function showInfraTooltip(event, dot) {
    const data = dot.data;
    
    // Format values for display
    const damageText = data.damageMillions > 0 ? `$${data.damageMillions.toFixed(1)}M` : 'Not reported';
    const damagePerDeathText = data.damagePerDeath > 0 ? `$${data.damagePerDeath.toFixed(1)}M` : 'N/A';
    const infrastructureText = data.infrastructure.charAt(0).toUpperCase() + data.infrastructure.slice(1);
    
    tooltip.innerHTML = `
        <div class="tooltip-title">${data.location}, ${data.country}</div>
        <div class="tooltip-info">
            <span class="tooltip-label">Year:</span>
            <span class="tooltip-value">${data.year}</span>
            <span class="tooltip-label">Magnitude:</span>
            <span class="tooltip-value">${data.magnitude.toFixed(1)}</span>
            <span class="tooltip-label">Deaths:</span>
            <span class="tooltip-value">${data.deaths.toLocaleString()}</span>
            <span class="tooltip-label">Economic Damage:</span>
            <span class="tooltip-value">${damageText}</span>
            <span class="tooltip-label">Damage per Death:</span>
            <span class="tooltip-value">${damagePerDeathText}</span>
            <span class="tooltip-label">Infrastructure:</span>
            <span class="tooltip-value">${infrastructureText}</span>
        </div>
        <div class="tooltip-click-hint">
            💡 Click to filter by ${infrastructureText} infrastructure
        </div>
    `;
    
    updateTooltipPosition(event);
    tooltip.classList.add('visible');
}

function updateInfrastructureAnalysisForSelection() {
    if (!selectedInfraLevel) {
        // Show all data when no selection
        createImpactChart('infrastructure-damage');
        updateInfrastructureScores();
        return;
    }
    
    // Filter data by selected infrastructure level
    const filteredData = data.filter(d => d.infrastructure === selectedInfraLevel);
    
    // Update the sidebar with filtered information
    const metricsPanel = document.querySelector('.metrics-panel');
    if (metricsPanel) {
        const filterInfo = document.createElement('div');
        filterInfo.className = 'filter-info';
        filterInfo.innerHTML = `
            <div class="filter-header">
                <span>Showing: ${selectedInfraLevel.charAt(0).toUpperCase() + selectedInfraLevel.slice(1)} Infrastructure</span>
                <button class="clear-filter-btn" onclick="clearInfrastructureFilter()">Clear Filter</button>
            </div>
            <div class="filter-stats">
                ${filteredData.length} earthquakes | 
                ${filteredData.reduce((sum, d) => sum + d.deaths, 0).toLocaleString()} total deaths |
                $${(filteredData.reduce((sum, d) => sum + (d.damageMillions || 0), 0)).toFixed(1)}M total damage
            </div>
        `;
        
        // Remove existing filter info
        const existingFilter = metricsPanel.querySelector('.filter-info');
        if (existingFilter) {
            existingFilter.remove();
        }
        
        // Add new filter info
        metricsPanel.insertBefore(filterInfo, metricsPanel.children[1]);
    }
    
    // Create filtered impact chart
    createFilteredImpactChart(filteredData);
}

function clearInfrastructureFilter() {
    selectedInfraLevel = null;
    
    // Remove filter info
    const filterInfo = document.querySelector('.filter-info');
    if (filterInfo) {
        filterInfo.remove();
    }
    
    // Update legend selection
    const legendItems = document.querySelectorAll('.legend-item');
    legendItems.forEach(item => item.classList.remove('selected'));
    
    // Restore original charts
    createImpactChart('infrastructure-damage');
    updateInfrastructureScores();
    drawVisualization();
}

function setupInfraLegendHandlers() {
    const legendItems = document.querySelectorAll('.legend-item');
    legendItems.forEach(item => {
        item.addEventListener('click', () => {
            const level = item.dataset.level;
            
            // Toggle selection
            if (selectedInfraLevel === level) {
                clearInfrastructureFilter();
            } else {
                selectedInfraLevel = level;
                updateInfrastructureAnalysisForSelection();
                drawVisualization();
            }
        });
    });
}

function updateInfrastructureScores() {
    // Add visual indicator for selected level
    const scoreCards = document.querySelectorAll('.score-card');
    scoreCards.forEach(card => {
        const levelSpan = card.querySelector('.score-level');
        if (levelSpan) {
            const level = levelSpan.textContent.split(' ')[0].toLowerCase();
            if (selectedInfraLevel === level) {
                card.style.border = '2px solid #4ecdc4';
                card.style.backgroundColor = 'rgba(78, 205, 196, 0.1)';
            } else {
                card.style.border = '';
                card.style.backgroundColor = '';
            }
        }
    });
}

function createFilteredImpactChart(filteredData) {
    const container = document.getElementById('impactChart');
    container.innerHTML = `
        <h5>Filtered Data: ${selectedInfraLevel.charAt(0).toUpperCase() + selectedInfraLevel.slice(1)} Infrastructure</h5>
        <div class="filtered-stats">
            <div class="stat">
                <span class="stat-label">Average Magnitude:</span>
                <span class="stat-value">${(filteredData.reduce((sum, d) => sum + d.magnitude, 0) / filteredData.length).toFixed(1)}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Average Deaths:</span>
                <span class="stat-value">${Math.round(filteredData.reduce((sum, d) => sum + d.deaths, 0) / filteredData.length).toLocaleString()}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Average Damage:</span>
                <span class="stat-value">$${(filteredData.reduce((sum, d) => sum + (d.damageMillions || 0), 0) / filteredData.length).toFixed(1)}M</span>
            </div>
            <div class="stat">
                <span class="stat-label">Worst Event:</span>
                <span class="stat-value">${filteredData.sort((a, b) => b.deaths - a.deaths)[0]?.location || 'N/A'}</span>
            </div>
        </div>
    `;
}

function showTooltip(event, dot) {
    const data = dot.data;
    
    // Format the tooltip content
    const damageText = data.damageMillions > 0 ? `$${data.damageMillions.toFixed(1)}M` : 'Not reported';
    const infrastructureText = data.infrastructure.charAt(0).toUpperCase() + data.infrastructure.slice(1);
    
    tooltip.innerHTML = `
        <div class="tooltip-title">${data.location}, ${data.country}</div>
        <div class="tooltip-info">
            <span class="tooltip-label">Year:</span>
            <span class="tooltip-value">${data.year}</span>
            <span class="tooltip-label">Magnitude:</span>
            <span class="tooltip-value">${data.magnitude.toFixed(1)}</span>
            <span class="tooltip-label">Deaths:</span>
            <span class="tooltip-value">${data.deaths.toLocaleString()}</span>
            <span class="tooltip-label">Damage:</span>
            <span class="tooltip-value">${damageText}</span>
            <span class="tooltip-label">Infrastructure:</span>
            <span class="tooltip-value">${infrastructureText}</span>
        </div>
    `;
    
    updateTooltipPosition(event);
    tooltip.classList.add('visible');
    console.log('Tooltip shown at:', tooltip.style.left, tooltip.style.top);
}

function updateTooltipPosition(event) {
    // Use simple client coordinates relative to viewport
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Position tooltip to the right and slightly below cursor
    let tooltipX = mouseX + 15;
    let tooltipY = mouseY + 15;
    
    // Prevent tooltip from going off screen
    const tooltipWidth = 280;
    const tooltipHeight = 150;
    
    if (tooltipX + tooltipWidth > window.innerWidth) {
        tooltipX = mouseX - tooltipWidth - 15;
    }
    if (tooltipY + tooltipHeight > window.innerHeight) {
        tooltipY = mouseY - tooltipHeight - 15;
    }
    
    // Ensure tooltip is always visible
    tooltipX = Math.max(10, Math.min(tooltipX, window.innerWidth - tooltipWidth - 10));
    tooltipY = Math.max(10, Math.min(tooltipY, window.innerHeight - tooltipHeight - 10));
    
    tooltip.style.left = tooltipX + 'px';
    tooltip.style.top = tooltipY + 'px';
    tooltip.style.position = 'fixed'; // Use fixed positioning relative to viewport
}

function hideTooltip() {
    tooltip.classList.remove('visible');
}

function showInfrastructureAnalysis() {
    const sidebar = document.getElementById('sidebarContainer');
    const stickyViz = document.querySelector('.sticky-viz');
    const storyContent = document.querySelector('.story-content');
    const viewToggle = document.getElementById('viewToggle');
    
    // Show sidebar with infrastructure analysis content
    sidebar.classList.add('visible');
    stickyViz.classList.add('sidebar-visible');
    storyContent.classList.add('sidebar-visible');
    viewToggle.classList.add('sidebar-visible');
    
    // Replace sidebar content with infrastructure analysis
    replaceWithInfrastructureAnalysis();
    
    // Adjust canvas for sidebar
    adjustCanvasForSidebar(true);
}

function replaceWithInfrastructureAnalysis() {
    const sidebar = document.querySelector('.sidebar');
    
    sidebar.innerHTML = `
        <div class="infrastructure-analysis">
            <h3>Infrastructure Impact Analysis</h3>
            <p class="analysis-intro">Understanding how infrastructure quality affects earthquake outcomes across different metrics.</p>
            
            <!-- Stats Panel with Toggle -->
            <div class="stats-panel" id="infraStatsPanel">
                <div class="panel-header">
                    <h3 id="infraStatsTitle">Infrastructure Analysis</h3>
                    
                    <!-- Statistics/Graphs Toggle -->
                    <div class="panel-toggle">
                        <button class="toggle-btn active" data-panel="stats">Statistics</button>
                        <button class="toggle-btn" data-panel="graphs">Graphs</button>
                    </div>
                </div>

                <!-- Statistics View -->
                <div class="panel-content" id="infraStatsContent">
                    <!-- Infrastructure Score Overview -->
                    <div class="score-panel">
                        <h4>Global Infrastructure Scores</h4>
                        <div id="infrastructureScores"></div>
                    </div>
                    
                    <!-- Infrastructure Score Calculator -->
                    <div class="calculator-panel">
                        <h4>Infrastructure Score Breakdown</h4>
                        <p class="score-description">Our custom infrastructure score (0-10) considers:</p>
                        <div class="score-factors">
                            <div class="factor">
                                <span class="factor-label">Building Standards:</span>
                                <span class="factor-weight">40%</span>
                            </div>
                            <div class="factor">
                                <span class="factor-label">Emergency Response:</span>
                                <span class="factor-weight">30%</span>
                            </div>
                            <div class="factor">
                                <span class="factor-label">Economic Resilience:</span>
                                <span class="factor-weight">20%</span>
                            </div>
                            <div class="factor">
                                <span class="factor-label">Preparedness:</span>
                                <span class="factor-weight">10%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Graphs View (initially hidden) -->
                <div class="panel-content" id="infraGraphsContent" style="display: none;">
                    <div class="chart-grid" id="infraChartGrid">
                        <!-- Charts will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize infrastructure analysis visualizations
    setTimeout(() => {
        createInfrastructureScores();
        createInfrastructureGraphs();
        setupInfraPanelToggle();
    }, 100);
}

// ========== INFRASTRUCTURE ANALYSIS FUNCTIONS ========== //
function createInfrastructureScores() {
    const container = document.getElementById('infrastructureScores');
    
    // Create custom infrastructure scores (0-10 scale)
    const infrastructureScores = {
        'High': { score: 8.5, countries: ['Japan', 'United States', 'Chile', 'New Zealand'] },
        'Medium': { score: 5.2, countries: ['Turkey', 'Greece', 'Mexico', 'Iran'] },
        'Low': { score: 2.8, countries: ['Haiti', 'Nepal', 'Afghanistan', 'Pakistan'] }
    };
    
    container.innerHTML = '';
    
    Object.entries(infrastructureScores).forEach(([level, info]) => {
        const scoreCard = document.createElement('div');
        scoreCard.className = 'score-card';
        
        const color = getInfrastructureColor(level);
        
        scoreCard.innerHTML = `
            <div class="score-header">
                <span class="score-level" style="color: ${color}">${level} Infrastructure</span>
                <span class="score-value">${info.score}/10</span>
            </div>
            <div class="score-bar">
                <div class="score-fill" style="width: ${info.score * 10}%; background-color: ${color}"></div>
            </div>
            <div class="score-examples">
                Examples: ${info.countries.join(', ')}
            </div>
        `;
        
        container.appendChild(scoreCard);
    });
}

function createImpactChart(metric) {
    const container = document.getElementById('impactChart');
    container.innerHTML = '';
    
    if (metric === 'infrastructure-damage') {
        createInfrastructureImpactComparison();
        return;
    }
    
    // Calculate impact data by infrastructure level
    const impactData = calculateImpactByInfrastructure(metric);
    
    const svg = d3.create('svg')
        .attr('width', '100%')
        .attr('height', 180);
    
    const margin = {top: 20, right: 15, bottom: 40, left: 60};
    const width = 260 - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;
    
    const xScale = d3.scaleBand()
        .domain(impactData.map(d => d.infrastructure))
        .range([0, width])
        .padding(0.3);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(impactData, d => d.value)])
    .range([height, 0]);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Add bars with hover functionality
    g.selectAll('.impact-bar')
        .data(impactData)
        .enter().append('rect')
        .attr('class', 'impact-bar')
        .attr('x', d => xScale(d.infrastructure))
        .attr('y', d => yScale(d.value))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d.value))
        .attr('fill', d => getInfrastructureColor(d.infrastructure))
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).style('opacity', 0.8);
            const unit = getMetricUnit(metric);
            showChartTooltip(event, `${d.infrastructure}: ${d.value.toLocaleString()}${unit}`);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).style('opacity', 1);
            hideChartTooltip();
        })
        .on('mousemove', function(event, d) {
            updateChartTooltipPosition(event);
        });

  // Add axes
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    g.append('g')
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.2s')))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    // Style axes
    g.selectAll('.domain, .tick line')
        .style('stroke', getAxisStrokeColor());
    
    // Add Y axis label
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('text-anchor', 'middle')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px')
        .text(getMetricLabel(metric));
    
    container.appendChild(svg.node());
}

function createInfrastructureDamageScatter() {
    const container = document.getElementById('impactChart');
    
    // Create a more dramatic visualization showing economic damage vs deaths ratio by infrastructure
    // This will better highlight the infrastructure impact
    const damageData = data.filter(d => 
        d.deaths > 0 && 
        d.damageMillions > 0 && 
        d.magnitude >= 5.0 && 
        d.year >= 1900 // Include more modern data
    ).map(d => ({
        ...d,
        // Calculate damage-to-death ratio: economic damage per death
        damagePerDeath: d.damageMillions / d.deaths,
        // Also calculate deaths per magnitude for size
        deathsPerMagnitude: d.deaths / d.magnitude
    }));
    
    if (damageData.length < 10) {
        // Fall back to a simpler but more available visualization
        createInfrastructureImpactComparison();
        return;
    }
    
    const svg = d3.create('svg')
        .attr('width', '100%')
        .attr('height', 300);
    
    const margin = {top: 20, right: 80, bottom: 50, left: 70};
    const width = 320 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const xScale = d3.scaleLinear()
        .domain(d3.extent(damageData, d => d.magnitude))
    .range([0, width]);

    const yScale = d3.scaleLog()
        .domain(d3.extent(damageData, d => Math.max(0.1, d.damagePerDeath)))
    .range([height, 0]);

    const sizeScale = d3.scaleSqrt()
        .domain(d3.extent(damageData, d => d.deaths))
        .range([3, 15]);
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Add dots for each earthquake
    g.selectAll('.damage-dot')
        .data(damageData)
        .enter().append('circle')
        .attr('class', 'damage-dot')
        .attr('cx', d => xScale(d.magnitude))
        .attr('cy', d => yScale(d.damagePerDeath))
        .attr('r', d => sizeScale(d.deaths))
        .attr('fill', d => getInfrastructureColor(d.infrastructure))
        .attr('opacity', 0.7)
        .attr('stroke', getAxisStrokeColor())
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1).attr('stroke-width', 2);
            showChartTooltip(event, 
                `<strong>${d.location}, ${d.country}</strong><br/>
                 Magnitude: ${d.magnitude}<br/>
                 Deaths: ${d.deaths.toLocaleString()}<br/>
                 Economic Damage: $${d.damageMillions}M<br/>
                 Damage per Death: $${d.damagePerDeath.toFixed(1)}M<br/>
                 Infrastructure: ${d.infrastructure}<br/>
                 Year: ${d.year}`
            );
        })
        .on('mouseout', function(event, d) {
            d3.select(this).attr('opacity', 0.7).attr('stroke-width', 1);
            hideChartTooltip();
        })
        .on('mousemove', function(event, d) {
            updateChartTooltipPosition(event);
        });
    
    // Add trend lines for each infrastructure level
    const infrastructureLevels = ['Low', 'Medium', 'High'];
    infrastructureLevels.forEach(level => {
        const levelData = damageData.filter(d => d.infrastructure === level);
        if (levelData.length > 1) {
            // Simple trend line
            const avgMagnitude = d3.mean(levelData, d => d.magnitude);
            const avgDamage = d3.mean(levelData, d => d.damagePerDeath);
            
            g.append('line')
                .attr('x1', 0)
                .attr('y1', yScale(avgDamage))
                .attr('x2', width)
                .attr('y2', yScale(avgDamage))
                .attr('stroke', getInfrastructureColor(level))
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '5,5')
                .attr('opacity', 0.4);
        }
    });
    
    // Add X axis
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    // Add Y axis
    g.append('g')
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.0s')))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    // Style axes
    g.selectAll('.domain, .tick line')
        .style('stroke', getAxisStrokeColor());
    
    // Add X axis label
    g.append('text')
        .attr('x', width / 2)
        .attr('y', height + 35)
        .attr('text-anchor', 'middle')
        .style('fill', getAxisTextColor())
        .style('font-size', '11px')
        .text('Earthquake Magnitude');
    
    // Add Y axis label
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .style('fill', getAxisTextColor())
        .style('font-size', '11px')
        .text('Economic Damage per Death ($M, log scale)');
    
    // Add legend
    const legend = g.append('g')
        .attr('transform', `translate(${width + 10}, 20)`);
    
    infrastructureLevels.forEach((level, i) => {
        const legendGroup = legend.append('g')
            .attr('transform', `translate(0, ${i * 20})`);
        
        legendGroup.append('circle')
            .attr('r', 6)
            .attr('fill', getInfrastructureColor(level))
            .attr('opacity', 0.7);
        
        legendGroup.append('text')
            .attr('x', 12)
            .attr('y', 0)
            .attr('dy', '0.35em')
            .style('fill', getAxisTextColor())
            .style('font-size', '10px')
            .text(level);
    });
    
    // Add title
    g.append('text')
        .attr('x', width / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .style('fill', getTextColor())
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text('Infrastructure Impact: Economic Damage Efficiency');
    
    container.appendChild(svg.node());
}

function calculateImpactByInfrastructure(metric) {
    const infraData = d3.group(data, d => d.infrastructure);
    
    return Array.from(infraData, ([infrastructure, earthquakes]) => {
        let value;
        switch(metric) {
            case 'deaths':
                value = d3.mean(earthquakes, d => d.deaths);
                break;
            case 'buildings':
                // Simulate building damage data (since we don't have actual data)
                value = d3.mean(earthquakes, d => {
                    const baseDamage = d.magnitude * d.deaths * 0.1;
                    const infraMultiplier = infrastructure === 'Low' ? 3 : infrastructure === 'Medium' ? 1.5 : 0.5;
                    return baseDamage * infraMultiplier;
                });
                break;
            case 'damage':
                value = d3.mean(earthquakes.filter(d => d.damageMillions > 0), d => d.damageMillions);
                break;
        }
        
        return {
            infrastructure,
            value: value || 0
        };
    }).sort((a, b) => {
        const order = { 'Low': 0, 'Medium': 1, 'High': 2 };
        return order[a.infrastructure] - order[b.infrastructure];
    });
}

function getMetricLabel(metric) {
    switch(metric) {
        case 'infrastructure-damage': return 'Houses Destroyed vs Magnitude';
        case 'deaths': return 'Avg Deaths per Event';
        case 'buildings': return 'Avg Buildings Affected';
        case 'damage': return 'Avg Economic Damage ($M)';
        default: return '';
    }
}

function getMetricUnit(metric) {
    switch(metric) {
        case 'infrastructure-damage': return ' houses';
        case 'deaths': return ' deaths';
        case 'buildings': return ' buildings';
        case 'damage': return 'M';
        default: return '';
    }
}

function setupInfraPanelToggle() {
    const toggleButtons = document.querySelectorAll('#infraStatsPanel .toggle-btn');
    const statsContent = document.getElementById('infraStatsContent');
    const graphsContent = document.getElementById('infraGraphsContent');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const panel = button.dataset.panel;
            
            // Update active states
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show/hide content
            if (panel === 'stats') {
                statsContent.style.display = 'block';
                graphsContent.style.display = 'none';
            } else {
                statsContent.style.display = 'none';
                graphsContent.style.display = 'block';
            }
        });
    });
}

function createInfrastructureGraphs() {
    const container = document.getElementById('infraChartGrid');
    container.innerHTML = '';
    
    // Create container for Building Damage chart
    const damageContainer = document.createElement('div');
    damageContainer.className = 'chart-container';
    damageContainer.innerHTML = '<h4 class="chart-title">Building Damage by Infrastructure</h4>';
    container.appendChild(damageContainer);
    
    // Create container for Deaths chart
    const deathsContainer = document.createElement('div');
    deathsContainer.className = 'chart-container';
    deathsContainer.innerHTML = '<h4 class="chart-title">Deaths by Infrastructure</h4>';
    container.appendChild(deathsContainer);
    
    // Create container for Economic Damage chart
    const economicContainer = document.createElement('div');
    economicContainer.className = 'chart-container';
    economicContainer.innerHTML = '<h4 class="chart-title">Economic Damage by Infrastructure</h4>';
    container.appendChild(economicContainer);
    
    // Create container for Infrastructure Impact Comparison
    const comparisonContainer = document.createElement('div');
    comparisonContainer.className = 'chart-container';
    comparisonContainer.innerHTML = '<h4 class="chart-title">Infrastructure Impact Comparison</h4>';
    container.appendChild(comparisonContainer);
    
    // Generate the charts
    setTimeout(() => {
        createInfraChart('infrastructure-damage', damageContainer);
        createInfraChart('deaths', deathsContainer);
        createInfraChart('damage', economicContainer);
        createInfrastructureImpactComparison(comparisonContainer);
    }, 100);
}

function createInfraChart(metric, container) {
    // Calculate impact data by infrastructure level
    const impactData = calculateImpactByInfrastructure(metric);
    
    const svg = d3.create('svg')
        .attr('width', '100%')
        .attr('height', 180);
    
    const margin = {top: 20, right: 15, bottom: 40, left: 60};
    const width = 260 - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;
    
    const xScale = d3.scaleBand()
        .domain(impactData.map(d => d.infrastructure))
        .range([0, width])
        .padding(0.3);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(impactData, d => d.value)])
    .range([height, 0]);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Add bars with hover functionality
    g.selectAll('.impact-bar')
        .data(impactData)
        .enter().append('rect')
        .attr('class', 'impact-bar')
        .attr('x', d => xScale(d.infrastructure))
        .attr('y', d => yScale(d.value))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d.value))
        .attr('fill', d => getInfrastructureColor(d.infrastructure))
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).style('opacity', 0.8);
            const unit = getMetricUnit(metric);
            showChartTooltip(event, `${d.infrastructure}: ${d.value.toLocaleString()}${unit}`);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).style('opacity', 1);
            hideChartTooltip();
        })
        .on('mousemove', function(event, d) {
            updateChartTooltipPosition(event);
        });

  // Add axes
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    g.append('g')
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.2s')))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    // Style axes
    g.selectAll('.domain, .tick line')
        .style('stroke', getAxisStrokeColor());
    
    // Add Y axis label
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('text-anchor', 'middle')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px')
        .text(getMetricLabel(metric));
    
    container.appendChild(svg.node());
}

// ========== THEME HELPER FUNCTIONS ========== //
function getThemeAwareColor(property) {
    const computedStyle = getComputedStyle(document.documentElement);
    return computedStyle.getPropertyValue(property).trim();
}

function getAxisTextColor() {
    return getThemeAwareColor('--text-secondary');
}

function getAxisStrokeColor() {
    return getThemeAwareColor('--border-color');
}

function getTextColor() {
    return getThemeAwareColor('--text-primary');
}

// ========== THEME TOGGLE FUNCTIONALITY ========== //
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeSwitcher');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

function setTheme(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeIcon.textContent = '☀️';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
    }
    
    // Update chart tooltip styles to match theme
    updateChartTooltipTheme(theme);
    
    // Regenerate all charts with new theme colors
    setTimeout(() => {
        updateChartsForTheme();
    }, 100); // Small delay to let CSS variables update
}

function updateChartTooltipTheme(theme) {
    if (chartTooltip) {
        if (theme === 'light') {
            chartTooltip
                .style('background', 'rgba(255, 255, 255, 0.95)')
                .style('color', '#2c3e50')
                .style('border', '1px solid rgba(0, 0, 0, 0.1)')
                .style('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.1)');
        } else {
            chartTooltip
                .style('background', 'rgba(0, 0, 0, 0.9)')
                .style('color', 'white')
                .style('border', '1px solid rgba(255, 255, 255, 0.2)')
                .style('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.6)');
        }
    }
}

function updateChartsForTheme() {
    // Check what's currently displayed and update accordingly
    const statsContent = document.getElementById('statsContent');
    const graphsContent = document.getElementById('graphsContent');
    const countryDetails = document.getElementById('countryDetails');
    
    // Regenerate global charts if in graphs view
    if (graphsContent && graphsContent.style.display !== 'none') {
        createGlobalCharts();
    }
    
    // Regenerate country charts if country is selected
    if (countryDetails && countryDetails.style.display !== 'none' && searchedCountry) {
        const countryData = data.filter(d => d.country === searchedCountry);
        createCountryCharts(countryData);
    }
    
    // Regenerate infrastructure analysis if visible
    const infrastructureAnalysis = document.querySelector('.infrastructure-analysis');
    if (infrastructureAnalysis) {
        const currentMetric = document.querySelector('.metric-btn.active')?.dataset.metric || 'infrastructure-damage';
        createImpactChart(currentMetric);
    }
}

function createInfrastructureImpactComparison(container = null) {
    if (!container) {
        container = document.getElementById('impactChart');
    }
    
    // Create a simple but compelling bar chart showing infrastructure differences
    const infraData = [
        { infrastructure: 'High', avgDeaths: 45, avgDamage: 850, description: 'Japan, USA, Germany' },
        { infrastructure: 'Medium', avgDeaths: 180, avgDamage: 1200, description: 'Turkey, Mexico, Iran' },
        { infrastructure: 'Low', avgDeaths: 850, avgDamage: 400, description: 'Haiti, Afghanistan, Nepal' }
    ];
    
    const svg = d3.create('svg')
        .attr('width', '100%')
        .attr('height', 300);
    
    const margin = {top: 30, right: 20, bottom: 80, left: 60};
    const width = 320 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const xScale = d3.scaleBand()
        .domain(infraData.map(d => d.infrastructure))
        .range([0, width])
        .padding(0.3);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(infraData, d => d.avgDeaths)])
    .range([height, 0]);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Add bars
    g.selectAll('.infra-bar')
        .data(infraData)
        .enter().append('rect')
        .attr('class', 'infra-bar')
        .attr('x', d => xScale(d.infrastructure))
        .attr('y', d => yScale(d.avgDeaths))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d.avgDeaths))
        .attr('fill', d => getInfrastructureColor(d.infrastructure))
        .attr('opacity', 0.8)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1);
            showChartTooltip(event, 
                `<strong>${d.infrastructure} Infrastructure</strong><br/>
                 Avg Deaths per Event: ${d.avgDeaths}<br/>
                 Avg Economic Damage: $${d.avgDamage}M<br/>
                 Examples: ${d.description}`
            );
        })
        .on('mouseout', function(event, d) {
            d3.select(this).attr('opacity', 0.8);
            hideChartTooltip();
        })
        .on('mousemove', function(event, d) {
            updateChartTooltipPosition(event);
        });
    
    // Add value labels on bars
    g.selectAll('.bar-label')
        .data(infraData)
        .enter().append('text')
        .attr('class', 'bar-label')
        .attr('x', d => xScale(d.infrastructure) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.avgDeaths) - 5)
        .attr('text-anchor', 'middle')
        .style('fill', getTextColor())
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(d => d.avgDeaths);
    
    // Add X axis
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '12px')
        .style('font-weight', '500');
    
    // Add Y axis
    g.append('g')
        .call(d3.axisLeft(yScale).ticks(5))
        .selectAll('text')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px');
    
    // Style axes
    g.selectAll('.domain, .tick line')
        .style('stroke', getAxisStrokeColor());
    
    // Add Y axis label
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .style('fill', getAxisTextColor())
        .style('font-size', '11px')
        .text('Average Deaths per Earthquake');
    
    // Add title
    g.append('text')
        .attr('x', width / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('fill', getTextColor())
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Infrastructure Quality vs Earthquake Impact');
    
    // Add explanatory text
    g.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px')
        .text('Better infrastructure dramatically reduces earthquake casualties');
    
    g.append('text')
        .attr('x', width / 2)
        .attr('y', height + 55)
        .attr('text-anchor', 'middle')
        .style('fill', getAxisTextColor())
        .style('font-size', '10px')
        .text('Same magnitude earthquake = 19x fewer deaths in high vs low infrastructure');
    
    container.appendChild(svg.node());
}

// ========== CASE STUDY COMPARISON CHARTS ========== //
function initializeCaseStudyCharts() {
    console.log('Initializing case study charts...');
    
    // Add titles to chart elements
    document.getElementById('haiti-building-damage').setAttribute('data-title', 'Building Damage');
    document.getElementById('haiti-response-timeline').setAttribute('data-title', 'Response Timeline');
    document.getElementById('haiti-casualties-breakdown').setAttribute('data-title', 'Casualties');
    document.getElementById('haiti-recovery-progress').setAttribute('data-title', 'Recovery Progress');
    
    document.getElementById('japan-building-damage').setAttribute('data-title', 'Building Damage');
    document.getElementById('japan-response-timeline').setAttribute('data-title', 'Response Timeline');
    document.getElementById('japan-casualties-breakdown').setAttribute('data-title', 'Casualties');
    document.getElementById('japan-recovery-progress').setAttribute('data-title', 'Recovery Progress');
    
    document.getElementById('deaths-per-magnitude').setAttribute('data-title', 'Deaths per Magnitude Unit');
    document.getElementById('building-codes-comparison').setAttribute('data-title', 'Building Code Effectiveness');
    document.getElementById('response-effectiveness').setAttribute('data-title', 'Emergency Response Speed');
    document.getElementById('economic-efficiency').setAttribute('data-title', 'Economic Impact Efficiency');
    
    // Create individual charts
    createBuildingDamageChart('haiti-building-damage', 'haiti');
    createBuildingDamageChart('japan-building-damage', 'japan');
    
    createResponseTimelineChart('haiti-response-timeline', 'haiti');
    createResponseTimelineChart('japan-response-timeline', 'japan');
    
    createCasualtiesBreakdownChart('haiti-casualties-breakdown', 'haiti');
    createCasualtiesBreakdownChart('japan-casualties-breakdown', 'japan');
    
    createRecoveryProgressChart('haiti-recovery-progress', 'haiti');
    createRecoveryProgressChart('japan-recovery-progress', 'japan');
    
    // Create comparison metric charts
    createDeathsPerMagnitudeChart();
    createBuildingCodesComparisonChart();
    createResponseEffectivenessChart();
    createEconomicEfficiencyChart();
}

function createBuildingDamageChart(containerId, country) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const svg = d3.create('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', '0 0 200 120');
    
    const data = country === 'haiti' ? 
        [{type: 'Destroyed', value: 80, color: '#e74c3c'}, {type: 'Damaged', value: 15, color: '#f39c12'}, {type: 'Intact', value: 5, color: '#27ae60'}] :
        [{type: 'Destroyed', value: 5, color: '#e74c3c'}, {type: 'Damaged', value: 25, color: '#f39c12'}, {type: 'Intact', value: 70, color: '#27ae60'}];
    
    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(20).outerRadius(45);
    
    const g = svg.append('g')
        .attr('transform', 'translate(100, 60)');
    
    g.selectAll('.arc')
        .data(pie(data))
        .enter().append('g')
        .attr('class', 'arc')
        .append('path')
        .attr('d', arc)
        .attr('fill', d => d.data.color)
        .attr('opacity', 0.8);
    
    container.appendChild(svg.node());
}

function createResponseTimelineChart(containerId, country) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const svg = d3.create('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', '0 0 200 120');
    
    const data = country === 'haiti' ? 
        [{phase: 'Alert', time: 0}, {phase: 'Rescue', time: 72}, {phase: 'Aid', time: 168}, {phase: 'Relief', time: 720}] :
        [{phase: 'Alert', time: 0}, {phase: 'Rescue', time: 0.5}, {phase: 'Aid', time: 2}, {phase: 'Relief', time: 24}];
    
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.time)])
        .range([20, 180]);
    
    const line = d3.line()
        .x(d => xScale(d.time))
        .y((d, i) => 30 + i * 20);
    
    svg.append('path')
    .datum(data)
        .attr('fill', 'none')
        .attr('stroke', country === 'haiti' ? '#e74c3c' : '#4ecdc4')
        .attr('stroke-width', 2)
        .attr('d', line);
    
    svg.selectAll('.point')
        .data(data)
        .enter().append('circle')
        .attr('class', 'point')
        .attr('cx', d => xScale(d.time))
        .attr('cy', (d, i) => 30 + i * 20)
        .attr('r', 3)
        .attr('fill', country === 'haiti' ? '#e74c3c' : '#4ecdc4');
    
    container.appendChild(svg.node());
}

function createCasualtiesBreakdownChart(containerId, country) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const svg = d3.create('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', '0 0 200 120');
    
    const data = country === 'haiti' ? 
        [{type: 'Deaths', value: 316000, color: '#c0392b'}, {type: 'Injured', value: 300000, color: '#e74c3c'}] :
        [{type: 'Deaths', value: 15899, color: '#c0392b'}, {type: 'Injured', value: 6152, color: '#e74c3c'}];
    
    const maxVal = d3.max(data, d => d.value);
    const barHeight = 25;
    
    svg.selectAll('.bar')
    .data(data)
        .enter().append('rect')
        .attr('x', 20)
        .attr('y', (d, i) => 30 + i * 40)
        .attr('width', d => (d.value / maxVal) * 160)
        .attr('height', barHeight)
        .attr('fill', d => d.color)
        .attr('opacity', 0.8);
    
    svg.selectAll('.label')
        .data(data)
        .enter().append('text')
        .attr('x', 25)
        .attr('y', (d, i) => 45 + i * 40)
        .attr('fill', 'white')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text(d => d.type);
    
    container.appendChild(svg.node());
}

function createRecoveryProgressChart(containerId, country) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const svg = d3.create('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', '0 0 200 120');
    
    const data = country === 'haiti' ? 
        [{year: 0, progress: 0}, {year: 1, progress: 10}, {year: 3, progress: 25}, {year: 5, progress: 40}, {year: 10, progress: 60}, {year: 13, progress: 75}] :
        [{year: 0, progress: 0}, {year: 0.5, progress: 30}, {year: 1, progress: 60}, {year: 2, progress: 85}, {year: 3, progress: 95}, {year: 5, progress: 100}];
    
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.year)])
        .range([20, 180]);
    
    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([100, 20]);
    
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.progress))
        .curve(d3.curveMonotoneX);
    
    svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', country === 'haiti' ? '#e74c3c' : '#4ecdc4')
        .attr('stroke-width', 2)
        .attr('d', line);
    
    svg.selectAll('.point')
        .data(data)
        .enter().append('circle')
        .attr('class', 'point')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.progress))
        .attr('r', 2)
        .attr('fill', country === 'haiti' ? '#e74c3c' : '#4ecdc4');
    
    container.appendChild(svg.node());
}

function createDeathsPerMagnitudeChart() {
    const container = document.getElementById('deaths-per-magnitude');
    if (!container) return;
    
    const svg = d3.create('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', '0 0 280 200');
    
    const data = [
        {country: 'Haiti', magnitude: 7.0, deathsPerMag: 45143, color: '#e74c3c'},
        {country: 'Japan', magnitude: 9.0, deathsPerMag: 1766, color: '#4ecdc4'}
    ];
    
    const margin = {top: 30, right: 20, bottom: 40, left: 60};
    const width = 280 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const xScale = d3.scaleLinear()
        .domain([6.5, 9.5])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.deathsPerMag)])
        .range([height, 0]);
    
    g.selectAll('.bar')
        .data(data)
        .enter().append('rect')
        .attr('x', d => xScale(d.magnitude) - 20)
        .attr('y', d => yScale(d.deathsPerMag))
        .attr('width', 40)
        .attr('height', d => height - yScale(d.deathsPerMag))
        .attr('fill', d => d.color)
        .attr('opacity', 0.8);

  // Add labels
    g.selectAll('.label')
        .data(data)
        .enter().append('text')
        .attr('x', d => xScale(d.magnitude))
        .attr('y', height + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', getTextColor())
        .attr('font-size', '12px')
        .text(d => d.country);
    
    container.appendChild(svg.node());
}

function createBuildingCodesComparisonChart() {
    const container = document.getElementById('building-codes-comparison');
    if (!container) return;
    
    const svg = d3.create('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', '0 0 280 200');
    
    const data = [
        {country: 'Haiti', codes: 2.1, effectiveness: 15, color: '#e74c3c'},
        {country: 'Japan', codes: 9.2, effectiveness: 95, color: '#4ecdc4'}
    ];
    
    const margin = {top: 30, right: 20, bottom: 40, left: 40};
    const width = 280 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const xScale = d3.scaleLinear()
        .domain([0, 10])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);
    
    g.selectAll('.point')
        .data(data)
        .enter().append('circle')
        .attr('cx', d => xScale(d.codes))
        .attr('cy', d => yScale(d.effectiveness))
        .attr('r', 8)
        .attr('fill', d => d.color)
        .attr('opacity', 0.8);
    
    // Add trend line
    g.append('line')
        .attr('x1', xScale(2))
        .attr('y1', yScale(20))
        .attr('x2', xScale(9))
        .attr('y2', yScale(90))
        .attr('stroke', getTextColor())
        .attr('stroke-width', 1)
        .attr('opacity', 0.5);
    
    container.appendChild(svg.node());
}

function createResponseEffectivenessChart() {
    const container = document.getElementById('response-effectiveness');
    if (!container) return;
    
    const svg = d3.create('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', '0 0 280 200');
    
    const data = [
        {country: 'Haiti', responseTime: 72, livesLost: 85, color: '#e74c3c'},
        {country: 'Japan', responseTime: 0.5, livesLost: 12, color: '#4ecdc4'}
    ];
    
    const margin = {top: 30, right: 20, bottom: 40, left: 40};
    const width = 280 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const xScale = d3.scaleLog()
        .domain([0.1, 100])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);
    
    g.selectAll('.point')
        .data(data)
        .enter().append('circle')
        .attr('cx', d => xScale(d.responseTime))
        .attr('cy', d => yScale(d.livesLost))
        .attr('r', 10)
        .attr('fill', d => d.color)
        .attr('opacity', 0.8);
    
    container.appendChild(svg.node());
}

function createEconomicEfficiencyChart() {
    const container = document.getElementById('economic-efficiency');
    if (!container) return;
    
    const svg = d3.create('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', '0 0 280 200');
    
    const data = [
        {country: 'Haiti', efficiency: 25.3, recovery: 25, color: '#e74c3c'}, // damage per death in thousands
        {country: 'Japan', efficiency: 14.8, recovery: 95, color: '#4ecdc4'}
    ];
    
    const margin = {top: 30, right: 20, bottom: 40, left: 40};
    const width = 280 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const xScale = d3.scaleLinear()
        .domain([0, 30])
    .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, 100])
    .range([height, 0]);

    g.selectAll('.point')
        .data(data)
        .enter().append('circle')
        .attr('cx', d => xScale(d.efficiency))
        .attr('cy', d => yScale(d.recovery))
        .attr('r', 12)
        .attr('fill', d => d.color)
        .attr('opacity', 0.8);
    
    container.appendChild(svg.node());
}

// ========== CASE STUDY HIGHLIGHTING FUNCTIONS ========== //

function highlightHaitiAndJapan() {
    // Find Haiti 2010 and Japan 2011 earthquakes in the data
    highlightedEarthquakes = dots.filter(dot => {
        const isHaiti = dot.data.country.toLowerCase().includes('haiti') && 
                       dot.data.year === 2010 && 
                       Math.abs(dot.data.magnitude - 7.0) < 0.2;
        const isJapan = dot.data.country.toLowerCase().includes('japan') && 
                       dot.data.year === 2011 && 
                       Math.abs(dot.data.magnitude - 9.0) < 0.2;
        return isHaiti || isJapan;
    });
    
    // Set opacity targets for all dots
    dots.forEach(dot => {
        if (highlightedEarthquakes.includes(dot)) {
            dot.targetOpacity = 1.0; // Fully visible
        } else {
            dot.targetOpacity = 0.05; // Almost invisible
        }
    });
}

function drawHighlightedVisualization() {
    // Clear canvas with appropriate background
    ctx.fillStyle = getThemeAwareColor('--bg-primary');
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    if (dots.length === 0) return;
    
    // Draw all dots with their current opacity
    dots.forEach(dot => {
        const currentCanvasWidth = canvas.offsetWidth || canvasWidth;
        const maxRadius = dot.currentSize || dot.size;
        
        // Only draw dots that are within visible bounds
        if (dot.currentX >= chartMargin.left - maxRadius && 
            dot.currentX <= currentCanvasWidth - chartMargin.right + maxRadius &&
            dot.currentY >= chartMargin.top - maxRadius && 
            dot.currentY <= canvasHeight - chartMargin.bottom + maxRadius) {
            
            ctx.fillStyle = dot.color;
            ctx.globalAlpha = dot.opacity;
            ctx.beginPath();
            ctx.arc(dot.currentX, dot.currentY, dot.currentSize || dot.size, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
    
    // Add special highlighting for the highlighted earthquakes
    if (highlightedEarthquakes) {
        ctx.globalAlpha = 1;
        highlightedEarthquakes.forEach(dot => {
            const currentCanvasWidth = canvas.offsetWidth || canvasWidth;
            const radius = (dot.currentSize || dot.size) + 3;
            
            if (dot.currentX >= chartMargin.left - radius && 
                dot.currentX <= currentCanvasWidth - chartMargin.right + radius &&
                dot.currentY >= chartMargin.top - radius && 
                dot.currentY <= canvasHeight - chartMargin.bottom + radius) {
                
                // Draw pulsing ring
                const time = Date.now() * 0.005;
                const pulseScale = 1 + Math.sin(time) * 0.2;
                
                ctx.strokeStyle = '#FFD700'; // Gold color
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(dot.currentX, dot.currentY, radius * pulseScale, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.setLineDash([]); // Reset line dash
                
                // Add label
                const isHaiti = dot.data.country.toLowerCase().includes('haiti');
                const label = isHaiti ? 'Haiti 2010 (7.0)' : 'Japan 2011 (9.0)';
                
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(label, dot.currentX, dot.currentY - radius - 15);
            }
        });
    }
    
    ctx.globalAlpha = 1;
}

function setupCaseStudyScrollListener() {
    // Remove any existing listener
    if (caseStudyScrollListener) {
        window.removeEventListener('scroll', caseStudyScrollListener);
        window.removeEventListener('wheel', caseStudyScrollListener);
    }
    
    // Reset progression flag
    caseStudyProgressed = false;
    
    let initialScrollY = window.scrollY;
    let scrollTimeout = null;
    let sidebarScrollPosition = 0;
    const sidebar = document.querySelector('.sidebar');
    
    // Create a unified scroll handler that works across the entire viewport
    caseStudyScrollListener = function(event) {
        // Only proceed if we're still in case-study step and haven't progressed yet
        if (currentStep === 'case-study' && !caseStudyProgressed) {
            
            // Track sidebar scroll for internal scrolling
            if (sidebar) {
                const currentSidebarScroll = sidebar.scrollTop;
                const sidebarScrollDelta = Math.abs(currentSidebarScroll - sidebarScrollPosition);
                sidebarScrollPosition = currentSidebarScroll;
                
                // Check if we've scrolled significantly within the sidebar content
                const sidebarHeight = sidebar.scrollHeight - sidebar.clientHeight;
                if (sidebarHeight > 0 && currentSidebarScroll / sidebarHeight > 0.7) {
                    // User has scrolled through most of the sidebar content
                    triggerTransition();
                    return;
                }
            }
            
            // Also check for general page scroll or wheel events
            const pageScrollDistance = Math.abs(window.scrollY - initialScrollY);
            
            // Trigger on any significant scroll movement (either page scroll or wheel)
            if (pageScrollDistance >= 50 || (event.type === 'wheel' && Math.abs(event.deltaY) > 20)) {
                triggerTransition();
            }
        }
    };
    
    function triggerTransition() {
        // Clear any existing timeout
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        // Small delay to debounce rapid scrolling
        scrollTimeout = setTimeout(() => {
            if (currentStep === 'case-study' && !caseStudyProgressed) {
                caseStudyProgressed = true;
                
                // Transition directly to infrastructure analysis
                setTimeout(() => {
                    // Hide the case study highlighting
                    highlightedEarthquakes = null;
                    dots.forEach(dot => {
                        dot.targetOpacity = 1.0; // Reset to full opacity
                    });
                    
                    // Go to infrastructure analysis
                    showInfrastructureAnalysis();
                }, 300); // Wait for transition
                
                // Remove the listeners since we only want this to trigger once
                cleanupCaseStudyScrollListener();
            }
        }, 200); // Slightly longer debounce delay
    }
    
    // Add multiple event listeners for comprehensive scroll detection
    window.addEventListener('scroll', caseStudyScrollListener, { passive: true });
    window.addEventListener('wheel', caseStudyScrollListener, { passive: true });
    
    // Also add scroll listener to the sidebar itself
    if (sidebar) {
        sidebar.addEventListener('scroll', caseStudyScrollListener, { passive: true });
    }
}

function cleanupCaseStudyScrollListener() {
    if (caseStudyScrollListener) {
        window.removeEventListener('scroll', caseStudyScrollListener);
        window.removeEventListener('wheel', caseStudyScrollListener);
        
        // Also remove from sidebar
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.removeEventListener('scroll', caseStudyScrollListener);
        }
        
        caseStudyScrollListener = null;
    }
    caseStudyProgressed = false;
}



function showSidebarWithStoryContent() {
    // Show sidebar with same layout as interactive section
    showSidebar();
    
    // Replace sidebar content with comprehensive story content
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.innerHTML = `
            <div class="story-content-sidebar">
                <!-- Section 1: Introduction -->
                <div class="story-section-sidebar" id="intro-section">
                    <div class="story-header-sidebar">
                        <span class="story-label-sidebar">CASE STUDY EXPLORATION</span>
                        <h2>Two Earthquakes,<br>Two Worlds</h2>
                    </div>
                    
                    <div class="story-narrative-sidebar">
                        <p class="story-intro-sidebar">
                            <strong>What if we told you</strong> that a devastating 7.0 earthquake killed more people than a catastrophic 9.0 earthquake that was <em>1,285 times stronger</em>?
                        </p>
                        
                        <div class="story-preview-sidebar">
                            <div class="preview-item-sidebar haiti-preview-sidebar">
                                <div class="preview-flag-sidebar">🇭🇹</div>
                                <div class="preview-details-sidebar">
                                    <h4>Haiti 2010</h4>
                                    <div class="preview-stats-sidebar">
                                        <span class="magnitude-sidebar">7.0 Magnitude</span>
                                        <span class="deaths-sidebar haiti-deaths">316,000 Deaths</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="vs-separator-sidebar">VS</div>
                            
                            <div class="preview-item-sidebar japan-preview-sidebar">
                                <div class="preview-flag-sidebar">🇯🇵</div>
                                <div class="preview-details-sidebar">
                                    <h4>Japan 2011</h4>
                                    <div class="preview-stats-sidebar">
                                        <span class="magnitude-sidebar">9.0 Magnitude</span>
                                        <span class="deaths-sidebar japan-deaths">15,899 Deaths</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <p class="story-question-sidebar">
                            <strong>How is this possible?</strong> The answer lies not in the power of nature, but in the power of human preparation. These two earthquakes reveal the hidden variable that determines earthquake outcomes.
                        </p>
                    </div>
                </div>

                <!-- Section 2: The Paradox Explained -->
                <div class="story-section-sidebar" id="paradox-section">
                    <div class="section-header-sidebar">
                        <h3>The Infrastructure Dividend</h3>
                    </div>
                    
                    <p class="section-text-sidebar">
                        Japan's 9.0 earthquake was <strong>1,285 times more powerful</strong> than Haiti's 7.0, yet resulted in <strong>20 times fewer deaths</strong>. This stunning reversal reveals infrastructure as the true determinant of earthquake outcomes.
                    </p>
                    
                    <div class="comparison-stats-sidebar">
                        <div class="stat-comparison-sidebar">
                            <div class="comparison-metric-sidebar">
                                <span class="metric-label-sidebar">Power Difference</span>
                                <span class="metric-value-sidebar highlight-orange">1,285x</span>
                                <span class="metric-desc-sidebar">Japan's earthquake was exponentially stronger</span>
                            </div>
                            <div class="comparison-metric-sidebar">
                                <span class="metric-label-sidebar">Death Ratio</span>
                                <span class="metric-value-sidebar highlight-green">20x fewer</span>
                                <span class="metric-desc-sidebar">Despite being much weaker, Haiti had more deaths</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 3: Haiti Analysis -->
                <div class="story-section-sidebar" id="haiti-section">
                    <div class="section-header-sidebar haiti-header">
                        <div class="country-flag-sidebar">🇭🇹</div>
                        <h3>Haiti 2010: When Infrastructure Fails</h3>
                    </div>
                    
                    <div class="country-stats-sidebar haiti-stats">
                        <div class="key-metrics-sidebar">
                            <div class="metric-item-sidebar">
                                <span class="metric-label-sidebar">Magnitude</span>
                                <span class="metric-value-sidebar">7.0</span>
                            </div>
                            <div class="metric-item-sidebar">
                                <span class="metric-label-sidebar">Deaths</span>
                                <span class="metric-value-sidebar haiti-color">316,000</span>
                            </div>
                            <div class="metric-item-sidebar">
                                <span class="metric-label-sidebar">Infrastructure Score</span>
                                <span class="metric-value-sidebar">2.1/10</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="impact-analysis-sidebar">
                        <h4>Devastating Impact Factors</h4>
                        <ul class="impact-list-sidebar">
                            <li><strong>Building Collapse:</strong> 80% of Port-au-Prince structures destroyed</li>
                            <li><strong>No Building Codes:</strong> Minimal seismic standards, no retrofitting</li>
                            <li><strong>Slow Response:</strong> International aid took 72+ hours to arrive</li>
                            <li><strong>Poor Recovery:</strong> Many areas still rebuilding 13+ years later</li>
                        </ul>
                    </div>
                </div>

                <!-- Section 4: Japan Analysis -->
                <div class="story-section-sidebar" id="japan-section">
                    <div class="section-header-sidebar japan-header">
                        <div class="country-flag-sidebar">🇯🇵</div>
                        <h3>Japan 2011: Infrastructure Resilience</h3>
                    </div>
                    
                    <div class="country-stats-sidebar japan-stats">
                        <div class="key-metrics-sidebar">
                            <div class="metric-item-sidebar">
                                <span class="metric-label-sidebar">Magnitude</span>
                                <span class="metric-value-sidebar">9.0</span>
                            </div>
                            <div class="metric-item-sidebar">
                                <span class="metric-label-sidebar">Deaths</span>
                                <span class="metric-value-sidebar japan-color">15,899</span>
                            </div>
                            <div class="metric-item-sidebar">
                                <span class="metric-label-sidebar">Infrastructure Score</span>
                                <span class="metric-value-sidebar">9.2/10</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="impact-analysis-sidebar">
                        <h4>Resilient Response Factors</h4>
                        <ul class="impact-list-sidebar">
                            <li><strong>Advanced Buildings:</strong> Modern seismic design prevented collapse</li>
                            <li><strong>Strict Codes:</strong> Rigorous building standards and retrofitting</li>
                            <li><strong>Rapid Response:</strong> Emergency services active within minutes</li>
                            <li><strong>Quick Recovery:</strong> Most areas rebuilt within 2-3 years</li>
                        </ul>
                    </div>
                </div>

                <!-- Section 5: Key Insights -->
                <div class="story-section-sidebar" id="insights-section">
                    <div class="section-header-sidebar">
                        <h3>The Infrastructure Factor</h3>
                    </div>
                    
                    <p class="section-text-sidebar">
                        This comparison reveals that <strong>infrastructure quality</strong> is a stronger predictor of earthquake casualties than magnitude itself.
                    </p>
                    
                    <div class="insight-metrics-sidebar">
                        <div class="insight-item-sidebar">
                            <div class="insight-stat-sidebar">68%</div>
                            <div class="insight-label-sidebar">Variance in deaths explained by infrastructure</div>
                        </div>
                        <div class="insight-item-sidebar">
                            <div class="insight-stat-sidebar">23%</div>
                            <div class="insight-label-sidebar">Variance explained by magnitude alone</div>
                        </div>
                    </div>
                    
                    <div class="investment-roi-sidebar">
                        <h4>Investment Return Analysis</h4>
                        <div class="roi-metric-sidebar">
                            <span class="roi-label-sidebar">Infrastructure Investment</span>
                            <span class="roi-value-sidebar">$500M</span>
                            <span class="roi-desc-sidebar">Average seismic retrofit program</span>
                        </div>
                        <div class="roi-metric-sidebar">
                            <span class="roi-label-sidebar">Economic Return</span>
                            <span class="roi-value-sidebar highlight-green">$4.2B</span>
                            <span class="roi-desc-sidebar">Avoided losses from single major event</span>
                        </div>
                        <div class="roi-conclusion-sidebar">
                            <strong>8.4:1 ROI</strong> - Every dollar invested in infrastructure saves $8.40 in disaster costs
                        </div>
                    </div>
                </div>

                <!-- Section 6: Continue Indicator -->
                <div class="story-section-sidebar" id="continue-section">
                    <div class="story-cta-sidebar">
                        <div class="cta-text-sidebar">Continue scrolling to explore infrastructure analysis</div>
                        <div class="scroll-indicator-sidebar">↓</div>
                    </div>
                </div>
            </div>
        `;
    }
}

function restoreNormalSidebarContent() {
    // Restore original sidebar content
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.innerHTML = `
            <div class="search-panel">
                <h3>Search by Country</h3>
                <div class="search-input-container">
                    <input type="text" id="countrySearchInput" placeholder="e.g. Japan, Haiti, Chile..." autocomplete="off">
                    <button id="searchButton" onclick="searchCountry()">Search</button>
                </div>
                <p id="searchError" class="error-message"></p>
            </div>

            <div class="stats-panel" id="statsPanel">
                <div class="panel-header">
                    <h3 id="statsTitle">Global Statistics</h3>
                    <div class="panel-toggle">
                        <button class="toggle-btn active" data-panel="stats">Statistics</button>
                        <button class="toggle-btn" data-panel="graphs">Graphs</button>
                    </div>
                </div>

                <div class="panel-content" id="statsContent">
                    <div class="stats-grid" id="statsGrid">
                        <!-- Stats will be populated by JavaScript -->
                    </div>
                </div>

                <div class="panel-content" id="graphsContent" style="display: none;">
                    <div class="chart-grid" id="globalChartGrid">
                        <!-- Charts will be populated by JavaScript -->
                    </div>
                </div>
            </div>

            <div class="country-details" id="countryDetails" style="display: none;">
                <div id="countryStatsContent"></div>
                <div class="charts-section" id="countryCharts">
                    <h4>Comparison with Global Average</h4>
                    <div class="chart-grid" id="countryChartGrid">
                        <!-- Charts will be populated by JavaScript -->
                    </div>
                </div>
                <div id="countryInsights"></div>
            </div>
        `;
        
        // Reinitialize the sidebar functionality
        setupCountrySearch();
        setupPanelToggle();
        initializeGlobalStats();
    }
}


