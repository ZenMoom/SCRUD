package com.barcoder.scrud.scrudproject.application.service;

import com.barcoder.scrud.apispec.infrastructure.event.ApiSpecGenerateEvent;
import com.barcoder.scrud.global.common.error.ErrorStatus;
import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import com.barcoder.scrud.scrudproject.application.assembler.ScrudProjectAssembler;
import com.barcoder.scrud.scrudproject.application.dto.in.AddGlobalFileIn;
import com.barcoder.scrud.scrudproject.application.dto.in.CreateProjectIn;
import com.barcoder.scrud.scrudproject.application.dto.in.UpdateProjectIn;
import com.barcoder.scrud.scrudproject.application.dto.out.AllGlobalFileOut;
import com.barcoder.scrud.scrudproject.application.dto.out.AllScrudProjectOut;
import com.barcoder.scrud.scrudproject.application.dto.out.GlobalFileOut;
import com.barcoder.scrud.scrudproject.application.dto.out.ScrudProjectOut;
import com.barcoder.scrud.scrudproject.domain.entity.GlobalFile;
import com.barcoder.scrud.scrudproject.domain.entity.ScrudProject;
import com.barcoder.scrud.scrudproject.repository.ScrudProjectRepository;
import com.barcoder.scrud.user.infrastructure.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ScrudProjectServiceImpl implements ScrudProjectService {

    private final ModelMapper modelMapper;
    private final UserRepository userRepository;
    private final ScrudProjectAssembler scrudProjectAssembler;
    private final ScrudProjectRepository scrudProjectRepository;
    // event publisher
    private final ApplicationEventPublisher eventPublisher;

    // 1. 프로젝트 생성하기
    @Override
    public Long createProject(CreateProjectIn inDto) {

        getUser(inDto.getUserId());

        List<GlobalFile> globalFiles = inDto.getGlobalFiles().stream().map(scrudProjectAssembler::toGlobalFile).toList();

        ScrudProject project = scrudProjectAssembler.toScrudProject(inDto);

        project.setGlobalFileList(globalFiles);

        globalFiles.stream().iterator().forEachRemaining(
                (file) -> file.setScrudProject(project)
        );

        scrudProjectRepository.save(project);
//         eventPublisher.publishEvent(new ApiSpecGenerateEvent(project));

        return project.getScrudProjectId();
    }

    // 2. 프로젝트 전체 목록 반환
    @Override
    public AllScrudProjectOut getAllProjects(Pageable pageable, UUID userId) {
        log.info("getAllProjects");
        getUser(userId);

        List<ScrudProject> content = scrudProjectRepository.findScrudProjectsByUserIdOrderByUpdatedAtDesc(pageable, userId);

        List<ScrudProjectOut> projects = content.stream()
                .map(scrudProject ->
                        modelMapper.map(scrudProject, ScrudProjectOut.class)
                )
                .toList();

        AllScrudProjectOut outDto = AllScrudProjectOut.builder()
                .content(projects)
                .build();

        return outDto;
    }

    // 3. 프로젝트 설정 수정
    @Override
    public ScrudProjectOut updateScrudProject(UpdateProjectIn inDto) {

        getUser(inDto.getUserId());

        ScrudProject project = scrudProjectAssembler.toScrudProject(inDto);

        ScrudProject originalProject = scrudProjectRepository.findById(project.getScrudProjectId())
            .orElseThrow(() -> new ExceptionHandler(ErrorStatus.SCRUDPROJECT_NOT_FOUND));

        originalProject.update(project);

        return modelMapper.map(originalProject, ScrudProjectOut.class);
    }

    // 4. 전역 파일 개별 추가
    @Override
    public void addGlobalFile(AddGlobalFileIn inDto) {

        getUser(inDto.getUserId());

        ScrudProject project = scrudProjectRepository.findByScrudProjectIdAndUserId(inDto.getProjectId(), inDto.getUserId())
                .orElseThrow(() -> new ExceptionHandler(ErrorStatus.SCRUDPROJECT_NOT_FOUND));

        GlobalFile globalFile = scrudProjectAssembler.toGlobalFile(inDto.getGlobalFileIn());

        project.addGlobalFile(globalFile);
    }

    // 5. 전역 파일 개별 삭제
    @Override
    public void deleteGlobalFile(Long projectId, Long globalFileId, UUID userId) {
        getUser(userId);

        ScrudProject project = scrudProjectRepository.findByScrudProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ExceptionHandler(ErrorStatus.SCRUDPROJECT_NOT_FOUND));

        log.info("Service");
        log.info("getAllProject projects = {}", project);

        GlobalFile globalFile = project.getGlobalFileList().stream()
                .filter(file -> file.getGlobalFileId().equals(globalFileId))
                .findFirst()
                .orElseThrow(() -> new ExceptionHandler(ErrorStatus.GLOBALFILE_NOT_FOUND));

        log.info("getAllProject globalFile = {}", globalFile);

        project.getGlobalFileList().remove(globalFile);
    }

    // 6. 해당 프로젝트의 전체 전역 설정 파일 가져오기
    @Override
    public AllGlobalFileOut getProject(Long projectId, UUID userId) {
        getUser(userId);

        ScrudProject project = scrudProjectRepository.findByScrudProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ExceptionHandler(ErrorStatus.SCRUDPROJECT_NOT_FOUND));

        ScrudProjectOut projectInfo = modelMapper.map(project, ScrudProjectOut.class);

        List<GlobalFileOut> globalFiles = project.getGlobalFileList().stream()
                .map(globalFile ->
                        modelMapper.map(globalFile, GlobalFileOut.class)).toList();

        AllGlobalFileOut outDto = AllGlobalFileOut.builder()
                .project(projectInfo)
                .content(globalFiles)
                .build();

        return outDto;
    }

    @Override
    public void deleteProject(Long projectId, UUID userId) {
        getUser(userId);

        scrudProjectRepository.findById(projectId)
                .orElseThrow(() -> new ExceptionHandler(ErrorStatus.SCRUDPROJECT_NOT_FOUND));

        scrudProjectRepository.deleteById(projectId);
    }

    // 사용자 검증 & 가져오기
    private void getUser(UUID userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ExceptionHandler(ErrorStatus.USER_NOT_FOUND));
    }
}
