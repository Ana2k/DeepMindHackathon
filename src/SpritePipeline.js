/**
 * SpritePipeline.js
 * Frontend module that communicates with the Python sprite_server.py
 * to generate custom Player 1 sprites from an uploaded photo.
 */

const SPRITE_SERVER_URL = 'http://localhost:5001';

/**
 * Generate sprites by uploading the user's photo to the Python sprite server.
 * @param {File} imageFile - The user's uploaded image file
 * @param {function} onProgress - Callback for progress updates: onProgress(message)
 * @returns {Promise<{idle: string, walk: string, punch: string, jump: string}>} SVG data URLs
 */
export async function generateSprites(imageFile, onProgress = () => { }) {
    onProgress('Uploading image to sprite pipeline...');

    const formData = new FormData();
    formData.append('image', imageFile);

    onProgress('Generating sprites with AI (this takes ~60s)...');

    const response = await fetch(`${SPRITE_SERVER_URL}/generate-sprites`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(err.error || `Server returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Sprite generation failed');
    }

    onProgress('Processing sprites...');

    // Convert SVG strings to data URLs
    const sprites = {};
    const names = ['idle', 'walk', 'punch', 'jump'];

    for (const name of names) {
        if (data.sprites[name]) {
            // Encode SVG string as a data URL
            const svgBlob = new Blob([data.sprites[name]], { type: 'image/svg+xml' });
            sprites[name] = URL.createObjectURL(svgBlob);
        } else {
            console.warn(`Sprite "${name}" was not generated, will use default.`);
            sprites[name] = null;
        }
    }

    onProgress(`Sprites ready! (${data.elapsed}s)`);
    return sprites;
}

/**
 * Check if the sprite server is running and healthy.
 * @returns {Promise<boolean>}
 */
export async function checkSpriteServer() {
    try {
        const response = await fetch(`${SPRITE_SERVER_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(2000)
        });
        if (response.ok) {
            const data = await response.json();
            return data.status === 'ok';
        }
        return false;
    } catch {
        return false;
    }
}
