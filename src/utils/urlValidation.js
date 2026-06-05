const BLOCKED_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
const PRIVATE_IP_PATTERNS = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
];

const isPrivateHostname = (hostname) => (
  BLOCKED_HOSTNAMES.has(hostname)
  || PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname))
);

const isAllowedDomain = (hostname, allowedDomains) => {
  if (allowedDomains.length === 0) return true;

  return allowedDomains.some((domain) => (
    hostname === domain || hostname.endsWith(`.${domain}`)
  ));
};

export const normalizeOptionalHttpsUrl = (value, { label = 'URL', allowedDomains = [] } = {}) => {
  const trimmedValue = String(value || '').trim();
  if (!trimmedValue) return '';

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedValue);
  } catch (error) {
    throw new Error(`${label} harus berupa URL yang valid.`);
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (parsedUrl.protocol !== 'https:') {
    throw new Error(`${label} wajib menggunakan HTTPS.`);
  }

  if (isPrivateHostname(hostname)) {
    throw new Error(`${label} tidak boleh mengarah ke alamat lokal/internal.`);
  }

  if (!isAllowedDomain(hostname, allowedDomains)) {
    throw new Error(`${label} harus menggunakan domain resmi platform terkait.`);
  }

  parsedUrl.hash = '';
  return parsedUrl.toString();
};
