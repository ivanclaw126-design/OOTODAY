import Image from 'next/image'

export function ClosetItemImage({
  src,
  alt,
  className,
  fit = 'cover'
}: {
  src: string
  alt: string
  className?: string
  fit?: 'cover' | 'contain'
}) {
  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover'

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        className={`${fitClass} ${className ?? ''}`.trim()}
        sizes="(max-width: 768px) 50vw, 240px"
      />
    </div>
  )
}
