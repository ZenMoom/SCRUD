"use client"

import { forwardRef, useState, useEffect, useRef } from "react"
import { HelpCircle, Upload, Github, File } from "lucide-react"
import styles from "./form.module.css";

interface FormItemProps {
  title: string
  type: string
  value: string
  onChange: (value: string) => void
  onInfoClick: () => void
  options?: Array<{ value: string; label: string }>
}

const FormItem = forwardRef<HTMLDivElement, FormItemProps>(
  ({ title, type, value, onChange, onInfoClick, options }, ref) => {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownOpen &&
          dropdownRef.current &&
          buttonRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          setDropdownOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [dropdownOpen])

    const handleDrag = (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true)
      } else if (e.type === "dragleave") {
        setDragActive(false)
      }
    }

    const handleDrop = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onChange(e.dataTransfer.files[0].name)
      }
    }

    const handleFileUpload = () => {
      setDropdownOpen(false)
      // 파일 선택 다이얼로그 트리거
      document.getElementById(`file-upload-${title}`)?.click()
    }

    const handleGithubUpload = () => {
      setDropdownOpen(false)
      // GitHub 연결 로직 (여기서는 파일명만 설정)
      onChange(`GitHub: ${title} 파일`)
    }

    const renderInput = () => {
      switch (type) {
        case "text":
          return (
            <input
              type="text"
              className={styles.textInput}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`${title}을(를) 입력하세요`}
            />
          )
        case "textarea":
          return (
            <textarea
              className={styles.textareaInput}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`${title}을(를) 입력하세요`}
              rows={4}
            />
          )
        case "file":
          return (
            <div className={styles.fileInputContainer}>
              <div
                className={`${styles.fileInput} ${dragActive ? styles.dragActive : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                ref={buttonRef}
              >
                <div className={styles.fileInputContent}>
                  <Upload size={24} className={styles.uploadIcon} />
                  <span className={styles.uploadText}>파일을 추가하세요. (CSV, HTML, TXT 등)</span>
                </div>

                {dropdownOpen && (
                  <div className={styles.dropdown} ref={dropdownRef}>
                    <button type="button" className={styles.dropdownItem} onClick={handleGithubUpload}>
                      <Github size={16} />
                      <span>GitHub에서 가져오기</span>
                    </button>
                    <button type="button" className={styles.dropdownItem} onClick={handleFileUpload}>
                      <File size={16} />
                      <span>파일 업로드</span>
                    </button>
                  </div>
                )}

                <input
                  id={`file-upload-${title}`}
                  type="file"
                  className={styles.hiddenFileInput}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      onChange(e.target.files[0].name)
                    }
                  }}
                />
              </div>
              {value && (
                <div className={styles.selectedFile}>
                  <File size={16} />
                  <span>{value}</span>
                </div>
              )}
            </div>
          )
        case "radio":
          return (
            <div className={styles.radioGroup}>
              {options?.map((option) => (
                <label key={option.value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name={title}
                    value={option.value}
                    checked={value === option.value}
                    onChange={() => onChange(option.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioText}>{option.label}</span>
                </label>
              ))}
            </div>
          )
        default:
          return null
      }
    }

    return (
      <div ref={ref} className={styles.formItem}>
        <div className={styles.titleContainer}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.infoButton} onClick={onInfoClick} aria-label={`${title} 정보`}>
            <HelpCircle size={20} />
          </button>
        </div>
        {renderInput()}
      </div>
    )
  },
)

FormItem.displayName = "FormItem"

export default FormItem
