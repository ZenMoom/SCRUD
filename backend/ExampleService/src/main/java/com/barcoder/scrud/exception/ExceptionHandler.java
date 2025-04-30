package com.barcoder.scrud.exception;

import com.barcoder.scrud.base.code.BaseErrorCode;

public class ExceptionHandler extends BaseException {

    public ExceptionHandler(BaseErrorCode errorCode) {
        super(errorCode);
    }
}