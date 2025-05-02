package com.barcoder.scrud.global.config.security;

import com.barcoder.scrud.global.config.properties.SecurityProperties;
import com.barcoder.scrud.oauth.service.CustomOAuth2UserService;
import com.barcoder.scrud.oauth.service.OAuth2AuthenticationFailureHandler;
import com.barcoder.scrud.oauth.service.OAuth2AuthenticationSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import java.util.List;
import java.util.stream.Stream;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    private final SecurityProperties securityProperties;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
        throws Exception {
        http
            .authorizeHttpRequests(authorizationManager -> authorizationManager
                // 인증, 인가가 필요없는 url 허용
                .requestMatchers(toRequestMatcher(securityProperties.getRequestMatchers())).permitAll()
                .anyRequest().authenticated())
            // OAuth 관련
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService))
                .successHandler(oAuth2AuthenticationSuccessHandler)
                .failureHandler(oAuth2AuthenticationFailureHandler)
            );

        return http.build();
    }

    /**
     * yml에 있는 url과 method 정보를 분리하여 RequestMatcher로 변환
     *
     * @param urlMethods yml에 있는 인증, 인가가 필요없는 엔드포인트
     * @return RequestMatcher[] 반환
     */
    private RequestMatcher[] toRequestMatcher(List<String> urlMethods) {

        return urlMethods.stream()
            .flatMap(entry -> {
                String[] parts = entry.split(":");
                String url = parts[0].trim();
                String[] methods = parts[1].split("\\s*,\\s*"); // ',' 또는 ', ' 구분 가능

                return Stream.of(methods)
                    // AntPathRequestMatcher -> spring security에서 제공, 와일드카드 사용 가능
                    .map(method -> new AntPathRequestMatcher(url, method.trim()));
            })
            .toArray(RequestMatcher[]::new);
    }
}
