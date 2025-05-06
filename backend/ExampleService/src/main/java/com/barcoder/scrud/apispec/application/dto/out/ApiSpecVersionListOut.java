package com.barcoder.scrud.apispec.application.dto.out;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class ApiSpecVersionListOut {
	List<ApiSpecVersionOut> content;
}
