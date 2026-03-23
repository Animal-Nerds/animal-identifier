import { IMAGE } from "./constants";
export async function compressImage(file: File): Promise<string> {
    // Validate the file type against supported formats
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimeTypes.includes(file.type)) { 
        throw new Error('Invalid image format. Supported formats are JPEG, PNG, and WEBP.');
    }

    // Create an object URL for the file to load it into an Image object
    const imageUrl = URL.createObjectURL(file);

    // Load the image to get its dimensions
    const img = new Image();
    img.src = imageUrl;

    // Wait for the image to load
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });

    // Calculate new dimensions while maintaining aspect ratio
    const MAX_DIMENSION = IMAGE.MAX_DIMENSION;
    let newWidth = img.width;
    let newHeight = img.height;

    // Determine the longest dimension and scale accordingly
    const longestDimension = Math.max(img.width, img.height);

    // If the longest dimension exceeds the max, scale down
    if (longestDimension > MAX_DIMENSION) {
        const scaleFactor = MAX_DIMENSION / longestDimension;
        newWidth = Math.round(img.width * scaleFactor);
        newHeight = Math.round(img.height * scaleFactor);
    }

    // Create a canvas to draw the resized image
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Draw the image onto the canvas at the new dimensions
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // Clear the canvas before drawing
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    
    // Revoke the object URL to free up memory
    URL.revokeObjectURL(imageUrl);

    // Compress the image by adjusting the quality until it meets the size requirement
    const MAX_SIZE_BYTES = 500 * 1024;
    const INITIAL_QUALITY = 0.8;
    const MIN_QUALITY = 0.3;
    const QUALITY_STEP = 0.1;

    // Initialize dataUri to null before the loop
    let dataUri: string | null = null;
    
    // Loop to reduce quality until the image is under the size limit
    for (let quality = INITIAL_QUALITY; quality >= MIN_QUALITY; quality -= QUALITY_STEP) {
        // Convert the canvas to a data URL with the current quality setting
        dataUri = canvas.toDataURL('image/jpeg', quality);

        // Calculate the size of the data URI in bytes
        const sizeInBytes = Math.round((dataUri.length - 'data:image/jpeg;base64,'.length) * 3 / 4);

        // If the size is within the limit, return the data URI
        if (sizeInBytes <= MAX_SIZE_BYTES) {
            return dataUri;
        }
    }

    // If we exit the loop without returning, it means we couldn't compress the image enough
    throw new Error('Failed to compress image within the specified size limit.');
}