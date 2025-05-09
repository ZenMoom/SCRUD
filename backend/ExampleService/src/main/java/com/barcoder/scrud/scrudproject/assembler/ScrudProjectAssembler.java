package com.barcoder.scrud.scrudproject.assembler;

import com.barcoder.scrud.model.*;
import com.barcoder.scrud.scrudproject.application.dto.in.CreateProjectIn;
import com.barcoder.scrud.scrudproject.application.dto.in.GlobalFileIn;
import com.barcoder.scrud.scrudproject.application.dto.in.UpdateProjectIn;
import com.barcoder.scrud.scrudproject.domain.entity.GlobalFile;
import com.barcoder.scrud.scrudproject.domain.entity.ScrudProject;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@Transactional
public class ScrudProjectAssembler {

    public ScrudProject toScrudProject(CreateProjectIn inDto) {
        return ScrudProject.builder()
                .userId(inDto.getUserId())
                .title(inDto.getScrudProjectDto().getTitle())
                .description(inDto.getScrudProjectDto().getDescription())
                .serverUrl(inDto.getScrudProjectDto().getServerUrl())
                .build();
    }

    public ScrudProject toScrudProject(UpdateProjectIn inDto) {
        return ScrudProject.builder()
            .scrudProjectId(inDto.getScrudProjectDto().getScrudProjectId())
            .userId(inDto.getUserId())
            .title(inDto.getScrudProjectDto().getTitle())
            .description(inDto.getScrudProjectDto().getDescription())
            .serverUrl(inDto.getScrudProjectDto().getServerUrl())
            .build();
    }

    // 원본을 따로 보여줘야 한다면 전처리 된 파일은 프롬프팅 할 때만 활용하고, 사용자에게 보여줄 파일을 따로 저장해둬야 함. 상의해보기
    public GlobalFile toGlobalFile(GlobalFileIn globalFile) {
        if(globalFile.getFileType().equals(FileTypeEnumDto.ARCHITECTURE_GITHUB)) {
            try {
                // JSON 파싱해서 path 랑 type 만 남겨서 저장하기
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(globalFile.getFileContent());
                log.info("root = {}", root );

                List<Map<String, String>> simplifiedList = new ArrayList<>();

                for (JsonNode node : root.get("tree")) {
                    if (node.has("path") && node.has("type")) {
                        Map<String, String> map = new HashMap<>();
                        map.put("path", node.get("path").asText());
                        map.put("type", node.get("type").asText());
                        simplifiedList.add(map);
                    }
                }

                // 다시 JSON으로 직렬화해서 저장 (string 형태로 저장)
                String simplifiedJson = mapper.writeValueAsString(simplifiedList);

                return GlobalFile.builder()
                        .fileName(globalFile.getFileName())
                        .fileType(globalFile.getFileType())
                        .fileContent(simplifiedJson)
                        .fileUrl(globalFile.getFileUrl())
                        .build();
            } catch (Exception e) {
                throw new RuntimeException("GitHub tree 파싱 중 오류 발생", e);
            }
        }

        return GlobalFile.builder()
                .fileName(globalFile.getFileName())
                .fileType(globalFile.getFileType())
                .fileContent(globalFile.getFileContent())
                .fileUrl(globalFile.getFileUrl())
                .build();
    }

    public GlobalFileListDto toGlobalFileListDto(List<GlobalFile> globalFile) {

        List<GlobalFileDto> fileList = globalFile.stream().map(this::toGlobalFileDto).toList();

        return GlobalFileListDto.builder()
                .content(fileList)
                .build();
    }

    public GlobalFileDto toGlobalFileDto(GlobalFile globalFile) {
        return GlobalFileDto.builder()
                .fileName(globalFile.getFileName())
                .fileType(globalFile.getFileType())
                .fileContent(globalFile.getFileContent())
                .fileUrl(globalFile.getFileUrl())
                .build();
    }

    public ScrudProjectPageDto toScrudProjectPageDto(List<ScrudProject> scrudProjects) {
        List<ScrudProjectDto> scrudProjectDto = scrudProjects.stream().map(this::toScrudProjectDto).toList();

        return ScrudProjectPageDto.builder()
                .content(scrudProjectDto)
                .build();
    }

    public ScrudProjectDto toScrudProjectDto(ScrudProject scrudProjects) {
        return ScrudProjectDto.builder()
                .scrudProjectId(scrudProjects.getScrudProjectId())
                .title(scrudProjects.getTitle())
                .description(scrudProjects.getDescription())
                .serverUrl(scrudProjects.getServerUrl())
                .updatedAt(scrudProjects.getUpdatedAt())
                .build();
    }
}
