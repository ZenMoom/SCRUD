package com.barcoder.scrud.apispec.application.facade;

import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.domain.entity.ApiSpecVersion;
import com.barcoder.scrud.apispec.infrastructure.jpa.ApiSpecVersionJpaRepository;
import com.barcoder.scrud.scrudproject.domain.entity.ScrudProject;
import com.barcoder.scrud.scrudproject.repository.ScrudProjectRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@Transactional
@SpringBootTest
@Slf4j
@Rollback(false)
class ApiCreateFacadeTest {

    @Autowired
    private ApiCreateFacade apiCreateFacade;

    @Autowired
    private ApiSpecVersionJpaRepository apiSpecVersionJpaRepository;

    @Autowired
    private ScrudProjectRepository scrudProjectRepository;

    @Test
    void bulkCreateApiSpecVersion_JSON입력_정상동작() throws Exception {
        // given
        ObjectMapper mapper = new ObjectMapper();
        InputStream json = getClass().getResourceAsStream("/test-api-spec.json");
        List<CreateApiSpecVersionIn> inDtoList = mapper.readValue(
                json,
                new TypeReference<>() {
                }
        );

        // when
        ScrudProject scrudProject = ScrudProject.builder().build();
        scrudProjectRepository.save(scrudProject);
        apiCreateFacade.bulkCreateApiSpecVersion(scrudProject.getScrudProjectId(), inDtoList, scrudProject.getUserId());

        // then
        List<ApiSpecVersion> all = apiSpecVersionJpaRepository.findAll();
        assertFalse(all.isEmpty(), "스펙이 정상 저장되어야 함");
        assertEquals(inDtoList.size(), all.size(), "입력된 개수와 저장된 개수가 일치해야 함");

        for (ApiSpecVersion saved : all) {
            log.info("✅ 저장된 엔드포인트: " + saved.getHttpMethod() + " - " + saved.getEndpoint());
            assertNotNull(saved.getHttpMethod());
            assertNotNull(saved.getApiGroup());
        }
    }

}