const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const OUTPUT_MAX_PX = 128;
const JPEG_QUALITY = 0.85;

export async function resizeImageToDataUrl(file: Blob): Promise<string> {
    if (!file.type.startsWith("image/")) {
        throw new Error("Selecione um arquivo de imagem.");
    }
    if (file.size > MAX_SOURCE_BYTES) {
        throw new Error("A imagem é grande demais. Use um arquivo de até 5 MB.");
    }

    const bitmap = await createImageBitmap(file);
    try {
        const side = Math.min(bitmap.width, bitmap.height);
        const sx = (bitmap.width - side) / 2;
        const sy = (bitmap.height - side) / 2;
        const out = Math.min(OUTPUT_MAX_PX, side);

        const canvas = document.createElement("canvas");
        canvas.width = out;
        canvas.height = out;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Não foi possível processar a imagem.");
        }
        ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, out, out);
        return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    } finally {
        bitmap.close();
    }
}
