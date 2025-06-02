// Global variables
let earthquakeData = [];
let worldData = null;
let currentSection = null;
let tooltip = null;

// Global control flags
let ringIntroInitialized = false;
let ringRevealInitialized = false;

// Configuration
const config = {
    width: window.innerWidth,
    height: window.innerHeight,
    projection: null,
    path: null,
    autoRotation: 160,
    rotationSpeed: 0.1,
    isRotating: false
};

// Color scales
const colors = {
    magnitude: d3.scaleSequential(d3.interpolateReds).domain([4, 9]),
    deaths: d3.scaleSequential(d3.interpolateOrRd).domain([1000, 250000]),
    wealth: d3.scaleOrdinal(['#ff4444', '#ffaa44', '#44ff44']),
    timeline: d3.scaleOrdinal(['#ff4444', '#44ff44'])
};

// Performance optimization: throttle updates
let isUpdating = false;
let pendingUpdate = false;

function throttledUpdate(updateFunction) {
    if (isUpdating) {
        pendingUpdate = true;
        return;
    }
    
    isUpdating = true;
    requestAnimationFrame(() => {
        updateFunction();
        isUpdating = false;
        
        if (pendingUpdate) {
            pendingUpdate = false;
            throttledUpdate(updateFunction);
        }
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing Seismic Lottery...');
    
    // Setup tooltip
    tooltip = d3.select('#tooltip');
    
    // Load data
    await loadData();
    
    // Setup visualizations
    setupProjection();
    setupIntersectionObserver();
    setupInteractivity();
    
    // Hide loading screen
    hideLoadingScreen();
    
    console.log('Seismic Lottery initialized successfully');
});

// Data loading
async function loadData() {
    try {
        // Load earthquake data
        console.log('Loading earthquake data from earthquakes.csv...');
        let rawData = await d3.csv('earthquakes.csv', d => ({
            year: +d.Year,
            month: +d.Mo || 1,
            day: +d.Dy || 1,
            lat: +d.Latitude,
            lon: +d.Longitude,
            magnitude: +d.Mag,
            deaths: +d['Total Deaths'] || 0,
            location: d['Location Name'],
            depth: +d['Focal Depth (km)'] || 0,
            damage: +d['Total Damage ($Mil)'] || 0,
            housesDestroyed: +d['Total Houses Destroyed'] || 0
        }));
        
        console.log(`Raw data loaded: ${rawData.length} records`);
        
        // Filter valid data
        earthquakeData = rawData.filter(d => 
            !isNaN(d.lat) && !isNaN(d.lon) && !isNaN(d.magnitude) && d.magnitude >= 3.5
        );
        
        console.log(`Filtered data: ${earthquakeData.length} valid earthquake records`);
        console.log('Sample earthquake:', earthquakeData[0]);
        
        // Create simple world topology for the 3D globe
        worldData = createWorldTopology();
        console.log('Created world topology for 3D globe');
        
    } catch (error) {
        console.error('Error loading earthquake data:', error);
        // Use fallback data
        earthquakeData = generateFallbackData();
        worldData = createWorldTopology();
    }
}

// Create basic world topology for the 3D globe
function createWorldTopology() {
    // Create basic country features for the globe
    return {
        type: "FeatureCollection",
        features: [
            // Major countries as simple polygons
            {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-140, 70], [-60, 70], [-60, 45], [-125, 45], [-140, 60], [-140, 70]
                    ]]
                },
                properties: { name: "North America" }
            },
            {
                type: "Feature", 
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-80, 15], [-35, 15], [-35, -55], [-80, -55], [-80, 15]
                    ]]
                },
                properties: { name: "South America" }
            },
            {
                type: "Feature",
                geometry: {
                    type: "Polygon", 
                    coordinates: [[
                        [-15, 70], [40, 70], [40, 35], [15, 35], [-15, 50], [-15, 70]
                    ]]
                },
                properties: { name: "Europe" }
            },
            {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-15, 35], [50, 35], [50, -35], [-15, -35], [-15, 35]
                    ]]
                },
                properties: { name: "Africa" }
            },
            {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [40, 70], [180, 70], [180, 5], [60, 5], [40, 35], [40, 70]
                    ]]
                },
                properties: { name: "Asia" }
            },
            {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [110, -10], [155, -10], [155, -45], [110, -45], [110, -10]
                    ]]
                },
                properties: { name: "Australia" }
            }
        ]
    };
}

// Generate fallback earthquake data
function generateFallbackData() {
    const fallbackData = [];
    const ringOfFireCoords = [
        // Pacific Ring of Fire coordinates
        {lat: 35.6762, lon: 139.6503, mag: 9.1, deaths: 15894, location: "Japan: Honshu"},
        {lat: 18.4574, lon: -72.5339, mag: 7.0, deaths: 316000, location: "Haiti: Port-au-Prince"},
        {lat: 40.7128, lon: -74.0060, mag: 6.8, deaths: 2968, location: "Simulated: New York"},
        {lat: 37.7749, lon: -122.4194, mag: 7.8, deaths: 3000, location: "USA: San Francisco"},
        {lat: -33.4489, lon: -70.6693, mag: 8.8, deaths: 525, location: "Chile: Santiago"},
        {lat: 3.1390, lon: 101.6869, mag: 9.1, deaths: 230000, location: "Indonesia: Sumatra"},
        {lat: 39.0392, lon: 125.7625, mag: 6.3, deaths: 0, location: "North Korea"},
        {lat: 36.2048, lon: 138.2529, mag: 6.6, deaths: 6434, location: "Japan: Kobe"}
    ];
    
    ringOfFireCoords.forEach((coord, i) => {
        fallbackData.push({
            year: 2000 + i,
            month: i + 1,
            day: 15,
            lat: coord.lat,
            lon: coord.lon,
            magnitude: coord.mag,
            deaths: coord.deaths,
            location: coord.location,
            depth: 10 + Math.random() * 30,
            damage: coord.deaths * 0.1,
            housesDestroyed: coord.deaths * 2
        });
    });
    
    return fallbackData;
}

