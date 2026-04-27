import { NextResponse } from 'next/server'
import {
  extractSendSmsHookEvent,
  maskPhone,
  sendAliyunSmsVerifyCode,
  SendSmsHookError,
  verifySupabaseSendSmsHook
} from '@/lib/auth/aliyun-send-sms'

export const runtime = 'nodejs'

function hookErrorResponse(error: SendSmsHookError) {
  return NextResponse.json(
    {
      error: {
        http_code: error.httpCode,
        message: error.message
      }
    },
    { status: error.httpCode }
  )
}

export async function POST(request: Request) {
  const hookSecret = process.env.SUPABASE_SEND_SMS_HOOK_SECRET

  if (!hookSecret) {
    console.error('[send-sms-hook] Missing SUPABASE_SEND_SMS_HOOK_SECRET.')
    return hookErrorResponse(
      new SendSmsHookError('provider_unavailable', 'Supabase Send SMS Hook secret is not configured.', 500)
    )
  }

  try {
    const rawPayload = await request.text()
    const payload = verifySupabaseSendSmsHook(rawPayload, request.headers, hookSecret)
    const event = extractSendSmsHookEvent(payload)
    const result = await sendAliyunSmsVerifyCode(event)

    console.info('[send-sms-hook] Aliyun PNVS SMS sent.', {
      phone: maskPhone(event.phone),
      requestId: result.RequestId ?? result.requestId
    })

    return NextResponse.json({}, { status: 200 })
  } catch (error) {
    if (error instanceof SendSmsHookError) {
      console.warn('[send-sms-hook] SMS send rejected.', {
        code: error.code,
        httpCode: error.httpCode,
        message: error.message
      })
      return hookErrorResponse(error)
    }

    console.error('[send-sms-hook] Unexpected SMS send failure.', error)
    return hookErrorResponse(new SendSmsHookError('provider_failed', 'Unexpected SMS send failure.', 502))
  }
}
