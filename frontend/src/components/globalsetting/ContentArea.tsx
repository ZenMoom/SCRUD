"use client"

import type React from "react"

import { useState } from "react"
import FormItem from "./Form"
import InfoModal from "./InfoModal"
import RequirementSpecForm from "./form/RequirementSpecForm"
import ERDForm from "./form/ERDForm"
import DependencyFileForm from "./form/DependencyFileForm"
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

// 문자열 또는 파일 객체 타입
type FileValue = string | FileWithContent;

interface ContentAreaProps {
  settings: Record<string, string | string[]>
  onSettingChange: (key: string, value: string | string[]) => void
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
    requirementSpec: "요구사항 명세서 파일을 업로드하세요.",
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

  // 보안 설정 라디오 버튼 옵션
  const securityOptions = [
    { value: "SECURITY_DEFAULT_JWT", label: "JWT" },
    { value: "SECURITY_DEFAULT_SESSION", label: "세션" },
    { value: "SECURITY_DEFAULT_NONE", label: "없음" },
  ]

  // 아키텍처 구조 옵션
  const architectureOptions = [
    { value: "ARCHITECTURE_DEFAULT_LAYERED", label: "레이어드 아키텍처" },
    { value: "ARCHITECTURE_DEFAULT_CLEAN", label: "클린 아키텍처" },
    { value: "ARCHITECTURE_DEFAULT_MSA", label: "마이크로서비스 아키텍처" },
    { value: "ARCHITECTURE_DEFAULT_HEX", label: "헥사고날 아키텍처" },
  ]

  // 항목 포커스 시 activeItem 업데이트
  const handleItemFocus = (key: string) => {
    if (setActiveItem) {
      setActiveItem(key)
    }
  }

  // FileValue 또는 FileValue[] 타입을 string 또는 string[] 타입으로 변환하는 헬퍼 함수
  const convertFileValue = (value: FileValue | FileValue[]): string | string[] => {
    console.log("ContentArea - convertFileValue - 입력값:", value);
    
    // GitHub API 응답 JSON 문자열인지 확인 (JSON 형식이고 tree 필드가 있는지)
    if (typeof value === 'string' && value.includes('"tree"') && value.includes('"sha"')) {
      try {
        // JSON 형식인지 확인 (파싱 시도)
        JSON.parse(value);
        console.log("ContentArea - GitHub API 응답 JSON 확인됨");
        // 원본 JSON 문자열을 그대로 반환
        return value;
      } catch (e) {
        console.error("ContentArea - JSON 파싱 오류:", e);
      }
    }
    
    // 아키텍처 GitHub 타입인 경우 특별 처리
    if (typeof value === 'string' && value === 'ARCHITECTURE_GITHUB') {
      console.log("ContentArea - convertFileValue - 반환값: ARCHITECTURE_GITHUB");
      return value; // 기본값으로 'ARCHITECTURE_GITHUB' 문자열 반환
    }
    
    let result;
    if (Array.isArray(value)) {
      result = value.map(item => {
        if (typeof item === 'string') {
          return item;
        }
        // FileWithContent 객체를 문자열로 변환 (JSON 문자열 또는 파일 이름)
        return item.name || JSON.stringify(item);
      });
    } else if (typeof value === 'string') {
      // 문자열 그대로 반환
      result = value;
    } else {
      // FileWithContent 객체를 문자열로 변환
      result = value.name || JSON.stringify(value);
    }
    
    console.log("ContentArea - convertFileValue - 반환값:", result);
    return result;
  };

