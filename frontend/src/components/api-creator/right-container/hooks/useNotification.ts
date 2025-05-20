export const useNotification = () => {
  // 성공 알림
  const showSuccessNotification = (message: string) => {
    alert(`✅ ${message}`)
  }

  // 오류 알림
  const showErrorNotification = (message: string) => {
    alert(`❌ ${message}`)
  }

  // 경고 알림
  const showWarningNotification = (message: string) => {
    alert(`⚠️ ${message}`)
  }

  // 정보 알림
  const showInfoNotification = (message: string) => {
    alert(`ℹ️ ${message}`)
  }

  return {
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
  }
}
