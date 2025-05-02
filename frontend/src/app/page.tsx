"use client"
import Link from "next/link"
import { useState } from "react"
import { ProjectCard, NewProjectCard, Project } from "@/components/project-card"

export default function Home() {
  // 예시 프로젝트 데이터
  const [projects] = useState<Project[]>([
    {
      id: "1",
      title: "프로젝트 제목",
      description: "프로젝트 개요가 들어가는 부분입니다. 이며 4줄 이하의 내용만 보기에 나타납니다. 이후는 말줄임표(...)로 표작됩니다. 크기는 20자 이하로 제한됩니다.",
      createdAt: "20xx.xx.xx",
    },
    {
      id: "2",
      title: "프로젝트 제목",
      description: "프로젝트 개요가 들어가는 부분입니다. 이며 4줄 이하의 내용만 보기에 나타납니다. 이후는 말줄임표(...)로 표작됩니다. 크기는 20자 이하로 제한됩니다.",
      createdAt: "20xx.xx.xx",
    },
    {
      id: "3",
      title: "프로젝트 제목",
      description: "프로젝트 개요가 들어가는 부분입니다. 이며 4줄 이하의 내용만 보기에 나타납니다. 이후는 말줄임표(...)로 표작됩니다. 크기는 20자 이하로 제한됩니다.",
      createdAt: "20xx.xx.xx",
    },
    {
      id: "4",
      title: "프로젝트 제목",
      description: "프로젝트 개요가 들어가는 부분입니다. 이며 4줄 이하의 내용만 보기에 나타납니다. 이후는 말줄임표(...)로 표작됩니다. 크기는 20자 이하로 제한됩니다.",
      createdAt: "20xx.xx.xx",
    },
  ])

  const router = useRouter();
  // 새 프로젝트 생성 함수
  const createNewProject = () => {
    console.log("새 프로젝트 생성")
    // 실제로는 API 호출 등을 통해 새 프로젝트를 생성하고 목록에 추가하는 로직 구현
    router.push("/globalsetting")

  }

  return (
    <div className="max-w-[90rem] mx-auto px-[5%] py-8">
      <h1 className="text-4xl font-bold mb-10 text-gray-800">바코드 님의 프로젝트</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {/* 프로젝트 카드 컴포넌트 사용 */}
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}

        {/* 새 프로젝트 추가 카드 컴포넌트 사용 */}
        <NewProjectCard onClick={createNewProject} />
      </div>

      {/* 테스트 페이지 링크 - 개발 중에만 사용, 필요하지 않으면 제거 */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg border-l-4 border-blue-500">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">개발자 테스트 섹션</h2>
        <Link href="/test" className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          API 테스트 페이지
        </Link>
      </div>
    </div>
  )
}