// Setup projection for 3D globe
function setupProjection() {
    // Create 3D orthographic projection (globe view)
    config.projection = d3.geoOrthographic()
        .scale(Math.min(config.width, config.height) / 2.2)
        .translate([config.width / 2, config.height / 2])
        .clipAngle(90)
        .rotate([20, -20, 0]); // Initial rotation to show Pacific
    
    config.path = d3.geoPath(config.projection);
}

// Hide loading screen
function hideLoadingScreen() {
    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
    }, 2000);
}

// Setup intersection observer for scrollytelling
function setupIntersectionObserver() {
    let isTransitioning = false;
    
    const observer = new IntersectionObserver((entries) => {
        // Prevent rapid transitions
        if (isTransitioning) return;
        
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                isTransitioning = true;
                
                const step = entry.target;
                const stepName = step.dataset.step;
                const sectionNum = step.closest('.story-section').dataset.section;
                
                // Update active states
                document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
                step.classList.add('active');
                
                document.querySelectorAll('.viz-layer').forEach(v => v.classList.remove('active'));
                
                console.log(`Step "${stepName}" is now visible (Section ${sectionNum})`);
                
                // Trigger visualization
                triggerVisualization(stepName, sectionNum);
                
                // Allow new transitions after animation completes
                // For Section 2, we need a longer timeout due to the sequence of animations
                const transitionDelay = sectionNum === '2' ? 15000 : 600;
                
                setTimeout(() => {
                    isTransitioning = false;
                }, transitionDelay);
            }
        });
    }, { 
        threshold: 0.5, // Balanced threshold for snap behavior
        rootMargin: '-20% 0px -20% 0px' // Only trigger when step is centered in viewport
    });
    
    // Observe all steps
    document.querySelectorAll('.step').forEach(step => {
        observer.observe(step);
        console.log(`Now observing step: ${step.dataset.step}`);
    });
}

// Trigger appropriate visualization based on step
function triggerVisualization(stepName, sectionNum) {
    console.log('Triggering visualization:', stepName, 'Section:', sectionNum);

    if (sectionNum === '1') {
        // Keep zoom controls for Section 1 (globe section)
        switch(stepName) {
            case 'ring-intro':
                if (!ringIntroInitialized) {
                    showRingOfFireIntro();
                    ringIntroInitialized = true;
                }
                break;
            case 'ring-reveal':
                // Ring reveal step - do nothing since ring-intro already adds ring and points via timeouts
                console.log('Ring reveal step - no additional action needed');
                ringRevealInitialized = true;
                break;
            // Other narrative steps do not re-render globe
            case 'cities-on-fire':
            case 'dangerous-paradise':
            case 'human-vulnerability':
                // No additional globe updates
                break;
            default:
                break;
        }
        return;
    }

    // ========================================
    // SECTION 2: CRITICAL QUESTION & RICHTER'S CHALLENGE
    // ========================================
    if (sectionNum === '2') {
        // Remove zoom controls for Section 2 since it doesn't need globe interaction
        d3.selectAll('.zoom-controls').remove();
        
        switch(stepName) {
            case 'question-only':
                showQuestionOnly();
                break;
            case 'earthquake-richter':
                showEarthquakeAndRichter();
                break;
            default:
                break;
        }
        return;
    }

    // No other sections implemented yet
    console.log('No visualization for sections beyond Section 2');
}

// ========================================
// SECTION 2: CRITICAL QUESTION FUNCTIONS
// ========================================

// Section 2 state tracking - simplified since we now have separate steps
let section2State = {
    questionStepActive: false,
    earthquakeStepActive: false,
    richterIntroduced: false
};

/**
 * Section 2 Step 1: Shows only the critical question
 */
function showQuestionOnly() {
    console.log('Section 2 Step 1: Showing question only');
    
    // Update state
    section2State.questionStepActive = true;
    section2State.earthquakeStepActive = false;
    
    // Make sure question is visible
    const questionContainer = document.getElementById('question-container');
    if (questionContainer) {
        questionContainer.style.opacity = '1';
        questionContainer.style.transform = 'translate(-50%, -50%)';
    }
    
    // Hide any earthquake/richter elements from previous visits
    const earthquakeOverlay = document.getElementById('earthquake-overlay');
    const richterIntroduction = document.getElementById('richter-introduction');
    
    if (earthquakeOverlay) {
        earthquakeOverlay.classList.remove('active');
    }
    
    if (richterIntroduction) {
        richterIntroduction.classList.remove('active');
    }
}

/**
 * Section 2 Step 2: Shows earthquake simulation and Richter introduction
 */
function showEarthquakeAndRichter() {
    console.log('Section 2 Step 2: Showing earthquake and Richter');
    
    // Update state
    section2State.earthquakeStepActive = true;
    section2State.questionStepActive = false;
    
    // Start earthquake simulation immediately when this step becomes active
    startEarthquakeSimulation();
}

/**
 * Triggers earthquake simulation with screen shaking and cracks
 */
function startEarthquakeSimulation() {
    console.log('Starting earthquake simulation');
    
    const earthquakeOverlay = document.getElementById('earthquake-overlay');
    const body = document.body;
    
    // Show earthquake overlay
    earthquakeOverlay.classList.add('active');
    
    // Add earthquake shaking to the entire page
    body.classList.add('earthquake-shake');
    
    // Add screen cracks after short delay
    setTimeout(() => {
        const screenCracks = earthquakeOverlay.querySelector('.screen-cracks');
        if (screenCracks) {
            screenCracks.classList.add('visible');
        }
    }, 500);
    
    // Stop earthquake simulation and introduce Richter
    setTimeout(() => {
        stopEarthquakeSimulation();
        richterEntersAfterEarthquake();
    }, 3000);
}

/**
 * Stops the earthquake simulation effects
 */
