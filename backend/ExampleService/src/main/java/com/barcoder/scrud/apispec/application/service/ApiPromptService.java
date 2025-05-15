package com.barcoder.scrud.apispec.application.service;

import com.barcoder.scrud.apispec.application.assembler.ApiPromptAssembler;
import com.barcoder.scrud.apispec.application.usecase.ApiPromptUseCase;
import com.barcoder.scrud.apispec.domain.entity.ApiPrompt;
import com.barcoder.scrud.apispec.infrastructure.jpa.ApiPromptJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class ApiPromptService implements ApiPromptUseCase {

    private final ApiPromptAssembler apiPromptAssembler;
    private final ApiPromptJpaRepository apiPromptJpaRepository;

    @Override
    public void savePrompt(String prompt, String response) {

        ApiPrompt apiPromptEntity = apiPromptAssembler.toApiPromptEntity(prompt, response);

        apiPromptJpaRepository.save(apiPromptEntity);
    }
}
