package com.barcoder.scrud.apispec.infrastructure.event;

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

@Slf4j
@Component
@RequiredArgsConstructor
public class ApiSpecEventHandler {

    private final ApiSpecUseCase apiSpecUseCase;
    private final ApiSpecVersionWebclient apiSpecVersionWebclient;

    @EventListener
    @Transactional
    public void handleApiSpecGenerateEvent(ApiSpecGenerateEvent event) {

        ScrudProject scrudProject = event.scrudProject();

        List<GlobalFile> globalFileList = scrudProject.getGlobalFileList();

        StringBuilder erd = new StringBuilder();
        StringBuilder requirements = new StringBuilder();
        StringBuilder extraInfo = new StringBuilder();
        for (GlobalFile globalFile : globalFileList) {
            if (globalFile.getFileType().equals(FileTypeEnumDto.ERD)) {
                erd.append(globalFile.getFileContent());
            } else if (globalFile.getFileType().equals(FileTypeEnumDto.REQUIREMENTS)) {
                requirements.append(globalFile.getFileContent());
            } else {
                extraInfo.append(globalFile.getFileContent());
            }
        }

        ApiSpecGenerateRequest request = ApiSpecGenerateRequest.builder()
                .erd(erd.toString())
                .requirements(requirements.toString())
                .extraInfo(extraInfo.toString())
                .build();

        log.info("ApiSpecGenerateEvent: {}", request.toString());

        LocalDateTime startTime = LocalDateTime.now();
        ApiSpecGenerateResponse response = apiSpecVersionWebclient.generateApiSpec(request);
        LocalDateTime endTime = LocalDateTime.now();
        log.info("API Spec generation took {} ms", java.time.Duration.between(startTime, endTime).toMillis());

        if (response == null) {
            throw new RuntimeException("API Spec generation failed");
        }

        apiSpecUseCase.bulkCreateApiSpecVersion(scrudProject.getScrudProjectId(), response.getResult());


    }
}
