'use client'

/**
 * AdvancedSelect Component
 * 
 * A versatile, standalone select component that works both inside and outside forms.
 * Supports both static options and dynamic API-based options using TanStack Query 
 * hooks for optimal caching and loading states.
 * 
 * Features:
 * - 🆓 Form-independent - works standalone or with React Hook Form
 * - 📊 Static options via `options` prop
 * - 📡 Dynamic options via `optionsApi` prop (string URL)
 * - ⚡ Built-in loading and error states
 * - 🔄 Automatic data transformation from API responses
 * - 🚀 Module-independent utility hook for maximum reusability
 * - 💾 Centralized API client with proper caching strategy
 * - 🔙 Backward compatible with existing form field configs
    */

import React from 'react'
import { useSelectOptions } from '@/hooks/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@ui/components/select'
import { Loader2 } from 'lucide-react'
import { cn } from '@ui/lib/utils'
import type { SelectOption } from '@/types/form'

interface AdvancedSelectProps {
    // Core select properties
    value?: string
    onValueChange?: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    error?: string
    
    // Options - either static or API-driven
    options?: SelectOption[]
    optionsApi?: string
}

export const AdvancedSelect: React.FC<AdvancedSelectProps> = ({ 
    value,
    onValueChange,
    placeholder,
    disabled,
    className,
    error,
    options,
    optionsApi
}) => {
    // Use the useSelectOptions hook for API-driven options
    const { data: apiOptions, isLoading: loading, error: queryError } = useSelectOptions(optionsApi || null)

    // Determine which options to use
    const finalOptions = optionsApi ? (apiOptions || []) : (options || [])
    const apiError = queryError ? (queryError as Error).message : null

    // Handle value changes
    const handleValueChange = (newValue: string) => {
        if (onValueChange) onValueChange(newValue)
    }

    return (
        <Select
            value={value}
            onValueChange={handleValueChange}
            disabled={disabled || loading}
        >
            <SelectTrigger className={cn('w-full', error ? 'border-red-500' : '', className)}>
                <div className="flex items-center gap-2 w-full">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <SelectValue placeholder={
                        loading ? 'Loading options...' : 
                        apiError ? 'Error loading options' :
                        placeholder
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
                {!loading && !apiError && finalOptions.map((option) => (
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
    )
}

export default AdvancedSelect