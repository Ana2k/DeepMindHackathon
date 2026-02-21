import { GoogleGenAI } from '@google/genai';

// ———————————————————————
// CONFIGURATION
// ———————————————————————
const OUTPUT_FILES = [
    "sprite_idle",
    "sprite_walk_right",
    "sprite_punch",
    "sprite_jump"
];

const GRID_SIZE = 32;
const BG_THRESHOLD = 185;

// ———————————————————————
// DYNAMIC PROMPTS
// ———————————————————————
function getPrompts(characterDescription) {
    const baseInstruction = `Using the provided pixel grid, completely fill in the necessary squares to form a perfect pixel art image`;
    
    const strictRules = `
STRICT PIXEL RULES:
- Perfectly align to the squares of the provided grid.
- Hard square pixels only. No anti-aliasing.
- BACKGROUND: Solid pure white background. ABSOLUTELY NO checkerboard patterns, NO grey squares, NO fake transparency grids.
- Maximum 6 colors total.
- Flat solid colors only.
- Clean, readable silhouette.`;

    return [
        // 0: Base (Idle)
        `${baseInstruction} of a standing character.

CHARACTER DESIGN (Based on uploaded photo):
${characterDescription}
- Simple 8-bit face (dot eyes)

ACTION:
- Neutral standing pose
- Facing right
- Arms relaxed at sides
${strictRules}`,

        // 1: Walk
        `${baseInstruction} of a walking animation frame of the SAME character.

Keep character design exact to previous sprite.

ACTION:
- Facing right
- One leg stepping forward, the other leg back
- Opposite arm swinging forward
- Dynamic walking stride
${strictRules}`,

        // 2: Fight (Punch)
        `${baseInstruction} of a punch attack frame of the SAME character.

Keep character design exact to previous sprite.

ACTION:
- Facing right
- One arm fully extended forward (punch)
- Other arm slightly pulled back
- Slight forward lean
- Determined facial expression
${strictRules}`,

        // 3: Jump
        `${baseInstruction} of a jump animation frame of the SAME character.

Keep character design exact to previous sprite.

ACTION:
- Both feet off the ground
- Knees bent mid-air
- Arms slightly raised for balance
${strictRules}`
    ];
}

// ———————————————————————
// IMAGE PROCESSING LOGIC
// ———————————————————————

// Helper to load image to canvas
async function loadImageToCanvas(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas);
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}

function generateGridImageDataUrl() {
    const canvas = document.createElement('canvas');
    const width = 1024;
    const height = 1024;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // draw grid
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    const cellW = width / GRID_SIZE;
    const cellH = height / GRID_SIZE;
    
    ctx.beginPath();
    for (let x = 0; x <= width; x += cellW) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += cellH) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();
    
    return canvas.toDataURL('image/png').split(',')[1]; // Return base64 without prefix
}

function snapToGrid(canvas, gridSize = 32) {
    console.log("    📏 Snapping AI output perfectly to grid structure to ensure uniform pixel size...");
    const width = canvas.width;
    const height = canvas.height;
    
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    const cellW = width / gridSize;
    const cellH = height / gridSize;
    
    const outCanvas = document.createElement('canvas');
    outCanvas.width = width;
    outCanvas.height = height;
    const outCtx = outCanvas.getContext('2d');
    
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            let sampleX = Math.floor((x + 0.5) * cellW);
            let sampleY = Math.floor((y + 0.5) * cellH);
            
            sampleX = Math.min(sampleX, width - 1);
            sampleY = Math.min(sampleY, height - 1);
            
            const index = (sampleY * width + sampleX) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];
            
            const topLeftX = Math.floor(x * cellW);
            const topLeftY = Math.floor(y * cellH);
            const w = Math.floor((x + 1) * cellW) - topLeftX;
            const h = Math.floor((y + 1) * cellH) - topLeftY;
            
            outCtx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
            outCtx.fillRect(topLeftX, topLeftY, w, h);
        }
    }
    
    return outCanvas;
}

function snapColorsToPalette(canvas, baseCanvas, bgThreshold = 185) {
    console.log("    🎨 Snapping colors to match the Base Idle sprite perfectly...");
    
    const baseCtx = baseCanvas.getContext('2d');
    const baseData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height).data;
    const validColors = new Map();
    
    // Extract unique colors from base
    for (let i = 0; i < baseData.length; i += 4) {
        const r = baseData[i];
        const g = baseData[i + 1];
        const b = baseData[i + 2];
        const a = baseData[i + 3];
        
        if (a >= 128 && !(r > bgThreshold && g > bgThreshold && b > bgThreshold)) {
            validColors.set(`${r},${g},${b}`, {r, g, b});
        }
    }
    
    const palette = Array.from(validColors.values());
    if (palette.length === 0) return canvas;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    const colorCache = new Map();
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (a < 128 || (r > bgThreshold && g > bgThreshold && b > bgThreshold)) {
            continue;
        }
        
        const key = `${r},${g},${b}`;
        if (colorCache.has(key)) {
            const nearest = colorCache.get(key);
            data[i] = nearest.r;
            data[i + 1] = nearest.g;
            data[i + 2] = nearest.b;
        } else {
            let minDist = Infinity;
            let nearest = null;
            for (const pc of palette) {
                const dist = Math.pow(pc.r - r, 2) + Math.pow(pc.g - g, 2) + Math.pow(pc.b - b, 2);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = pc;
                }
            }
            colorCache.set(key, nearest);
            data[i] = nearest.r;
            data[i + 1] = nearest.g;
            data[i + 2] = nearest.b;
        }
    }
    
    ctx.putImageData(imgData, 0, 0);
    return canvas;
}

