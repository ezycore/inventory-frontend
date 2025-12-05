import React from 'react'
import { Button } from '@ui/components/button'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@ui/lib/utils'

interface ControlledNumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: {
    container: 'h-7',
    button: 'h-7 w-7',
    input: 'h-7 text-sm',
    icon: 'h-3 w-3',
  },
  md: {
    container: 'h-9',
    button: 'h-9 w-9',
    input: 'h-9 text-base',
    icon: 'h-4 w-4',
  },
  lg: {
    container: 'h-11',
    button: 'h-11 w-11',
    input: 'h-11 text-lg',
    icon: 'h-5 w-5',
  },
}

export const ControlledNumberInput: React.FC<ControlledNumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  disabled = false,
  className,
  placeholder,
  size = 'sm',
}) => {
  const handleIncrement = () => {
    const newValue = value + step
    if (max === undefined || newValue <= max) {
      onChange(newValue)
    }
  }

  const handleDecrement = () => {
    const newValue = value - step
    if (newValue >= min) {
      onChange(newValue)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Allow empty string for user to clear and type
    if (inputValue === '') {
      onChange(min)
      return
    }

    const parsedValue = parseInt(inputValue, 10)
    
    if (!isNaN(parsedValue)) {
      // Clamp value between min and max
      let clampedValue = parsedValue
      if (clampedValue < min) clampedValue = min
      if (max !== undefined && clampedValue > max) clampedValue = max
      
      onChange(clampedValue)
    }
  }

  const isDecrementDisabled = disabled || value <= min
  const isIncrementDisabled = disabled || (max !== undefined && value >= max)
  const sizes = sizeClasses[size]

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border border-input bg-background',
        sizes.container,
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          sizes.button,
          'rounded-none rounded-l-md border-0 hover:bg-accent shrink-0'
        )}
        onClick={handleDecrement}
        disabled={isDecrementDisabled}
        aria-label="Decrement"
      >
        <Minus className={sizes.icon} />
      </Button>
      
      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          sizes.input,
          'w-full min-w-0 border-0 bg-transparent px-2 text-center font-medium',
          'focus-visible:outline-none focus-visible:ring-0',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          'disabled:cursor-not-allowed'
        )}
        min={min}
        max={max}
        step={step}
        aria-label="Quantity"
      />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          sizes.button,
          'rounded-none rounded-r-md border-0 hover:bg-accent shrink-0'
        )}
        onClick={handleIncrement}
        disabled={isIncrementDisabled}
        aria-label="Increment"
      >
        <Plus className={sizes.icon} />
      </Button>
    </div>
  )
}
