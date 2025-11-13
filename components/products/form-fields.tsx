import { Control, FieldPath, FieldValues, Controller } from 'react-hook-form'
import { Input } from '@ui/components/input'
import { Label } from '@ui/components/label'
import { Textarea } from '@ui/components/textarea'
import { Button } from '@ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/select'

interface BaseFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  required?: boolean
  error?: string
}

interface FormInputProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
  type?: 'text' | 'number' | 'date' | 'email'
  min?: string | number
  step?: string | number
  className?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  valueAsNumber?: boolean
}

interface FormTextareaProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
  rows?: number
  helperText?: string
}

interface FormSelectProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
  options: Array<{ value: string; label: string }>
  onValueChange?: (value: string) => void
}

// Text Input Field
export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  required,
  error,
  placeholder,
  type = 'text',
  min,
  step,
  className = 'w-full',
  onChange,
  valueAsNumber,
}: FormInputProps<T>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            id={name}
            type={type}
            placeholder={placeholder}
            min={min}
            step={step}
            className={className}
            onChange={(e) => {
              if (valueAsNumber) {
                field.onChange(parseFloat(e.target.value) || 0)
              } else {
                field.onChange(e.target.value)
              }
              onChange?.(e)
            }}
            value={field.value || ''}
          />
        )}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

// Textarea Field
export function FormTextarea<T extends FieldValues>({
  control,
  name,
  label,
  required,
  error,
  placeholder,
  rows = 4,
  helperText,
}: FormTextareaProps<T>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Textarea
            {...field}
            id={name}
            placeholder={placeholder}
            rows={rows}
            value={field.value || ''}
          />
        )}
      />
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

// Select Field
export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  required,
  error,
  placeholder = 'Choose',
  options,
  onValueChange,
}: FormSelectProps<T>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            value={field.value || ''}
            onValueChange={(value) => {
              field.onChange(value)
              onValueChange?.(value)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

// Two Column Grid Wrapper
export function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}

// Three Column Grid Wrapper
export function FormRow3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>
}

// Select Field with Action Button
interface FormSelectWithButtonProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
  options: Array<{ value: string; label: string }>
  onValueChange?: (value: string) => void
  buttonIcon: React.ReactNode
  onButtonClick: () => void
  buttonLabel?: string
}

export function FormSelectWithButton<T extends FieldValues>({
  control,
  name,
  label,
  required,
  error,
  placeholder = 'Choose',
  options,
  onValueChange,
  buttonIcon,
  onButtonClick,
  buttonLabel = 'Add',
}: FormSelectWithButtonProps<T>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex gap-2 w-full">
        <div className="flex-1">
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || ''}
                onValueChange={(value) => {
                  field.onChange(value)
                  onValueChange?.(value)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onButtonClick}
          className="shrink-0"
          aria-label={buttonLabel}
        >
          {buttonIcon}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

// Input Field with Action Button
interface FormInputWithButtonProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
  type?: 'text' | 'number' | 'date' | 'email'
  buttonIcon: React.ReactNode
  onButtonClick: () => void
  buttonLabel?: string
}

export function FormInputWithButton<T extends FieldValues>({
  control,
  name,
  label,
  required,
  error,
  placeholder,
  type = 'text',
  buttonIcon,
  onButtonClick,
  buttonLabel = 'Action',
}: FormInputWithButtonProps<T>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex gap-2 w-full">
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id={name}
              type={type}
              placeholder={placeholder}
              className="flex-1"
              value={field.value || ''}
            />
          )}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onButtonClick}
          className="shrink-0"
          aria-label={buttonLabel}
        >
          {buttonIcon}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