function convertToSVGDataUrl(canvas, bgThreshold = 185) {
    console.log("    🧹 Converting to SVG Format");
    
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, width, height).data;
    
    let svgBody = "";
    
    for (let y = 0; y < height; y++) {
        let x = 0;
        while (x < width) {
            const index = (y * width + x) * 4;
            const r = imgData[index];
            const g = imgData[index + 1];
            const b = imgData[index + 2];
            const a = imgData[index + 3];
            
            if (a < 128 || (r > bgThreshold && g > bgThreshold && b > bgThreshold)) {
                x += 1;
                continue;
            }
            
            const colorR = r;
            const colorG = g;
            const colorB = b;
            
            let run = 1;
            while (x + run < width) {
                const nextIndex = (y * width + (x + run)) * 4;
                const nR = imgData[nextIndex];
                const nG = imgData[nextIndex + 1];
                const nB = imgData[nextIndex + 2];
                const nA = imgData[nextIndex + 3];
                
                if (nA >= 128 && nR === colorR && nG === colorG && nB === colorB) {
                    run++;
                } else {
                    break;
                }
            }
            
            const hexColor = "#" + [colorR, colorG, colorB].map(c => c.toString(16).padStart(2, '0')).join('');
            svgBody += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${hexColor}" />\n`;
            x += run;
        }
    }
    
    const svgContent = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${svgBody}
</svg>`;
    
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

// ———————————————————————
// GENERATION LOGIC
// ———————————————————————

export async function generateSprites(file, apiKey, statusCallback) {
    const ai = new GoogleGenAI({ apiKey });
    const benchmarks = {};
    
    // Read user file to base64
    statusCallback("Reading image...");
    const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    
    const mimeType = file.type;
    
    const startOverall = Date.now();
    
    // 1. Analyze Image
    statusCallback("👁️ Analyzing user image to extract character design...");
    const startAnalysis = Date.now();
    
    const prompt = `Analyze this image and describe the person concisely for a 2D pixel art character design. 
    Include: Gender, hair color/style, skin tone, and specific clothing items with their colors. 
    Keep it under 40 words. Format as a bulleted list.`;
    
    const analysisResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user',
            parts: [
                { text: prompt },
                { inlineData: { data: base64Image, mimeType: mimeType } }
            ]
        }]
    });
    
    const description = analysisResponse.text.trim();
    benchmarks["Image Analysis"] = (Date.now() - startAnalysis) / 1000;
    
    // 2. Get Dynamic Prompts
    const prompts = getPrompts(description);
    const gridImageBase64 = generateGridImageDataUrl();
    
    let baseIdleSpriteCanvas = null;
    const finalSprites = {}; // { 'sprite_idle': dataUrl, ... }
    
    for (let i = 0; i < prompts.length; i++) {
        const currentPrompt = prompts[i];
        const currentKey = OUTPUT_FILES[i];
        
        statusCallback(`🎨 Generating ${currentKey} (${i + 1}/${prompts.length})...`);
        const startSprite = Date.now();
        
        const contentsParts = [
            { text: currentPrompt },
            { inlineData: { data: base64Image, mimeType: mimeType } },
            { inlineData: { data: gridImageBase64, mimeType: 'image/png' } }
        ];
        
        // If we have base Idle sprite, append it (as PNG base64) to encourage consistency
        if (i > 0 && baseIdleSpriteCanvas) {
            const baseDataUrl = baseIdleSpriteCanvas.toDataURL('image/png');
            const b64 = baseDataUrl.split(',')[1];
            contentsParts.push({ inlineData: { data: b64, mimeType: 'image/png' } });
        }
        
        const spriteResponse = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: [{
                role: 'user',
                parts: contentsParts
            }],
            config: {
                responseModalities: ["IMAGE"]
            }
        });
        
        const part = spriteResponse.candidates?.[0]?.content?.parts?.[0];
        if (part && part.inlineData) {
            const generatedB64 = part.inlineData.data;
            const generatedMime = part.inlineData.mimeType;
            const dataUrl = `data:${generatedMime};base64,${generatedB64}`;
            
            let processedCanvas = await loadImageToCanvas(dataUrl);
            
            // 1. Snap to Grid
            statusCallback(`📏 Snapping ${currentKey} to grid...`);
            processedCanvas = snapToGrid(processedCanvas, GRID_SIZE);
            
            // 2. Enforce Color Palette
            if (i === 0) {
                // clone canvas
                baseIdleSpriteCanvas = document.createElement('canvas');
                baseIdleSpriteCanvas.width = processedCanvas.width;
                baseIdleSpriteCanvas.height = processedCanvas.height;
                baseIdleSpriteCanvas.getContext('2d').drawImage(processedCanvas, 0, 0);
            } else {
                statusCallback(`🎨 Snapping colors for ${currentKey}...`);
                processedCanvas = snapColorsToPalette(processedCanvas, baseIdleSpriteCanvas, BG_THRESHOLD);
            }
            
            // 3. Convert to SVG Data URL
            statusCallback(`🧹 Converting ${currentKey} to SVG...`);
            const finalSvgDataUrl = convertToSVGDataUrl(processedCanvas, BG_THRESHOLD);
            
            finalSprites[currentKey] = finalSvgDataUrl;
            
        } else {
            console.error(`❌ No image returned for prompt ${i}`);
        }
        
        benchmarks[`Sprite ${i+1}: ${currentKey}`] = (Date.now() - startSprite) / 1000;
    }
    
    benchmarks["Total Time"] = (Date.now() - startOverall) / 1000;
    console.log("Benchmarks:", benchmarks);
    statusCallback("🎉 All done! Game-ready SVGs have been generated.");
    
    return finalSprites;
}
