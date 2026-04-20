import * as React from 'react';
import { Input } from './input';

interface DatePickerProps {
  id?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ id, value, onChange, placeholder, className }) => {
  // Convert Date to yyyy-MM-dd string for input value
  const inputValue = value ? value.toISOString().split('T')[0] : '';

  return (
    <Input
      id={id}
      type="date"
      value={inputValue}
      onChange={e => {
        const val = e.target.value;
        onChange(val ? new Date(val) : null);
      }}
      placeholder={placeholder}
      className={className}
    />
  );
}; 