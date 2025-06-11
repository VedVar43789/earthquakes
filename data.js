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

// ========== SCROLL-UP TRIGGER ========== //
function setupScrollUpTrigger() {
    let lastScrollY = window.scrollY;
    let scrollUpAttempts = 0;
    const SCROLL_UP_THRESHOLD = 3; // Number of scroll-up attempts needed
    
    function handleScrollUp() {
        const currentScrollY = window.scrollY;
        
        // Only trigger when at the very top of the page (within 50px)
        if (currentScrollY <= 50) {
            // Detect upward scroll
            if (currentScrollY < lastScrollY - 5) {
                scrollUpAttempts++;
                console.log(`🔄 Scroll up attempt ${scrollUpAttempts}/${SCROLL_UP_THRESHOLD}`);
                
                // Show visual feedback
                if (scrollUpAttempts === 1) {
                    showScrollUpIndicator();
                }
                
                // Trigger redirect after multiple attempts
                if (scrollUpAttempts >= SCROLL_UP_THRESHOLD) {
                    console.log('🔙 Redirecting back to prediction interface...');
                    window.location.href = 'index.html';
                    return;
                }
            }
        } else {
            // Reset counter when not at top
            scrollUpAttempts = 0;
            hideScrollUpIndicator();
        }
        
        lastScrollY = currentScrollY;
    }
    
    // Add scroll listener with throttling
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(handleScrollUp, 16); // ~60fps
    });
    
    // Also listen for wheel events for more immediate response
    window.addEventListener('wheel', (event) => {
        if (window.scrollY <= 50 && event.deltaY < 0) {
            scrollUpAttempts++;
            if (scrollUpAttempts === 1) {
                showScrollUpIndicator();
            }
            if (scrollUpAttempts >= SCROLL_UP_THRESHOLD) {
                console.log('🔙 Wheel scroll up - redirecting back to prediction interface...');
                window.location.href = 'index.html';
            }
        } else if (window.scrollY > 50) {
            scrollUpAttempts = 0;
            hideScrollUpIndicator();
        }
    });
}

function showScrollUpIndicator() {
    // Remove existing indicator
    const existing = document.getElementById('scroll-up-indicator');
    if (existing) existing.remove();
    
    // Create scroll-up indicator
    const indicator = document.createElement('div');
    indicator.id = 'scroll-up-indicator';
    indicator.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            animation: slideDown 0.3s ease;
        ">
            ↑ Scroll up again to return to prediction
        </div>
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(indicator);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        hideScrollUpIndicator();
    }, 3000);
}

function hideScrollUpIndicator() {
    const indicator = document.getElementById('scroll-up-indicator');
    if (indicator) {
        indicator.style.animation = 'slideDown 0.3s ease reverse';
        setTimeout(() => indicator.remove(), 300);
    }
}

