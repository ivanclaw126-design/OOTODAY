export function ClosetItemImage({
  src,
  alt,
  rotated = false,
  className
}: {
  src: string
  alt: string
  rotated?: boolean
  className?: string
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-200 ${
          rotated ? 'rotate-90' : ''
        } ${className ?? ''}`.trim()}
      />
    </div>
  )
}
