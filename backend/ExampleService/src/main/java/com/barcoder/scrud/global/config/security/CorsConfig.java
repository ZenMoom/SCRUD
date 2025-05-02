package com.barcoder.scrud.global.config.security;

import com.barcoder.scrud.global.config.properties.CorsProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class CorsConfig implements WebMvcConfigurer {

    private final CorsProperties corsProperties;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // CORS를 적용할 URL 패턴 (여기서는 모든 경로)
            .allowedOriginPatterns(corsProperties.getOrigins())
            .allowedMethods("*") // 허용할 HTTP 메서드 설정 (GET, POST, PUT, DELETE 등)
            .allowedHeaders("*") // 허용할 요청 헤더 설정
            .allowCredentials(true) // 인증 정보 (쿠키, Authorization 헤더) 허용 여부
            .maxAge(3600); // Preflight 요청 결과 캐싱 시간 (초)
    }
}