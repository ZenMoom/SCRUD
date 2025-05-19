"use client"

import type React from "react"
import { useState, useCallback } from "react"
import FormItem from "./Form"
import InfoModal from "./InfoModal"
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
  architectureStructure: SelectionValue;
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
  const [modalOpen, setModalOpen] = useState<string | null>(null)

  // 의존성 선택 핸들러
  const handleDependencySelect = (file: DependencyFile) => {
    onSettingChange("dependencyFile", file);
  };

  // 파일 선택 핸들러
  const handleDependencyFile = (file: DependencyFile) => {
    onSettingChange("dependencyFile", [file]);
  };

  const openModal = (key: string) => {
    setModalOpen(key)
  }

  const closeModal = () => {
    setModalOpen(null)
  }

  // 필수 항목 구분
  const requiredFields = ['title', 'description', 'serverUrl', 'requirementSpec', 'erd'];
  const isRequired = (field: string) => requiredFields.includes(field);

  // 각 설정 항목에 대한 설명
  const descriptions: Record<string, string> = {
    title: "프로젝트의 이름을 입력하세요.",
    description: "프로젝트에 대한 간략한 설명을 입력하세요.",
    serverUrl: "서버의 URL을 입력하세요.",
    requirementSpec: "요구사항 명세서 파일을 업로드하세요",
    erd: "ERD(Entity Relationship Diagram) 파일을 업로드하세요.",
    dependencyFile: "의존성 파일을 업로드하거나 Spring 의존성 목록에서 선택하세요.",
    utilityClass: "유틸리티 클래스 정보를 업로드하거나 GitHub에서 가져오세요.",
    errorCode: "에러 코드 정의 파일을 업로드하거나 GitHub에서 가져오세요.",
    securitySetting: "보안 설정에 관한 정보를 선택하거나 GitHub에서 가져오세요.",
    codeConvention: "코드 컨벤션 파일을 업로드하거나 GitHub에서 가져오세요.",
    architectureStructure: "아키텍처 구조를 선택하거나 GitHub에서 가져오세요.",
  }

  // 각 설정 항목의 입력 타입
  const inputTypes: Record<string, 'text' | 'textarea'> = {
    title: "text",
    description: "textarea",
    serverUrl: "text"
  }

  // 항목 포커스 시 activeItem 업데이트
  const handleItemFocus = useCallback((key: string) => {
    console.log('=== ContentArea handleItemFocus ===');
    console.log('포커스된 항목:', key);
    
    if (setActiveItem) {
      console.log('setActiveItem 호출:', key);
      setActiveItem(key);
    }
  }, [setActiveItem]);

  // 설정 항목 값 변경 시 상태 업데이트
  const handleSettingChange = (key: string, value: string | FileWithContent | FileWithContent[] | SelectionValue | { name: string; content: string } | { name: string; content: string }[]) => {
    if (key === 'securitySetting') {
      console.log('=== ContentArea 보안 설정 변경 ===');
      console.log('변경된 보안 설정 값:', value);
    }
    onSettingChange(key, value);
  }

  return (
    <div className="flex-1 relative bg-[#f8f8f8] shadow-[inset_0_0_10px_rgba(0,0,0,0.02)] w-full">
      <div className="h-full overflow-y-auto p-8 md:p-12">
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

        <div ref={refs.dependencyFile} className="mb-10 p-10 bg-white rounded-lg">
          <div className="mb-6">
            <DependencyFileForm
              title="의존성 파일"
              onFileSelect={handleDependencyFile}
              onFocus={useCallback(() => handleItemFocus("dependencyFile"), [handleItemFocus])}
            />
          </div>
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Spring 의존성 추가 선택</h3>
            <DependencySelector
              selectedDependencies={
                settings.dependencyFile.find(file => file.name === 'dependency.txt')
                  ? settings.dependencyFile
                      .find(file => file.name === 'dependency.txt')!
                      .content
                      .split('\n')
                      .map(line => {
                        const match = line.match(/\((.*?)\)/);
                        return match ? match[1] : '';
                      })
                      .filter(Boolean)
                  : []
              }
              onChange={handleDependencySelect}
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
            console.log('=== ContentArea architectureStructure onChange ===');
            console.log('ArchitectureStructureForm에서 받은 값:', value);
            handleSettingChange("architectureStructure", value);
          }}
          onInfoClick={() => openModal("architectureStructure")}
          onFocus={useCallback(() => handleItemFocus("architectureStructure"), [handleItemFocus])}
        />
      </div>

      {modalOpen && <InfoModal title={modalOpen} description={descriptions[modalOpen]} onClose={closeModal} />}
    </div>
  )
}
