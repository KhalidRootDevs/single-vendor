'use client';

import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
  id?: string;
  value?: string;
  onChange?: (date: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
  clearable?: boolean;
}

export function DatePicker({
  id,
  value,
  onChange,
  disabled,
  placeholder = 'Select date',
  className,
  minDate,
  maxDate,
  clearable = true
}: DatePickerProps) {
  const handleChange = (selectedDates: Date[]) => {
    if (!onChange) return;
    if (selectedDates[0]) {
      const d = selectedDates[0];
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${day}`);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
  };

  return (
    <div className={cn('relative', className)}>
      <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Flatpickr
        id={id}
        value={value || ''}
        disabled={disabled}
        options={{
          dateFormat: 'Y-m-d',
          allowInput: false,
          disableMobile: true,
          ...(minDate ? { minDate } : {}),
          ...(maxDate ? { maxDate } : {})
        }}
        onChange={handleChange}
        className={cn(
          'flex h-10 w-full cursor-pointer rounded-md border border-input bg-background py-2 pl-9 pr-9 text-sm',
          'ring-offset-background placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'read-only:cursor-pointer'
        )}
        placeholder={placeholder}
      />
      {clearable && value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear date"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
