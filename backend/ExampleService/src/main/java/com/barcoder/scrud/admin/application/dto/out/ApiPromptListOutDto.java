package com.barcoder.scrud.admin.application.dto.out;

import com.barcoder.scrud.user.application.dto.out.UserOut;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ApiPromptListOutDto {
    private Integer page;
    private Integer limit;
    private Integer totalItems;
    private Integer totalPages;
    private List<ApiPromptOut> content;


}
