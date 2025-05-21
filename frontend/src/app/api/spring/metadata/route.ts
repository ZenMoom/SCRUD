import { NextResponse } from 'next/server';

export async function GET() {
  const SPRING_METADATA_REVALIDATE = 60 * 60 * 24 * 7 * 4; // 4 weeks

  const res = await fetch('https://start.spring.io/metadata/client', {
    method: 'GET',
    next: { revalidate: SPRING_METADATA_REVALIDATE },
  });
  const data = await res.json();
  return NextResponse.json(data);
}
