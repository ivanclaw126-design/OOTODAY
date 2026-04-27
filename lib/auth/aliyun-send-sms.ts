import DypnsapiClient, { SendSmsVerifyCodeRequest } from '@alicloud/dypnsapi20170525'
import { $OpenApiUtil } from '@alicloud/openapi-core'
import { Webhook } from 'standardwebhooks'

export type SupabaseSendSmsHookPayload = {
  user?: {
    phone?: string | null
  }
  sms?: {
    otp?: string | null
    token?: string | null
  }
  phone?: string | null
  token?: string | null
}

export type SendSmsVerifyCodeBody = {
  code?: string
  success?: boolean
  message?: string
  requestId?: string
  Code?: string
  Success?: boolean
  Message?: string
  RequestId?: string
}

export type SendSmsVerifyCodeResult = {
  body?: SendSmsVerifyCodeBody
}

export type AliyunSendSmsClient = {
  sendSmsVerifyCode(request: SendSmsVerifyCodeRequest): Promise<SendSmsVerifyCodeResult>
}

export type SendSmsHookEvent = {
  phone: string
  token: string
}

export type HookErrorCode =
  | 'unauthorized'
  | 'missing_payload'
  | 'unsupported_country'
  | 'invalid_phone'
  | 'rate_limited'
  | 'provider_unavailable'
  | 'provider_failed'

export class SendSmsHookError extends Error {
  code: HookErrorCode
  httpCode: number

  constructor(code: HookErrorCode, message: string, httpCode: number) {
    super(message)
    this.name = 'SendSmsHookError'
    this.code = code
    this.httpCode = httpCode
  }
}

export function normalizeSupabaseHookSecret(secret: string) {
  return secret.trim().replace(/^v\d+,whsec_/, '').replace(/^whsec_/, '')
}

export function verifySupabaseSendSmsHook(payload: string, headers: Headers, secret: string): SupabaseSendSmsHookPayload {
  try {
    const webhook = new Webhook(normalizeSupabaseHookSecret(secret))
    return webhook.verify(payload, Object.fromEntries(headers)) as SupabaseSendSmsHookPayload
  } catch {
    throw new SendSmsHookError('unauthorized', 'Invalid Supabase Send SMS Hook signature.', 401)
  }
}

export function extractSendSmsHookEvent(payload: SupabaseSendSmsHookPayload): SendSmsHookEvent {
  const phone = payload.user?.phone ?? payload.phone
  const token = payload.sms?.otp ?? payload.sms?.token ?? payload.token

  if (!phone || !token) {
    throw new SendSmsHookError('missing_payload', 'Send SMS Hook payload is missing phone or token.', 400)
  }

  return { phone, token }
}

export function normalizeChinaPhone(phone: string) {
  const normalized = phone.replace(/[\s-]/g, '')

  if (!normalized.startsWith('+86')) {
    throw new SendSmsHookError('unsupported_country', 'Only +86 phone numbers are supported by this SMS provider.', 400)
  }

  const phoneNumber = normalized.slice(3)

  if (!/^1\d{10}$/.test(phoneNumber)) {
    throw new SendSmsHookError('invalid_phone', 'Invalid mainland China phone number.', 400)
  }

  return {
    countryCode: '86',
    phoneNumber
  }
}

export function getAliyunPnvsEnv() {
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET
  const signName = process.env.ALIYUN_PNVS_SIGN_NAME
  const templateCode = process.env.ALIYUN_PNVS_TEMPLATE_CODE

  if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
    throw new SendSmsHookError('provider_unavailable', 'Aliyun PNVS SMS environment is not configured.', 500)
  }

  return { accessKeyId, accessKeySecret, signName, templateCode }
}

export function createAliyunPnvsClient(): AliyunSendSmsClient {
  const { accessKeyId, accessKeySecret } = getAliyunPnvsEnv()

  return new DypnsapiClient(new $OpenApiUtil.Config({
    accessKeyId,
    accessKeySecret,
    endpoint: 'dypnsapi.aliyuncs.com',
    regionId: 'cn-hangzhou',
    protocol: 'https'
  }))
}

export function buildSendSmsVerifyCodeRequest(phone: string, token: string) {
  const { signName, templateCode } = getAliyunPnvsEnv()
  const { countryCode, phoneNumber } = normalizeChinaPhone(phone)

  return new SendSmsVerifyCodeRequest({
    countryCode,
    phoneNumber,
    signName,
    templateCode,
    templateParam: JSON.stringify({
      code: token,
      min: '5'
    }),
    validTime: 300,
    interval: 60,
    duplicatePolicy: 1
  })
}

export function maskPhone(phone: string) {
  return phone.replace(/(\+86\d{3})\d{4}(\d{4})/, '$1****$2')
}

export function mapAliyunSendSmsError(responseBody: SendSmsVerifyCodeBody | undefined) {
  const aliyunCode = responseBody?.Code ?? responseBody?.code ?? 'UNKNOWN'
  const message = responseBody?.Message ?? responseBody?.message

  if (aliyunCode === 'MOBILE_NUMBER_ILLEGAL' || aliyunCode === 'INVALID_PARAMETERS') {
    return new SendSmsHookError('invalid_phone', message ?? 'Invalid phone number.', 400)
  }

  if (aliyunCode === 'BUSINESS_LIMIT_CONTROL' || aliyunCode === 'FREQUENCY_FAIL') {
    return new SendSmsHookError('rate_limited', message ?? 'SMS sending is rate limited.', 429)
  }

  if (aliyunCode === 'FUNCTION_NOT_OPENED') {
    return new SendSmsHookError('provider_unavailable', message ?? 'Aliyun PNVS SMS is not enabled.', 503)
  }

  return new SendSmsHookError('provider_failed', message ?? 'Aliyun PNVS SMS send failed.', 502)
}

function getAliyunThrownErrorBody(error: unknown): SendSmsVerifyCodeBody | undefined {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  const errorLike = error as {
    code?: string
    Code?: string
    message?: string
    Message?: string
    data?: {
      Code?: string
      code?: string
      Message?: string
      message?: string
      RequestId?: string
      requestId?: string
    }
  }

  if (errorLike.data?.Code || errorLike.data?.code) {
    return errorLike.data
  }

  if (errorLike.Code || errorLike.code) {
    return {
      Code: errorLike.Code,
      code: errorLike.code,
      Message: errorLike.Message,
      message: errorLike.message
    }
  }

  return undefined
}

export async function sendAliyunSmsVerifyCode(event: SendSmsHookEvent, client = createAliyunPnvsClient()) {
  const request = buildSendSmsVerifyCodeRequest(event.phone, event.token)
  let response: SendSmsVerifyCodeResult

  try {
    response = await client.sendSmsVerifyCode(request)
  } catch (error) {
    throw mapAliyunSendSmsError(getAliyunThrownErrorBody(error))
  }

  const body = response.body

  if ((body?.Code ?? body?.code) === 'OK' && (body?.Success ?? body?.success) === true) {
    return body as SendSmsVerifyCodeBody
  }

  throw mapAliyunSendSmsError(body)
}
