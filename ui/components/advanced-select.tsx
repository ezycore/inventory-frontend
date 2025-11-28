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
import type { SelectOption } from '@/ui/components/form/type'
import { MultiSelect } from './multi-select'

interface AdvancedSelectProps {
    // Core select properties
    value?: string | string[]
    onValueChange?: (value: string | string[]) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    error?: string
    
    // Mode selection
    mode?: 'single' | 'multiple'
    
    // Options - either static or API-driven
    options?: SelectOption[]
    optionsApi?: string
    
    // Multi-select specific props
    variant?: 'default' | 'secondary' | 'destructive' | 'inverted'
    maxCount?: number
    modalPopover?: boolean
    asChild?: boolean
}

export const AdvancedSelect: React.FC<AdvancedSelectProps> = ({ 
    value,
    onValueChange,
    placeholder,
    disabled,
    className,
    error,
    mode = 'single',
    options,
    optionsApi,
    variant = 'default',
    maxCount,
    modalPopover,
    asChild
}) => {
    // Use the useSelectOptions hook for API-driven options
    const { data: apiOptions, isLoading: loading, error: queryError } = useSelectOptions(optionsApi || null)

    // Determine which options to use
    const finalOptions = optionsApi ? (apiOptions || []) : (options || [])
    const apiError = queryError ? (queryError as Error).message : null

    // Handle value changes for both single and multiple modes
    const handleValueChange = (newValue: string | string[]) => {
        if (onValueChange) onValueChange(newValue)
    }

    // Show loading state for both modes
    if (loading) {
        if (mode === 'multiple') {
            return (
                <MultiSelect
                    options={[]}
                    value={Array.isArray(value) ? value : []}
                    onValueChange={handleValueChange}
                    placeholder="Loading options..."
                    variant={variant}
                    disabled={true}
                    className={cn(error ? 'border-red-500' : '', className)}
                    maxCount={maxCount}
                    modalPopover={modalPopover}
                    asChild={asChild}
                />
            )
        }
        
        return (
            <Select disabled={true}>
                <SelectTrigger className={cn('w-full', error ? 'border-red-500' : '', className)}>
                    <div className="flex items-center gap-2 w-full">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <SelectValue placeholder="Loading options..." />
                    </div>
                </SelectTrigger>
            </Select>
        )
    }

    // Show error state for both modes
    if (apiError) {
        if (mode === 'multiple') {
            return (
                <MultiSelect
                    options={[]}
                    value={Array.isArray(value) ? value : []}
                    onValueChange={handleValueChange}
                    placeholder={`Error: ${apiError}`}
                    variant={variant}
                    disabled={true}
                    className={cn('border-red-500', className)}
                    maxCount={maxCount}
                    modalPopover={modalPopover}
                    asChild={asChild}
                />
            )
        }
        
        return (
            <Select disabled={true}>
                <SelectTrigger className={cn('w-full border-red-500', className)}>
                    <SelectValue placeholder={`Error: ${apiError}`} />
                </SelectTrigger>
            </Select>
        )
    }

    // Render multi-select mode
    if (mode === 'multiple') {
        return (
            <MultiSelect
                options={finalOptions}
                value={Array.isArray(value) ? value : (value ? [value] : [])}
                onValueChange={handleValueChange}
                placeholder={placeholder || 'Select options...'}
                variant={variant}
                disabled={disabled}
                className={cn(error ? 'border-red-500' : '', className)}
                maxCount={maxCount}
                modalPopover={modalPopover}
                asChild={asChild}
            />
        )
    }

    // Render single select mode
    return (
        <Select
            value={Array.isArray(value) ? value[0] || '' : value || ''}
            onValueChange={(newValue) => handleValueChange(newValue)}
            disabled={disabled}
        >
            <SelectTrigger className={cn('w-full', error ? 'border-red-500' : '', className)}>
                <SelectValue placeholder={placeholder || 'Select an option...'} />
            </SelectTrigger>
            <SelectContent>
                {finalOptions.map((option) => (
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