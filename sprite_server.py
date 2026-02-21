"""
Sprite Pipeline Server
A Flask server that accepts a user photo upload and generates 4 game-ready SVG sprites
using the Gemini API + PIL post-processing (grid snapping, color palette enforcement).
"""

import os
import sys
import time
import base64
import json
from io import BytesIO
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageDraw
import xml.etree.ElementTree as ET
from google import genai

app = Flask(__name__)
CORS(app)

# ———————————————————————
# CONFIGURATION
# ———————————————————————

# Auto-load .env file so no env var needs to be passed on command line
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")
GRID_IMAGE_PATH = Path(__file__).parent / "pixel_grid_32x32.png"

SPRITE_NAMES = ["idle", "walk", "punch", "jump"]

# ———————————————————————
# PROMPTS (from sprite-pipeline)
# ———————————————————————

def get_prompts(character_description):
    base_instruction = """Using the provided pixel grid, completely fill in the necessary squares to form a perfect pixel art image"""
    
    strict_rules = """
STRICT PIXEL RULES:
- Perfectly align to the squares of the provided grid.
- Hard square pixels only. No anti-aliasing.
- BACKGROUND: Solid pure white background. ABSOLUTELY NO checkerboard patterns, NO grey squares, NO fake transparency grids.
- Maximum 6 colors total.
- Flat solid colors only.
- Clean, readable silhouette."""

    return [
        # 0: Idle
        f"""{base_instruction} of a standing character.

CHARACTER DESIGN (Based on uploaded photo):
{character_description}
- Simple 8-bit face (dot eyes)

ACTION:
- Neutral standing pose
- Facing right
- Arms relaxed at sides
{strict_rules}""",

        # 1: Walk
        f"""{base_instruction} of a walking animation frame of the SAME character.

Keep character design exact to previous sprite.

ACTION:
- Facing right
- One leg stepping forward, the other leg back
- Opposite arm swinging forward
- Dynamic walking stride
{strict_rules}""",

        # 2: Punch
        f"""{base_instruction} of a punch attack frame of the SAME character.

Keep character design exact to previous sprite.

ACTION:
- Facing right
- One arm fully extended forward (punch)
- Other arm slightly pulled back
- Slight forward lean
- Determined facial expression
{strict_rules}""",

        # 3: Jump
        f"""{base_instruction} of a jump animation frame of the SAME character.

Keep character design exact to previous sprite.

ACTION:
- Both feet off the ground
- Knees bent mid-air
- Arms slightly raised for balance
{strict_rules}"""
    ]

# ———————————————————————
# IMAGE PROCESSING (from sprite-pipeline)
# ———————————————————————

def snap_to_grid(img, grid_size=32):
    """Forces AI output to perfectly conform to a 32x32 grid."""
    img = img.convert("RGBA")
    width, height = img.size
    cell_w = width / grid_size
    cell_h = height / grid_size
    
    snapped_img = Image.new("RGBA", (width, height), (255, 255, 255, 0))
    draw = ImageDraw.Draw(snapped_img)
    
    for y in range(grid_size):
        for x in range(grid_size):
            sample_x = min(int((x + 0.5) * cell_w), width - 1)
            sample_y = min(int((y + 0.5) * cell_h), height - 1)
            r, g, b, a = img.getpixel((sample_x, sample_y))
            top_left = (int(x * cell_w), int(y * cell_h))
            bottom_right = (int((x + 1) * cell_w), int((y + 1) * cell_h))
            draw.rectangle([top_left, bottom_right], fill=(r, g, b, a))
    
    return snapped_img


def snap_colors_to_palette(img, base_img, bg_threshold=185):
    """Forces the current image to strictly use only the colors found in the base image."""
    base_pixels = base_img.convert("RGBA").getdata()
    valid_colors = set()
    for r, g, b, a in base_pixels:
        if a >= 128 and not (r > bg_threshold and g > bg_threshold and b > bg_threshold):
            valid_colors.add((r, g, b))
    
    if not valid_colors:
        return img
    
    valid_colors = list(valid_colors)
    img = img.convert("RGBA")
    pixels = img.load()
    width, height = img.size
    color_cache = {}
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a < 128 or (r > bg_threshold and g > bg_threshold and b > bg_threshold):
                continue
            color_tuple = (r, g, b)
            if color_tuple in color_cache:
                nearest_color = color_cache[color_tuple]
            else:
                nearest_color = min(valid_colors, key=lambda c: (c[0]-r)**2 + (c[1]-g)**2 + (c[2]-b)**2)
                color_cache[color_tuple] = nearest_color
            pixels[x, y] = (nearest_color[0], nearest_color[1], nearest_color[2], a)
    
    return img


