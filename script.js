// Global variables
let earthquakeData = [];
let filteredData = [];
let currentMetric = 'deaths';
let isPlaying = false;
let playInterval;
let timelineChart;
let worldMapChart;
let currentYear = 2024;
let isInitialized = false;

// Initialize the application with proper timing
document.addEventListener('DOMContentLoaded', function() {
    // Wait for fonts and styles to load
    if (document.fonts) {
        document.fonts.ready.then(() => {
            initializeApp();
        });
    } else {
        // Fallback for browsers without font loading API
        setTimeout(initializeApp, 100);
    }
});

// Main initialization function
function initializeApp() {
    console.log('Initializing earthquake visualization...');
    loadData();
    setupEventListeners();
}

// Start the journey - transition from hero to main content
function startJourney() {
    document.getElementById('hero').style.transform = 'translateY(-100vh)';
    document.getElementById('hero').style.transition = 'transform 1s ease-in-out';
    
    setTimeout(() => {
        document.getElementById('hero').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        document.getElementById('mainContent').style.opacity = '0';
        document.getElementById('mainContent').style.transform = 'translateY(50px)';
        
        // Force a reflow to ensure the element is visible
        document.getElementById('mainContent').offsetHeight;
        
        setTimeout(() => {
            document.getElementById('mainContent').style.transition = 'all 1s ease-out';
            document.getElementById('mainContent').style.opacity = '1';
            document.getElementById('mainContent').style.transform = 'translateY(0)';
            
            // Initialize visualizations after content is visible
            setTimeout(() => {
                if (!isInitialized) {
                    initializeVisualizations();
                }
            }, 500);
        }, 100);
    }, 1000);
}

// Separate function to initialize visualizations
function initializeVisualizations() {
    console.log('Initializing visualizations...');
    
    // Ensure containers exist and are visible
    const timelineContainer = document.getElementById('timeline');
    const mapContainer = document.getElementById('worldMap');
    
    if (!timelineContainer || !mapContainer) {
        console.error('Visualization containers not found');
        return;
    }
    
    // Wait for containers to have dimensions
    const checkDimensions = () => {
        const timelineRect = timelineContainer.getBoundingClientRect();
        const mapRect = mapContainer.getBoundingClientRect();
        
        if (timelineRect.width > 0 && mapRect.width > 0) {
            initializeTimeline();
            initializeWorldMap();
            updateStats();
            isInitialized = true;
            console.log('Visualizations initialized successfully');
        } else {
            console.log('Waiting for container dimensions...');
            setTimeout(checkDimensions, 100);
        }
    };
    
    checkDimensions();
}

// Load and process earthquake data
async function loadData() {
    try {
        console.log('Loading earthquake data...');
        const data = await d3.csv('earthquakes.csv');
        
        earthquakeData = data
            .filter(d => d.Year && d.Latitude && d.Longitude)
            .map(d => ({
                year: +d.Year,
                month: +d.Mo || 1,
                day: +d.Dy || 1,
                latitude: +d.Latitude,
                longitude: +d.Longitude,
                magnitude: +d.Mag || 0,
                deaths: +d['Total Deaths'] || 0,
                damage: +d['Total Damage ($Mil)'] || 0,
                location: d['Location Name'] || 'Unknown',
                focalDepth: +d['Focal Depth (km)'] || 0
            }))
            .filter(d => !isNaN(d.year) && !isNaN(d.latitude) && !isNaN(d.longitude))
            .sort((a, b) => a.year - b.year);

        console.log(`Loaded ${earthquakeData.length} earthquake records`);
        
        // Set initial filtered data
        filteredData = earthquakeData;
        
    } catch (error) {
        console.error('Error loading data:', error);
        // Create some sample data for demonstration
        createSampleData();
    }
}

