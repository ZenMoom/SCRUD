package com.barcoder.scrud.post.infrastructure.querydsl;

import com.barcoder.scrud.post.domain.entity.Post;
import com.barcoder.scrud.post.domain.enums.PostOrder;
import com.barcoder.scrud.post.domain.enums.PostSort;
import com.barcoder.scrud.post.domain.query.in.PostListQueryIn;
import com.barcoder.scrud.post.domain.query.out.PostListQueryOut;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.barcoder.scrud.post.domain.entity.QCategory.category;
import static com.barcoder.scrud.post.domain.entity.QPost.post;

@Repository
@RequiredArgsConstructor
@Slf4j
public class PostQueryDsl {

    private final JPAQueryFactory queryFactory;

    public PostListQueryOut getPostList(PostListQueryIn queryIn) {

        BooleanBuilder where = new BooleanBuilder();

        // 검색 조건
        if (queryIn.getKeyword() != null && !queryIn.getKeyword().isBlank()) {
            String keyword = queryIn.getKeyword();
            switch (queryIn.getType()) {
                case TITLE -> where.and(post.title.containsIgnoreCase(keyword));
                case CONTENT -> where.and(post.content.containsIgnoreCase(keyword));
                case TITLE_CONTENT -> where.and(
                        post.title.containsIgnoreCase(keyword)
                                .or(post.content.containsIgnoreCase(keyword))
                );
            }
        }

        // 카테고리 필터
        if (queryIn.getCategoryId() != null) {
            where.and(post.category.categoryId.eq(queryIn.getCategoryId()));
        }

        // 정렬
        OrderSpecifier<?> orderSpecifier = getOrderSpecifier(queryIn.getSort(), queryIn.getOrder());

        // 전체 개수
        Long totalElements = queryFactory
                .select(post.count())
                .from(post)
                .leftJoin(post.category, category)
                .where(where)
                .fetchOne();

        // null 처리
        totalElements = (totalElements == null) ? 0L : totalElements;

        // 페이지 정보
        int offset = queryIn.getPage() * queryIn.getSize();
        int limit = queryIn.getSize();

        // 리스트 조회 (Post 엔티티 그대로 조회)
        List<Post> content = queryFactory
                .selectFrom(post)
                .leftJoin(post.category, category).fetchJoin()
                .where(where)
                .orderBy(orderSpecifier)
                .offset(offset)
                .limit(limit)
                .fetch();

        return PostListQueryOut.builder()
                .content(content)
                .listSize(content.size())
                .isFirstPage(queryIn.getPage() == 0)
                .isLastPage(offset + content.size() >= totalElements)
                .totalPages((int) Math.ceil((double) totalElements / limit))
                .totalElements(totalElements)
                .build();
    }

    private OrderSpecifier<?> getOrderSpecifier(PostSort sort, PostOrder order) {
        switch (sort) {
            case VIEW_COUNT -> {
                return order == PostOrder.ASC ? post.viewCount.asc() : post.viewCount.desc();
            }
            case LIKE_COUNT -> {
                return order == PostOrder.ASC ? post.likeCount.asc() : post.likeCount.desc();
            }
            case CREATED_AT -> {
                return order == PostOrder.ASC ? post.createdAt.asc() : post.createdAt.desc();
            }
            default -> throw new IllegalArgumentException("지원하지 않는 정렬 방식입니다.");
        }
    }

}

