package com.barcoder.scrud.scrudproject.application.dto.out;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@ToString
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class ScrudProjectOut {
    private Long scrudProjectId;
    private String title;
    private String description;
    private String serverUrl;
    private LocalDateTime updatedAt;
}