// Create sample data if CSV fails to load
function createSampleData() {
    console.log('Creating sample data...');
    earthquakeData = [
        {year: 1556, latitude: 34.5, longitude: 109.7, magnitude: 8.0, deaths: 830000, damage: 0, location: "Shaanxi, China", focalDepth: 0},
        {year: 1755, latitude: 38.7, longitude: -9.1, magnitude: 7.7, deaths: 30000, damage: 0, location: "Lisbon, Portugal", focalDepth: 0},
        {year: 1906, latitude: 37.8, longitude: -122.4, magnitude: 7.9, deaths: 3000, damage: 400, location: "San Francisco, USA", focalDepth: 0},
        {year: 1923, latitude: 35.7, longitude: 139.7, magnitude: 7.9, deaths: 105000, damage: 1000, location: "Tokyo, Japan", focalDepth: 0},
        {year: 1960, latitude: -38.2, longitude: -73.0, magnitude: 9.5, deaths: 2000, damage: 550, location: "Chile", focalDepth: 0},
        {year: 2004, latitude: 3.3, longitude: 95.9, magnitude: 9.1, deaths: 230000, damage: 15000, location: "Indian Ocean", focalDepth: 30},
        {year: 2010, latitude: 18.5, longitude: -72.3, magnitude: 7.0, deaths: 316000, damage: 8000, location: "Haiti", focalDepth: 13},
        {year: 2011, latitude: 38.3, longitude: 142.4, magnitude: 9.1, deaths: 18000, damage: 235000, location: "Tōhoku, Japan", focalDepth: 29}
    ];
    
    filteredData = earthquakeData;
}

// Setup event listeners
function setupEventListeners() {
    // Time slider
    const timeSlider = document.getElementById('timeSlider');
    if (timeSlider) {
        timeSlider.addEventListener('input', function() {
            const value = +this.value;
            const minYear = Math.min(...earthquakeData.map(d => d.year));
            const maxYear = Math.max(...earthquakeData.map(d => d.year));
            currentYear = minYear + (maxYear - minYear) * (value / 100);
            
            document.getElementById('timeDisplay').textContent = Math.round(currentYear);
            filterDataByYear(currentYear);
            updateVisualizations();
        });
    }

    // Play button
    const playButton = document.getElementById('playButton');
    if (playButton) {
        playButton.addEventListener('click', togglePlay);
    }

    // Metric buttons
    document.querySelectorAll('.metric-button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.metric-button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentMetric = this.dataset.metric;
            updateVisualizations();
        });
    });
}

// Filter data by year
function filterDataByYear(year) {
    filteredData = earthquakeData.filter(d => d.year <= year);
    updateStats();
}

// Toggle play/pause
function togglePlay() {
    const button = document.getElementById('playButton');
    const slider = document.getElementById('timeSlider');
    
    if (isPlaying) {
        clearInterval(playInterval);
        button.textContent = '▶ Play';
        isPlaying = false;
    } else {
        button.textContent = '⏸ Pause';
        isPlaying = true;
        
        playInterval = setInterval(() => {
            let value = +slider.value;
            value += 1;
            
            if (value > 100) {
                value = 0;
            }
            
            slider.value = value;
            slider.dispatchEvent(new Event('input'));
        }, 200);
    }
}

// Initialize timeline visualization
function initializeTimeline() {
    const container = d3.select('#timeline');
    if (container.empty()) {
        console.error('Timeline container not found');
        return;
    }
    
    container.selectAll('*').remove();
    
    const containerNode = container.node();
    const containerRect = containerNode.getBoundingClientRect();
    
    if (containerRect.width === 0) {
        console.error('Timeline container has no width');
        return;
    }
    
    const margin = {top: 20, right: 30, bottom: 40, left: 80};
    const width = containerRect.width - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(earthquakeData, d => d.year))
        .range([0, width]);

    // Dynamic y-scale based on current metric
    let yScale, yDomain;
    if (currentMetric === 'deaths') {
        yDomain = [0, d3.max(earthquakeData, d => d.deaths) || 1];
        yScale = d3.scaleLinear().domain(yDomain).range([height, 0]);
    } else if (currentMetric === 'magnitude') {
        yDomain = [0, d3.max(earthquakeData, d => d.magnitude) || 10];
        yScale = d3.scaleLinear().domain(yDomain).range([height, 0]);
    } else { // damage
        yDomain = [0, d3.max(earthquakeData, d => d.damage) || 1];
        yScale = d3.scaleLinear().domain(yDomain).range([height, 0]);
    }

    // Axes
    const xAxis = g.append('g')
        .attr('class', 'timeline-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')));

    const yAxis = g.append('g')
        .attr('class', 'timeline-axis')
        .call(d3.axisLeft(yScale));

    // Dynamic axis labels
    const yAxisLabel = g.append('text')
        .attr('class', 'timeline-axis y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle');

    // Set initial y-axis label
    updateYAxisLabel(yAxisLabel);

    g.append('text')
        .attr('class', 'timeline-axis')
        .attr('transform', `translate(${width / 2}, ${height + margin.bottom})`)
        .style('text-anchor', 'middle')
        .text('Year');

    timelineChart = { svg, g, xScale, yScale, yAxis, yAxisLabel, width, height, margin };
    
    // Initial data update
    setTimeout(() => {
        updateTimelineData();
    }, 100);
}

