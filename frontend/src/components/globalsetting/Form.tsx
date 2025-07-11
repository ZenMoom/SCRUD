'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useProjectTempStore } from '@/store/projectTempStore';
import type React from 'react';
import { forwardRef, useEffect, useState } from 'react';

interface FormItemProps {
  title: string;
  type: 'text' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  isRequired?: boolean;
}

const FormItem = forwardRef<HTMLDivElement, FormItemProps>(
  ({ title, type, value, onChange, onFocus, isRequired }, ref) => {
    const { tempData, setTempData } = useProjectTempStore();
    const [urlError, setUrlError] = useState<string>('');

    // serverUrl의 기본값 설정
    const DEFAULT_SERVER_URL = 'http://localhost:8080';

    // GitHub 인증 후 리다이렉트인 경우에만 임시저장 데이터 불러오기
    useEffect(() => {
      const isFromGithubAuth = new URLSearchParams(window.location.search).get('from') === 'github-auth';

      if (title === 'Server URL') {
        if (!value && !isFromGithubAuth) {
          handleChange(DEFAULT_SERVER_URL);
        }
      }

      if (isFromGithubAuth) {
        if (title === '프로젝트명' && tempData.title) {
          onChange(tempData.title);
        } else if (title === '프로젝트 설명' && tempData.description) {
          onChange(tempData.description);
        } else if (title === 'Server URL' && tempData.serverUrl) {
          onChange(tempData.serverUrl);
        }
      }
    }, []);

    // 값이 변경될 때마다 임시저장
    const handleChange = (newValue: string) => {
      onChange(newValue);

      // 각 필드에 맞는 키로 저장
      if (title === '프로젝트명') {
        setTempData({ title: newValue });
      } else if (title === '프로젝트 설명') {
        setTempData({ description: newValue });
      } else if (title === 'Server URL') {
        setTempData({ serverUrl: newValue });
      }
    };

    const validateUrl = (url: string) => {
      try {
        new URL(url);
        setUrlError('');
        return true;
      } catch {
        setUrlError('정확한 url을 입력해 주세요.');
        return false;
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      handleChange(newValue);

      // URL 검증은 Server URL 필드에만 적용
      if (title === 'Server URL' && newValue) {
        validateUrl(newValue);
      } else {
        setUrlError('');
      }
    };

    // 플레이스홀더 텍스트 선택
    const getPlaceholder = () => {
      switch (title) {
        case '프로젝트명':
          return '개발하는 프로젝트의 서비스명을 적어주세요.';
        case '프로젝트 설명':
          return '개발하는 프로젝트의 목적, 컨셉, 주요 기능 등에 관해 적어주세요.';
        case 'Server URL':
          return '서버에 연결하기 위한 주소를 적어주세요. ex)http://localhost:8080';
        default:
          return `${title} 입력`;
      }
    };

    // 렌더링할 컴포넌트 선택
    const renderInputComponent = () => {
      switch (type) {
        case 'text':
          return (
            <Input
              type='text'
              value={value as string}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className={cn(urlError && 'border-red-300')}
              placeholder={getPlaceholder()}
              onFocus={handleInputFocus}
            />
          );
        case 'textarea':
          return (
            <Textarea
              value={value as string}
              onChange={(e) => handleChange(e.target.value)}
              className='min-h-[120px]'
              placeholder={getPlaceholder()}
              onFocus={onFocus}
            />
          );
        default:
          return null;
      }
    };

    // 플레이스홀더 텍스트 선택
    const handleInputBlur = () => {
      if (title === 'Server URL' && value.trim() === '') {
        handleChange(DEFAULT_SERVER_URL);
      }
    };

    const handleInputFocus = () => {
      if (title === 'Server URL' && value === DEFAULT_SERVER_URL) {
        handleChange('');
      }

      if (onFocus) {
        onFocus(); // ✅ 상위 activeItem 변경도 여전히 호출
      }
    };

    return (
      <div
        ref={ref}
        className='px-10 py-5 bg-white rounded-lg'
      >
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center'>
            <h2 className='m-0 text-xl font-semibold'>
              {title} {isRequired && <span className='text-red-500'>*</span>}
            </h2>
          </div>
        </div>
        {renderInputComponent()}
        {urlError && <p className='mt-1 text-sm text-red-600'>{urlError}</p>}
      </div>
    );
  }
);

FormItem.displayName = 'FormItem';

export default FormItem;
