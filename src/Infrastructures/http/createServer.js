const Hapi = require('@hapi/hapi')
const Jwt = require('@hapi/jwt')
const ClientError = require('../../Commons/exceptions/ClientError')
const DomainErrorTranslator = require('../../Commons/exceptions/DomainErrorTranslator')
const users = require('../../Interfaces/http/api/users')
const authentications = require('../../Interfaces/http/api/authentications')
const threads = require('../../Interfaces/http/api/threads')
const comments = require('../../Interfaces/http/api/comments')
const replies = require('../../Interfaces/http/api/replies')
const likes = require('../../Interfaces/http/api/likes')

const createServer = async (injections) => {
  const server = Hapi.server({
    host: process.env.HOST,
    port: process.env.PORT,
  })

  await server.register([
    {
      plugin: users,
      options: { injections },
    },
    {
      plugin: authentications,
      options: { injections },
    },
    {
      plugin: threads,
      options: { injections },
    },
    {
      plugin: comments,
      options: { injections },
    },
    {
      plugin: replies,
      options: { injections },
    },
    {
      plugin: likes,
      options: { injections },
    },
    {
      plugin: Jwt,
    },
  ])

  server.auth.strategy('jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: 'urn:audience:test',
      iss: 'urn:issuer:test',
      sub: false,
      nbf: true,
      exp: true,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
      timeSkewSec: 15,
    },
    validate: (artifacts, request, h) => ({
      isValid: true,
      credentials: {
        user: {
          id: artifacts.decoded.payload.id,
          username: artifacts.decoded.payload.username,
        },
      },
    }),
  })

  // Set the strategy

  server.auth.default('jwt')

  server.ext('onPreResponse', (request, h) => {
    // mendapatkan konteks response dari request
    const { response } = request

    if (response instanceof Error) {
      // bila response tersebut error, tangani sesuai kebutuhan
      const translatedError = DomainErrorTranslator.translate(response)

      // penanganan client error secara internal.
      if (translatedError instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: translatedError.message,
        })
        newResponse.code(translatedError.statusCode)
        return newResponse
      }

      // mempertahankan penanganan client error oleh hapi secara native, seperti 404, etc.
      if (!translatedError.isServer) {
        return h.continue
      }

      // penanganan server error sesuai kebutuhan
      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      })
      newResponse.code(500)
      return newResponse
    }

    // jika bukan error, lanjutkan dengan response sebelumnya (tanpa terintervensi)
    return h.continue
  })

  return server
}

module.exports = createServer
