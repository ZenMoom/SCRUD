import { Dispatch, SetStateAction } from "react"
import axios, { AxiosError } from "axios"
import { ApiSpecVersionCreatedResponse, ApiSpecVersionResponse } from "@generated/model"
import { BodyParam, BodyModeType, RawBodyFormatType, ApiResponseData } from "../types"
import useAuthStore from "@/app/store/useAuthStore"

interface UseApiSpecProps {
  endpoint: string
  method: string
  summary: string
  description: string
  scrudProjectId: number
  apiSpecVersionId: number | null
  bodyMode: BodyModeType
  rawBodyFormat: RawBodyFormatType
  rawBody: string
  bodyParams: BodyParam[]
  pathParamsJson: string
  queryParamsJson: string
  responseJson: string
  setApiSpecVersionId: Dispatch<SetStateAction<number | null>>
  setEndpoint: Dispatch<SetStateAction<string>>
  setDescription: Dispatch<SetStateAction<string>>
  setSummary: Dispatch<SetStateAction<string>>
  setRawBody: Dispatch<SetStateAction<string>>
  setPathParamsJson: Dispatch<SetStateAction<string>>
  setQueryParamsJson: Dispatch<SetStateAction<string>>
  setResponseJson: Dispatch<SetStateAction<string>>
  setApiResponse: Dispatch<SetStateAction<ApiResponseData | null>>
  setIsLoading: Dispatch<SetStateAction<boolean>>
  fetchApiSpecsByProject: (projectId: number) => Promise<ApiSpecVersionResponse[]>
  onApiSpecChanged: () => void
  showSuccessNotification: (message: string) => void
  showErrorNotification: (message: string) => void
  showWarningNotification: (message: string) => void
  showInfoNotification: (message: string) => void
}

