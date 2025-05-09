import { NextRequest, NextResponse } from "next/server"
import { ApiSpecApi } from "@generated/api"
import { Configuration } from "@generated/configuration"

export async function GET(request: NextRequest, context: { params: { scrudProjectId: string } }) {
  try {
    // params를 비동기적으로 처리
    const params = await context.params
    const scrudProjectId = Number(params.scrudProjectId)

    if (isNaN(scrudProjectId)) {
      return NextResponse.json({ error: "유효하지 않은 프로젝트 ID입니다." }, { status: 400 })
    }

    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL
    const config = new Configuration({
      basePath: apiUrl,
    })
    const apiSpecApi = new ApiSpecApi(config)

    const response = await apiSpecApi.getApiSpecsByScrudProjectId({
      scrudProjectId,
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    console.error("API 스펙 목록 조회 오류:", error)

    const errorMessage = error instanceof Error ? error.message : "API 스펙 목록 조회 중 오류가 발생했습니다."

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
