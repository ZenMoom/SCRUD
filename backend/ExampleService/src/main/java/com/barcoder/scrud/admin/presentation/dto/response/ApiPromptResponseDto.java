package com.barcoder.scrud.admin.presentation.dto.response;

import com.barcoder.scrud.user.application.dto.out.UserOut;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ApiPromptResponseDto {
    private String apiPromptId;
    private String prompt;
    private String response;
    private String createdAt;
    private String updatedAt;
    private UserOut user;
}