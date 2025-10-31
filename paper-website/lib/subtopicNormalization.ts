/**
 * Normalizes subtopics by removing trailing periods, standardizing case, and cleaning whitespace
 * @param subtopic - The raw subtopic string
 * @returns The normalized subtopic string
 */
export function normalizeSubtopic(subtopic: string): string {
  if (!subtopic) return '';

  return subtopic
    .trim()
    .replace(/\.$/, '') // Remove trailing period
    .replace(/\s+/g, ' ') // Normalize whitespace
    .toLowerCase();
}

/**
 * Gets the display version of a subtopic (properly capitalized)
 * @param subtopic - The raw subtopic string
 * @returns The display version of the subtopic
 */
export function getDisplaySubtopic(subtopic: string): string {
  if (!subtopic) return '';

  const normalized = normalizeSubtopic(subtopic);

  // Special cases for proper capitalization
  const specialCases: { [key: string]: string } = {
    'alu, data-path and control unit': 'ALU, Data-path and Control Unit',
    'cpu and i/o scheduling': 'CPU and I/O Scheduling',
    'i/o interface (interrupt and dma mode)': 'I/O Interface (Interrupt and DMA Mode)',
    'er-model': 'ER-model',
    'dns': 'DNS',
    'smtp': 'SMTP',
    'http': 'HTTP',
    'ftp': 'FTP',
    'tcp': 'TCP',
    'udp': 'UDP',
    'sql': 'SQL',
    'ip': 'IP',
    'cidr': 'CIDR',
    'arp': 'ARP',
    'dhcp': 'DHCP',
    'icmp': 'ICMP',
    'nat': 'NAT',
    'osi': 'OSI',
    'api': 'API',
    'url': 'URL',
    'html': 'HTML',
    'css': 'CSS',
    'xml': 'XML',
    'json': 'JSON',
    'pdf': 'PDF',
    'cpu': 'CPU',
    'gpu': 'GPU',
    'ram': 'RAM',
    'rom': 'ROM',
    'usb': 'USB',
    'dma': 'DMA',
    'alu': 'ALU',
    'gcc': 'GCC',
    'llvm': 'LLVM',
  };

  // Check if the normalized version matches any special case
  if (specialCases[normalized]) {
    return specialCases[normalized];
  }

  // Otherwise, capitalize each word
  return normalized
    .split(' ')
    .map(word => {
      // Don't capitalize common prepositions, articles, and conjunctions unless they're first word
      const lowercaseWords = ['and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'the', 'a', 'an'];
      if (lowercaseWords.includes(word) && word !== normalized.split(' ')[0]) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Creates a mapping from original subtopics to their normalized versions
 * @param subtopics - Array of subtopic strings
 * @returns Object mapping original subtopics to normalized versions
 */
export function createSubtopicMapping(subtopics: string[]): { [original: string]: string } {
  const mapping: { [original: string]: string } = {};

  subtopics.forEach(subtopic => {
    const normalized = normalizeSubtopic(subtopic);
    mapping[subtopic] = normalized;
  });

  return mapping;
}

/**
 * Gets unique subtopics from an array, using normalized versions for uniqueness
 * @param subtopics - Array of subtopic strings
 * @returns Array of unique display subtopics
 */
export function getUniqueSubtopics(subtopics: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  subtopics.forEach(subtopic => {
    const normalized = normalizeSubtopic(subtopic);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(getDisplaySubtopic(subtopic));
    }
  });

  return unique.sort();
}
