package com.barcoder.scrud.scrudproject.application.dto.out;

import com.barcoder.scrud.model.FileTypeEnumDto;
import lombok.*;

@Getter
@ToString
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class GlobalFileOut {
    private Long globalFileId;
    private String fileName;
    private FileTypeEnumDto fileType;
    private String fileUrl;
    private String fileContent;
}