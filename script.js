const canvas = document.getElementById("gradientCanvas");
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Default metallic gel-like colors (orange, pink, purple tones)
let colors = ['#FF9AAD', '#FF6B6B', '#FF9E2C', '#D6A3FF', '#BE33FF', '#F8D0B8']; // Restored color palette
let colorProgress = new Array(120).fill(0); // Track color progress for each spot (120 circles)

// Variables for mouse position
let mouseX = 0;
let mouseY = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let mouseInactiveTimer = null; // Timer for mouse inactivity
let isMouseMoving = false; // To check if the mouse is moving

// Variables to control the moving spots
const numPoints = 120; // Increased number of points to 120
const points = [];

// Store initial spots with random positions and velocities
for (let i = 0; i < numPoints; i++) {
    points.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        originalX: Math.random() * canvas.width, // Save original position
        originalY: Math.random() * canvas.height,
        dx: (Math.random() - 0.5) * 2,  // Random horizontal velocity
        dy: (Math.random() - 0.5) * 2,  // Random vertical velocity
        radius: 100, // Fixed radius for all circles (100px radius)
        randomOffset: Math.random() * 0.2, // Add slight random offset to color progress
        isMovingToMouse: false // Flag to indicate if the circle is moving to the mouse position
    });
}

// Listen for mouse movement to track the mouse position
document.addEventListener("mousemove", (e) => {
    lastMouseX = mouseX;
    lastMouseY = mouseY;

    mouseX = e.clientX;
    mouseY = e.clientY;
    isMouseMoving = true; // Mouse is moving

    // Reset the inactivity timer when the mouse moves
    clearTimeout(mouseInactiveTimer);
    mouseInactiveTimer = setTimeout(() => {
        isMouseMoving = false; // Set the mouse as inactive if there's no movement for a set time
    }, 1000); // Mouse inactivity threshold (1 second)
});

// Function to interpolate between two colors
function interpolateColors(c1, c2, t) {
    let color1 = hexToRgb(c1);
    let color2 = hexToRgb(c2);

    let r = Math.round(color1.r + (color2.r - color1.r) * t);
    let g = Math.round(color1.g + (color2.g - color1.g) * t);
    let b = Math.round(color1.b + (color2.b - color1.b) * t);

    return `rgb(${r},${g},${b})`;
}

// Convert hex color to RGB format
function hexToRgb(hex) {
    let r = parseInt(hex.substr(1, 2), 16);
    let g = parseInt(hex.substr(3, 2), 16);
    let b = parseInt(hex.substr(5, 2), 16);
    return { r, g, b };
}

// Function to create a smooth color transition between multiple colors
function getGradientColor(progress, offset) {
    const colorCount = colors.length;
    const t = (progress + offset) * (colorCount - 1); // Normalize progress for interpolation with offset
    const index = Math.floor(t);
    const nextIndex = (index + 1) % colorCount;

    const color1 = colors[index];
    const color2 = colors[nextIndex];
    const interpolation = t - index;

    return interpolateColors(color1, color2, interpolation);
}

