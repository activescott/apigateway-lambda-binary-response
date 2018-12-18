"use strict"
const path = require("path")
const util = require("util")
const fs = require("fs")
const readFileAsync = util.promisify(fs.readFile)

module.exports.png = async (event, context) => {
  const fname = path.join(__dirname, "binary", "png.png")
  return getFileResponse(fname)
}

module.exports.jpg = async (event, context) => {
  const fname = path.join(__dirname, "binary", "jpg.jpg")
  return getFileResponse(fname)
}

module.exports.binary = async (event, context) => {
  if (!event.path.startsWith("/binary/")) {
    throw new Error(`[404] Invalid filepath for this resource: ${fname}`)
  }
  const fname = path.join(__dirname, event.path)
  console.log("fname:", fname)
  return getFileResponse(fname)
}

module.exports.html = async (event, context) => {
  const fname = path.join(__dirname, "index.html")
  return getFileResponse(fname, "utf8")
}

async function getFileResponse(fname, encoding = "base64") {
  let buffer
  try {
    buffer = await readFileAsync(fname)
  } catch (err) {
    throw new Error(`[404] File ${fname} does not exist. Error: ${err.message}`)
  }
  const mimeMap = {
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".html": "text/html"
  }
  const mimeType = (path.extname(fname) in mimeMap) ? mimeMap[path.extname(fname)] : "application/json"
  // Based on https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
  return {
    statusCode: 200,
    headers: {
      "Content-Type": mimeType
    },
    isBase64Encoded: encoding === "base64",
    body: buffer.toString(encoding)
  }
}
