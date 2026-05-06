// src/utils/passwordGenerator.ts

/**
 * Generates a random password in the format: XXX XXX XXX
 * Where X is a random uppercase letter
 * Example: WYT QDG UXC
 */
export function generateRandomPassword(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const groups = [];
  
  for (let i = 0; i < 3; i++) {
    let group = '';
    for (let j = 0; j < 3; j++) {
      group += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    groups.push(group);
  }
  
  return groups.join(' ');
}

/**
 * Copies text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    }
  } catch (error) {
    console.error('Failed to copy text: ', error);
    return false;
  }
}