// Helper function to update y-axis label
function updateYAxisLabel(labelElement) {
    let labelText;
    if (currentMetric === 'deaths') {
        labelText = 'Total Deaths';
    } else if (currentMetric === 'magnitude') {
        labelText = 'Magnitude';
    } else {
        labelText = 'Economic Damage ($Millions)';
    }
    
    labelElement.text(labelText);
}

// Update timeline with current data
function updateTimelineData() {
    if (!timelineChart) return;

    const { g, xScale, yAxis, yAxisLabel, width, height } = timelineChart;
    
    // Update y-scale based on current metric
    let yScale, yDomain;
    if (currentMetric === 'deaths') {
        yDomain = [0, d3.max(filteredData, d => d.deaths) || 1];
        yScale = d3.scaleLinear().domain(yDomain).range([height, 0]);
    } else if (currentMetric === 'magnitude') {
        yDomain = [0, d3.max(filteredData, d => d.magnitude) || 10];
        yScale = d3.scaleLinear().domain(yDomain).range([height, 0]);
    } else { // damage
        yDomain = [0, d3.max(filteredData, d => d.damage) || 1];
        yScale = d3.scaleLinear().domain(yDomain).range([height, 0]);
    }

    // Update the stored yScale
    timelineChart.yScale = yScale;

    // Update y-axis with transition
    yAxis.transition()
        .duration(500)
        .call(d3.axisLeft(yScale));

    // Update y-axis label
    updateYAxisLabel(yAxisLabel);
    
    // Color scale based on current metric
    let colorScale;
    if (currentMetric === 'deaths') {
        colorScale = d3.scaleSequential(d3.interpolateReds)
            .domain([0, d3.max(filteredData, d => d.deaths) || 1]);
    } else if (currentMetric === 'magnitude') {
        colorScale = d3.scaleSequential(d3.interpolateOranges)
            .domain([0, d3.max(filteredData, d => d.magnitude) || 1]);
    } else {
        colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, d3.max(filteredData, d => d.damage) || 1]);
    }

    // Bind data
    const circles = g.selectAll('.timeline-circle')
        .data(filteredData, d => `${d.year}-${d.latitude}-${d.longitude}`);

    // Enter
    circles.enter()
        .append('circle')
        .attr('class', 'timeline-circle')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => {
            if (currentMetric === 'deaths') return yScale(d.deaths);
            if (currentMetric === 'magnitude') return yScale(d.magnitude);
            return yScale(d.damage);
        })
        .attr('r', 0)
        .style('fill', d => {
            if (currentMetric === 'deaths') return colorScale(d.deaths);
            if (currentMetric === 'magnitude') return colorScale(d.magnitude);
            return colorScale(d.damage);
        })
        .style('opacity', 0.7)
        .on('mouseover', showTooltip)
        .on('mouseout', hideTooltip)
        .transition()
        .duration(500)
        .attr('r', d => {
            if (currentMetric === 'deaths') return Math.max(3, Math.sqrt(d.deaths / 1000) * 3);
            if (currentMetric === 'magnitude') return Math.max(3, Math.sqrt(d.magnitude) * 2);
            return Math.max(3, Math.sqrt(d.damage / 100) * 3);
        });

    // Update
    circles.transition()
        .duration(500)
        .attr('cy', d => {
            if (currentMetric === 'deaths') return yScale(d.deaths);
            if (currentMetric === 'magnitude') return yScale(d.magnitude);
            return yScale(d.damage);
        })
        .style('fill', d => {
            if (currentMetric === 'deaths') return colorScale(d.deaths);
            if (currentMetric === 'magnitude') return colorScale(d.magnitude);
            return colorScale(d.damage);
        })
        .attr('r', d => {
            if (currentMetric === 'deaths') return Math.max(3, Math.sqrt(d.deaths / 1000) * 3);
            if (currentMetric === 'magnitude') return Math.max(3, Math.sqrt(d.magnitude) * 2);
            return Math.max(3, Math.sqrt(d.damage / 100) * 3);
        });

    // Exit
    circles.exit()
        .transition()
        .duration(300)
        .attr('r', 0)
        .remove();
}

