package com.barcoder.scrud.scrudproject.application.dto.in;

import com.barcoder.scrud.model.FileTypeEnumDto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@ToString
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class CreateProjectIn {
    private ScrudProjectIn scrudProjectDto;
    private List<GlobalFileIn> globalFiles;
    private UUID userId;
}
