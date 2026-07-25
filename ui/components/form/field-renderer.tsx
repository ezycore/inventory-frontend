// coding-standard: maintained
import type { ReactNode } from "react";
import type { FieldRenderContext } from "./field-render-context";
import {
  renderPassword,
  renderRichText,
  renderTextInput,
  renderTextarea,
} from "./field-text-inputs";
import { renderNumberInput } from "./field-number-input";
import { renderFuseSelect, renderSelect } from "./field-select-inputs";
import { renderCheckbox, renderRadioGroup, renderSwitch } from "./field-choice-inputs";
import { renderFileUpload } from "./field-file-input";
import { renderCustom, renderCustomFields, renderDate } from "./field-misc-inputs";

/**
 * Maps a field's `type` to its renderer. Kept a plain switch (not a lookup map)
 * so related types can share a branch and unknown types fall through to null.
 */
export function renderField(ctx: FieldRenderContext): ReactNode {
  switch (ctx.field.type) {
    case "input":
      return renderTextInput(ctx);
    case "number":
      return renderNumberInput(ctx);
    case "textarea":
      return renderTextarea(ctx);
    case "richtext":
      return renderRichText(ctx);
    case "password":
      return renderPassword(ctx);
    case "select":
      return renderSelect(ctx);
    case "fuseSelect":
      return renderFuseSelect(ctx);
    case "checkbox":
      return renderCheckbox(ctx);
    case "switch":
      return renderSwitch(ctx);
    case "radio-group":
      return renderRadioGroup(ctx);
    case "date":
      return renderDate(ctx);
    case "file-upload":
      return renderFileUpload(ctx);
    case "custom":
      return renderCustom(ctx);
    case "custom-fields":
      return renderCustomFields(ctx);
    default:
      return null;
  }
}
