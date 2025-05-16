package com.barcoder.scrud.post.domain.query.in;

import com.barcoder.scrud.post.domain.enums.PostOrder;
import com.barcoder.scrud.post.domain.enums.PostSearchType;
import com.barcoder.scrud.post.domain.enums.PostSort;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class PostListQueryIn {

    private Integer page;
    private Integer size;
    private PostSort sort;
    private PostOrder order;
    private String keyword;
    private PostSearchType type;
    private Long categoryId;
}
