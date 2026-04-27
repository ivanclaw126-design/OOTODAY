import Image from 'next/image'

function withRefreshKey(src: string, refreshKey: number | string | undefined) {
  if (refreshKey === undefined) {
    return src
  }

  const [urlWithoutHash, hash = ''] = src.split('#')
  const separator = urlWithoutHash.includes('?') ? '&' : '?'

  return `${urlWithoutHash}${separator}r=${encodeURIComponent(String(refreshKey))}${hash ? `#${hash}` : ''}`
}

export function ClosetItemImage({
  src,
  alt,
  className,
  fit = 'cover',
  refreshKey
}: {
  src: string
  alt: string
  className?: string
  fit?: 'cover' | 'contain'
  refreshKey?: number | string
}) {
  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover'
  const imageSrc = withRefreshKey(src, refreshKey)

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        src={imageSrc}
        alt={alt}
        fill
        unoptimized
        className={`${fitClass} ${className ?? ''}`.trim()}
        sizes="(max-width: 768px) 50vw, 240px"
      />
    </div>
  )
}
