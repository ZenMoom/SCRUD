"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import { ExamplePageDto } from "@generated/model/example-page-dto"
import styles from "./page.module.css"

// 환경 모드에 대한 타입 정의 (실제 생성된 타입이 있다면 그것을 import 해야 함)
interface EnvModeResponse {
  mode: string
}

export default function TestPage() {
  const [data, setData] = useState<ExamplePageDto | null>(null)
  const [envMode, setEnvMode] = useState<string>("")
  const helloWorld = process.env.NEXT_PUBLIC_HELLO_WORLD

  const handleClick = async () => {
    const response = await axios.get<ExamplePageDto>("/api/examples")
    setData(response.data)
    console.log("jsonData", response.data)
  }

  useEffect(() => {
    // 타입을 명시하여 API 응답 구조 명확화
    axios
      .get<EnvModeResponse>("/api/env-mode")
      .then((res) => {
        // API 응답 타입에 따라 mode 속성에 접근
        setEnvMode(res.data.mode)
      })
      .catch((error) => {
        console.error("환경 모드 가져오기 오류:", error)
        setEnvMode("오류 발생")
      })
  }, [])

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>API 테스트 페이지</h1>

      <div className={styles.infoBox}>
        <h3 className={styles.subtitle}>실행 환경: {envMode}</h3>
        <p className={styles.text}>환경 변수 테스트: {helloWorld}</p>
      </div>

      <button onClick={handleClick} className={styles.button}>
        데이터 가져오기
      </button>

      {data && (
        <div className={styles.resultSection}>
          <h2 className={styles.subtitle}>API 응답:</h2>
          <pre className={styles.codeBlock}>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
