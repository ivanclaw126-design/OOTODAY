import { describe, expect, it } from 'vitest'
import { buildClosetUploadPath } from '@/lib/closet/build-upload-path'

describe('buildClosetUploadPath', () => {
  it('keeps a supported file extension and nests under the user id', () => {
    expect(buildClosetUploadPath('user-1', 'shirt.PNG', 'fixed-id')).toBe('user-1/fixed-id.png')
  })

  it('normalizes jpeg to jpg', () => {
    expect(buildClosetUploadPath('user-1', 'shirt.JPEG', 'fixed-id')).toBe('user-1/fixed-id.jpg')
  })

  it('falls back to jpg for unsafe or misleading extensions', () => {
    expect(buildClosetUploadPath('user-1', 'archive.jpg.exe', 'fixed-id')).toBe('user-1/fixed-id.jpg')
    expect(buildClosetUploadPath('user-1', 'shirt.', 'fixed-id')).toBe('user-1/fixed-id.jpg')
    expect(buildClosetUploadPath('user-1', '.env', 'fixed-id')).toBe('user-1/fixed-id.jpg')
    expect(buildClosetUploadPath('user-1', 'shirt.jp g', 'fixed-id')).toBe('user-1/fixed-id.jpg')
  })
})
