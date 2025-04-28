"use client";
import { useState } from 'react';
import { ExampleApi } from "@generated/api";
import { Configuration } from "@generated/configuration";
import { ExamplePageDto } from "@generated/model/example-page-dto";

export default function Home () {
  const [data, setData] = useState<ExamplePageDto | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const envMode = process.env.NEXT_PUBLIC_ENV_MODE;
  console.log('apiUrl', apiUrl);
  console.log('envMode', envMode);

  const config = new Configuration({
    basePath: apiUrl,
  });
  const exampleApi = new ExampleApi(config);

  const handleClick = async () => {

    const response = await exampleApi.getExamplesWithPagination({
      page: 1,
      size: 5
    });
    const jsonData = await response.data;
    setData(jsonData);

  };


  return (
    <div>
      <h1>예시 데이터 가져오기</h1>
      <button onClick={handleClick}>데이터 가져오기</button>

      {data && (
        <div>
          <h2>API 응답:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
