SET SQL_SAFE_UPDATES = 0;

-- 트랜잭션 시작 
BEGIN;

-- 기본 카테고리 추가
INSERT INTO `category` (`category_id`, `name`)
VALUES (1, 'feature'),
       (2, 'bug'),
       (3, 'improvement'),
       (4, 'question');

-- 트랜잭션 커밋
COMMIT;