package com.barcoder.scrud.admin.presentation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ApiPromptListResponseDto {
    private Integer page;
    private Integer limit;
    private Integer totalItems;
    private Integer totalPages;
    private List<ApiPromptResponseDto> content;
}