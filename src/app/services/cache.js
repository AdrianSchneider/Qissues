'use strict';

var _      = require('underscore');
var moment = require('moment');
var crypto = require('crypto');

module.exports = function Cache(storage, clear, hasher) {
  var cache = this;
  var prefix = 'cache:';

  /**
   * Generate a unique ID for a given string
   * @param string str
   */
  var storageKey = hasher || function(str) {
    return crypto.createHash('md5').update(str).digest('hex');
  };

  /**
   * Attempt to get an item from cache
   *
   * @param string key
   * @param boolean invalidate
   */
  this.get = function(key, invalidate) {
    if (invalidate) return;

    var entry = storage.get(prefix + storageKey(key));
    if (entry && new Date(entry.expires) > new Date()) {
      return entry.data;
    }
  };

  /**
   * Set an item in cache
   */
  this.set = function(key, data, ttl) {
    storage.set(prefix + storageKey(key), {
      data: data,
      expires: moment().add(ttl || 3600, 'seconds').toDate()
    });
  };

  /**
   * Returns a function that caches the result
   *
   * @param {String} key
   * @param {Number|null} ttl
   * @return {Function}
   */
  this.setThenable = function(key, ttl) {
    return function(result) {
      cache.set(key, result, ttl);
      return result;
    };
  };

  this.setSerializedThenable = function(key, ttl) {
    return function(result) {
      cache.set(key, _.invoke(result, 'serialize'), ttl);
      return result;
    };
  };


  /**
   * Invalidate an item in the cache
   */
  this.invalidate = function(key) {
    storage.remove(prefix + storageKey(key));
  };

  /**
   * Invalidates all cache entries
   *
   * @param {Function} predicate
   */
  this.invalidateAll = function(predicate) {
    if (!predicate) predicate = _.constant(true);

    storage.removeMulti(
      storage.keys()
        .filter(function(item) {
          return item.indexOf(prefix) === 0;
        })
        .filter(function(item) {
          return predicate(item.substr(prefix.length));
        })
    );
  };

  /**
   * Purges expired entries from the cache
   */
  this.clean = function() {
    var now = new Date();
    var expired = [];

    storage.keys().filter(function(key) {
      return key.indexOf(prefix) === 0;
    }).forEach(function(key) {
      var value = storage.get(key);
      if(now > new Date(value.expires)) {
        expired.push(key.substr(prefix.length));
      }
    });

    storage.removeMulti(expired);
  };

  if (clear) this.invalidateAll();
};
