package com.barcoder.scrud.global.config.webClient;

import io.netty.channel.ChannelOption;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import reactor.netty.transport.logging.AdvancedByteBufFormat;

import java.util.concurrent.TimeUnit;

@Slf4j
@Configuration
public class WebClientConfig {

    // 타임아웃 설정값 (밀리초/초 단위)
    private static final int CONNECT_TIMEOUT_MILLIS = 1000 * 60 * 5;
    private static final int READ_TIMEOUT_SECONDS = 60 * 5;
    private static final int WRITE_TIMEOUT_SECONDS = 60 * 5;

    // baseUrl 설정
    @Value("${webclient.base_url}")
    private String BASE_URL;

    @Bean
    public WebClient webClient() {
        // Netty 기반 HttpClient 생성 (타임아웃 설정 포함)
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, CONNECT_TIMEOUT_MILLIS) // 연결 타임아웃 설정
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(READ_TIMEOUT_SECONDS, TimeUnit.SECONDS)) // 읽기 타임아웃
                        .addHandlerLast(new WriteTimeoutHandler(WRITE_TIMEOUT_SECONDS, TimeUnit.SECONDS)) // 쓰기 타임아웃
                )
                .wiretap("reactor.netty.client.HttpClient",
                        LogLevel.DEBUG, // 로그 레벨: DEBUG
                        AdvancedByteBufFormat.TEXTUAL); // 요청/응답 본문까지 로깅

        // WebClient 빌더
        return WebClient.builder()
                .baseUrl(BASE_URL) // [기본 baseUrl 설정]
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE) // [기본 Content-Type: application/json]
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)       // [기본 Accept: application/json]
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .exchangeStrategies(ExchangeStrategies.builder()    // [바디 크기 설정]
                        .codecs(configurer -> configurer
                                .defaultCodecs()
                                .maxInMemorySize(16 * 1024 * 1024)) // 16MB
                        .build())
                .filter(logRequest())    // [요청 로그 필터]
                .filter(logResponse())   // [응답 로그 필터]
                .build();
    }

    // 요청 로그 출력 필터
    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            log.info("[WebClient] Request: {} {}", clientRequest.method(), clientRequest.url());
            clientRequest.headers()
                    .forEach((name, values) -> values.forEach(value -> log.debug("{}: {}", name, value)));
            return reactor.core.publisher.Mono.just(clientRequest);
        });
    }

    // 응답 로그 출력 필터
    private ExchangeFilterFunction logResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(clientResponse -> {
            log.info("[WebClient] Response Status: {}", clientResponse.statusCode());
            return reactor.core.publisher.Mono.just(clientResponse);
        });
    }


}
