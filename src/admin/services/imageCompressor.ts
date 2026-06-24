/** 客户端图像压缩 + WebP 转换
 *  最大 256x256，等比缩放，质量 0.85
 */

export interface CompressResult {
  blob: Blob
  dataUrl: string
  width: number
  height: number
  originalSize: number
  compressedSize: number
  filename: string
}

export async function compressImage(
  file: File | Blob,
  opts: { maxSize?: number; quality?: number } = {}
): Promise<CompressResult> {
  const maxSize = opts.maxSize || 256
  const quality = opts.quality || 0.85
  const originalSize = file.size

  const img = await loadImage(file)
  const ratio = Math.min(1, maxSize / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * ratio))
  const h = Math.max(1, Math.round(img.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, w, h)

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas 转换失败'))),
      'image/webp',
      quality,
    )
  })

  const dataUrl = canvas.toDataURL('image/webp', quality)
  const originalName = (file as File).name || 'icon'
  const base = originalName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 40) || 'icon'
  const filename = `${base}.webp`

  return { blob, dataUrl, width: w, height: h, originalSize, compressedSize: blob.size, filename }
}

function loadImage(src: string | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图像加载失败'))
    img.src = src instanceof Blob ? URL.createObjectURL(src) : src
  })
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const idx = result.indexOf(',')
      resolve(idx >= 0 ? result.slice(idx + 1) : result)
    }
    reader.onerror = () => reject(new Error('Base64 读取失败'))
    reader.readAsDataURL(blob)
  })
}

export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/** 根据网站名称生成安全文件名 */
export function slugifyForIcon(name: string): string {
  const base = (name || '').trim()
  if (!base) return 'icon'
  return base
    .replace(/[\/\\:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'icon'
}
