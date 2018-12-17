"use strict"
const path = require("path")
const util = require("util")
const fs = require("fs")
const readFileAsync = util.promisify(fs.readFile)

module.exports.bits = async (event, context) => {
  const fname = path.join(__dirname, "ff.png")
  console.log("fname:", fname)
  return readFileAsync(fname)
    .then(buffer => buffer.toString("base64"))
    .then(base64Str => {
      // Based on https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
      console.log("base64Str len:", base64Str.length)
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "image/png"
        },
        isBase64Encoded: true,
        body: base64Str
      }
    })
}

module.exports.html = async (event, context) => {
  const result = {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html"
    },
    isBase64Encoded: false,
    body: `<html>
<body>
  Image: <img src="bits" style="width: 32px; height:32px; border:1px solid orange;" />
</body>
</html>`
  }
  return Promise.resolve(result)
}
