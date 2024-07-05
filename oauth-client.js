'use strict'

import { AuthorizationCode } from 'simple-oauth2'
import { jwtDecode } from 'jwt-decode'
import express from 'express'
import yaml from 'yaml'
import fs from 'fs'

const PORT = 2525
const REDIRECT_URI = `http://localhost:${PORT}/auth_callback`

const config = parseConfig()

//
// OAuth client config
//

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

// Unfortunately, different OAuth providers expect different scope separators
const scopeSeparator = config.provider === 'Strava' ? ',' : ' '
const scope = config.scopes && config.scopes.join(scopeSeparator)

const authorizeUrl = client.authorizeURL({
    redirect_uri: REDIRECT_URI,
    state: '3(#0/!~',
    ...(scope && { scope })
})

//
// Express app setup
//

const app = express()

app.get('/authorize', (req, res) => {
    console.log(authorizeUrl)
    res.redirect(authorizeUrl)
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
        const decoded = decodeToken(config.provider, token.token)
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

//
// Helper functions
//

function parseConfig() {
    try {
        const conf = fs.readFileSync('./config.yaml', 'utf8')
        return yaml.parse(conf)
    } catch (e) {
        console.error(e.message)
        console.info('Please copy one of the ./templates/config-*.yaml templates to ./config.yaml and adapt the content!')
        process.exit(-1)
    }
}

// Unfortunately, the token content is very specific to the auth provider
function decodeToken(provider, token) {
    switch (provider) {
        case 'GitHub':
            return token // Nothing to decode
        case 'Google':
            return jwtDecode(token.id_token)
        case 'Keycloak':
            return jwtDecode(token.access_token)
        case 'Strava':
            return token.athlete
        default:
            console.warn('Unknown auth provider ', provider)
            return token
    }
}
