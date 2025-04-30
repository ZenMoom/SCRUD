"use client"

import { X } from "lucide-react"
import styles from "./infomodal.module.css";

interface InfoModalProps {
  title: string
  description: string
  onClose: () => void
}

export default function InfoModal({ description, onClose }: InfoModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
            <X size={20} />
        </button>
        <div className={styles.modalContent}>
          <p>{description}</p>
        </div>
      </div>
    </div>
  )
}
