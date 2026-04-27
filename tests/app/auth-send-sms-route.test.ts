import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Webhook } from 'standardwebhooks'

const sdkMocks = vi.hoisted(() => {
  const sendSmsVerifyCode = vi.fn()
  const clientCtor = vi.fn(() => ({ sendSmsVerifyCode }))
  const requests: Array<Record<string, unknown>> = []

  return { sendSmsVerifyCode, clientCtor, requests }
})

vi.mock('@alicloud/dypnsapi20170525', () => ({
  default: sdkMocks.clientCtor,
  SendSmsVerifyCodeRequest: class SendSmsVerifyCodeRequest {
    constructor(map: Record<string, unknown>) {
      Object.assign(this, map)
      sdkMocks.requests.push(map)
    }
  }
}))

const hookSecret = Buffer.from('send-sms-hook-secret').toString('base64')

function signedRequest(payload: unknown, secret = hookSecret) {
  const rawPayload = JSON.stringify(payload)
  const timestamp = new Date()
  const webhook = new Webhook(secret)

  return new Request('https://ootoday-ecru.vercel.app/api/auth/send-sms', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'webhook-id': 'msg_123',
      'webhook-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
      'webhook-signature': webhook.sign('msg_123', timestamp, rawPayload)
    },
    body: rawPayload
  })
}

describe('send sms auth hook route', () => {
  beforeEach(() => {
    vi.resetModules()
    sdkMocks.sendSmsVerifyCode.mockReset()
    sdkMocks.clientCtor.mockClear()
    sdkMocks.requests.length = 0

    process.env.SUPABASE_SEND_SMS_HOOK_SECRET = `v1,whsec_${hookSecret}`
    process.env.ALIYUN_ACCESS_KEY_ID = 'ak-id'
    process.env.ALIYUN_ACCESS_KEY_SECRET = 'ak-secret'
    process.env.ALIYUN_PNVS_SIGN_NAME = 'OOTODAY'
    process.env.ALIYUN_PNVS_TEMPLATE_CODE = '100001'
  })

  it('sends Supabase SMS OTP through Aliyun PNVS with the hook token as TemplateParam code', async () => {
    sdkMocks.sendSmsVerifyCode.mockResolvedValue({
      body: {
        Code: 'OK',
        Success: true,
        RequestId: 'aliyun-request-1'
      }
    })

    const { POST } = await import('@/app/api/auth/send-sms/route')
    const response = await POST(
      signedRequest({
        user: { phone: '+8613800138000' },
        sms: { otp: '654321' }
      })
    )

    expect(response.status).toBe(200)
    expect(sdkMocks.clientCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        accessKeyId: 'ak-id',
        accessKeySecret: 'ak-secret',
        endpoint: 'dypnsapi.aliyuncs.com',
        regionId: 'cn-hangzhou'
      })
    )
    expect(sdkMocks.sendSmsVerifyCode).toHaveBeenCalledTimes(1)
    expect(sdkMocks.requests[0]).toMatchObject({
      countryCode: '86',
      phoneNumber: '13800138000',
      signName: 'OOTODAY',
      templateCode: '100001',
      validTime: 300,
      interval: 60,
      duplicatePolicy: 1
    })
    expect(JSON.parse(sdkMocks.requests[0].templateParam as string)).toEqual({
      code: '654321',
      min: '5'
    })
  })

  it('rejects unsigned requests before calling Aliyun', async () => {
    const { POST } = await import('@/app/api/auth/send-sms/route')
    const response = await POST(
      new Request('https://ootoday-ecru.vercel.app/api/auth/send-sms', {
        method: 'POST',
        body: JSON.stringify({ user: { phone: '+8613800138000' }, sms: { otp: '654321' } })
      })
    )
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.message).toContain('signature')
    expect(sdkMocks.sendSmsVerifyCode).not.toHaveBeenCalled()
  })

  it('allows only +86 numbers for the Aliyun PNVS channel', async () => {
    const { POST } = await import('@/app/api/auth/send-sms/route')
    const response = await POST(
      signedRequest({
        user: { phone: '+16505551234' },
        sms: { otp: '654321' }
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.message).toContain('+86')
    expect(sdkMocks.sendSmsVerifyCode).not.toHaveBeenCalled()
  })

  it('maps Aliyun frequency errors to a hook rate-limit error', async () => {
    sdkMocks.sendSmsVerifyCode.mockResolvedValue({
      body: {
        Code: 'FREQUENCY_FAIL',
        Success: false,
        Message: 'Check frequency fail.'
      }
    })

    const { POST } = await import('@/app/api/auth/send-sms/route')
    const response = await POST(
      signedRequest({
        user: { phone: '+8613800138000' },
        sms: { otp: '654321' }
      })
    )
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body.error.http_code).toBe(429)
    expect(body.error.message).toBe('Check frequency fail.')
  })

  it('maps thrown Aliyun mobile number errors to a hook validation error', async () => {
    sdkMocks.sendSmsVerifyCode.mockRejectedValue({
      code: 'MOBILE_NUMBER_ILLEGAL',
      message: 'The mobile number is illegal.'
    })

    const { POST } = await import('@/app/api/auth/send-sms/route')
    const response = await POST(
      signedRequest({
        user: { phone: '+8613800138000' },
        sms: { otp: '654321' }
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.http_code).toBe(400)
    expect(body.error.message).toBe('The mobile number is illegal.')
  })
})
