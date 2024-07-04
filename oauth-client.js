'use strict'

import { AuthorizationCode } from 'simple-oauth2'
import { jwtDecode } from 'jwt-decode'
import express from 'express'
import yaml from 'yaml'
import fs from 'fs'

const PORT = 2525
const REDIRECT_URI = `http://localhost:${PORT}/auth_callback`

function parseConfig() {
    try {
        const conf = fs.readFileSync('./config/oauth-config.yaml', 'utf8')
        return yaml.parse(conf)
    } catch (e) {
        console.error(e.message)
        console.info('Please copy one of the ./config/oauth-config-*.yaml templates to ./config/oauth-config.yaml and adapt the content!')
        process.exit(-1)
    }
}

// Unfortunately, the token content is very specific to the auth provider
function decodeToken(token) {
    return token.athlete // Strava
        || jwtDecode(token.id_token // Google
            || token.access_token) // Keycloak
}

const config = parseConfig()

const client = new AuthorizationCode({
    client: {
        id: config.clientId,
        secret: config.clientSecret,
    },
    auth: {
        authorizeHost: config.authHost,
        authorizePath: config.authPath,
        tokenHost: config.tokenHost,
        tokenPath: config.tokenPath,
    },
    options: {
        authorizationMethod: 'body'
    }
})


const authParams = {
    redirect_uri: REDIRECT_URI,
    state: '3(#0/!~',
}
if (config.scopes) {
    authParams.scope = config.scopes.join(',')
}
const authUri = client.authorizeURL(authParams)

const app = express()

app.get('/authorize', (req, res) => {
    console.log(authUri)
    res.redirect(authUri)
})

// Callback service parsing the authorization token and asking for the access token
app.get('/auth_callback', async (req, res) => {
    const { code } = req.query
    const tokenParams = {
        code,
        redirect_uri: REDIRECT_URI,
    }

    try {
        const token = await client.getToken(tokenParams)
        console.log('Token:', token.token)
        const decoded = decodeToken(token.token)
        const formatted = `<body><pre>${JSON.stringify(decoded, null, 4)}</pre></body>`
        return res.status(200).send(formatted)
    } catch (error) {
        console.error('Token Error', error)
        return res.status(500).json('Authentication failed')
    }
})

app.get('/', (req, res) => {
    res.send(`<a href="/authorize">Login with ${config.provider}</a>`)
})

app.listen(PORT, (err) => {
    if (err) {
        return console.error('Error', err)
    }
    console.log(`Simple OAuth2 client listening at http://localhost:${PORT}`)
})