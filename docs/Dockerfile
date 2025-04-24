# Node.js 공식 이미지 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /merged

# openapi-merge-cli 설치
RUN npm install -g openapi-merge-cli

# docs 파일을 컨테이너의 path로 복사
COPY ./docs .

RUN mkdir -p output

RUN mkdir -p local

# openapi-merge-cli 명령어 실행
CMD npx openapi-merge-cli --config /merged/openapi-merge.json && cp -r output local
