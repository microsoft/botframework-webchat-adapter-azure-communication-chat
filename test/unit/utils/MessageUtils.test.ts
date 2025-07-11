import { isChatMessageTypeSupported } from '../../../src/utils/MessageUtils';

describe('isChatMessageTypeSupported', () => {
  test('should return true for supported message type "text"', () => {
    expect(isChatMessageTypeSupported('text')).toBe(true);
  });

  test('should return true for supported message type "participantAdded"', () => {
    expect(isChatMessageTypeSupported('participantAdded')).toBe(true);
  });

  test('should return true for supported message type "participantRemoved"', () => {
    expect(isChatMessageTypeSupported('participantRemoved')).toBe(true);
  });

  test('should return false for unsupported message type "html"', () => {
    expect(isChatMessageTypeSupported('html')).toBe(false);
  });

  test('should return false for unsupported message type "topicUpdated"', () => {
    expect(isChatMessageTypeSupported('topicUpdated')).toBe(false);
  });
});
