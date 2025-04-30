"use client"

import styles from "./project-card.module.css"

interface NewProjectCardProps {
  onClick: () => void
}

export default function NewProjectCard({ onClick }: NewProjectCardProps) {
  return (
    <button onClick={onClick} className={styles.newProjectCard}>
      <div className={styles.plusIcon}>+</div>
    </button>
  )
}
