'use client';

import { Card, CardContent } from '@/components/ui/card';
import type React from 'react';
import { useCallback } from 'react';
import FormItem from './Form';
import ArchitectureStructureForm from './form/ArchitectureStructureForm';
import CodeConventionForm from './form/CodeConventionForm';
import DependencyFileForm from './form/DependencyFileForm';
import ERDForm from './form/ERDForm';
import ErrorCodeForm from './form/ErrorCodeForm';
import RequirementSpecForm from './form/RequirementSpecForm';
import SecuritySettingForm from './form/SecuritySettingForm';
import UtilityClassForm from './form/UtilityClassForm';

// 파일 객체 타입 정의 (다른 컴포넌트와 일치시킴)
interface FileWithContent {
  name: string;
  content: string;
}

// 선택형 입력을 위한 타입 추가
interface SelectionValue {
  type: string; // enum 값
  label: string; // 표시 텍스트
}

interface DependencyFile {
  name: string;
  content: string;
}

// 프로젝트 설정 타입 정의
interface ProjectSettings {
  title: string;
  description: string;
  serverUrl: string;
  requirementSpec: FileWithContent[];
  erd: FileWithContent[];
  dependencyFile: DependencyFile[];
  utilityClass: FileWithContent[];
  errorCode: FileWithContent[];
  securitySetting: SelectionValue | FileWithContent[];
  codeConvention: FileWithContent[];
  architectureStructure: SelectionValue | FileWithContent[];
  dependencyFiles: DependencyFile[];
  dependencySelections: string[];
}

// FileValue 타입 정의 수정 - 기존 파일 업로드 컴포넌트용
type FileValue = FileWithContent | FileWithContent[];

interface ContentAreaProps {
  settings: ProjectSettings;
  onSettingChange: (
    key: string,
    value:
      | string
      | FileWithContent
      | FileWithContent[]
      | SelectionValue
      | { name: string; content: string }
      | { name: string; content: string }[]
      | string[]
  ) => void;
  refs: {
    title: React.RefObject<HTMLDivElement | null>;
    description: React.RefObject<HTMLDivElement | null>;
    serverUrl: React.RefObject<HTMLDivElement | null>;
    requirementSpec: React.RefObject<HTMLDivElement | null>;
    erd: React.RefObject<HTMLDivElement | null>;
    dependencyFile: React.RefObject<HTMLDivElement | null>;
    utilityClass: React.RefObject<HTMLDivElement | null>;
    errorCode: React.RefObject<HTMLDivElement | null>;
    securitySetting: React.RefObject<HTMLDivElement | null>;
    codeConvention: React.RefObject<HTMLDivElement | null>;
    architectureStructure: React.RefObject<HTMLDivElement | null>;
  };
  setActiveItem?: (item: string) => void;
}

