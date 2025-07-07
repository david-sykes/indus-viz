// Main JavaScript code
document.addEventListener('DOMContentLoaded', function() {
    // Canvas setup
    const canvas = document.getElementById('water-system-canvas');
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;
    
    // UI elements
    const dateSlider = document.getElementById('date-slider');
    const dateDisplay = document.getElementById('date-display');
    
    // Data storage
    let waterSystemData = {};
    let sortedDates = [];
    let currentDateIndex = 0;
    
    // Load all data files
    loadAllData().then(data => {
        waterSystemData = data.data;
        sortedDates = data.dates;
        console.log('Data loaded successfully:', sortedDates);
        
        // Setup date slider
        if (sortedDates.length > 0) {
            setupDateSlider();
            currentDateIndex = 0;
            updateVisualization(sortedDates[currentDateIndex]);
        }
    }).catch(error => {
        console.error('Error loading data:', error);
    });
    
    // Setup the date slider with the available dates
    function setupDateSlider() {
        // Configure slider based on number of dates
        dateSlider.min = 0;
        dateSlider.max = sortedDates.length - 1;
        dateSlider.value = 0;
        dateSlider.step = 1;
        
        // Update date display
        updateDateDisplay(sortedDates[0]);
        
        // Add event listener for slider changes
        dateSlider.addEventListener('input', function() {
            currentDateIndex = parseInt(this.value);
            const selectedDate = sortedDates[currentDateIndex];
            updateDateDisplay(selectedDate);
            updateVisualization(selectedDate);
        });
    }
    
    // Update the date display
    function updateDateDisplay(date) {
        dateDisplay.textContent = formatDate(date);
    }
    
    // Function to load all data files from public/data
    async function loadAllData() {
        // First load the file list
        try {
            const fileListResponse = await fetch('data/file_list.json');
            if (!fileListResponse.ok) {
                throw new Error(`Failed to load file list: ${fileListResponse.status}`);
            }
            const fileList = await fileListResponse.json();
            const dataFiles = fileList.files;
            const data = {};
            
            // Load each file
            const loadPromises = dataFiles.map(async filename => {
            try {
                const response = await fetch(`data/${filename}`);
                if (!response.ok) {
                    throw new Error(`Failed to load ${filename}: ${response.status}`);
                }
                const jsonData = await response.json();
                
                // Extract date from filename (remove .json extension)
                const date = filename.replace('.json', '');
                data[date] = jsonData;
                return date;
            } catch (error) {
                console.error(`Error loading ${filename}:`, error);
                return null;
            }
        });
        
            // Wait for all files to load
            const dates = (await Promise.all(loadPromises)).filter(date => date !== null);
            
            // Sort dates chronologically
            const sortedDates = dates.sort((a, b) => new Date(a) - new Date(b));
            
            return { data, dates: sortedDates };
        } catch (error) {
            console.error('Error loading file list:', error);
            return { data: {}, dates: [] };
        }
    }
    
    // Function to update visualization based on selected date
    function updateVisualization(date) {
        const data = waterSystemData[date];
        if (!data) {
            console.error(`No data available for date: ${date}`);
            return;
        }
        
        // Update the visualization with the data for this date
        console.log(`Updating visualization with data from ${date}:`, data);
        drawCanvas(date, data);
    }
    
    // Set canvas dimensions to match its display size
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Redraw with current date if available
        if (sortedDates.length > 0) {
            drawCanvas(sortedDates[currentDateIndex]);
        } else {
            drawCanvas();
        }
    }
    
    // Call once to set initial size
    resizeCanvas();
    
    // Resize canvas when window size changes
    window.addEventListener('resize', resizeCanvas);
    
    // Draw the canvas with visualization elements
    function drawCanvas(date, data) {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        ctx.fillStyle = '#e6f2ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add title at the top
        ctx.fillStyle = '#0066cc';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Indus Water System', canvas.width/2, 30);
        
        // Add date display if available
        if (date) {
            ctx.font = '16px Arial';
            ctx.fillText(formatDate(date), canvas.width/2, 60);
        }
        
        // If we have data, use it to draw the reservoirs
        if (data && data.dams) {
            // Find reservoir data
            const mangla = data.dams.find(dam => dam.name === 'MANGLA');
            const tarbela = data.dams.find(dam => dam.name === 'TARBELA');
            const chashma = data.dams.find(dam => dam.name === 'CHASHMA');
            
            // Draw Mangla reservoir
            if (mangla) {
                drawReservoir(
                    canvas.width / 2,
                    canvas.height / 2,
                    180,
                    180,
                    mangla.level_min_ft,
                    mangla.level_max_ft,
                    mangla.level_today_ft,
                    'Mangla Dam'
                );
            } else {
                drawReservoir(canvas.width / 2, canvas.height / 2, 180, 180, 1050, 1242, 1114, 'Mangla Dam');
            }
            
            // Draw Tarbela reservoir
            if (tarbela) {
                drawReservoir(
                    canvas.width / 4,
                    canvas.height / 3,
                    150,
                    150,
                    tarbela.level_min_ft,
                    tarbela.level_max_ft,
                    tarbela.level_today_ft,
                    'Tarbela Dam'
                );
            } else {
                drawReservoir(canvas.width / 4, canvas.height / 3, 150, 150, 1380, 1550, 1450, 'Tarbela Dam');
            }
            
            // Draw Chashma reservoir
            if (chashma) {
                drawReservoir(
                    3 * canvas.width / 4,
                    2 * canvas.height / 3,
                    120,
                    120,
                    chashma.level_min_ft,
                    chashma.level_max_ft,
                    chashma.level_today_ft,
                    'Chashma Barrage'
                );
            } else {
                drawReservoir(3 * canvas.width / 4, 2 * canvas.height / 3, 120, 120, 638.15, 649, 642.5, 'Chashma Barrage');
            }
        } else {
            // Fallback to dummy values if no data
            drawReservoir(canvas.width / 2, canvas.height / 2, 180, 180, 1050, 1242, 1114, 'Mangla Dam');
            drawReservoir(canvas.width / 4, canvas.height / 3, 150, 150, 1380, 1550, 1450, 'Tarbela Dam');
            drawReservoir(3 * canvas.width / 4, 2 * canvas.height / 3, 120, 120, 638.15, 649, 642.5, 'Chashma Barrage');
        }
    }
    
    // Format date for display
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    /**
     * Draw a reservoir with animated wavy water
     * @param {number} x - Center x position
     * @param {number} y - Center y position
     * @param {number} width - Width of reservoir
     * @param {number} height - Height of reservoir
     * @param {number} minLevel - Minimum water level
     * @param {number} maxLevel - Maximum water level
     * @param {number} currentLevel - Current water level
     * @param {string} name - Name of the reservoir
     */
    function drawReservoir(x, y, width, height, minLevel, maxLevel, currentLevel, name) {
        // Calculate the relative water level (0 to 1)
        const levelPercentage = (currentLevel - minLevel) / (maxLevel - minLevel);
        
        // Use the smaller dimension to ensure a perfect circle
        const diameter = Math.min(width, height);
        const radius = diameter / 2;
        
        // Draw reservoir container (circle)
        ctx.fillStyle = '#d4d4d4'; // Light gray for container
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        
        // Draw circle for reservoir
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw water in reservoir with wavy top
        drawCircularWater(x, y, radius, levelPercentage);
        
        // Draw reservoir name
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(name, x, y - radius - 15);
        
        // Draw percentage
        ctx.textAlign = 'center';
        ctx.fillStyle = '#0066cc';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`${Math.round(levelPercentage * 100)}%`, x, y);
    }
    
    // Removed drawRoundedRect function as we're using circles now
    
    /**
     * Draw water with wavy top in the circular reservoir
     */
    function drawCircularWater(x, y, radius, fillPercentage) {
        ctx.fillStyle = '#4d94ff'; // Water blue color
        
        // Calculate the water level position
        // For a circle, we need to convert percentage to a y-position
        // 0% = bottom of circle (y + radius)
        // 100% = top of circle (y - radius)
        
        // Calculate the y position based on percentage (0 to 1)
        // This maps the percentage to a position in the circle
        const waterLevel = y + radius - (2 * radius * fillPercentage);
        
        // Only proceed if water level is within the circle
        if (waterLevel >= y + radius) return; // Empty
        if (waterLevel <= y - radius) {
            // Full circle
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            return;
        }
        
        // Calculate chord width at the water level
        const chordWidth = 2 * Math.sqrt(radius * radius - Math.pow(waterLevel - y, 2));
        const halfChordWidth = chordWidth / 2;
        
        ctx.beginPath();
        
        // Draw the bottom part of the circle (the filled part)
        const startAngle = Math.asin((waterLevel - y) / radius);
        const endAngle = Math.PI - Math.asin((waterLevel - y) / radius);        
        ctx.arc(x, y, radius, startAngle, endAngle);
        
        // Wavy water surface (left to right)
        const waveHeight = 4;
        const waveCount = 6;
        const waveWidth = chordWidth / waveCount;
        
        // Starting point for waves (leftmost point of the chord)
        const startX = x - halfChordWidth;
        
        // Create wavy water surface
        ctx.lineTo(startX, waterLevel);
        
        for (let i = 0; i < waveCount; i++) {
            const waveX = startX + (i * waveWidth);
            const nextWaveX = startX + ((i + 1) * waveWidth);
            
            // Calculate wave offset based on time for animation
            const offset = Math.sin(time + i) * waveHeight;
            
            // Draw a wave segment
            ctx.quadraticCurveTo(
                waveX + waveWidth/2, waterLevel + offset,
                nextWaveX, waterLevel
            );
        }
        
        ctx.closePath();
        ctx.fill();
    }
    
    // Animation loop
    function animate() {
        time += 0.05;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Use the current date's data for animation frames
        if (sortedDates.length > 0) {
            const currentDate = sortedDates[currentDateIndex];
            drawCanvas(currentDate, waterSystemData[currentDate]);
        } else {
            drawCanvas();
        }
        
        animationFrameId = requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
});
