import { NextResponse } from "next/server";

export async function GET() {
  const apiUrl = process.env.NEXT_PRIVATE_ENV_MODE;

  return NextResponse.json(apiUrl);
}
