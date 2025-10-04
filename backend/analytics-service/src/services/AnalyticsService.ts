import { ClickEvent, IClickEvent } from '../models/ClickEvent';
import geoip from 'geoip-lite';
import useragent from 'useragent';

export class AnalyticsService {
  
  async recordClick(data: {
    shortCode: string;
    ipAddress: string;
    userAgent: string;
    referer?: string;
    sessionId?: string;
  }): Promise<IClickEvent> {
    
    // Parse user agent
    const agent = useragent.parse(data.userAgent);
    const deviceType = this.getDeviceType(data.userAgent);
    
    // Get geolocation
    const geo = geoip.lookup(data.ipAddress);
    
    // Check if it's a bot
    const isBot = this.isBot(data.userAgent);
    
    const clickEvent = new ClickEvent({
      shortCode: data.shortCode,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      referer: data.referer,
      country: geo?.country || 'Unknown',
      city: geo?.city || 'Unknown',
      device: {
        type: deviceType,
        os: agent.os.toString(),
        browser: agent.toAgent()
      },
      isBot,
      sessionId: data.sessionId
    });
    
    return await clickEvent.save();
  }
  
  async getAnalytics(shortCode: string, timeRange?: string) {
    const matchStage: any = { shortCode, isBot: false };
    
    // Add time range filter
    if (timeRange) {
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // All time
      }
      
      matchStage.timestamp = { $gte: startDate };
    }
    
    const [
      totalClicks,
      uniqueClicks,
      clicksByCountry,
      clicksByDevice,
      clicksByBrowser,
      clicksOverTime,
      topReferrers
    ] = await Promise.all([
      this.getTotalClicks(matchStage),
      this.getUniqueClicks(matchStage),
      this.getClicksByCountry(matchStage),
      this.getClicksByDevice(matchStage),
      this.getClicksByBrowser(matchStage),
      this.getClicksOverTime(matchStage),
      this.getTopReferrers(matchStage)
    ]);
    
    return {
      totalClicks,
      uniqueClicks,
      clicksByCountry,
      clicksByDevice,
      clicksByBrowser,
      clicksOverTime,
      topReferrers
    };
  }
  
  private async getTotalClicks(matchStage: any): Promise<number> {
    const result = await ClickEvent.countDocuments(matchStage);
    return result;
  }
  
  private async getUniqueClicks(matchStage: any): Promise<number> {
    const result = await ClickEvent.aggregate([
      { $match: matchStage },
      { $group: { _id: '$ipAddress' } },
      { $count: 'uniqueClicks' }
    ]);
    
    return result[0]?.uniqueClicks || 0;
  }
  
  private async getClicksByCountry(matchStage: any) {
    return await ClickEvent.aggregate([
      { $match: matchStage },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
  }
  
  private async getClicksByDevice(matchStage: any) {
    return await ClickEvent.aggregate([
      { $match: matchStage },
      { $group: { _id: '$device.type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }
  
  private async getClicksByBrowser(matchStage: any) {
    return await ClickEvent.aggregate([
      { $match: matchStage },
      { $group: { _id: '$device.browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
  }
  
  private async getClicksOverTime(matchStage: any) {
    return await ClickEvent.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
  }
  
  private async getTopReferrers(matchStage: any) {
    return await ClickEvent.aggregate([
      { $match: { ...matchStage, referer: { $exists: true, $ne: null } } },
      { $group: { _id: '$referer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
  }
  
  private getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari')) {
      return 'desktop';
    }
    
    return 'unknown';
  }
  
  private isBot(userAgent: string): boolean {
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper', 'facebook', 'twitter',
      'linkedin', 'whatsapp', 'telegram', 'googlebot', 'bingbot'
    ];
    
    const ua = userAgent.toLowerCase();
    return botPatterns.some(pattern => ua.includes(pattern));
  }
}