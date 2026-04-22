'use client'

export type CropBox = {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export const MIN_CROP_BOXES = 2
export const MAX_CROP_BOXES = 4

const MIN_BOX_SIZE = 0.12

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function sanitizeDimension(value: number) {
  return clamp(Number.isFinite(value) ? value : MIN_BOX_SIZE, MIN_BOX_SIZE, 1)
}

export function sanitizeCropBox(box: CropBox): CropBox {
  const width = sanitizeDimension(box.width)
  const height = sanitizeDimension(box.height)

  return {
    ...box,
    width,
    height,
    x: clamp(Number.isFinite(box.x) ? box.x : 0, 0, 1 - width),
    y: clamp(Number.isFinite(box.y) ? box.y : 0, 0, 1 - height)
  }
}

export function moveCropBox(box: CropBox, deltaX: number, deltaY: number): CropBox {
  return sanitizeCropBox({
    ...box,
    x: box.x + deltaX,
    y: box.y + deltaY
  })
}

export function resizeCropBox(box: CropBox, deltaWidth: number, deltaHeight: number): CropBox {
  return sanitizeCropBox({
    ...box,
    width: box.width + deltaWidth,
    height: box.height + deltaHeight
  })
}

export function createDefaultCropBox(index: number): CropBox {
  const columns = 2
  const column = index % columns
  const row = Math.floor(index / columns)

  return sanitizeCropBox({
    id: `crop-${index + 1}`,
    x: 0.08 + column * 0.44,
    y: 0.08 + row * 0.44,
    width: 0.36,
    height: 0.36
  })
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load collage image'))
    }

    image.src = objectUrl
  })
}

export async function splitCollageFile(file: File, boxes: CropBox[]): Promise<File[]> {
  const sanitizedBoxes = boxes.map(sanitizeCropBox)
  const image = await loadImage(file)

  return Promise.all(
    sanitizedBoxes.map(async (box, index) => {
      const cropWidth = Math.max(1, Math.round(image.naturalWidth * box.width))
      const cropHeight = Math.max(1, Math.round(image.naturalHeight * box.height))
      const cropX = Math.round(image.naturalWidth * box.x)
      const cropY = Math.round(image.naturalHeight * box.y)
      const canvas = document.createElement('canvas')

      canvas.width = cropWidth
      canvas.height = cropHeight

      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Canvas context unavailable')
      }

      context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((nextBlob) => {
          if (!nextBlob) {
            reject(new Error('Failed to export crop'))
            return
          }
          resolve(nextBlob)
        }, file.type || 'image/jpeg')
      })

      const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
      const nextName = file.name.replace(/\.[^.]+$/, '') || 'closet-collage'

      return new File([blob], `${nextName}-split-${index + 1}.${extension}`, {
        type: blob.type || file.type || 'image/jpeg'
      })
    })
  )
}
