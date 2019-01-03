# Summary

Demos and detailed explanation of returning binary file/payload using Amazon API Gateway and AWS Lambda (and Serverless).
I'm attempting to document this for both the Lambda Proxy Integration and Lambda Custom Integrations modes of Amazon API Gateway.

# Usage

See the various `demo-*` subdirectories of this repo. Specifically the `demo-option1-binaryMediaTypes` and `demo-option2-contentHandling` demonstrates the two options for configuring API Gateway to return binary payloads from an AWS Lambda backend.


_From the root of the demo directory with installed globally..._

    # install packages:
    yarn
    # run serverless deploy to deploy to AWS:
    yarn deploy 

That will deploy for a bit and then spit out a full URL to the endpoint (like https://gibberish.execute-api.us-east-1.amazonaws.com/dev/). Then open the endpoint URL in the browser


# Reference - HOW to make it work

The best API Gateway reference on this that I've found is the [Support Binary Payloads in API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-payload-encodings.html) topic in the _Amazon API Gateway Developer Guide_ where they write:

>  For API Gateway to pass binary payloads, you add the media types to the binaryMediaTypes list of the RestApi resource or set the contentHandling properties on the Integration and the IntegrationResponse resources. The contentHandling value can be CONVERT_TO_BINARY, CONVERT_TO_TEXT, or undefined. Depending on the contentHandling value, and whether the Content-Type header of the response or the Accept header of the incoming request matches an entry in the binaryMediaTypes list, API Gateway can encode the raw binary bytes as a Base64-encoded string, decode a Base64-encoded string back to its raw bytes, or pass the body through without modification. 

This tells us there are two methods of making binary payloads work. Option 1 is to set the `binaryMediaTypes` of your entire API. Option 2 is to set the `contentHandling` property on your Integration Request or Integration Response.

## Option 1: Set `binaryMediaTypes` on API
If you want all methods of all resources to attempt to convert data to binary, then set the [`binaryMediaTypes` property of the `RestApi` resource](https://docs.aws.amazon.com/apigateway/api-reference/resource/rest-api/#binaryMediaTypes). This causes API Gateway to attempt to convert the body from base64 string to binary anytime the `Accept` header on the _request_ is equal to any of the MIME types specified in `binaryMediaTypes`.

### Notes

1. This is the only option when using [Lambda Proxy Integration](https://docs.aws.amazon.com/apigateway/latest/developerguide/getting-started-with-lambda-integration.html) (and not the Lambda Custom Integration).
2. Apparently, this applies this behavior to all methods in your API. However, since you set `isBase64Encoded: false` in the Lambda function's response when using Lambda Proxy Integration, it appears you can control this. Specifically, when you want to return text-based content (e.g. HTML, JSON) just set `isBase64Encoded: false` in your Lambda Proxy method and it seems to work fine (see the `html` function in the file `demo-option1-binaryMediaTypes/handler.js`).

### Examples

#### Example 1: serverless-aws-static-file-handler

Use the [`serverless-aws-static-file-handler`](https://github.com/activescott/serverless-aws-static-file-handler) and setup the the plugin in your `serverless.yml` like so:

    plugins:
      - serverless-aws-static-file-handler/plugins/BinaryMediaTypes
    
    custom:
      apiGateway:
        binaryMediaTypes: # Put the accept headers you want to trigger APIG to do binary conversions here
          - "image/png"  # This will only trigger binary conversion when the request includes Accept: image/png header
          - "image/jpeg" # add any other media types you want to be treated as binary


#### Example 2: maciejtreder/serverless-apigw-binary

Use the [`serverless-apigw-binary` Serverless plugin from maciejtreder](https://github.com/maciejtreder/serverless-apigw-binary) (not to be confused with the [`serverless-apigwy-binary` Serverless plugin from ryanmurakami](https://github.com/ryanmurakami/serverless-apigwy-binary)) and update your `serverless.yml` to call the plugin like so:

    plugins:
      - serverless-apigw-binary

    custom:
      apigwBinary:
        types: # Put the accept headers you want to trigger APIG to do binary conversions here
          - 'image/png' # This will only trigger binary conversion when the request includes Accept: image/png header
          - '*/*' # This will trigger binary conversion on all requests 

The types are Accept _request_ header types that trigger APIG to allow conversion to binary responses. So as long as you include one of these `Accept` header values in your _request_ it will do the conversion when the lambda responses' `isBase64Encoded` properrty is set to `true`.


## Option 2: Set `contentHandling` on the Integration Request/Response
Set the `contentHandling` property on the [Integration Request](https://docs.aws.amazon.com/apigateway/api-reference/resource/integration/#contentHandling) (represented by `Integration` resource in the API Gateway API) or the [`IntegrationResponse`](https://docs.aws.amazon.com/apigateway/api-reference/resource/integration-response/#contentHandling).

This option is a more granular approach that allows you to specify whether individual methods transform their request and/or their response. However, it seems it applies regardless of request/response type.

### Notes

    1. Since you cannot set the `contentHandling` property when using [Lambda Proxy Integration](https://docs.aws.amazon.com/apigateway/latest/developerguide/getting-started-with-lambda-integration.html), you must be using Lambda Custom Integration when using this option.
    2. The entire payload from AWS Lambda must be the base64-encoded string. You _cannot_ set just the `body` property of a JSON response like Lambda Proxy integration).
    3. As noted in APIG documentation [here](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-payload-encodings-workflow.html) _When converting a text payload to a binary blob ... You do not provide a mapping template..._ Since you cannot provide a mapping template, and the entire response from AWS Lambda must be the base64-encoded binary data, you cannot dynamically set the Content-Type in the lambda function. So you must define a different `http` event in serverless.yml for each Content-Type.

### Open Issues

    1. Cannot change the `Content-Type` response header of responses with `contentHandling: CONVERT_TO_BINARY` methods. APIG seems to always echo back whatever was sent in the request's `Accept` header.


### Example
Use the [`serverless-apigwy-binary` Serverless plugin from ryanmurakami](https://github.com/ryanmurakami/serverless-apigwy-binary) (not to be confused with the [`serverless-apigw-binary` Serverless plugin from maciejtreder](https://github.com/maciejtreder/serverless-apigw-binary)) and update your `serverless.yml` to call the plugin like so:

    plugins:
      - serverless-apigwy-binary

Then on the functions that you want to conver the body to binary set the `contentHandling` property to `CONVERT_TO_BINARY`:

    functions:
      ...
      mybinaryreturnfunc:
        handler: handler.mybinaryreturnfunc
        events:
          - http:
              path: binary/{path+}
              integration: lambda
              method: get
              contentHandling: CONVERT_TO_BINARY

**NOTE:** This all assumes that ryanmurakami/serverless-apigwy-binary#5 is merged which fixes a recent issue in the serverless-apigwy-binary plugin.

### How to verify
You can verify the contentHandling value by running the following AWS CLI Console commands:

    # Get the REST API ID:
    aws apigateway get-rest-apis

    # Get the resource ID
    aws apigateway get-resources --rest-api-id vcnes1h9b6

    # Get the method (which includes all integration responses)
    aws apigateway get-method --rest-api-id vcnes1h9b6 --resource-id fzdcvq --http-method GET


# Misc

Also note the following stackoverflow thread with relevant info: https://stackoverflow.com/q/53510286
