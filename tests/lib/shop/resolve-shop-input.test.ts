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
      imageCandidates: ['https://example.com/item.jpg'],
      sourceTitle: null,
      sourceUrl: 'https://example.com/item.jpg'
    })
  })

  it('rejects localhost and private network urls', async () => {
    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('http://127.0.0.1:3000/item.jpg')).resolves.toEqual({
      error: '暂不支持解析本地或内网地址',
      imageUrl: null,
      imageCandidates: [],
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
      imageCandidates: ['https://shop.example.com/images/cardigan.jpg'],
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
      imageCandidates: [
        'https://img14.360buyimg.com/n1/jfs/t1/demo/demo-image.jpg',
        'https://img14.360buyimg.com/n1/jfs/t1/demo/demo-image-2.jpg'
      ],
      sourceTitle: 'JD Product',
      sourceUrl: 'https://item.jd.com/100046392323.html'
    })
  })

  it('extracts taobao images from auctionImages payloads before login-wall fallback', async () => {
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
              <title>淘宝商品</title>
            </head>
            <body>
              <script>
                window.__INITIAL_STATE__ = {
                  item: {
                    title: "法式短款开衫"
                  },
                  itemDO: {
                    title: "法式短款开衫",
                    auctionImages: ["//img.alicdn.com/imgextra/i1/demo/demo-main.jpg", "//img.alicdn.com/imgextra/i1/demo/demo-2.jpg"]
                  }
                }
              </script>
            </body>
          </html>
        `
      }) as unknown as typeof fetch
    )

    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('https://item.taobao.com/item.htm?id=1')).resolves.toEqual({
      error: null,
      imageUrl: 'https://img.alicdn.com/imgextra/i1/demo/demo-main.jpg',
      imageCandidates: [
        'https://img.alicdn.com/imgextra/i1/demo/demo-main.jpg',
        'https://img.alicdn.com/imgextra/i1/demo/demo-2.jpg'
      ],
      sourceTitle: '法式短款开衫',
      sourceUrl: 'https://item.taobao.com/item.htm?id=1'
    })
  })

  it('prefers a cleaner single-item taobao image over a model lookbook image', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'text/html; charset=utf-8'
        },
        text: async () => `
          <html>
            <body>
              <script>
                window.__INITIAL_STATE__ = {
                  itemDO: {
                    title: "羊绒针织开衫",
                    auctionImages: [
                      "https://img.alicdn.com/look/model-full-body.jpg",
                      "https://img.alicdn.com/imgextra/i1/demo/goods-main.jpg"
                    ]
                  }
                }
              </script>
            </body>
          </html>
        `
      }) as unknown as typeof fetch
    )

    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('https://item.taobao.com/item.htm?id=2')).resolves.toEqual({
      error: null,
      imageUrl: 'https://img.alicdn.com/imgextra/i1/demo/goods-main.jpg',
      imageCandidates: [
        'https://img.alicdn.com/imgextra/i1/demo/goods-main.jpg',
        'https://img.alicdn.com/look/model-full-body.jpg'
      ],
      sourceTitle: '羊绒针织开衫',
      sourceUrl: 'https://item.taobao.com/item.htm?id=2'
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
      imageCandidates: [],
      sourceTitle: null,
      sourceUrl: null
    })
  })

  it('extracts a non-generic pinduoduo image from preload state payloads', async () => {
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
              <title>拼多多商品</title>
            </head>
            <body>
              <script>
                window.rawData = {
                  goods: {
                    goodsName: "羊毛混纺大衣",
                    hdThumbUrl: "https:\\/\\/funimg.pddpic.com\\/goods-image-main.jpeg"
                  }
                }
              </script>
            </body>
          </html>
        `
      }) as unknown as typeof fetch
    )

    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('https://mobile.yangkeduo.com/goods.html?goods_id=2')).resolves.toEqual({
      error: null,
      imageUrl: 'https://funimg.pddpic.com/goods-image-main.jpeg',
      imageCandidates: ['https://funimg.pddpic.com/goods-image-main.jpeg'],
      sourceTitle: '羊毛混纺大衣',
      sourceUrl: 'https://mobile.yangkeduo.com/goods.html?goods_id=2'
    })
  })

  it('filters out non-image embedded urls before choosing candidates', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: () => 'text/html; charset=utf-8'
          },
          text: async () => `
            <html>
              <body>
                <script>
                  window.__NUXT__ = {
                    data: [{
                      detail: {
                        title: "测试商品",
                        galleryList: [{
                          url: "https://api.example.com/product/123"
                        }, {
                          url: "https://img.alicdn.com/imgextra/i1/demo/clean-product.jpg"
                        }]
                      }
                    }]
                  }
                </script>
              </body>
            </html>
          `
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: {
            get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null)
          }
        }) as unknown as typeof fetch
    )

    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('https://m.dewu.com/product-demo-3.html')).resolves.toEqual({
      error: null,
      imageUrl: 'https://img.alicdn.com/imgextra/i1/demo/clean-product.jpg',
      imageCandidates: ['https://img.alicdn.com/imgextra/i1/demo/clean-product.jpg'],
      sourceTitle: '测试商品',
      sourceUrl: 'https://m.dewu.com/product-demo-3.html'
    })
  })

  it('filters out embedded private-network image candidates', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'text/html; charset=utf-8'
        },
        text: async () => `
          <html>
            <body>
              <script>
                window.__INITIAL_STATE__ = {
                  itemDO: {
                    title: "安全测试商品",
                    auctionImages: [
                      "http://127.0.0.1/internal.jpg",
                      "https://img.alicdn.com/imgextra/i1/demo/safe-main.jpg"
                    ]
                  }
                }
              </script>
            </body>
          </html>
        `
      }) as unknown as typeof fetch
    )

    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('https://item.taobao.com/item.htm?id=3')).resolves.toEqual({
      error: null,
      imageUrl: 'https://img.alicdn.com/imgextra/i1/demo/safe-main.jpg',
      imageCandidates: ['https://img.alicdn.com/imgextra/i1/demo/safe-main.jpg'],
      sourceTitle: '安全测试商品',
      sourceUrl: 'https://item.taobao.com/item.htm?id=3'
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
      imageCandidates: [],
      sourceTitle: null,
      sourceUrl: null
    })
  })

  it('extracts dewu image urls from embedded gallery payloads when the page is reachable', async () => {
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
              <title>得物商品</title>
            </head>
            <body>
              <script>
                window.__NUXT__ = {
                  data: [{
                    detail: {
                      title: "复古机车夹克",
                      galleryList: [{
                        url: "https:\\/\\/du-image.poizon.com\\/main-image.webp"
                      }]
                    }
                  }]
                }
              </script>
            </body>
          </html>
        `
      }) as unknown as typeof fetch
    )

    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('https://m.dewu.com/product-demo.html')).resolves.toEqual({
      error: null,
      imageUrl: 'https://du-image.poizon.com/main-image.webp',
      imageCandidates: ['https://du-image.poizon.com/main-image.webp'],
      sourceTitle: '复古机车夹克',
      sourceUrl: 'https://m.dewu.com/product-demo.html'
    })
  })

  it('prefers a cleaner dewu product image over a model gallery image', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'text/html; charset=utf-8'
        },
        text: async () => `
          <html>
            <body>
              <script>
                window.__NUXT__ = {
                  data: [{
                    detail: {
                      title: "工装短外套",
                      galleryList: [
                        "https://du-image.poizon.com/look-model-scene.webp",
                        "https://du-image.poizon.com/product-main-cover.webp"
                      ]
                    }
                  }]
                }
              </script>
            </body>
          </html>
        `
      }) as unknown as typeof fetch
    )

    const { resolveShopInput } = await import('@/lib/shop/resolve-shop-input')

    await expect(resolveShopInput('https://m.dewu.com/product-demo-2.html')).resolves.toEqual({
      error: null,
      imageUrl: 'https://du-image.poizon.com/product-main-cover.webp',
      imageCandidates: [
        'https://du-image.poizon.com/product-main-cover.webp',
        'https://du-image.poizon.com/look-model-scene.webp'
      ],
      sourceTitle: '工装短外套',
      sourceUrl: 'https://m.dewu.com/product-demo-2.html'
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
      imageCandidates: [],
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
      imageCandidates: ['https://images.example.com/photo?id=123'],
      sourceTitle: null,
      sourceUrl: 'https://images.example.com/photo?id=123'
    })
  })
})
