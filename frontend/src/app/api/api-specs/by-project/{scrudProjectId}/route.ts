import { NextResponse } from "next/server"
import { ApiSpecApi } from "@generated/api"
import { Configuration } from "@generated/configuration"

// Scrud 프로젝트 ID로 API 스펙 가져오기
export async function GET() {
  const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL

  const config = new Configuration({
    basePath: apiUrl,
  })
  const apiSpecApi = new ApiSpecApi(config)

  const response = await apiSpecApi.getApiSpecsByScrudProjectId({
    scrudProjectId: 1,
  })
  return NextResponse.json(response.data)
}
