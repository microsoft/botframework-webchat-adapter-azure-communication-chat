import { Builder, By, until, WebElementCondition, ThenableWebDriver, Browser } from 'selenium-webdriver';
import Chrome from 'selenium-webdriver/chrome';
import ChromeDriver from 'chromedriver';
import { log, error } from "console";

const ELEMENT_WAITING_TIME = 30 * 1000;
const TEST_WAITING_TIME = 60 * 1000;

const chatUrl = `http://localhost:8080/`;

const testIf = (condition: boolean, ...args: Parameters<typeof test>): void =>
  condition ? test(...args) : test.skip(...args);

function getWebDriverBuilder(): Builder {
  log('ChromeDriver Path: ' + ChromeDriver.path);

  return new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(
      new Chrome.Options().addArguments(
        '--ignore-certificate-errors-spki-list',
        '--ignore-ssl-errors',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--headless=new'
      )
    );
}

function untilElementLocated(classTwo: By): WebElementCondition {
  return until.elementLocated(classTwo);
}

function byMessageXpath(message: string): By {
  return By.xpath(`//*[text()='${message}']`);
}

async function webPageDriver(
  url: string,
  webDriverBuilder: Builder,
  messageInputElement: By,
  messageSendButtonElement: By
): Promise<ThenableWebDriver> {
  const driver = webDriverBuilder.build();
  await driver.get(url);

  // wait until send message button and text box is visible
  const messageInputBox = await driver.wait(untilElementLocated(messageInputElement), ELEMENT_WAITING_TIME);
  const messageSendButton = await driver.wait(untilElementLocated(messageSendButtonElement), ELEMENT_WAITING_TIME);
  await driver.wait(until.elementIsVisible(messageInputBox), ELEMENT_WAITING_TIME);
  await driver.wait(until.elementIsVisible(messageSendButton), ELEMENT_WAITING_TIME);
  return driver;
}

