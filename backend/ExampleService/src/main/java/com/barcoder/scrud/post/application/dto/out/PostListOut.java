package com.barcoder.scrud.post.application.dto.out;

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
public class PostListOut {

    private int listSize;
    private boolean isFirstPage;
    private boolean isLastPage;
    private int totalPages;
    private long totalElements;

    private List<PostOut> content;
}
