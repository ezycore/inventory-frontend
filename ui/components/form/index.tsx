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
import { Card, CardContent, CardHeader, CardTitle } from '../card'
import { Skeleton } from '../skeleton'
import { Button } from '../button'
import { FC, useCallback } from 'react'
import { FormContent } from './helper'
import { cn } from '@/ui/lib/utils';
import { Spinner } from '../spinner';


const DynamicForm: FC<DynamicFormProps> = ({
    className,
    onFieldChange,
    form,
    config,
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
    ...props
}) => {

    const { control, formState, setValue, watch, handleSubmit } = form as any;
    const isDrawerMode = openInside === 'drawer';
    const isModalMode = openInside === 'modal';

    const isActuallySubmitting = isSubmitting || mutationHook?.isPending
    
    // Form submission handler that works with React Hook Form
    const handleFormSubmit = useCallback((data: any) => {
        if (mutationHook) {
            // Apply onSubmit transformation if provided
            let processedData = data

            mutationHook.mutate(processedData, {
                onSuccess: (result: any) => {
                    if (onSuccess) {
                        onSuccess(result, processedData)
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
            onSubmit(data)
        }
    }, [mutationHook, onSubmit, onSuccess, onFailed])

    const handleContainerSubmit = () => {
        // Trigger form submission through React Hook Form
        if (handleSubmit) {
            handleSubmit(handleFormSubmit)()
        }
    }

    const handleContainerCancel = () => {
        if (onCancel) {
            onCancel()
        } else if (onOpenChange) {
            onOpenChange(false)
        }
    }

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

    const formActions = (<div className={cn("flex justify-end space-x-4", (actionsPlacement === 'top' && openInside === 'drawer') ? '' : 'mt-6')}>
        <Button type="button" variant="outline" onClick={handleContainerCancel}>
            {cancelLabel}
        </Button>
        <Button type="submit" loading={isActuallySubmitting} disabled={isActuallySubmitting || contentLoading} onClick={handleContainerSubmit}>
            {submitLabel}
        </Button>
    </div>)

    // Render modal mode
    if (isModalMode) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className={`${modalSizeClass} max-h-[90vh] flex flex-col p-0`}>
                    <DialogHeader className="px-6 pt-6 pb-2">
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription className="sr-only">
                            Form dialog for {title}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6">
                        <form
                            {...props}
                            onSubmit={handleSubmit(handleFormSubmit)}
                        >
                            {formContent}
                        </form>
                    </div>

                    <DialogFooter className="gap-2 px-6 pb-6">
                        {formActions}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }


    // Render drawer mode
    if (isDrawerMode) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="right"
                    className="w-full sm:w-[80vw] sm:max-w-[880px] p-0 overflow-hidden flex flex-col [&>button]:hidden"
                >

                    <SheetHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
                        <SheetTitle>{title}</SheetTitle>
                        <SheetDescription className="sr-only">
                            Form drawer for {title}
                        </SheetDescription>
                        {actionsPlacement !== 'bottom' && <div className="flex gap-2">
                            {formActions}
                        </div>}
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                        <form
                            {...props}
                            onSubmit={handleSubmit(handleFormSubmit)}
                        >
                            {formContent}
                            {actionsPlacement === 'bottom' && formActions}
                        </form>
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    // Regular form mode
    return (
        <div>
            <form
                {...props}
                onSubmit={handleSubmit(handleFormSubmit)}
            >
                {actionsPlacement === 'top' && formActions}
                {formContent}
                {actionsPlacement === 'bottom' && formActions}
            </form>

        </div>
    )
}

export default DynamicForm