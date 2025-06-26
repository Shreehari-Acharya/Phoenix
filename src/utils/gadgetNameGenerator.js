const adjectives = [
  'silent', 'shadow', 'ghost', 'blazing', 'crimson', 'mighty',
  'phantom', 'steel', 'night', 'frost', 'vengeful', 'stormy',
  'lone', 'silver', 'venomous', 'arcane'
];

const nouns = [
  'falcon', 'panther', 'hawk', 'blade', 'dagger', 'raven',
  'phantom', 'vigil', 'hound', 'knight', 'serpent', 'phantasm',
  'warden', 'prowler', 'sting', 'sentinel'
];

/**
 * Generates a random gadget name in the format "the-adjective-noun".
 * The adjective and noun are randomly selected from predefined lists.
 * @returns {string} - A string representing the gadget name.
 * @example
 * // generateGadgetName()
 * // Returns a string like "the-silent-falcon" or "the-blazing-serpent"
 */
export function generateGadgetName() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `the-${adjective}-${noun}`;
}