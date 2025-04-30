"use client"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import styles from "./page.module.css"

// 프로젝트 상세 타입 정의
interface ProjectDetail {
  id: string
  title: string
  description: string
  createdAt: string
  content?: string
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 예시 프로젝트 데이터 - 실제로는 API에서 가져와야 함
  useEffect(() => {
    // 서버에서 프로젝트 데이터를 가져오는 API 호출을 시뮬레이션
    setTimeout(() => {
      setProject({
        id: params.id as string,
        title: "프로젝트 제목",
        description: "프로젝트 개요가 들어가는 부분입니다. 이며 상세 설명이 포함됩니다.",
        createdAt: "20xx.xx.xx",
        content: "프로젝트의 자세한 내용이 이곳에 표시됩니다. 실제로는 서버에서 데이터를 가져와야 합니다.",
      })
      setIsLoading(false)
    }, 500)
  }, [params.id])

  const handleDelete = () => {
    if (window.confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) {
      console.log("프로젝트 삭제:", params.id)
      // 삭제 API 호출 후 성공 시 메인 페이지로 이동
      router.push("/")
    }
  }

  if (isLoading) {
    return <div className={styles.loading}>로딩 중...</div>
  }

  if (!project) {
    return <div className={styles.error}>프로젝트를 찾을 수 없습니다.</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backButton}>
          ← 메인으로 돌아가기
        </Link>
        <div className={styles.actions}>
          <button className={styles.editButton}>수정</button>
          <button className={styles.deleteButton} onClick={handleDelete}>
            삭제
          </button>
        </div>
      </div>

      <div className={styles.projectDetail}>
        <h1 className={styles.title}>{project.title}</h1>
        <div className={styles.meta}>생성일: {project.createdAt}</div>

        <div className={styles.description}>
          <h2 className={styles.sectionTitle}>프로젝트 개요</h2>
          <p>{project.description}</p>
        </div>

        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>내용</h2>
          <p>{project.content}</p>
        </div>
      </div>
    </div>
  )
}
