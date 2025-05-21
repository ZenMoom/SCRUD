'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';

interface FloatingButtonProps {
  isActive?: boolean;
  onClick?: () => void;
  isLoading?: boolean;
}

export default function FloatingButton({ isActive = false, onClick, isLoading = false }: FloatingButtonProps) {
  return (
    <div className='bottom-8 right-8 fixed z-10'>
      <Button
        onClick={onClick}
        disabled={!isActive || isLoading}
        className={`
          px-6 py-6 rounded-full shadow-lg transition-all duration-300 transform
          ${
            isActive
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-105 hover:shadow-xl'
              : 'bg-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isLoading ? (
          <Loader2 className='animate-spin w-5 h-5 mr-2' />
        ) : (
          <ArrowRight className='animate-pulse w-5 h-5 mr-2' />
        )}
        <span className='font-medium'>프로젝트 생성</span>
      </Button>
    </div>
  );
}
