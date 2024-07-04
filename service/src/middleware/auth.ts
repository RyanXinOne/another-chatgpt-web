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

async function getAuthConfig() {
  const fileContents = await fs.readFile('auth.json', 'utf8').catch(() => '{}')
  return JSON.parse(fileContents)
}

export { auth, getAuthConfig }
