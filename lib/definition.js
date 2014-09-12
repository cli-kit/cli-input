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
PromptDefinition.prototype.clone = function() {
  return new PromptDefinition(this);
}

module.exports = PromptDefinition;
