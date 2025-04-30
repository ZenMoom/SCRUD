"use client"

import { CheckCircle, XCircle } from 'lucide-react';
import styles from "./sidebar.module.css"

interface SidebarProps {
  completed: Record<string, boolean>
  activeItem: string
  onItemClick: (item: string) => void
}

export default function Sidebar({ completed, activeItem, onItemClick }: SidebarProps) {
  const items = [
    { id: "projectName", label: "프로젝트명" },
    { id: "projectDescription", label: "프로젝트 설명" },
    { id: "serverUrl", label: "Server URL" },
    { id: "requirementSpec", label: "요구사항 명세서" },
    { id: "erd", label: "ERD" },
    { id: "dependencyFile", label: "의존성 파일" },
    { id: "utilityClass", label: "유틸 클래스" },
    { id: "errorCode", label: "에러 코드" },
    { id: "securitySetting", label: "보안 설정" },
    { id: "codeConvention", label: "코드 컨벤션" },
    { id: "architectureStructure", label: "아키텍처 구조" },
  ]

  return (
    <div className={styles.sidebar}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li
            key={item.id}
            className={`${styles.item} ${activeItem === item.id ? styles.active : ""}`}
            onClick={() => onItemClick(item.id)}
          >
            {completed[item.id] ? (
              <CheckCircle className={styles.iconCompleted} size={20} />
            ) : (
              <XCircle className={styles.iconIncomplete} size={20} />
            )}
            <span className={styles.label}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
