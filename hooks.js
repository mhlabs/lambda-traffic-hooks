const AWS = require('aws-sdk');
const httpclient = require('@mhlabs/signed-http-client');

const tests = {};

AWS.config.update({
  region: process.env.AWS_REGION
});

const toProxyRequest = (path) => {
  if (!process.env.VersionToTest) {
    throw Error(
      'Version on which Lambda must be set (process.env.VersionToTest)'
    );
  }

  const request = {
    resource: '/{proxy+}',
    path: path,
    httpMethod: 'GET'
  };

  return {
    FunctionName: process.env.VersionToTest,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(request)
  };
};

const execute = async (event, func) => {
  const codedeploy = new AWS.CodeDeploy({ apiVersion: '2014-10-06' });
  const deploymentId = event.DeploymentId;
  const lifecycleEventHookExecutionId = event.LifecycleEventHookExecutionId;

  try {
    if (!tests || tests.length === 0) {
      throw Error('no tests registered');
    }

    const results = [];
    const tasks = Object.keys(tests).map(async (path) => {
      const expected = tests[path];
      const response = await func(path);
      const ok =
        response.StatusCode === expected || response.status === expected;

      console.log(`Success: ${ok}`, {
        path,
        expected,
        actual: response.StatusCode || response.status,
        status: ok
      });

      results.push(ok);
    });

    await Promise.all(tasks);

    const params = {
      deploymentId: deploymentId,
      lifecycleEventHookExecutionId: lifecycleEventHookExecutionId,
      status:
        results.length > 0 &&
        results.filter((x) => x === true).length === results.length
          ? 'Succeeded'
          : 'Failed'
    };

    return await codedeploy
      .putLifecycleEventHookExecutionStatus(params)
      .promise();
  } catch (error) {
    console.error(error);
    return await codedeploy
      .putLifecycleEventHookExecutionStatus({
        deploymentId,
        lifecycleEventHookExecutionId,
        status: 'Failed'
      })
      .promise();
  }
};

exports.handlerPreTrafficHook = async (event) => {
  const func = async (path) => {
    const lambda = new AWS.Lambda();
    const request = toProxyRequest(path);
    return await lambda.invoke(request).promise();
  };

  return await execute(event, func);
};

exports.handlerPostTrafficHook = async (event) => {
  const func = async (path) => await httpclient.get(path);
  return await execute(event, func);
};

exports.add = (url, statusCode = 200) => {
  tests[url] = statusCode;
};
