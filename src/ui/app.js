'use strict';

var _                = require("underscore");
var f                = require('../util/f');
var Promise          = require('bluebird');
var views            = require('./views');
var UserInput        = require('./input');
var messageWidget    = require('./widgets/message');
var canvas           = require('./views/canvas');
var NewComment       = require('../domain/model/newComment');
var Cancellation     = require('../domain/errors/cancellation');
var ValidationError  = require('../domain/errors/validation');
var MoreInfoRequired = require('../domain/errors/infoRequired');

/**
 * Main Qissues application
 *
 * @param {blessed.screen} screen
 * @param {Application} application
 */
module.exports = function BlessedApplication(screen, app, input, logger, format, keys, getDeps) {
  var ui = this;
  this.screen = screen;
  getDeps().spread(function(controller, views) {
    ui.controller = controller;
    ui.views = views;
  });

  /**
   * Starts up the user interface
   *
   * @param {String|null} action
   * @param {String|null} id
   */
  ui.start = function(action, id) {
    getDeps().then(function() {
      ui.canvas = canvas(screen);
      screen.append(ui.canvas);
      screen.render();

      logger.debug('Booting up ui');

      if(!action) action = 'listIssues';
      ui.controller[action](id);

      app.getActiveReport().on('change', function() {
        ui.controller.listIssues();
      });

      screen.key(keys.help, _.partial(ui.controller.help, screen));
      screen.key(keys.exit, function() { app.exit(0); });
      screen.key(keys['issue.lookup'], function() {
        input.ask('Open Issue', ui.canvas)
          .then(ui.controller.viewIssue)
          .catch(Cancellation, _.noop);
      });
    });
  };

  /**
   * Capture expectations from the user
   *
   * @param {Expectations} expectations
   * @param {Object} defaults
   * @param {String} draft - last editing attempt
   * @param {Error} error - last error
   */
  this.capture = function(expectations, defaults, draft, error) {
    var data = {};
    return format.seed(expectations, defaults, draft, error)
      .then(input.editExternally)
      .then(f.tee(data, 'content'))
      .then(format.parse)
      .then(expectations.ensureValid)
      .catch(ValidationError, function(e) {
        return ui.capture(expectations, defaults, data.content, error);
      });
  };

  /**
   * Clears the screen and draws a loading indicator
   * @param {String|null} msg
   */
  ui.showLoading = function(msg) {
    ui.clearScreen();
    var alert = messageWidget(ui.canvas, msg || 'Loading...', Infinity);
    ui.canvas.append(alert);
    screen.render();
  };

  /**
   * Clears the screen
   */
  ui.clearScreen = function() {
    ui.canvas.children.forEach(function(child) { ui.canvas.remove(child); });
    screen.render();
  };

  /**
   * Shows a thenable message
   *
   * @param {String} msg
   * @param {Number} delay
   * @return {Promise}
   */
  ui.message = function(msg, delay) {
    if(!delay) delay = 1000;
    return new Promise(function(resolve, reject) {
      var m = messageWidget(ui.canvas, msg, delay);
      setTimeout(function() { resolve(); }, delay);
    });
  };

};
