package com.barcoder.scrud.scrudproject.application.dto.in;

import com.barcoder.scrud.model.FileTypeEnumDto;
import lombok.*;

@Getter
@ToString
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class GlobalFileIn {
    private String fileName;
    private FileTypeEnumDto fileType;
    private String fileUrl;
    private String fileContent;
}