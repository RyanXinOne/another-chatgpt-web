import fs from 'fs/promises'

const auth = async (req, res, next) => {
  const authConfig = await getAuthConfig()
  if (Object.keys(authConfig).length > 0) {
    try {
      const Authorization = req.header('Authorization')
      if (!Authorization)
        throw new Error('Error: 403 Forbidden')
      const token = Authorization.replace('Bearer ', '').trim()
      if (!(token in authConfig && authConfig[token].allow))
        throw new Error('Error: 403 Forbidden')
      next()
    }
    catch (error) {
      res.send({ status: 'Unauthorized', message: error.message ?? 'Please authenticate.', data: null })
    }
  }
  else {
    next()
  }
}

let authConfig = undefined

async function getAuthConfig() {
  authConfig = authConfig ?? JSON.parse(await fs.readFile('auth.json', 'utf8').catch(() => '{}'))
  return authConfig
}

async function isHavingAuth() {
  const authConfig = await getAuthConfig()
  return Object.keys(authConfig).length > 0
}

export { auth, getAuthConfig, isHavingAuth }
