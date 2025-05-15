package com.barcoder.scrud.apispec.domain.query.out;

import com.barcoder.scrud.apispec.domain.entity.ApiSpec;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class SearchApiStatusQueryOut {

	private PageMetadata metadata;
	private List<ApiSpec> content;
}
