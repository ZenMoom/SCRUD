"use client";

import { MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import useAuthStore from "../../app/store/useAuthStore";

export default function Header() {
  // 로고 이미지 경로
  const logoPath = "/logo.png";
  // 개발자 메뉴 상태 관리
  const [showDevMenu, setShowDevMenu] = useState(false);
  // 프로필 메뉴 상태 관리
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // 헤더 표시 여부 상태
  const [showHeader, setShowHeader] = useState(true);
  // OpenAI API 토큰 모달 상태
  const [showTokenModal, setShowTokenModal] = useState(false);
  // OpenAI API 토큰 입력값
  const [apiToken, setApiToken] = useState("");
  // 토큰 저장 중 상태
  const [isSaving, setIsSaving] = useState(false);
  // 토큰 저장 결과 메시지
  const [tokenMessage, setTokenMessage] = useState("");

  // 인증 상태 및 기능 가져오기
  const { isAuthenticated, user, logout, token } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // 현재 경로 확인 및 헤더 표시 여부 결정
  useEffect(() => {
    // 현재 경로가 canvas/{projectId}/{apiId} 패턴인지 확인
    const isCanvasRoute = pathname && /^\/canvas\/[^/]+\/[^/]+/.test(pathname);
    const isProjectApiRoute = pathname && /^\/project\/[^/]+\/api/.test(pathname);
    // canvas 경로에서는 헤더를 표시하지 않음
    setShowHeader(!isCanvasRoute && !isProjectApiRoute);
  }, [pathname]);

  // 로그인 버튼 클릭 핸들러
  const handleLoginClick = useCallback(() => {
    router.push("/login");
  }, [router]);

  // 로그아웃 핸들러
  const handleLogout = useCallback(() => {
    logout();
    setShowProfileMenu(false);
    router.push("/login");
  }, [logout, router]);

  // OpenAI API 토큰 저장 핸들러
  const handleSaveToken = async () => {
    if (!apiToken.trim()) {
      setTokenMessage("토큰을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("http://localhost:8080/api/v1/OpenAI", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiToken),
      });

      if (response.ok) {
        setTokenMessage("토큰이 성공적으로 저장되었습니다.");
        setApiToken("");
        setTimeout(() => {
          setShowTokenModal(false);
          setTokenMessage("");
        }, 2000);
      } else {
        setTokenMessage("토큰 저장에 실패했습니다.");
      }
    } catch (error) {
      setTokenMessage("토큰 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 클릭 이벤트 핸들러 (드롭다운 외부 클릭 시 닫기)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // 개발자 메뉴 외부 클릭 시 메뉴 닫기
      if (showDevMenu && !target.closest(".dev-menu-container")) {
        setShowDevMenu(false);
      }

      // 프로필 메뉴 외부 클릭 시 메뉴 닫기
      if (showProfileMenu && !target.closest(".profile-menu-container")) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDevMenu, showProfileMenu]);

  // 헤더를 표시하지 않는 경우 null 반환
  if (!showHeader) {
    return null;
  }

  return (
    <header className="h-[60px] sticky top-0 z-50 w-full bg-white">
      <div className="flex items-center justify-between w-full h-full">
        {/* 로고 영역 */}
        <div className="flex items-center ml-4">
          <Link
            href="/"
            className="cursor-pointer"
          >
            <Image
              src={logoPath || "/placeholder.svg"}
              alt="로고"
              width={120}
              height={40}
              priority
            />
          </Link>
        </div>

        {/* 우측 영역 */}
        <div className="flex items-center gap-4 mr-4">
          {isAuthenticated && (
            <button
              onClick={() => setShowTokenModal(true)}
              className="hover:bg-gray-100 flex items-center gap-1 px-2 py-1 text-xs text-gray-700 transition border border-gray-300 rounded-md"
            >
              <span>OpenAI 토큰 입력</span>
            </button>
          )}

          {/* 피드백 버튼 */}
          <button
            onClick={() => router.push("/feedback")}
            className="hover:bg-gray-100 flex items-center gap-1 px-2 py-1 text-xs text-gray-700 transition border border-gray-300 rounded-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="sm:inline hidden">피드백</span>
          </button>

          {/* 로그인 버튼 또는 프로필 아이콘 */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors">
                  {user.profileImgUrl ? (
                    <Image
                      src={user.profileImgUrl}
                      alt="프로필"
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>

              {/* 프로필 메뉴 */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleLoginClick}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-md text-sm transition-colors"
            >
              로그인
            </button>
          )}
        </div>
      </div>

      {/* OpenAI API 토큰 입력 모달 */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">OpenAI API 토큰 입력</h3>
            <input
              type="text"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="OpenAI API 토큰을 입력하세요"
              className="w-full px-3 py-2 border rounded-md mb-4"
            />
            {tokenMessage && (
              <p className={`text-sm mb-4 ${tokenMessage.includes("성공") ? "text-green-600" : "text-red-600"}`}>
                {tokenMessage}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowTokenModal(false);
                  setApiToken("");
                  setTokenMessage("");
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                취소
              </button>
              <button
                onClick={handleSaveToken}
                disabled={isSaving}
                className={`px-4 py-2 bg-blue-500 text-white rounded-md ${
                  isSaving ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
                }`}
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