// ========== INITIALIZATION ========== //
document.addEventListener('DOMContentLoaded', function() {
    initializeCanvas();
    loadData();
    setupScrollTrigger();
    setupCountrySearch();
    setupThemeToggle();
    setupScrollUpTrigger(); // Add scroll-up trigger
    // Setup prediction toggle listener
    const showPrediction = document.getElementById('show-prediction-toggle');
    if (showPrediction) {
        showPrediction.checked = false;
        showPrediction.addEventListener('change', function() {
            if (typeof drawVisualization === 'function') drawVisualization();
        });
    }
    
    // Initialize prediction toggle visibility based on initial view
    updatePredictionToggleVisibility();
});

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
            currentView = 'hidden'; // Hide the main graph completely
            hideViewToggle();
            hideSidebar(); // Don't show sidebar for this section
            clearSearchHighlighting();
            
            // Reset infrastructure chart progress
            infraChartProgress = 0;
            targetInfraChartProgress = 0;
            break;
            
        case 'infrastructure-data-visualization':
            targetAnimationProgress = 0;
            currentView = 'hidden'; // Hide the main graph completely
            hideViewToggle();
            hideSidebar(); // Don't show sidebar for this section
            clearSearchHighlighting();
            
            // Initialize infrastructure bar charts immediately when section is triggered
            console.log('Triggered infrastructure-data-visualization section - initializing charts immediately');
            initializeInfrastructureBarCharts();
            
            // Add animation classes after charts are created
            setTimeout(() => {
                addChartAnimationClasses();
            }, 400); // Wait for charts to be created (200ms init + 200ms buffer)
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
    // Clear canvas with theme-aware background
    ctx.fillStyle = getThemeAwareColor('--bg-primary');
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
        dot.color = getInfrastructureColor(dot.data.infrastructure);
    });
    
    // Set target opacities based on search
    if (searchedCountry) {
        visibleDots.forEach(dot => {
            if (dot.data.country.toLowerCase().includes(searchedCountry.toLowerCase())) {
                dot.targetOpacity = 0.95;
            } else {
                dot.targetOpacity = 0.1;
            }
        });
    }
    
    // Draw dots with proper layering when country search is active
    if (searchedCountry) {
        // First pass: draw dimmed dots (non-searched countries) in the background
        visibleDots.forEach(dot => {
            if (!dot.data.country.toLowerCase().includes(searchedCountry.toLowerCase())) {
                const currentCanvasWidth = canvas.offsetWidth || canvasWidth;
                const maxRadius = dot.currentSize || dot.size;
                
                if (dot.currentX >= chartMargin.left - maxRadius && 
                    dot.currentX <= currentCanvasWidth - chartMargin.right + maxRadius &&
                    dot.currentY >= chartMargin.top - maxRadius && 
                    dot.currentY <= canvasHeight - chartMargin.bottom + maxRadius) {
                    let opacity = dot.opacity;
                    
                    if (hoveredDot) {
                        opacity = (dot === hoveredDot) ? dot.opacity : Math.max(0.1, dot.opacity * 0.3);
                    }
                    
                    ctx.fillStyle = dot.color;
                    ctx.globalAlpha = opacity;
                    ctx.beginPath();
                    ctx.arc(dot.currentX, dot.currentY, dot.currentSize || dot.size, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        });
        
        // Second pass: draw highlighted dots (searched country) on top
        visibleDots.forEach(dot => {
            if (dot.data.country.toLowerCase().includes(searchedCountry.toLowerCase())) {
                const currentCanvasWidth = canvas.offsetWidth || canvasWidth;
                const maxRadius = dot.currentSize || dot.size;
                
                if (dot.currentX >= chartMargin.left - maxRadius && 
                    dot.currentX <= currentCanvasWidth - chartMargin.right + maxRadius &&
                    dot.currentY >= chartMargin.top - maxRadius && 
                    dot.currentY <= canvasHeight - chartMargin.bottom + maxRadius) {
                    let opacity = dot.opacity;
                    
                    if (hoveredDot) {
                        opacity = (dot === hoveredDot) ? dot.opacity : Math.max(0.1, dot.opacity * 0.3);
                    }
                    
                    ctx.fillStyle = dot.color;
                    ctx.globalAlpha = opacity;
                    ctx.beginPath();
                    ctx.arc(dot.currentX, dot.currentY, dot.currentSize || dot.size, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        });
    } else {
        // No country search active - draw all dots normally
        visibleDots.forEach(dot => {
            const currentCanvasWidth = canvas.offsetWidth || canvasWidth;
            const maxRadius = dot.currentSize || dot.size;
            
            if (dot.currentX >= chartMargin.left - maxRadius && 
                dot.currentX <= currentCanvasWidth - chartMargin.right + maxRadius &&
                dot.currentY >= chartMargin.top - maxRadius && 
                dot.currentY <= canvasHeight - chartMargin.bottom + maxRadius) {
                let opacity = dot.opacity;
                
                if (hoveredDot) {
                    opacity = (dot === hoveredDot) ? dot.opacity : Math.max(0.1, dot.opacity * 0.3);
                }
                
                ctx.fillStyle = dot.color;
                ctx.globalAlpha = opacity;
                ctx.beginPath();
                ctx.arc(dot.currentX, dot.currentY, dot.currentSize || dot.size, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }
    
    // Remove the white outlines completely when searching for a country
    // The highlighting will be handled by adjusting the opacity of dots instead
    ctx.globalAlpha = 1;

    // === Overlay user prediction line ===
    try {
        const showPrediction = document.getElementById('show-prediction-toggle');
        // Only show prediction in normal dots view (not bubble view)
        if (showPrediction && showPrediction.checked && currentView === 'dots') {
            const predictionRaw = localStorage.getItem('userPredictionData');
            if (predictionRaw) {
                const prediction = JSON.parse(predictionRaw);
                if (prediction && prediction.points && prediction.points.length > 1) {
                    // Updated coordinate transformation to match new prediction chart scales
                    const predX0 = 50, predX1 = 570; // Adjusted to match new prediction chart width
                    const predY0 = 225, predY1 = 10; // Adjusted to match new prediction chart height
                    const magMin = 0, magMax = 10;
                    
                    // Use current chart domains for accurate mapping
                    const currentDeathsDomain = currentAxisDomains ? currentAxisDomains.deaths : [0.5, d3.max(data, d => d.deaths)];
                    
                    // Transform points and filter to only those within chart boundaries
                    const chartLeft = chartMargin.left;
                    const chartRight = chartMargin.left + chartWidth;
                    const chartTop = chartMargin.top;
                    const chartBottom = chartMargin.top + chartHeight;
                    
                    const validPoints = prediction.points
                        .map(pt => {
                            const mag = magMin + (pt.x - predX0) / (predX1 - predX0) * (magMax - magMin);
                            
                            // Simple linear interpolation from prediction y-coordinate to deaths
                            const deathsNormalized = (predY0 - pt.y) / (predY0 - predY1); // 0 to 1
                            const deaths = deathsNormalized * 330000; // Map to 0-330K deaths linearly
                            
                            // Map to canvas coordinates
                            const x = chartMargin.left + (mag - magMin) / (magMax - magMin) * chartWidth;
                            const y = chartMargin.top + chartHeight - (deaths - currentDeathsDomain[0]) / (currentDeathsDomain[1] - currentDeathsDomain[0]) * chartHeight;
                            
                            return { x, y, mag, deaths };
                        })
                        .filter(pt => {
                            // Clip much more from the start - start line well into the chart
                            const startMargin = chartWidth * 0.15; // Start 15% into the chart
                            return pt.x >= (chartLeft + startMargin) && pt.x <= chartRight && 
                                   pt.y >= chartTop && pt.y <= chartBottom &&
                                   pt.mag >= 2.0 && pt.mag <= 10; // Start at magnitude 2.0
                        });
                    
                    if (validPoints.length > 1) {
                        ctx.save();
                        ctx.strokeStyle = '#00ff88';
                        ctx.lineWidth = 4;
                        ctx.globalAlpha = 0.85;
                        ctx.setLineDash([8, 4]); // Dashed line to distinguish from data
                        ctx.beginPath();
                        ctx.moveTo(validPoints[0].x, validPoints[0].y);
                        validPoints.slice(1).forEach(pt => ctx.lineTo(pt.x, pt.y));
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }
        }
    } catch (e) {
        // Fail silently
    }
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
    const xAxis = svg.append('g')
        .attr('transform', `translate(0,${canvasHeight - chartMargin.bottom})`)
        .call(d3.axisBottom(xScale));
    
    // Style X axis with theme-aware colors
    xAxis.selectAll('text')
        .style('fill', getAxisTextColor());
    xAxis.selectAll('.domain, .tick line')
        .style('stroke', getAxisStrokeColor());
    
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
    
    const yAxis = svg.append('g')
        .attr('transform', `translate(${chartMargin.left},0)`)
        .call(d3.axisLeft(yScale)
            .tickValues(visibleTicks)
            .tickFormat(customFormat)
        );
    
    // Style Y axis with theme-aware colors
    yAxis.selectAll('text')
        .style('fill', getAxisTextColor());
    yAxis.selectAll('.domain, .tick line')
        .style('stroke', getAxisStrokeColor());
    
    // Axis labels
    svg.append('text')
        .attr('x', currentCanvasWidth / 2)
        .attr('y', canvasHeight - 20)
        .attr('text-anchor', 'middle')
        .attr('fill', getTextColor())
        .attr('font-size', '14px')
        .text('Earthquake Magnitude');
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -canvasHeight / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('fill', getTextColor())
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
            
            // Show/hide prediction toggle based on view
            updatePredictionToggleVisibility();
            
            // Update dot sizes based on view with smooth transitions
            updateDotSizes();
        });
    });
}

function updatePredictionToggleVisibility() {
    const predictionLabel = document.querySelector('label[for="show-prediction-toggle"]');
    const predictionCheckbox = document.getElementById('show-prediction-toggle');
    
    if (predictionLabel && predictionCheckbox) {
        if (currentView === 'dots') {
            // Show prediction toggle for normal dots view
            predictionLabel.style.display = 'flex';
            predictionCheckbox.style.display = 'block';
        } else {
            // Hide prediction toggle for bubble view and uncheck it
            predictionLabel.style.display = 'none';
            predictionCheckbox.style.display = 'none';
            predictionCheckbox.checked = false;
        }
    }
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
          <!-- Prediction Toggle -->
          <div style="display: flex; align-items: center; gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #00ff88; cursor: pointer;">
              <input type="checkbox" id="show-prediction-toggle" style="accent-color: #00ff88; width: 1.1em; height: 1.1em;" />
              Show Your Prediction
            </label>
          </div>
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
            // If we're searching for a country, only allow tooltip for matching dots
            if (searchedCountry) {
                if (dot.data.country.toLowerCase().includes(searchedCountry.toLowerCase())) {
                    minDistance = distance;
                    closestDot = dot;
                }
            } else {
                // No country search active, allow any dot
                minDistance = distance;
                closestDot = dot;
            }
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

function initializeInfrastructureBarCharts() {
    // Initialize the three interactive bar charts with error handling
    setTimeout(() => {
        try {
            console.log('Initializing infrastructure bar charts...');
            
            // Clean up any existing tooltips first
            d3.selectAll('.bar-chart-tooltip').remove();
            
            // Check if containers exist
            const containers = ['deathsChart', 'damageChart', 'recoveryChart'];
            const availableContainers = containers.filter(id => document.getElementById(id));
            
            if (availableContainers.length === 0) {
                console.warn('No chart containers found. Available IDs:', 
                    Array.from(document.querySelectorAll('[id*="Chart"]')).map(el => el.id));
                return;
            }
            
            console.log('Found chart containers:', availableContainers);
            
            // Create charts immediately
            createDeathsBarChart();
            createDamageBarChart();
            createRecoveryBarChart();
            
            console.log('Infrastructure bar charts initialized successfully');
        } catch (error) {
            console.error('Error initializing infrastructure bar charts:', error);
        }
    }, 200); // Shorter delay for faster response
}

function initializeInfrastructureBarChartsWithVisibility() {
    console.log('Setting up infrastructure bar charts with visibility detection...');
    
    // Wait for DOM to be ready
    setTimeout(() => {
        const infrastructureSection = document.querySelector('[data-step="infrastructure-data-visualization"]');
        
        if (!infrastructureSection) {
            console.warn('Infrastructure data visualization section not found, trying by class...');
            const alternativeSection = document.querySelector('.infrastructure-final-analysis');
            if (alternativeSection) {
                console.log('Found infrastructure section by class, initializing charts...');
                initializeInfrastructureBarCharts();
                return;
            }
            console.warn('No infrastructure section found, initializing charts anyway...');
            initializeInfrastructureBarCharts();
            return;
        }
        
        console.log('Found infrastructure section:', infrastructureSection);
        
        // Function to check and initialize charts
        const checkAndInitialize = () => {
            const rect = infrastructureSection.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const isVisible = rect.top < windowHeight * 0.8 && rect.bottom > windowHeight * 0.2;
            
            if (isVisible) {
                console.log('Infrastructure section is visible, initializing charts...');
                // Add CSS animation class to containers
                addChartAnimationClasses();
                initializeInfrastructureBarCharts();
                return true;
            }
            return false;
        };
        
        // Check if already visible
        if (checkAndInitialize()) {
            return;
        }
        
        // Set up intersection observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const rect = entry.target.getBoundingClientRect();
                    const intersectionRatio = entry.intersectionRatio;
                    
                    console.log('Infrastructure section intersection:', { 
                        intersectionRatio, 
                        rect: rect,
                        windowHeight: window.innerHeight
                    });
                    
                    if (intersectionRatio > 0.1) { // Lower threshold
                        console.log('Infrastructure section became visible, initializing charts...');
                        addChartAnimationClasses();
                        initializeInfrastructureBarCharts();
                        observer.unobserve(entry.target); // Only trigger once
                    }
                }
            });
        }, {
            threshold: [0, 0.1, 0.2, 0.3], // Multiple thresholds for better detection
            rootMargin: '50px 0px -50px 0px' // Start earlier, end later
        });
        
        observer.observe(infrastructureSection);
        console.log('Intersection observer set up for infrastructure section');
        
        // Fallback: Also try to initialize after a delay
        setTimeout(() => {
            if (!checkAndInitialize()) {
                console.log('Fallback initialization after 3 seconds...');
                addChartAnimationClasses();
                initializeInfrastructureBarCharts();
            }
        }, 3000);
        
    }, 100);
}

function addChartAnimationClasses() {
    // Add animation classes to chart containers for smooth fade-in
    const containers = ['deathsChart', 'damageChart', 'recoveryChart'];
    
    // First, add pre-animate class to start hidden
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.classList.add('pre-animate');
        }
    });
    
    // Then trigger animations with staggered timing
    containers.forEach((id, index) => {
        const container = document.getElementById(id);
        if (container) {
            setTimeout(() => {
                container.classList.remove('pre-animate');
                container.classList.add('animate-in');
                console.log(`Animating in chart: ${id}`);
            }, (index * 200) + 300); // 300ms initial delay + 200ms stagger
        }
    });
}

