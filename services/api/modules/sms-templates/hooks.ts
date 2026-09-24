// coding-standard: maintained
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { queryKeys } from "@/services/api/query-keys";
import { handleMutationSuccess } from "../query-helpers";
import {
  smsTemplatesApi,
  type SmsStoreNameBody,
  type SmsTemplateBody,
} from "./api";

/** SMS template editor (backend `docs/plan/sms-template-editor.md`). */

/**
 * POST …/sms-template/preview, as a QUERY: it stores nothing, and a query
 * keyed by the draft gives de-duplication and "keep the last answer on screen
 * while the next one loads" for free. The caller debounces the draft; pass
 * `null` while there is nothing to check.
 */
export const useSmsTemplatePreview = (draft: SmsTemplateBody | null) =>
  useQuery({
    queryKey: queryKeys.organization.smsTemplatePreview(draft ?? {}),
    queryFn: () => smsTemplatesApi.preview(draft as SmsTemplateBody),
    select: (res) => res.data,
    enabled: draft !== null,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

/**
 * PUT …/sms-template. Answers with the full settings payload, so the matrix
 * (whose preview line now quotes the new wording) is seeded, not refetched.
 */
export const useSaveSmsTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SmsTemplateBody) => smsTemplatesApi.save(body),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "SMS saved");
      queryClient.setQueryData(queryKeys.organization.notifications(), result);
    },
    onError: handleMutationError,
  });
};

/**
 * PATCH the SMS store name. Every preview renders it, so the cached previews
 * are dropped along with seeding the settings.
 */
export const useSaveSmsStoreName = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SmsStoreNameBody) => smsTemplatesApi.saveStoreName(body),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "SMS store name saved");
      queryClient.setQueryData(queryKeys.organization.notifications(), result);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organization.smsTemplatePreviews(),
      });
    },
    onError: handleMutationError,
  });
};
