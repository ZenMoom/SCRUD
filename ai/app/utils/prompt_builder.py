from typing import List, Dict, Optional, Any

from app.infrastructure.http.client.api_client import ApiSpec, GlobalFileList


class PromptBuilder:
    @staticmethod
    def build_api_spec_prompt(
            api_spec: ApiSpec,
    ) -> str:
        """API 스펙을 프롬프트로 변환

        Args:
            api_spec: API 스펙 데이터

        Returns:
            프롬프트 문자열
        """
        # API 스펙으로부터 프롬프트 생성 로직
        prompt = f"API Summary: {api_spec.summary or ''}\n"
        prompt += f"Description: {api_spec.description or ''}\n"
        prompt += f"HTTP Method: {api_spec.httpMethod or ''}\n"
        prompt += f"Endpoint: {api_spec.endpoint or ''}\n"
        prompt += f"API Group: {api_spec.apiGroup or ''}\n"
        
        if api_spec.pathParameters:
            prompt += f"Path Parameters: {api_spec.pathParameters}\n"
        
        if api_spec.queryParameters:
            prompt += f"Query Parameters: {api_spec.queryParameters}\n"
        
        if api_spec.requestBody:
            prompt += f"Request Body: {api_spec.requestBody}\n"
            
        if api_spec.response:
            prompt += f"Response: {api_spec.response}\n"

        return prompt

    @staticmethod
    def build_global_data_prompt(
            global_files: GlobalFileList,
    ) -> str:
        """전역 데이터를 프롬프트로 변환

        Args:
            global_files: 전역 파일 데이터

        Returns:
            프롬프트 문자열
        """
        # 전역 데이터로부터 프롬프트 생성 로직
        prompt = "Global Data:\n"
        
        # Project info
        if global_files.project:
            project = global_files.project
            prompt += "Project Information:\n"
            if project.scrudProjectId:
                prompt += f"- Project ID: {project.scrudProjectId}\n"
            if project.title:
                prompt += f"- Title: {project.title}\n"
            if project.description:
                prompt += f"- Description: {project.description}\n"
            if project.serverUrl:
                prompt += f"- Server URL: {project.serverUrl}\n"
        
        # Global files
        if global_files.content:
            prompt += "\nGlobal Files:\n"
            for file in global_files.content:
                prompt += f"- File ID: {file.globalFileId}\n"
                if file.fileName:
                    prompt += f"  Name: {file.fileName}\n"
                if file.fileType:
                    prompt += f"  Type: {file.fileType}\n"
                if file.fileContent:
                    prompt += f"  Content: {file.fileContent}\n"
                prompt += "\n"

        return prompt

    @staticmethod
    def build_complete_prompt(prompts: List[str]) -> str:
        """여러 프롬프트를 결합하여 최종 프롬프트 생성

        Args:
            prompts: 프롬프트 문자열 목록

        Returns:
            최종 프롬프트 문자열
        """
        return "\n\n".join(prompts)

