package com.barcoder.scrud.admin.presentation.controller;

import com.barcoder.scrud.admin.application.dto.out.ApiPromptListOutDto;
import com.barcoder.scrud.admin.application.dto.out.ApiPromptOut;
import com.barcoder.scrud.admin.application.facade.AdminFacade;
import com.barcoder.scrud.admin.application.service.ApiPromptService;
import com.barcoder.scrud.admin.presentation.dto.response.ApiPromptListResponseDto;
import com.barcoder.scrud.admin.presentation.dto.response.ApiPromptResponseDto;
import com.barcoder.scrud.global.common.util.SecurityUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ModelMapper modelMapper;
    private final ApiPromptService apiPromptService;
    private final AdminFacade adminFacade;
    private final SecurityUtil securityUtil;

    @GetMapping("/api-prompts")
    public ResponseEntity<ApiPromptListResponseDto> getApiPromptList() {
        UUID userId = securityUtil.getCurrentUserId();
        ApiPromptListOutDto outDto = adminFacade.getApiPromptList(userId);
        // ModelMapper를 활용한 리스트 변환
        List<ApiPromptResponseDto> content = outDto.getContent().stream()
                .map(item -> modelMapper.map(item, ApiPromptResponseDto.class))
                .toList();

        ApiPromptListResponseDto response = modelMapper.map(outDto, ApiPromptListResponseDto.class).toBuilder()
                .content(content)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/api-prompts/{apiPromptId}")
    public ResponseEntity<ApiPromptResponseDto> getApiPromptDetail(@PathVariable("apiPromptId") Long apiPromptId) {
        UUID userId = securityUtil.getCurrentUserId();
        ApiPromptOut outDto = adminFacade.getApiPromptDetail(apiPromptId, userId);
        ApiPromptResponseDto response = modelMapper.map(outDto, ApiPromptResponseDto.class);
        return ResponseEntity.ok(response);
    }
}
