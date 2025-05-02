"use client"
// import Link from "next/link"
import { useState } from "react"
import { ProjectCard, NewProjectCard, Project } from "@/components/project-card"

export default function Home() {
  // 예시 프로젝트 데이터
  const [projects] = useState<Project[]>([
    {
      id: "1",
      title: "프로젝트 제목",
      description: "프로젝트 개요가 들어가는 부분이며 4줄 이하의 내용만 보 카드에 나타납니다. 이후는 말줄임표(...)로 추략됩니다. 크기는 20자 이하로 제한됩니다.",
      createdAt: "20xx.xx.xx",
    },
    {
      id: "2",
      title: "프로젝트 제목",
      description: "프로젝트 개요가 들어가는 부분이며 4줄 이하의 내용만 보 카드에 나타납니다. 이후는 말줄임표(...)로 추략됩니다. 크기는 20자 이하로 제한됩니다.",
      createdAt: "20xx.xx.xx",
    },
    {
      id: "3",
      title: "프로젝트 제목",
      description: "프로젝트 개요가 들어가는 부분이며 4줄 이하의 내용만 보 카드에 나타납니다. 이후는 말줄임표(...)로 추략됩니다. 크기는 20자 이하로 제한됩니다.",
      createdAt: "20xx.xx.xx",
    },
    {
      id: "4",
      title: "프로젝트 제목",
      description: "프로젝트 개요가 들어가는 부분이며 4줄 이하의 내용만 보 카드에 나타납니다. 이후는 말줄임표(...)로 추략됩니다. 크기는 20자 이하로 제한됩니다.",
      createdAt: "20xx.xx.xx",
    },
  ])

  // 새 프로젝트 생성 함수
  const createNewProject = () => {
    console.log("새 프로젝트 생성")
    // 실제로는 API 호출 등을 통해 새 프로젝트를 생성하고 목록에 추가하는 로직 구현
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 md:py-16">
      <h1 className="text-4xl font-bold mb-12 text-gray-800">바코드 님의 프로젝트</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* 프로젝트 카드 컴포넌트 사용 */}
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}

        {/* 새 프로젝트 추가 카드 컴포넌트 사용 */}
        <NewProjectCard onClick={createNewProject} />
      </div>
    </div>
  )
}
