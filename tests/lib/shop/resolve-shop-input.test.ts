import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('resolveShopInput', () => {
  it('accepts direct image urls', async () => {
    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('https://example.com/item.jpg')).resolves.toEqual({
      error: null,
      imageUrl: 'https://example.com/item.jpg',
      sourceTitle: null,
      sourceUrl: 'https://example.com/item.jpg'
    })
  })

  it('rejects localhost and private network urls', async () => {
    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('http://127.0.0.1:3000/item.jpg')).resolves.toEqual({
      error: '暂不支持解析本地或内网地址',
      imageUrl: null,
      sourceTitle: null,
      sourceUrl: null
    })
  })

  it('extracts og image and title from a product page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'text/html; charset=utf-8'
        },
        text: async () => `
          <html>
            <head>
              <meta property="og:title" content="Soft Knit Cardigan" />
              <meta property="og:image" content="/images/cardigan.jpg" />
            </head>
          </html>
        `
      }) as unknown as typeof fetch
    )

    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('https://shop.example.com/products/cardigan')).resolves.toEqual({
      error: null,
      imageUrl: 'https://shop.example.com/images/cardigan.jpg',
      sourceTitle: 'Soft Knit Cardigan',
      sourceUrl: 'https://shop.example.com/products/cardigan'
    })
  })

  it('extracts the first image from jd imageList payloads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'text/html; charset=utf-8'
        },
        text: async () => `
          <html>
            <head>
              <title>JD Product</title>
            </head>
            <body>
              <script>
                pageConfig = {
                  product: {
                    imageList: ["jfs/t1/demo/demo-image.jpg", "jfs/t1/demo/demo-image-2.jpg"]
                  }
                }
              </script>
            </body>
          </html>
        `
      }) as unknown as typeof fetch
    )

    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('https://item.jd.com/100046392323.html')).resolves.toEqual({
      error: null,
      imageUrl: 'https://img14.360buyimg.com/n1/jfs/t1/demo/demo-image.jpg',
      sourceTitle: 'JD Product',
      sourceUrl: 'https://item.jd.com/100046392323.html'
    })
  })

  it('rejects taobao login wall pages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'text/html; charset=utf-8'
        },
        text: async () => `
          <html>
            <script>
              var host = "https://login.taobao.com/member/login.jhtml?redirectURL=";
            </script>
          </html>
        `
      }) as unknown as typeof fetch
    )

    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('https://item.taobao.com/item.htm?id=1')).resolves.toEqual({
      error: '淘宝链接当前会跳登录拦截，请先贴商品图片链接',
      imageUrl: null,
      sourceTitle: null,
      sourceUrl: null
    })
  })

  it('rejects generic pinduoduo share images', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'text/html; charset=utf-8'
        },
        text: async () => `
          <html>
            <head>
              <meta property="og:title" content="拼多多商城" />
              <meta property="og:image" content="https://funimg.pddpic.com/base/share_logo.jpg" />
            </head>
          </html>
        `
      }) as unknown as typeof fetch
    )

    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('https://mobile.yangkeduo.com/goods.html?goods_id=1')).resolves.toEqual({
      error: '这个链接当前只能拿到站点通用分享图，请直接贴商品图片链接',
      imageUrl: null,
      sourceTitle: null,
      sourceUrl: null
    })
  })

  it('returns a Dewu-specific error when the page is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        headers: {
          get: () => 'text/html; charset=utf-8'
        }
      }) as unknown as typeof fetch
    )

    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('https://m.dewu.com/product-demo.html')).resolves.toEqual({
      error: '得物链接当前无法稳定解析，请先贴商品图片链接',
      imageUrl: null,
      sourceTitle: null,
      sourceUrl: null
    })
  })

  it('accepts direct image urls without a file extension when content-type is image', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'image/jpeg'
        },
        text: async () => ''
      }) as unknown as typeof fetch
    )

    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('https://images.example.com/photo?id=123')).resolves.toEqual({
      error: null,
      imageUrl: 'https://images.example.com/photo?id=123',
      sourceTitle: null,
      sourceUrl: 'https://images.example.com/photo?id=123'
    })
  })
})
