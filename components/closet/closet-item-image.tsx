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
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full ${fitClass} ${className ?? ''}`.trim()}
      />
    </div>
  )
}
