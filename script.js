// ========== Canvas + Setup ==========
const canvas = document.getElementById("gradientCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const glassEffect = document.getElementById("glassEffect");

const defaultSettings = {
  blur: 90,
  radius: 100,
  shadow: 10,
  count: 120,
  smoothness: 7,
  speed: 1.5,
  colors: ['#1b0cec', '#FF9AAD', '#FF6B6B', '#FF9E2C', '#D6A3FF', '#BE33FF', '#F8D0B8']
};

let blurAmount = defaultSettings.blur;
let circleRadius = defaultSettings.radius;
let shadowBlur = defaultSettings.shadow;
let numPoints = defaultSettings.count;
let smoothnessFactor = defaultSettings.smoothness;
let speedFactor = defaultSettings.speed;
let colors = [...defaultSettings.colors];

let colorProgress = new Array(numPoints).fill(0.5);
let points = [];
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let isMouseMoving = false;
let mouseInactiveTimer = null;

// ========== Point Initialization ==========
function initPoints(count) {
  points = [];
  colorProgress = new Array(count).fill(0.5);
  for (let i = 0; i < count; i++) {
    points.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      dx: (Math.random() - 0.5) * speedFactor,
      dy: (Math.random() - 0.5) * speedFactor,
      radius: circleRadius,
      randomOffset: Math.random() * 0.2,
      isMovingToMouse: false,
    });
  }
}
initPoints(numPoints);

// ========== Mouse Tracking ==========
document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  isMouseMoving = true;
  clearTimeout(mouseInactiveTimer);
  mouseInactiveTimer = setTimeout(() => isMouseMoving = false, 1000);
});

// ========== Color Utilities ==========
function hexToRgb(hex) {
  return {
    r: parseInt(hex.substr(1, 2), 16),
    g: parseInt(hex.substr(3, 2), 16),
    b: parseInt(hex.substr(5, 2), 16)
  };
}

function interpolateColors(c1, c2, t) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  return `rgb(${Math.round(a.r + (b.r - a.r) * t)}, ${Math.round(a.g + (b.g - a.g) * t)}, ${Math.round(a.b + (b.b - a.b) * t)})`;
}

function getGradientColor(progress, offset) {
  const count = colors.length - 1;
  const t = (progress + offset) * (count - 1);
  const i = Math.floor(t) + 1;
  const next = (i + 1 > count) ? 1 : i + 1;
  return interpolateColors(colors[i], colors[next], t - Math.floor(t));
}

// ========== Animation ==========
function createFluidEffect() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  points.forEach((p, i) => {
    const dist = Math.hypot(mouseX - p.x, mouseY - p.y);
    const t = dist / Math.hypot(canvas.width, canvas.height);
    if (isMouseMoving) colorProgress[i] += (t - colorProgress[i]) * 0.05;

    const color = getGradientColor(colorProgress[i], p.randomOffset);
    const maxDistForPush = 160;

    if (dist < maxDistForPush) {
      const angle = Math.atan2(mouseY - p.y, mouseX - p.x);
      const smoothFactor = 1 - t;
      p.x -= Math.cos(angle) * smoothnessFactor * smoothFactor;
      p.y -= Math.sin(angle) * smoothnessFactor * smoothFactor;
    }

    if (!isMouseMoving && !p.isMovingToMouse) {
      const angleToMouse = Math.atan2(mouseY - p.y, mouseX - p.x);
      p.x += Math.cos(angleToMouse) * 0.5;
      p.y += Math.sin(angleToMouse) * 0.5;
      p.isMovingToMouse = true;
      setTimeout(() => p.isMovingToMouse = false, 1000);
    }

    p.x += p.dx;
    p.y += p.dy;

    if (p.x < -circleRadius) p.x = canvas.width + circleRadius;
    if (p.x > canvas.width + circleRadius) p.x = -circleRadius;
    if (p.y < -circleRadius) p.y = canvas.height + circleRadius;
    if (p.y > canvas.height + circleRadius) p.y = -circleRadius;

    ctx.shadowBlur = shadowBlur;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
  requestAnimationFrame(createFluidEffect);
}

// ========== Sliders and UI ==========
const blurSlider = document.getElementById("blurSlider");
const radiusSlider = document.getElementById("radiusSlider");
const shadowSlider = document.getElementById("shadowSlider");
const smoothnessSlider = document.getElementById("smoothnessSlider");
const speedSlider = document.getElementById("speedSlider");
const circleCountSlider = document.getElementById("circleCountSlider");
const circleCountValue = document.getElementById("circleCountValue");
const colorPaletteList = document.getElementById("colorPaletteList");

blurSlider.addEventListener("input", () => {
  blurAmount = parseInt(blurSlider.value);
  glassEffect.style.backdropFilter = `blur(${blurAmount}px)`;
});
radiusSlider.addEventListener("input", () => {
  circleRadius = parseInt(radiusSlider.value);
});
shadowSlider.addEventListener("input", () => {
  shadowBlur = parseInt(shadowSlider.value);
});
smoothnessSlider.addEventListener("input", () => {
  smoothnessFactor = parseFloat(smoothnessSlider.value);
});
speedSlider.addEventListener("input", () => {
  speedFactor = parseFloat(speedSlider.value);
  points.forEach(p => {
    p.dx = (Math.random() - 0.5) * speedFactor;
    p.dy = (Math.random() - 0.5) * speedFactor;
  });
});
circleCountSlider.addEventListener("input", () => {
  numPoints = parseInt(circleCountSlider.value);
  circleCountValue.textContent = numPoints;
  initPoints(numPoints);
});

// ========== Save Image with Blur Simulation ==========
document.getElementById("saveImageBtn").addEventListener("click", async () => {
  const panelContainer = document.getElementById("panelContainer");
  const menuButtons = document.getElementById("menuButtons");

  // Hide panels temporarily
  panelContainer.style.display = "none";
  menuButtons.style.display = "none";

  try {
    const stream = document.documentElement.captureStream(1);
    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();

    await new Promise(resolve => setTimeout(resolve, 100)); // wait for frame to draw

    const track = stream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(track);
    const bitmap = await imageCapture.grabFrame();

    // Draw bitmap to canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = bitmap.width;
    tempCanvas.height = bitmap.height;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);

    // Download as PNG
    const link = document.createElement("a");
    link.download = "blurred_background.png";
    link.href = tempCanvas.toDataURL("image/png");
    link.click();

    track.stop();
  } catch (err) {
    console.error("Screen capture failed:", err);
    alert("Screen capture not supported.");
  } finally {
    // Restore panels
    panelContainer.style.display = "";
    menuButtons.style.display = "";
  }
});

