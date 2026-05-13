import * as cheerio from 'cheerio';

/**
 * Sanitizes article HTML content for Flutter rendering.
 * - Resolves lazy-loaded images (data-src → src)
 * - Removes fixed width/height for responsive display
 * - Strips srcset to avoid Flutter parsing issues
 * - Removes embedded iframes/blockquotes that won't render
 * - Adds responsive inline styles to images
 * - Cleans up noscript duplicate images
 */
export function sanitizeContentForFlutter(html: string): string {
  if (!html) return '';

  const $ = cheerio.load(html, { xmlMode: false }, false);

  // Remove noscript tags (they contain duplicate images for non-JS browsers)
  $('noscript').remove();

  // Remove embedded content that won't render in Flutter
  $('iframe, embed, object').remove();
  $('.wp-block-embed').remove();
  $('script, style').remove();

  // Process all images
  $('img').each((_, el) => {
    const $img = $(el);

    // Resolve lazy-loaded: data-src → src
    const dataSrc = $img.attr('data-src');
    if (dataSrc) {
      $img.attr('src', dataSrc);
      $img.removeAttr('data-src');
    }

    // Remove placeholder base64 GIFs
    const src = $img.attr('src') || '';
    if (src.startsWith('data:image/gif')) {
      // If we couldn't resolve a real src, remove the image
      $img.remove();
      return;
    }

    // Remove fixed dimensions for responsive layout
    $img.removeAttr('width');
    $img.removeAttr('height');
    $img.removeAttr('srcset');
    $img.removeAttr('sizes');
    $img.removeAttr('data-lazyloaded');
    $img.removeAttr('data-srcset');
    $img.removeAttr('data-sizes');
    $img.removeAttr('data-img-url');
    $img.removeAttr('loading');
    $img.removeAttr('decoding');

    // Add responsive style
    $img.attr('style', 'max-width:100%;height:auto;border-radius:8px;');
  });

  // Clean up figures for consistent styling
  $('figure').each((_, el) => {
    const $fig = $(el);
    $fig.removeAttr('class');
    $fig.attr('style', 'margin:12px 0;text-align:center;');
  });

  // Style figcaptions
  $('figcaption').each((_, el) => {
    const $cap = $(el);
    $cap.removeAttr('class');
    $cap.attr('style', 'font-size:12px;color:#888;margin-top:4px;text-align:center;');
  });

  return $.html();
}
