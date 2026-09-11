// coding-standard: maintained
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle
} from '../sheet'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '../dialog'
import type { DynamicFormProps } from '@/ui/components/form/type';
import { stripHiddenValues } from '@/ui/components/form/type';
import { Card, CardContent, CardHeader, CardTitle } from '../card'
import { Skeleton } from '../skeleton'
import { Button } from '../button'
import { FC, useCallback, useState } from 'react'
import { FormContent } from './form-content'
import { cn } from '@/ui/lib/utils';
import { Spinner } from '../spinner';
import { toast } from 'sonner';
import { useHydrated } from '@/hooks/use-hydrated'
import { EasyAlertDialog } from '@/ui/components/custom/easy-alert-dialog'

// Walk a react-hook-form errors tree and return the first message. Skips the
// `ref` node (a DOM element) to avoid recursing into the DOM.
function findFirstErrorMessage(errors: any): string | undefined {
    if (!errors || typeof errors !== 'object') return undefined;
    if (typeof errors.message === 'string' && errors.message) return errors.message;
    for (const key of Object.keys(errors)) {
        if (key === 'ref') continue;
        const found = findFirstErrorMessage(errors[key]);
        if (found) return found;
    }
    return undefined;
}


// Every form here submits through React Hook Form's `handleSubmit`, which calls
// preventDefault — but only once React has hydrated. Until then the markup is
// plain server HTML, and pressing Enter in a text field submits it NATIVELY.
// With no method that is a GET to the current URL, which serialises every named
// field into the query string. On /signup that meant
// `?firstName=…&password=hunter2` in the address bar, browser history and the
// CDN access log, for the seconds between first paint and hydration — exactly
// when a password manager has just autofilled the thing.
//
// POST keeps a stray pre-hydration submit in the request body instead. It
// changes nothing after hydration (the submit is prevented either way), and
// sits before the props spread so a caller can still override it.
const FORM_METHOD = "post";

/**
 * Neutralises IMPLICIT submission until React is running.
 *
 * `method="post"` above stops a stray pre-hydration submit leaking fields into
 * the URL; this stops it happening at all. Per the HTML spec a form's default
 * button is the first submit button in its submit-button list, and implicit
 * submission (Enter in a text field) does nothing when that button is disabled —
 * so an always-first, always-hidden submit button is a switch for the whole
 * behaviour.
 *
 * It lives HERE rather than on the pages: `/signup` guards its own sticky
 * submit button this way, but that only protects the one page that remembered.
 * Any form whose submit button sits outside the `<form>` and reaches it by
 * `form="id"` has the same pre-hydration window, and this closes it for all of
 * them. The page-level guard is still worth keeping where it exists — it also
 * blocks a real CLICK on that button, which no default-button trick can.
 *
 * After hydration it is an ordinary enabled submit button, so Enter behaves
 * exactly as before: it triggers the form's `onSubmit`, which is React Hook
 * Form's `handleSubmit` either way.
 */
function ImplicitSubmitGuard() {
    const hydrated = useHydrated()
    return (
        <button
            type="submit"
            disabled={!hydrated}
            aria-hidden="true"
            tabIndex={-1}
            className="pointer-events-none absolute h-0 w-0 overflow-hidden border-0 p-0 opacity-0"
        />
    )
}

