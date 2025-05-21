package com.barcoder.scrud.global.config.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;


@Aspect
@Component
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    @Around("execution(* com.barcoder.*.application.service.*.*(..))")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        LocalDateTime startTime = LocalDateTime.now();
        long startMillis = System.currentTimeMillis();

        // 파일명과 메서드명을 추출하여 "파일명.메서드" 형식으로 조합
        String className = joinPoint.getSignature().getDeclaringTypeName();
        String methodName = joinPoint.getSignature().getName();
        String targetIdentifier = className + "." + methodName;

        // 시작 로그 출력
        logger.debug("[Around][START {}] 실행할 메서드: {}", startTime, targetIdentifier);

        Object result = joinPoint.proceed();

        long executionTime = System.currentTimeMillis() - startMillis;
        LocalDateTime endTime = LocalDateTime.now();

        // 종료 로그 출력
        logger.debug("[Around][END {}] 실행한 메서드: {} , 소요시간: {}ms", endTime, targetIdentifier, executionTime);

        return result;
    }
}