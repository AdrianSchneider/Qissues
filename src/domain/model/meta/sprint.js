'use strict';

function Sprint(id, name) {

  this.getId = function() {
    return id;
  };

  this.getName = function() {
    return name;
  };

  this.toString = function() {
    return name;
  };

  this.serialize = function() {
    return {
      id: id,
      name: name
    };
  };

}

Sprint.unserialize = function(json) {
  return new Sprint(json.id, json.name);
};

module.exports = Sprint;
