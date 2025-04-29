import { NextResponse } from "next/server";
import { ExampleApi } from "@generated/api";
import { Configuration } from "@generated/configuration";

export async function GET() {
  const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

  const config = new Configuration({
    basePath: apiUrl,
  });
  const exampleApi = new ExampleApi(config);

  const response = await exampleApi.getExamplesWithPagination({
    page: 1,
    size: 5,
  });
  return NextResponse.json(response.data);
}