// Initialize world map
async function initializeWorldMap() {
    const container = d3.select('#worldMap');
    if (container.empty()) {
        console.error('World map container not found');
        return;
    }
    
    container.selectAll('*').remove();
    
    const containerNode = container.node();
    const containerRect = containerNode.getBoundingClientRect();
    
    if (containerRect.width === 0) {
        console.error('World map container has no width');
        return;
    }
    
    const width = containerRect.width;
    const height = 500;

    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);

    // Map projection
    const projection = d3.geoNaturalEarth1()
        .scale(width / 6.5)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    try {
        // Load world map data
        const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        const countries = topojson.feature(world, world.objects.countries);

        // Draw countries
        svg.selectAll('.country')
            .data(countries.features)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', path);

    } catch (error) {
        console.log('Could not load world map, using simple background');
        svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', '#2a2a3e');
    }

    worldMapChart = { svg, projection, width, height };
    
    // Initial data update
    setTimeout(() => {
        updateWorldMapData();
    }, 100);
}

// Update world map with earthquake data
function updateWorldMapData() {
    if (!worldMapChart) return;

    const { svg, projection } = worldMapChart;
    
    // Color scale based on current metric
    let colorScale, sizeScale;
    if (currentMetric === 'deaths') {
        colorScale = d3.scaleSequential(d3.interpolateReds)
            .domain([1, d3.max(filteredData, d => d.deaths) || 1]);
        sizeScale = d3.scaleSqrt()
            .domain([0, d3.max(filteredData, d => d.deaths) || 1])
            .range([2, 20]);
    } else if (currentMetric === 'magnitude') {
        colorScale = d3.scaleSequential(d3.interpolateOranges)
            .domain([0, d3.max(filteredData, d => d.magnitude) || 1]);
        sizeScale = d3.scaleSqrt()
            .domain([0, d3.max(filteredData, d => d.magnitude) || 1])
            .range([2, 15]);
    } else {
        colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([1, d3.max(filteredData, d => d.damage) || 1]);
        sizeScale = d3.scaleSqrt()
            .domain([0, d3.max(filteredData, d => d.damage) || 1])
            .range([2, 18]);
    }

    // Filter data for significant earthquakes only
    const significantEarthquakes = filteredData.filter(d => {
        if (currentMetric === 'deaths') return d.deaths > 100;
        if (currentMetric === 'magnitude') return d.magnitude > 5.5;
        return d.damage > 10;
    });

    // Bind data
    const circles = svg.selectAll('.earthquake-circle')
        .data(significantEarthquakes, d => `${d.year}-${d.latitude}-${d.longitude}`);

    // Enter
    circles.enter()
        .append('circle')
        .attr('class', 'earthquake-circle')
        .attr('cx', d => projection([d.longitude, d.latitude])?.[0] || -1000)
        .attr('cy', d => projection([d.longitude, d.latitude])?.[1] || -1000)
        .attr('r', 0)
        .style('fill', d => {
            if (currentMetric === 'deaths' && d.deaths > 0) return colorScale(d.deaths);
            if (currentMetric === 'magnitude') return colorScale(d.magnitude);
            if (currentMetric === 'damage' && d.damage > 0) return colorScale(d.damage);
            return '#ff4500';
        })
        .on('mouseover', showTooltip)
        .on('mouseout', hideTooltip)
        .on('click', function(event, d) {
            // Add impact rings on click
            showImpactRings(d);
        })
        .transition()
        .duration(800)
        .attr('r', d => {
            if (currentMetric === 'deaths') return sizeScale(d.deaths);
            if (currentMetric === 'magnitude') return sizeScale(d.magnitude);
            return sizeScale(d.damage);
        });

    // Update
    circles.transition()
        .duration(500)
        .style('fill', d => {
            if (currentMetric === 'deaths' && d.deaths > 0) return colorScale(d.deaths);
            if (currentMetric === 'magnitude') return colorScale(d.magnitude);
            if (currentMetric === 'damage' && d.damage > 0) return colorScale(d.damage);
            return '#ff4500';
        })
        .attr('r', d => {
            if (currentMetric === 'deaths') return sizeScale(d.deaths);
            if (currentMetric === 'magnitude') return sizeScale(d.magnitude);
            return sizeScale(d.damage);
        });

    // Exit
    circles.exit()
        .transition()
        .duration(500)
        .attr('r', 0)
        .remove();
}

