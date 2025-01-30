import random from 'math-random';

export default function uniqueId(): string {
  return random().toString(36).substr(2);
}
