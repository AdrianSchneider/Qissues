'use strict';

var blessed = require('blessed');

module.exports = function() {
  var box = new blessed.Box({
    name: 'canvas',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    autoPadding: true,
    border: {
      type: 'line',
      fg: 'lightblack'
    }
  });

  box.getInnerWidth = function(width) {
    var offset = 0;
    if (this.border.left) offset++;
    if (this.border.right) offset++;
    return '' + width + '-' + offset;
  };

  box.getInnerHeight = function(width) {
    var offset = 0;
    if (this.border.top) offset++;
    if (this.border.bottom) offset++;
    return '' + width + '-' + offset;
  };

  return box;
};
