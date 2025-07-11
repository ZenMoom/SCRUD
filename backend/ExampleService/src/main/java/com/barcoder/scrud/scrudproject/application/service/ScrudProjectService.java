package com.barcoder.scrud.scrudproject.application.service;

import com.barcoder.scrud.scrudproject.application.dto.in.AddGlobalFileIn;
import com.barcoder.scrud.scrudproject.application.dto.in.CreateProjectIn;
import com.barcoder.scrud.scrudproject.application.dto.in.UpdateProjectIn;
import com.barcoder.scrud.scrudproject.application.dto.out.AllGlobalFileOut;
import com.barcoder.scrud.scrudproject.application.dto.out.AllScrudProjectOut;
import com.barcoder.scrud.scrudproject.application.dto.out.ScrudProjectOut;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ScrudProjectService {
    Long createProject(CreateProjectIn inDto);

    AllScrudProjectOut getAllProjects(Pageable pageable, UUID userId);

    void addGlobalFile(AddGlobalFileIn inDto);

    void deleteGlobalFile(Long projectId, Long globalFileId, UUID userId);

    AllGlobalFileOut getProject(Long projectId, UUID userId);

    ScrudProjectOut updateScrudProject(UpdateProjectIn inDto);

    void deleteProject(Long projectId, UUID userId);
}
