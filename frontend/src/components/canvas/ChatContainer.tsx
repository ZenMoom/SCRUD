'use client';

import type React from 'react';

import useAuthStore from '@/app/store/useAuthStore';
import { formatToKST } from '@/util/dayjs';
import type { ChatHistoryResponse } from '@generated/model';
import axios from 'axios';
import { ArrowUp, Clock, Copy, Info, Maximize2, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import type { TargetNode } from './DiagramContainer';

// 채팅 컨테이너 속성 타입 정의
interface ChatContainerProps {
  projectId: string;
  apiId: string;
  versionId: string;
  chatData: ChatHistoryResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  targetNodes: TargetNode[];
  onVersionSelect?: (versionId: string) => void;
  onNewVersionInfo?: (versionInfo: { newVersionId: string; description: string }) => void;
}

// SSE 응답 타입 정의
interface SSEResponse {
  token?: string | { newVersionId?: string };
  chunk?: string;
  message?: string;
  status?: string;
  versionInfo?: {
    newVersionId: string;
    description: string;
  };
  error?: string;
  text?: string;
  done?: boolean;
}

// SSEIdResponse 인터페이스 정의
interface SSEIdResponse {
  streamId?: string;
}

// 채팅 메시지 타입 정의
interface ChatMessage {
  id: string;
  type: 'user' | 'system' | 'version';
  message: string;
  timestamp: string;
  versionInfo?: {
    versionId: string;
    description: string;
  };
  targetMethods?: Array<{ methodId: string }>;
  tag?: string;
}

// 요청 태그 타입 정의
type RequestTag = 'EXPLAIN' | 'REFACTORING' | 'OPTIMIZE' | 'IMPLEMENT';

export default function ChatContainer({
  projectId,
  apiId,
  versionId,
  chatData,
  loading,
  error,
  onRefresh,
  targetNodes,
  onVersionSelect,
  onNewVersionInfo,
}: ChatContainerProps) {
  // 상태 관리
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [lastSentMessage, setLastSentMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<RequestTag>('IMPLEMENT');
  const [sseConnected, setSSEConnected] = useState<boolean>(false);
  const [currentSSEId, setCurrentSSEId] = useState<string | null>(null);
  const [sseError, setSSEError] = useState<string | null>(null);
  const [accumulatedText, setAccumulatedText] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [currentMessageCompleted, setCurrentMessageCompleted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [shouldShowTempMessage, setShouldShowTempMessage] = useState<boolean>(true);
  const [expandedCode, setExpandedCode] = useState<{ code: string; language: string } | null>(null);

  // 최신 버전을 추적하기 위한 참조 변수 추가 (useState 선언 아래에 추가)
  const latestVersionIdRef = useRef<string | null>(null);

  // 참조 변수
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeSSEIdRef = useRef<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();

  // SSE 연결 해제 함수
  const disconnectSSE = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.onopen = null;
      eventSourceRef.current.onmessage = null;
      eventSourceRef.current.onerror = null;
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setSSEConnected(false);
      setIsConnecting(false);
      setCurrentSSEId(null);
      activeSSEIdRef.current = null;
    }
  }, []);

  const handleSSEMessage = useCallback(
    (event: MessageEvent) => {
      try {
        if (currentMessageCompleted && !activeSSEIdRef.current) {
          return;
        }

        let parsedData: SSEResponse | null = null;

        // 다양한 형식의 파싱 시도
        try {
          // 1. 'event:message\ndata:{"token": {"newVersionId": "2"}}' 형식 처리
          if (event.data.includes('event:message') && event.data.includes('data:')) {
            const dataMatch = event.data.match(/data:(.*)/);
            if (dataMatch && dataMatch[1]) {
              parsedData = JSON.parse(dataMatch[1].trim());
            }
          }
          // 2. 일반 JSON 파싱 시도
          else {
            parsedData = JSON.parse(event.data);
          }
        } catch {
          if (event.data.startsWith('data:')) {
            try {
              const jsonStr = event.data.substring(5).trim();
              parsedData = JSON.parse(jsonStr);
            } catch {
              parsedData = { text: event.data };
            }
          } else {
            // 4. 마지막 수단: 원본 텍스트 사용
            parsedData = { text: event.data };
          }
        }

        if (parsedData && parsedData.error) {
          setSSEError(parsedData.error);
          return;
        }

        // token이 객체인 경우 newVersionId 확인
        if (parsedData && parsedData.token && typeof parsedData.token === 'object') {
          const tokenObj = parsedData.token as { newVersionId?: string };
          if (tokenObj.newVersionId) {
            // 현재 버전이 더 높은 경우에만 업데이트
            const newVersionNum = Number.parseInt(tokenObj.newVersionId, 10);
            const currentVersionNum = latestVersionIdRef.current ? Number.parseInt(latestVersionIdRef.current, 10) : 0;

            if (newVersionNum > currentVersionNum) {
              // 최신 버전 ID 업데이트
              latestVersionIdRef.current = tokenObj.newVersionId;

              // 새 버전 정보 저장
              const newVersionInfo = {
                newVersionId: tokenObj.newVersionId,
                description: '새 버전',
              };

              // 즉시 URL 업데이트 및 다이어그램 요청
              if (onNewVersionInfo) {
                onNewVersionInfo(newVersionInfo);
              }

              // URL 직접 업데이트 (필요한 경우)
              if (projectId && apiId) {
                const newUrl = `/canvas/${projectId}/${apiId}?version=${tokenObj.newVersionId}`;

                // 현재 URL과 다른 경우에만 업데이트
                if (
                  window.location.pathname.includes(`/canvas/${projectId}/${apiId}`) &&
                  !window.location.search.includes(`version=${tokenObj.newVersionId}`)
                ) {
                  window.history.pushState({}, '', newUrl);
                }
              }
            }

            // 텍스트 표시를 위해 객체를 문자열로 변환
            try {
              const tokenStr = JSON.stringify(parsedData.token);
              setAccumulatedText((prev) => {
                const newText = prev + tokenStr;
                return newText;
              });
            } catch (e) {
              console.error(formatToKST(new Date().toISOString()), '❌ 토큰 객체 변환 오류:', e);
            }
          }
        }
        // token이 문자열인 경우 기존 처리 유지
        else if (parsedData && parsedData.token && typeof parsedData.token === 'string') {
          setAccumulatedText((prev) => {
            // Clean up the token to handle potential markdown formatting issues
            let token = parsedData!.token as string;

            // Replace escaped newlines with actual newlines
            token = token.replace(/\\n/g, '\n');

            // Fix markdown headers that might be escaped
            token = token.replace(/\\#/g, '#');

            // Handle incomplete code blocks by ensuring they're properly closed
            const openCodeBlocks = (prev.match(/```[a-z]*(?!\s*```)/g) || []).length;
            const closeCodeBlocks = (prev.match(/```\s*$/g) || []).length;

            if (openCodeBlocks > closeCodeBlocks && !token.includes('```')) {
              // If we have an open code block and the new token doesn't close it,
              // we'll treat it as part of the code block
              token = token.replace(/\n/g, '\n');
            }

            // Check if we're receiving a code block start
            if (token.includes('```') && !prev.endsWith('```') && !token.match(/```[a-z]*\s*```/)) {
              // This is the start of a code block, preserve formatting
              token = token.replace(/\n/g, '\n');
            }

            const newText = prev + token;
            return newText;
          });
        }

        // 디버깅 메시지에서 토큰 추출
        if (parsedData && parsedData.text) {
          const tokenMatch = String(parsedData.text).match(/\[디버깅\] 새 토큰 수신: (.*)/);
          if (tokenMatch && tokenMatch[1]) {
            const token = tokenMatch[1].trim();
            setAccumulatedText((prev) => {
              const newText = prev + token;
              return newText;
            });
          }
        }

        // chunk 필드 확인
        if (parsedData && parsedData.chunk) {
          const tokenMatch = String(parsedData.chunk).match(/\[디버깅\] 새 토큰 수신: (.*)/);
          if (tokenMatch && tokenMatch[1]) {
            const token = tokenMatch[1].trim();
            setAccumulatedText((prev) => {
              const newText = prev + token;
              return newText;
            });
          }
        }

        // versionInfo 필드 확인
        if (parsedData && parsedData.versionInfo) {
          // 현재 버전이 더 높은 경우에만 업데이트
          const newVersionNum = Number.parseInt(parsedData.versionInfo.newVersionId, 10);
          const currentVersionNum = latestVersionIdRef.current ? Number.parseInt(latestVersionIdRef.current, 10) : 0;

          if (newVersionNum > currentVersionNum) {
            // 최신 버전 ID 업데이트
            latestVersionIdRef.current = parsedData.versionInfo.newVersionId;

            // 새 버전 정보 저장

            // 새 버전 정보 즉시 전달 및 URL 업데이트
            if (onNewVersionInfo) {
              onNewVersionInfo(parsedData.versionInfo);
            }

            // URL 직접 업데이트 (필요한 경우)
            if (projectId && apiId && parsedData.versionInfo.newVersionId) {
              const newUrl = `/canvas/${projectId}/${apiId}?version=${parsedData.versionInfo.newVersionId}`;

              // 현재 URL과 다른 경우에만 업데이트
              if (
                window.location.pathname.includes(`/canvas/${projectId}/${apiId}`) &&
                !window.location.search.includes(`version=${parsedData.versionInfo.newVersionId}`)
              ) {
                window.history.pushState({}, '', newUrl);
              }
            }
          }
        }

        // 완료 메시지 확인
        const isCompleted =
          (parsedData && parsedData.status === 'COMPLETED') ||
          (parsedData &&
            parsedData.message &&
            (parsedData.message.includes('완료') ||
              parsedData.message.includes('SSE 연결이 종료') ||
              parsedData.message.includes('종료'))) ||
          (parsedData &&
            parsedData.token &&
            typeof parsedData.token === 'string' &&
            parsedData.token.includes('완료')) ||
          (parsedData && parsedData.done === true);

        if (isCompleted) {
          setCurrentMessageCompleted(true);
          disconnectSSE();

          // 저장된 최신 버전 정보가 있으면 SSE 완료 후 다시 한번 확인
          if (latestVersionIdRef.current && onNewVersionInfo) {
            const finalVersionInfo = {
              newVersionId: latestVersionIdRef.current,
              description: '최종 버전',
            };

            onNewVersionInfo(finalVersionInfo);

            // URL 직접 업데이트 (필요한 경우)
            if (projectId && apiId) {
              const newUrl = `/canvas/${projectId}/${apiId}?version=${latestVersionIdRef.current}`;

              // 현재 URL과 다른 경우에만 업데이트
              if (
                window.location.pathname.includes(`/canvas/${projectId}/${apiId}`) &&
                !window.location.search.includes(`version=${latestVersionIdRef.current}`)
              ) {
                window.history.pushState({}, '', newUrl);
              }
            }
          }

          setTimeout(() => {
            onRefresh().then(() => {
              // 채팅 내역 새로고침 후 임시 메시지 상태 초기화
              setShouldShowTempMessage(false);
              setAccumulatedText('');
              setLastSentMessage('');
            });
            setCurrentMessageCompleted(false);
          }, 500);
        }
      } catch (err) {
        console.error(formatToKST(new Date().toISOString()), '❌ SSE 메시지 처리 오류:', err);
      }
    },
    [
      currentMessageCompleted,
      disconnectSSE,
      onRefresh,
      onNewVersionInfo,
      projectId,
      apiId,
      setAccumulatedText,
      setCurrentMessageCompleted,
      setShouldShowTempMessage,
      setLastSentMessage,
    ]
  );

  // 채팅 데이터가 변경될 때 임시 메시지 초기화
  useEffect(() => {
    if (chatData && chatData.content) {
      // 채팅 내역이 로드되면 임시 메시지 상태 초기화
      setShouldShowTempMessage(false);

      // 마지막 메시지가 이미 채팅 내역에 포함되어 있는지 확인
      const lastMessageInHistory = chatData.content.some(
        (item) => item.userChat?.message === lastSentMessage && lastSentMessage !== ''
      );

      if (lastMessageInHistory) {
        setAccumulatedText('');
        setLastSentMessage('');
      }
    }
  }, [chatData, lastSentMessage, setAccumulatedText, setLastSentMessage, setShouldShowTempMessage]);

  // 재연결 처리 함수
  const handleReconnect = useCallback(() => {
    if (currentMessageCompleted) {
      return;
    }

    if (retryCountRef.current >= maxRetries) {
      setSSEError(`서버 연결 실패: 최대 재시도 횟수(${maxRetries})를 초과했습니다.`);
      setIsConnecting(false);
      return;
    }

    retryCountRef.current++;
    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 16000);
    setSSEError(`연결 실패: ${delay / 1000}초 후 재연결 시도 (${retryCountRef.current}/${maxRetries})`);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!sseConnected && !eventSourceRef.current && currentSSEId && !currentMessageCompleted) {
        setCurrentSSEId((prevId) => {
          if (prevId) {
            return prevId + '_reconnect';
          }
          return prevId;
        });
      }
    }, delay);
  }, [currentMessageCompleted, currentSSEId, sseConnected, setIsConnecting, setSSEError, setCurrentSSEId]);

  // SSE 에러 핸들러
  const handleSSEError = useCallback(
    (err: Event) => {
      console.error(formatToKST(new Date().toISOString()), '❌ SSE 연결 오류:', err);

      if (currentMessageCompleted) {
        return;
      }

      if (eventSourceRef.current) {
        if (eventSourceRef.current.readyState === EventSource.CLOSED) {
          handleReconnect();
        } else if (eventSourceRef.current.readyState === EventSource.CONNECTING) {
          setSSEError('서버에 연결 중입니다. 잠시만 기다려 주세요.');
        } else {
          setSSEError('서버 이벤트 스트림 연결 중 오류가 발생했습니다.');
        }
      }
    },
    [currentMessageCompleted, handleReconnect, setSSEError]
  );

  const connectToSSE = useCallback(
    (sseId: string) => {
      if (sseId !== activeSSEIdRef.current) {
        setCurrentMessageCompleted(false);
      } else if (currentMessageCompleted) {
        return;
      }

      if (isConnecting && eventSourceRef.current) {
        return;
      }

      disconnectSSE();

      activeSSEIdRef.current = sseId;
      setIsConnecting(true);
      setCurrentSSEId(sseId);
      setSSEError(null);
      setShouldShowTempMessage(true);

      try {
        const eventSource = new EventSource(`/api/sse/connect/${sseId}`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setSSEConnected(true);
          setSSEError(null);
          setIsConnecting(false);
          retryCountRef.current = 0;
        };

        eventSource.onmessage = (event) => {
          handleSSEMessage(event);
        };

        eventSource.onerror = (err) => {
          console.error(formatToKST(new Date().toISOString()), '❌ SSE 연결 오류:', err);
          handleSSEError(err);
        };
      } catch (err) {
        console.error(formatToKST(new Date().toISOString()), '❌ SSE 연결 설정 오류:', err);
        setSSEError('서버 이벤트 스트림 연결을 설정하는 중 오류가 발생했습니다.');
        setSSEConnected(false);
        setIsConnecting(false);
        handleReconnect();
      }
    },
    [
      currentMessageCompleted,
      disconnectSSE,
      handleReconnect,
      handleSSEError,
      handleSSEMessage,
      isConnecting,
      setCurrentMessageCompleted,
      setIsConnecting,
      setSSEConnected,
      setCurrentSSEId,
      setSSEError,
      setShouldShowTempMessage,
    ]
  );

  // currentSSEId가 변경될 때 SSE 연결 처리
  useEffect(() => {
    if (currentSSEId && !sseConnected && !isConnecting && !currentMessageCompleted) {
      const originalId = currentSSEId.replace('_reconnect', '');
      connectToSSE(originalId);
    }
  }, [connectToSSE, currentMessageCompleted, currentSSEId, isConnecting, sseConnected]);

  // 채팅 데이터가 변경될 때 메시지 목록 업데이트
  useEffect(() => {
    if (chatData && chatData.content) {
      const formattedMessages: ChatMessage[] = [];

      // 버전 1 버튼을 기본적으로 추가
      formattedMessages.push({
        id: `version-1-default`,
        type: 'version',
        message: '초기 버전',
        timestamp: new Date().toISOString(),
        versionInfo: {
          versionId: '1',
          description: '초기 버전',
        },
      });

      chatData.content.forEach((item) => {
        // 사용자 메시지 추가
        if (item.userChat) {
          formattedMessages.push({
            id: `user-${item.chatId}`,
            type: 'user',
            message: item.userChat.message || '',
            timestamp: item.createdAt,
            targetMethods: item.userChat.targetMethods,
            tag: item.userChat.tag as RequestTag,
          });
        }

        // 시스템 메시지 추가
        if (item.systemChat) {
          formattedMessages.push({
            id: `system-${item.systemChat.systemChatId || item.chatId}`,
            type: 'system',
            message: item.systemChat.message || '',
            timestamp: item.createdAt,
          });

          // 버전 정보가 있는 경우 버전 메시지 추가
          if (item.systemChat.versionInfo && item.systemChat.versionInfo.newVersionId !== '1') {
            const versionId = item.systemChat.versionInfo.newVersionId || '';
            const description = item.systemChat.versionInfo.description || '';

            // 이미 추가된 버전인지 확인
            const versionExists = formattedMessages.some(
              (msg) => msg.type === 'version' && msg.versionInfo?.versionId === versionId
            );

            // 새로운 버전인 경우에만 버전 메시지 추가
            if (!versionExists) {
              formattedMessages.push({
                id: `version-${versionId}-${item.chatId}`,
                type: 'version',
                message: description,
                timestamp: item.createdAt,
                versionInfo: {
                  versionId: versionId,
                  description: description,
                },
              });
            }
          }
        }
      });

      setMessages(formattedMessages);
    }
  }, [chatData, setMessages]);

  // 채팅 메시지 스크롤 처리
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, accumulatedText]);

  // 컴포넌트 언마운트 시 SSE 연결 해제
  useEffect(() => {
    return () => {
      disconnectSSE();
    };
  }, [disconnectSSE]);

  // 요청 태그 선택 핸들러
  const handleTagSelect = useCallback((tag: RequestTag) => {
    setSelectedTag(tag);
  }, []);

  // 요청 태그 해제 핸들러
  const handleTagClear = useCallback(() => {
    setSelectedTag('EXPLAIN'); // 기본값으로 설정
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || sending || sseConnected || isConnecting || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (eventSourceRef.current) {
        disconnectSSE();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      retryCountRef.current = 0;
      setCurrentMessageCompleted(false);
      setAccumulatedText('');
      setSSEError(null);
      latestVersionIdRef.current = null; // 최신 버전 ID 참조 초기화
      setSending(true);
      setSendError(null);
      setShouldShowTempMessage(true);

      const sentMessage = newMessage;
      setLastSentMessage(sentMessage);

      const targetMethods =
        targetNodes.length > 0
          ? targetNodes
              .filter((target) => target.type === 'method')
              .map((target) => ({ methodId: target.id.replace('method-', '') }))
          : [];

      const chatMessageData = {
        tag: selectedTag,
        promptType: 'BODY',
        message: sentMessage,
        targetMethods,
      };

      setNewMessage('');

      const response = await axios.post<SSEIdResponse>(`/api/chat/${projectId}/${apiId}`, chatMessageData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.streamId) {
        connectToSSE(response.data.streamId);
      } else {
        setSendError('SSE ID를 받지 못했습니다.');
      }
    } catch (err) {
      console.error(formatToKST(new Date().toISOString()), '❌ 채팅 메시지 전송 오류:', err);

      if (axios.isAxiosError(err)) {
        console.error(formatToKST(new Date().toISOString()), 'Axios 오류:', err.response?.data);
        const errorMessage = err.response?.data?.error || err.message;
        setSendError(errorMessage);
      } else {
        setSendError('메시지 전송 중 오류가 발생했습니다.');
      }
    } finally {
      setSending(false);
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  }, [
    newMessage,
    sending,
    sseConnected,
    isConnecting,
    isSubmitting,
    disconnectSSE,
    targetNodes,
    selectedTag,
    token,
    projectId,
    apiId,
    connectToSSE,
    setSSEError,
    setSending,
    setSendError,
    setNewMessage,
    setCurrentMessageCompleted,
    setAccumulatedText,
    setShouldShowTempMessage,
    setLastSentMessage,
  ]);

  // 버전 클릭 핸들러
  const handleVersionClick = useCallback(
    (versionId: string) => {
      if (onVersionSelect) {
        onVersionSelect(versionId);
      }
    },
    [onVersionSelect]
  );

  // 엔터 키 처리
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isSubmitting) {
          handleSendMessage();
        }
      }
    },
    [handleSendMessage, isSubmitting]
  );

  // Helper function to preprocess accumulated text before rendering
  const preprocessAccumulatedText = useCallback((text: string) => {
    // Replace escaped newlines with actual newlines
    let processedText = text.replace(/\\n/g, '\n');

    // Fix markdown headers that might be escaped
    processedText = processedText.replace(/\\#/g, '#');

    // Check for unclosed code blocks and fix them for rendering
    const openCodeBlocks = (processedText.match(/```[a-z]*(?!\s*```)/g) || []).length;
    const closeCodeBlocks = (processedText.match(/```\s*$/g) || []).length;

    // If there are unclosed code blocks, temporarily close them for rendering
    if (openCodeBlocks > closeCodeBlocks) {
      processedText = processedText + '\n```';
    }

    return processedText;
  }, []);

  // First, define parseMarkdown
  const parseMarkdown = useCallback((text: string, key: string) => {
    // First, clean up any escaped characters
    const cleanText = text.replace(/\\n/g, '\n').replace(/\\#/g, '#').replace(/\\\\/g, '\\');

    // 제목 처리 (# 제목, ## 제목, ### 제목)
    let parsedText = cleanText
      // H1 제목 처리 (# 제목)
      .replace(/^#\s+(.*?)(?:\n|$)/gm, '<h1 class="text-2xl font-bold my-3 border-b pb-1">$1</h1>')
      // H2 제목 처리 (## 제목)
      .replace(/^##\s+(.*?)(?:\n|$)/gm, '<h2 class="text-xl font-bold my-2 text-gray-800">$1</h2>')
      // H3 제목 처리 (### 제목)
      .replace(/^###\s+(.*?)(?:\n|$)/gm, '<h3 class="text-lg font-bold my-2 text-gray-700">$1</h3>')
      // H4 제목 처리 (#### 제목)
      .replace(/^####\s+(.*?)(?:\n|$)/gm, '<h4 class="text-base font-bold my-2 text-gray-700">$1</h4>')
      // H5 제목 처리 (##### 제목)
      .replace(/^#####\s+(.*?)(?:\n|$)/gm, '<h5 class="text-sm font-bold my-1 text-gray-700">$1</h5>')
      // H6 제목 처리 (###### 제목)
      .replace(/^######\s+(.*?)(?:\n|$)/gm, '<h6 class="text-xs font-bold my-1 text-gray-700">$1</h6>');

    // 볼드 처리 (**텍스트** 또는 __텍스트__)
    parsedText = parsedText.replace(/(\*\*|__)(.*?)\1/g, '<strong class="font-bold">$2</strong>');

    // 이탤릭 처리 (*텍스트* 또는 _텍스트_)
    parsedText = parsedText.replace(/(\*|_)(.*?)\1/g, '<em class="italic">$2</em>');

    // 취소선 처리 (~~텍스트~~)
    parsedText = parsedText.replace(/~~(.*?)~~/g, '<del class="line-through">$1</del>');

    // 인라인 코드 처리 (`코드`)
    parsedText = parsedText.replace(
      /`([\s\S]*?)`/g,
      '<code class="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono">$1</code>'
    );
    // 링크 처리 [텍스트](URL)
    parsedText = parsedText.replace(
      /\[([^\]]+)\]$$([^)]+)$$/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
    );

    // 이미지 처리 ![대체텍스트](이미지URL)
    parsedText = parsedText.replace(
      /!\[([^\]]*)\]$$([^)]+)$$/g,
      '<img src="$2" alt="$1" class="max-w-full h-auto rounded my-2" />'
    );

    // 수평선 처리 (---, ***, ___)
    parsedText = parsedText.replace(/^(\*{3,}|-{3,}|_{3,})$/gm, '<hr class="my-4 border-t border-gray-300" />');

    // 인용구 처리 (> 텍스트)
    parsedText = parsedText.replace(
      /^>\s+(.*?)(?:\n|$)/gm,
      '<blockquote class="pl-4 border-l-4 border-gray-300 text-gray-700 italic my-2">$1</blockquote>'
    );

    // 순서 있는 목록 처리 (1. 항목)
    parsedText = parsedText.replace(/^(\d+)\.\s+(.*?)(?:\n|$)/gm, '<li class="list-decimal ml-5">$2</li>');

    // 글머리 기호 목록 처리 (- 항목, * 항목, + 항목)
    parsedText = parsedText.replace(
      /^[-*+]\s+(.*?)(?:\n|$)/gm,
      '<li class="flex items-start"><span class="inline-block w-2 h-2 rounded-full bg-gray-500 mt-1.5 mr-2"></span>$1</li>'
    );

    // 연속된 목록 항목을 ul 태그로 감싸기
    parsedText = parsedText.replace(/<li class="flex.*?<\/li>(?:\s*<li class="flex.*?<\/li>)*/g, (match) => {
      return `<ul class="list-none pl-2 my-2">${match}</ul>`;
    });

    // 연속된 순서 있는 목록 항목을 ol 태그로 감싸기
    parsedText = parsedText.replace(
      /<li class="list-decimal.*?<\/li>(?:\s*<li class="list-decimal.*?<\/li>)*/g,
      (match) => {
        return `<ol class="list-decimal pl-2 my-2">${match}</ol>`;
      }
    );

    // 테이블 처리 (마크다운 테이블)
    // 테이블 헤더와 구분선, 내용을 찾아 HTML 테이블로 변환
    const tableRegex = /^\|(.+)\|\s*\n\|[-:| ]+\|\s*\n(\|.+\|\s*\n)+/gm;
    parsedText = parsedText.replace(tableRegex, (match) => {
      const lines = match.trim().split('\n');
      const headers = lines[0]
        .split('|')
        .filter((cell) => cell.trim() !== '')
        .map((cell) => cell.trim());
      const alignments = lines[1].split('|').filter((cell) => cell.trim() !== '');
      const rows = lines.slice(2).map((line) =>
        line
          .split('|')
          .filter((cell) => cell.trim() !== '')
          .map((cell) => cell.trim())
      );

      let tableHtml =
        '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-300">';

      // 헤더 추가
      tableHtml += '<thead><tr>';
      headers.forEach((header, i) => {
        let align = 'text-left';
        if (alignments[i]) {
          if (alignments[i].startsWith(':') && alignments[i].endsWith(':')) align = 'text-center';
          else if (alignments[i].endsWith(':')) align = 'text-right';
        }
        tableHtml += `<th class="border border-gray-300 px-4 py-2 bg-gray-100 ${align}">${header}</th>`;
      });
      tableHtml += '</tr></thead>';

      // 내용 추가
      tableHtml += '<tbody>';
      rows.forEach((row) => {
        tableHtml += '<tr>';
        row.forEach((cell, i) => {
          let align = 'text-left';
          if (alignments[i]) {
            if (alignments[i].startsWith(':') && alignments[i].endsWith(':')) align = 'text-center';
            else if (alignments[i].endsWith(':')) align = 'text-right';
          }
          tableHtml += `<td class="border border-gray-300 px-4 py-2 ${align}">${cell}</td>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table></div>';

      return tableHtml;
    });

    // 체크박스 처리 (- [ ] 항목, - [x] 항목)
    parsedText = parsedText.replace(
      /^- \[ \] (.*?)(?:\n|$)/gm,
      '<div class="flex items-start my-1"><input type="checkbox" class="mt-1 mr-2" disabled /><span>$1</span></div>'
    );
    parsedText = parsedText.replace(
      /^- \[x\] (.*?)(?:\n|$)/gm,
      '<div class="flex items-start my-1"><input type="checkbox" class="mt-1 mr-2" checked disabled /><span>$1</span></div>'
    );

    // 줄바꿈 처리 (두 번 이상의 연속된 줄바꿈은 단락으로 처리)
    parsedText = parsedText.replace(/\n{2,}/g, '</p><p class="my-2">');

    // 단일 줄바꿈 처리
    parsedText = parsedText.replace(/\n/g, '<br />');

    // 전체 내용을 p 태그로 감싸기
    if (!parsedText.startsWith('<')) {
      parsedText = `<p class="my-2">${parsedText}</p>`;
    }

    return (
      <div
        key={key}
        className='markdown-content'
        style={{ whiteSpace: 'pre-line' }}
        dangerouslySetInnerHTML={{ __html: parsedText }}
      />
    );
  }, []);

  // Then, define parseMessage which uses parseMarkdown
  const parseMessage = useCallback(
    (message: string) => {
      // First, clean up any escaped characters
      const cleanMessage = message.replace(/\\n/g, '\n').replace(/\\#/g, '#').replace(/\\\\/g, '\\');

      // 코드 블록 처리
      const codeBlockRegex =
        /```(java|javascript|typescript|html|css|python|json|xml|sql|bash|shell|cmd|yaml|markdown|text|jsx|tsx)?\s*([\s\S]*?)```/g;
      let lastIndex = 0;
      const parts: React.ReactNode[] = [];
      let match;

      while ((match = codeBlockRegex.exec(cleanMessage)) !== null) {
        // 코드 블록 이전의 텍스트 추가
        if (match.index > lastIndex) {
          const textBeforeCode = cleanMessage.substring(lastIndex, match.index);
          parts.push(parseMarkdown(textBeforeCode, `text-${match.index}`));
        }

        // 코드 블록 추가
        const language = match[1] || 'text';
        const code = match[2];

        parts.push(
          <div
            key={`code-${match.index}`}
            className='group relative my-4 overflow-hidden border border-gray-300 rounded-md'
          >
            <div className='flex items-center justify-between px-4 py-2 text-gray-200 bg-gray-800'>
              <span className='text-xs font-medium'>{language.toUpperCase()}</span>
              <div className='flex space-x-2'>
                <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                <div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
                <div className='w-3 h-3 bg-green-500 rounded-full'></div>
              </div>
            </div>
            <div className='relative'>
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '12px',
                  fontSize: '14px',
                  borderRadius: '0 0 6px 6px',
                  maxHeight: '400px',
                }}
                codeTagProps={{ style: { fontFamily: 'monospace' } }}
                showLineNumbers={true}
                lineNumberStyle={{
                  minWidth: '2em',
                  color: '#606366',
                  textAlign: 'right',
                  fontSize: '12px',
                  borderRight: '1px solid #404040',
                  paddingRight: '0.5em',
                  marginRight: '5px',
                }}
                wrapLines={true}
                wrapLongLines={false}
                useInlineStyles={true}
              >
                {code}
              </SyntaxHighlighter>

              {/* Hover actions */}
              <div className='top-2 right-2 group-hover:opacity-100 absolute flex gap-2 transition-opacity opacity-0'>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className='p-1.5 hover:bg-gray-600 text-white transition-colors bg-gray-700 rounded-md'
                  title='Copy code'
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => setExpandedCode({ code, language })}
                  className='p-1.5 hover:bg-gray-600 text-white transition-colors bg-gray-700 rounded-md'
                  title='Expand code'
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>
          </div>
        );

        lastIndex = match.index + match[0].length;
      }

      // 남은 텍스트 추가
      if (lastIndex < message.length) {
        parts.push(parseMarkdown(message.substring(lastIndex), `text-${lastIndex}`));
      }

      return parts.length > 0 ? parts : parseMarkdown(message, 'text-full');
    },
    [parseMarkdown, setExpandedCode]
  );

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className='flex items-center justify-center h-full p-4 bg-white rounded-lg shadow'>
        <div className='animate-spin border-t-transparent w-8 h-8 border-4 border-blue-500 rounded-full'></div>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className='h-full p-4 bg-white rounded-lg shadow'>
        <div className='bg-red-50 p-4 text-red-600 border-l-4 border-red-500 rounded-lg'>
          <h3 className='mb-2 font-semibold'>오류 발생</h3>
          <p>{error}</p>
          <button
            onClick={() => onRefresh()}
            className='hover:bg-red-200 flex items-center gap-2 px-4 py-2 mt-4 text-red-700 transition-colors bg-red-100 rounded-md'
          >
            <RefreshCw size={16} />
            <span>다시 시도</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className=' flex flex-col h-full bg-white rounded-lg shadow'>
      {/* 메시지 전송 오류 */}
      {(sendError || sseError) && (
        <div className='bg-red-50 px-4 py-2 text-red-600 border-b'>
          <p className='text-sm'>{sendError || sseError}</p>
        </div>
      )}

      {/* 채팅 메시지 영역 */}
      <div
        ref={chatContainerRef}
        className='flex-1 p-4 overflow-x-hidden overflow-y-auto'
      >
        {/* 기존 채팅 내역 */}
        {messages.length > 0 ? (
          messages.map((msg) => {
            if (msg.type === 'user') {
              return (
                <div
                  key={msg.id}
                  className='flex flex-col items-end mb-4'
                >
                  <div className='bg-blue-50 max-w-[80%] px-4 py-2 overflow-hidden text-blue-900 break-words rounded-lg'>
                    {/* 요청 태그 표시 */}
                    {msg.tag && (
                      <div className='mb-1'>
                        <span className='py-0.5 inline-block px-2 text-xs text-blue-800 bg-blue-200 rounded-full'>
                          {msg.tag}
                        </span>
                      </div>
                    )}
                    <p className='whitespace-pre-wrap'>{msg.message}</p>
                  </div>
                  {/* <span className="mt-1 text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span> */}
                </div>
              );
            } else if (msg.type === 'system') {
              return (
                <div
                  key={msg.id}
                  className='flex flex-col mb-2'
                >
                  {/* 시스템 메시지를 좌우 가득 차지하게 변경하고 배경색을 흰색으로 */}
                  <div className='w-full px-4 py-3 overflow-x-auto bg-white rounded-lg'>
                    <div className='max-w-none overflow-hidden prose break-words'>{parseMessage(msg.message)}</div>
                  </div>
                  {/* <span className="self-start mt-1 text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span> */}
                </div>
              );
            } else if (msg.type === 'version' && msg.versionInfo) {
              // 버전 메시지 표시 - 여기서 버튼 스타일 업데이트
              return (
                <div
                  key={msg.id}
                  className='my-2'
                >
                  <button
                    onClick={() => handleVersionClick(msg.versionInfo!.versionId)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      versionId === msg.versionInfo!.versionId
                        ? 'bg-gray-700 text-white shadow-sm'
                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Clock size={14} />
                    <div className='flex flex-col items-start'>
                      <span className='font-medium'>VERSION {msg.versionInfo.versionId}</span>
                      <span className='opacity-90 text-xs'>{msg.versionInfo.description}</span>
                    </div>
                  </button>
                  <hr className='mt-2 mb-4' />
                </div>
              );
            }
            return null;
          })
        ) : (
          <div className='flex items-center justify-center h-full text-gray-500'>채팅 내역이 없습니다.</div>
        )}

        {/* 현재 SSE 메시지 표시 - 누적 텍스트 사용 */}
        {shouldShowTempMessage && (sseConnected || isConnecting || accumulatedText) && (
          <div className='mb-4'>
            {/* 사용자 메시지 (가장 최근에 보낸 메시지) */}
            <div className='flex justify-end mb-4'>
              <div className='max-w-[80%] bg-blue-50 p-3 overflow-hidden text-blue-900 break-words rounded-lg rounded-tr-none'>
                {/* 요청 태그 표시 */}
                <div className='mb-1'>
                  <span className='py-0.5 inline-block px-2 text-xs text-blue-800 bg-blue-200 rounded-full'>
                    {selectedTag}
                  </span>
                </div>
                <div className='whitespace-pre-wrap'>{lastSentMessage}</div>
              </div>
            </div>

            {/* SSE 응답 메시지 - 좌우 가득 차지하게 변경하고 배경색을 흰색으로 */}
            <div className='flex flex-col mb-4'>
              <div className='w-full p-4 bg-white rounded-lg shadow-sm'>
                <div className='max-w-none prose'>
                  {parseMessage(preprocessAccumulatedText(accumulatedText))}
                  {(sseConnected || isConnecting) && (
                    <span className='animate-pulse inline-block w-2 h-4 ml-1 bg-gray-500'></span>
                  )}
                </div>
                {(sseConnected || isConnecting) && (
                  <div className='gap-0.5 flex items-center mt-2 text-xs'>
                    {'SCRUD'.split('').map((letter, index) => (
                      <span
                        key={`scrud-${index}`}
                        className='font-semibold transition-opacity duration-700 ease-in-out'
                        style={{
                          animation: `pulse 1.5s infinite ${index * 0.3}s`,
                          color: '#3b82f6',
                        }}
                      >
                        {letter}
                      </span>
                    ))}
                    <style jsx>{`
                      @keyframes pulse {
                        0%,
                        100% {
                          opacity: 0.3;
                        }
                        50% {
                          opacity: 1;
                        }
                      }
                    `}</style>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 타임스탬프 */}
        {shouldShowTempMessage && (sseConnected || isConnecting || accumulatedText) && (
          <div className='mt-1 mb-4 text-center'>
            <span className='text-xs text-gray-400'>{new Date().toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* 요청 태그 선택 영역 */}
      <div className='bg-gray-50 px-4 py-2 border-t'>
        <div className='flex flex-wrap gap-2 mb-2'>
          <div className='flex items-center text-xs font-medium text-gray-700'>
            <span className='mr-1'>요청 유형:</span>
            <div className='group relative'>
              <Info
                size={14}
                className='text-gray-500'
              />
              <div className='bottom-full group-hover:block absolute left-0 z-10 hidden w-64 p-2 mb-1 text-xs bg-white rounded shadow-md'>
                <p className='mb-1'>
                  <strong>설명(EXPLAIN):</strong> 코드나 개념에 대한 설명을 요청합니다.
                </p>
                <p className='mb-1'>
                  <strong>리팩토링(REFACTORING):</strong> 코드 구조 개선을 요청합니다.
                </p>
                <p className='mb-1'>
                  <strong>최적화(OPTIMIZE):</strong> 성능 향상을 위한 코드 최적화를 요청합니다.
                </p>
                <p>
                  <strong>구현(IMPLEMENT):</strong> 새로운 기능 구현을 요청합니다.
                </p>
              </div>
            </div>
          </div>
          <div className='flex flex-wrap gap-2'>
            {/* 태그 선택 버튼 - 심플한 디자인으로 업데이트 */}
            <button
              onClick={() => handleTagSelect('IMPLEMENT')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedTag === 'IMPLEMENT'
                  ? 'bg-gray-700 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              disabled={selectedTag === 'IMPLEMENT' && sending}
            >
              구현
            </button>
            <button
              onClick={() => handleTagSelect('EXPLAIN')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedTag === 'EXPLAIN'
                  ? 'bg-gray-700 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              disabled={selectedTag === 'EXPLAIN' && sending}
            >
              설명
            </button>
            <button
              onClick={() => handleTagSelect('REFACTORING')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedTag === 'REFACTORING'
                  ? 'bg-gray-700 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              disabled={selectedTag === 'REFACTORING' && sending}
            >
              리팩토링
            </button>
            <button
              onClick={() => handleTagSelect('OPTIMIZE')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedTag === 'OPTIMIZE'
                  ? 'bg-gray-700 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              disabled={selectedTag === 'OPTIMIZE' && sending}
            >
              최적화
            </button>
          </div>
        </div>
      </div>

      {/* 메시지 입력 영역 */}
      <div className='p-3 border-t'>
        <div className='flex flex-col gap-2'>
          {/* 선택된 요청 태그 표시 */}
          <div className='flex items-center gap-1'>
            <div className='py-0.5 flex items-center gap-1 px-2 text-xs text-blue-800 bg-blue-100 rounded-md'>
              <span>{selectedTag}</span>
              <button
                onClick={handleTagClear}
                className=' hover:bg-gray-200 text-blue-500 transition-colors rounded-full'
                aria-label='요청 태그 해제'
              ></button>
            </div>
          </div>

          {/* 메시지 입력 필드 */}
          <div className='flex items-center gap-2'>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={sseConnected || isConnecting ? '처리 중입니다...' : '메시지를 입력하세요...'}
              className='focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 flex-1 p-2 border border-gray-300 rounded-md resize-none'
              rows={2}
              disabled={sending || sseConnected || isConnecting}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || sseConnected || isConnecting || isSubmitting}
              className={`p-2.5 rounded-md ${
                sending || !newMessage.trim() || sseConnected || isConnecting || isSubmitting
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-800'
              }`}
            >
              {sending || isConnecting ? (
                <div className='animate-spin border-t-transparent w-5 h-5 border-2 border-white rounded-full'></div>
              ) : (
                <ArrowUp size={16} />
              )}
            </button>
          </div>
        </div>

        {(sseConnected || isConnecting) && (
          <div className='flex items-center gap-1 mt-2'>
            {'SCRUD'.split('').map((letter, index) => (
              <span
                key={`scrud-animation-${index}`}
                className='font-semibold transition-opacity duration-700 ease-in-out'
                style={{
                  animation: `pulse 1.5s infinite ${index * 0.3}s`,
                  color: '#3b82f6',
                }}
              >
                {letter}
              </span>
            ))}
            <style jsx>{`
              @keyframes pulse {
                0%,
                100% {
                  opacity: 0.3;
                }
                50% {
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        )}
      </div>
      {/* Expanded Code Modal */}
      {expandedCode && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'
          onClick={() => setExpandedCode(null)}
        >
          <div
            className='max-h-[90vh] flex flex-col w-full max-w-4xl bg-white rounded-lg shadow-xl'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between px-4 py-3 text-gray-200 bg-gray-800 rounded-t-lg'>
              <span className='font-medium'>{expandedCode.language.toUpperCase()}</span>
              <div className='flex items-center gap-3'>
                <button
                  onClick={() => navigator.clipboard.writeText(expandedCode.code)}
                  className='p-1.5 hover:bg-gray-700 text-white transition-colors rounded-md'
                  title='Copy code'
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => setExpandedCode(null)}
                  className='p-1.5 hover:bg-gray-700 text-white transition-colors rounded-md'
                  title='Close'
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className='flex-1 overflow-auto'>
              <SyntaxHighlighter
                language={expandedCode.language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '16px',
                  fontSize: '16px',
                  borderRadius: '0 0 6px 6px',
                  height: '100%',
                }}
                codeTagProps={{ style: { fontFamily: 'monospace' } }}
                showLineNumbers={true}
                lineNumberStyle={{
                  minWidth: '3em',
                  color: '#606366',
                  textAlign: 'right',
                  fontSize: '14px',
                  borderRight: '1px solid #404040',
                  paddingRight: '0.5em',
                  marginRight: '10px',
                }}
                wrapLines={true}
                wrapLongLines={false}
                useInlineStyles={true}
              >
                {expandedCode.code}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
