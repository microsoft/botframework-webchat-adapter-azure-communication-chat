import entries from 'core-js/features/object/entries';

const defaultEventDict = {};
export default function createEvent(type: string, eventInitDict?: { [key: string]: any }): Event {
  if (typeof Event === 'function') {
    return new Event(type, eventInitDict);
  }

  const event = document.createEvent('CustomEvent');

  event.initCustomEvent(type, true, true, undefined);

  entries(eventInitDict ?? defaultEventDict).forEach(([key, value]) => {
    (event as any)[key] = value;
  });

  return event;
}
