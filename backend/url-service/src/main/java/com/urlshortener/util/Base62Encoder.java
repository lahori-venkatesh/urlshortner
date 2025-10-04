package com.urlshortener.util;

import org.springframework.stereotype.Component;

@Component
public class Base62Encoder {
    
    private static final String BASE62_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final int BASE = BASE62_CHARS.length();
    
    public String encode(long number) {
        if (number == 0) {
            return String.valueOf(BASE62_CHARS.charAt(0));
        }
        
        StringBuilder encoded = new StringBuilder();
        while (number > 0) {
            encoded.append(BASE62_CHARS.charAt((int) (number % BASE)));
            number /= BASE;
        }
        
        return encoded.reverse().toString();
    }
    
    public long decode(String encoded) {
        long decoded = 0;
        long power = 1;
        
        for (int i = encoded.length() - 1; i >= 0; i--) {
            char c = encoded.charAt(i);
            int index = BASE62_CHARS.indexOf(c);
            if (index == -1) {
                throw new IllegalArgumentException("Invalid character in encoded string: " + c);
            }
            decoded += index * power;
            power *= BASE;
        }
        
        return decoded;
    }
}