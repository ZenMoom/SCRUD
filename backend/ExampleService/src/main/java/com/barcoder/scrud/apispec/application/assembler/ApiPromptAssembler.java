package com.barcoder.scrud.apispec.application.assembler;

import com.barcoder.scrud.apispec.domain.entity.ApiPrompt;
import org.springframework.stereotype.Component;

@Component
public class ApiPromptAssembler {

    public ApiPrompt toApiPromptEntity(String prompt, String response) {

        return ApiPrompt.builder()
                .prompt(prompt)
                .response(response)
                .build();
    }
}
