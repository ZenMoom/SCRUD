/**
 * 현재 실행 환경이 서버인지 클라이언트인지 확인하는 함수
 */
export const isServer = () => typeof window === 'undefined';

/**
 * 환경에 따라 적절한 API 기본 URL을 반환하는 함수
 */
export const getApiBaseUrl = () => {
  return isServer() ? `${process.env.SPRING_FRONT_REDIRECT_URI}/api` : '/api';
};
