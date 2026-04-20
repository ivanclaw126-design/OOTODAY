const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'avif'])

function getSafeImageExtension(fileName: string) {
  const trimmedFileName = fileName.trim()
  const lastDotIndex = trimmedFileName.lastIndexOf('.')

  if (lastDotIndex <= 0 || lastDotIndex === trimmedFileName.length - 1) {
    return 'jpg'
  }

  const extension = trimmedFileName.slice(lastDotIndex + 1).toLowerCase()

  if (!/^[a-z0-9]{1,10}$/.test(extension)) {
    return 'jpg'
  }

  if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    return 'jpg'
  }

  return extension === 'jpeg' ? 'jpg' : extension
}

export function buildClosetUploadPath(userId: string, fileName: string, randomId = crypto.randomUUID()) {
  return `${userId}/${randomId}.${getSafeImageExtension(fileName)}`
}
