/**
 * 알림 관련 훅
 * 현재는 간단한 alert와 console.log를 사용하지만
 * 나중에 토스트 또는 인앱 알림으로 확장 가능
 */
export const useNotification = () => {
  // 성공 알림
  const showSuccessNotification = (message: string) => {
    // 알림 표시 로직 (alert로 임시 구현)
    alert(`✅ ${message}`)
    // 향후 토스트 또는 인앱 알림으로 확장 가능
  }

  // 오류 알림
  const showErrorNotification = (message: string) => {
    // 알림 표시 로직 (alert로 임시 구현)
    alert(`❌ ${message}`)
    // 향후 토스트 또는 인앱 알림으로 확장 가능
  }

  // 경고 알림
  const showWarningNotification = (message: string) => {
    // 알림 표시 로직 (alert로 임시 구현)
    alert(`⚠️ ${message}`)
    // 향후 토스트 또는 인앱 알림으로 확장 가능
  }

  // 정보 알림
  const showInfoNotification = (message: string) => {
    // 알림 표시 로직 (콘솔에 로그만 남김)
    console.info(`ℹ️ ${message}`)
    // 향후 토스트 또는 인앱 알림으로 확장 가능
  }

  return {
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
  }
}
