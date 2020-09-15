# lambda-traffic-hooks

Simplify http-testing during code deployments.

## Prerequisites
Expected environment variables:
- `VersionToTest`

Required permissions:
- `codedeploy:PutLifecycleEventHookExecutionStatus`
- `lambda:InvokeFunction`

## Usage

### Define endpoints with expected status code:
```
const endpoints = require('./tests');

endpoints.add('/health', 200);
endpoints.add('/ping', 200);

module.exports = require('./hooks');
```

### Register hooks to function:
- Hooks: https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file-structure-hooks.html#reference-appspec-file-structure-hooks-list-lambda
- SAM: https://docs.amazonaws.cn/en_us/codedeploy/latest/userguide/tutorial-lambda-sam-template.html

## Reference
https://aws.amazon.com/blogs/compute/implementing-safe-aws-lambda-deployments-with-aws-codedeploy/