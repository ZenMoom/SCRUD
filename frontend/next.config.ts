import type { NextConfig } from "next"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
  path: path.resolve(__dirname, "../infra/env/.env.development"),
})

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    domains: ["lh3.googleusercontent.com"], // 구글 이미지 도메인 추가
  },
}

export default nextConfig
