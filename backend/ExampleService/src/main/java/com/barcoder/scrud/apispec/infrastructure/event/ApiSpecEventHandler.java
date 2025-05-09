package com.barcoder.scrud.apispec.infrastructure.event;

import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.usecase.ApiSpecUseCase;
import com.barcoder.scrud.apispec.infrastructure.webclient.ApiSpecVersionWebclient;
import com.barcoder.scrud.apispec.infrastructure.webclient.request.ApiSpecGenerateRequest;
import com.barcoder.scrud.apispec.infrastructure.webclient.response.ApiSpecGenerateResponse;
import com.barcoder.scrud.model.FileTypeEnumDto;
import com.barcoder.scrud.scrudproject.domain.entity.GlobalFile;
import com.barcoder.scrud.scrudproject.domain.entity.ScrudProject;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
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

        ApiSpecGenerateResponse response = apiSpecVersionWebclient.generateApiSpec(request);

        if (response == null) {
            throw new RuntimeException("API Spec generation failed");
        }

        ObjectMapper mapper = new ObjectMapper();
        try (InputStream json = getClass().getResourceAsStream(response.getResult())) {
            if (json == null) {
                throw new RuntimeException("Could not find resource: " + response.getResult());
            }
            List<CreateApiSpecVersionIn> inDtoList = mapper.readValue(
                    json,
                    new TypeReference<>() {
                    }
            );

            apiSpecUseCase.bulkCreateApiSpecVersion(scrudProject.getScrudProjectId(), inDtoList);

        } catch (IOException e) {
            throw new RuntimeException("Failed to parse API spec response", e);
        }

    }
}
