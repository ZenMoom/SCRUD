import { formatToKST } from "@/util/dayjs";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 인증 토큰 확인 (실제 구현 시 필요)
    const token = (await cookies()).get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 })
    }

    const { id } = params

    // ID로 프롬프트 찾기
    const res = await fetch(`${apiUrl}/api/v1/admin/api-prompts/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: 60 * 60 * 24 * 365,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ message: "해당 ID의 API 프롬프트를 찾을 수 없습니다." }, { status: 404 })
    }

    const prompt = await res.json()
    return NextResponse.json(prompt)
  } catch (error) {
    console.error(formatToKST(new Date().toISOString()), "API 프롬프트 상세 조회 오류:", error)
    return NextResponse.json({ message: "API 프롬프트 상세 정보를 불러오는데 실패했습니다." }, { status: 500 })
  }
}
