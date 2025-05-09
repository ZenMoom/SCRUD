package com.barcoder.scrud.scrudproject.presentation.controller;

import com.barcoder.scrud.api.ScrudProjectApi;
import com.barcoder.scrud.global.common.util.SecurityUtil;
import com.barcoder.scrud.model.CreateProjectRequest;
import com.barcoder.scrud.model.GlobalFileDto;
import com.barcoder.scrud.model.GlobalFileListDto;
import com.barcoder.scrud.model.ScrudProjectPageDto;
import com.barcoder.scrud.scrudproject.application.dto.in.AddGlobalFileIn;
import com.barcoder.scrud.scrudproject.application.dto.in.CreateProjectIn;
import com.barcoder.scrud.scrudproject.application.dto.in.GlobalFileIn;
import com.barcoder.scrud.scrudproject.application.dto.out.AllGlobalFileOut;
import com.barcoder.scrud.scrudproject.application.dto.out.AllScrudProjectOut;
import com.barcoder.scrud.scrudproject.service.ScrudProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ScrudProjectController implements ScrudProjectApi {

    private final ModelMapper modelMapper;
    private final SecurityUtil securityUtil;
    private final ScrudProjectService scrudProjectService;

    /**
     * POST /api/v1/projects : 프로젝트 생성
     *
     * @param createProjectRequest (optional)
     * @return String API 반환 (status code 201)
     */
    @Override
    public ResponseEntity<String> createProject(CreateProjectRequest createProjectRequest) {

        UUID userId = securityUtil.getCurrentUserId();

        CreateProjectIn inDto = modelMapper.map(createProjectRequest, CreateProjectIn.class).toBuilder()
                .userId(userId)
                .build();

        // 이후 단계에서 반환 타입을 권선이 정해주면 프롬프팅해서 만들어줘야 할 듯
        Long projectId = scrudProjectService.createProject(inDto);

        return ResponseEntity.ok(String.valueOf(projectId));
    }

    /**
     * GET /api/v1/projects : 프로젝트 전체 목록 조회
     *
     * @param pageable
     * @return ScrudProjectPageDto 프로젝트 목록 (status code 200)
     * or 요청한 리소스를 찾을 수 없습니다. (status code 404)
     */
    @Override
    public ResponseEntity<ScrudProjectPageDto> getAllProjects(Pageable pageable) {

        UUID userId = securityUtil.getCurrentUserId();

        AllScrudProjectOut allScrudProjectOut = scrudProjectService.getAllProjects(pageable, userId);

        log.info(allScrudProjectOut.toString());

        ScrudProjectPageDto outDto = modelMapper.map(allScrudProjectOut, ScrudProjectPageDto.class);

        log.info(outDto.toString());

        return ResponseEntity.ok(outDto);
    }

    /**
     * PUT /api/v1/projects/{projectId}
     * 전역 파일 추가
     *
     * @param projectId     프로젝트 ID (required)
     * @param globalFileDto (optional)
     * @return Void 성공적으로 처리되었습니다 (status code 204)
     */
    @Override
    public ResponseEntity<Void> addGlobalFile(Long projectId, GlobalFileDto globalFileDto) {

        UUID userId = securityUtil.getCurrentUserId();

        AddGlobalFileIn inDto = AddGlobalFileIn.builder()
                .projectId(projectId)
                .userId(userId)
                .globalFileIn(modelMapper.map(globalFileDto, GlobalFileIn.class))
                .build();

        log.info(inDto.toString());

        scrudProjectService.addGlobalFile(inDto);

        return ResponseEntity.ok().build();
    }

    // 전체 전역 설정 파일의 제목과 id 만 있으면 되고,
    // 전역 파일 상세 조회하면 개별 파일 content 내용을 반환해주면 되는데
    // 어떻게 처리할 지 내일 생각해보기!

    /**
     * GET /api/v1/projects/{projectId}
     *
     * @param projectId 프로젝트 ID (required)
     * @return GlobalFileListDto 전체 전역설정 파일 목록 (status code 200)
     * or 요청한 리소스를 찾을 수 없습니다. (status code 404)
     */
    @Override
    public ResponseEntity<GlobalFileListDto> getAllGlobalFile(Long projectId) {

        UUID userId = securityUtil.getCurrentUserId();

        AllGlobalFileOut content = scrudProjectService.getAllGlobalFile(projectId, userId);

        log.info(content.toString());

        GlobalFileListDto outDto = modelMapper.map(content, GlobalFileListDto.class);

        log.info(outDto.toString());

        return ResponseEntity.ok().body(outDto);
    }

    /**
     * DELETE /api/v1/projects/{projectId}/{globalFileId}
     * 전역 파일 삭제
     *
     * @param projectId    프로젝트 ID (required)
     * @param globalFileId 전역 파일 ID (required)
     * @return Void 성공적으로 처리되었습니다 (status code 204)
     */
    @Override
    public ResponseEntity<Void> deleteGlobalFile(Long projectId, Long globalFileId) {

        UUID userId = securityUtil.getCurrentUserId();

        scrudProjectService.deleteGlobalFile(projectId, globalFileId, userId);

        return ResponseEntity.ok().build();
    }

    /**
     * DELETE /api/v1/projects/{projectId}
     * 프로젝트 삭제
     *
     * @param projectId 프로젝트 ID (required)
     * @return Void 성공적으로 처리되었습니다 (status code 204)
     */
    @Override
    public ResponseEntity<Void> deleteProject(Long projectId) {

        UUID userId = securityUtil.getCurrentUserId();

        scrudProjectService.deleteProject(projectId, userId);

        return ResponseEntity.ok().build();
    }
}
