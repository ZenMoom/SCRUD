#!/bin/bash
set -e

# 생성할 네트워크 이름
NETWORK_NAME="scrud-network"

# 네트워크 존재 여부 확인
if docker network ls | grep -q $NETWORK_NAME; then
  echo "네트워크 '$NETWORK_NAME'가 이미 존재합니다. 넘어갑니다."
else
  echo "네트워크 '$NETWORK_NAME'가 존재하지 않습니다. 생성합니다..."
  # 네트워크 생성 (필요한 옵션 추가 가능)
  docker network create --driver bridge $NETWORK_NAME
fi

echo -e "\e[1;34m🔧 DB Shut Down: 현재 실행 중인 DB 환경을 닫는 중 입니다.. 🔧\e[0m"

docker-compose -f ./infra/docker/docker-compose.dev.db.yaml down

echo -e "\e[1;32m✅ Building: 새로운 DB 환경을 실행합니다.. ✅\e[0m"

docker-compose -f ./infra/docker/docker-compose.dev.db.yaml up -d