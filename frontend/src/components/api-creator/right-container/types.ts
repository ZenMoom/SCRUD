// 공통으로 사용되는 타입 정의

export interface BodyParam {
  key: string
  value: string
}

export interface ApiResponseData {
  status: number
  data?: unknown
  error?: string
}

export interface ContentTypeMap {
  json: string
  text: string
  xml: string
  javascript: string
  html: string
}

export type BodyModeType = "none" | "form-data" | "x-www-form-urlencoded" | "raw" | "binary"
export type RawBodyFormatType = "json" | "text" | "xml" | "javascript" | "html"
export type HttpMethodType = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
