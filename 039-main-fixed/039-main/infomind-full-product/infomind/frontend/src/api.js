const BASE = '/api'

let token = localStorage.getItem('im_token')

export function setToken(value) {
  token = value

  if (value) {
    localStorage.setItem('im_token', value)
  } else {
    localStorage.removeItem('im_token')
  }
}

export function hasToken() {
  return !!token
}

export async function api(
  path,
  {
    method = 'GET',
    body,
    form,
    params
  } = {}
) {
  const headers = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let requestBody

  if (form) {
    requestBody = form
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    requestBody = JSON.stringify(body)
  }

  const query =
    params
      ? `?${new URLSearchParams(params)}`
      : ''

  const response = await fetch(
    BASE + path + query,
    {
      method,
      headers,
      body: requestBody
    }
  )

  if (
    response.status === 401 &&
    path !== '/auth/login'
  ) {
    setToken(null)
    window.location.reload()
    throw new Error('Session expired')
  }

  const data =
    await response
      .json()
      .catch(() => ({}))

  if (!response.ok) {
    const message =
      typeof data?.detail === 'string'
        ? data.detail
        : typeof data?.message === 'string'
          ? data.message
          : 'Request failed'

    throw new Error(message)
  }

  return data
}

export async function login(
  username,
  password
) {
  const response = await fetch(
    BASE + '/auth/login',
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        username,
        password
      })
    }
  )

  const data =
    await response
      .json()
      .catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      'Login failed'
    )
  }

  if (!data?.access_token) {
    throw new Error(
      'Login succeeded but no access token was returned.'
    )
  }

  setToken(data.access_token)

  return data
}
