/** Crops an image file to a centred square and returns a small JPEG data URL. */
export async function resizeImage(file: File, size = 160): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('That file is not an image.')
  const bitmap = await createImageBitmap(file)
  try {
    const side = Math.min(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not read that image.')
    ctx.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    )
    return canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    bitmap.close()
  }
}
