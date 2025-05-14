package com.barcoder.scrud.apispec.domain.query.out;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class PageMetadata {

    private int listSize;
    private boolean isFirstPage;
    private boolean isLastPage;
    private int totalPages;
    private int totalElements;
}
