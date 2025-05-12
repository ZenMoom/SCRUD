"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { ApiSpecVersionResponse, ApiSpecVersionListResponse } from "@generated/model"

// 컴포넌트 임포트
import ApiHeader from "./ApiHeader"
import ApiForm from "./ApiForm"
// 경로 수정: tabs 폴더의 경로를 정확히 지정
import BodyTab from "./tabs/BodyTab"
import PathParamsTab from "./tabs/PathParamsTab"
import QueryParamsTab from "./tabs/QueryParamsTab"
import ResponseTab from "./tabs/ResponseTab"
import ApiResponse from "./ApiResponse"
import LoadingIndicator from "./LoadingIndicator"

// 타입 임포트
import { ApiResponseData, BodyParam } from "./types"

// 훅 임포트 - require() 대신 import 구문 사용
import { useNotification } from "./hooks/useNotification"
import { useApiSpec } from "./hooks/useApiSpec"

interface RightContainerProps {
  selectedApi: string | null
  selectedMethod: string | null
  onToggleVersionPanel: () => void
  scrudProjectId: number
  onApiSpecChanged: () => void
}

export default function RightContainer({ selectedApi, selectedMethod, scrudProjectId, onApiSpecChanged }: RightContainerProps) {
  console.log("RightContainer 렌더링 - 받은 scrudProjectId:", scrudProjectId)

  // 알림 훅 사용
  const { showSuccessNotification, showErrorNotification, showWarningNotification, showInfoNotification } = useNotification()

  // 상태 관리
  const [method, setMethod] = useState<string>("GET")
  const [endpoint, setEndpoint] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [summary, setSummary] = useState<string>("")
  const [apiSpecVersionId, setApiSpecVersionId] = useState<number | null>(null)
  const [apiSpecsList, setApiSpecsList] = useState<ApiSpecVersionResponse[]>([])
  const [bodyParams, setBodyParams] = useState<BodyParam[]>([{ key: "", value: "" }])
  const [activeTab, setActiveTab] = useState<string>("Body")
  const [apiResponse, setApiResponse] = useState<ApiResponseData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Body 관련 상태
  const [bodyMode, setBodyMode] = useState<"none" | "form-data" | "x-www-form-urlencoded" | "raw" | "binary">("raw")
  const [rawBodyFormat, setRawBodyFormat] = useState<"json" | "text" | "xml" | "javascript" | "html">("json")
  const [rawBody, setRawBody] = useState<string>('{\n  "key": "value"\n}')

  // 파라미터 상태
  const [pathParamsJson, setPathParamsJson] = useState<string>('{ "id": "123" }')
  const [queryParamsJson, setQueryParamsJson] = useState<string>('{ "page": "1", "size": "10" }')
  const [responseJson, setResponseJson] = useState<string>('{\n  "data": {},\n  "message": "성공"\n}')

  // API 스펙 목록 조회 함수
  const fetchApiSpecsByProject = useCallback(async (projectId: number): Promise<ApiSpecVersionResponse[]> => {
    console.log("fetchApiSpecsByProject 호출됨 - projectId:", projectId)
    setIsLoading(true)
    try {
      // 백엔드에서 API 스펙 목록 조회
      const response = await axios.get<ApiSpecVersionListResponse>(`/api/api-specs/by-project/${projectId}`)

      // 응답 처리
      const specsList = response.data.content || []
      console.log(`프로젝트 ${projectId}의 API 스펙 목록:`, specsList)
      setApiSpecsList(specsList)

      return specsList
    } catch (error) {
      console.error(`프로젝트 ${projectId}의 API 스펙 목록 조회 오류:`, error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // selectedApi와 selectedMethod가 변경될 때마다 호출되는 효과
  useEffect(() => {
    if (selectedApi) {
      setEndpoint(selectedApi)

      // selectedMethod가 있으면 해당 메서드로 설정
      if (selectedMethod) {
        setMethod(selectedMethod)
      }

      // API 경로에 따른 설명 설정
      if (selectedApi.includes("/user/me")) {
        setDescription("현재 인증된 사용자의 개인 정보를 조회하는 API")
        setSummary("사용자 정보 조회")

        // 경로 파라미터 예시
        if (selectedApi.includes("{")) {
          setPathParamsJson('{ "userId": "123" }')
        }

        // GET 메서드는 기본적으로 body가 없음
        if (selectedMethod === "GET") {
          setBodyMode("none")
          setQueryParamsJson('{ "fields": "name,email,profile" }')
        } else {
          // POST/PUT은 JSON 바디 예시 설정
          setRawBody('{\n  "name": "홍길동",\n  "email": "user@example.com"\n}')
        }
      } else if (selectedApi.includes("/user/login")) {
        setDescription("사용자 로그인 API")
        setSummary("로그인")
        setRawBody('{\n  "username": "user@example.com",\n  "password": "password123"\n}')
      } else if (selectedApi.includes("/user/logout")) {
        setDescription("사용자 로그아웃 API")
        setSummary("로그아웃")
      } else if (selectedApi.includes("/post/send")) {
        setDescription("게시물 전송 API")
        setSummary("게시물 전송")
        setRawBody('{\n  "title": "새 게시물",\n  "content": "게시물 내용입니다."\n}')
      } else if (selectedApi.includes("/post/delete")) {
        setDescription("게시물 삭제 API")
        setSummary("게시물 삭제")
        setRawBody('{\n  "postId": 123\n}')
      } else if (selectedApi.includes("/post/update")) {
        setDescription("게시물 수정 API")
        setSummary("게시물 수정")
        setRawBody('{\n  "postId": 123,\n  "title": "수정된 제목",\n  "content": "수정된 내용"\n}')
      } else {
        // 기본 설정
        setDescription("")
        setSummary(selectedApi.split("/").pop() || "API")
      }

      // GET 메서드인 경우 body mode를 none으로 설정
      if (selectedMethod === "GET") {
        setBodyMode("none")
      } else {
        setBodyMode("raw")
        setRawBodyFormat("json")
      }

      // 새 API 선택 시 ID 초기화
      setApiSpecVersionId(null)
    }
  }, [selectedApi, selectedMethod])

  // 프로젝트 ID가 변경될 때 API 스펙 목록 가져오기
  useEffect(() => {
    console.log("RightContainer - 프로젝트 ID 변경 useEffect 실행:", scrudProjectId)
    if (scrudProjectId > 0) {
      fetchApiSpecsByProject(scrudProjectId).catch((err) => console.error(`프로젝트 ${scrudProjectId}의 API 스펙 목록 조회 오류:`, err))
    }
  }, [scrudProjectId, fetchApiSpecsByProject])

  // selectedApi와 selectedMethod가 변경될 때 apiSpecVersionId를 설정하는 useEffect
  useEffect(() => {
    if (selectedApi && selectedMethod) {
      // 선택된 API에 해당하는 API 스펙 찾기
      const foundSpec = apiSpecsList.find((spec) => spec.endpoint === selectedApi && spec.httpMethod === selectedMethod)

      if (foundSpec) {
        // API 스펙 ID 설정
        setApiSpecVersionId(foundSpec.apiSpecVersionId || null)
        setEndpoint(foundSpec.endpoint || "")
        setMethod(foundSpec.httpMethod || "GET")
        setDescription(foundSpec.description || "")
        setSummary(foundSpec.summary || "")

        // 기타 정보 설정...
        if (foundSpec.requestBody) {
          setRawBody(foundSpec.requestBody)
          setBodyMode("raw")
          setRawBodyFormat("json")
        }

        if (foundSpec.pathParameters) {
          setPathParamsJson(foundSpec.pathParameters)
        }

        if (foundSpec.queryParameters) {
          setQueryParamsJson(foundSpec.queryParameters)
        }

        if (foundSpec.response) {
          setResponseJson(foundSpec.response)
        }

        console.log("기존 API 선택:", foundSpec.apiSpecVersionId, foundSpec.endpoint)
      } else {
        // 새 API 생성 모드
        setApiSpecVersionId(null)
        setEndpoint(selectedApi)
        setMethod(selectedMethod)
        console.log("새 API 생성 모드")
      }
    }
  }, [selectedApi, selectedMethod, apiSpecsList])

  // JSON 형식 검사 및 포맷팅
  const formatJson = (jsonStr: string, setter: (formatted: string) => void) => {
    try {
      const parsed = JSON.parse(jsonStr)
      setter(JSON.stringify(parsed, null, 2))
    } catch (err) {
      console.error("JSON 형식이 올바르지 않습니다.", err)
    }
  }

  // API 조작 핸들러
  const { handleSaveApi, handleDeleteApi, handleTestApi } = useApiSpec({
    endpoint,
    method,
    summary,
    description,
    scrudProjectId,
    apiSpecVersionId,
    bodyMode,
    rawBodyFormat,
    rawBody,
    bodyParams,
    pathParamsJson,
    queryParamsJson,
    responseJson,
    setApiSpecVersionId,
    setEndpoint,
    setDescription,
    setSummary,
    setRawBody,
    setPathParamsJson,
    setQueryParamsJson,
    setResponseJson,
    setApiResponse,
    setIsLoading,
    fetchApiSpecsByProject,
    onApiSpecChanged,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
  })

  return (
    <div className="flex flex-col h-full bg-white overflow-auto">
      {/* 헤더 영역 */}
      <ApiHeader
        scrudProjectId={scrudProjectId}
        apiSpecVersionId={apiSpecVersionId}
        isLoading={isLoading}
        handleSaveApi={handleSaveApi}
        handleDeleteApi={handleDeleteApi}
        handleTestApi={handleTestApi}
      />

      {/* 기본 정보 입력 영역 */}
      <ApiForm
        summary={summary}
        setSummary={setSummary}
        method={method}
        setMethod={setMethod}
        endpoint={endpoint}
        setEndpoint={setEndpoint}
        description={description}
        setDescription={setDescription}
      />

      {/* 탭 영역 */}
      <div className="flex border-b text-sm bg-white">
        <button className={`px-4 py-2 ${activeTab === "Body" ? "border-b-2 border-blue-500 font-medium" : ""}`} onClick={() => setActiveTab("Body")}>
          Request Body
        </button>
        <button className={`px-4 py-2 ${activeTab === "Path" ? "border-b-2 border-blue-500 font-medium" : ""}`} onClick={() => setActiveTab("Path")}>
          Path 파라미터
        </button>
        <button className={`px-4 py-2 ${activeTab === "Query" ? "border-b-2 border-blue-500 font-medium" : ""}`} onClick={() => setActiveTab("Query")}>
          Query 파라미터
        </button>
        <button className={`px-4 py-2 ${activeTab === "Response" ? "border-b-2 border-blue-500 font-medium" : ""}`} onClick={() => setActiveTab("Response")}>
          Response
        </button>
      </div>

      {/* 탭 내용 영역 */}
      <div className="p-4">
        {activeTab === "Body" && (
          <BodyTab
            bodyMode={bodyMode}
            setBodyMode={setBodyMode}
            method={method}
            rawBodyFormat={rawBodyFormat}
            setRawBodyFormat={setRawBodyFormat}
            rawBody={rawBody}
            setRawBody={setRawBody}
            formatJson={formatJson}
            bodyParams={bodyParams}
            setBodyParams={setBodyParams}
          />
        )}

        {activeTab === "Path" && <PathParamsTab pathParamsJson={pathParamsJson} setPathParamsJson={setPathParamsJson} formatJson={formatJson} endpoint={endpoint} />}

        {activeTab === "Query" && <QueryParamsTab queryParamsJson={queryParamsJson} setQueryParamsJson={setQueryParamsJson} formatJson={formatJson} />}

        {activeTab === "Response" && <ResponseTab responseJson={responseJson} setResponseJson={setResponseJson} formatJson={formatJson} />}
      </div>

      {/* 응답 결과 영역 */}
      {apiResponse && <ApiResponse apiResponse={apiResponse} />}

      {/* 로딩 인디케이터 */}
      {isLoading && <LoadingIndicator />}
    </div>
  )
}
