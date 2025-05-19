package com.barcoder.scrud.post.domain.exception;

import com.barcoder.scrud.global.common.error.BaseErrorCode;
import com.barcoder.scrud.global.common.error.ErrorReasonDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum PostErrorStatus implements BaseErrorCode {

	// category error
	CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "POST5001", "존재하지 않는 카테고리입니다."),

	// post error
	POST_NOT_FOUND(HttpStatus.NOT_FOUND, "POST5101", "존재하지 않는 게시글입니다."),
	POST_NOT_AUTHORIZED(HttpStatus.FORBIDDEN, "POST5102", "게시글 작성자가 아닙니다."),
	POST_ALREADY_VOTED(HttpStatus.BAD_REQUEST, "POST5103", "이미 추천한 게시글입니다."),

	// comment error
	COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "POST5201", "존재하지 않는 댓글입니다."),
    COMMENT_NOT_AUTHORIZED(HttpStatus.FORBIDDEN, "POST5202", "댓글 작성자가 아닙니다."),
	COMMENT_VOTE_SELF(HttpStatus.BAD_REQUEST, "POST5203", "자신의 댓글에 추천/비추천을 할 수 없습니다."),
	COMMENT_ALREADY_VOTED(HttpStatus.BAD_REQUEST, "POST5204", "이미 추천/비추천한 댓글입니다."),


;
	private final HttpStatus httpStatus;
	private final String code;
	private final String message;

	@Override
	public ErrorReasonDTO getReason() {
		return ErrorReasonDTO.builder()
				.message(message)
				.code(code)
				.isSuccess(false)
				.build();
	}

	@Override
	public ErrorReasonDTO getReasonHttpStatus() {
		return ErrorReasonDTO.builder()
				.message(message)
				.code(code)
				.isSuccess(false)
				.httpStatus(httpStatus)
				.build();
	}
}
