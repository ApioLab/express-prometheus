const client = require('prom-client')

client.collectDefaultMetrics()

const metric = {
  http: {
    requests: {
      clients: new client.Gauge({
        name: 'http_requests_processing',
        help: 'Http requests in progress',
        labelNames: ['method', 'path', 'status']
      }),
      throughput: new client.Counter({
        name: 'http_requests_total',
        help: 'Http request throughput',
        labelNames: ['method', 'path', 'status']
      }),
      duration: new client.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Request duration histogram in seconds',
        labelNames: ['method', 'path', 'status']
      })
    }
  }
}

const defaultOptions = options => {
  options = options || {}
  options.url = options.url || '/metrics'
  return options
}

const isPathExcluded = (options, path) => {
  if (!options.excludePaths) {
    return false
  } else {
    return options.excludePaths.some(pathToExclude => {
      const regExp = new RegExp(pathToExclude)
      return regExp.test(path)
    })
  }
}

const instrument = (server, options) => {
  const opt = defaultOptions(options)

  const middleware = (req, res, next) => {
    // If path is the excluded paths list, we don't add a metric for it :)
    if (isPathExcluded(opt, req.path)) {
      return next()
    }

    if (req.path !== opt.url) {
      const end = metric.http.requests.duration.startTimer()
      metric.http.requests.clients.inc(1, Date.now())

      res.on('finish', () => {
        const labels = {
          method: req.method,
          path: req.route ? req.baseUrl + req.route.path : req.path,
          status: res.statusCode
        }

        metric.http.requests.clients.dec(1, Date.now())
        metric.http.requests.throughput.inc(labels, 1, Date.now())
        end(labels)
      })
    }

    return next()
  }

  server.use(middleware)

  server.get(opt.url, async (req, res, next) => {
    try {
      res.header('content-type', 'text/plain; charset=utf-8')
      res.send(await client.register.metrics())
    } catch (e) {
      next(e)
    }
  })
}

module.exports = {
  client,
  instrument
}
