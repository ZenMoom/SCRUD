package com.barcoder.scrud.scrudproject.service;

import com.barcoder.scrud.scrudproject.application.dto.in.AddGlobalFileIn;
import com.barcoder.scrud.scrudproject.application.dto.in.CreateProjectIn;
import com.barcoder.scrud.scrudproject.application.dto.out.AllGlobalFileOut;
import com.barcoder.scrud.scrudproject.application.dto.out.AllScrudProjectOut;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ScrudProjectService {
    void createProject(CreateProjectIn inDto);

    AllScrudProjectOut getAllProjects(Pageable pageable, UUID userId);

    void addGlobalFile(AddGlobalFileIn inDto);

    void deleteGlobalFile(Long projectId, Long globalFileId, UUID userId);

    AllGlobalFileOut getAllGlobalFile(Long projectId, UUID userId);

    void deleteProject(Long projectId, UUID userId);
}
