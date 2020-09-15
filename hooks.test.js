/* eslint-disable jest/expect-expect */
jest.mock('@mhlabs/signed-http-client');

const httpclient = require('@mhlabs/signed-http-client');
const tested = require('./hooks');

const mockDeploy = {
  putLifecycleEventHookExecutionStatus: jest.fn(() => ({
    promise: jest.fn().mockResolvedValue({})
  }))
};

const mockLambda = {};

jest.mock('aws-sdk', () => {
  return {
    CodeDeploy: jest.fn(() => mockDeploy),
    Lambda: jest.fn(() => mockLambda),
    config: {
      update: jest.fn(() => {})
    }
  };
});

const event = {
  DeploymentId: '123',
  LifecycleEventHookExecutionId: '321'
};

describe('Execute successful CodeBuild-hooks', () => {
  beforeEach(() => {
    process.env.VersionToTest =
      'arn:aws:lambda:eu-west-1:1234567890:function:my-function-ZXCVBNMASD:1';

    tested.add('/ping', 200);
    tested.add('/pong', 200);

    mockLambda.invoke = jest.fn(() => ({
      promise: jest.fn().mockResolvedValue({ StatusCode: 200 })
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should return 'Success' when handlerPreTrafficHook is successful", async () => {
    await tested.handlerPreTrafficHook(event);

    expect(mockLambda.invoke).toHaveBeenCalledTimes(2);
    expect(httpclient.get).toHaveBeenCalledTimes(0);
    expect(
      mockDeploy.putLifecycleEventHookExecutionStatus
    ).toHaveBeenCalledTimes(1);
    expect(
      mockDeploy.putLifecycleEventHookExecutionStatus
    ).toHaveBeenCalledWith({
      deploymentId: event.DeploymentId,
      lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
      status: 'Succeeded'
    });
  });

  it("Should return 'Success' when handlerPostTrafficHook is successful", async () => {
    httpclient.get.mockResolvedValue({
      status: 200
    });
    await tested.handlerPostTrafficHook(event);

    expect(mockLambda.invoke).toHaveBeenCalledTimes(0);
    expect(httpclient.get).toHaveBeenCalledTimes(2);

    expect(
      mockDeploy.putLifecycleEventHookExecutionStatus
    ).toHaveBeenCalledTimes(1);
    expect(
      mockDeploy.putLifecycleEventHookExecutionStatus
    ).toHaveBeenCalledWith({
      deploymentId: event.DeploymentId,
      lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
      status: 'Succeeded'
    });
  });
});

describe('Execute failed CodeBuild-hooks', () => {
  beforeEach(() => {
    process.env.VersionToTest =
      'arn:aws:lambda:eu-west-1:1234567890:function:my-function-ZXCVBNMASD:1';

    httpclient.get.mockResolvedValue({
      status: 401
    });
    mockLambda.invoke = jest.fn(() => ({
      promise: jest.fn().mockResolvedValue({ StatusCode: 401 })
    }));

    tested.add('/ping', 200);
    tested.add('/pong', 200);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should return 'Failure' when returned status code from pre-hook is not 200", async () => {
    httpclient.get.mockResolvedValue({ status: 401 });
    await tested.handlerPostTrafficHook(event);

    expect(
      mockDeploy.putLifecycleEventHookExecutionStatus
    ).toHaveBeenCalledWith({
      deploymentId: event.DeploymentId,
      lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
      status: 'Failed'
    });
  });

  it("Should return 'Failure' when returned status code from post-hook is not 200", async () => {
    mockLambda.invoke.mockResolvedValue({ status: 401 });
    await tested.handlerPostTrafficHook(event);

    expect(
      mockDeploy.putLifecycleEventHookExecutionStatus
    ).toHaveBeenCalledWith({
      deploymentId: event.DeploymentId,
      lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
      status: 'Failed'
    });
  });
});
