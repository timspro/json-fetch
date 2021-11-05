/* global fetch */

function indexOfIth(string, substring, ith = 1) {
  return string.split(substring, ith).join(substring).length
}

export function parseIndexOfError(message, text) {
  const [, position] = message.match(/position (\d+)/imu) || []
  if (position !== undefined) {
    return parseInt(position, 10)
  }
  const [, line] = message.match(/line (\d+)/imu) || []
  const [, column] = message.match(/column (\d+)/imu) || []
  if (line && column) {
    const previousLineNumber = parseInt(line, 10) - 1
    const columnNumber = parseInt(column, 10)
    return indexOfIth(text, "\n", previousLineNumber) + columnNumber
  }
  return undefined
}

export function onError({
  status,
  result,
  text,
  jsonSyntaxMessage,
  aroundError = 50,
  error = console.error,
}) {
  if (result) {
    error(`bad status:`, status, result)
  } else {
    const position = parseIndexOfError(jsonSyntaxMessage, text)
    if (position) {
      const left = position - aroundError
      const right = position + aroundError + 1
      const leftEllipsis = left > 0 ? "..." : ""
      const rightEllipsis = right < jsonSyntaxMessage.length ? "..." : ""
      // .substring bounds arguments to 0 and text.length if less than or greater than
      const message = text.substring(left, right)
      error(`invalid json:`, status, `${leftEllipsis}${message}${rightEllipsis}`)
    } else {
      error(`invalid json:`, status, jsonSyntaxMessage)
    }
  }
  return {}
}

function shorten(string, newLength = 100) {
  if (string.length > newLength) {
    return `${string.substring(0, newLength)}...`
  }
  return string
}

async function fetchJson(
  url,
  { fetch: _fetch = fetch, onError: _onError = onError, raw = false, ...options } = {}
) {
  const headers = { ...options.headers, ...(raw ? {} : { Accept: "application/json" }) }
  const response = await _fetch(url, { ...options, ...headers })
  const text = await response.text()
  try {
    let result = raw ? text : JSON.parse(text)
    if (response.ok) {
      return result
    }
    result = raw ? shorten(result) : result
    return _onError({ status: response.status, result, text })
  } catch (error) {
    return _onError({ status: response.status, text, jsonSyntaxMessage: error.message })
  }
}

export function appendQueryParams(url, input) {
  if (!input) {
    return url
  }
  const urlBuilder = new URL(url)
  for (const key of Object.keys(input)) {
    urlBuilder.searchParams.append(key, input[key])
  }
  return urlBuilder.toString()
}

export function get(url, query, options = {}) {
  url = appendQueryParams(url, query)
  return fetchJson(url, { ...options, method: "GET" })
}

export function post(url, body, options = {}) {
  body = JSON.stringify(body)
  const headers = { ...(options.headers || {}), "Content-Type": "application/json" }
  return fetchJson(url, { ...options, headers, method: "POST", body })
}

function httpMethod(url, { query, body, ...options } = {}) {
  if (body) {
    url = appendQueryParams(url, query)
    return post(url, body, options)
  }
  return get(url, query, options)
}

function expand(config, key) {
  if (Array.isArray(config[key])) {
    return config[key].map((value) => ({ ...config, [key]: value }))
  }
  return [config]
}

function expandAll(configArray, key) {
  return configArray.map((config) => expand(config, key)).flat()
}

export function request(url, config) {
  if (!Array.isArray(config.query) && !Array.isArray(config.body)) {
    return httpMethod(url, config)
  }
  const configArray = expandAll(expandAll([config], "query"), "body")
  return Promise.all(configArray.map((cfg) => httpMethod(url, cfg)))
}

export function requestFactory(defaultConfig) {
  return (url, config) => request(url, { ...config, ...defaultConfig })
}
