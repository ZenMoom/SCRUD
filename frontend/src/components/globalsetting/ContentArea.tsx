"use client"

import type React from "react"
import {useCallback } from "react"
import FormItem from "./Form"
import RequirementSpecForm from "./form/RequirementSpecForm"
import ERDForm from "./form/ERDForm"
import DependencyFileForm from "./form/DependencyFileForm"
import DependencySelector from "./form/DependencySelector"
import UtilityClassForm from "./form/UtilityClassForm"
import ErrorCodeForm from "./form/ErrorCodeForm"
import SecuritySettingForm from "./form/SecuritySettingForm"
import CodeConventionForm from "./form/CodeConventionForm"
import ArchitectureStructureForm from "./form/ArchitectureStructureForm"

// 파일 객체 타입 정의 (다른 컴포넌트와 일치시킴)
interface FileWithContent {
  name: string;
  content: string;
}

// 선택형 입력을 위한 타입 추가
interface SelectionValue {
  type: string;    // enum 값
  label: string;   // 표시 텍스트
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
}

// FileValue 타입 정의 수정 - 기존 파일 업로드 컴포넌트용
type FileValue = FileWithContent | FileWithContent[];

interface ContentAreaProps {
  settings: ProjectSettings;
  onSettingChange: (key: string, value: string | FileWithContent | FileWithContent[] | SelectionValue | { name: string; content: string }) => void;
  refs: {
    title: React.RefObject<HTMLDivElement | null>
    description: React.RefObject<HTMLDivElement | null>
    serverUrl: React.RefObject<HTMLDivElement | null>
    requirementSpec: React.RefObject<HTMLDivElement | null>
    erd: React.RefObject<HTMLDivElement | null>
    dependencyFile: React.RefObject<HTMLDivElement | null>
    utilityClass: React.RefObject<HTMLDivElement | null>
    errorCode: React.RefObject<HTMLDivElement | null>
    securitySetting: React.RefObject<HTMLDivElement | null>
    codeConvention: React.RefObject<HTMLDivElement | null>
    architectureStructure: React.RefObject<HTMLDivElement | null>
  }
  setActiveItem?: (item: string) => void
}

