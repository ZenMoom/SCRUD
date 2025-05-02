package com.barcoder.scrud.global.common.util;

import com.barcoder.scrud.global.common.error.ErrorStatus;
import com.barcoder.scrud.user.domain.entity.Token;
import com.barcoder.scrud.user.domain.entity.User;
import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.*;

@Component
@Slf4j
public class JWTUtil {
    //
    @Value("#{${jwt.access-token.expiretime} * 60 * 1000}")
    private int tokenExpireTime;

    @Value("${jwt.secret-key}")
    private String secretKey;

    // 토큰 발행해주기
    public Token createAccessToken(User user) {
        return Token.builder()
                .accessToken(
                        create(user, tokenExpireTime)
                )
                .build();
    }

    // 토큰에서 사용자 Id 추출
    public UUID getUserId(String header) {
        String token = getToken(header);
        Jws<Claims> claims = getClaimsJws(token);

        Map<String, Object> value = claims.getPayload();
        log.info("getUserId value : {}", value);

        return UUID.fromString(value.get("id").toString());
    }

    public void checkTokenValidation(String header) {
        if (header == null) throw new ExceptionHandler(ErrorStatus.TOKEN_NOT_FOUND);
        String token = getToken(header);
        log.info("Validating token: {}", token);
        try {
            Jws<Claims> claimsJws = getClaimsJws(token);
            log.info("Token validation successful");
            claimsJws.getPayload().forEach((key1, value1) -> log.info("key : {}, value : {}", key1, value1));
        } catch (Exception e) {
            log.error("Token validation failed: {}", e.getMessage(), e);
            throw e;
        }
    }

    // 토큰 검증
    private static String getToken(String header) {
        StringTokenizer st = new StringTokenizer(header);
        String token = st.nextToken();

        return "Bearer".equals(token) ? st.nextToken() : token;
    }

    //	Token 발급
    private String create(User user, long expireTime) {
        SecretKey key = getSecretKey();
        Map<String, String> headers = new HashMap<>();
        headers.put("typ", "JWT");

        String accessToken = Jwts.builder()
                .header()
                .add(headers)
                .and()
                .subject("accessToken")
                .claim("username", user.getUsername()) // 이메일 정보 = 로그인 아이디 를 토큰에 저장
                .claim("id", user.getUserId().toString()) // 사용자 ID 를 토큰에 저장
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expireTime))
                .signWith(key, Jwts.SIG.HS256)
                .compact();

        return accessToken;
    }

    // 토큰 유효성 검사
    private Jws<Claims> getClaimsJws(String token) {
        JwtParser parser = getParser();
        Jws<Claims> claimsJws;
        log.info("토큰 : {}", token);

        try {
            claimsJws = parser.parseSignedClaims(token);
        } catch (Exception e) {
            log.error("토큰이 유효하지 않습니다.");
            ErrorStatus errorStatus = switch (e.getClass().getSimpleName()) {
                case "ExpiredJwtException" -> ErrorStatus.TOKEN_EXPIRED_ERROR;
                case "UnsupportedJwtException" -> ErrorStatus.TOKEN_UNSUPPORTED_ERROR;
                case "MalformedJwtException" -> ErrorStatus.TOKEN_MALFORMED_ERROR;
                case "SignatureException" -> ErrorStatus.TOKEN_SIGNATURE_ERROR;
                case "IllegalArgumentException" -> ErrorStatus.TOKEN_ILLEGAL_ARGUMENT_ERROR;
                default -> ErrorStatus.TOKEN_ERROR; // 알 수 없는 예외 처리
            };
            throw new ExceptionHandler(errorStatus);
        }
        return claimsJws;
    }

    // 시크릿 키 가져오기
    private SecretKey getSecretKey() {
        byte[] secretKeyBytes = Base64.getEncoder().encode(secretKey.getBytes());
        return Keys.hmacShaKeyFor(secretKeyBytes);
    }

    private JwtParser getParser() {
        return Jwts.parser()
                .verifyWith(getSecretKey())
                .build();
    }

}
