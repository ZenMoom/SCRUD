import { NextResponse } from "next/server"
import { RuleApi } from "@generated/api"
import { Configuration } from "@generated/configuration"

// 사용 가능한 rule 목록 조회
export async function GET() {
  const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL
  const config = new Configuration({
    basePath: apiUrl,
  })
  const ruleApi = new RuleApi(config)

  // rule 목록 조회 요청
  const response = await ruleApi.getRules()
  return NextResponse.json(response.data)
}
