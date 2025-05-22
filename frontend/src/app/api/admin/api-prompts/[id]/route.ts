import { formatToKST } from "@/util/dayjs"
import { type NextRequest, NextResponse } from "next/server"
import { generateDummyApiPrompts } from "../route"

// 더미 데이터 (실제 구현 시 DB에서 가져와야 함)
const dummyApiPrompts = generateDummyApiPrompts(50)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params

    // ID로 프롬프트 찾기
    const prompt = dummyApiPrompts.find((p) => p.apiPromptId === id)

    if (!prompt) {
      return NextResponse.json({ message: "해당 ID의 API 프롬프트를 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json(prompt)
  } catch (error) {
    console.error(formatToKST(new Date().toISOString()), "API 프롬프트 상세 조회 오류:", error)
    return NextResponse.json({ message: "API 프롬프트 상세 정보를 불러오는데 실패했습니다." }, { status: 500 })
  }
}
