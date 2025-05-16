package com.barcoder.scrud.post.application.dto.in;

import com.barcoder.scrud.post.domain.enums.PostOrder;
import com.barcoder.scrud.post.domain.enums.PostSort;
import com.barcoder.scrud.post.domain.enums.PostSearchType;
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
public class GetPostListIn {

    private Integer page;
    private Integer size;
    private PostSort sort;
    private PostOrder order;
    private String keyword;
    private PostSearchType type;
    private Long categoryId;
}
