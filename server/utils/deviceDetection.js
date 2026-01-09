import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';

/**
 * Get client IP address from request
 * Handles both direct connections and proxies (Cloudflare, nginx, etc.)
 */
export const getClientIP = (req) => {
  // Check common proxy headers first
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, first one is the client
    return forwarded.split(',')[0].trim();
  }

  // Check Cloudflare specific header
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Check other common headers
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  // Fallback to direct connection IP
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
};

/**
 * Get location information from IP address
 */
export const getLocationFromIP = (ip) => {
  try {
    // Clean IP (remove ::ffff: prefix if present)
    const cleanIp = ip.replace('::ffff:', '');
    
    // For localhost/local IPs, return default
    if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp.startsWith('192.168.')) {
      return 'Local Network';
    }

    const geo = geoip.lookup(cleanIp);
    if (geo) {
      const location = [];
      if (geo.city) location.push(geo.city);
      if (geo.region) location.push(geo.region);
      if (geo.country) location.push(geo.country);
      
      return location.length > 0 ? location.join(', ') : 'Unknown Location';
    }

    return 'Unknown Location';
  } catch (error) {
    console.error('Error getting location:', error);
    return 'Unknown Location';
  }
};

/**
 * Parse user agent to get device and browser information
 */
export const getDeviceInfo = (userAgent) => {
  try {
    if (!userAgent) {
      return 'Unknown Device';
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const deviceInfo = [];

    // Browser
    if (result.browser.name) {
      const browser = result.browser.version 
        ? `${result.browser.name} ${result.browser.version.split('.')[0]}`
        : result.browser.name;
      deviceInfo.push(browser);
    }

    // OS
    if (result.os.name) {
      const os = result.os.version
        ? `${result.os.name} ${result.os.version}`
        : result.os.name;
      deviceInfo.push(os);
    }

    // Device type
    if (result.device.type) {
      deviceInfo.push(result.device.type);
    } else if (result.device.vendor || result.device.model) {
      const device = [result.device.vendor, result.device.model].filter(Boolean).join(' ');
      deviceInfo.push(device);
    }

    return deviceInfo.length > 0 ? deviceInfo.join(' on ') : 'Unknown Device';
  } catch (error) {
    console.error('Error parsing user agent:', error);
    return 'Unknown Device';
  }
};

/**
 * Get complete login information (location + device)
 */
export const getLoginInfo = (req) => {
  const ip = getClientIP(req);
  const location = getLocationFromIP(ip);
  const device = getDeviceInfo(req.headers['user-agent']);

  return {
    ip,
    location,
    device,
    timestamp: new Date().toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  };
};
