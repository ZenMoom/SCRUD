"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { ExamplePageDto } from "@generated/model/example-page-dto";

export default function Home() {
  const [data, setData] = useState<ExamplePageDto | null>(null);
  const [envMode, setEnvMode] = useState<string>("");
  const helloWorld = process.env.NEXT_PUBLIC_HELLO_WORLD;

  const handleClick = async () => {
    const response = await axios.get("/api/examples");
    setData(response.data);
    console.log("jsonData", response.data);
  };

  useEffect(() => {
    axios.get("/api/env-mode").then((res) => setEnvMode(res.data));
  }, []);

  return (
    <div>
      <h1>예시 데이터 가져오기</h1>
      <h3>실행 환경: {envMode}</h3>
      <p>{helloWorld}</p>
      <button onClick={handleClick}>데이터 가져오기</button>

      {data && (
        <div>
          <h2>API 응답:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
