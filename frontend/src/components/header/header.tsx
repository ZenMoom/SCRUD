"use client"

import Image from "next/image"
import Link from "next/link"
import styles from "./header.module.css"

export default function Header() {
  // 로고 이미지 경로 (프로젝트에 맞게 수정 필요)
  const logoPath = "/next.svg" // 기본 Next.js 로고 경로로 변경

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* 로고 영역 */}
        <div className={styles.logo}>
          <Link href="/">
            {/* 로고 이미지 경로를 확인된 파일로 변경 */}
            <Image src={logoPath} alt="로고" width={120} height={40} priority />
          </Link>
        </div>

        {/* 우측 영역 - 로그인 버튼만 표시 */}
        <div className={styles.authContainer}>
          <button className={styles.loginButton} onClick={() => console.log("로그인 버튼 클릭")}>
            로그인
          </button>
        </div>
      </div>
    </header>
  )
}
