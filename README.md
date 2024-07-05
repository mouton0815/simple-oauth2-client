# Simple OAuth2 Client

This is a simple Node.js script based on library [simple-oauth2](https://github.com/lelylan/simple-oauth2).
It triggers an [authorization code grant](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1) process
with a configurable identity server, for example Google.
On success, the script prints the JWT content on the console and the decoded token in the browser.

# Installation
You need a [Node.js](https://nodejs.org/en/download/package-manager) installation with `npm`.

```shell
npm install
```

# Configuring
You need to create an OAuth client in the identity provider of choice.

For example, a Google client can be created at https://console.cloud.google.com/apis/credentials.

Make sure to add the following URL to the list of **Authorized redirect URIs**:
```
http://localhost:2525/auth_callback
```

Then copy a config template:
```shell
cp templates/config-google.yaml config.yaml
```
Open `config.yaml` and fill in the `clientId`and `clientSecret` of your (newly created) OAuth client.

For Google, both the client ID and the client secret are shown on Credentials page.
Other identy provider may require to explicitly "unhide" the client secret.

# Running

```shell
npm start
```
The point your browser to http://localhost:2525

```shell
open http://localhost:2525
```

