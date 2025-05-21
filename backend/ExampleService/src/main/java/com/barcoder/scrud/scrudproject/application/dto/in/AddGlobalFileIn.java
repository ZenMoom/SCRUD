package com.barcoder.scrud.scrudproject.application.dto.in;

import lombok.*;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

@Getter
@ToString
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class AddGlobalFileIn {
    private Long projectId;
    private UUID userId;
    private Pageable pageable;
    private GlobalFileIn globalFileIn;
}
