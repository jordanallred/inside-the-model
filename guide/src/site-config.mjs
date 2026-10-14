export const DEFAULT_SITE_URL = 'https://insidethemodel.app';
export const siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
export const socialCardUrl = new URL('/social-card.png', siteUrl).href;
export const repoUrl = 'https://github.com/jordanallred/inside-the-model';
