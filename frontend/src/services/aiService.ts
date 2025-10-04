// AI Service for Smart Alias Suggestions and URL Analysis
export interface AliasSuggestion {
  alias: string;
  score: number;
  reason: string;
  category: 'seo' | 'memorable' | 'branded' | 'descriptive';
}

export interface URLAnalysis {
  title?: string;
  description?: string;
  keywords: string[];
  domain: string;
  isSecure: boolean;
  category: string;
}

export interface SecurityCheck {
  isSpam: boolean;
  riskScore: number;
  reasons: string[];
  isPhishing: boolean;
  isMalware: boolean;
}

class AIService {
  private readonly API_BASE = process.env.REACT_APP_AI_API_URL || 'http://localhost:3003';

  // Simulate AI-powered alias suggestions (in production, this would call an AI API)
  async generateAliasSuggestions(url: string, context?: string): Promise<AliasSuggestion[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const analysis = await this.analyzeURL(url);
      const suggestions: AliasSuggestion[] = [];

      // Generate different types of suggestions
      suggestions.push(...this.generateSEOSuggestions(analysis));
      suggestions.push(...this.generateMemorableSuggestions(analysis));
      suggestions.push(...this.generateBrandedSuggestions(analysis));
      suggestions.push(...this.generateDescriptiveSuggestions(analysis));

      // Sort by score and return top 8
      return suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

    } catch (error) {
      console.error('Failed to generate alias suggestions:', error);
      return this.getFallbackSuggestions();
    }
  }

  private async analyzeURL(url: string): Promise<URLAnalysis> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      // Extract potential keywords from URL
      const pathKeywords = urlObj.pathname
        .split('/')
        .filter(segment => segment.length > 2)
        .map(segment => segment.replace(/[^a-zA-Z0-9]/g, ''))
        .filter(segment => segment.length > 0);

      const searchParams = Array.from(urlObj.searchParams.keys());
      
      // Simulate content analysis (in production, this would scrape the page)
      const keywords = [
        ...pathKeywords,
        ...searchParams,
        ...this.extractDomainKeywords(domain)
      ].slice(0, 10);

      return {
        domain,
        keywords,
        isSecure: urlObj.protocol === 'https:',
        category: this.categorizeURL(url),
        title: this.generateTitleFromURL(url),
        description: `Content from ${domain}`
      };

    } catch (error) {
      return {
        domain: 'unknown',
        keywords: [],
        isSecure: false,
        category: 'general'
      };
    }
  }

  private generateSEOSuggestions(analysis: URLAnalysis): AliasSuggestion[] {
    const suggestions: AliasSuggestion[] = [];
    
    // Use domain name
    if (analysis.domain && analysis.domain !== 'unknown') {
      const domainParts = analysis.domain.split('.');
      const mainDomain = domainParts[0];
      
      if (mainDomain.length <= 8) {
        suggestions.push({
          alias: mainDomain,
          score: 85,
          reason: 'Brand recognition using domain name',
          category: 'seo'
        });
      }
    }

    // Use keywords
    analysis.keywords.forEach(keyword => {
      if (keyword.length >= 3 && keyword.length <= 8) {
        suggestions.push({
          alias: keyword.toLowerCase(),
          score: 75,
          reason: 'SEO-friendly keyword from URL',
          category: 'seo'
        });
      }
    });

    return suggestions;
  }

  private generateMemorableSuggestions(analysis: URLAnalysis): AliasSuggestion[] {
    const suggestions: AliasSuggestion[] = [];
    
    // Generate short, catchy aliases
    const memorablePatterns = [
      'go', 'get', 'see', 'try', 'use', 'buy', 'win', 'new'
    ];

    memorablePatterns.forEach(pattern => {
      if (analysis.keywords.length > 0) {
        const keyword = analysis.keywords[0].substring(0, 4);
        suggestions.push({
          alias: pattern + keyword,
          score: 70,
          reason: 'Memorable action word + keyword',
          category: 'memorable'
        });
      }
    });

    // Generate rhyming or alliterative suggestions
    if (analysis.domain && analysis.domain.length > 0) {
      const firstLetter = analysis.domain[0].toLowerCase();
      const rhymingWords = this.getRhymingWords(firstLetter);
      
      rhymingWords.forEach(word => {
        suggestions.push({
          alias: word + analysis.domain.substring(0, 3),
          score: 65,
          reason: 'Alliterative and memorable',
          category: 'memorable'
        });
      });
    }

    return suggestions;
  }

  private generateBrandedSuggestions(analysis: URLAnalysis): AliasSuggestion[] {
    const suggestions: AliasSuggestion[] = [];
    
    if (analysis.domain && analysis.domain !== 'unknown') {
      const domain = analysis.domain.replace(/[^a-zA-Z0-9]/g, '');
      
      // Generate branded variations
      const brandedPatterns = [
        domain.substring(0, 4) + '2024',
        domain.substring(0, 3) + 'pro',
        domain.substring(0, 4) + 'app',
        'my' + domain.substring(0, 4),
        domain.substring(0, 3) + 'hub'
      ];

      brandedPatterns.forEach(pattern => {
        if (pattern.length <= 8) {
          suggestions.push({
            alias: pattern.toLowerCase(),
            score: 80,
            reason: 'Branded variation of domain',
            category: 'branded'
          });
        }
      });
    }

    return suggestions;
  }

  private generateDescriptiveSuggestions(analysis: URLAnalysis): AliasSuggestion[] {
    const suggestions: AliasSuggestion[] = [];
    
    // Category-based suggestions
    const categoryAliases = {
      'ecommerce': ['shop', 'store', 'buy', 'deal'],
      'blog': ['read', 'post', 'blog', 'news'],
      'social': ['share', 'connect', 'social', 'meet'],
      'business': ['biz', 'corp', 'pro', 'work'],
      'tech': ['tech', 'app', 'code', 'dev'],
      'general': ['link', 'page', 'site', 'web']
    };

    const aliases = categoryAliases[analysis.category as keyof typeof categoryAliases] || categoryAliases.general;
    
    aliases.forEach(alias => {
      suggestions.push({
        alias: alias + Math.floor(Math.random() * 99),
        score: 60,
        reason: `Descriptive alias for ${analysis.category} content`,
        category: 'descriptive'
      });
    });

    return suggestions;
  }

  private categorizeURL(url: string): string {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('shop') || urlLower.includes('store') || urlLower.includes('buy')) {
      return 'ecommerce';
    }
    if (urlLower.includes('blog') || urlLower.includes('article') || urlLower.includes('news')) {
      return 'blog';
    }
    if (urlLower.includes('facebook') || urlLower.includes('twitter') || urlLower.includes('instagram')) {
      return 'social';
    }
    if (urlLower.includes('github') || urlLower.includes('app') || urlLower.includes('api')) {
      return 'tech';
    }
    if (urlLower.includes('company') || urlLower.includes('business') || urlLower.includes('corp')) {
      return 'business';
    }
    
    return 'general';
  }

  private extractDomainKeywords(domain: string): string[] {
    // Common domain patterns to extract meaningful keywords
    const keywords: string[] = [];
    
    // Remove common TLDs and subdomains
    const cleanDomain = domain
      .replace(/\.(com|org|net|edu|gov|io|co|app|dev)$/, '')
      .replace(/^(www|app|api|blog|shop|store)\./, '');
    
    // Split camelCase and hyphenated words
    const parts = cleanDomain
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .split(/[-_]/)
      .filter(part => part.length > 2);
    
    keywords.push(...parts);
    
    return keywords;
  }

  private generateTitleFromURL(url: string): string {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      const path = urlObj.pathname.replace(/\/$/, '');
      
      if (path && path !== '/') {
        const lastSegment = path.split('/').pop() || '';
        return lastSegment.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      
      return domain.split('.')[0].replace(/\b\w/g, l => l.toUpperCase());
    } catch {
      return 'Untitled';
    }
  }

  private getRhymingWords(letter: string): string[] {
    const rhymingMap: { [key: string]: string[] } = {
      'a': ['ace', 'app', 'art'],
      'b': ['bee', 'buy', 'big'],
      'c': ['see', 'cool', 'code'],
      'd': ['do', 'dev', 'deal'],
      'e': ['easy', 'epic', 'edge'],
      'f': ['fun', 'fast', 'free'],
      'g': ['go', 'get', 'good'],
      'h': ['hub', 'hot', 'hit'],
      'i': ['ice', 'info', 'idea'],
      'j': ['joy', 'jump', 'join'],
      'k': ['key', 'keep', 'kind'],
      'l': ['link', 'live', 'love'],
      'm': ['my', 'make', 'more'],
      'n': ['new', 'now', 'next'],
      'o': ['one', 'open', 'our'],
      'p': ['pro', 'page', 'plus'],
      'q': ['quick', 'quiz', 'quest'],
      'r': ['run', 'real', 'read'],
      's': ['see', 'shop', 'site'],
      't': ['top', 'try', 'tech'],
      'u': ['use', 'user', 'up'],
      'v': ['view', 'visit', 'via'],
      'w': ['web', 'win', 'work'],
      'x': ['x', 'xtra', 'xml'],
      'y': ['yes', 'you', 'your'],
      'z': ['zip', 'zone', 'zero']
    };

    return rhymingMap[letter] || ['link', 'page', 'site'];
  }

  private getFallbackSuggestions(): AliasSuggestion[] {
    return [
      { alias: 'link' + Math.floor(Math.random() * 999), score: 50, reason: 'Random fallback', category: 'descriptive' },
      { alias: 'page' + Math.floor(Math.random() * 999), score: 50, reason: 'Random fallback', category: 'descriptive' },
      { alias: 'site' + Math.floor(Math.random() * 999), score: 50, reason: 'Random fallback', category: 'descriptive' },
      { alias: 'web' + Math.floor(Math.random() * 999), score: 50, reason: 'Random fallback', category: 'descriptive' }
    ];
  }

  // Security check simulation
  async checkURLSecurity(url: string): Promise<SecurityCheck> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      
      // Simple security checks (in production, use real security APIs)
      const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'short.link'];
      const phishingKeywords = ['login', 'verify', 'account', 'suspended', 'urgent'];
      const malwareExtensions = ['.exe', '.scr', '.bat', '.com'];
      
      let riskScore = 0;
      const reasons: string[] = [];
      let isPhishing = false;
      let isMalware = false;

      // Check for suspicious domains
      if (suspiciousDomains.some(d => domain.includes(d))) {
        riskScore += 30;
        reasons.push('URL uses a known URL shortener');
      }

      // Check for phishing indicators
      const urlText = url.toLowerCase();
      const phishingMatches = phishingKeywords.filter(keyword => urlText.includes(keyword));
      if (phishingMatches.length > 0) {
        riskScore += phishingMatches.length * 20;
        isPhishing = true;
        reasons.push(`Contains phishing keywords: ${phishingMatches.join(', ')}`);
      }

      // Check for malware indicators
      if (malwareExtensions.some(ext => url.toLowerCase().includes(ext))) {
        riskScore += 50;
        isMalware = true;
        reasons.push('URL points to potentially dangerous file type');
      }

      // Check HTTPS
      if (!url.startsWith('https://')) {
        riskScore += 10;
        reasons.push('URL is not using secure HTTPS protocol');
      }

      // Check for suspicious URL patterns
      if (url.includes('..') || url.includes('//') || url.match(/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/)) {
        riskScore += 25;
        reasons.push('URL contains suspicious patterns');
      }

      return {
        isSpam: riskScore > 50,
        riskScore: Math.min(riskScore, 100),
        reasons,
        isPhishing,
        isMalware
      };

    } catch (error) {
      return {
        isSpam: false,
        riskScore: 0,
        reasons: ['Unable to analyze URL'],
        isPhishing: false,
        isMalware: false
      };
    }
  }

  // Predict click-through rate based on URL characteristics
  async predictCTR(url: string): Promise<number> {
    try {
      const analysis = await this.analyzeURL(url);
      let ctrScore = 0.5; // Base CTR of 50%

      // Adjust based on domain authority (simulated)
      if (analysis.domain.includes('google') || analysis.domain.includes('youtube')) {
        ctrScore += 0.3;
      } else if (analysis.domain.includes('facebook') || analysis.domain.includes('twitter')) {
        ctrScore += 0.2;
      }

      // Adjust based on HTTPS
      if (analysis.isSecure) {
        ctrScore += 0.1;
      }

      // Adjust based on URL length
      if (url.length < 50) {
        ctrScore += 0.1;
      } else if (url.length > 100) {
        ctrScore -= 0.1;
      }

      // Adjust based on category
      const categoryMultipliers = {
        'ecommerce': 1.2,
        'social': 1.1,
        'tech': 0.9,
        'blog': 0.8,
        'business': 0.7,
        'general': 1.0
      };

      ctrScore *= categoryMultipliers[analysis.category as keyof typeof categoryMultipliers] || 1.0;

      return Math.max(0.1, Math.min(0.95, ctrScore));

    } catch (error) {
      return 0.5; // Default CTR
    }
  }
}

export const aiService = new AIService();