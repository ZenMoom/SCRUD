package com.barcoder.scrud.scrudproject.application.dto.out;

import lombok.*;

import java.util.List;

@Getter
@ToString
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class AllGlobalFileOut {
    private ScrudProjectOut project;
    private List<GlobalFileOut> content;
}