function stopEarthquakeSimulation() {
    console.log('Stopping earthquake simulation');
    
    const earthquakeOverlay = document.getElementById('earthquake-overlay');
    const body = document.body;
    
    // Remove shaking effect
    body.classList.remove('earthquake-shake');
    
    // Fade out earthquake overlay
    earthquakeOverlay.classList.remove('active');
}

/**
 * Introduces Richter mascot after earthquake with dialogue sequence
 */
function richterEntersAfterEarthquake() {
    console.log('Richter enters after earthquake');
    
    const richterIntroduction = document.getElementById('richter-introduction');
    
    // Show Richter introduction container
    richterIntroduction.classList.add('active');
    
    // Start dialogue sequence after Richter enters
    setTimeout(() => {
        startRichterDialogueSequence();
    }, 1500);
}

/**
 * Manages Richter's dialogue sequence with proper timing
 */
function startRichterDialogueSequence() {
    console.log('Starting Richter dialogue sequence');
    
    const speechBubble = document.getElementById('speech-bubble');
    const richterDialogue = document.getElementById('richter-dialogue');
    
    // Dialogue sequence with timing
    const dialogueLines = [
        {
            text: "Whoa! That was a magnitude 7.0 earthquake!",
            duration: 3000
        },
        {
            text: "You know, for decades, we seismologists have believed in a simple story: bigger earthquakes kill more people. It's so obvious, right?",
            duration: 4500
        },
        {
            text: "More energy released should mean more destruction, more collapsed buildings, more casualties.",
            duration: 4000
        },
        {
            text: "This is what we THINK the relationship looks like. Neat, predictable, scientific...",
            duration: 4000,
            showChart: true
        },
        {
            text: "But you know what? I've got access to 4,000 years of real earthquake data—every major quake from 2150 BC to today.",
            duration: 4500
        },
        {
            text: "What do you say we put our beautiful theory to the test?",
            duration: 3500,
            showButton: true
        }
    ];
    
    let currentDialogue = 0;
    
    function showNextDialogue() {
        if (currentDialogue >= dialogueLines.length) {
            console.log('Richter dialogue sequence complete');
            return;
        }
        
        const line = dialogueLines[currentDialogue];
        
        // Update speech bubble text with typewriter effect
        richterDialogue.textContent = '';
        speechBubble.classList.add('active');
        
        typewriterEffect(richterDialogue, line.text, 50, () => {
            // Show chart if specified
            if (line.showChart) {
                setTimeout(() => {
                    showTheoreticalChart();
                }, 1000);
            }
            
            // Show button if specified
            if (line.showButton) {
                setTimeout(() => {
                    showTestTheoryButton();
                }, 1000);
            }
            
            // Move to next dialogue
            setTimeout(() => {
                speechBubble.classList.remove('active');
                setTimeout(() => {
                    currentDialogue++;
                    showNextDialogue();
                }, 500);
            }, line.duration);
        });
    }
    
    // Start the dialogue sequence
    showNextDialogue();
}

/**
 * Creates typewriter effect for text
 */
function typewriterEffect(element, text, speed, callback) {
    let i = 0;
    
    function typeChar() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(typeChar, speed);
        } else if (callback) {
            callback();
        }
    }
    
    typeChar();
}

/**
 * Shows theoretical magnitude vs deaths chart
 */
function showTheoreticalChart() {
    console.log('Showing theoretical chart');
    
    const chartContainer = document.getElementById('theory-chart-container');
    const chartDiv = document.getElementById('theoretical-chart');
    
    chartContainer.classList.add('active');
    
    // Create simple theoretical chart using D3
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 400 - margin.left - margin.right;
    const height = 160 - margin.bottom - margin.top;
    
    // Clear any existing chart
    d3.select(chartDiv).selectAll('*').remove();
    
    const svg = d3.select(chartDiv)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create theoretical data (perfect upward curve)
    const theoreticalData = [];
    for (let mag = 6.0; mag <= 9.0; mag += 0.1) {
        // Exponential relationship: deaths increase exponentially with magnitude
        const deaths = Math.pow(2, (mag - 6) * 4) * 1000;
        theoreticalData.push({ magnitude: mag, deaths: deaths });
    }
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain([6, 9])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(theoreticalData, d => d.deaths)])
        .range([height, 0]);
    
    // Line generator
    const line = d3.line()
        .x(d => xScale(d.magnitude))
        .y(d => yScale(d.deaths))
        .curve(d3.curveMonotoneX);
    
    // Add axes
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 35)
        .attr('fill', '#ccc')
        .style('text-anchor', 'middle')
        .text('Magnitude');
    
    g.append('g')
        .call(d3.axisLeft(yScale).tickFormat(d => d3.format('.0s')(d)))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -35)
        .attr('x', -height / 2)
        .attr('fill', '#ccc')
        .style('text-anchor', 'middle')
        .text('Deaths');
    
    // Add the line with animation
    const path = g.append('path')
        .datum(theoreticalData)
        .attr('fill', 'none')
        .attr('stroke', '#ff4444')
        .attr('stroke-width', 3)
        .attr('d', line);
    
    // Animate the line drawing
    const totalLength = path.node().getTotalLength();
    path
        .attr('stroke-dasharray', totalLength + ' ' + totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(2000)
        .attr('stroke-dashoffset', 0);
    
    // Add glow effect
    g.append('path')
        .datum(theoreticalData)
        .attr('fill', 'none')
        .attr('stroke', '#ff4444')
        .attr('stroke-width', 6)
        .attr('opacity', 0.3)
        .attr('d', line)
        .attr('stroke-dasharray', totalLength + ' ' + totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(2000)
        .attr('stroke-dashoffset', 0);
}

/**
 * Shows the "Test the Theory" interactive button
 */
function showTestTheoryButton() {
    console.log('Showing test theory button');
    
    const testSection = document.getElementById('test-theory-section');
    const testButton = document.getElementById('test-theory-btn');
    
    testSection.classList.add('active');
    
    // Add click handler for the button
    testButton.addEventListener('click', function() {
        console.log('Test Theory button clicked - transitioning to next section');
        
        // Add click animation
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);
        
        // TODO: Transition to Section 3 (data visualization)
        // For now, just log the click
        alert('Ready to test the theory! (Next section will be implemented soon)');
    });
}

