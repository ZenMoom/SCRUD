package com.barcoder.scrud.domain.member.model.entity;

import lombok.*;

@Getter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class Token {
    private String accessToken;
}