export const useApiSpec = ({
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
}: // showInfoNotification,
UseApiSpecProps) => {
  // useAuthStore에서 토큰 가져오기
  const { token } = useAuthStore()

  // 콘텐츠 타입 매핑
  // const contentTypeMap: Record<string, string> = {
  //   json: "application/json",
  //   text: "text/plain",
  //   xml: "application/xml",
  //   javascript: "application/javascript",
  //   html: "text/html",
  // }

  // API 생성 또는 업데이트 핸들러
  const handleSaveApi = async () => {
    console.log("API 저장 시작 - scrudProjectId:", scrudProjectId)

    if (!endpoint.trim()) {
      alert("API 엔드포인트를 입력해주세요.")
      return
    }

    setIsLoading(true)
    try {
      // 요청 본문 데이터 준비
      let requestBodyJson: string | null = null
      if (bodyMode === "raw" && rawBodyFormat === "json" && method !== "GET" && rawBody.trim()) {
        try {
          // 유효한 JSON인지 확인
          JSON.parse(rawBody)
          requestBodyJson = rawBody
        } catch (err) {
          console.error("JSON 형식이 올바르지 않습니다.", err)
          alert("요청 본문의 JSON 형식이 올바르지 않습니다. 확인 후 다시 시도해주세요.")
          setIsLoading(false)
          return
        }
      } else if ((bodyMode === "form-data" || bodyMode === "x-www-form-urlencoded") && bodyParams.some((param) => param.key.trim())) {
        const formData: Record<string, string> = {}
        bodyParams.forEach((param) => {
          if (param.key.trim()) {
            formData[param.key] = param.value
          }
        })
        requestBodyJson = JSON.stringify(formData)
      }

      // 경로 파라미터 검증
      let pathParametersJson: string | null = null
      if (endpoint.includes("{") && pathParamsJson.trim()) {
        try {
          // 유효한 JSON인지 확인
          JSON.parse(pathParamsJson)
          pathParametersJson = pathParamsJson
        } catch (err) {
          console.error("경로 파라미터 JSON 형식이 올바르지 않습니다.", err)
          alert("경로 파라미터의 JSON 형식이 올바르지 않습니다. 확인 후 다시 시도해주세요.")
          setIsLoading(false)
          return
        }
      }

      // 쿼리 파라미터 검증
      let queryParametersJson: string | null = null
      if (method === "GET" && queryParamsJson.trim()) {
        try {
          // 유효한 JSON인지 확인
          JSON.parse(queryParamsJson)
          queryParametersJson = queryParamsJson
        } catch (err) {
          console.error("쿼리 파라미터 JSON 형식이 올바르지 않습니다.", err)
          alert("쿼리 파라미터의 JSON 형식이 올바르지 않습니다. 확인 후 다시 시도해주세요.")
          setIsLoading(false)
          return
        }
      }

      // 응답 JSON 검증
      let responseJsonValue: string | null = null
      if (responseJson.trim()) {
        try {
          // 유효한 JSON인지 확인
          JSON.parse(responseJson)
          responseJsonValue = responseJson
        } catch (err) {
          console.error("응답 JSON 형식이 올바르지 않습니다.", err)
          alert("응답 예시의 JSON 형식이 올바르지 않습니다. 확인 후 다시 시도해주세요.")
          setIsLoading(false)
          return
        }
      }

      // API 스펙 데이터 생성
      const apiSpecData: Record<string, unknown> = {
        endpoint,
        httpMethod: method,
        summary: summary || endpoint.split("/").pop() || "API",
        description: description || "",
        scrudProjectId: scrudProjectId,
      }

      console.log("API 저장 - 현재 프로젝트 ID:", scrudProjectId, "데이터:", apiSpecData)

      // ID 필드 이름 변경 - id → apiSpecVersionId
      if (apiSpecVersionId) {
        apiSpecData.apiSpecVersionId = apiSpecVersionId
      }

      // HTTP 메서드별 차별화된 필드 추가 - 값이 있을 때만 필드 추가
      switch (method) {
        case "GET":
          if (queryParametersJson) {
            apiSpecData.queryParameters = queryParametersJson
          }

          if (pathParametersJson) {
            apiSpecData.pathParameters = pathParametersJson
          }
          break

        case "POST":
          if (requestBodyJson) {
            apiSpecData.requestBody = requestBodyJson
          }

          if (queryParametersJson) {
            apiSpecData.queryParameters = queryParametersJson
          }

          if (pathParametersJson) {
            apiSpecData.pathParameters = pathParametersJson
          }
          break

        case "PUT":
          if (requestBodyJson) {
            apiSpecData.requestBody = requestBodyJson
          }

          if (pathParametersJson) {
            apiSpecData.pathParameters = pathParametersJson
          }
          break

        case "PATCH":
          if (requestBodyJson) {
            apiSpecData.requestBody = requestBodyJson
          }

          if (pathParametersJson) {
            apiSpecData.pathParameters = pathParametersJson
          }
          break

        case "DELETE":
          if (pathParametersJson) {
            apiSpecData.pathParameters = pathParametersJson
          }
          break
      }

      // 응답 예시는 모든 메서드에 공통 - 값이 있을 때만 필드 추가
      if (responseJsonValue) {
        apiSpecData.response = responseJsonValue
      }

      // 헤더에 Bearer 토큰 추가
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      }

      let response

      // 기존 API 수정 또는 새 API 생성
      if (apiSpecVersionId) {
        // 디버깅용 로그 추가
        console.log("API 스펙 수정 요청 데이터:", JSON.stringify(apiSpecData, null, 2))

        response = await axios.put<ApiSpecVersionResponse>(`/api/api-specs/${apiSpecVersionId}`, apiSpecData, { headers })

        // 성공 처리
        setApiResponse({
          status: response.status,
          data: response.data,
        })

        // 성공 메시지 및 UI 업데이트
        const successMessage = `API가 성공적으로 수정되었습니다: ${method} ${endpoint}`
        showSuccessNotification(successMessage)
      } else {
        // API 스펙 생성 (Next.js API 라우트로 요청)
        console.log("API 스펙 생성 요청 데이터:", JSON.stringify(apiSpecData, null, 2))
        response = await axios.post<ApiSpecVersionCreatedResponse>("/api/api-specs", apiSpecData, { headers })

        // 응답 처리
        setApiResponse({
          status: response.status,
          data: response.data,
        })

        // API ID 설정 (향후 업데이트에 사용)
        if (response.data?.apiSpecVersionId) {
          setApiSpecVersionId(response.data.apiSpecVersionId)
        }

        // 성공 메시지 및 UI 업데이트
        const successMessage = `새 API가 성공적으로 생성되었습니다: ${method} ${endpoint}`
        showSuccessNotification(successMessage)
      }

      // 저장 후 목록 새로고침 및 상위 컴포넌트에 알림
      await fetchApiSpecsByProject(scrudProjectId)
      onApiSpecChanged()
    } catch (error) {
      console.error("API 생성/수정 오류:", error)

      // Axios 에러에서 더 자세한 정보 추출
      if (axios.isAxiosError(error) && error.response) {
        console.error("상세 오류 정보:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        })

        setApiResponse({
          status: error.response.status,
          error: error.response.data?.error || "API 생성/수정 중 오류가 발생했습니다.",
        })

        showErrorNotification(`API ${apiSpecVersionId ? "수정" : "생성"} 실패: ${error.response.data?.error || "알 수 없는 오류"}`)
      } else {
        setApiResponse({
          status: 500,
          error: "API 생성/수정 중 오류가 발생했습니다.",
        })

        showErrorNotification(`API ${apiSpecVersionId ? "수정" : "생성"} 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // API 삭제 핸들러
  const handleDeleteApi = async () => {
    if (!apiSpecVersionId) {
      showWarningNotification("삭제할 API가 없습니다.")
      return
    }

    if (!confirm(`정말로 이 API(${method} ${endpoint})를 삭제하시겠습니까?`)) {
      return
    }

    setIsLoading(true)
    try {
      console.log(`API 삭제 시작 - apiSpecVersionId: ${apiSpecVersionId}, 프로젝트 ID: ${scrudProjectId}`)

      // 헤더에 Bearer 토큰 추가
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
      }

      // API 스펙 삭제 요청 (Next.js API 라우트로 요청)
      const response = await axios.delete(`/api/api-specs/${apiSpecVersionId}`, { headers })

      setApiResponse({
        status: response.status,
        data: response.data,
      })

      // 폼 초기화
      setApiSpecVersionId(null)
      setEndpoint("")
      setDescription("")
      setSummary("")
      setRawBody("")
      setPathParamsJson("")
      setQueryParamsJson("")
      setResponseJson("")

      // 삭제 후 목록 새로고침
      await fetchApiSpecsByProject(scrudProjectId)
      onApiSpecChanged()

      // 성공 메시지
      showSuccessNotification(`API가 성공적으로 삭제되었습니다.`)
    } catch (error) {
      console.error("API 삭제 오류:", error)
      const err = error as Error | AxiosError

      if (axios.isAxiosError(err) && err.response) {
        setApiResponse({
          status: err.response.status,
          error: err.response.data?.error || "API 삭제 중 오류가 발생했습니다.",
        })
        showErrorNotification(`API 삭제 실패: ${err.response.data?.error || "알 수 없는 오류"}`)
      } else {
        setApiResponse({
          status: 500,
          error: "API 삭제 중 오류가 발생했습니다.",
        })
        showErrorNotification(`API 삭제 실패: ${err.message || "알 수 없는 오류"}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // API 테스트 실행
  // const handleTestApi = async () => {
  //   if (!endpoint.trim()) {
  //     showWarningNotification("API 엔드포인트를 입력해주세요.")
  //     return
  //   }

  //   setIsLoading(true)
  //   try {
  //     console.log(`API 테스트 시작 - 엔드포인트: ${endpoint}, 프로젝트 ID: ${scrudProjectId}`)

  //     // Body 모드에 따라 다른 요청 데이터 구성
  //     let requestBodyData: string | Record<string, unknown> | FormData | null = null
  //     const headers: Record<string, string> = {
  //       Authorization: token ? `Bearer ${token}` : "", // Bearer 토큰 추가
  //     }

  //     if (bodyMode === "raw" && rawBody.trim()) {
  //       if (rawBodyFormat === "json") {
  //         try {
  //           requestBodyData = JSON.parse(rawBody)
  //           headers["Content-Type"] = "application/json"
  //         } catch (err) {
  //           console.error("JSON 형식이 올바르지 않습니다.", err)
  //           showErrorNotification("요청 본문의 JSON 형식이 올바르지 않습니다.")
  //           setIsLoading(false)
  //           return
  //         }
  //       } else {
  //         requestBodyData = rawBody
  //         headers["Content-Type"] = contentTypeMap[rawBodyFormat]
  //       }
  //     } else if (bodyMode === "form-data") {
  //       const formData = new FormData()
  //       bodyParams.forEach((param) => {
  //         if (param.key.trim()) {
  //           formData.append(param.key, param.value)
  //         }
  //       })
  //       requestBodyData = formData
  //     } else if (bodyMode === "x-www-form-urlencoded") {
  //       const urlEncoded = new URLSearchParams()
  //       bodyParams.forEach((param) => {
  //         if (param.key.trim()) {
  //           urlEncoded.append(param.key, param.value)
  //         }
  //       })
  //       requestBodyData = urlEncoded.toString()
  //       headers["Content-Type"] = "application/x-www-form-urlencoded"
  //     }

  //     // 쿼리 파라미터 구성
  //     let finalEndpoint = endpoint
  //     if (method === "GET" && queryParamsJson.trim()) {
  //       try {
  //         const queryParams = JSON.parse(queryParamsJson)
  //         const queryString = Object.entries(queryParams)
  //           .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  //           .join("&")

  //         if (queryString) {
  //           finalEndpoint += `?${queryString}`
  //         }
  //       } catch (err) {
  //         console.error("쿼리 파라미터 파싱 오류", err)
  //         showWarningNotification("쿼리 파라미터 파싱 중 오류가 발생했습니다.")
  //       }
  //     }

  //     // 경로 파라미터 대체
  //     if (endpoint.includes("{") && pathParamsJson.trim()) {
  //       try {
  //         const pathParams = JSON.parse(pathParamsJson)
  //         let processedEndpoint = finalEndpoint

  //         // 경로의 {parameter} 부분을 실제 값으로 대체
  //         Object.entries(pathParams).forEach(([key, value]) => {
  //           processedEndpoint = processedEndpoint.replace(`{${key}}`, String(value))
  //         })

  //         finalEndpoint = processedEndpoint
  //       } catch (err) {
  //         console.error("경로 파라미터 파싱 오류", err)
  //         showWarningNotification("경로 파라미터 파싱 중 오류가 발생했습니다.")
  //       }
  //     }

  //     // 백엔드 서버 요청을 Next.js API 라우트로 프록시
  //     const testApiUrl = `/api/test${finalEndpoint}`

  //     // 테스트 시작 알림
  //     showInfoNotification(`API 테스트 요청 중... (${method} ${finalEndpoint})`)

  //     let response

  //     switch (method) {
  //       case "GET":
  //         response = await axios.get(testApiUrl, { headers })
  //         break
  //       case "POST":
  //         response = await axios.post(testApiUrl, requestBodyData, { headers })
  //         break
  //       case "PUT":
  //         response = await axios.put(testApiUrl, requestBodyData, { headers })
  //         break
  //       case "PATCH":
  //         response = await axios.patch(testApiUrl, requestBodyData, { headers })
  //         break
  //       case "DELETE":
  //         response = await axios.delete(testApiUrl, {
  //           data: requestBodyData,
  //           headers,
  //         })
  //         break
  //       default:
  //         throw new Error("지원하지 않는 HTTP 메소드입니다.")
  //     }

  //     // 테스트 성공
  //     setApiResponse({
  //       status: response.status,
  //       data: response.data,
  //     })

  //     // 성공 메시지
  //     showSuccessNotification(`API 테스트 성공: ${response.status} ${response.statusText}`)
  //   } catch (error) {
  //     console.error("API 테스트 오류:", error)
  //     const err = error as Error | AxiosError

  //     if (axios.isAxiosError(err) && err.response) {
  //       setApiResponse({
  //         status: err.response.status,
  //         error: err.response.data?.error || "API 테스트 중 오류가 발생했습니다.",
  //       })
  //       showErrorNotification(`API 테스트 실패: ${err.response.status} ${err.response.statusText}`)
  //     } else {
  //       setApiResponse({
  //         status: 500,
  //         error: "API 테스트 중 오류가 발생했습니다.",
  //       })
  //       showErrorNotification(`API 테스트 실패: ${err.message || "알 수 없는 오류"}`)
  //     }
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  return {
    handleSaveApi,
    handleDeleteApi,
    // handleTestApi,
  }
}
