// Ad settings shared by the ad slots and the cookie banner (see AdPlaceholder for details).
export const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
export const USE_SITE_BANNER = import.meta.env.VITE_ADSENSE_CMP === 'site';
