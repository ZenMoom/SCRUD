package com.barcoder.scrud.apispec.domain.query.in;

import com.barcoder.scrud.apispec.domain.enums.ApiSpecStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class SearchApiStatusQueryIn {

	private Long scrudProjectId;
	private List<ApiSpecStatus> apiSpecStatusList;
}
