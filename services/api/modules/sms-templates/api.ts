// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type {
  NotificationSettings,
  Operations,
  SmsTemplatePreview,
} from "@/types/api";

/**
 * The SMS template editor (backend `docs/plan/sms-template-editor.md`).
 *
 * The server is the only counter: this module never measures a length or
 * checks an alphabet — the preview endpoint answers, and a second counter here
 * is how a "1 SMS" badge and a two-segment charge would happen.
 *
 * Its own module rather than `organization/` — that module predates the coding
 * standard and is past the size a new concern should be added to.
 */

/** One draft SMS — the body of both calls. Taken from the spec, never hand-written. */
export type SmsTemplateBody = NonNullable<
  Operations["put_api_organization_notifications_sms_template"]["requestBody"]
>["content"]["application/json"];

/**
 * The slice of the notifications PATCH this editor owns: the SMS store name.
 * `null` hands the name back to the automatic resolution.
 */
export interface SmsStoreNameBody {
  sms: { storeName: string | null };
}

export const smsTemplatesApi = {
  /** POST …/sms-template/preview — rule errors by code, the budget, example renders. */
  preview: (body: SmsTemplateBody): Promise<ApiResponse<SmsTemplatePreview>> =>
    apiClient.post("/organization/notifications/sms-template/preview", body),

  /** PUT …/sms-template — save; an empty `body` resets to the built-in. */
  save: (body: SmsTemplateBody): Promise<ApiResponse<NotificationSettings>> =>
    apiClient.put("/organization/notifications/sms-template", body),

  /** PATCH /organization/notifications with only `sms.storeName`. */
  saveStoreName: (
    body: SmsStoreNameBody,
  ): Promise<ApiResponse<NotificationSettings>> =>
    apiClient.patch("/organization/notifications", body),
};
