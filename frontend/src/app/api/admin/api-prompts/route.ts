import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

export async function GET(request: NextRequest) {
  try {
    // 1. 토큰 가져오기
    const token = (await cookies()).get('access_token')?.value;
    if (!token) {
      return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
    }

    // 2. 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ?? '1';
    const limit = searchParams.get('limit') ?? '10';
    const search = searchParams.get('search') ?? '';

    // 3. 실제 백엔드 요청 URL 구성
    const url = new URL(`${apiUrl}/api/v1/admin/api-prompts`);
    url.searchParams.set('page', page);
    url.searchParams.set('limit', limit);
    if (search) url.searchParams.set('search', search);

    // 4. fetch 호출
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error("백엔드 호출 실패:", res.status, await res.text());
      return NextResponse.json({ message: "백엔드 API 호출 실패" }, { status: res.status });
    }

    // 5. 응답 데이터 반환
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API 프록시 오류:", error);
    return NextResponse.json({ message: "서버 오류 발생" }, { status: 500 });
  }
}