// Create 3D rotating globe for Ring of Fire visualization
function showRingOfFireIntro() {
    console.log('Showing Ring of Fire intro');
    
    // Activate the globe viz layer to ensure controls are visible
    d3.selectAll('.viz-layer').classed('active', false);
    d3.select('#viz-globe').classed('active', true);
    
    // Clear any existing globe
    d3.select('.globe-container').selectAll('*').remove();
    
    // Set up dimensions for the globe container dynamically
    const container = d3.select('.globe-container');
    const containerRect = container.node().getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    
    // Create SVG with dynamic sizing
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('display', 'block')
        .style('cursor', 'grab')
        .style('pointer-events', 'all')
        .style('user-select', 'none'); // Prevent text selection during drag
    
    // Create a clipping path for the circular globe
    svg.append('defs')
        .append('clipPath')
        .attr('id', 'globe-clip')
        .append('circle')
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', width / 2 - 10);
    
    // Apply clipping to everything inside the globe
    const globeGroup = svg.append('g')
        .attr('clip-path', 'url(#globe-clip)');
    
    // Setup projection focused on Pacific Ring of Fire with dynamic size
    const projection = d3.geoOrthographic()
        .scale(Math.min(width, height) / 2.2)
        .translate([width / 2, height / 2])
        .rotate([160, -10, 0])  // Focus on Pacific Ring of Fire
        .clipAngle(90);
    
    const path = d3.geoPath().projection(projection);
    
    // Add ocean and land gradients
    const defs = svg.select('defs');
    // Ocean gradient
    const oceanGradient = defs.append('radialGradient')
        .attr('id', 'ocean-gradient')
        .attr('cx', '30%')
        .attr('cy', '30%');
    
    oceanGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#1f293e');  // Dark slate blue center
    
    oceanGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#0f1117');  // Nearly black edges
    
    // Land gradient for countries
    const landGradient = defs.append('radialGradient')
        .attr('id', 'land-gradient')
        .attr('cx', '30%')
        .attr('cy', '30%');
    landGradient.append('stop').attr('offset', '0%').attr('stop-color', '#2a2e34');  // Dark charcoal
    landGradient.append('stop').attr('offset', '100%').attr('stop-color', '#1c2024');  // Almost black
    
    // Add graticule (grid lines)
    const graticule = d3.geoGraticule();
    globeGroup.append('path')
        .datum(graticule)
        .attr('class', 'graticule')
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 255, 255, 0.1)')
        .attr('stroke-width', 0.5);
    
    // Load and draw countries using Natural Earth data
    d3.json('https://unpkg.com/world-atlas@2/countries-110m.json')
        .then(world => {
            console.log('World topology loaded successfully');
            
            // Add land fill using all country polygons
            const land = topojson.feature(world, world.objects.countries);
            globeGroup.append('path')
                .datum(land)
                .attr('class', 'land')
                .attr('d', path)
                .attr('fill', 'url(#land-gradient)')
                .attr('opacity', 1);
            // Add coastline (outer land boundary)
            const coastline = topojson.mesh(world, world.objects.countries, (a, b) => a === b);
            globeGroup.append('path')
                .datum(coastline)
                .attr('class', 'coastline')
                .attr('d', path)
                .attr('fill', 'none')
                .attr('stroke', 'rgba(255,255,255,0.6)')
                .attr('stroke-width', 1);
            // Add country borders (interior boundaries) with matched color to coastline
            const countryBorders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
            globeGroup.append('path')
                .datum(countryBorders)
                .attr('class', 'country-borders')
                .attr('d', path)
                .attr('fill', 'none')
                .attr('stroke', 'rgba(255,255,255,0.6)')
                .attr('stroke-width', 0.5);
                
            console.log('Countries rendered on globe');
        })
        .catch(error => {
            console.log('Failed to load world data, using fallback countries');
            
            // Fallback: create simple continent shapes
            const continents = [
                // North America (simplified)
                {
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        coordinates: [[
                            [-130, 50], [-130, 30], [-100, 30], [-100, 50], [-130, 50]
                        ]]
                    }
                },
                // Asia (simplified)
                {
                    type: "Feature", 
                    geometry: {
                        type: "Polygon",
                        coordinates: [[
                            [100, 50], [150, 50], [150, 20], [100, 20], [100, 50]
                        ]]
                    }
                },
                // Australia (simplified)
                {
                    type: "Feature",
                    geometry: {
                        type: "Polygon", 
                        coordinates: [[
                            [110, -10], [150, -10], [150, -40], [110, -40], [110, -10]
                        ]]
                    }
                }
            ];
            
            globeGroup.selectAll('.country')
                .data(continents)
                .enter().append('path')
                .attr('class', 'country-path')
                .attr('d', path)
                .attr('fill', 'url(#land-gradient)')
                .attr('stroke', 'rgba(255, 255, 255, 0.3)')
                .attr('stroke-width', 0.7)
                .attr('opacity', 0.9);
        });
    
    // Add Ring of Fire highlight
    setTimeout(() => {
        addRingOfFireHighlight(globeGroup, projection, path);
    }, 1000);
    
    // Add earthquake points with animations
    setTimeout(() => {
        addEarthquakePointsWithFlows(globeGroup, projection);
        // Force an immediate update to ensure correct positioning
        setTimeout(() => {
            updateEarthquakePositions(globeGroup, projection);
        }, 100);
    }, 2000);
    
    // Enable smooth drag-to-rotate interaction
    let currentRotation = projection.rotate();
    let isRotating = false;
    
    function updateGlobeRotation() {
        if (!config.isRotating) return;
        
        // Throttle rotation updates for performance
        throttledUpdate(() => {
            config.autoRotation += config.rotationSpeed;
            config.projection.rotate([config.autoRotation, -20, 0]);
            
            // Only update paths, not earthquake points for smoother rotation
            svg.selectAll('path.country')
                .attr('d', config.path);
            
            // Update ring of fire path only
            svg.selectAll('.ring-of-fire-highlight')
                .attr('d', d3.geoPath().projection(config.projection));
        });
        
        if (config.isRotating) {
            requestAnimationFrame(updateGlobeRotation);
        }
    }
    
    const dragBehavior = d3.drag()
        .on('start', (event) => {
            console.log('Drag started:', event);
            svg.style('cursor', 'grabbing');
        })
        .on('drag', (event) => {
            // Use event.dx and event.dy for incremental rotation
            currentRotation[0] += event.dx * 0.25;
            currentRotation[1] -= event.dy * 0.25;
            
            // Constrain latitude rotation
            currentRotation[1] = Math.max(-90, Math.min(90, currentRotation[1]));
            
            // Throttle rotation updates for smoother drag performance
            throttledUpdate(() => {
                projection.rotate(currentRotation);
                
                // Update geographic elements
                globeGroup.selectAll('.land, .coastline, .country-borders, .graticule').attr('d', path);
                globeGroup.selectAll('.ring-of-fire-highlight').attr('d', path);
                
                // Update earthquake positions
                updateEarthquakePositions(globeGroup, projection);
            });
        })
        .on('end', (event) => {
            console.log('Drag ended:', event);
            svg.style('cursor', 'grab');
        });
    
    // Add click handler to hide tooltip when clicking on empty areas
    svg.on('click', function(event) {
        // Check if the click target is the SVG itself (empty area) or globe background
        if (event.target === this || event.target.classList.contains('graticule') || 
            event.target.classList.contains('land') || event.target.classList.contains('coastline') ||
            event.target.classList.contains('country-borders')) {
            hideTooltip();
        }
    });
    
    svg.call(dragBehavior);
    
    // Redraw function: update globe elements after zoom
    function redrawGlobe() {
        globeGroup.selectAll('.land, .coastline, .country-borders, .graticule').attr('d', path);
        globeGroup.selectAll('.ring-of-fire-highlight').attr('d', path);
        globeGroup.selectAll('.earthquake-flow').attr('d', d => createFlowPath(d, projection));
        updateEarthquakePositions(globeGroup, projection);
    }

    // Create top-level zoom controls container so it's not overlapped
    const zoomControls = d3.select('body').append('div')
        .attr('class', 'zoom-controls')
        .style('position', 'fixed')
        .style('bottom', '20px')
        .style('right', '20px')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('gap', '8px')
        .style('z-index', '99999');

    // Zoom In
    zoomControls.append('button')
        .text('+')
        .attr('title', 'Zoom In')
        .attr('class', 'zoom-btn zoom-in')
        .on('click', () => { projection.scale(projection.scale() * 1.2); redrawGlobe(); });

    // Zoom Out
    zoomControls.append('button')
        .text('−')
        .attr('title', 'Zoom Out')
        .attr('class', 'zoom-btn zoom-out')
        .on('click', () => { projection.scale(projection.scale() * 0.8); redrawGlobe(); });
}

