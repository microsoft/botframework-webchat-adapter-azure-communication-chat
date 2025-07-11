import { ChatClient, ChatParticipant, CreateChatThreadRequest, ChatClientOptions } from '@azure/communication-chat';
import { getProxyToken, getThreadId } from '../utils/UrlUtils';
import { CorrelationVectorV2 } from '../utils/CorrelationVectorUtils';

import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { CommunicationIdentityClient } from '@azure/communication-identity';
import { PipelinePolicy, PipelineRequest, SendRequest, PipelineResponse } from '@azure/core-rest-pipeline';

// This logic should be implemented in Server side for production code which includes
// Thread management logic(A proxy token maintained in memory) for creating thread/add users to thread
// And server should return these params and pass them down to createACSAdapter function
// token: ACS token requested from ACS for current user
// threadId: the threadId server created and the ACS user added into
// environmentUrl: An environment url for ACS to connect
// displayName: optional, displayName for user in chat, could be set by css when render webchat as well

interface UserTokenResponse {
  id: string;
  token: string;
  expiresOn: Date;
  environmentUrl: string;
  displayName: string;
}

const DISPLAY_NAMES = [
  'David Matthew',
  'Ram Kumar',
  'Inder Pal',
  'Mr Singh',
  'Preet Pal',
  'Devin Haz',
  'Sam Sayid',
  'Kaul Preet',
  'Daisey Sharma',
  'Queen Kaur'
];

const createUserToken = async (): Promise<UserTokenResponse> => {
  // this variable will be replaced by webpack.dev.config.js
  const resourceConnectionString = 'RESOURCE_CONNECTION_STRING_TO_BE_REPLACED';
  if (!resourceConnectionString) {
    throw new Error('No ACS connection string provided');
  }

  // get token locally
  const tokenClient = new CommunicationIdentityClient(resourceConnectionString);
  const user = await tokenClient.createUser();
  const token = await tokenClient.getToken(user, ['chat']);
  const userDisplayName = DISPLAY_NAMES[Math.floor(Math.random() * DISPLAY_NAMES.length)];
  const uri = new URL(resourceConnectionString.replace('endpoint=', '').split(';')[0]);
  const returnJson: UserTokenResponse = {
    id: user.communicationUserId,
    token: token.token,
    expiresOn: token.expiresOn,
    environmentUrl: uri.toString(),
    displayName: userDisplayName
  };

  return returnJson;
};

const createCorrelationVectorPolicy = (): PipelinePolicy => ({
  name: 'correlationVectorPolicy',
  sendRequest: async (request: PipelineRequest, next: SendRequest): Promise<PipelineResponse> => {
    request.headers.set('ms-cv', CorrelationVectorV2());
    return next(request);
  }
});

export const threadInitialize = async (): Promise<{
  userId: string;
  token: string;
  threadId: string;
  environmentUrl: string;
  displayName: string;
  chatClient: ChatClient;
}> => {
  const { token, id, environmentUrl, displayName } = await createUserToken();

  const chatUser: ChatParticipant = createChatParticipant(id, displayName);

  // TEST with Bot
  // 1. Uncomment below and add bot MRI to test with a bot
  //const botMri = "";
  //const botUser: ChatParticipant = createChatParticipant(botMri, "echoBot");

  const proxyUserToken = getProxyToken();
  let threadId = getThreadId();

  // setup pipeline policy https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/core/core-rest-pipeline/documentation/pipeline.md
  const chatClientOptions: ChatClientOptions = {
    additionalPolicies: [
      {
        policy: createCorrelationVectorPolicy(),
        position: 'perCall'
      }
    ]
  };

  const chatClient: ChatClient = new ChatClient(
    environmentUrl,
    new AzureCommunicationTokenCredential(token),
    chatClientOptions
  );

  // If there is no proxy token/exsting thread, get one, and add the ACS user to the thread
  if (threadId === null || proxyUserToken === null) {
    const { token: proxyUserToken } = await createUserToken();

    const userAccessTokenCredentialNew = new AzureCommunicationTokenCredential(proxyUserToken);
    const proxyClient = new ChatClient(environmentUrl, userAccessTokenCredentialNew);

    const request: CreateChatThreadRequest = {
      topic: 'Empty topic'
    };
    const response = await proxyClient.createChatThread(request);
    threadId = response?.chatThread?.id;
    const url = `${window.location.href}?threadId=${threadId}&proxyToken=${proxyUserToken}`;
    window.history.pushState({}, document.title, url);

    // 2. Add ACS user to the thread, add botUser to test with a bot
    const addMembersRequest = {
      participants: [chatUser]
    };
    const proxyChatThreadClient = proxyClient.getChatThreadClient(threadId);
    await proxyChatThreadClient.addParticipants(addMembersRequest);
  } else {
    const userAccessTokenCredentialNew = new AzureCommunicationTokenCredential(proxyUserToken);
    const proxyClient = new ChatClient(environmentUrl, userAccessTokenCredentialNew);
    const addMembersRequest = {
      participants: [chatUser]
    };
    const proxyChatThreadClient = proxyClient.getChatThreadClient(threadId);
    await proxyChatThreadClient.addParticipants(addMembersRequest);
  }

  return { userId: id, threadId, token, environmentUrl, displayName, chatClient };
};

const createChatParticipant = (id: string, name?: string): ChatParticipant => ({
  id: {
    communicationUserId: id
  },
  displayName: name
});
