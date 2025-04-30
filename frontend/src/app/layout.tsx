import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "./components/header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "나의 Next.js 프로젝트",
  description: "Next.js와 TypeScript로 만든 프로젝트입니다.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
