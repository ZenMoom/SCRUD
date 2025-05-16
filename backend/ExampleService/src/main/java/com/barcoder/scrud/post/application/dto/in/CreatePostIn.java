package com.barcoder.scrud.post.application.dto.in;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.UUID;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class CreatePostIn {

    private UUID userId;
    private String title;
    private String content;
    private Long categoryId;
}