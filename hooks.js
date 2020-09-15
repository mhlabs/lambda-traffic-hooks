const AWS = require('aws-sdk');
const logging = require('@mhlabs/structured-logging');
const httpclient = require('@mhlabs/signed-http-client');

const tests = {};

AWS.config.update({
  region: process.env.AWS_REGION
});

const logger = new logging.StructuredLogger(
  process.env.AWS_LAMBDA_FUNCTION_NAME
);

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

  if (!tests || tests.length === 0) {
    throw Error('no tests registered');
  }

  const results = Object.keys(tests).map(async (path) => {
    const expected = tests[path];
    const response = func(path);
    const ok = response.StatusCode === expected;

    logger.info(ok, {
      path,
      expected,
      actual: response.StatusCode,
      status: ok
    });

    return ok;
  });

  const params = {
    deploymentId: deploymentId,
    lifecycleEventHookExecutionId: lifecycleEventHookExecutionId,
    status: results.filter((x) => !x).length === 0 ? 'Succeeded' : 'Failed'
  };

  return await codedeploy
    .putLifecycleEventHookExecutionStatus(params)
    .promise();
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
  const func = async (path) => {
    return await httpclient.get(path);
  };

  return await execute(event, func);
};

exports.add = (url, statusCode = 200) => {
  tests[url] = statusCode;
};
