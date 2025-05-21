package com.barcoder.scrud.apispec.infrastructure.event;

import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.usecase.ApiPromptUseCase;
import com.barcoder.scrud.apispec.application.usecase.ApiSpecUseCase;
import com.barcoder.scrud.apispec.infrastructure.webclient.ApiSpecVersionWebclient;
import com.barcoder.scrud.apispec.infrastructure.webclient.request.ApiSpecGenerateRequest;
import com.barcoder.scrud.apispec.infrastructure.webclient.response.ApiSpecGenerateResponse;
import com.barcoder.scrud.model.FileTypeEnumDto;
import com.barcoder.scrud.scrudproject.domain.entity.GlobalFile;
import com.barcoder.scrud.scrudproject.domain.entity.ScrudProject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApiSpecEventHandler {

    private final ApiSpecUseCase apiSpecUseCase;
    private final ApiPromptUseCase apiPromptUseCase;
    private final ApiSpecVersionWebclient apiSpecVersionWebclient;
    private static final Set<String> extraInfoList = Set.of(
            FileTypeEnumDto.CONVENTION.getValue(),
            FileTypeEnumDto.CONVENTION_DEFAULT.getValue(),
            FileTypeEnumDto.ERROR_CODE.getValue(),
            FileTypeEnumDto.SECURITY.getValue(),
            FileTypeEnumDto.SECURITY_DEFAULT_JWT.getValue(),
            FileTypeEnumDto.SECURITY_DEFAULT_SESSION.getValue(),
            FileTypeEnumDto.SECURITY_DEFAULT_NONE.getValue()
    );

    @EventListener
    @Transactional
    public void handleApiSpecGenerateEvent(ApiSpecGenerateEvent event) {

        ScrudProject scrudProject = event.scrudProject();

        // 추가 정보 조회
        List<GlobalFile> globalFileList = scrudProject.getGlobalFileList();

        // 파일 타입에 따라 ERD, 요구사항, 기타 정보 분리
        StringBuilder erd = new StringBuilder();
        StringBuilder requirements = new StringBuilder();
        StringBuilder extraInfo = new StringBuilder();
        extracted(globalFileList, erd, requirements, extraInfo);

        // API Spec request 생성
        ApiSpecGenerateRequest request = ApiSpecGenerateRequest.builder()
                .erd(erd.toString())
                .requirements(requirements.toString())
                .extraInfo(extraInfo.toString())
                .build();

        log.info("ApiSpecGenerateEvent: {}", request.toString());

        // API Spec 생성
        LocalDateTime startTime = LocalDateTime.now();
        ApiSpecGenerateResponse response = apiSpecVersionWebclient.generateApiSpec(request);
        LocalDateTime endTime = LocalDateTime.now();
        log.info("API Spec generation took {} ms", java.time.Duration.between(startTime, endTime).toMillis());

        if (response == null) {
            throw new RuntimeException("API Spec generation failed");
        }

        // prompt 저장
        List<CreateApiSpecVersionIn> result = response.getResult();
        StringBuilder promptResult = new StringBuilder()
                .append(response.getPrompt());
        for (CreateApiSpecVersionIn createApiSpecVersionIn : result) {
            promptResult.append(createApiSpecVersionIn.toString()).append("\n");
        }

        apiPromptUseCase.savePrompt(response.getPrompt(), promptResult.toString());

        apiSpecUseCase.bulkCreateApiSpecVersion(scrudProject.getScrudProjectId(), response.getResult(), scrudProject.getUserId());

    }

    // 파일 타입에 따라 ERD, 요구사항, 기타 정보 분리
    private void extracted(List<GlobalFile> globalFileList, StringBuilder erd, StringBuilder requirements, StringBuilder extraInfo) {
        for (GlobalFile globalFile : globalFileList) {
            if (globalFile.getFileType().equals(FileTypeEnumDto.ERD)) {
                erd.append(globalFile.getFileContent());
            } else if (globalFile.getFileType().equals(FileTypeEnumDto.REQUIREMENTS)) {
                requirements.append(globalFile.getFileContent());
            } else {
                if (globalFile.getFileType().getValue() != null &&
                        extraInfoList.contains(globalFile.getFileType().getValue())) {
                    extraInfo.append(globalFile.getFileContent());
                }
            }
        }
    }
}

