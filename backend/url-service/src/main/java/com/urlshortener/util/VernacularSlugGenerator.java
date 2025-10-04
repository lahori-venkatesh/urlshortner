package com.urlshortener.util;

import org.springframework.stereotype.Component;
import java.util.*;
import java.util.regex.Pattern;

@Component
public class VernacularSlugGenerator {
    
    // Hindi transliteration mapping
    private static final Map<String, String> HINDI_TRANSLITERATION = Map.of(
        "offer", "ऑफर",
        "sale", "सेल", 
        "discount", "छूट",
        "free", "मुफ्त",
        "new", "नया",
        "best", "बेस्ट",
        "deal", "डील",
        "shop", "दुकान",
        "buy", "खरीदें",
        "get", "पाएं"
    );
    
    // Telugu transliteration mapping
    private static final Map<String, String> TELUGU_TRANSLITERATION = Map.of(
        "offer", "ఆఫర్",
        "sale", "సేల్",
        "discount", "తగ్గింపు",
        "free", "ఉచితం",
        "new", "కొత్త",
        "best", "బెస్ట్",
        "deal", "డీల్",
        "shop", "దుకాణం",
        "buy", "కొనండి",
        "get", "పొందండి"
    );
    
    // Tamil transliteration mapping
    private static final Map<String, String> TAMIL_TRANSLITERATION = Map.of(
        "offer", "ஆஃபர்",
        "sale", "விற்பனை",
        "discount", "தள்ளுபடி",
        "free", "இலவசம்",
        "new", "புதிய",
        "best", "சிறந்த",
        "deal", "டீல்",
        "shop", "கடை",
        "buy", "வாங்க",
        "get", "பெற"
    );
    
    // Marathi transliteration mapping
    private static final Map<String, String> MARATHI_TRANSLITERATION = Map.of(
        "offer", "ऑफर",
        "sale", "विक्री",
        "discount", "सूट",
        "free", "मोफत",
        "new", "नवीन",
        "best", "सर्वोत्तम",
        "deal", "डील",
        "shop", "दुकान",
        "buy", "खरेदी",
        "get", "मिळवा"
    );
    
    private static final Map<String, Map<String, String>> LANGUAGE_MAPPINGS = Map.of(
        "hi", HINDI_TRANSLITERATION,
        "te", TELUGU_TRANSLITERATION,
        "ta", TAMIL_TRANSLITERATION,
        "mr", MARATHI_TRANSLITERATION
    );
    
    public String generateVernacularSlug(String englishText, String languageCode) {
        if (englishText == null || languageCode == null) {
            return englishText;
        }
        
        Map<String, String> transliterationMap = LANGUAGE_MAPPINGS.get(languageCode.toLowerCase());
        if (transliterationMap == null) {
            return englishText; // Return original if language not supported
        }
        
        String[] words = englishText.toLowerCase().split("[\\s-_]+");
        StringBuilder vernacularSlug = new StringBuilder();
        
        for (int i = 0; i < words.length; i++) {
            String word = words[i];
            String transliterated = transliterationMap.getOrDefault(word, word);
            vernacularSlug.append(transliterated);
            
            if (i < words.length - 1) {
                vernacularSlug.append("-");
            }
        }
        
        return vernacularSlug.toString();
    }
    
    public List<String> getSuggestedSlugs(String originalUrl, String languageCode) {
        List<String> suggestions = new ArrayList<>();
        
        // Extract keywords from URL
        String[] urlParts = originalUrl.toLowerCase().split("[/?&=]");
        Set<String> keywords = new HashSet<>();
        
        for (String part : urlParts) {
            if (part.length() > 2 && !part.matches("\\d+")) {
                keywords.add(part);
            }
        }
        
        // Generate vernacular suggestions
        Map<String, String> transliterationMap = LANGUAGE_MAPPINGS.get(languageCode);
        if (transliterationMap != null) {
            for (String keyword : keywords) {
                if (transliterationMap.containsKey(keyword)) {
                    suggestions.add(generateVernacularSlug(keyword, languageCode));
                }
            }
        }
        
        // Add some common business terms
        suggestions.add(generateVernacularSlug("offer", languageCode));
        suggestions.add(generateVernacularSlug("sale", languageCode));
        suggestions.add(generateVernacularSlug("new deal", languageCode));
        
        return suggestions.stream().distinct().limit(5).toList();
    }
    
    public boolean isVernacularText(String text) {
        if (text == null) return false;
        
        // Check for Devanagari (Hindi/Marathi)
        if (Pattern.matches(".*[\\u0900-\\u097F].*", text)) return true;
        
        // Check for Telugu
        if (Pattern.matches(".*[\\u0C00-\\u0C7F].*", text)) return true;
        
        // Check for Tamil
        if (Pattern.matches(".*[\\u0B80-\\u0BFF].*", text)) return true;
        
        return false;
    }
}