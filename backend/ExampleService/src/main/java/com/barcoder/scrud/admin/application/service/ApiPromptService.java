package com.barcoder.scrud.admin.application.service;

import com.barcoder.scrud.admin.application.dto.out.ApiPromptListOutDto;
import com.barcoder.scrud.admin.application.dto.out.ApiPromptOut;
import com.barcoder.scrud.admin.infrastructure.jpa.ApiPromptJpaRepository;
import com.barcoder.scrud.apispec.application.assembler.ApiPromptAssembler;
import com.barcoder.scrud.apispec.application.usecase.ApiPromptUseCase;
import com.barcoder.scrud.apispec.domain.entity.ApiPrompt;
import com.barcoder.scrud.global.common.error.ErrorStatus;
import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ApiPromptService implements ApiPromptUseCase {

    private final ApiPromptAssembler apiPromptAssembler;
    private final ApiPromptJpaRepository apiPromptJpaRepository;
    private final ModelMapper modelMapper;

    @Override
    public void savePrompt(String prompt, String response) {

        ApiPrompt apiPromptEntity = apiPromptAssembler.toApiPromptEntity(prompt, response);

        apiPromptJpaRepository.save(apiPromptEntity);
    }

    @Transactional(readOnly = true)
    public ApiPromptListOutDto getApiPromptList() {
        List<ApiPrompt> prompts = apiPromptJpaRepository.findAll();
        // OutDto에서 엔티티 정보만 담고, ResponseDto와 분리
        List<ApiPromptOut> items = prompts.stream()
                .map(p -> modelMapper.map(p, ApiPromptOut.class))
                .toList();

        return ApiPromptListOutDto.builder()
                .page(1)
                .limit(items.size())
                .totalItems(items.size())
                .totalPages(1)
                .content(items)
                .build();
    }

    @Transactional(readOnly = true)
    public ApiPromptOut getApiPromptDetail(Long apiPromptId) {
        ApiPrompt apiPrompt = apiPromptJpaRepository.findById(apiPromptId)
                .orElseThrow(() -> new ExceptionHandler(ErrorStatus.API_PROMPT_NOT_FOUND));

        return modelMapper.map(apiPrompt, ApiPromptOut.class);
    }
}
