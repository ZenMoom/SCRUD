package com.barcoder.scrud.scrudproject.application.dto.in;

import lombok.*;

import java.util.UUID;

@Getter
@ToString
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProjectIn {
    private ScrudProjectIn scrudProjectDto;
    private UUID userId;
}