// Add Ring of Fire highlighting to the globe
function addRingOfFireHighlight(svg, projection, path) {
    // Create Ring of Fire path with accurate coordinates
    const ringOfFireCoords = [
        // Start from Alaska/Aleutian Islands
        [-160, 55], [-155, 60], [-150, 58],
        // Down the North American Pacific Coast
        [-135, 55], [-125, 50], [-125, 45], [-120, 40], [-120, 35], [-115, 32], [-110, 28],
        // Central America
        [-105, 20], [-95, 15], [-85, 12],
        // South America Pacific Coast
        [-80, 5], [-75, -5], [-75, -15], [-70, -25], [-70, -35], [-72, -45],
        // Across to New Zealand area via Pacific-Antarctic Ridge
        [-75, -55], [160, -55], [170, -50], [175, -45], [178, -40],
        // Up through Tonga/Fiji area
        [180, -30], [-180, -25], [-175, -20], [180, -15],
        // Through Solomon Islands and Papua New Guinea
        [160, -10], [150, -5], [145, 0],
        // Indonesia archipelago
        [140, 2], [130, 5], [125, 8],
        // Philippines
        [125, 12], [125, 18], [125, 22],
        // Taiwan and Japan
        [125, 25], [130, 30], [135, 35], [140, 40], [145, 45],
        // Kuril Islands and Kamchatka
        [150, 50], [155, 55], [160, 60],
        // Back to Aleutians to close the ring
        [165, 58], [-170, 55], [-160, 55]
    ];

    const ringPath = d3.geoPath().projection(projection);
    const lineString = {
        type: "LineString",
        coordinates: ringOfFireCoords
    };
    
    const ringElement = svg.append('path')
        .datum(lineString)
        .attr('class', 'ring-of-fire-highlight')
        .attr('d', ringPath)
        .attr('fill', 'none')
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 4)
        .attr('stroke-dasharray', '20,10')
        .attr('stroke-linecap', 'round')
        .style('will-change', 'stroke-dashoffset')
        .attr('opacity', 0);
    
    // Apply transition
    ringElement.transition()
        .duration(3000)
        .delay(2000)
        .attr('opacity', 0.85);
}

// Helper function to update earthquake positions
function updateEarthquakePositions(svg, projection) {
    // Add error checking to prevent issues during drag
    if (!svg || !projection) return;
    
    // Update visible earthquake points
    svg.selectAll('.quake-point')
        .attr('cx', d => {
            const projected = projection([d.lon, d.lat]);
            return projected ? projected[0] : -1000;
        })
        .attr('cy', d => {
            const projected = projection([d.lon, d.lat]);
            return projected ? projected[1] : -1000;
        })
        .style('display', d => {
            const isVisible = isVisibleOnGlobe(d.lat, d.lon, projection);
            return isVisible ? 'block' : 'none'; // Use display instead of opacity for better performance
        });
    
    // Update invisible click targets
    svg.selectAll('.quake-click-target')
        .attr('cx', d => {
            const projected = projection([d.lon, d.lat]);
            return projected ? projected[0] : -1000;
        })
        .attr('cy', d => {
            const projected = projection([d.lon, d.lat]);
            return projected ? projected[1] : -1000;
        })
        .style('display', d => isVisibleOnGlobe(d.lat, d.lon, projection) ? 'block' : 'none');
    
    // Update Ring of Fire path but preserve animation
    svg.selectAll('.ring-of-fire-highlight')
        .attr('d', d3.geoPath().projection(projection));
}

