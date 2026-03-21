<script lang="ts">
    import { compressImage } from "$lib/utils/image-compression";

    function handleCompress() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                try {
                    const compressedDataUri = await compressImage(file);
                    console.log('Original size:', file.size, 'bytes');
                    console.log('new Image URI: ', compressedDataUri);
                    
                    (document.getElementById('compressed-image') as HTMLImageElement)!.src = compressedDataUri;
                } catch (error) {
                    console.error('Compression error:', error);
                }
            }
        };
        input.click();
    }
</script>

<!-- svelte-ignore a11y_img_redundant_alt -->
<img id="compressed-image" alt="Compressed Image">
<button on:click={handleCompress}>Compress Image</button>