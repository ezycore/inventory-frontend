'use client'

import React from 'react'
import { Controller } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'
import { ChevronDown, ChevronUp, Upload, X } from 'lucide-react'
import { Input } from './input'
import { AdvancedSelect } from '../../components/advanced-select'
import { Textarea } from './textarea'
import { Label } from './label'
import { Button } from './button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from './select'
import { Checkbox } from './checkbox'
import { RadioGroup, RadioGroupItem } from './radio-group'
import {
    FileUpload,
    FileUploadDropzone,
    FileUploadItem,
    FileUploadItemDelete,
    FileUploadItemPreview,
    FileUploadList
} from './file-upload'
import { cn } from '@ui/lib/utils'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle
} from './sheet'
import type {
    DynamicFormProps,
    FormFieldConfig,
    FormSection,
    ColumnSpan
} from '@/types/form'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

// Helper function to get grid column classes with responsive breakpoints
const getColumnClass = (span: ColumnSpan): string => {
    const spanMap: Record<ColumnSpan, string> = {
        1: 'col-span-12 sm:col-span-6 lg:col-span-1',
        2: 'col-span-12 sm:col-span-6 lg:col-span-2',
        3: 'col-span-12 sm:col-span-6 lg:col-span-3',
        4: 'col-span-12 sm:col-span-6 lg:col-span-4',
        6: 'col-span-12 sm:col-span-6 lg:col-span-6',
        12: 'col-span-12'
    }
    return spanMap[span] || 'col-span-12'
}



