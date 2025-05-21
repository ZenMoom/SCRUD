package com.barcoder.scrud.spec.infrastructure.querydsl;

import com.barcoder.scrud.spec.domain.entity.ServiceSpecVersion;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import static com.barcoder.scrud.spec.domain.entity.QOperationFieldRule.operationFieldRule;
import static com.barcoder.scrud.spec.domain.entity.QServiceSpecVersion.serviceSpecVersion;
import static com.barcoder.scrud.spec.domain.entity.QSpecVersion.specVersion;

@Repository
@RequiredArgsConstructor
public class SpecQuerydsl {

	private final JPAQueryFactory queryFactory;

	public ServiceSpecVersion getLatestServiceSpecVersionWithRules() {
		return queryFactory
				.selectFrom(serviceSpecVersion)
				.join(serviceSpecVersion.specVersion, specVersion).fetchJoin()
				.leftJoin(serviceSpecVersion.operationFieldRules, operationFieldRule).fetchJoin()
				.orderBy(
						serviceSpecVersion.scrudVersion.major.desc(),
						serviceSpecVersion.scrudVersion.minor.desc(),
						serviceSpecVersion.scrudVersion.patch.desc()
				)
				.limit(1)
				.fetchOne();
	}
}
