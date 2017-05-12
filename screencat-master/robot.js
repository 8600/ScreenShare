/* global screen */
var robot = require('robotjs')
window.robot = robot
var vkey = require('vkey')

module.exports = function createEvents (data) {
  if (data.click) {
    var x = scale(data.clientX, 0, data.canvasWidth, 0, screen.width)
    var y = scale(data.clientY, 0, data.canvasHeight, 0, screen.height)
    var pos = robot.getMousePos() // hosts current x/y
    robot.moveMouse(x, y) // move to remotes pos
    robot.mouseToggle('up', 'left') // set mouse position to up
    robot.mouseClick() // click on remote click spot
    robot.moveMouse(pos.x, pos.y) // go back to hosts position
  }

  if (data.keyCode) {
    var k = vkey[data.keyCode].toLowerCase()
    if (k === '<space>') k = ' '
    var modifiers = []
    if (data.shift) modifiers.push('shift')
    if (data.control) modifiers.push('control')
    if (data.alt) modifiers.push('alt')
    if (data.meta) modifiers.push('command')
    if (k[0] !== '<') {
      console.log('typed ' + k + ' ' + JSON.stringify(modifiers))
      if (modifiers[0]) robot.keyTap(k, modifiers[0])
      else robot.keyTap(k)
    } else {
      if (k === '<enter>') robot.keyTap('enter')
      else if (k === '<backspace>') robot.keyTap('backspace')
      else if (k === '<up>') robot.keyTap('up')
      else if (k === '<down>') robot.keyTap('down')
      else if (k === '<left>') robot.keyTap('left')
      else if (k === '<right>') robot.keyTap('right')
      else if (k === '<delete>') robot.keyTap('delete')
      else if (k === '<home>') robot.keyTap('home')
      else if (k === '<end>') robot.keyTap('end')
      else if (k === '<page-up>') robot.keyTap('pageup')
      else if (k === '<page-down>') robot.keyTap('pagedown')
      else console.log('did not type ' + k)
    }
  }
}

function scale (x, fromLow, fromHigh, toLow, toHigh) {
  return (x - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow
}
