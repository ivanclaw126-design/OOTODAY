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
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-cover transition-transform duration-200 ${rotated ? 'rotate-90' : ''} ${className ?? ''}`.trim()}
    />
  )
}
