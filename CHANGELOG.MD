# Release History
## 0.0.1-beta.6

### Added

- Use actual `addedOn`, `removedOn`, `createdOn` timestamps for add/remove participant events

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
