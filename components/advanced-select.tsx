'use client'

/**
 * AdvancedSelect Component
 * 
 * A select component that supports both static options and dynamic API-based options
 * using TanStack Query hooks for optimal caching and loading states.
 * 
 * Features:
 * - Static options via `options` prop
 * - Dynamic options via `optionsApi` prop (string URL)
 * - Built-in loading and error states
 * - Action button support
 * - Automatic data transformation from API responses
 * - Module-independent utility hook for maximum reusability
 * - Centralized API client with proper caching strategy
 * 
 * Usage:
 * ```tsx
 * // Static options
 * { type: \"select\", options: [{ value: \"1\", label: \"Option 1\" }] }
 * 
 * // Dynamic API options
 * { type: \"select\", optionsApi: \"/api/categories\" }
 * ```
 * 
 * Adding New API Endpoints:
 * Just pass any API URL to optionsApi - the useSelectOptions hook handles everything!
 * Special cases (like brands) can be added to the useSelectOptions hook transformation logic.
 */

import React from 'react'
import { Controller } from 'react-hook-form'
import { useSelectOptions } from '@/hooks/utils'
import { Button } from '@ui/components/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@ui/components/select'
import { Loader2 } from 'lucide-react'
import { cn } from '@ui/lib/utils'
import type { FormFieldConfig, SelectOption } from '@/types/form'

interface AdvancedSelectProps {
    field: FormFieldConfig
    control: any
    error?: string
    onChange: (value: any) => void
}

export const AdvancedSelect: React.FC<AdvancedSelectProps> = ({ 
    field, 
    control, 
    error, 
    onChange 
}) => {
    // Use the useSelectOptions hook following queries folder pattern
    const { data: apiOptions, isLoading: loading, error: queryError } = useSelectOptions(
        field.optionsApi || null
    )

    // Determine which options to use
    const options = field.optionsApi ? (apiOptions || []) : (field.options || [])
    const apiError = queryError ? (queryError as Error).message : null

    return (
        <Controller
            name={field.name}
            control={control}
            rules={{
                required: field.required ? `${field.label} is required` : false,
            }}
            render={({ field: controllerField }) => (
                <Select
                    value={controllerField.value}
                    onValueChange={(value) => {
                        controllerField.onChange(value)
                        onChange(value)
                        if (field.onValueChange) field.onValueChange(value)
                    }}
                    disabled={field.disabled || loading}
                >
                    <SelectTrigger className={cn('w-full', error ? 'border-red-500' : '')}>
                        <div className="flex items-center gap-2 w-full">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            <SelectValue placeholder={
                                loading ? 'Loading options...' : 
                                apiError ? 'Error loading options' :
                                field.placeholder
                            } />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {loading && (
                            <SelectItem value="__loading__" disabled>
                                Loading options...
                            </SelectItem>
                        )}
                        {apiError && (
                            <SelectItem value="__error__" disabled>
                                Error: {apiError}
                            </SelectItem>
                        )}
                        {!loading && !apiError && options.map((option) => (
                            <SelectItem
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        />
    )
}

export default AdvancedSelect