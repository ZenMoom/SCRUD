package com.barcoder.scrud.domain.user.model.entity;

import lombok.*;

@Getter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class Token {
    private String accessToken;
}
