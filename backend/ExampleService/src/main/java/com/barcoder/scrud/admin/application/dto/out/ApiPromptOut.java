package com.barcoder.scrud.admin.application.dto.out;

import com.barcoder.scrud.user.application.dto.out.UserOut;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Getter
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    @ToString
    public class ApiPromptOut {
        private String apiPromptId;
        private String prompt;
        private String response;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private UserOut user;
    }