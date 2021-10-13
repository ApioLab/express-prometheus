# express-prometheus

Based on [@trussle/tricorder](https://github.com/trussle/tricorder)

## Installation

```
npm i @apio/express-prometheus
```

## Usage

The module attaches a /metrics route to your app, this endpoint will output prometheus metrics

```
const expressPrometheus = require('@apio/express-prometheus')
const express = require('express')

// Setup your express app
const app = express()

// Instrument the app
expressPrometheus.instrument(app)
```

