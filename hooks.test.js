/* eslint-disable jest/expect-expect */
const AWS = require('aws-sdk');
const logging = require('@mhlabs/structured-logging');
const httpclient = require('@mhlabs/signed-http-client');
const tested = require('./hooks');

jest.mock('@mhlabs/structured-logging');
jest.mock('@mhlabs/signed-http-client');

const mockLogger = {
  info: jest.fn(),
  error: jest.fn()
};
const mockHttpClient = {
  get: jest.fn()
};

const mockDeploy = {
  putLifecycleEventHookExecutionStatus: jest.fn().mockReturnThis(),
  promise: jest.fn()
};

const mockLambda = {
  invoke: jest.fn()
};

jest.mock('aws-sdk', () => {
  return {  
    CodeDeploy: jest.fn(() => mockDeploy),
    Lambda: jest.fn(() => mockLambda),
    config: {
      update: jest.fn(() => {})
    }
  };
});

describe('Execute CodeBuild-hooks', () => {
  const event = {
    DeploymentId: '123',
    LifecycleEventHookExecutionId: '321'
  };

  beforeEach(() => {
    process.env.VersionToTest =
      'arn:aws:lambda:eu-west-1:1234567890:function:my-function-ZXCVBNMASD:1';

    logging.StructuredLogger.mockImplementation(() => mockLogger);
    httpclient.get.mockImplementation(() => mockHttpClient);

    tested.add('/ping', 200);
    tested.add('/pong', 200);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should return 'Success' when handlerPreTrafficHook is successful", async () => {
    const response = await tested.handlerPreTrafficHook(event);
    expect(mockLambda.invoke).toHaveBeenCalledTimes(1);
    expect(
      mockDeploy.putLifecycleEventHookExecutionStatus
    ).toHaveBeenCalledTimes(1);
  });
});
