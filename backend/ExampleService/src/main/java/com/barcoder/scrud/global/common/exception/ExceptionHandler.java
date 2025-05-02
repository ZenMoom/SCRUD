package com.barcoder.scrud.global.common.exception;

import com.barcoder.scrud.global.common.error.BaseErrorCode;

public class ExceptionHandler extends BaseException {

    public ExceptionHandler(BaseErrorCode errorCode) {
        super(errorCode);
    }
}