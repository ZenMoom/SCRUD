package com.barcoder.scrud.post.domain.query.out;

import com.barcoder.scrud.post.domain.entity.Post;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class PostListQueryOut {

    private List<Post> content;

    private int listSize;
    private boolean isFirstPage;
    private boolean isLastPage;
    private int totalPages;
    private long totalElements;
}
