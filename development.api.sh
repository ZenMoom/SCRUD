#!/bin/bash
set -e

# 파일 삭제 명령어
echo -e "\e[1;34m🔧 Shut Down: 현재 실행 중인 환경을 닫는 중 입니다.. 🔧\e[0m"  # 파란색, 볼드 텍스트
docker-compose -f ./infra/docker/docker-compose.yaml --project-directory . down swagger-ui

# 포트 80을 사용하는 프로세스의 PID 찾기
PID=$(netstat -ano | grep ":80" | grep "LISTENING" | awk '{print $5}')

if [ -z "$PID" ]; then
  echo "포트 80 사용하는 프로세스가 없습니다."
else
  echo "포트 80 사용하는 프로세스 PID: $PID"
  echo "taskkill //F //PID $PID 를 입력해서 프로세스를 죽이세요"
  exit 1
fi

# 클린업 완료 및 빌드 시작
echo -e "\e[1;32m✅ Building: 개발 환경을 구성하는 중 입니다...✅\e[0m"  # 초록색, 볼드 텍스트

docker-compose -f ./infra/docker/docker-compose.yaml --project-directory . up swagger-ui "$@"