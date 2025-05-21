import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch('https://start.spring.io/metadata/client');
  const data = await res.json();
  return NextResponse.json(data);
}