// Add earthquake points with flowing connections
function addEarthquakePointsWithFlows(svg, projection) {
    // Show all earthquakes worldwide, but highlight Ring of Fire ones
    const allQuakes = earthquakeData.filter(d => d.magnitude >= 3.5); // Show significant earthquakes worldwide
    console.log('Total earthquakeData length:', earthquakeData.length);
    console.log('Displaying', allQuakes.length, 'earthquake points worldwide');
    
    // Debug: Check geographic distribution
    const regionCounts = {
        pacific: allQuakes.filter(d => isInRingOfFire(d.lat, d.lon)).length,
        europe: allQuakes.filter(d => d.lon >= -20 && d.lon <= 40 && d.lat >= 35 && d.lat <= 70).length,
        africa: allQuakes.filter(d => d.lon >= -20 && d.lon <= 50 && d.lat >= -35 && d.lat <= 35).length,
        asia: allQuakes.filter(d => d.lon >= 40 && d.lon <= 120 && d.lat >= 5 && d.lat <= 70).length,
        americas: allQuakes.filter(d => d.lon >= -180 && d.lon <= -30).length
    };
    console.log('Earthquake distribution by region:', regionCounts);
    
    if (allQuakes.length === 0) {
        console.error('No earthquakes found to display! Check data loading.');
        return;
    }
    
    const pointsGroup = svg.append('g').attr('class', 'quake-points');
    
    // Add visible earthquake circles
    const earthquakeCircles = pointsGroup.selectAll('.quake-point')
        .data(allQuakes)
        .enter().append('circle')
            .attr('class', 'quake-point')
            .attr('cx', d => {
                const p = projection([d.lon, d.lat]);
                return p ? p[0] : -1000;
            })
            .attr('cy', d => {
                const p = projection([d.lon, d.lat]);
                return p ? p[1] : -1000;
            })
            .attr('r', d => {
                const isRingOfFire = isInRingOfFire(d.lat, d.lon);
                const baseRadius = Math.max(1.5, Math.sqrt(d.magnitude) * 1.2); // Smaller minimum, slightly reduced scaling
                return isRingOfFire ? baseRadius : baseRadius * 0.7; // Ring of Fire earthquakes are larger
            })
            .attr('fill', d => {
                const isRingOfFire = isInRingOfFire(d.lat, d.lon);
                if (isRingOfFire) {
                    return '#ef4444'; // Bright red for Ring of Fire
                } else {
                    // Color by magnitude for non-Ring of Fire earthquakes
                    if (d.magnitude >= 8) return '#ff6b6b';
                    if (d.magnitude >= 7) return '#ff8e53';
                    if (d.magnitude >= 6.5) return '#ffad33';
                    return '#ffd93d';
                }
            })
            .attr('stroke', d => {
                const isRingOfFire = isInRingOfFire(d.lat, d.lon);
                return isRingOfFire ? '#fff' : 'rgba(255,255,255,0.6)';
            })
            .attr('stroke-width', d => {
                const isRingOfFire = isInRingOfFire(d.lat, d.lon);
                return isRingOfFire ? 0.8 : 0.3;
            })
            .attr('opacity', 1); // All circles are fully opaque for maximum brightness
    
    // Add invisible larger click targets for easier interaction
    const clickTargets = pointsGroup.selectAll('.quake-click-target')
        .data(allQuakes)
        .enter().append('circle')
            .attr('class', 'quake-click-target')
            .attr('cx', d => {
                const p = projection([d.lon, d.lat]);
                return p ? p[0] : -1000;
            })
            .attr('cy', d => {
                const p = projection([d.lon, d.lat]);
                return p ? p[1] : -1000;
            })
            .attr('r', d => {
                const isRingOfFire = isInRingOfFire(d.lat, d.lon);
                const baseRadius = Math.max(1.5, Math.sqrt(d.magnitude) * 1.2); // Match the visible circle sizing
                const visibleRadius = isRingOfFire ? baseRadius : baseRadius * 0.7;
                return Math.max(12, visibleRadius * 2); // Minimum 12px click target, or 2x the visible radius
            })
            .attr('fill', 'transparent')
            .attr('stroke', 'none')
            .style('cursor', 'pointer')
            .on('click', function(event, d) {
                event.stopPropagation(); // Prevent tooltip from hiding immediately
                const content = `
                    <strong>${d.location || 'Unknown Location'}</strong><br/>
                    Magnitude: ${d.magnitude}<br/>
                    Deaths: ${d.deaths.toLocaleString()}<br/>
                    Year: ${d.year}
                    ${isInRingOfFire(d.lat, d.lon) ? '<br/><em>Ring of Fire</em>' : ''}`;
                showTooltip(event, content);
            })
            .on('mouseover', function(event, d) {
                // Add hover effect for larger earthquakes on both visible and invisible circles
                if (d.magnitude >= 7) {
                    // Find the corresponding visible circle
                    const visibleCircle = d3.select(earthquakeCircles.nodes()[allQuakes.indexOf(d)]);
                    visibleCircle
                        .transition()
                        .duration(200)
                        .attr('r', function() {
                            return +d3.select(this).attr('r') * 1.3;
                        })
                        .attr('opacity', 1);
                }
            })
            .on('mouseout', function(event, d) {
                // Remove hover effect
                if (d.magnitude >= 7) {
                    const isRingOfFire = isInRingOfFire(d.lat, d.lon);
                    const baseRadius = Math.max(1.5, Math.sqrt(d.magnitude) * 1.2);
                    const finalRadius = isRingOfFire ? baseRadius : baseRadius * 0.7;
                    
                    // Calculate correct opacity
                    let finalOpacity;
                    if (isRingOfFire) {
                        finalOpacity = 0.9;
                    } else {
                        if (d.magnitude >= 6) finalOpacity = 0.8;
                        else if (d.magnitude >= 5) finalOpacity = 0.7;
                        else if (d.magnitude >= 4.5) finalOpacity = 0.6;
                        else finalOpacity = 0.4;
                    }
                    
                    // Find the corresponding visible circle
                    const visibleCircle = d3.select(earthquakeCircles.nodes()[allQuakes.indexOf(d)]);
                    visibleCircle
                        .transition()
                        .duration(200)
                        .attr('r', finalRadius)
                        .attr('opacity', finalOpacity);
                }
            });
}

