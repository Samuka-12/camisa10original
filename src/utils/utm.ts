export const getUrlWithUtm = (url: string): string => {
  try {
    const isAbsolute = url.startsWith('http://') || url.startsWith('https://');
    const targetUrl = new URL(url, window.location.origin);
    const currentParams = new URLSearchParams(window.location.search);

    currentParams.forEach((value, key) => {
      // Append if the target URL doesn't already have this parameter
      if (!targetUrl.searchParams.has(key)) {
        targetUrl.searchParams.append(key, value);
      }
    });

    return isAbsolute ? targetUrl.toString() : targetUrl.pathname + targetUrl.search;
  } catch (error) {
    console.error('Error appending tracking parameters:', error);
    return url;
  }
};
