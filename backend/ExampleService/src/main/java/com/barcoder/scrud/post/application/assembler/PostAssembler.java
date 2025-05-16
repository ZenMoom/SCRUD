package com.barcoder.scrud.post.application.assembler;

import com.barcoder.scrud.post.application.dto.in.CreatePostIn;
import com.barcoder.scrud.post.domain.entity.Category;
import com.barcoder.scrud.post.domain.entity.Post;
import org.springframework.stereotype.Component;

@Component
public class PostAssembler {

    public Post toPostEntity(CreatePostIn inDto, Category category) {

        return Post.builder()
                .userId(inDto.getUserId())
                .title(inDto.getTitle())
                .content(inDto.getContent())
                .category(category)
                .build();
    }
}
