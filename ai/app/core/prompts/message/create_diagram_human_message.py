from app.infrastructure.http.client.api_client import GlobalFileList, ApiSpec


def prepare_diagram_generate_human_message(
        global_files: GlobalFileList,
        api_spec: ApiSpec,
        project_id: str,
        api_id: str,
) -> str:
    return f"""
    다음 OpenAPI 명세를 분석하여 Spring Boot 아키텍처 패턴을 따르는 다이어그램을 생성해주세요.
    다음의 내용들을 모두 고려 해주세요
    [고려할 사항]
    {global_files.model_dump_json() if global_files else ""}

    [OpenAPI 명세]
    {api_spec.model_dump_json() if api_spec else ""}

    프로젝트 ID: {project_id}
    API ID: {api_id}
    """
