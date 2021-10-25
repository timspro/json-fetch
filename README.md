# json-fetch

```
npm install @tim-code/json-fetch
```

A zero-dependency fetch wrapper for HTTP/HTTPS requests that should return well-formed JSON

## Philosophy

```js
import * as json from "@tim-code/json-fetch"
json.jsonFetch(url, fetchOptions)
json.get(url, { queryParamKey: queryParamValue }, fetchOptions)
json.post(url, { postBodyKey: postBodyValue }, fetchOptions)
json.request(url, { ...fetchOptions, query: { a: "b" }, body: { c: "d" } })
// the following cause two requests each (i.e. `${url}?a=b` and `${url}?c=d`):
json.multirequest(url, { ...fetchOptions, query: [{ a: "b" }, { c: "d" }] })
json.multirequest(url, { ...fetchOptions, body: [{ a: "b" }, { c: "d" }] })
```

The functions exported will not throw errors on "abnormal" responses. Instead, abnormal responses are logged using `console.error` and an empty object `{}` is returned.

Abnormal responses are either:

1. responses that do not have a successful status (i.e not in the range 200-299) or

2. cannot be parsed as JSON (specifically `JSON.parse` threw an error).

Additionally, logged errors will include a portion of the response to help with debugging. See below on how to override this.

## Options

In addition to the normal `fetch` options, the following are also optional:

`fetch`: a callback to be used instead of a global fetch; it is usually necessary to pass this in Node environments

`onError`: a callback that completely overrides error behavior; its return value will be passed back instead of an empty object assuming it didn't throw an error
