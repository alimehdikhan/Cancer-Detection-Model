const MAX_EDGE = 1024
const JPEG_QUALITY = 0.9

export class ImageReadError extends Error {
  constructor() {
    super('This file could not be read as an image')
    this.name = 'ImageReadError'
  }
}

/**
 * SHA-256 of the original file, hex-encoded. Used to memoise results for the session.
 * crypto.subtle only exists in secure contexts (https or localhost); elsewhere fall back to
 * a weaker key built from the file's metadata.
 */
export async function fingerprint(file: Blob & { name?: string; lastModified?: number }): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  return `meta:${file.name ?? ''}:${file.size}:${file.lastModified ?? 0}`
}

/** Output size for downscale(): the longest edge is at most `maxEdge`; never upscales, never 0. */
export function scaledSize(width: number, height: number, maxEdge = MAX_EDGE): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

/**
 * Decode with EXIF orientation applied, scale so the longest edge is at most 1024 px, and
 * re-encode as JPEG. Re-encoding also drops all metadata, including GPS location.
 */
export async function downscale(file: Blob): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new ImageReadError()
  }

  try {
    const { width, height } = scaledSize(bitmap.width, bitmap.height)

    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(width, height)
      const context = canvas.getContext('2d')
      if (!context) throw new ImageReadError()
      context.imageSmoothingQuality = 'high'
      context.drawImage(bitmap, 0, 0, width, height)
      return await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY })
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new ImageReadError()
    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, 0, 0, width, height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new ImageReadError())), 'image/jpeg', JPEG_QUALITY),
    )
  } finally {
    bitmap.close()
  }
}

/** First image file in a FileList, DataTransfer or clipboard payload. */
export function firstImage(files: Iterable<File> | ArrayLike<File> | null | undefined): File | undefined {
  if (!files) return undefined
  return Array.from(files).find((file) => file.type.startsWith('image/') || file.type === '')
}