// Function to update the animation of the spots
function createFluidEffect() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    // Update each spot's position based on its velocity
    points.forEach((point, index) => {
        // Calculate the distance between the mouse and the spot
        const dist = Math.sqrt((mouseX - point.x) ** 2 + (mouseY - point.y) ** 2);
        const maxDist = Math.sqrt((canvas.width ** 2) + (canvas.height ** 2)); // Max distance for interpolation
        const t = dist / maxDist; // Calculate transition factor

        // Gradually shift the color of the gradient points based on the mouse distance
        if (isMouseMoving) {
            // Mouse is moving, update colors
            colorProgress[index] = colorProgress[index] + (t - colorProgress[index]) * 0.05; // Smoother transition
        }

        // Get the color based on the mouse position with randomness in color transition
        const color = getGradientColor(colorProgress[index], point.randomOffset); // Add slight random offset

        // Apply movement based on mouse proximity: nudge away from mouse when close
        const maxDistForPush = 160; // Increase the distance for stronger nudging
        const pushFactor = isMouseMoving ? 7 : 10; // Faster movement when mouse is inactive

        if (dist < maxDistForPush) {
            // Calculate angle to the mouse and nudge the circle away
            const angle = Math.atan2(mouseY - point.y, mouseX - point.x);
            point.x -= Math.cos(angle) * pushFactor * (1 - t); // Nudging the circle away
            point.y -= Math.sin(angle) * pushFactor * (1 - t); // Nudging the circle away
        }

        // If the mouse is inactive, move one of the nearby circles to fill the space
        if (!isMouseMoving) {
            if (!point.isMovingToMouse) {
                // Move one circle to fill the space near the mouse
                const angleToMouse = Math.atan2(mouseY - point.y, mouseX - point.x);
                const speed = 1; // Speed of the circle moving towards the mouse
                point.x += Math.cos(angleToMouse) * speed;
                point.y += Math.sin(angleToMouse) * speed;

                // Mark this point as moving towards the mouse
                point.isMovingToMouse = true;

                // Reset the flag after the circle has been moved
                setTimeout(() => {
                    point.isMovingToMouse = false;
                }, 1000); // Reset after 1 second
            }
        }

        // Continue the random movement behavior, ensuring the circle stays within bounds
        point.x += point.dx; // Keep random horizontal movement
        point.y += point.dy; // Keep random vertical movement

        // Allow a bit of bleed beyond the edges, but restrict it slightly
        if (point.x < -point.radius) point.x = canvas.width + point.radius; // Allow bleed off the left
        if (point.x > canvas.width + point.radius) point.x = -point.radius; // Allow bleed off the right
        if (point.y < -point.radius) point.y = canvas.height + point.radius; // Allow bleed off the top
        if (point.y > canvas.height + point.radius) point.y = -point.radius; // Allow bleed off the bottom

        // Apply a slight blur effect for the circles
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;  // Set shadow to match the circle color

        // Draw the spot as a circle
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    });

    // Repeat the animation
    requestAnimationFrame(createFluidEffect);
}

// Ensure the canvas resizes dynamically
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Recalculate circle positions when resizing
    points.forEach(point => {
        point.x = Math.random() * canvas.width;
        point.y = Math.random() * canvas.height;
    });
});

// Function to generate a random color palette
function getRandomColorPalette() {
    const randomPalette = [];
    for (let i = 0; i < 6; i++) {
        randomPalette.push(`#${Math.floor(Math.random()*16777215).toString(16)}`); // Random Hex Color
    }
    return randomPalette;
}

// Function to generate a random background color
function getRandomBackgroundColor() {
    return `#${Math.floor(Math.random()*16777215).toString(16)}`; // Random Hex Color for background
}

// Function to update the control panel with new color values
function updateColorDisplay() {
    const circleColorsContainer = document.getElementById('circleColors');
    const backgroundColorHex = document.getElementById('backgroundColorHex');
    
    // Clear existing colors
    circleColorsContainer.innerHTML = '';
    
    // Add the circle palette colors to the panel
    colors.forEach(color => {
        const colorItem = document.createElement('li');
        colorItem.textContent = color;
        colorItem.style.color = color;
        circleColorsContainer.appendChild(colorItem);
    });

    // Display background color hex code
    backgroundColorHex.textContent = `Background Color: ${document.body.style.backgroundColor}`;
}

// Add event listener to button to change color palette
const changeColorButton = document.getElementById("changeColorButton");
changeColorButton.addEventListener("click", () => {
    colors = getRandomColorPalette(); // Update color palette with a random one
    document.body.style.backgroundColor = getRandomBackgroundColor(); // Change background color randomly
    updateColorDisplay(); // Update color display in the control panel
});

// Start the animation
createFluidEffect();
updateColorDisplay(); // Initially update the color display
