import Image from 'next/image'
import { flagSrc } from '@/lib/worldcup/flags'

// Circular "ball" flag badge (style guide §3): a square flag cropped to a
// circle with a faint dark ring. Falls back to the team's emoji if no asset.
export default function TeamFlag({
  name,
  emoji,
  size = 22,
}: {
  name: string
  emoji?: string
  size?: number
}) {
  const src = flagSrc(name)
  if (!src) {
    return (
      <span style={{ fontSize: size }} className="leading-none">
        {emoji ?? '🏴'}
      </span>
    )
  }
  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className="inline-block rounded-full ring-1 ring-black/15 dark:ring-white/15"
    />
  )
}
