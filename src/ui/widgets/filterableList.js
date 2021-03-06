'use strict';

var _            = require('underscore');
var util         = require('util');
var message      = require('./message');
var List         = require('./list');
var filterView   = require('../views/filters');
var reportsList  = require('../views/reports');
var Sequencer    = require('../events/sequencer');
var f            = require('../../util/f');
var Filter       = require('../../domain/model/filter');
var FilterSet    = require('../../domain/model/filterSet');
var Cancellation = require('../../domain/errors/cancellation');

/**
 * A list with built in filtering mechanisms
 */
function FilterableList(options) {
  List.call(this, options || {});

  if (!options.filters)   throw new Error('FilterableList requires options.filters');
  if (!options.reports)   throw new Error('FilterableList requires options.reports');
  if (!options.metadata)  throw new Error('FilterableList requires options.metadata');
  if (!options.report)    throw new Error('FilterableList requires options.report');
  if (!options.input)     throw new Error('FilterableList requires options.input');
  if (!options.keyConfig) throw new Error('FilterableList requires options.keyConfig');

  var self = this;
  var filters = options.filters;
  var metadata = options.metadata;
  var reports = options.reports;
  var activeReport = options.report;
  var keys = options.keyConfig;
  var input = options.input;

  /**
   * Sets up the filtering system
   */
  var construct = function() {
    (new Sequencer(self, keys.leader))
      .on(keys['filter.list'],     showFilters)
      .on(keys['filter.project'],  filter(metadata.getProjects, 'Project',  'project'))
      .on(keys['filter.assignee'], filter(metadata.getUsers,    'Assignee', 'assignee'))
      .on(keys['filter.type'],     filter(metadata.getTypes,    'Type',     'type'))
      .on(keys['filter.status'],   filter(metadata.getStatuses, 'Status',   'status'))
      .on(keys['filter.sprint'],   filter(f.prepend(metadata.getSprints,  'Active Sprints'), 'Sprint',   'sprint'))
      .on(keys['reports.save'],    reportsSave)
      .on(keys['reports.list'],    showReportsList);
  };

  var showFilters = function() {
    if (!filters.serialize().length) {
      return message(options.parent, 'No filters defined');
    }

    return filterView(options.parent, filters);
  };

  var filter = function(getOptions, message, type) {
    return function() {
      input.selectFromCallableList(message, getOptions)
        .then(Filter.addSelectedTo(filters, type))
        .catch(Cancellation, _.noop);
    };
  };

  var reportsSave = function() {
    input.ask('Save as')
      .then(function(name) { reports.addReport(name, filters); })
      .catch(Cancellation, _.noop);
  };

  var showReportsList = function() {
    reportsList(options.parent, options.reports, options.report);
  };

  construct();
  return self;
}

util.inherits(FilterableList, List);
module.exports = FilterableList;
