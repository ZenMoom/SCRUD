package com.barcoder.scrud.example.presentation.controller;


import com.barcoder.scrud.api.ExampleApi;
import com.barcoder.scrud.model.ExampleDto;
import com.barcoder.scrud.model.ExamplePageDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
public class ExampleController implements ExampleApi {

    private ExampleDto create() {
        return ExampleDto.builder()
                .exampleEnum(ExampleDto.ExampleEnumEnum.ONE)
                .exampleString("테스트")
                .exampleInteger(111)
                .build();
    }
    /**
     * POST /api/v1/examples : 예시를 하나 생성합니다. 예시를 하나 생성합니다. 상세 예시 입니다.
     *
     * @param exampleDto 예시 업데이트 입력값입니다. (required)
     * @return ExampleDto 조회 성공 (status code 200) or 요청한 리소스를 찾을 수 없습니다. (status code 404)
     */
    @Override
    public ResponseEntity<ExampleDto> createExampleOne(ExampleDto exampleDto) {
        ExampleDto dto = ExampleDto.builder()
                .exampleEnum(exampleDto.getExampleEnum())
                .exampleString(exampleDto.getExampleString())
                .exampleInteger(exampleDto.getExampleInteger())
                .build();

        return ResponseEntity.ok(dto);
    }

    /**
     * GET /api/v1/examples/{exampleId} : 특정 ID의 예시를 조회합니다. 주어진 ID에 해당하는 예시를 조회합니다. 상세 예시 입니다.
     *
     * @param exampleId 업데이트할 예시의 ID (required)
     * @return ExampleDto 조회 성공 (status code 200) or 요청한 리소스를 찾을 수 없습니다. (status code 404)
     */
    @Override
    public ResponseEntity<ExampleDto> getExampleById(Integer exampleId) {
        return ResponseEntity.ok(create());
    }

    /**
     * GET /api/v1/examples : 예시 목록을 페이지네이션하여 조회합니다. 예시 목록을 페이지 번호와 페이지 크기를 이용하여 페이지네이션하여 조회합니다.
     *
     * @param pageable
     * @return ExamplePageDto 페이지 조회 성공 (status code 200) or 요청한 리소스를 찾을 수 없습니다. (status code 404)
     */
    @Override
    public ResponseEntity<ExamplePageDto> getExamplesWithPagination(Pageable pageable) {
        log.info("getExamplesWithPagination");

        ExamplePageDto dto = ExamplePageDto.builder()
                .content(List.of(create()))
                .isFirstPage(pageable.getPageNumber() == 0)
                .isLastPage(pageable.getPageSize() == 0)
                .listSize(pageable.getPageSize())
                .build();

        log.info(dto.toString());
        return ResponseEntity.ok(dto);

    }

    /**
     * POST /api/v1/examples/{exampleId} : 특정 ID의 예시를 업데이트합니다. 주어진 ID에 해당하는 예시를 업데이트합니다. 상세 예시 입니다.
     *
     * @param exampleId  업데이트할 예시의 ID (required)
     * @param exampleDto 예시 업데이트 입력값입니다. (required)
     * @return ExampleDto 조회 성공 (status code 200) or 요청한 리소스를 찾을 수 없습니다. (status code 404)
     */
    @Override
    public ResponseEntity<ExampleDto> updateExampleById(Integer exampleId, ExampleDto exampleDto) {
        return ResponseEntity.ok(create());
    }
}
