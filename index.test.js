import { autotest } from "@tim-code/autotest"
import fetch from "node-fetch"
import { get, onError, parseIndexOfError, post, request } from "./index.js"

autotest(parseIndexOfError)("position 10")(10)
autotest(parseIndexOfError)("line 2 column 3", "   \n  a")(6)
autotest(parseIndexOfError)("line 3 column 2", " \n\n  a")(4)

let message
autotest(onError, { after: () => message[2] })({
  jsonSyntaxMessage: "position 5",
  aroundError: 1,
  text: "abcdefgh",
  error: (...args) => {
    message = args
  },
})("...efg...")

const options = { fetch }

autotest(get)("https://httpbin.org/get", undefined, options)(
  expect.objectContaining({ args: {} })
)

const getInput = { test: "1" }
autotest(get)("https://httpbin.org/get", getInput, options)(
  expect.objectContaining({ args: getInput })
)

const postInput = { check: 1 }
autotest(post)("https://httpbin.org/post", postInput, options)(
  expect.objectContaining({ json: postInput })
)

autotest(request)("https://httpbin.org/post", {
  ...options,
  body: postInput,
  query: getInput,
})(expect.objectContaining({ json: postInput, args: getInput }))

const multiInput = { query: [{ test: "a" }, { test: "b" }] }
autotest(request)("https://httpbin.org/get", { ...options, ...multiInput })([
  expect.objectContaining({ args: multiInput.query[0] }),
  expect.objectContaining({ args: multiInput.query[1] }),
])

const multiInputPost = { body: [{ test: 10 }, { test: 20 }] }
autotest(request)("https://httpbin.org/post", { ...options, ...multiInputPost })([
  expect.objectContaining({ json: multiInputPost.body[0] }),
  expect.objectContaining({ json: multiInputPost.body[1] }),
])
