# lambda-traffic-hooks
This library contains two deploy hooks for verifying your code deploy:

- `BeforeAllowTraffic` - via lambda invoke 
- `AfterAllowTraffic` - via http-request


Scenario:
> AWS Lambda and AWS CodeDeploy recently made it possible to automatically shift incoming traffic between two function versions based on a preconfigured rollout strategy. This new feature allows you to gradually shift traffic to the new function. If there are any issues with the new code, you can quickly rollback and control the impact to your application [[1]](https://aws.amazon.com/blogs/compute/implementing-safe-aws-lambda-deployments-with-aws-codedeploy/).



## Prerequisites
Expected environment variables:
- `VersionToTest`

To execute the SAM and CloudFormation deployment, you must have the following IAM permissions [[2]](https://docs.amazonaws.cn/en_us/codedeploy/latest/userguide/tutorial-lambda-sam-template.html):
- `codedeploy:PutLifecycleEventHookExecutionStatus`
- `lambda:InvokeFunction`
- `cloudformation:*`
- `iam:create*`

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