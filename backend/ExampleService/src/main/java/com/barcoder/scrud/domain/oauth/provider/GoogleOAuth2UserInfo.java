package com.barcoder.scrud.domain.oauth.provider;

import lombok.EqualsAndHashCode;

import java.util.Map;

@EqualsAndHashCode()
public class GoogleOAuth2UserInfo {

    public Map<String, Object> attributes;

    public GoogleOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public String getAttribute(String code) {
        return (String) attributes.get(code);
    }

    public String getEmail() {
        return getAttribute("email");
    }

    public String getImageUrl() {
        return getAttribute("picture");
    }
}
