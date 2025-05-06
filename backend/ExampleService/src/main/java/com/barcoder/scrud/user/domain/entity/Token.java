package com.barcoder.scrud.user.domain.entity;

import lombok.*;

@Getter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class Token {
    private String accessToken;
}