// Create flow paths between earthquake points
function createFlowPath(earthquake, projection) {
    const start = projection([earthquake.lon, earthquake.lat]);
    if (!start) return '';
    
    // Create flow toward Pacific center
    const pacificCenter = projection([180, 0]);
    if (!pacificCenter) return '';
    
    const midPoint = [
        (start[0] + pacificCenter[0]) / 2 + (Math.random() - 0.5) * 100,
        (start[1] + pacificCenter[1]) / 2 - 30
    ];
    
    return `M ${start[0]} ${start[1]} Q ${midPoint[0]} ${midPoint[1]} ${pacificCenter[0]} ${pacificCenter[1]}`;
}

// Check if point is visible on the current globe view
function isVisibleOnGlobe(lat, lon, projection) {
    try {
        const projected = projection([lon, lat]);
        if (!projected) return false;
        
        // Check if the point is on the visible hemisphere
        const center = projection.invert(projection.translate());
        if (!center) return false;
        
        const distance = d3.geoDistance([lon, lat], center);
        const isVisible = distance < Math.PI / 2; // Within 90 degrees of center (visible hemisphere)
        
        // Debug: log some sample points
        if (Math.random() < 0.001) { // Log 0.1% of checks
            console.log(`Visibility check: lat=${lat}, lon=${lon}, center=${center}, distance=${distance}, visible=${isVisible}`);
        }
        
        return isVisible;
    } catch (error) {
        console.error('Error in isVisibleOnGlobe:', error, 'lat:', lat, 'lon:', lon);
        return false;
    }
}

// Start Ring of Fire focused rotation
function startRingOfFireRotation(svg, projection, path) {
    let rotation = 160; // Start focused on Pacific
    
    function rotate() {
        rotation += 0.1; // Slow rotation
        projection.rotate([rotation, -10, 0]);
        
        // Update all geographic elements
        svg.selectAll('.land').attr('d', path);
        svg.selectAll('.borders').attr('d', path);
        svg.selectAll('.graticule').attr('d', path);
        svg.selectAll('.ring-of-fire-highlight').attr('d', path);
        
        // Update earthquake points
        updateEarthquakePositions(svg, projection);
        
        requestAnimationFrame(rotate);
    }
    
    // Start rotation after initial animations complete
    setTimeout(rotate, 5000);
}

// Add pulsing effect to earthquake points
function addPulsingEffect(selection) {
    selection.transition()
        .duration(2000)
        .attr('r', function() {
            const currentR = d3.select(this).attr('r');
            return currentR * 1.5;
        })
        .style('opacity', 0.5)
        .transition()
        .duration(2000)
        .attr('r', function() {
            const currentR = d3.select(this).attr('r');
            return currentR / 1.5;
        })
        .style('opacity', 0.9)
        .on('end', function() {
            d3.select(this).call(addPulsingEffect);
        });
}

// Check if coordinates are in Ring of Fire region
function isInRingOfFire(lat, lon) {
    // Pacific Ring of Fire - more precise boundaries
    
    // Western Pacific (Japan, Philippines, Indonesia, New Zealand)
    if (lon >= 120 && lon <= 180 && lat >= -50 && lat <= 70) {
        return true;
    }
    
    // Eastern Pacific (Alaska to Chile)
    if (lon >= -180 && lon <= -60 && lat >= -60 && lat <= 70) {
        return true;
    }
    
    // Include specific volcanic/seismic regions:
    
    // Kamchatka Peninsula
    if (lon >= 155 && lon <= 165 && lat >= 50 && lat <= 65) {
        return true;
    }
    
    // Aleutian Islands
    if (lon >= 170 && lon <= 180 && lat >= 50 && lat <= 60) {
        return true;
    }
    if (lon >= -180 && lon <= -150 && lat >= 50 && lat <= 60) {
        return true;
    }
    
    // Indonesia and surrounding regions
    if (lon >= 90 && lon <= 140 && lat >= -15 && lat <= 10) {
        return true;
    }
    
    // Central America volcanic arc
    if (lon >= -95 && lon <= -80 && lat >= 5 && lat <= 20) {
        return true;
    }
    
    return false;
}

// Check if point is visible on current globe rotation
function isVisible(lat, lon) {
    const projected = config.projection([lon, lat]);
    if (!projected) return false;
    
    const distance = d3.geoDistance([lon, lat], config.projection.invert([config.width/2, config.height/2]));
    return distance < Math.PI / 2;
}

// Start continuous globe rotation
function startGlobeRotation(svg) {
    const projection = d3.geoOrthographic()
        .scale(250)  // Match the scale from showRingOfFireIntro
        .translate([250, 250])
        .clipAngle(90);
    
    const path = d3.geoPath().projection(projection);
    let rotation = [160, -10, 0]; // Start with Pacific focus
    
    function rotate() {
        rotation[0] += 0.2; // Slow rotation
        
        projection.rotate(rotation);
        
        // Update all paths
        svg.selectAll('.land').attr('d', path);
        svg.selectAll('.coastline').attr('d', path);
        svg.selectAll('.country-borders').attr('d', path);
        svg.selectAll('.graticule').attr('d', path);
        svg.selectAll('.ring-of-fire').attr('d', path);
        svg.selectAll('.earthquake-flow').attr('d', path);
        
        // Update earthquake points
        updateEarthquakePositions(svg, projection);
        
        requestAnimationFrame(rotate);
    }
    
    rotate();
}

