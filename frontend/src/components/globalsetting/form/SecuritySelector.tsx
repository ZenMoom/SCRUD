'use client';

import { SelectionValue } from '@/store/types/project';
import { useState } from 'react';

interface SecuritySelectorProps {
  onSelect: (selection: SelectionValue) => void;
}

const securityOptions: SelectionValue[] = [
  { type: 'SECURITY_DEFAULT_JWT', label: 'JWT' },
  { type: 'SECURITY_DEFAULT_SESSION', label: '세션' },
  { type: 'SECURITY_DEFAULT_NONE', label: '없음' },
];

export default function SecuritySelector({ onSelect }: SecuritySelectorProps) {
  const [selectedOption, setSelectedOption] = useState<SelectionValue>(securityOptions[0]);

  return (
    <div className='space-y-4'>
      {securityOptions.map((option) => (
        <div
          key={option.type}
          className='flex items-center'
        >
          <input
            type='radio'
            id={option.type}
            name='security'
            value={option.type}
            checked={selectedOption.type === option.type}
            onChange={() => {
              setSelectedOption(option);
              onSelect(option);
            }}
            className='w-4 h-4 text-blue-600'
          />
          <label
            htmlFor={option.type}
            className='ml-2 text-sm text-gray-700'
          >
            {option.label}
          </label>
        </div>
      ))}
    </div>
  );
}
