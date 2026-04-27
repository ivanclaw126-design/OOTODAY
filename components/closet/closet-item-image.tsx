import Image, { type ImageLoaderProps } from 'next/image'

const STORAGE_PUBLIC_PREFIX = '/storage/v1/object/public/'
const STORAGE_RENDER_PREFIX = '/storage/v1/render/image/public/'

function appendImageSizeParams(src: string, width: number, quality?: number) {
  const separator = src.includes('?') ? '&' : '?'
  return `${src}${separator}width=${width}&quality=${quality ?? 75}`
}

export function closetImageLoader({ src, width, quality }: ImageLoaderProps) {
  try {
    const imageUrl = new URL(src)

    if (imageUrl.pathname.startsWith(STORAGE_PUBLIC_PREFIX)) {
      imageUrl.pathname = imageUrl.pathname.replace(STORAGE_PUBLIC_PREFIX, STORAGE_RENDER_PREFIX)
      imageUrl.searchParams.set('width', String(width))
      imageUrl.searchParams.set('quality', String(quality ?? 75))
      return imageUrl.toString()
    }
  } catch {
    return appendImageSizeParams(src, width, quality)
  }

  return appendImageSizeParams(src, width, quality)
}

export function ClosetItemImage({
  src,
  alt,
  className,
  fit = 'cover',
  sizes = '(max-width: 768px) 50vw, 240px'
}: {
  src: string
  alt: string
  className?: string
  fit?: 'cover' | 'contain'
  sizes?: string
}) {
  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover'

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        loader={closetImageLoader}
        className={`${fitClass} ${className ?? ''}`.trim()}
        sizes={sizes}
      />
    </div>
  )
}