describe('executing integration tests for ACS Chat Adapter', () => {
  const messageInputElement = By.css('input[aria-label="Message input box"]');
  const messageSendButtonElement = By.css('button[title="Send"]');
  const typingIndicatorElement = By.className('webchat__typingIndicator');
  const fileUploadInputElement = By.css('input[type="file"]');
  const fileUploadButtonElement = By.css('button[title="Upload file"]');
  const attachmentElement = By.css('div[aria-roledescription="attachment"]');

  test(
    'Verify message is sent by one user and received by second user with typing indicator',
    async () => {
      const message = 'Hello';

      const webDriverBuilder = getWebDriverBuilder();

      // chat user One joins chat
      const userOne = await webPageDriver(chatUrl, webDriverBuilder, messageInputElement, messageSendButtonElement);

      // get chat join URL
      const chatJoinUrl = await userOne.getCurrentUrl();

      // user two joins chat
      const userTwo = await webPageDriver(chatJoinUrl, webDriverBuilder, messageInputElement, messageSendButtonElement);

      // get message input box and send button for user two
      const messageInputBoxUserTwo = await userTwo.wait(untilElementLocated(messageInputElement), ELEMENT_WAITING_TIME);
      const messageSendButtonUserTwo = await userTwo.wait(
        untilElementLocated(messageSendButtonElement),
        ELEMENT_WAITING_TIME
      );

      // wait for some time to load completely
      // otherwise send message fails
      await userTwo.sleep(2000);

      // User Two type message
      await messageInputBoxUserTwo.sendKeys(message);

      // User one get typing indicator
      const typingIndicator = await userOne.wait(untilElementLocated(typingIndicatorElement), ELEMENT_WAITING_TIME);

      // user one gets typing indicator
      expect(typingIndicator).not.toBeNull();

      // user two send message
      await messageSendButtonUserTwo.click();

      // verify for user two message bubble appears
      const senderMessageBubble = await userTwo.wait(
        untilElementLocated(byMessageXpath(message)),
        ELEMENT_WAITING_TIME
      );
      const senderMessageText = await senderMessageBubble.getAttribute('textContent');

      expect(senderMessageText).toEqual(message);

      // wait for user one to receive message
      const receiverMessageBubble = await userOne.wait(
        untilElementLocated(byMessageXpath(message)),
        ELEMENT_WAITING_TIME
      );
      const receiverMessageText = await receiverMessageBubble.getAttribute('textContent');

      expect(receiverMessageText).toEqual(message);

      await userOne.close();
      await userTwo.close();
    },
    TEST_WAITING_TIME
  );

  test(
    'Verify history messages are synchronized upon new user joining',
    async () => {
      const message = 'Hello history';
      const webDriverBuilder = getWebDriverBuilder();

      // chat user One joins chat
      const userOne = await webPageDriver(chatUrl, webDriverBuilder, messageInputElement, messageSendButtonElement);

      // get message input box and send button for user one
      const messageInputBoxUserOne = await userOne.wait(untilElementLocated(messageInputElement), ELEMENT_WAITING_TIME);
      const messageSendButtonUserOne = await userOne.wait(
        untilElementLocated(messageSendButtonElement),
        ELEMENT_WAITING_TIME
      );

      // wait for some time to load completely
      // otherwise send message fails
      await userOne.sleep(2000);

      await messageInputBoxUserOne.sendKeys(message);
      await messageSendButtonUserOne.click();

      // get chat join URL
      const chatJoinUrl = await userOne.getCurrentUrl();

      // user two joins chat
      const userTwo = await webPageDriver(chatJoinUrl, webDriverBuilder, messageInputElement, messageSendButtonElement);

      // wait for user two to receive syncronized history message
      const receiverMessageBubble = await userTwo.wait(
        untilElementLocated(byMessageXpath(message)),
        ELEMENT_WAITING_TIME
      );
      const receiverMessageText = await receiverMessageBubble.getAttribute('textContent');

      expect(receiverMessageText).toEqual(message);

      await userOne.close();
      await userTwo.close();
    },
    TEST_WAITING_TIME
  );

  testIf(
    process.env['OneDriveToken'] !== undefined, // Auth token is required to test against OneDrive
    'Verify attachments are sent successfully',
    async () => {
      const message = 'Hello';
      const webDriverBuilder = getWebDriverBuilder();

      // chat user One joins chat
      const userOne = await webPageDriver(chatUrl, webDriverBuilder, messageInputElement, messageSendButtonElement);

      // get chat join URL
      const chatJoinUrl = await userOne.getCurrentUrl();

      // user two joins chat
      const userTwo = await webPageDriver(chatJoinUrl, webDriverBuilder, messageInputElement, messageSendButtonElement);

      // get message input box and send button for user two
      const messageInputBoxUserTwo = await userTwo.wait(untilElementLocated(messageInputElement), ELEMENT_WAITING_TIME);
      const messageSendButtonUserTwo = await userTwo.wait(
        untilElementLocated(messageSendButtonElement),
        ELEMENT_WAITING_TIME
      );

      // wait for some time to load completely
      // otherwise send message fails
      await userTwo.sleep(2000);

      // user two types and sends message (webchat UI requires we send a message before upload attachments)
      await messageInputBoxUserTwo.sendKeys(message);
      await messageSendButtonUserTwo.click();

      // get file input for user two
      const fileUploadInputUserTwo = await userTwo.wait(
        untilElementLocated(fileUploadInputElement),
        ELEMENT_WAITING_TIME
      );

      // get file send button for user two
      const fileSendButtonUserTwo = await userTwo.wait(
        untilElementLocated(fileUploadButtonElement),
        ELEMENT_WAITING_TIME
      );

      // user two send attachment
      const attachment = `${__dirname}/assets/mockAttachment.txt`;
      await fileUploadInputUserTwo.sendKeys(attachment);
      await fileSendButtonUserTwo.click();

      // verify user two message for attachment appears
      await userTwo.wait(untilElementLocated(attachmentElement), ELEMENT_WAITING_TIME);

      // verify user one message for attachment appears
      await userOne.wait(untilElementLocated(attachmentElement), ELEMENT_WAITING_TIME);

      await userOne.close();
      await userTwo.close();
    },
    TEST_WAITING_TIME
  );
});