  return (
    <div className="flex-1 relative bg-[#f8f8f8] shadow-[inset_0_0_10px_rgba(0,0,0,0.02)] w-full">
      <div className="h-full overflow-y-auto p-8 md:p-12">
        <FormItem
          ref={refs.title}
          title={`프로젝트명${isRequired('title') ? '' : ''}`}
          type={inputTypes.title}
          value={settings.title as string}
          onChange={(value) => onSettingChange("title", value)}
          onInfoClick={() => openModal("title")}
          onFocus={() => handleItemFocus("title")}
          isRequired={isRequired('title')}
        />

        <FormItem
          ref={refs.description}
          title={`프로젝트 설명${isRequired('description') ? '' : ''}`}
          type={inputTypes.description}
          value={settings.description as string}
          onChange={(value) => onSettingChange("description", value)}
          onInfoClick={() => openModal("description")}
          onFocus={() => handleItemFocus("description")}
          isRequired={isRequired('description')}
        />

        <FormItem
          ref={refs.serverUrl}
          title={`Server URL${isRequired('serverUrl') ? '' : ''}`}
          type={inputTypes.serverUrl}
          value={settings.serverUrl as string}
          onChange={(value) => onSettingChange("serverUrl", value)}
          onInfoClick={() => openModal("serverUrl")}
          onFocus={() => handleItemFocus("serverUrl")}
          isRequired={isRequired('serverUrl')}
        />

        <RequirementSpecForm
          ref={refs.requirementSpec}
          title={`요구사항 명세서 ${isRequired('requirementSpec') ? '' : ''}`}
          value={settings.requirementSpec}
          onChange={(value) => onSettingChange("requirementSpec", convertFileValue(value))}
          onInfoClick={() => openModal("requirementSpec")}
          onFocus={() => handleItemFocus("requirementSpec")}
          isRequired={isRequired('requirementSpec')}
        />

        <ERDForm
          ref={refs.erd}
          title={`ERD ${isRequired('erd') ? '' : ''}`}
          value={settings.erd}
          onChange={(value) => onSettingChange("erd", convertFileValue(value))}
          onInfoClick={() => openModal("erd")}
          onFocus={() => handleItemFocus("erd")}
          isRequired={isRequired('erd')}
        />

        <DependencyFileForm
          ref={refs.dependencyFile}
          title="의존성 파일"
          value={settings.dependencyFile}
          onChange={(value) => onSettingChange("dependencyFile", convertFileValue(value))}
          onInfoClick={() => openModal("dependencyFile")}
          onFocus={() => handleItemFocus("dependencyFile")}
          isRequired={isRequired('dependencyFile')}
        />

        <UtilityClassForm
          ref={refs.utilityClass}
          title="유틸 클래스"
          value={settings.utilityClass}
          onChange={(value) => onSettingChange("utilityClass", convertFileValue(value))}
          onInfoClick={() => openModal("utilityClass")}
          onFocus={() => handleItemFocus("utilityClass")}
        />

        <ErrorCodeForm
          ref={refs.errorCode}
          title="에러 코드"
          value={settings.errorCode}
          onChange={(value) => onSettingChange("errorCode", convertFileValue(value))}
          onInfoClick={() => openModal("errorCode")}
          onFocus={() => handleItemFocus("errorCode")}
        />

        <SecuritySettingForm
          ref={refs.securitySetting}
          title="보안 설정"
          value={settings.securitySetting}
          onChange={(value) => onSettingChange("securitySetting", convertFileValue(value))}
          onInfoClick={() => openModal("securitySetting")}
          options={securityOptions}
          onFocus={() => handleItemFocus("securitySetting")}
        />

        <CodeConventionForm
          ref={refs.codeConvention}
          title="코드 컨벤션"
          value={settings.codeConvention}
          onChange={(value) => onSettingChange("codeConvention", convertFileValue(value))}
          onInfoClick={() => openModal("codeConvention")}
          onFocus={() => handleItemFocus("codeConvention")}
        />

        <ArchitectureStructureForm
          ref={refs.architectureStructure}
          title="아키텍처 구조"
          value={settings.architectureStructure}
          onChange={(value) => onSettingChange("architectureStructure", convertFileValue(value))}
          onInfoClick={() => openModal("architectureStructure")}
          options={architectureOptions}
          onFocus={() => handleItemFocus("architectureStructure")}
        />
      </div>

      {modalOpen && <InfoModal title={modalOpen} description={descriptions[modalOpen]} onClose={closeModal} />}
    </div>
  )
}