def convert_to_svg_string(img, bg_threshold=185):
    """Converts image to an SVG string with transparent background."""
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()

    svg = ET.Element("svg", {
        "xmlns": "http://www.w3.org/2000/svg",
        "width": str(width),
        "height": str(height),
        "viewBox": f"0 0 {width} {height}"
    })

    for y in range(height):
        x = 0
        while x < width:
            r, g, b, a = pixels[x, y]
            if a < 128 or (r > bg_threshold and g > bg_threshold and b > bg_threshold):
                x += 1
                continue
            color = (r, g, b)
            run = 1
            while x + run < width:
                nr, ng, nb, na = pixels[x + run, y]
                if na >= 128 and (nr, ng, nb) == color:
                    run += 1
                else:
                    break
            ET.SubElement(svg, "rect", {
                "x": str(x), "y": str(y),
                "width": str(run), "height": "1",
                "fill": f"#{r:02x}{g:02x}{b:02x}"
            })
            x += run

    return ET.tostring(svg, encoding="unicode", xml_declaration=True)


# ———————————————————————
# GEMINI API CALLS
# ———————————————————————

def analyze_character(client, photo_img):
    """Uses Gemini to describe the user's uploaded photo for pixel art."""
    print("  👁️  Analyzing user image...")
    prompt = """Analyze this image and describe the person concisely for a 2D pixel art character design. 
    Include: Gender, hair color/style, skin tone, and specific clothing items with their colors. 
    Keep it under 40 words. Format as a bulleted list."""
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[prompt, photo_img]
    )
    description = response.text.strip()
    print(f"  ✅ Description: {description}")
    return description


def generate_sprites(client, photo_img, grid_img, description, bg_threshold=185):
    """Generate all 4 sprites and return them as SVG strings."""
    prompts = get_prompts(description)
    base_idle_sprite = None
    results = {}

    for i, prompt in enumerate(prompts):
        name = SPRITE_NAMES[i]
        print(f"  🎨 Generating sprite: {name} ({i+1}/{len(prompts)})...")
        
        contents = [prompt, photo_img, grid_img]
        if i > 0 and base_idle_sprite is not None:
            contents.append(base_idle_sprite)

        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=contents,
        )

        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if part.inline_data is not None:
                    processed_img = Image.open(BytesIO(part.inline_data.data)).convert("RGBA")
                    
                    # 1. Snap to grid
                    processed_img = snap_to_grid(processed_img, grid_size=32)
                    
                    # 2. Color palette enforcement
                    if i == 0:
                        base_idle_sprite = processed_img.copy()
                    else:
                        processed_img = snap_colors_to_palette(processed_img, base_idle_sprite, bg_threshold)
                    
                    # 3. Convert to SVG string
                    svg_str = convert_to_svg_string(processed_img, bg_threshold)
                    results[name] = svg_str
                    print(f"  ✅ {name} done!")
                    break
        
        if name not in results:
            print(f"  ❌ Failed to generate {name}")
            results[name] = None

    return results


# ———————————————————————
# API ENDPOINT
# ———————————————————————

@app.route("/generate-sprites", methods=["POST"])
def generate_sprites_endpoint():
    if not API_KEY:
        return jsonify({"error": "GEMINI_API_KEY not set on server"}), 500

    if "image" not in request.files:
        return jsonify({"error": "No image file uploaded"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        print("\n🚀 Starting Sprite Pipeline...")
        start_time = time.time()

        client = genai.Client(api_key=API_KEY)

        # Load uploaded photo as PIL Image
        photo_bytes = file.read()
        photo_img = Image.open(BytesIO(photo_bytes))

        # Load grid image
        grid_img = Image.open(GRID_IMAGE_PATH)

        # Step 1: Analyze character
        description = analyze_character(client, photo_img)

        # Step 2: Generate all sprites
        sprites = generate_sprites(client, photo_img, grid_img, description)

        elapsed = time.time() - start_time
        print(f"\n✅ Pipeline complete in {elapsed:.1f}s")

        # Return SVGs as JSON
        return jsonify({
            "success": True,
            "description": description,
            "sprites": sprites,
            "elapsed": round(elapsed, 1)
        })

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "api_key_set": bool(API_KEY)})


if __name__ == "__main__":
    print("🎮 Sprite Pipeline Server starting...")
    print(f"   API Key: {'✅ Set' if API_KEY else '❌ Missing'}")
    print(f"   Grid Image: {'✅ Found' if GRID_IMAGE_PATH.exists() else '❌ Missing'}")
    app.run(host="0.0.0.0", port=5001, debug=True)
