// coding-standard: maintained

/**
 * The one-line note under a "pick one of these" control, describing the option
 * currently selected.
 *
 * This is the shape that replaced a description under every option. A per-option
 * sentence is read at the width of one grid column — ~95px in a 3-up grid inside
 * the 380px Customize rail — so it wrapped to four lines and made a four-option
 * picker taller than the screen it described. Written once, under the control,
 * it gets the full width and only ever has to explain the choice already made.
 *
 * **Never prefixed with the option's own name.** The selected step is
 * highlighted directly above, so the name repeats it — and several descriptions
 * carry an em dash of their own ("Gently rounded corners — the default"), which
 * a "Soft — " prefix turned into an unreadable two-dash sentence.
 *
 * Lives in `ui/` because its three callers do not share a folder:
 * `SegmentedField` and `SwatchField` here, `TemplatePicker` over in the
 * customize parts — and `ui/` may not import from `components/`.
 */
export function FieldCaption({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs leading-snug text-muted-foreground">{children}</p>
  );
}
