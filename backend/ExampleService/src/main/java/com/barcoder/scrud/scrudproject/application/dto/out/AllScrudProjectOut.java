package com.barcoder.scrud.scrudproject.application.dto.out;

import com.barcoder.scrud.model.FileTypeEnumDto;
import lombok.*;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class AllScrudProjectOut {
    private Pageable pageable;
    private List<ScrudProjectOut> content;
}
