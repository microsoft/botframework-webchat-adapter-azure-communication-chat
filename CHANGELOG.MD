# Release History
## 0.0.1-beta.8

### Fixed

- Restore fast-poll cadence at session start. The 1-second initial polling loop in `pollForMessages` stopped engaging when the package was rebuilt with TypeScript 5.x, due to a change in how async arrow functions with default parameters are emitted. Effective polling cadence at session start collapsed from ~1s to ~16s. Defaulting `iteration` inside the function body keeps TypeScript on the simpler emit pattern and restores the documented "1s polling for the first 45 seconds, then regular cadence" behavior.

## 0.0.1-beta.7

### Fixed

- Fix issue with some dependency package.

## 0.0.1-beta.6

### Added

- Use actual `addedOn`, `removedOn`, `createdOn` timestamps for add/remove participant events
- Add message type to the generated participant message key to prevent collisions when initiator, timestamp, and participants are identical.

## 0.0.1-beta.5

### Added

- Add support for adaptive card responses when translating ACS messages and RTN to activities.
- Introduce `enableAdaptiveCardsResponses` option in `AdapterOptions` to control adaptive card responses.

## 0.0.1-beta.4

### Added

- Add support for message deleted RTN.
- Add `editedOn` and `deletedOn` fields support for message activities.
- Update `timestamp` to be set to `event.createdOn` value for message edit RTN.
- Add CorrelationVector for notifyErrorEvent callback.

## 0.0.1-beta.3

### Added

- Add support for real-time message streaming events.
- Support for `participantAdded` and `participantRemoved` message types in both polled messages and messages loaded prior to web chat adapter initialization.

## 0.0.1-beta.2

### Added

- Decrease polling interval to 1 sec during first 45 sec, then regular cadence.

## 0.0.1-beta.1

### Added

- Migrate package to @microsoft/botframework-webchat-adapter-azure-communication-chat.