// Enhanced Ring of Fire with earthquake flows
function showFullRingOfFire() {
    const container = d3.select('#viz-globe');
    const svg = container.select('svg');
    
    if (svg.empty()) {
        showRingOfFireIntro();
        return;
    }
    
    // Stop rotation and focus on Pacific
    config.projection.rotate([160, -20, 0]);
    
    // Clear previous earthquake points
    svg.selectAll('.earthquake-intro').remove();
    
    // Add all significant earthquakes worldwide (magnitude 6.0+)
    const significantEarthquakes = earthquakeData.filter(d => d.magnitude >= 6.0);
    
    // Create earthquake flows (curved lines to Ring of Fire) - only for Ring of Fire earthquakes
    const ringOfFireQuakes = significantEarthquakes.filter(d => isInRingOfFire(d.lat, d.lon));
    const flows = svg.selectAll('.earthquake-flow')
        .data(ringOfFireQuakes.slice(0, 30)) // Limit flows to avoid clutter
        .enter()
        .append('path')
        .attr('class', 'earthquake-flow')
        .attr('d', d => createEarthquakeFlow(d))
        .attr('fill', 'none')
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2)
        .attr('opacity', 0)
        .filter(d => isVisible(d.lat, d.lon));
    
    // Animate flows
    flows.transition()
        .duration(2000)
        .delay((d, i) => i * 100)
        .attr('opacity', 0.4)
        .attr('stroke-width', d => Math.sqrt(d.magnitude) * 0.8);
    
    // Add earthquake points for all significant earthquakes
    const earthquakes = svg.selectAll('.earthquake-major')
        .data(significantEarthquakes)
        .enter()
        .append('circle')
        .attr('class', 'earthquake-major')
        .attr('cx', d => {
            const projected = config.projection([d.lon, d.lat]);
            return projected ? projected[0] : -1000;
        })
        .attr('cy', d => {
            const projected = config.projection([d.lon, d.lat]);
            return projected ? projected[1] : -1000;
        })
        .attr('r', 0)
        .attr('fill', d => {
            const isRingOfFire = isInRingOfFire(d.lat, d.lon);
            if (isRingOfFire) {
                return d.deaths > 10000 ? '#dc2626' : '#ef4444';
            } else {
                // Different colors for non-Ring of Fire earthquakes
                if (d.magnitude >= 8) return '#ff6b6b';
                if (d.magnitude >= 7.5) return '#ff8e53';
                if (d.magnitude >= 7) return '#ffad33';
                return '#ffd93d';
            }
        })
        .attr('stroke', d => {
            const isRingOfFire = isInRingOfFire(d.lat, d.lon);
            return isRingOfFire ? '#fbbf24' : 'rgba(255,255,255,0.7)';
        })
        .attr('stroke-width', d => {
            const isRingOfFire = isInRingOfFire(d.lat, d.lon);
            return isRingOfFire ? 2 : 1;
        })
        .style('opacity', 0)
        .filter(d => isVisible(d.lat, d.lon));
    
    earthquakes.transition()
        .duration(1500)
        .delay((d, i) => i * 50)
        .attr('r', d => {
            const isRingOfFire = isInRingOfFire(d.lat, d.lon);
            const baseRadius = Math.sqrt(d.magnitude) * 2.5;
            return isRingOfFire ? baseRadius : baseRadius * 0.8;
        })
        .style('opacity', d => {
            const isRingOfFire = isInRingOfFire(d.lat, d.lon);
            return isRingOfFire ? 0.9 : 0.7;
        });
    
    // Add hover interactions
    earthquakes
        .on('mouseover', function(event, d) {
            showTooltip(event, `
                <strong>${d.location || 'Unknown Location'}</strong><br/>
                Magnitude: ${d.magnitude}<br/>
                Deaths: ${d.deaths.toLocaleString()}<br/>
                Year: ${d.year}
                ${isInRingOfFire(d.lat, d.lon) ? '<br/><em>Ring of Fire</em>' : ''}
            `);
        })
        .on('mouseout', hideTooltip);
}

// Create curved flow lines for earthquake visualization
function createEarthquakeFlow(earthquake) {
    const start = config.projection([earthquake.lon, earthquake.lat]);
    if (!start) return '';
    
    // Create flow toward center of Ring of Fire (Pacific center)
    const pacificCenter = config.projection([180, 0]);
    if (!pacificCenter) return '';
    
    const midPoint = [
        (start[0] + pacificCenter[0]) / 2,
        (start[1] + pacificCenter[1]) / 2 - 50 // Curve upward
    ];
    
    return `M ${start[0]} ${start[1]} Q ${midPoint[0]} ${midPoint[1]} ${pacificCenter[0]} ${pacificCenter[1]}`;
}

// Utility functions
function showTooltip(event, content) {
    tooltip.html(content)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .classed('hidden', false);
}

function hideTooltip() {
    tooltip.classed('hidden', true);
}

function setupInteractivity() {
    // No additional interactivity needed since we only have Section 1
}

// Window resize handler
window.addEventListener('resize', function() {
    config.width = window.innerWidth;
    config.height = window.innerHeight;
    setupProjection();
    
    // Redraw current visualization based on the active step
    const activeStep = document.querySelector('.step.active');
    if (activeStep) {
        const stepName = activeStep.dataset.step;
        const sectionNum = activeStep.closest('.story-section').dataset.section;
        console.log(`Redrawing visualization for step "${stepName}" after resize`);
        triggerVisualization(stepName, sectionNum);
    }
});

console.log('Script loaded successfully'); 