"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import { ExamplePageDto } from "@generated/model/example-page-dto"

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
      .get<EnvModeResponse>("/api/api-spec")
      .then((res) => {
        console.log("api-spec:", res.data)
      })
      .catch((error) => {
        console.error("환경 모드 가져오기 오류:", error)
        setEnvMode("오류 발생")
      })
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">API 테스트 페이지</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded-lg border-l-4 border-blue-500">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">실행 환경: {envMode}</h3>
        <p className="mt-2 text-gray-600 leading-relaxed">환경 변수 테스트: {helloWorld}</p>
      </div>

      <button onClick={handleClick} className="inline-block px-4 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors cursor-pointer">
        데이터 가져오기
      </button>

      {data && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">API 응답:</h2>
          <pre className="p-4 bg-gray-100 rounded-lg overflow-auto font-mono text-sm leading-relaxed whitespace-pre-wrap break-all">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