// ========== Record Full Page (DOM) ==========
const domRecordBtn = document.createElement("button");
domRecordBtn.textContent = "Record Full Page (5s)";
domRecordBtn.id = "recordFullPageBtn";
document.getElementById("exportPanel").appendChild(domRecordBtn);

domRecordBtn.addEventListener("click", async () => {
  try {
    const stream = document.documentElement.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "fullpage_recording.webm";
      link.click();
    };

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 5000);
  } catch (err) {
    alert("Your browser does not support full-page capture with captureStream.");
    console.error(err);
  }
});

// ========== Color Palette UI ==========
function updateColorUI() {
  colorPaletteList.innerHTML = '';
  colors.forEach((hex, i) => {
    const li = document.createElement("li");
    const swatch = document.createElement("div");
    const label = document.createElement("span");
    const input = document.createElement("input");

    swatch.className = "colorSwatch";
    swatch.style.backgroundColor = hex;
    label.textContent = hex;
    input.type = "color";
    input.className = "colorInput";
    input.value = hex;

    input.addEventListener("input", (e) => {
      colors[i] = e.target.value;
      swatch.style.backgroundColor = e.target.value;
      label.textContent = e.target.value;
      if (i === 0) document.body.style.backgroundColor = e.target.value;
    });

    li.appendChild(swatch);
    li.appendChild(label);
    li.appendChild(input);
    colorPaletteList.appendChild(li);
  });
  document.body.style.backgroundColor = colors[0];
}

document.getElementById("changeColorButton").addEventListener("click", () => {
  colors = [`#${Math.floor(Math.random()*16777215).toString(16)}`].concat(
    Array.from({ length: 6 }, () => `#${Math.floor(Math.random()*16777215).toString(16)}`)
  );
  updateColorUI();
});

document.getElementById("resetDefaultsBtn").addEventListener("click", () => {
  blurAmount = defaultSettings.blur;
  circleRadius = defaultSettings.radius;
  shadowBlur = defaultSettings.shadow;
  numPoints = defaultSettings.count;
  smoothnessFactor = defaultSettings.smoothness;
  speedFactor = defaultSettings.speed;

  blurSlider.value = blurAmount;
  radiusSlider.value = circleRadius;
  shadowSlider.value = shadowBlur;
  smoothnessSlider.value = smoothnessFactor;
  speedSlider.value = speedFactor;
  circleCountSlider.value = numPoints;
  circleCountValue.textContent = numPoints;
  glassEffect.style.backdropFilter = `blur(${blurAmount}px)`;

  initPoints(numPoints); // Keep this so the new circle count reflects
});


// ========== Menu Toggle Logic ==========
const openPanels = new Set();
const toggleBtn = document.getElementById("togglePanelBtn");
const menuButtons = document.getElementById("menuButtons");
const panelContainer = document.getElementById("panelContainer");

function updatePanelVisibility() {
  panelContainer.querySelectorAll(".mini-panel").forEach(panel => {
    if (openPanels.has(panel.id)) {
      panel.classList.remove("hidden");
    } else {
      panel.classList.add("hidden");
    }
  });
}

toggleBtn.addEventListener("click", () => {
  menuButtons.classList.toggle("hidden");
  const isNowHidden = menuButtons.classList.contains("hidden");
  panelContainer.querySelectorAll(".mini-panel").forEach(panel => {
    panel.classList.toggle("hidden", isNowHidden);
  });
  if (!isNowHidden) updatePanelVisibility();
});

document.querySelectorAll('.panel-toggle').forEach(button => {
  button.addEventListener('click', () => {
    const targetId = button.getAttribute('data-target');
    const panel = document.getElementById(targetId);
    const isVisible = !panel.classList.contains("hidden");

    if (isVisible) {
      panel.classList.add("hidden");
      openPanels.delete(targetId);
    } else {
      panel.classList.remove("hidden");
      openPanels.add(targetId);
    }
  });
});

// ========== Initialize ==========
glassEffect.style.backdropFilter = `blur(${blurAmount}px)`;
updateColorUI();
createFluidEffect();
