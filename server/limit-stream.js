const through = require('through2');

module.exports = function limiter (limit) {
  let len = 0;
  function write (ch, enc, next) {
    if (Buffer.isBuffer(ch)) {len += ch.length;}
    else {len += 1;}

    if (len >= limit) {this.destroy(new Error('Limit exceeded'));}
    else {this.push(ch);}

    next();
  }
  const stream = through(write);
  return stream;
};
