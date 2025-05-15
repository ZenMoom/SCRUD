package com.barcoder.scrud.apispec.infrastructure.querydsl;

import com.barcoder.scrud.apispec.domain.entity.ApiSpec;
import com.barcoder.scrud.apispec.domain.query.in.SearchApiStatusQueryIn;
import com.barcoder.scrud.apispec.domain.query.out.PageMetadata;
import com.barcoder.scrud.apispec.domain.query.out.SearchApiStatusQueryOut;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.barcoder.scrud.apispec.domain.entity.QApiSpec.apiSpec;
import static com.barcoder.scrud.apispec.domain.entity.QApiSpecVersion.apiSpecVersion;

@Repository
@RequiredArgsConstructor
public class ApiSpecQueryDsl {

	private final JPAQueryFactory queryFactory;

	public SearchApiStatusQueryOut searchApiStatus(SearchApiStatusQueryIn queryIn) {

		BooleanBuilder builder = new BooleanBuilder();

		// 1. project id
		if (queryIn.getScrudProjectId() != null) {
			builder.and(apiSpec.scrudProject.scrudProjectId.eq(queryIn.getScrudProjectId()));
		}

		// 2. status 조건
		if (queryIn.getApiSpecStatusList() != null && !queryIn.getApiSpecStatusList().isEmpty()) {
			builder.and(apiSpec.apiSpecStatus.in(queryIn.getApiSpecStatusList()));
		}

		// 3. 조회
		List<ApiSpec> result = queryFactory
				.selectFrom(apiSpec)
				.join(apiSpec.apiSpecVersion, apiSpecVersion).fetchJoin()
				.where(builder)
				.orderBy(apiSpec.updatedAt.desc())
				.fetch();

		// 4. 메타데이터 생성
		PageMetadata metadata = PageMetadata.builder()
				.listSize(result.size())
				.totalElements(result.size())
				.totalPages(1) // 페이징 미적용 시 1 페이지
				.isFirstPage(true)
				.isLastPage(true)
				.build();

		// 5. 결과 반환
		return SearchApiStatusQueryOut.builder()
				.metadata(metadata)
				.content(result)
				.build();
	}
}