export default function ContentArea({ settings, onSettingChange, refs, setActiveItem }: ContentAreaProps) {
  // 필수 항목 구분
  const requiredFields = ['title', 'description', 'serverUrl', 'requirementSpec', 'erd'];
  const isRequired = (field: string) => requiredFields.includes(field);

  // 각 설정 항목의 입력 타입
  const inputTypes: Record<string, 'text' | 'textarea'> = {
    title: 'text',
    description: 'textarea',
    serverUrl: 'text',
  };

  // 항목 포커스 시 activeItem 업데이트
  const handleItemFocus = useCallback(
    (key: string) => {
      if (setActiveItem) {
        setActiveItem(key);
      }
    },
    [setActiveItem]
  );

  // 설정 항목 값 변경 시 상태 업데이트
  const handleSettingChange = (
    key: string,
    value:
      | string
      | FileWithContent
      | FileWithContent[]
      | SelectionValue
      | { name: string; content: string }
      | { name: string; content: string }[]
      | string[]
  ) => {
    onSettingChange(key, value);
  };

  return (
    <main className='flex-1 w-full overflow-hidden bg-white rounded-lg shadow-sm'>
      <div className='h-full overflow-y-auto'>
        <div className='sm:py-8 sm:px-6 max-w-4xl px-3 py-4 mx-auto'>
          <section
            ref={refs.title}
            className='sm:mb-8 mb-6'
          >
            <FormItem
              title={`프로젝트명`}
              type={inputTypes.title}
              value={settings.title as string}
              onChange={(value) => handleSettingChange('title', value)}
              onFocus={() => handleItemFocus('title')}
              isRequired={isRequired('title')}
            />
          </section>

          <section
            ref={refs.description}
            className='sm:mb-8 mb-6'
          >
            <FormItem
              title={`프로젝트 설명`}
              type={inputTypes.description}
              value={settings.description as string}
              onChange={(value) => handleSettingChange('description', value)}
              onFocus={() => handleItemFocus('description')}
              isRequired={isRequired('description')}
            />
          </section>

          <section
            ref={refs.serverUrl}
            className='sm:mb-8 mb-6'
          >
            <FormItem
              title={`Server URL`}
              type={inputTypes.serverUrl}
              value={settings.serverUrl as string}
              onChange={(value) => handleSettingChange('serverUrl', value)}
              onFocus={() => handleItemFocus('serverUrl')}
              isRequired={isRequired('serverUrl')}
            />
          </section>

          <section
            ref={refs.requirementSpec}
            className='sm:mb-8 mb-6'
          >
            <RequirementSpecForm
              title={`요구사항 명세서`}
              value={settings.requirementSpec}
              onChange={(value) => handleSettingChange('requirementSpec', value as FileValue)}
              onFocus={useCallback(() => handleItemFocus('requirementSpec'), [handleItemFocus])}
              isRequired={isRequired('requirementSpec')}
            />
          </section>

          <section
            ref={refs.erd}
            className='sm:mb-8 mb-6'
          >
            <ERDForm
              title={`ERD`}
              value={settings.erd}
              onChange={(value) => handleSettingChange('erd', value as FileValue)}
              onFocus={useCallback(() => handleItemFocus('erd'), [handleItemFocus])}
              isRequired={isRequired('erd')}
            />
          </section>

          <section
            ref={refs.dependencyFile}
            className='sm:mb-8 mb-6'
          >
            <Card className='shadow-sm'>
              <CardContent className='sm:p-6 p-4'>
                <div className='mb-6'>
                  <DependencyFileForm
                    title='의존성 파일'
                    onFileSelect={(file) => {
                      // 파일 업로드 시 기존 배열에 추가
                      const newFiles = Array.isArray(settings.dependencyFiles)
                        ? [...settings.dependencyFiles, file]
                        : [file];
                      handleSettingChange('dependencyFiles', newFiles);
                    }}
                    onFocus={useCallback(() => handleItemFocus('dependencyFile'), [handleItemFocus])}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <section
            ref={refs.utilityClass}
            className='sm:mb-8 mb-6'
          >
            <UtilityClassForm
              title='유틸 클래스'
              value={settings.utilityClass}
              onChange={(value) => handleSettingChange('utilityClass', value as FileValue)}
              onFocus={useCallback(() => handleItemFocus('utilityClass'), [handleItemFocus])}
            />
          </section>

          <section
            ref={refs.errorCode}
            className='sm:mb-8 mb-6'
          >
            <ErrorCodeForm
              title='에러 코드'
              value={settings.errorCode}
              onChange={(value) => handleSettingChange('errorCode', value as FileValue)}
              onFocus={useCallback(() => handleItemFocus('errorCode'), [handleItemFocus])}
            />
          </section>

          <section
            ref={refs.codeConvention}
            className='sm:mb-8 mb-6'
          >
            <CodeConventionForm
              title='코드 컨벤션'
              value={settings.codeConvention}
              onChange={(value) => handleSettingChange('codeConvention', value as FileValue)}
              onFocus={useCallback(() => handleItemFocus('codeConvention'), [handleItemFocus])}
            />
          </section>

          <section
            ref={refs.securitySetting}
            className='sm:mb-8 mb-6'
          >
            <SecuritySettingForm
              title='보안 설정'
              value={settings.securitySetting}
              onChange={(value) => handleSettingChange('securitySetting', value)}
              onFocus={useCallback(() => handleItemFocus('securitySetting'), [handleItemFocus])}
            />
          </section>

          <section
            ref={refs.architectureStructure}
            className='sm:mb-8 mb-6'
          >
            <ArchitectureStructureForm
              title='아키텍처 구조'
              value={settings.architectureStructure}
              onChange={(value) => {
                handleSettingChange('architectureStructure', value);
              }}
              onFocus={useCallback(() => handleItemFocus('architectureStructure'), [handleItemFocus])}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
