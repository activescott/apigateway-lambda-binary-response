# Summary

The simplest demo of returning a binary file payload using Amazon API Gateway and AWS Lambda (and Serverless).
Directly using [the _Output Format of a Lambda Function for Proxy Integration_ section of the _Set up Lambda Proxy Integrations in API Gateway_ topic in Amazon API Gateway docs](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format).

# Usage

_From the root of the repo with [Serverless](https://github.com/serverless/serverless) installed globally..._

    serverless deploy

That will deploy for a bit and then spit out a full URL to the endpoint (like https://gibberish.execute-api.us-east-1.amazonaws.com/dev/). Then open the endpoint URL in the browser

Start tailing the logs for the function with the following command:

    serverless logs -f bits -t

Then open the url in the browser and you'll recieve an error:

You can open the URL with curl like:

    curl https://gibberish.execute-api.us-east-1.amazonaws.com/dev/bits

Note how the data is still base64 encoded and not being convered to binary.

# WORKS

Use the serverless-apigw-binary and update serverless.yml with the plugin like so:

    plugins:
      - serverless-apigw-binary

    custom:
      apigwBinary:
        types:
          - 'image/png'
          - '*/*'

The types are Accept _request_ header types that trigger APIG to allow conversion to binary responses. So as long as you include the right Accept header in your _request_ it will do the conversion when the lambda responses' `isBase64Encoded` properrty is set to `true`.

curl -H "Accept: image/png" https://gibberish.execute-api.us-east-1.amazonaws.com/dev/bits

Also note the following stackoverflow thread with relevant info: https://stackoverflow.com/q/53510286
