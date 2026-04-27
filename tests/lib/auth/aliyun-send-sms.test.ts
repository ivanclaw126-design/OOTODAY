import { describe, expect, it } from 'vitest'
import {
  extractSendSmsHookEvent,
  mapAliyunSendSmsError,
  normalizeChinaPhone,
  SendSmsHookError
} from '@/lib/auth/aliyun-send-sms'

describe('aliyun send sms helpers', () => {
  it('extracts the phone and Supabase sms otp from the hook payload', () => {
    expect(
      extractSendSmsHookEvent({
        user: { phone: '+8613800138000' },
        sms: { otp: '123456' }
      })
    ).toEqual({
      phone: '+8613800138000',
      token: '123456'
    })
  })

  it('normalizes +86 phone numbers for Aliyun PNVS request fields', () => {
    expect(normalizeChinaPhone('+86 138-0013-8000')).toEqual({
      countryCode: '86',
      phoneNumber: '13800138000'
    })
    expect(normalizeChinaPhone('8613800138000')).toEqual({
      countryCode: '86',
      phoneNumber: '13800138000'
    })
    expect(normalizeChinaPhone('13800138000')).toEqual({
      countryCode: '86',
      phoneNumber: '13800138000'
    })
  })

  it('rejects non-mainland phone numbers before the provider call', () => {
    expect(() => normalizeChinaPhone('+85251234567')).toThrow(SendSmsHookError)
  })

  it('maps Aliyun business and frequency limits to 429', () => {
    expect(mapAliyunSendSmsError({ Code: 'BUSINESS_LIMIT_CONTROL', Message: 'day limit' })).toMatchObject({
      code: 'rate_limited',
      httpCode: 429,
      message: 'day limit'
    })
    expect(mapAliyunSendSmsError({ Code: 'FREQUENCY_FAIL', Message: 'frequency limit' })).toMatchObject({
      code: 'rate_limited',
      httpCode: 429,
      message: 'frequency limit'
    })
  })
})