export default function ContentArea({ settings, onSettingChange, refs, setActiveItem }: ContentAreaProps) {

  // 의존성 선택 핸들러
  const handleDependencySelect = (file: DependencyFile) => {
    onSettingChange("dependencyFile", file);
  };

  // 파일 선택 핸들러
  const handleDependencyFile = (file: DependencyFile) => {
    onSettingChange("dependencyFile", [file]);
  };


  // 필수 항목 구분
  const requiredFields = ['title', 'description', 'serverUrl', 'requirementSpec', 'erd'];
  const isRequired = (field: string) => requiredFields.includes(field);

  // 각 설정 항목의 입력 타입
  const inputTypes: Record<string, 'text' | 'textarea'> = {
    title: "text",
    description: "textarea",
    serverUrl: "text"
  }

  // 항목 포커스 시 activeItem 업데이트
  const handleItemFocus = useCallback((key: string) => {
    
    if (setActiveItem) {
      setActiveItem(key);
    }
  }, [setActiveItem]);

  // 설정 항목 값 변경 시 상태 업데이트
  const handleSettingChange = (key: string, value: string | FileWithContent | FileWithContent[] | SelectionValue | { name: string; content: string } | { name: string; content: string }[]) => {

    onSettingChange(key, value);
  }

  return (
    <div className="flex-1 relative bg-white rounded-lg shadow-sm ml-2 overflow-hidden">
      <div className="h-full overflow-y-auto">

        
        <div className="p-8">
          <FormItem
            ref={refs.title}
            title={`프로젝트명`}
            type={inputTypes.title}
            value={settings.title as string}
            onChange={(value) => handleSettingChange("title", value)}
            onInfoClick={() => openModal("title")}
            onFocus={() => handleItemFocus("title")}
            isRequired={isRequired('title')}
          />

          <FormItem
            ref={refs.description}
            title={`프로젝트 설명`}
            type={inputTypes.description}
            value={settings.description as string}
            onChange={(value) => handleSettingChange("description", value)}
            onInfoClick={() => openModal("description")}
            onFocus={() => handleItemFocus("description")}
            isRequired={isRequired('description')}
          />

          <FormItem
            ref={refs.serverUrl}
            title={`Server URL`}
            type={inputTypes.serverUrl}
            value={settings.serverUrl as string}
            onChange={(value) => handleSettingChange("serverUrl", value)}
            onInfoClick={() => openModal("serverUrl")}
            onFocus={() => handleItemFocus("serverUrl")}
            isRequired={isRequired('serverUrl')}
          />

          <RequirementSpecForm
            ref={refs.requirementSpec}
            title={`요구사항 명세서`}
            value={settings.requirementSpec}
            onChange={(value) => handleSettingChange("requirementSpec", value as FileValue)}
            onInfoClick={() => openModal("requirementSpec")}
            onFocus={useCallback(() => handleItemFocus("requirementSpec"), [handleItemFocus])}
            isRequired={isRequired('requirementSpec')}
          />

          <ERDForm
            ref={refs.erd}
            title={`ERD`}
            value={settings.erd}
            onChange={(value) => handleSettingChange("erd", value as FileValue)}
            onInfoClick={() => openModal("erd")}
            onFocus={useCallback(() => handleItemFocus("erd"), [handleItemFocus])}
            isRequired={isRequired('erd')}
          />

          <div ref={refs.dependencyFile} className="mb-5 p-10 bg-white rounded-lg">
            <div className="mb-3">
              <DependencyFileForm
                title="의존성 파일"
                onFileSelect={(file) => {
                  // 파일 업로드 시 기존 배열에 추가
                  const newFiles = Array.isArray(settings.dependencyFiles)
                    ? [...settings.dependencyFiles, file]
                    : [file];
                  handleSettingChange('dependencyFiles', newFiles);
                }}
                onFocus={useCallback(() => handleItemFocus("dependencyFile"), [handleItemFocus])}
              />
            </div>
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Spring 의존성 추가 선택</h3>
              <DependencySelector
                selectedDependencies={settings.dependencySelections}
                onChange={(file) => {
                  // file.content: "Spring Web (web)\nSpring Data JPA (data-jpa)" 등
                  // id만 추출해서 배열로 저장
                  const ids = file.content
                    .split('\n')
                    .map(line => {
                      const match = line.match(/\((.*?)\)/);
                      return match ? match[1] : '';
                    })
                    .filter(Boolean);
                  handleSettingChange('dependencySelections', ids);
                }}
              />
            </div>
          </div>

          <UtilityClassForm
            ref={refs.utilityClass}
            title="유틸 클래스"
            value={settings.utilityClass}
            onChange={(value) => handleSettingChange("utilityClass", value as FileValue)}
            onInfoClick={() => openModal("utilityClass")}
            onFocus={useCallback(() => handleItemFocus("utilityClass"), [handleItemFocus])}
          />

          <ErrorCodeForm
            ref={refs.errorCode}
            title="에러 코드"
            value={settings.errorCode}
            onChange={(value) => handleSettingChange("errorCode", value as FileValue)}
            onInfoClick={() => openModal("errorCode")}
            onFocus={useCallback(() => handleItemFocus("errorCode"), [handleItemFocus])}
          />

          <SecuritySettingForm
            ref={refs.securitySetting}
            title="보안 설정"
            value={settings.securitySetting}
            onChange={(value) => handleSettingChange("securitySetting", value)}
            onInfoClick={() => openModal("securitySetting")}
            onFocus={useCallback(() => handleItemFocus("securitySetting"), [handleItemFocus])}
          />

          <CodeConventionForm
            ref={refs.codeConvention}
            title="코드 컨벤션"
            value={settings.codeConvention}
            onChange={(value) => handleSettingChange("codeConvention", value as FileValue)}
            onInfoClick={() => openModal("codeConvention")}
            onFocus={useCallback(() => handleItemFocus("codeConvention"), [handleItemFocus])}
          />

          <ArchitectureStructureForm
            ref={refs.architectureStructure}
            title="아키텍처 구조"
            value={settings.architectureStructure}
            onChange={(value) => {
              handleSettingChange("architectureStructure", value);
            }}
            onInfoClick={() => openModal("architectureStructure")}
            onFocus={useCallback(() => handleItemFocus("architectureStructure"), [handleItemFocus])}
          />
        </div>
      </div>

    </div>
  )
}