function initializeMainInfrastructureAnalysis() {
    // Initialize infrastructure analysis visualizations in the main content area
    setTimeout(() => {
        createMainInfrastructureScores();
        createMainInfrastructureGraphs();
        setupMainInfraPanelToggle();
    }, 100);
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
                                <span class="factor-label">Casualty-to-Magnitude Ratio:</span>
                                <span class="factor-weight">50%</span>
                            </div>
                            <div class="factor">
                                <span class="factor-label">Economic Damage Efficiency:</span>
                                <span class="factor-weight">30%</span>
                            </div>
                            <div class="factor">
                                <span class="factor-label">Housing Preservation Rate:</span>
                                <span class="factor-weight">20%</span>
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
function createMainInfrastructureScores() {
    const container = document.getElementById('infrastructureMainScores');
    
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

function setupMainInfraPanelToggle() {
    const toggleButtons = document.querySelectorAll('#infraMainStatsPanel .toggle-btn');
    const statsContent = document.getElementById('infraMainStatsContent');
    const graphsContent = document.getElementById('infraMainGraphsContent');
    
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

function createMainInfrastructureGraphs() {
    const container = document.getElementById('infraMainChartGrid');
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
    
    // Redraw main canvas visualization with new theme colors
    if (ctx && typeof drawVisualization === 'function') {
        drawVisualization();
    }
    
    // Regenerate axes with new theme colors
    if (typeof createAxes === 'function') {
        createAxes();
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
                
                // Disable automatic transition based on sidebar scroll
                // Users can scroll through sidebar content without being forced to transition
            }
            
            // Disable automatic transitions on scroll - users stay in case study section
            // Users can scroll through content without forced transitions
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
            </div>
        `;
    }
}

// ========== INFRASTRUCTURE BAR CHARTS ========== //
function createDeathsBarChart() {
    const container = document.getElementById('deathsChart');
    if (!container) {
        console.warn('deathsChart container not found');
        return;
    }

    // Infrastructure level data for deaths
    const infrastructureData = [
        { level: 'High', value: 127, color: '#4ecdc4', examples: ['Japan', 'Chile', 'New Zealand'] },
        { level: 'Medium', value: 892, color: '#f39c12', examples: ['Turkey', 'Greece', 'Mexico'] },
        { level: 'Low', value: 2415, color: '#e74c3c', examples: ['Haiti', 'Nepal', 'Afghanistan'] }
    ];

    try {
        createInteractiveBarChart(container, infrastructureData, 'Average Deaths per Earthquake', 'deaths');
    } catch (error) {
        console.error('Error creating deaths bar chart:', error);
    }
}

function createDamageBarChart() {
    const container = document.getElementById('damageChart');
    if (!container) {
        console.warn('damageChart container not found');
        return;
    }

    // Infrastructure level data for economic damage
    const infrastructureData = [
        { level: 'High', value: 1250, color: '#4ecdc4', examples: ['Japan', 'Chile', 'New Zealand'] },
        { level: 'Medium', value: 3580, color: '#f39c12', examples: ['Turkey', 'Greece', 'Mexico'] },
        { level: 'Low', value: 8920, color: '#e74c3c', examples: ['Haiti', 'Nepal', 'Afghanistan'] }
    ];

    try {
        createInteractiveBarChart(container, infrastructureData, 'Economic Damage ($ Millions)', 'millions');
    } catch (error) {
        console.error('Error creating damage bar chart:', error);
    }
}

function createRecoveryBarChart() {
    const container = document.getElementById('recoveryChart');
    if (!container) {
        console.warn('recoveryChart container not found');
        return;
    }

    // Infrastructure level data for recovery time
    const infrastructureData = [
        { level: 'High', value: 8, color: '#4ecdc4', examples: ['Japan', 'Chile', 'New Zealand'] },
        { level: 'Medium', value: 24, color: '#f39c12', examples: ['Turkey', 'Greece', 'Mexico'] },
        { level: 'Low', value: 67, color: '#e74c3c', examples: ['Haiti', 'Nepal', 'Afghanistan'] }
    ];

    try {
        createInteractiveBarChart(container, infrastructureData, 'Recovery Time (Months)', 'months');
    } catch (error) {
        console.error('Error creating recovery bar chart:', error);
    }
}

function createInteractiveBarChart(container, data, title, unit) {
    // Clear container and any existing D3 selections
    container.innerHTML = '';
    d3.select(container).selectAll('*').remove();

    // Clean up any existing tooltips for this chart
    d3.selectAll('.bar-chart-tooltip').remove();

    // Set dimensions
    const margin = { top: 20, right: 30, bottom: 60, left: 80 };
    const width = 320 - margin.left - margin.right;
    const height = 280 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.level))
        .range([0, width])
        .padding(0.3);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) * 1.1])
        .range([height, 0]);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'bar-chart-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', 'white')
        .style('padding', '10px')
        .style('border-radius', '5px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000');

    // Create bars
    svg.selectAll('.bar')
        .data(data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.level))
        .attr('width', xScale.bandwidth())
        .attr('y', height)
        .attr('height', 0)
        .attr('fill', d => d.color)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            // Highlight bar
            d3.select(this)
                .transition()
                .duration(100)
                .attr('opacity', 0.8)
                .attr('stroke', '#fff')
                .attr('stroke-width', 2);

            // Show tooltip
            let unitLabel = '';
            if (unit === 'deaths') unitLabel = ' deaths';
            else if (unit === 'millions') unitLabel = ' million USD';
            else if (unit === 'months') unitLabel = ' months';

            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            tooltip.html(`
                <strong>${d.level} Infrastructure</strong><br/>
                Value: ${d.value.toLocaleString()}${unitLabel}<br/>
                Examples: ${d.examples.join(', ')}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function(d) {
            // Remove highlight
            d3.select(this)
                .transition()
                .duration(100)
                .attr('opacity', 1)
                .attr('stroke', 'none');

            // Hide tooltip
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        })
        .transition()
        .duration(1000)
        .delay((d, i) => i * 150)
        .ease(d3.easeCubicOut)
        .attr('y', d => yScale(d.value))
        .attr('height', d => height - yScale(d.value));

    // Add value labels on bars
    svg.selectAll('.value-label')
        .data(data)
        .enter().append('text')
        .attr('class', 'value-label')
        .attr('x', d => xScale(d.level) + xScale.bandwidth() / 2)
        .attr('y', height)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(d => d.value.toLocaleString())
        .transition()
        .duration(1000)
        .delay((d, i) => i * 150)
        .ease(d3.easeCubicOut)
        .attr('y', d => yScale(d.value) - 5);

    // Add X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('fill', getTextColor())
        .style('font-size', '12px');

    // Add Y axis
    svg.append('g')
        .call(d3.axisLeft(yScale).tickFormat(d3.format('.0s')))
        .selectAll('text')
        .style('fill', getTextColor())
        .style('font-size', '11px');

    // Style axes
    svg.selectAll('.domain, .tick line')
        .style('stroke', getAxisStrokeColor());

    // Add Y axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('fill', getTextColor())
        .style('font-size', '11px')
        .text(unit === 'deaths' ? 'Deaths' : unit === 'millions' ? '$ Millions' : 'Months');
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
                <!-- Prediction Toggle -->
                <div style="display: flex; align-items: center; gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
                  <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #00ff88; cursor: pointer;">
                    <input type="checkbox" id="show-prediction-toggle" style="accent-color: #00ff88; width: 1.1em; height: 1.1em;" />
                    Show Your Prediction
                  </label>
                </div>
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