// Show impact rings for clicked earthquake
function showImpactRings(earthquake) {
    const { svg, projection } = worldMapChart;
    const [x, y] = projection([earthquake.longitude, earthquake.latitude]) || [0, 0];
    
    // Remove existing rings
    svg.selectAll('.impact-ring').remove();
    
    // Add expanding rings
    for (let i = 1; i <= 3; i++) {
        svg.append('circle')
            .attr('class', 'impact-ring')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 0)
            .transition()
            .duration(2000)
            .delay(i * 200)
            .attr('r', i * 50)
            .style('opacity', 0.8 - i * 0.2)
            .on('end', function() {
                d3.select(this).remove();
            });
    }
}

// Show tooltip
function showTooltip(event, d) {
    const tooltip = d3.select('#tooltip');
    
    let content = `
        <strong>${d.location}</strong><br>
        Year: ${d.year}<br>
        Magnitude: ${d.magnitude || 'Unknown'}<br>
        Deaths: ${d.deaths.toLocaleString()}<br>
        Damage: $${d.damage.toLocaleString()}M
    `;
    
    tooltip.html(content)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .classed('hidden', false);
}

// Hide tooltip
function hideTooltip() {
    d3.select('#tooltip').classed('hidden', true);
}

// Update all visualizations
function updateVisualizations() {
    if (isInitialized) {
        updateTimelineData();
        updateWorldMapData();
    }
}

// Update statistics panel
function updateStats() {
    const totalEarthquakes = filteredData.length;
    const totalDeaths = d3.sum(filteredData, d => d.deaths);
    const averageMagnitude = d3.mean(filteredData, d => d.magnitude) || 0;
    
    // Find deadliest year
    const deathsByYear = d3.rollup(filteredData, v => d3.sum(v, d => d.deaths), d => d.year);
    const deadliestYear = deathsByYear.size > 0 ? 
        [...deathsByYear.entries()].reduce((a, b) => a[1] > b[1] ? a : b)[0] : '-';

    // Animate number updates
    animateNumber('totalEarthquakes', totalEarthquakes);
    animateNumber('totalDeaths', totalDeaths);
    animateNumber('averageMagnitude', averageMagnitude, 1);
    
    const deadliestYearElement = document.getElementById('deadliestYear');
    if (deadliestYearElement) {
        deadliestYearElement.textContent = deadliestYear;
    }
}

// Animate number changes
function animateNumber(elementId, targetValue, decimals = 0) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = parseFloat(element.textContent.replace(/,/g, '')) || 0;
    const duration = 1000;
    const startTime = performance.now();

    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = startValue + (targetValue - startValue) * progress;
        const formattedValue = decimals > 0 ? 
            currentValue.toFixed(decimals) : 
            Math.round(currentValue).toLocaleString();
        
        element.textContent = formattedValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Handle window resize
window.addEventListener('resize', function() {
    if (isInitialized) {
        setTimeout(() => {
            initializeTimeline();
            initializeWorldMap();
        }, 250);
    }
}); 