package com.barcoder.scrud.scrudproject.application.dto.in;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@ToString
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class ScrudProjectIn {
    private Long scrudProjectId;
    private String title;
    private String description;
    private String serverUrl;
    private LocalDateTime updatedAt;
}