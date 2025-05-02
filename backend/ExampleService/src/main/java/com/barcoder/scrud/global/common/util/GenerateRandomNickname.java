package com.barcoder.scrud.global.common.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

public class GenerateRandomNickname {

    public static String generateRandomNickname() {
        List<String> adjectives = List.of(
                "귀여운", "멋진", "사나운", "따뜻한", "신비로운", "용감한", "씩씩한", "고요한",
                "활발한", "차가운", "재빠른", "부드러운", "즐거운", "우아한", "소중한", "당당한",
                "화려한", "지혜로운", "친절한", "든든한", "다정한", "수줍은", "기발한", "영리한", "게으른",
                "심심한", "싱싱한", "맛있는", "신나는", "표독한", "명인", "못된", "시원한"
        );

        List<String> animals = List.of(
                "호랑이", "여우", "강아지", "고양이", "곰", "토끼", "늑대", "사자", "표범",
                "판다", "치타", "코끼리", "수달", "고슴도치", "부엉이", "오리", "다람쥐", "올빼미",
                "비버", "햄스터", "너구리", "펭귄", "돌고래", "사슴", "원숭이", "코알라", "두더지",
                "나무늘보", "오리너구리", "청룡", "주작", "백호", "현무", "오소리", "북극곰", "사막여우",
                "바다표범", "쌀알알이"
        );

        Random random = new Random();
        String adjective = adjectives.get(random.nextInt(adjectives.size()));
        String animal = animals.get(random.nextInt(animals.size()));

        // 현재 날짜 타임스탬프 추가 (yyyyMMddHHmm)
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"));

        return adjective + animal + timestamp;
    }

}