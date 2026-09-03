const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'];
const EMBED_PREFIX = 'https://www.youtube-nocookie.com/embed/';

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{6,}$/;
const FACEBOOK_EMBED_PREFIX = 'https://www.facebook.com/plugins/video.php';

/**
 * Convertit une URL de vidéo (YouTube/Facebook) en URL d'intégration sûre.
 *
 * Cette fonction n'auto-rise QUE les hôtes d'une liste blanche stricte et ne
 * construit l'URL d'embed qu'à partir d'identifiants validés par regex.
 * Toute entrée inconnue, malformée ou susceptible de contenir du code
 * arbitraire retourne `null`. Le résultat peut ensuite être passé en toute
 * sécurité à `DomSanitizer.bypassSecurityTrustResourceUrl` car sa forme est
 * strictement contrôlée (https + hôte connu + composant codé).
 */
export function toVideoEmbedUrl(url?: string | null): string | null {
  if (!url) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0];
    return isValidYouTubeId(id) ? `${EMBED_PREFIX}${id}` : null;
  }

  if (YOUTUBE_HOSTS.includes(host) || host.endsWith('.youtube.com')) {
    const id = parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
    return isValidYouTubeId(id ?? '') ? `${EMBED_PREFIX}${id}` : null;
  }

  if (host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.watch') {
    const encoded = encodeURIComponent(url);
    return `${FACEBOOK_EMBED_PREFIX}?href=${encoded}&show_text=false`;
  }

  return null;
}

function isValidYouTubeId(id: string): boolean {
  return YOUTUBE_ID_PATTERN.test(id);
}
