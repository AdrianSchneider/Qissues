'use strict';

var expect    = require('chai').expect;
var Promise   = require('bluebird');
var Container = require('../../../../src/app/services/container');

describe('Container', function() {

  beforeEach(function() {
    this.container = new Container();
  });

  it('Can set and get an asynchronous service', function() {
    this.container.registerService('test', function() {
      return Promise.resolve(5);
    });

    return this.container.get('test').then(function(value) {
      expect(value).to.equal(5);
    });
  });

  it('Passes the arguments to the service factory method', function() {
    this.container.registerService('a', function() { return Promise.resolve(1); });
    this.container.registerService('b', function() { return Promise.resolve(2); });
    this.container.registerService('test', function(a, b) {
      return Promise.resolve(a + b);
    }, ['a', 'b']);

    return this.container.get('test').then(function(value) {
      expect(value).to.equal(3);
    });
  });

  it('Doesnt run constructors more than once', function() {
    var invocations = 0;
    this.container.registerService('test', function() {
      invocations++;
      return Promise.resolve(1);
    });

    return this.container.get('test').bind(this)
      .then(function() { return this.container.get('test'); })
      .then(function() { return this.container.get('test'); })
      .then(function() {
        expect(invocations).to.equal(1);
      });
  });

  it('Doesnt simultaneous constructors for a slow loading service', function() {
    var invocations = 0;
    this.container.registerService('test', function() {
      invocations++;
      setTimeout(function() { return Promise.resolve(1); }, 10);
    });

    return this.container.get('test').bind(this)
      .then(function() { return this.container.get('test'); })
      .then(function() { return this.container.get('test'); })
      .then(function() {
        expect(invocations).to.equal(1);
      });
  });

  it('Throws an error when redefining a service', function() {
    this.container.registerService('a', function() { return Promise.resolve(1); });
    var f = function() {
      this.container.registerService('a', function() { return Promise.resolve(1); });
    }.bind(this);

    expect(f).to.throw(Error, 'replace');
  });

  it('Throws an error when getting an undefined service', function() {
    var f = function() { this.container.get('made up'); }.bind(this);
    expect(f).to.throw(ReferenceError);
  });

  it('Throws an error trying to register a non-callable service', function() {
    var f = function() { this.container.registerService('name', {}); }.bind(this);
    expect(f).to.throw(TypeError, 'is not callable');
  });

  it('#getMatching fetches multiple keys at once', function() {
    this.container.registerService('a', function() { return Promise.resolve(1); });
    this.container.registerService('b', function() { return Promise.resolve(2); });
    this.container.registerService('test', function(a, b) {
      return Promise.resolve(a + b);
    }, ['a', 'b']);

    return this.container.getMatching(['a', 'test']).spread(function(a, test) {
      expect(a).to.equal(1);
      expect(test).to.equal(3);
    });
  });

});
