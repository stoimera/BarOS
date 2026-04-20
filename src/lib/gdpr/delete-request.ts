import { z } from 'zod'
import { commonSchemas } from '@/lib/security/validation'

export const GDPR_FULL_DELETE_CONFIRMATION_PHRASE = 'DELETE_MY_CUSTOMER_DATA' as const

const deleteBodyCore = z.object({
  anonymize: z.boolean().optional().default(false),
  confirmationPhrase: z.string().optional(),
})

export const gdprDeleteRequestSchema = deleteBodyCore
  .extend({
    customerId: commonSchemas.uuid,
  })
  .superRefine((val, ctx) => {
    if (!val.anonymize && val.confirmationPhrase !== GDPR_FULL_DELETE_CONFIRMATION_PHRASE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `For full deletion, confirmationPhrase must be exactly "${GDPR_FULL_DELETE_CONFIRMATION_PHRASE}".`,
        path: ['confirmationPhrase'],
      })
    }
  })

/** Self-service erasure for the authenticated customer (no `customerId` in body). */
export const gdprDeleteMeRequestSchema = deleteBodyCore.superRefine((val, ctx) => {
  if (!val.anonymize && val.confirmationPhrase !== GDPR_FULL_DELETE_CONFIRMATION_PHRASE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `For full deletion, confirmationPhrase must be exactly "${GDPR_FULL_DELETE_CONFIRMATION_PHRASE}".`,
      path: ['confirmationPhrase'],
    })
  }
})
