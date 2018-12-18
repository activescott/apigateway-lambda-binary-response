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
  const fname = path.join(__dirname, "binary", event.path.pathvar)
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

  if (encoding === "base64") {
    // NOTE: No way to set Content-Type in "Lambda Custom Integration" since you cannot use a mapping template and must return the entire response as base64-encoded string.
    return buffer.toString(encoding)
  } else {
    return {
      body: buffer.toString(encoding)
    }
  }
}
