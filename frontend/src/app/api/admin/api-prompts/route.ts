import { formatToKST } from "@/util/dayjs"
import { type NextRequest, NextResponse } from "next/server"

// 더미 데이터 생성 함수 (실제 구현 시 DB에서 가져와야 함)
export function generateDummyApiPrompts(count: number) {
  const prompts = []
  for (let i = 1; i <= count; i++) {
    prompts.push({
      apiPromptId: `prompt-${i}`,
      prompt: `이 API는 사용자 데이터를 처리하는 엔드포인트입니다. 요청 파라미터로는 userId가 필요하며, 응답으로는 사용자 정보가 반환됩니다. 예시 요청: GET /api/users/{userId} 예시 응답: { "id": "user-123", "name": "홍길동", "email": "hong@example.com" }`,
      response: `이 API는 사용자 ID를 기반으로 사용자 정보를 조회합니다. 응답에는 사용자의 ID, 이름, 이메일 주소가 포함됩니다. 상태 코드 200은 성공적인 응답을 의미하며, 404는 사용자를 찾을 수 없음을 의미합니다.`,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000)).toISOString(),
      updatedAt: new Date(Date.now() - Math.floor(Math.random() * 1000000)).toISOString(),
    })
  }
  return prompts
}

// 더미 데이터 (실제 구현 시 DB에서 가져와야 함)
const dummyApiPrompts = generateDummyApiPrompts(50)

export async function GET(request: NextRequest) {
  try {
    // 인증 토큰 확인 (실제 구현 시 필요)
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 })
    }

    // 토큰 추출 및 검증 (실제 구현 시 JWT 검증 필요)
    const token = authHeader.split(" ")[1]
    if (!token) {
      return NextResponse.json({ message: "유효하지 않은 토큰입니다." }, { status: 401 })
    }

    // 페이지네이션 파라미터
    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const search = url.searchParams.get("search") || ""

    // 검색 필터링
    let filteredPrompts = dummyApiPrompts
    if (search) {
      filteredPrompts = dummyApiPrompts.filter(
        (p) =>
          p.apiPromptId.toLowerCase().includes(search.toLowerCase()) ||
          p.prompt.toLowerCase().includes(search.toLowerCase()) ||
          p.response.toLowerCase().includes(search.toLowerCase()),
      )
    }

    // 페이지네이션 적용
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const paginatedPrompts = filteredPrompts.slice(startIndex, endIndex)

    // 응답 데이터 구성
    const totalItems = filteredPrompts.length
    const totalPages = Math.ceil(totalItems / limit)

    return NextResponse.json({
      prompts: paginatedPrompts,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    })
  } catch (error) {
    console.error(formatToKST(new Date().toISOString()), "API 프롬프트 목록 조회 오류:", error)
    return NextResponse.json({ message: "API 프롬프트 목록을 불러오는데 실패했습니다." }, { status: 500 })
  }
}
