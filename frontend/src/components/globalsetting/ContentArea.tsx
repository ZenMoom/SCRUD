"use client"

import type React from "react"

import { useState } from "react"
import FormItem from "./Form"
import InfoModal from "./InfoModal"

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
    title: "프로젝트의 이름을 입력하세요. (필수)",
    description: "프로젝트에 대한 간략한 설명을 입력하세요. (필수)",
    serverUrl: "서버의 URL을 입력하세요. (필수)",
    requirementSpec: "요구사항 명세서 파일을 업로드하세요. (필수)",
    erd: "ERD(Entity Relationship Diagram) 파일을 업로드하세요. (필수)",
    dependencyFile: "의존성 파일을 업로드하거나 Spring 의존성 목록에서 선택하세요.",
    utilityClass: "유틸리티 클래스 정보를 업로드하거나 GitHub에서 가져오세요.",
    errorCode: "에러 코드 정의 파일을 업로드하거나 GitHub에서 가져오세요.",
    securitySetting: "보안 설정에 관한 정보를 선택하거나 GitHub에서 가져오세요.",
    codeConvention: "코드 컨벤션 파일을 업로드하거나 GitHub에서 가져오세요.",
    architectureStructure: "아키텍처 구조를 선택하거나 GitHub에서 가져오세요.",
  }

  // 각 설정 항목의 입력 타입
  const inputTypes: Record<string, 'text' | 'textarea' | 'file' | 'dependency-select' | 'security-select' | 'architecture-select'> = {
    title: "text",
    description: "textarea",
    serverUrl: "text",
    requirementSpec: "file",
    erd: "file",
    dependencyFile: "dependency-select",
    utilityClass: "file",
    errorCode: "file",
    securitySetting: "security-select",
    codeConvention: "file",
    architectureStructure: "architecture-select"
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

  return (
    <div className="flex-1 relative bg-[#f8f8f8] shadow-[inset_0_0_10px_rgba(0,0,0,0.02)]">
      <div className="h-full overflow-y-auto p-8 md:p-12">
        <FormItem
          ref={refs.title}
          title={`프로젝트명 ${isRequired('title') ? '(필수)' : ''}`}
          type={inputTypes.title}
          value={settings.title}
          onChange={(value) => onSettingChange("title", value)}
          onInfoClick={() => openModal("title")}
          onFocus={() => handleItemFocus("title")}
        />

        <FormItem
          ref={refs.description}
          title={`프로젝트 설명 ${isRequired('description') ? '(필수)' : ''}`}
          type={inputTypes.description}
          value={settings.description}
          onChange={(value) => onSettingChange("description", value)}
          onInfoClick={() => openModal("description")}
          onFocus={() => handleItemFocus("description")}
        />

        <FormItem
          ref={refs.serverUrl}
          title={`Server URL ${isRequired('serverUrl') ? '(필수)' : ''}`}
          type={inputTypes.serverUrl}
          value={settings.serverUrl}
          onChange={(value) => onSettingChange("serverUrl", value)}
          onInfoClick={() => openModal("serverUrl")}
          onFocus={() => handleItemFocus("serverUrl")}
        />

        <FormItem
          ref={refs.requirementSpec}
          title={`요구사항 명세서 ${isRequired('requirementSpec') ? '(필수)' : ''}`}
          type={inputTypes.requirementSpec}
          value={settings.requirementSpec}
          onChange={(value) => onSettingChange("requirementSpec", value)}
          onInfoClick={() => openModal("requirementSpec")}
          onFocus={() => handleItemFocus("requirementSpec")}
        />

        <FormItem
          ref={refs.erd}
          title={`ERD ${isRequired('erd') ? '(필수)' : ''}`}
          type={inputTypes.erd}
          value={settings.erd}
          onChange={(value) => onSettingChange("erd", value)}
          onInfoClick={() => openModal("erd")}
          onFocus={() => handleItemFocus("erd")}
        />

        <FormItem
          ref={refs.dependencyFile}
          title="의존성 파일"
          type={inputTypes.dependencyFile}
          value={settings.dependencyFile}
          onChange={(value) => onSettingChange("dependencyFile", value)}
          onInfoClick={() => openModal("dependencyFile")}
          onFocus={() => handleItemFocus("dependencyFile")}
        />

        <FormItem
          ref={refs.utilityClass}
          title="유틸 클래스"
          type={inputTypes.utilityClass}
          value={settings.utilityClass}
          onChange={(value) => onSettingChange("utilityClass", value)}
          onInfoClick={() => openModal("utilityClass")}
          onFocus={() => handleItemFocus("utilityClass")}
        />

        <FormItem
          ref={refs.errorCode}
          title="에러 코드"
          type={inputTypes.errorCode}
          value={settings.errorCode}
          onChange={(value) => onSettingChange("errorCode", value)}
          onInfoClick={() => openModal("errorCode")}
          onFocus={() => handleItemFocus("errorCode")}
        />

        <FormItem
          ref={refs.securitySetting}
          title="보안 설정"
          type={inputTypes.securitySetting}
          value={settings.securitySetting}
          onChange={(value) => onSettingChange("securitySetting", value)}
          onInfoClick={() => openModal("securitySetting")}
          options={securityOptions}
          onFocus={() => handleItemFocus("securitySetting")}
        />

        <FormItem
          ref={refs.codeConvention}
          title="코드 컨벤션"
          type={inputTypes.codeConvention}
          value={settings.codeConvention}
          onChange={(value) => onSettingChange("codeConvention", value)}
          onInfoClick={() => openModal("codeConvention")}
          onFocus={() => handleItemFocus("codeConvention")}
        />

        <FormItem
          ref={refs.architectureStructure}
          title="아키텍처 구조"
          type={inputTypes.architectureStructure}
          value={settings.architectureStructure}
          onChange={(value) => onSettingChange("architectureStructure", value)}
          onInfoClick={() => openModal("architectureStructure")}
          options={architectureOptions}
          onFocus={() => handleItemFocus("architectureStructure")}
        />
      </div>

      {modalOpen && <InfoModal title={modalOpen} description={descriptions[modalOpen]} onClose={closeModal} />}
    </div>
  )
}