// Individual field components
const FormField: React.FC<{
    field: FormFieldConfig
    control: any
    formState: any
    watch: any
    setValue: any
    onFieldChange?: (fieldName: string, value: any) => void
}> = ({ field, control, formState, watch, setValue, onFieldChange }) => {
    const error = formState.errors[field.name]?.message

    // Check conditional display
    if (field.showWhen) {
        const watchedValue = watch(field.showWhen.field)
        const { value, operator = 'equals' } = field.showWhen

        let shouldShow = false
        switch (operator) {
            case 'equals':
                shouldShow = watchedValue === value
                break
            case 'not-equals':
                shouldShow = watchedValue !== value
                break
            case 'includes':
                shouldShow = Array.isArray(watchedValue) ? watchedValue.includes(value) : false
                break
            case 'not-includes':
                shouldShow = Array.isArray(watchedValue) ? !watchedValue.includes(value) : true
                break
        }

        if (!shouldShow) return null
    }

    if (field.hidden) return null

    const handleChange = (value: any) => {
        if (field.onChange) field.onChange(value)
        if (onFieldChange) onFieldChange(field.name, value)
    }

    const renderField = () => {
        switch (field.type) {
            case 'input':
            case 'number':
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        rules={{
                            required: field.required ? `${field.label} is required` : false,
                            min: field.validation?.min ? { value: field.validation.min, message: `Minimum value is ${field.validation.min}` } : undefined,
                            max: field.validation?.max ? { value: field.validation.max, message: `Maximum value is ${field.validation.max}` } : undefined,
                        }}
                        render={({ field: controllerField }) => (
                            <Input
                                {...controllerField}
                                type={field.type === 'number' ? 'number' : 'text'}
                                placeholder={field.placeholder}
                                disabled={field.disabled}
                                min={field.validation?.min}
                                max={field.validation?.max}
                                step={field.step}
                                onChange={(e) => {
                                    const value = field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                                    controllerField.onChange(value)
                                    handleChange(value)
                                }}
                                className={cn('w-full', error ? 'border-red-500' : '')}
                            />
                        )}
                    />
                )

            case 'textarea':
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        rules={{
                            required: field.required ? `${field.label} is required` : false,
                        }}
                        render={({ field: controllerField }) => (
                            <Textarea
                                {...controllerField}
                                placeholder={field.placeholder}
                                disabled={field.disabled}
                                rows={field.rows || 3}
                                onChange={(e) => {
                                    controllerField.onChange(e.target.value)
                                    handleChange(e.target.value)
                                }}
                                className={cn('w-full', error ? 'border-red-500' : '')}
                            />
                        )}
                    />
                )

            case 'select':
                return (
                    <AdvancedSelect
                        field={field}
                        control={control}
                        error={error}
                        onChange={handleChange}
                    />
                )



            case 'checkbox':
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        render={({ field: controllerField }) => (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={field.name}
                                    checked={controllerField.value}
                                    onCheckedChange={(checked) => {
                                        controllerField.onChange(checked)
                                        handleChange(checked)
                                    }}
                                    disabled={field.disabled}
                                />
                                <Label htmlFor={field.name}>{field.label}</Label>
                            </div>
                        )}
                    />
                )

            case 'radio-group':
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        rules={{
                            required: field.required ? `${field.label} is required` : false,
                        }}
                        render={({ field: controllerField }) => (
                            <RadioGroup
                                value={controllerField.value}
                                onValueChange={(value) => {
                                    controllerField.onChange(value)
                                    handleChange(value)
                                }}
                                disabled={field.disabled}
                            >
                                {field.options?.map((option) => (
                                    <div key={option.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={option.value} id={option.value} />
                                        <Label htmlFor={option.value}>{option.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        )}
                    />
                )

            case 'date':
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        rules={{
                            required: field.required ? `${field.label} is required` : false,
                        }}
                        render={({ field: controllerField }) => (
                            <Input
                                {...controllerField}
                                type="date"
                                disabled={field.disabled}
                                onChange={(e) => {
                                    controllerField.onChange(e.target.value)
                                    handleChange(e.target.value)
                                }}
                                className={cn('w-full min-w-0', error ? 'border-red-500' : '')}
                            />
                        )}
                    />
                )

            case 'file-upload':
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        rules={{
                            required: field.required ? `${field.label} is required` : false,
                        }}
                        render={({ field: controllerField }) => {
                            const files = controllerField.value || []
                            const acceptedTypes = field.accept || '*'
                            const maxFiles = field.maxFiles || 1
                            const maxSize = field.maxSize || 5 * 1024 * 1024 // 5MB default
                            const showPreview = field.showPreview !== false

                            const handleFileChange = (selectedFiles: File[]) => {
                                console.log('File upload changed:', selectedFiles) // Debug log
                                controllerField.onChange(selectedFiles)
                                handleChange(selectedFiles)
                            }

                            return (
                                <FileUpload
                                    value={files}
                                    onValueChange={handleFileChange}
                                    accept={acceptedTypes}
                                    maxFiles={maxFiles}
                                    maxSize={maxSize}
                                    multiple={field.multiple}
                                    disabled={field.disabled}
                                >
                                    <FileUploadDropzone className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="h-10 w-10 text-muted-foreground" />
                                            <div className="text-sm">
                                                <span className="font-semibold text-primary">Click to upload</span>
                                                <span className="text-muted-foreground"> or drag and drop</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {field.dropzoneText || `${acceptedTypes.toUpperCase()} up to ${(maxSize / 1024 / 1024).toFixed(0)}MB ${maxFiles > 1 ? `(Max ${maxFiles} files)` : ''}`}
                                            </p>
                                        </div>
                                    </FileUploadDropzone>

                                    {showPreview && files.length > 0 && (
                                        <FileUploadList className="mt-4">
                                            {files.map((file: File, index: number) => (
                                                <FileUploadItem
                                                    key={`${file.name}-${index}`}
                                                    value={file}
                                                    className="flex items-center gap-3 p-3 border rounded-lg"
                                                >
                                                    <FileUploadItemPreview className="h-16 w-16 rounded overflow-hidden bg-gray-100" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                        {index === 0 && maxFiles > 1 && (
                                                            <span className="inline-block mt-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                                                Primary
                                                            </span>
                                                        )}
                                                    </div>
                                                    <FileUploadItemDelete asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </FileUploadItemDelete>
                                                </FileUploadItem>
                                            ))}
                                        </FileUploadList>
                                    )}
                                </FileUpload>
                            )
                        }}
                    />
                )

            case 'custom':
                if (field.customComponent) {
                    const CustomComponent = field.customComponent
                    return (
                        <Controller
                            name={field.name}
                            control={control}
                            render={({ field: controllerField }) => (
                                <CustomComponent
                                    {...controllerField}
                                    {...field.customProps}
                                    onChange={(value: any) => {
                                        controllerField.onChange(value)
                                        handleChange(value)
                                    }}
                                    error={error}
                                />
                            )}
                        />
                    )
                }
                return null

            default:
                return null
        }
    }

    return (
        <div className={cn(
            getColumnClass(field.columnSpan || 12),
            "w-full min-w-0 flex flex-col",
            field.className
        )}>
            {field.type !== 'checkbox' && (
                <div className="flex items-center justify-between mb-2">
                    <Label htmlFor={field.name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {field.action && (<Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant={field.action.variant || "ghost"}
                                size="icon"
                                className="h-6 w-6 p-0 shrink-0"
                                onClick={() => field.action?.onClick?.(field)}
                                disabled={field.action.disabled}
                            >
                                {field.action.icon}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           { field.action.label }
                        </TooltipContent>
                    </Tooltip>
                    )}
                </div>
            )}
            <div className="w-full min-w-0 flex-1">
                {renderField()}
            </div>
            {field.helperText && (
                <p className="text-xs text-muted-foreground">{field.helperText}</p>
            )}
            {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
        </div>
    )
}

// Section component
const FormSectionComponent: React.FC<{
    section: FormSection
    control: any
    formState: any
    watch: any
    setValue: any
    onFieldChange?: (fieldName: string, value: any) => void
    maxColumns: number
}> = ({ section, control, formState, watch, setValue, onFieldChange, maxColumns }) => {
    const [isOpen, setIsOpen] = React.useState(section.defaultOpen ?? true)

    const content = (
        <CardContent className={cn("space-y-4 pt-4", section.className)}>
            <div className="grid grid-cols-12 gap-3 sm:gap-4 w-full">
                {section.fields.map((field) => (
                    <FormField
                        key={field.name}
                        field={field}
                        control={control}
                        formState={formState}
                        watch={watch}
                        setValue={setValue}
                        onFieldChange={onFieldChange}
                    />
                ))}
            </div>
        </CardContent>
    )

    if (section.collapsible) {
        return (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <Card>
                    <CollapsibleTrigger className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors p-4 sm:p-6">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                {section.icon && (
                                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                        {section.icon}
                                    </div>
                                )}
                                <div className="text-left min-w-0 flex-1">
                                    <CardTitle className="text-base sm:text-lg truncate">{section.title}</CardTitle>
                                    {section.description && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {section.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="shrink-0 ml-2">
                                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        {content}
                    </CollapsibleContent>
                </Card>
            </Collapsible>
        )
    }

    return (
        <Card>
            <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2">
                    {section.icon && (
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                            {section.icon}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg truncate">{section.title}</CardTitle>
                        {section.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {section.description}
                            </p>
                        )}
                    </div>
                </div>
            </CardHeader>
            {content}
        </Card>
    )
}

// Main DynamicForm component
// Form content component (extracted for reuse)
const FormContent: React.FC<{
    config: any;
    control: any;
    formState: any;
    watch: any;
    setValue: any;
    onFieldChange?: any;
    className?: string;
}> = ({ config, control, formState, watch, setValue, onFieldChange, className }) => {
    return (
        <div className={cn("space-y-4 sm:space-y-6", className)}>
            {config.sections.map((section: any, index: number) => (
                <FormSectionComponent
                    key={`${section.title}-${index}`}
                    section={section}
                    control={control}
                    formState={formState}
                    watch={watch}
                    setValue={setValue}
                    onFieldChange={onFieldChange}
                    maxColumns={12}
                />
            ))}
        </div>
    )
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
    config,
    control,
    formState,
    watch,
    setValue,
    getValues,
    className,
    onFieldChange,
    // Drawer props
    asDrawer = false,
    drawerOpen = false,
    onDrawerOpenChange,
    drawerTitle,
    drawerSubmitLabel = "Submit",
    drawerCancelLabel = "Cancel",
    onDrawerSubmit,
    onDrawerCancel,
    isSubmitting = false,
    hideDrawerActions = false,

    // Regular form actions props
    showActions = false,
    cancelLabel = "Cancel",
    submitLabel = "Submit",
    onCancel,
    ...props
}) => {
    const handleDrawerSubmit = () => {
        if (onDrawerSubmit) {
            onDrawerSubmit()
        } else {
            // Fallback: try to submit the form
            const form = document.getElementById(props.id || 'dynamic-form') as HTMLFormElement
            form?.requestSubmit()
        }
    }

    const handleDrawerCancel = () => {
        if (onDrawerCancel) {
            onDrawerCancel()
        } else if (onDrawerOpenChange) {
            onDrawerOpenChange(false)
        }
    }

    const formContent = (
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

    if (asDrawer) {
        return (
            <Sheet open={drawerOpen} onOpenChange={onDrawerOpenChange}>
                <SheetContent
                    side="right"
                    className="w-full sm:w-[80vw] sm:max-w-[880px] p-0 overflow-hidden flex flex-col [&>button]:hidden"
                >
                    {!hideDrawerActions && (
                        <SheetHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
                            <SheetTitle>{drawerTitle}</SheetTitle>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleDrawerCancel}
                                >
                                    {drawerCancelLabel}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleDrawerSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? `${drawerSubmitLabel}...` : drawerSubmitLabel}
                                </Button>
                            </div>
                        </SheetHeader>
                    )}
                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                        <form {...props}>
                            {formContent}
                        </form>
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    // Regular form mode
    return (
        <div>
            <form {...props}>
                {formContent}
            </form>

            {/* Regular form actions */}
            {showActions && (
                <div className="flex justify-end space-x-4 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        onClick={() => {
                            const form = document.getElementById(props.id || 'dynamic-form') as HTMLFormElement
                            form?.requestSubmit()
                        }}
                    >
                        {isSubmitting ? `${submitLabel}...` : submitLabel}
                    </Button>
                </div>
            )}
        </div>
    )
}

export default DynamicForm