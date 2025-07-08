// Main JavaScript code



document.addEventListener('DOMContentLoaded', function() {

    // Define classes
    class Reservoir {
        constructor(name, level_min_ft, level_max_ft, current_level_ft, x, y, radius) {
            this.name = name;
            this.level_min_ft = level_min_ft;
            this.level_max_ft = level_max_ft;
            this.current_level_ft = current_level_ft;
            this.x = x;
            this.y = y;
            this.radius = radius;
        }
        
        /**
         * Draw this reservoir with animated wavy water
         */
        draw() {
            // Calculate the relative water level (0 to 1)
            const levelPercentage = (this.current_level_ft - this.level_min_ft) / (this.level_max_ft - this.level_min_ft);
            
            // Draw reservoir container (circle)
            ctx.fillStyle = '#d4d4d4'; // Light gray for container
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            
            // Draw circle for reservoir
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw water in reservoir with wavy top
            this.drawCircularWater(levelPercentage);
            
            // Draw reservoir name
            ctx.fillStyle = '#000';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, this.x, this.y - this.radius - 15);
            
            // Draw percentage
            ctx.textAlign = 'center';
            ctx.fillStyle = '#0066cc';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(`${Math.round(levelPercentage * 100)}%`, this.x, this.y);
        }
        
        /**
         * Draw water with wavy top in the circular reservoir
         * @param {number} fillPercentage - Water fill percentage (0-1)
         */
        drawCircularWater(fillPercentage) {
            ctx.fillStyle = '#4d94ff'; // Water blue color
            
            // Calculate the water level position
            // For a circle, we need to convert percentage to a y-position
            // 0% = bottom of circle (y + radius)
            // 100% = top of circle (y - radius)
            
            // Calculate the y position based on percentage (0 to 1)
            // This maps the percentage to a position in the circle
            const waterLevel = this.y + this.radius - (2 * this.radius * fillPercentage);
            
            // Only proceed if water level is within the circle
            if (waterLevel >= this.y + this.radius) return; // Empty
            if (waterLevel <= this.y - this.radius) {
                // Full circle
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                return;
            }
            
            // Calculate chord width at the water level
            const chordWidth = 2 * Math.sqrt(this.radius * this.radius - Math.pow(waterLevel - this.y, 2));
            const halfChordWidth = chordWidth / 2;
            
            ctx.beginPath();
            
            // Draw the bottom part of the circle (the filled part)
            const startAngle = Math.asin((waterLevel - this.y) / this.radius);
            const endAngle = Math.PI - Math.asin((waterLevel - this.y) / this.radius);        
            ctx.arc(this.x, this.y, this.radius, startAngle, endAngle);
            
            // Wavy water surface (left to right)
            const waveHeight = 4;
            const waveCount = 6;
            const waveWidth = chordWidth / waveCount;
            
            // Starting point for waves (leftmost point of the chord)
            const startX = this.x - halfChordWidth;
            
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
    }

    class Node {
        constructor(name, x, y, radius = 20, hasLabel = false) {
            this.name = name;
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.hasLabel = hasLabel;
        }

        // Draw as grey cicle ()
        draw() {
            // Draw node (circle)
            ctx.fillStyle = '#d4d4d4'; // Light gray for container
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            
            // Draw node outline
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw node label
            if (this.hasLabel) {
                ctx.fillStyle = '#000';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(this.name, this.x, this.y + this.radius + 20);
            }
        }
    }

    class Flow {
        constructor(
            name,
            sourceNode,
            destinationNode,
            flowRate,
            hasLabel = false
        ) {
            this.name = name;
            this.sourceNode = sourceNode;
            this.destinationNode = destinationNode;
            this.flowRate = flowRate;
            this.hasLabel = hasLabel;
        }

        draw() {
            // Draw flow as a line with particles - linear scaling based on flow rate
            // Scale factor converts flow rate to pixels (adjust FLOW_SCALE_FACTOR as needed)
            const FLOW_SCALE_FACTOR = 0.001; // pixels per cusec
            const flowWidth = this.flowRate * FLOW_SCALE_FACTOR;
            
            // Calculate start and end points of the flow (from center to center)
            const startX = this.sourceNode.x;
            const startY = this.sourceNode.y;
            const endX = this.destinationNode.x;
            const endY = this.destinationNode.y;
            
            // Calculate angle between nodes for particle animation
            const dx = endX - startX;
            const dy = endY - startY;
            const angle = Math.atan2(dy, dx);
            
            // Draw the flow channel
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = '#4d94ff80'; // Semi-transparent blue
            ctx.lineWidth = flowWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            // Draw animated flow particles
            this.drawFlowParticles(startX, startY, endX, endY, flowWidth, angle);
            
            // Draw flow label if provided
            if (this.hasLabel) {
                const labelX = startX + (endX - startX) / 2;
                const labelY = startY + (endY - startY) / 2 - 15;
                
                ctx.fillStyle = '#0066cc';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${this.name}: ${this.flowRate} cusecs`, labelX, labelY);
            }
        }
        
        /**
         * Draw animated particles along a flow path
         * @param {number} startX - Start X coordinate
         * @param {number} startY - Start Y coordinate
         * @param {number} endX - End X coordinate
         * @param {number} endY - End Y coordinate
         * @param {number} width - Width of the flow
         * @param {number} angle - Angle of the flow
         */
        drawFlowParticles(startX, startY, endX, endY, width, angle) {
            // Calculate flow parameters
            const flowLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const normalizedFlowRate = this.flowRate / MAX_FLOW_SIZE;
            
            // Calculate number of particles based on flow rate and density
            const particleCount = Math.ceil(flowLength * FLOW_PARTICLE_DENSITY * normalizedFlowRate);
            
            // Calculate particle speed based on flow rate
            const particleSpeed = FLOW_SPEED * normalizedFlowRate;
            
            // Fixed particle size regardless of flow width
            const PARTICLE_SIZE = 3;
            
            // Draw particles
            for (let i = 0; i < particleCount; i++) {
                // Calculate position along the flow line (0 to 1)
                let position = ((time * particleSpeed) + (i / particleCount)) % 1;
                
                // Calculate particle position
                const x = startX + (endX - startX) * position;
                const y = startY + (endY - startY) * position;
                
                // Add some randomness to particle position perpendicular to flow
                const perpAngle = angle + Math.PI / 2;
                const offsetDistance = (Math.random() - 0.5) * width * 0.6;
                const offsetX = Math.cos(perpAngle) * offsetDistance;
                const offsetY = Math.sin(perpAngle) * offsetDistance;
                
                // Draw particle with fixed size
                ctx.beginPath();
                ctx.arc(x + offsetX, y + offsetY, PARTICLE_SIZE, 0, Math.PI * 2);
                ctx.fillStyle = '#4d94ff';
                ctx.fill();
                
                // Add highlight to some particles for visual interest
                if (Math.random() > 0.7) {
                    ctx.beginPath();
                    ctx.arc(x + offsetX, y + offsetY, PARTICLE_SIZE * 0.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#a5c7ff';
                    ctx.fill();
                }
            }
        }
    }
    // Layout positions
    const reservoirPositions = {
        mangla: { x: 300, y: 600, radius: 50 },
        tarbela: { x: 400, y: 400, radius: 50 },
        chashma: { x: 800, y: 400, radius: 30 },
        kabul: { x: 600, y: 400, radius: 5}
    };

    // Canvas setup
    const canvas = document.getElementById('water-system-canvas');
    const ctx = canvas.getContext('2d');
    let time = 0;
    
    // UI elements
    const dateSlider = document.getElementById('date-slider');
    const dateDisplay = document.getElementById('date-display');
    
    // Data storage
    let waterSystemData = {};
    let sortedDates = [];
    let currentDateIndex = 0;
    
    // Visualization constants
    const MAX_FLOW_SIZE = 100000; // Maximum flow in cusecs for scaling (used for particle count)
    const FLOW_SPEED = 2;        // Speed of flow animation
    const FLOW_PARTICLE_DENSITY = 0.7; // Density of particles in the flow
    
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
            const kabul = data.dams.find(dam => dam.name === 'KABUL');
                        
            // Create reservoirs

            const manglaReservoir = new Reservoir(
                'Mangla Dam',
                mangla.level_min_ft,
                mangla.level_max_ft,
                mangla.level_today_ft,
                reservoirPositions.mangla.x,
                reservoirPositions.mangla.y,
                reservoirPositions.mangla.radius
            );

            const tarbelaReservoir = new Reservoir(
                'Tarbela Dam',
                tarbela.level_min_ft,
                tarbela.level_max_ft,
                tarbela.level_today_ft,
                reservoirPositions.tarbela.x,
                reservoirPositions.tarbela.y,
                reservoirPositions.tarbela.radius
            );

            const chashmaReservoir = new Reservoir(
                'Chashma Dam',
                chashma.level_min_ft,
                chashma.level_max_ft,
                chashma.level_today_ft,
                reservoirPositions.chashma.x,
                reservoirPositions.chashma.y,
                reservoirPositions.chashma.radius
            );

            // Create any extra nodes
            const manglaSourceNode = new Node('Mangla Source', reservoirPositions.mangla.x - 200, reservoirPositions.mangla.y, 5, true);
            const tarbelaSourceNode = new Node('Tarbela Source', reservoirPositions.tarbela.x - 200, reservoirPositions.tarbela.y, 5, true);
            const kabulEntryNode = new Node('Kabul Entry', reservoirPositions.kabul.x, reservoirPositions.kabul.y, reservoirPositions.kabul.radius, true);
            const kabulSourceNode = new Node('Kabul Source', reservoirPositions.kabul.x - 100, reservoirPositions.kabul.y - 200, 5, true);
            const chashmaSinkNode = new Node('Chashma Sink', reservoirPositions.chashma.x + 100, reservoirPositions.chashma.y, 5, true);
            // Create flows
            const manglaSourceFlow = new Flow(
                'Inflow',
                manglaSourceNode,
                manglaReservoir,
                mangla.inflow_upstream_cusecs || 1000,
                true
            );

            const tarbelaSourceFlow = new Flow(
                'Tbla src',
                tarbelaSourceNode,
                tarbelaReservoir,
                tarbela.inflow_upstream_cusecs || 1000,
                true
            );

            const tarbelaKabulFlow = new Flow(
                'Tbla out',
                tarbelaReservoir,
                kabulEntryNode,
                tarbela.outflow_downstream_cusecs || 1000,
                true
            );

            const tarbelaManglaFlow = new Flow(
                'Inflow',
                tarbelaSourceNode,
                manglaReservoir,
                tarbela.inflow_upstream_cusecs || 1000,
                true
            );

            const kabulSourceFlow = new Flow(
                'Inflow',
                kabulSourceNode,
                kabulEntryNode,
                kabul.inflow_upstream_cusecs || 1000,
                true
            );

            const kabulChasmaFlow = new Flow(
                'Chasma in',
                kabulEntryNode,
                chashmaReservoir,
                chashma.inflow_upstream_cusecs || 1000,
                true
            )

            const chashmaOutFlow = new Flow(
                'Chasma out',
                chashmaReservoir,
                chashmaSinkNode,
                chashma.outflow_downstream_cusecs || 1000,
                true
            )

            // const kabulChasmaFlow
                
            // Draw flow first (so it appears under the nodes)
            manglaSourceFlow.draw();
            tarbelaSourceFlow.draw();
            tarbelaKabulFlow.draw();
            kabulSourceFlow.draw();
            kabulChasmaFlow.draw();
            chashmaOutFlow.draw();
            
            // Then draw nodes on top
            manglaSourceNode.draw();
            tarbelaSourceNode.draw();
            tarbelaReservoir.draw();
            chashmaReservoir.draw();
            kabulEntryNode.draw();
            kabulSourceNode.draw();
            manglaReservoir.draw();
            chashmaSinkNode.draw();

            
                
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
     * Animation loop
     */
    function animate() {
        time += 0.05;
        requestAnimationFrame(animate);
        
        // Use the current date's data for animation frames
        if (sortedDates.length > 0) {
            const currentDate = sortedDates[currentDateIndex];
            drawCanvas(currentDate, waterSystemData[currentDate]);
        }
    }
    
    // Start animation
    animate();
});
