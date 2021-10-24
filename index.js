/* global console, URL, fetch */

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
  json,
  text,
  jsonSyntaxMessage,
  aroundError = 50,
  error = console.error,
}) {
  if (json) {
    error(`bad status:`, status, json)
  } else {
    const position = parseIndexOfError(jsonSyntaxMessage, text)
    if (position) {
      const leftEllipsis = position - aroundError < 0 ? "..." : ""
      const rightEllipsis = position + aroundError > jsonSyntaxMessage.length ? "..." : ""
      const message = text.substring(position - aroundError, position + aroundError + 1)
      error(`invalid json:`, status, `${leftEllipsis}${message}${rightEllipsis}`)
    } else {
      error(`invalid json:`, status, jsonSyntaxMessage)
    }
  }
  return {}
}

export async function jsonFetch(
  url,
  { fetch: _fetch = fetch, onError: _onError = onError, ...options } = {}
) {
  const response = await _fetch(url, options)
  const text = await response.text()
  try {
    const json = JSON.parse(text)
    if (response.ok) {
      return json
    }
    return _onError({ status: response.status, json, text })
  } catch (error) {
    return _onError({ status: response.status, text, jsonSyntaxMessage: error.message })
  }
}

export function appendQueryParams(url, input) {
  const urlBuilder = new URL(url)
  for (const key of Object.keys(input)) {
    urlBuilder.searchParams.append(key, input[key])
  }
  return urlBuilder.toString()
}

export function get(url, query, options = {}) {
  if (query) {
    url = appendQueryParams(url, query)
  }
  return jsonFetch(url, { ...options, method: "GET" })
}

export function post(url, body, options = {}) {
  body = JSON.stringify(body)
  const headers = { ...(options.headers || {}), "Content-Type": "application/json" }
  return jsonFetch(url, { ...options, headers, method: "POST", body })
}
