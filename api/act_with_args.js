require('seneca')()
  .add({ cmd: 'salestax' }, function (msg, respond) {
    var rate  = 0.23
    var total = msg.net * (1 + rate)
    respond(null, { total: total })
  })

  .act({cmd: 'salestax', net: 100}, function (err, res) {
    if (err) console.error(err)
    console.log('Total: ' + res.total)
  })