const DynamicForm: FC<DynamicFormProps> = ({
    className,
    onFieldChange,
    form,
    config,
    // View mode
    viewMode = false,
    // Container mode props
    openInside,
    open,
    onOpenChange,
    title,
    submitLabel = "Submit",
    cancelLabel = "Cancel",
    onSubmit,
    onCancel,
    isSubmitting = false,

    // Mutation-based form submission
    mutationHook,
    onSuccess,
    onFailed,

    // Content loading state
    contentLoading = false,

    // Modal specific props
    modalSize = 'lg',

    // Regular form actions props
    actionsPlacement = 'bottom',
    resetAfterSubmit = true,
    hideCancel = false,
    hideActions = false,
    sectionChrome = 'card',

    // Disabled fields in edit mode
    disabledFieldsInEdit,
    isEditMode = false,
    ...props
}) => {
    const { control, formState, setValue, watch, handleSubmit } = form as any;
    const isDrawerMode = openInside === 'drawer';
    const isModalMode = openInside === 'modal';
    const isActuallySubmitting = isSubmitting || mutationHook?.isPending
    const [confirmDiscard, setConfirmDiscard] = useState(false)

    // Form submission handler that works with React Hook Form
    const handleFormSubmit = useCallback((data: any) => {
        // Drop conditionally-hidden field values before they reach the payload so
        // an invisible field can't submit stale/default data. Static hidden:true
        // plumbing and disabled-but-visible fields are preserved by the strip.
        const visibleData = stripHiddenValues(config, data)

        if (mutationHook) {
            // Apply onSubmit transformation if provided
            let processedData = onSubmit ? onSubmit(visibleData) : visibleData

            mutationHook.mutate(processedData, {
                onSuccess: (result: any) => {
                    if (onSuccess) {
                        onSuccess(result, processedData);
                    }
                    // if submission is successful, close the form
                    if (onOpenChange) {
                        onOpenChange(false)
                    }
                    // Reset form state if successful
                    if (resetAfterSubmit) {
                        form.reset();
                    }
                },
                onError: (error: any) => {
                    if (onFailed) {
                        onFailed(error, processedData)
                    }
                }
            })
        } else if (onSubmit) {
            // Legacy onSubmit handler
            onSubmit(visibleData)
        }
    }, [mutationHook, onSubmit, onSuccess, onFailed, onOpenChange, form, resetAfterSubmit, config])

    // Surface the first validation error so a failure on a hidden/off-screen
    // field doesn't make submit appear dead.
    const handleInvalid = useCallback((errors: any) => {
        toast.error(findFirstErrorMessage(errors) || 'Please fix the highlighted fields before submitting.')
    }, [])

    const handleContainerSubmit = () => {
        // Trigger form submission through React Hook Form
        if (handleSubmit) {
            handleSubmit(handleFormSubmit, handleInvalid)()
        }
    }

    const handleContainerCancel = () => {
        if (form.formState.isDirty && !isActuallySubmitting && !viewMode) {
            setConfirmDiscard(true)
            return
        }
        closeWithoutSaving()
    }

    /** The actual close, past the guard. */
    const closeWithoutSaving = () => {
        if (onCancel) {
            onCancel()
        } else if (onOpenChange) {
            onOpenChange(false)
        }
    }

    /**
     * Guards the container's OWN dismissals — Esc, the backdrop, the X.
     *
     * Those paths went straight to `onOpenChange(false)` and threw the form
     * away with no prompt. Survivable when the fields were short; not once the
     * drawer holds a rich-text product description with no browser undo behind
     * it, on the form every merchant uses for every product.
     *
     * Only intercepts CLOSING, and only a dirty, non-submitting, editable form:
     * a successful submit calls `onOpenChange` directly (submitting is not
     * discarding), and view mode has nothing to lose.
     */
    const handleContainerOpenChange = (next: boolean) => {
        if (!next && form.formState.isDirty && !isActuallySubmitting && !viewMode) {
            setConfirmDiscard(true)
            return
        }
        onOpenChange?.(next)
    }

    const discardDialog = (
        <EasyAlertDialog
            open={confirmDiscard}
            onOpenChange={setConfirmDiscard}
            title="Discard your changes?"
            description="This form has unsaved changes. Closing it now loses them."
            confirmLabel="Discard"
            cancelLabel="Keep editing"
            onConfirm={() => {
                setConfirmDiscard(false)
                closeWithoutSaving()
            }}
            onCancel={() => setConfirmDiscard(false)}
        />
    )

    // Skeleton component for content loading
    const skeletonContent = (
        <div className="space-y-4 sm:space-y-6">
            {Array.from({ length: 3 }).map((_, sectionIndex) => (
                <Card key={sectionIndex}>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-12 gap-3 sm:gap-4">
                            {Array.from({ length: 4 }).map((_, fieldIndex) => (
                                <div key={fieldIndex} className="col-span-12 sm:col-span-6">
                                    <Skeleton className="h-4 w-24 mb-2" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )

    const formContent = contentLoading ? skeletonContent : (
        <FormContent
            config={config}
            control={control}
            formState={formState}
            watch={watch}
            setValue={setValue}
            onFieldChange={onFieldChange}
            className={className}
            viewMode={viewMode}
            disabledFieldsInEdit={disabledFieldsInEdit}
            isEditMode={isEditMode}
            sectionChrome={sectionChrome}
        />
    )

    // Modal size mapping
    const modalSizeClass = {
        sm: 'sm:max-w-md',
        md: 'sm:max-w-lg',
        lg: 'sm:max-w-2xl',
        xl: 'sm:max-w-4xl',
        full: 'sm:max-w-[90vw]'
    }[modalSize]

    const formActions = hideActions ? null : (viewMode && isModalMode) ? (
        <div className={cn("flex justify-end")}>
            <Button type="button" variant="outline" onClick={handleContainerCancel}>
                Close
            </Button>
        </div>
    ) : viewMode ? null : (hideCancel && !onSubmit && !mutationHook) ? null : (<div className={cn("flex justify-end space-x-4", (actionsPlacement === 'top' && openInside === 'drawer') ? '' : 'mt-6')}>
        {
            !hideCancel && (
                <Button type="button" variant="outline" onClick={handleContainerCancel}>
                    {cancelLabel}
                </Button>
            )
        }
        {/* Only show submit button if there's an onSubmit handler or mutationHook */}
        {(onSubmit || mutationHook) && (
            <Button type="button" disabled={isActuallySubmitting || contentLoading || !form.formState.isDirty} onClick={handleContainerSubmit}>
                {isActuallySubmitting ? 'Submitting...' : submitLabel}
            </Button>
        )}
    </div>)

    // Render modal mode
    if (isModalMode) {
        return (
            <Dialog open={open} onOpenChange={handleContainerOpenChange}>
                <DialogContent className={`${modalSizeClass} max-h-[90vh] flex flex-col p-0`}>
                    <DialogHeader className="px-6 pt-6 pb-2">
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription className="sr-only">
                            Form dialog for {title}
                        </DialogDescription>
                    </DialogHeader>

                    {/* `pt-1` for the same reason the drawer body carries one:
                        the first card's `ring-1` paints outside its box and a
                        scroll container with no top padding clips it. The
                        header's `pb-2` sits OUTSIDE this container and so never
                        gave the ring anywhere to land. */}
                    <div className="flex-1 overflow-y-auto px-6 pt-1 pb-1">
                        <form
                            method={FORM_METHOD}
                            {...props}
                            onSubmit={handleSubmit(handleFormSubmit, handleInvalid)}
                        >
                            <ImplicitSubmitGuard />
                            {formContent}
                        </form>
                    </div>

                    <DialogFooter className="gap-2 px-6 pb-6">
                        {formActions}
                    </DialogFooter>
                </DialogContent>
                {discardDialog}
            </Dialog>
        )
    }


    // Render drawer mode
    if (isDrawerMode) {
        return (
            <Sheet open={open} onOpenChange={handleContainerOpenChange}>
                <SheetContent
                    side="right"
                    className="w-full sm:w-[80vw] sm:max-w-[880px] p-0 overflow-hidden flex flex-col [&>button]:hidden"
                >

                    {/* Gutter matches the body below it, so the title lines up
                        with the edge of the cards rather than sitting inboard
                        of them on a phone. */}
                    <SheetHeader className="px-3 py-4 sm:px-6 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
                        <SheetTitle>{title}</SheetTitle>
                        <SheetDescription className="sr-only">
                            Form drawer for {title}
                        </SheetDescription>
                        {actionsPlacement !== 'bottom' && <div className="flex gap-2">
                            {formActions}
                        </div>}
                    </SheetHeader>

                    {/*
                      The scroll viewport. Two things about its padding are
                      load-bearing.

                      `pt-*` is not decoration. `Card` draws its outline with
                      `ring-1`, and a ring is a box-shadow painted OUTSIDE the
                      element's box — so with the first card flush against the
                      top of a scroll container, its top ring lands a pixel
                      above the content box and the container clips it. The
                      card read as having no top border at all, while the left,
                      right and bottom ones were fine because `px`/`pb` gave
                      them room to paint into. Any value clears it; these match
                      the other sides.

                      The gutter is SMALLER than the `px-4 sm:px-6` the section
                      cards use inside it, rather than equal to it. On a 360px
                      phone this container and the card within it were stacking
                      24px + 16px of chrome on each side, spending 80px of 360
                      before a field began. The outer gutter only has to show
                      the card's edge and its ring; the inner padding is what
                      actually keeps text off a boundary, so the outer one is
                      where the width comes back.
                    */}
                    <div className="flex-1 overflow-y-auto px-3 pt-3 pb-4 sm:px-6 sm:pt-4 sm:pb-6">
                        <form
                            method={FORM_METHOD}
                            {...props}
                            onSubmit={handleSubmit(handleFormSubmit, handleInvalid)}
                        >
                            <ImplicitSubmitGuard />
                            {formContent}
                            {actionsPlacement === 'bottom' && formActions}
                        </form>
                    </div>
                </SheetContent>
                {discardDialog}
            </Sheet>
        )
    }

    // Regular form mode
    return (
        <div>
            <form
                method={FORM_METHOD}
                {...props}
                onSubmit={handleSubmit(handleFormSubmit, handleInvalid)}
            >
                <ImplicitSubmitGuard />
                {actionsPlacement === 'top' && formActions}
                {formContent}
                {actionsPlacement === 'bottom' && formActions}
            </form>

        </div>
    )
}

export default DynamicForm