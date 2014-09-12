var merge = require('cli-util').merge;

/**
 *  Represents a prompt definition.
 */
var PromptDefinition = function(options) {
  options = options || {};
  var k, v;
  for(k in options) {
    if(typeof this[k] === 'function') {
      continue;
    }
    v = options[k];
    this[k] = v;
  }
  this.options = options;
}

/**
 *  Copy this prompt definition.
 *
 *  Uses the initial state of this definition.
 */
PromptDefinition.prototype.copy = function() {
  return new PromptDefinition(this.options);
}

/**
 *  Clone this prompt definition.
 *
 *  Uses the current state of this definition.
 */
PromptDefinition.prototype.clone = function(overwrite) {
  overwrite = overwrite || {};
  var o = merge(this, {}, {copy: true});
  o = merge(overwrite, o);
  return new PromptDefinition(o);
}

module.exports = PromptDefinition;
