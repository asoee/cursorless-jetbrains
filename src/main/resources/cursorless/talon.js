var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/.pnpm/nearley@2.20.1_patch_hash=mg2fc7wgvzub3myuz6m74hllma/node_modules/nearley/lib/nearley.js
var require_nearley = __commonJS({
  "../../node_modules/.pnpm/nearley@2.20.1_patch_hash=mg2fc7wgvzub3myuz6m74hllma/node_modules/nearley/lib/nearley.js"(exports2, module2) {
    (function(root2, factory) {
      if (typeof module2 === "object" && module2.exports) {
        module2.exports = factory();
      } else {
        root2.nearley = factory();
      }
    })(exports2, function() {
      function Rule(name, symbols2, postprocess) {
        this.id = ++Rule.highestId;
        this.name = name;
        this.symbols = symbols2;
        this.postprocess = postprocess;
        return this;
      }
      Rule.highestId = 0;
      Rule.prototype.toString = function(withCursorAt) {
        var symbolSequence = typeof withCursorAt === "undefined" ? this.symbols.map(getSymbolShortDisplay).join(" ") : this.symbols.slice(0, withCursorAt).map(getSymbolShortDisplay).join(" ") + " \u25CF " + this.symbols.slice(withCursorAt).map(getSymbolShortDisplay).join(" ");
        return this.name + " \u2192 " + symbolSequence;
      };
      function State2(rule, dot, reference, wantedBy) {
        this.rule = rule;
        this.dot = dot;
        this.reference = reference;
        this.data = [];
        this.wantedBy = wantedBy;
        this.isComplete = this.dot === rule.symbols.length;
      }
      State2.prototype.toString = function() {
        return "{" + this.rule.toString(this.dot) + "}, from: " + (this.reference || 0);
      };
      State2.prototype.nextState = function(child) {
        var state = new State2(this.rule, this.dot + 1, this.reference, this.wantedBy);
        state.left = this;
        state.right = child;
        if (state.isComplete) {
          state.data = state.build();
          state.right = void 0;
        }
        return state;
      };
      State2.prototype.build = function() {
        var children = [];
        var node = this;
        do {
          children.push(node.right.data);
          node = node.left;
        } while (node.left);
        children.reverse();
        return children;
      };
      State2.prototype.finish = function() {
        if (this.rule.postprocess) {
          this.data = this.rule.postprocess(this.data, this.reference, Parser2.fail);
        }
      };
      function Column(grammar2, index) {
        this.grammar = grammar2;
        this.index = index;
        this.states = [];
        this.wants = {};
        this.scannable = [];
        this.completed = {};
      }
      Column.prototype.process = function(nextColumn) {
        var states = this.states;
        var wants = this.wants;
        var completed = this.completed;
        for (var w = 0; w < states.length; w++) {
          var state = states[w];
          if (state.isComplete) {
            state.finish();
            if (state.data !== Parser2.fail) {
              var wantedBy = state.wantedBy;
              for (var i = wantedBy.length; i--; ) {
                var left = wantedBy[i];
                this.complete(left, state);
              }
              if (state.reference === this.index) {
                var exp = state.rule.name;
                (this.completed[exp] = this.completed[exp] || []).push(state);
              }
            }
          } else {
            var exp = state.rule.symbols[state.dot];
            if (typeof exp !== "string") {
              this.scannable.push(state);
              continue;
            }
            if (wants[exp]) {
              wants[exp].push(state);
              if (completed.hasOwnProperty(exp)) {
                var nulls = completed[exp];
                for (var i = 0; i < nulls.length; i++) {
                  var right = nulls[i];
                  this.complete(state, right);
                }
              }
            } else {
              wants[exp] = [state];
              this.predict(exp);
            }
          }
        }
      };
      Column.prototype.predict = function(exp) {
        var rules = this.grammar.byName[exp] || [];
        for (var i = 0; i < rules.length; i++) {
          var r = rules[i];
          var wantedBy = this.wants[exp];
          var s = new State2(r, 0, this.index, wantedBy);
          this.states.push(s);
        }
      };
      Column.prototype.complete = function(left, right) {
        var copy = left.nextState(right);
        this.states.push(copy);
      };
      function Grammar2(rules, start) {
        this.rules = rules;
        this.start = start || this.rules[0].name;
        var byName = this.byName = {};
        this.rules.forEach(function(rule) {
          if (!byName.hasOwnProperty(rule.name)) {
            byName[rule.name] = [];
          }
          byName[rule.name].push(rule);
        });
      }
      Grammar2.fromCompiled = function(rules, start) {
        var lexer2 = rules.Lexer;
        if (rules.ParserStart) {
          start = rules.ParserStart;
          rules = rules.ParserRules;
        }
        var rules = rules.map(function(r) {
          return new Rule(r.name, r.symbols, r.postprocess);
        });
        var g = new Grammar2(rules, start);
        g.lexer = lexer2;
        return g;
      };
      function StreamLexer() {
        this.reset("");
      }
      StreamLexer.prototype.reset = function(data, state) {
        this.buffer = data;
        this.index = 0;
        this.line = state ? state.line : 1;
        this.lastLineBreak = state ? -state.col : 0;
      };
      StreamLexer.prototype.next = function() {
        if (this.index < this.buffer.length) {
          var ch = this.buffer[this.index++];
          if (ch === "\n") {
            this.line += 1;
            this.lastLineBreak = this.index;
          }
          return { value: ch };
        }
      };
      StreamLexer.prototype.save = function() {
        return {
          line: this.line,
          col: this.index - this.lastLineBreak
        };
      };
      StreamLexer.prototype.formatError = function(token, message) {
        var buffer = this.buffer;
        if (typeof buffer === "string") {
          var lines = buffer.split("\n").slice(
            Math.max(0, this.line - 5),
            this.line
          );
          var nextLineBreak = buffer.indexOf("\n", this.index);
          if (nextLineBreak === -1) nextLineBreak = buffer.length;
          var col = this.index - this.lastLineBreak;
          var lastLineDigits = String(this.line).length;
          message += " at line " + this.line + " col " + col + ":\n\n";
          message += lines.map(function(line, i) {
            return pad(this.line - lines.length + i + 1, lastLineDigits) + " " + line;
          }, this).join("\n");
          message += "\n" + pad("", lastLineDigits + col) + "^\n";
          return message;
        } else {
          return message + " at index " + (this.index - 1);
        }
        function pad(n, length) {
          var s = String(n);
          return Array(length - s.length + 1).join(" ") + s;
        }
      };
      function Parser2(rules, start, options2) {
        if (rules instanceof Grammar2) {
          var grammar2 = rules;
          var options2 = start;
        } else {
          var grammar2 = Grammar2.fromCompiled(rules, start);
        }
        this.grammar = grammar2;
        this.options = {
          keepHistory: false,
          lexer: grammar2.lexer || new StreamLexer()
        };
        for (var key in options2 || {}) {
          this.options[key] = options2[key];
        }
        this.lexer = this.options.lexer;
        this.lexerState = void 0;
        var column = new Column(grammar2, 0);
        var table = this.table = [column];
        column.wants[grammar2.start] = [];
        column.predict(grammar2.start);
        column.process();
        this.current = 0;
      }
      Parser2.fail = {};
      Parser2.prototype.feed = function(chunk) {
        var lexer2 = this.lexer;
        lexer2.reset(chunk, this.lexerState);
        var token;
        while (true) {
          try {
            token = lexer2.next();
            if (!token) {
              break;
            }
          } catch (e) {
            var nextColumn = new Column(this.grammar, this.current + 1);
            this.table.push(nextColumn);
            var err = new Error(this.reportLexerError(e));
            err.offset = this.current;
            err.token = e.token;
            throw err;
          }
          var column = this.table[this.current];
          if (!this.options.keepHistory) {
            delete this.table[this.current - 1];
          }
          var n = this.current + 1;
          var nextColumn = new Column(this.grammar, n);
          this.table.push(nextColumn);
          var literal = token.text !== void 0 ? token.text : token.value;
          var value = lexer2.constructor === StreamLexer ? token.value : lexer2.transform?.(token) ?? token;
          var scannable = column.scannable;
          for (var w = scannable.length; w--; ) {
            var state = scannable[w];
            var expect = state.rule.symbols[state.dot];
            if (expect.test ? expect.test(value) : expect.type ? expect.type === token.type : expect.literal === literal) {
              var next = state.nextState({ data: value, token, isToken: true, reference: n - 1 });
              nextColumn.states.push(next);
            }
          }
          nextColumn.process();
          if (nextColumn.states.length === 0) {
            var err = new Error(this.reportError(token));
            err.offset = this.current;
            err.token = token;
            throw err;
          }
          if (this.options.keepHistory) {
            column.lexerState = lexer2.save();
          }
          this.current++;
        }
        if (column) {
          this.lexerState = lexer2.save();
        }
        this.results = this.finish();
        return this;
      };
      Parser2.prototype.reportLexerError = function(lexerError) {
        var tokenDisplay, lexerMessage;
        var token = lexerError.token;
        if (token) {
          tokenDisplay = "input " + JSON.stringify(token.text[0]) + " (lexer error)";
          lexerMessage = this.lexer.formatError(token, "Syntax error");
        } else {
          tokenDisplay = "input (lexer error)";
          lexerMessage = lexerError.message;
        }
        return this.reportErrorCommon(lexerMessage, tokenDisplay);
      };
      Parser2.prototype.reportError = function(token) {
        var tokenDisplay = (token.type ? token.type + " token: " : "") + JSON.stringify(token.value !== void 0 ? token.value : token);
        var lexerMessage = this.lexer.formatError(token, "Syntax error");
        return this.reportErrorCommon(lexerMessage, tokenDisplay);
      };
      Parser2.prototype.reportErrorCommon = function(lexerMessage, tokenDisplay) {
        var lines = [];
        lines.push(lexerMessage);
        var lastColumnIndex = this.table.length - 2;
        var lastColumn = this.table[lastColumnIndex];
        var expectantStates = lastColumn.states.filter(function(state) {
          var nextSymbol = state.rule.symbols[state.dot];
          return nextSymbol && typeof nextSymbol !== "string";
        });
        if (expectantStates.length === 0) {
          lines.push("Unexpected " + tokenDisplay + ". I did not expect any more input. Here is the state of my parse table:\n");
          this.displayStateStack(lastColumn.states, lines);
        } else {
          lines.push("Unexpected " + tokenDisplay + ". Instead, I was expecting to see one of the following:\n");
          var stateStacks = expectantStates.map(function(state) {
            return this.buildFirstStateStack(state, []) || [state];
          }, this);
          stateStacks.forEach(function(stateStack) {
            var state = stateStack[0];
            var nextSymbol = state.rule.symbols[state.dot];
            var symbolDisplay = this.getSymbolDisplay(nextSymbol);
            lines.push("A " + symbolDisplay + " based on:");
            this.displayStateStack(stateStack, lines);
          }, this);
        }
        lines.push("");
        return lines.join("\n");
      };
      Parser2.prototype.displayStateStack = function(stateStack, lines) {
        var lastDisplay;
        var sameDisplayCount = 0;
        for (var j = 0; j < stateStack.length; j++) {
          var state = stateStack[j];
          var display = state.rule.toString(state.dot);
          if (display === lastDisplay) {
            sameDisplayCount++;
          } else {
            if (sameDisplayCount > 0) {
              lines.push("    ^ " + sameDisplayCount + " more lines identical to this");
            }
            sameDisplayCount = 0;
            lines.push("    " + display);
          }
          lastDisplay = display;
        }
      };
      Parser2.prototype.getSymbolDisplay = function(symbol) {
        return getSymbolLongDisplay(symbol);
      };
      Parser2.prototype.buildFirstStateStack = function(state, visited) {
        if (visited.indexOf(state) !== -1) {
          return null;
        }
        if (state.wantedBy.length === 0) {
          return [state];
        }
        var prevState = state.wantedBy[0];
        var childVisited = [state].concat(visited);
        var childResult = this.buildFirstStateStack(prevState, childVisited);
        if (childResult === null) {
          return null;
        }
        return [state].concat(childResult);
      };
      Parser2.prototype.save = function() {
        var column = this.table[this.current];
        column.lexerState = this.lexerState;
        return column;
      };
      Parser2.prototype.restore = function(column) {
        var index = column.index;
        this.current = index;
        this.table[index] = column;
        this.table.splice(index + 1);
        this.lexerState = column.lexerState;
        this.results = this.finish();
      };
      Parser2.prototype.rewind = function(index) {
        if (!this.options.keepHistory) {
          throw new Error("set option `keepHistory` to enable rewinding");
        }
        this.restore(this.table[index]);
      };
      Parser2.prototype.finish = function() {
        var considerations = [];
        var start = this.grammar.start;
        var column = this.table[this.table.length - 1];
        column.states.forEach(function(t) {
          if (t.rule.name === start && t.dot === t.rule.symbols.length && t.reference === 0 && t.data !== Parser2.fail) {
            considerations.push(t);
          }
        });
        return considerations.map(function(c) {
          return c.data;
        });
      };
      function getSymbolLongDisplay(symbol) {
        var type2 = typeof symbol;
        if (type2 === "string") {
          return symbol;
        } else if (type2 === "object") {
          if (symbol.literal) {
            return JSON.stringify(symbol.literal);
          } else if (symbol instanceof RegExp) {
            return "character matching " + symbol;
          } else if (symbol.type) {
            return symbol.type + " token";
          } else if (symbol.test) {
            return "token matching " + String(symbol.test);
          } else {
            throw new Error("Unknown symbol type: " + symbol);
          }
        }
      }
      function getSymbolShortDisplay(symbol) {
        var type2 = typeof symbol;
        if (type2 === "string") {
          return symbol;
        } else if (type2 === "object") {
          if (symbol.literal) {
            return JSON.stringify(symbol.literal);
          } else if (symbol instanceof RegExp) {
            return symbol.toString();
          } else if (symbol.type) {
            return "%" + symbol.type;
          } else if (symbol.test) {
            return "<" + String(symbol.test) + ">";
          } else {
            throw new Error("Unknown symbol type: " + symbol);
          }
        }
      }
      return {
        Parser: Parser2,
        Grammar: Grammar2,
        Rule
      };
    });
  }
});

// ../../node_modules/.pnpm/moo@0.5.2/node_modules/moo/moo.js
var require_moo = __commonJS({
  "../../node_modules/.pnpm/moo@0.5.2/node_modules/moo/moo.js"(exports2, module2) {
    (function(root2, factory) {
      if (typeof define === "function" && define.amd) {
        define([], factory);
      } else if (typeof module2 === "object" && module2.exports) {
        module2.exports = factory();
      } else {
        root2.moo = factory();
      }
    })(exports2, function() {
      "use strict";
      var hasOwnProperty13 = Object.prototype.hasOwnProperty;
      var toString3 = Object.prototype.toString;
      var hasSticky = typeof new RegExp().sticky === "boolean";
      function isRegExp(o) {
        return o && toString3.call(o) === "[object RegExp]";
      }
      function isObject4(o) {
        return o && typeof o === "object" && !isRegExp(o) && !Array.isArray(o);
      }
      function reEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      }
      function reGroups(s) {
        var re = new RegExp("|" + s);
        return re.exec("").length - 1;
      }
      function reCapture(s) {
        return "(" + s + ")";
      }
      function reUnion(regexps) {
        if (!regexps.length) return "(?!)";
        var source = regexps.map(function(s) {
          return "(?:" + s + ")";
        }).join("|");
        return "(?:" + source + ")";
      }
      function regexpOrLiteral(obj) {
        if (typeof obj === "string") {
          return "(?:" + reEscape(obj) + ")";
        } else if (isRegExp(obj)) {
          if (obj.ignoreCase) throw new Error("RegExp /i flag not allowed");
          if (obj.global) throw new Error("RegExp /g flag is implied");
          if (obj.sticky) throw new Error("RegExp /y flag is implied");
          if (obj.multiline) throw new Error("RegExp /m flag is implied");
          return obj.source;
        } else {
          throw new Error("Not a pattern: " + obj);
        }
      }
      function pad(s, length) {
        if (s.length > length) {
          return s;
        }
        return Array(length - s.length + 1).join(" ") + s;
      }
      function lastNLines(string2, numLines) {
        var position = string2.length;
        var lineBreaks = 0;
        while (true) {
          var idx = string2.lastIndexOf("\n", position - 1);
          if (idx === -1) {
            break;
          } else {
            lineBreaks++;
          }
          position = idx;
          if (lineBreaks === numLines) {
            break;
          }
          if (position === 0) {
            break;
          }
        }
        var startPosition = lineBreaks < numLines ? 0 : position + 1;
        return string2.substring(startPosition).split("\n");
      }
      function objectToRules(object) {
        var keys2 = Object.getOwnPropertyNames(object);
        var result = [];
        for (var i = 0; i < keys2.length; i++) {
          var key = keys2[i];
          var thing = object[key];
          var rules = [].concat(thing);
          if (key === "include") {
            for (var j = 0; j < rules.length; j++) {
              result.push({ include: rules[j] });
            }
            continue;
          }
          var match = [];
          rules.forEach(function(rule) {
            if (isObject4(rule)) {
              if (match.length) result.push(ruleOptions(key, match));
              result.push(ruleOptions(key, rule));
              match = [];
            } else {
              match.push(rule);
            }
          });
          if (match.length) result.push(ruleOptions(key, match));
        }
        return result;
      }
      function arrayToRules(array) {
        var result = [];
        for (var i = 0; i < array.length; i++) {
          var obj = array[i];
          if (obj.include) {
            var include = [].concat(obj.include);
            for (var j = 0; j < include.length; j++) {
              result.push({ include: include[j] });
            }
            continue;
          }
          if (!obj.type) {
            throw new Error("Rule has no type: " + JSON.stringify(obj));
          }
          result.push(ruleOptions(obj.type, obj));
        }
        return result;
      }
      function ruleOptions(type2, obj) {
        if (!isObject4(obj)) {
          obj = { match: obj };
        }
        if (obj.include) {
          throw new Error("Matching rules cannot also include states");
        }
        var options2 = {
          defaultType: type2,
          lineBreaks: !!obj.error || !!obj.fallback,
          pop: false,
          next: null,
          push: null,
          error: false,
          fallback: false,
          value: null,
          type: null,
          shouldThrow: false
        };
        for (var key in obj) {
          if (hasOwnProperty13.call(obj, key)) {
            options2[key] = obj[key];
          }
        }
        if (typeof options2.type === "string" && type2 !== options2.type) {
          throw new Error("Type transform cannot be a string (type '" + options2.type + "' for token '" + type2 + "')");
        }
        var match = options2.match;
        options2.match = Array.isArray(match) ? match : match ? [match] : [];
        options2.match.sort(function(a, b) {
          return isRegExp(a) && isRegExp(b) ? 0 : isRegExp(b) ? -1 : isRegExp(a) ? 1 : b.length - a.length;
        });
        return options2;
      }
      function toRules(spec) {
        return Array.isArray(spec) ? arrayToRules(spec) : objectToRules(spec);
      }
      var defaultErrorRule = ruleOptions("error", { lineBreaks: true, shouldThrow: true });
      function compileRules(rules, hasStates) {
        var errorRule = null;
        var fast = /* @__PURE__ */ Object.create(null);
        var fastAllowed = true;
        var unicodeFlag = null;
        var groups = [];
        var parts = [];
        for (var i = 0; i < rules.length; i++) {
          if (rules[i].fallback) {
            fastAllowed = false;
          }
        }
        for (var i = 0; i < rules.length; i++) {
          var options2 = rules[i];
          if (options2.include) {
            throw new Error("Inheritance is not allowed in stateless lexers");
          }
          if (options2.error || options2.fallback) {
            if (errorRule) {
              if (!options2.fallback === !errorRule.fallback) {
                throw new Error("Multiple " + (options2.fallback ? "fallback" : "error") + " rules not allowed (for token '" + options2.defaultType + "')");
              } else {
                throw new Error("fallback and error are mutually exclusive (for token '" + options2.defaultType + "')");
              }
            }
            errorRule = options2;
          }
          var match = options2.match.slice();
          if (fastAllowed) {
            while (match.length && typeof match[0] === "string" && match[0].length === 1) {
              var word = match.shift();
              fast[word.charCodeAt(0)] = options2;
            }
          }
          if (options2.pop || options2.push || options2.next) {
            if (!hasStates) {
              throw new Error("State-switching options are not allowed in stateless lexers (for token '" + options2.defaultType + "')");
            }
            if (options2.fallback) {
              throw new Error("State-switching options are not allowed on fallback tokens (for token '" + options2.defaultType + "')");
            }
          }
          if (match.length === 0) {
            continue;
          }
          fastAllowed = false;
          groups.push(options2);
          for (var j = 0; j < match.length; j++) {
            var obj = match[j];
            if (!isRegExp(obj)) {
              continue;
            }
            if (unicodeFlag === null) {
              unicodeFlag = obj.unicode;
            } else if (unicodeFlag !== obj.unicode && options2.fallback === false) {
              throw new Error("If one rule is /u then all must be");
            }
          }
          var pat = reUnion(match.map(regexpOrLiteral));
          var regexp = new RegExp(pat);
          if (regexp.test("")) {
            throw new Error("RegExp matches empty string: " + regexp);
          }
          var groupCount = reGroups(pat);
          if (groupCount > 0) {
            throw new Error("RegExp has capture groups: " + regexp + "\nUse (?: \u2026 ) instead");
          }
          if (!options2.lineBreaks && regexp.test("\n")) {
            throw new Error("Rule should declare lineBreaks: " + regexp);
          }
          parts.push(reCapture(pat));
        }
        var fallbackRule = errorRule && errorRule.fallback;
        var flags = hasSticky && !fallbackRule ? "ym" : "gm";
        var suffix = hasSticky || fallbackRule ? "" : "|";
        if (unicodeFlag === true) flags += "u";
        var combined = new RegExp(reUnion(parts) + suffix, flags);
        return { regexp: combined, groups, fast, error: errorRule || defaultErrorRule };
      }
      function compile(rules) {
        var result = compileRules(toRules(rules));
        return new Lexer({ start: result }, "start");
      }
      function checkStateGroup(g, name, map3) {
        var state = g && (g.push || g.next);
        if (state && !map3[state]) {
          throw new Error("Missing state '" + state + "' (in token '" + g.defaultType + "' of state '" + name + "')");
        }
        if (g && g.pop && +g.pop !== 1) {
          throw new Error("pop must be 1 (in token '" + g.defaultType + "' of state '" + name + "')");
        }
      }
      function compileStates(states, start) {
        var all = states.$all ? toRules(states.$all) : [];
        delete states.$all;
        var keys2 = Object.getOwnPropertyNames(states);
        if (!start) start = keys2[0];
        var ruleMap = /* @__PURE__ */ Object.create(null);
        for (var i = 0; i < keys2.length; i++) {
          var key = keys2[i];
          ruleMap[key] = toRules(states[key]).concat(all);
        }
        for (var i = 0; i < keys2.length; i++) {
          var key = keys2[i];
          var rules = ruleMap[key];
          var included = /* @__PURE__ */ Object.create(null);
          for (var j = 0; j < rules.length; j++) {
            var rule = rules[j];
            if (!rule.include) continue;
            var splice3 = [j, 1];
            if (rule.include !== key && !included[rule.include]) {
              included[rule.include] = true;
              var newRules = ruleMap[rule.include];
              if (!newRules) {
                throw new Error("Cannot include nonexistent state '" + rule.include + "' (in state '" + key + "')");
              }
              for (var k = 0; k < newRules.length; k++) {
                var newRule = newRules[k];
                if (rules.indexOf(newRule) !== -1) continue;
                splice3.push(newRule);
              }
            }
            rules.splice.apply(rules, splice3);
            j--;
          }
        }
        var map3 = /* @__PURE__ */ Object.create(null);
        for (var i = 0; i < keys2.length; i++) {
          var key = keys2[i];
          map3[key] = compileRules(ruleMap[key], true);
        }
        for (var i = 0; i < keys2.length; i++) {
          var name = keys2[i];
          var state = map3[name];
          var groups = state.groups;
          for (var j = 0; j < groups.length; j++) {
            checkStateGroup(groups[j], name, map3);
          }
          var fastKeys = Object.getOwnPropertyNames(state.fast);
          for (var j = 0; j < fastKeys.length; j++) {
            checkStateGroup(state.fast[fastKeys[j]], name, map3);
          }
        }
        return new Lexer(map3, start);
      }
      function keywordTransform(map3) {
        var isMap2 = typeof Map !== "undefined";
        var reverseMap = isMap2 ? /* @__PURE__ */ new Map() : /* @__PURE__ */ Object.create(null);
        var types = Object.getOwnPropertyNames(map3);
        for (var i = 0; i < types.length; i++) {
          var tokenType = types[i];
          var item = map3[tokenType];
          var keywordList = Array.isArray(item) ? item : [item];
          keywordList.forEach(function(keyword) {
            if (typeof keyword !== "string") {
              throw new Error("keyword must be string (in keyword '" + tokenType + "')");
            }
            if (isMap2) {
              reverseMap.set(keyword, tokenType);
            } else {
              reverseMap[keyword] = tokenType;
            }
          });
        }
        return function(k) {
          return isMap2 ? reverseMap.get(k) : reverseMap[k];
        };
      }
      var Lexer = function(states, state) {
        this.startState = state;
        this.states = states;
        this.buffer = "";
        this.stack = [];
        this.reset();
      };
      Lexer.prototype.reset = function(data, info) {
        this.buffer = data || "";
        this.index = 0;
        this.line = info ? info.line : 1;
        this.col = info ? info.col : 1;
        this.queuedToken = info ? info.queuedToken : null;
        this.queuedText = info ? info.queuedText : "";
        this.queuedThrow = info ? info.queuedThrow : null;
        this.setState(info ? info.state : this.startState);
        this.stack = info && info.stack ? info.stack.slice() : [];
        return this;
      };
      Lexer.prototype.save = function() {
        return {
          line: this.line,
          col: this.col,
          state: this.state,
          stack: this.stack.slice(),
          queuedToken: this.queuedToken,
          queuedText: this.queuedText,
          queuedThrow: this.queuedThrow
        };
      };
      Lexer.prototype.setState = function(state) {
        if (!state || this.state === state) return;
        this.state = state;
        var info = this.states[state];
        this.groups = info.groups;
        this.error = info.error;
        this.re = info.regexp;
        this.fast = info.fast;
      };
      Lexer.prototype.popState = function() {
        this.setState(this.stack.pop());
      };
      Lexer.prototype.pushState = function(state) {
        this.stack.push(this.state);
        this.setState(state);
      };
      var eat = hasSticky ? function(re, buffer) {
        return re.exec(buffer);
      } : function(re, buffer) {
        var match = re.exec(buffer);
        if (match[0].length === 0) {
          return null;
        }
        return match;
      };
      Lexer.prototype._getGroup = function(match) {
        var groupCount = this.groups.length;
        for (var i = 0; i < groupCount; i++) {
          if (match[i + 1] !== void 0) {
            return this.groups[i];
          }
        }
        throw new Error("Cannot find token type for matched text");
      };
      function tokenToString() {
        return this.value;
      }
      Lexer.prototype.next = function() {
        var index = this.index;
        if (this.queuedGroup) {
          var token = this._token(this.queuedGroup, this.queuedText, index);
          this.queuedGroup = null;
          this.queuedText = "";
          return token;
        }
        var buffer = this.buffer;
        if (index === buffer.length) {
          return;
        }
        var group = this.fast[buffer.charCodeAt(index)];
        if (group) {
          return this._token(group, buffer.charAt(index), index);
        }
        var re = this.re;
        re.lastIndex = index;
        var match = eat(re, buffer);
        var error = this.error;
        if (match == null) {
          return this._token(error, buffer.slice(index, buffer.length), index);
        }
        var group = this._getGroup(match);
        var text = match[0];
        if (error.fallback && match.index !== index) {
          this.queuedGroup = group;
          this.queuedText = text;
          return this._token(error, buffer.slice(index, match.index), index);
        }
        return this._token(group, text, index);
      };
      Lexer.prototype._token = function(group, text, offset) {
        var lineBreaks = 0;
        if (group.lineBreaks) {
          var matchNL = /\n/g;
          var nl = 1;
          if (text === "\n") {
            lineBreaks = 1;
          } else {
            while (matchNL.exec(text)) {
              lineBreaks++;
              nl = matchNL.lastIndex;
            }
          }
        }
        var token = {
          type: typeof group.type === "function" && group.type(text) || group.defaultType,
          value: typeof group.value === "function" ? group.value(text) : text,
          text,
          toString: tokenToString,
          offset,
          lineBreaks,
          line: this.line,
          col: this.col
        };
        var size = text.length;
        this.index += size;
        this.line += lineBreaks;
        if (lineBreaks !== 0) {
          this.col = size - nl + 1;
        } else {
          this.col += size;
        }
        if (group.shouldThrow) {
          var err = new Error(this.formatError(token, "invalid syntax"));
          throw err;
        }
        if (group.pop) this.popState();
        else if (group.push) this.pushState(group.push);
        else if (group.next) this.setState(group.next);
        return token;
      };
      if (typeof Symbol !== "undefined" && Symbol.iterator) {
        var LexerIterator = function(lexer2) {
          this.lexer = lexer2;
        };
        LexerIterator.prototype.next = function() {
          var token = this.lexer.next();
          return { value: token, done: !token };
        };
        LexerIterator.prototype[Symbol.iterator] = function() {
          return this;
        };
        Lexer.prototype[Symbol.iterator] = function() {
          return new LexerIterator(this);
        };
      }
      Lexer.prototype.formatError = function(token, message) {
        if (token == null) {
          var text = this.buffer.slice(this.index);
          var token = {
            text,
            offset: this.index,
            lineBreaks: text.indexOf("\n") === -1 ? 0 : 1,
            line: this.line,
            col: this.col
          };
        }
        var numLinesAround = 2;
        var firstDisplayedLine = Math.max(token.line - numLinesAround, 1);
        var lastDisplayedLine = token.line + numLinesAround;
        var lastLineDigits = String(lastDisplayedLine).length;
        var displayedLines = lastNLines(
          this.buffer,
          this.line - token.line + numLinesAround + 1
        ).slice(0, 5);
        var errorLines = [];
        errorLines.push(message + " at line " + token.line + " col " + token.col + ":");
        errorLines.push("");
        for (var i = 0; i < displayedLines.length; i++) {
          var line = displayedLines[i];
          var lineNo = firstDisplayedLine + i;
          errorLines.push(pad(String(lineNo), lastLineDigits) + "  " + line);
          if (lineNo === token.line) {
            errorLines.push(pad("", lastLineDigits + token.col + 1) + "^");
          }
        }
        return errorLines.join("\n");
      };
      Lexer.prototype.clone = function() {
        return new Lexer(this.states, this.state);
      };
      Lexer.prototype.has = function(tokenType) {
        return true;
      };
      return {
        compile,
        states: compileStates,
        error: Object.freeze({ error: true }),
        fallback: Object.freeze({ fallback: true }),
        keywords: keywordTransform
      };
    });
  }
});

// ../../node_modules/.pnpm/immutability-helper@3.1.1/node_modules/immutability-helper/index.js
var require_immutability_helper = __commonJS({
  "../../node_modules/.pnpm/immutability-helper@3.1.1/node_modules/immutability-helper/index.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    function stringifiable(obj) {
      return typeof obj === "object" && !("toString" in obj) ? Object.prototype.toString.call(obj).slice(8, -1) : obj;
    }
    var isProduction = typeof process === "object" && process.env.NODE_ENV === "production";
    function invariant4(condition, message) {
      if (!condition) {
        if (isProduction) {
          throw new Error("Invariant failed");
        }
        throw new Error(message());
      }
    }
    exports2.invariant = invariant4;
    var hasOwnProperty13 = Object.prototype.hasOwnProperty;
    var splice3 = Array.prototype.splice;
    var toString3 = Object.prototype.toString;
    function type2(obj) {
      return toString3.call(obj).slice(8, -1);
    }
    var assign = Object.assign || /* istanbul ignore next */
    function(target, source) {
      getAllKeys2(source).forEach(function(key) {
        if (hasOwnProperty13.call(source, key)) {
          target[key] = source[key];
        }
      });
      return target;
    };
    var getAllKeys2 = typeof Object.getOwnPropertySymbols === "function" ? function(obj) {
      return Object.keys(obj).concat(Object.getOwnPropertySymbols(obj));
    } : function(obj) {
      return Object.keys(obj);
    };
    function copy(object) {
      return Array.isArray(object) ? assign(object.constructor(object.length), object) : type2(object) === "Map" ? new Map(object) : type2(object) === "Set" ? new Set(object) : object && typeof object === "object" ? assign(Object.create(Object.getPrototypeOf(object)), object) : object;
    }
    var Context = (
      /** @class */
      function() {
        function Context2() {
          this.commands = assign({}, defaultCommands);
          this.update = this.update.bind(this);
          this.update.extend = this.extend = this.extend.bind(this);
          this.update.isEquals = function(x, y) {
            return x === y;
          };
          this.update.newContext = function() {
            return new Context2().update;
          };
        }
        Object.defineProperty(Context2.prototype, "isEquals", {
          get: function() {
            return this.update.isEquals;
          },
          set: function(value) {
            this.update.isEquals = value;
          },
          enumerable: true,
          configurable: true
        });
        Context2.prototype.extend = function(directive, fn) {
          this.commands[directive] = fn;
        };
        Context2.prototype.update = function(object, $spec) {
          var _this = this;
          var spec = typeof $spec === "function" ? { $apply: $spec } : $spec;
          if (!(Array.isArray(object) && Array.isArray(spec))) {
            invariant4(!Array.isArray(spec), function() {
              return "update(): You provided an invalid spec to update(). The spec may not contain an array except as the value of $set, $push, $unshift, $splice or any custom command allowing an array value.";
            });
          }
          invariant4(typeof spec === "object" && spec !== null, function() {
            return "update(): You provided an invalid spec to update(). The spec and every included key path must be plain objects containing one of the " + ("following commands: " + Object.keys(_this.commands).join(", ") + ".");
          });
          var nextObject = object;
          getAllKeys2(spec).forEach(function(key) {
            if (hasOwnProperty13.call(_this.commands, key)) {
              var objectWasNextObject = object === nextObject;
              nextObject = _this.commands[key](spec[key], nextObject, spec, object);
              if (objectWasNextObject && _this.isEquals(nextObject, object)) {
                nextObject = object;
              }
            } else {
              var nextValueForKey = type2(object) === "Map" ? _this.update(object.get(key), spec[key]) : _this.update(object[key], spec[key]);
              var nextObjectValue = type2(nextObject) === "Map" ? nextObject.get(key) : nextObject[key];
              if (!_this.isEquals(nextValueForKey, nextObjectValue) || typeof nextValueForKey === "undefined" && !hasOwnProperty13.call(object, key)) {
                if (nextObject === object) {
                  nextObject = copy(object);
                }
                if (type2(nextObject) === "Map") {
                  nextObject.set(key, nextValueForKey);
                } else {
                  nextObject[key] = nextValueForKey;
                }
              }
            }
          });
          return nextObject;
        };
        return Context2;
      }()
    );
    exports2.Context = Context;
    var defaultCommands = {
      $push: function(value, nextObject, spec) {
        invariantPushAndUnshift(nextObject, spec, "$push");
        return value.length ? nextObject.concat(value) : nextObject;
      },
      $unshift: function(value, nextObject, spec) {
        invariantPushAndUnshift(nextObject, spec, "$unshift");
        return value.length ? value.concat(nextObject) : nextObject;
      },
      $splice: function(value, nextObject, spec, originalObject) {
        invariantSplices(nextObject, spec);
        value.forEach(function(args) {
          invariantSplice(args);
          if (nextObject === originalObject && args.length) {
            nextObject = copy(originalObject);
          }
          splice3.apply(nextObject, args);
        });
        return nextObject;
      },
      $set: function(value, _nextObject, spec) {
        invariantSet(spec);
        return value;
      },
      $toggle: function(targets, nextObject) {
        invariantSpecArray(targets, "$toggle");
        var nextObjectCopy = targets.length ? copy(nextObject) : nextObject;
        targets.forEach(function(target) {
          nextObjectCopy[target] = !nextObject[target];
        });
        return nextObjectCopy;
      },
      $unset: function(value, nextObject, _spec, originalObject) {
        invariantSpecArray(value, "$unset");
        value.forEach(function(key) {
          if (Object.hasOwnProperty.call(nextObject, key)) {
            if (nextObject === originalObject) {
              nextObject = copy(originalObject);
            }
            delete nextObject[key];
          }
        });
        return nextObject;
      },
      $add: function(values2, nextObject, _spec, originalObject) {
        invariantMapOrSet(nextObject, "$add");
        invariantSpecArray(values2, "$add");
        if (type2(nextObject) === "Map") {
          values2.forEach(function(_a) {
            var key = _a[0], value = _a[1];
            if (nextObject === originalObject && nextObject.get(key) !== value) {
              nextObject = copy(originalObject);
            }
            nextObject.set(key, value);
          });
        } else {
          values2.forEach(function(value) {
            if (nextObject === originalObject && !nextObject.has(value)) {
              nextObject = copy(originalObject);
            }
            nextObject.add(value);
          });
        }
        return nextObject;
      },
      $remove: function(value, nextObject, _spec, originalObject) {
        invariantMapOrSet(nextObject, "$remove");
        invariantSpecArray(value, "$remove");
        value.forEach(function(key) {
          if (nextObject === originalObject && nextObject.has(key)) {
            nextObject = copy(originalObject);
          }
          nextObject.delete(key);
        });
        return nextObject;
      },
      $merge: function(value, nextObject, _spec, originalObject) {
        invariantMerge(nextObject, value);
        getAllKeys2(value).forEach(function(key) {
          if (value[key] !== nextObject[key]) {
            if (nextObject === originalObject) {
              nextObject = copy(originalObject);
            }
            nextObject[key] = value[key];
          }
        });
        return nextObject;
      },
      $apply: function(value, original) {
        invariantApply(value);
        return value(original);
      }
    };
    var defaultContext = new Context();
    exports2.isEquals = defaultContext.update.isEquals;
    exports2.extend = defaultContext.extend;
    exports2.default = defaultContext.update;
    exports2.default.default = module2.exports = assign(exports2.default, exports2);
    function invariantPushAndUnshift(value, spec, command) {
      invariant4(Array.isArray(value), function() {
        return "update(): expected target of " + stringifiable(command) + " to be an array; got " + stringifiable(value) + ".";
      });
      invariantSpecArray(spec[command], command);
    }
    function invariantSpecArray(spec, command) {
      invariant4(Array.isArray(spec), function() {
        return "update(): expected spec of " + stringifiable(command) + " to be an array; got " + stringifiable(spec) + ". Did you forget to wrap your parameter in an array?";
      });
    }
    function invariantSplices(value, spec) {
      invariant4(Array.isArray(value), function() {
        return "Expected $splice target to be an array; got " + stringifiable(value);
      });
      invariantSplice(spec.$splice);
    }
    function invariantSplice(value) {
      invariant4(Array.isArray(value), function() {
        return "update(): expected spec of $splice to be an array of arrays; got " + stringifiable(value) + ". Did you forget to wrap your parameters in an array?";
      });
    }
    function invariantApply(fn) {
      invariant4(typeof fn === "function", function() {
        return "update(): expected spec of $apply to be a function; got " + stringifiable(fn) + ".";
      });
    }
    function invariantSet(spec) {
      invariant4(Object.keys(spec).length === 1, function() {
        return "Cannot have more than one key in an object with $set";
      });
    }
    function invariantMerge(target, specValue) {
      invariant4(specValue && typeof specValue === "object", function() {
        return "update(): $merge expects a spec of type 'object'; got " + stringifiable(specValue);
      });
      invariant4(target && typeof target === "object", function() {
        return "update(): $merge expects a target of type 'object'; got " + stringifiable(target);
      });
    }
    function invariantMapOrSet(target, command) {
      var typeOfTarget = type2(target);
      invariant4(typeOfTarget === "Map" || typeOfTarget === "Set", function() {
        return "update(): " + stringifiable(command) + " expects a target of type Set or Map; got " + stringifiable(typeOfTarget);
      });
    }
  }
});

// ../cursorless-everywhere-talon-core/src/polyfill.ts
var global2 = globalThis;
if (global2.process == null) {
  global2.process = {
    env: {}
  };
}
if (typeof print !== "undefined") {
  global2.console = {
    log: print,
    error: print,
    warn: print,
    debug: print
  };
}
global2.setTimeout = (callback2, _delay) => {
  callback2();
};

// ../common/src/cursorlessCommandIds.ts
var CURSORLESS_COMMAND_ID = "cursorless.command";
var Command = class {
  constructor(baseTitle) {
    this.baseTitle = baseTitle;
  }
  get title() {
    return `Cursorless: ${this.baseTitle}`;
  }
};
var HiddenCommand = class extends Command {
  constructor() {
    super(...arguments);
    this.isVisible = false;
  }
};
var VisibleCommand = class extends Command {
  constructor() {
    super(...arguments);
    this.isVisible = true;
  }
};
var cursorlessCommandDescriptions = {
  ["cursorless.toggleDecorations"]: new VisibleCommand("Toggle decorations"),
  ["cursorless.recomputeDecorationStyles"]: new VisibleCommand(
    "Recompute decoration styles"
  ),
  ["cursorless.recordTestCase"]: new VisibleCommand("Record test case"),
  ["cursorless.recordOneTestCaseThenPause"]: new VisibleCommand(
    "Record one test case, then pause"
  ),
  ["cursorless.pauseRecording"]: new VisibleCommand(
    "Pause test case recording"
  ),
  ["cursorless.resumeRecording"]: new VisibleCommand(
    "Resume test case recording"
  ),
  ["cursorless.recordScopeTests.showUnimplementedFacets"]: new VisibleCommand(
    "Bulk record unimplemented scope facets"
  ),
  ["cursorless.recordScopeTests.saveActiveDocument"]: new VisibleCommand(
    "Bulk save scope tests for the active document"
  ),
  ["cursorless.showDocumentation"]: new VisibleCommand("Show documentation"),
  ["cursorless.showScopeVisualizer"]: new VisibleCommand(
    "Show the scope visualizer"
  ),
  ["cursorless.hideScopeVisualizer"]: new VisibleCommand(
    "Hide the scope visualizer"
  ),
  ["cursorless.analyzeCommandHistory"]: new VisibleCommand(
    "Analyze collected command history"
  ),
  ["cursorless.tutorial.start"]: new HiddenCommand("Start a tutorial"),
  ["cursorless.tutorial.next"]: new VisibleCommand("Tutorial next"),
  ["cursorless.tutorial.previous"]: new VisibleCommand("Tutorial previous"),
  ["cursorless.tutorial.restart"]: new VisibleCommand("Tutorial restart"),
  ["cursorless.tutorial.resume"]: new VisibleCommand("Tutorial resume"),
  ["cursorless.tutorial.list"]: new VisibleCommand("Tutorial list"),
  ["cursorless.documentationOpened"]: new HiddenCommand(
    "Used by talon to notify us that the docs have been opened; for use with tutorial"
  ),
  ["cursorless.command"]: new HiddenCommand("The core cursorless command"),
  ["cursorless.repeatPreviousCommand"]: new VisibleCommand(
    "Repeat the previous Cursorless command"
  ),
  ["cursorless.showQuickPick"]: new HiddenCommand(
    "Pop up a quick pick of all cursorless commands"
  ),
  ["cursorless.showCheatsheet"]: new HiddenCommand(
    "Display the cursorless cheatsheet"
  ),
  ["cursorless.internal.updateCheatsheetDefaults"]: new HiddenCommand(
    "Update the default values of the cheatsheet payload used on the website and for local development. Be sure to run this on stock community and cursorless."
  ),
  ["cursorless.private.logQuickActions"]: new HiddenCommand(
    "Log the quick actions available at the current cursor position"
  ),
  ["cursorless.takeSnapshot"]: new HiddenCommand(
    "Take a snapshot of the current editor state"
  ),
  ["cursorless.keyboard.escape"]: new HiddenCommand(
    "Should be mapped to the escape key when using cursorless keyboard. By default, exits modal keyboard mode, but changes behaviour when Cursorless is expecting a continuation keystroke.  For example, when you type a color and Cursorless is waiting for a character, it cancels the color and switches back to modal mode."
  ),
  ["cursorless.keyboard.targeted.targetHat"]: new HiddenCommand(
    "Sets the keyboard target to the given hat"
  ),
  ["cursorless.keyboard.targeted.targetScope"]: new HiddenCommand(
    "Sets the keyboard target to the scope containing the current target"
  ),
  ["cursorless.keyboard.targeted.targetSelection"]: new HiddenCommand(
    "Sets the keyboard target to the current selection"
  ),
  ["cursorless.keyboard.targeted.clearTarget"]: new HiddenCommand(
    "Clears the current keyboard target"
  ),
  ["cursorless.keyboard.targeted.runActionOnTarget"]: new HiddenCommand(
    "Run the given action on the current keyboard target"
  ),
  ["cursorless.keyboard.modal.modeOn"]: new HiddenCommand(
    "Turn on the cursorless modal mode"
  ),
  ["cursorless.keyboard.modal.modeOff"]: new HiddenCommand(
    "Turn off the cursorless modal mode"
  ),
  ["cursorless.keyboard.modal.modeToggle"]: new HiddenCommand(
    "Toggle the cursorless modal mode"
  ),
  ["cursorless.keyboard.undoTarget"]: new HiddenCommand(
    "Undo keyboard targeting changes"
  ),
  ["cursorless.keyboard.redoTarget"]: new HiddenCommand(
    "Redo keyboard targeting changes"
  )
};

// ../common/src/Debouncer.ts
var Debouncer = class {
  constructor(callback2, debounceDelayMs) {
    this.callback = callback2;
    this.debounceDelayMs = debounceDelayMs;
    this.timeoutHandle = null;
    this.run = this.run.bind(this);
  }
  run() {
    if (this.timeoutHandle != null) {
      clearTimeout(this.timeoutHandle);
    }
    this.timeoutHandle = setTimeout(() => {
      this.callback();
      this.timeoutHandle = null;
    }, this.debounceDelayMs);
  }
  dispose() {
    if (this.timeoutHandle != null) {
      clearTimeout(this.timeoutHandle);
    }
  }
};

// ../common/src/errors.ts
var UnsupportedLanguageError = class extends Error {
  constructor(languageId) {
    super(
      `Language '${languageId}' is not implemented yet; See https://www.cursorless.org/docs/contributing/adding-a-new-language/`
    );
    this.name = "UnsupportedLanguageError";
  }
};
var OutdatedExtensionError = class extends Error {
  constructor() {
    super(
      "Cursorless Talon version is ahead of Cursorless VSCode extension version. Please update Cursorless VSCode."
    );
  }
};
var NoContainingScopeError = class extends Error {
  /**
   *
   * @param scopeType The scopeType for the failed match to show to the user
   */
  constructor(scopeType) {
    super(`Couldn't find containing ${scopeType}.`);
    this.name = "NoContainingScopeError";
  }
};

// ../common/src/FakeCommandServerApi.ts
var FakeCommandServerApi = class {
  constructor() {
    this.signals = { prePhrase: { getVersion: async () => null } };
  }
  async getFocusedElementType() {
    return this.focusedElementType;
  }
  setFocusedElementType(focusedElementType) {
    this.focusedElementType = focusedElementType;
  }
};

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_freeGlobal.js
var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
var freeGlobal_default = freeGlobal;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_root.js
var freeSelf = typeof self == "object" && self && self.Object === Object && self;
var root = freeGlobal_default || freeSelf || Function("return this")();
var root_default = root;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_Symbol.js
var Symbol2 = root_default.Symbol;
var Symbol_default = Symbol2;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_getRawTag.js
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
var nativeObjectToString = objectProto.toString;
var symToStringTag = Symbol_default ? Symbol_default.toStringTag : void 0;
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
  try {
    value[symToStringTag] = void 0;
    var unmasked = true;
  } catch (e) {
  }
  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}
var getRawTag_default = getRawTag;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_objectToString.js
var objectProto2 = Object.prototype;
var nativeObjectToString2 = objectProto2.toString;
function objectToString(value) {
  return nativeObjectToString2.call(value);
}
var objectToString_default = objectToString;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseGetTag.js
var nullTag = "[object Null]";
var undefinedTag = "[object Undefined]";
var symToStringTag2 = Symbol_default ? Symbol_default.toStringTag : void 0;
function baseGetTag(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag : nullTag;
  }
  return symToStringTag2 && symToStringTag2 in Object(value) ? getRawTag_default(value) : objectToString_default(value);
}
var baseGetTag_default = baseGetTag;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/isObjectLike.js
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
var isObjectLike_default = isObjectLike;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/isSymbol.js
var symbolTag = "[object Symbol]";
function isSymbol(value) {
  return typeof value == "symbol" || isObjectLike_default(value) && baseGetTag_default(value) == symbolTag;
}
var isSymbol_default = isSymbol;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_arrayMap.js
function arrayMap(array, iteratee) {
  var index = -1, length = array == null ? 0 : array.length, result = Array(length);
  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}
var arrayMap_default = arrayMap;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/isArray.js
var isArray = Array.isArray;
var isArray_default = isArray;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseToString.js
var INFINITY = 1 / 0;
var symbolProto = Symbol_default ? Symbol_default.prototype : void 0;
var symbolToString = symbolProto ? symbolProto.toString : void 0;
function baseToString(value) {
  if (typeof value == "string") {
    return value;
  }
  if (isArray_default(value)) {
    return arrayMap_default(value, baseToString) + "";
  }
  if (isSymbol_default(value)) {
    return symbolToString ? symbolToString.call(value) : "";
  }
  var result = value + "";
  return result == "0" && 1 / value == -INFINITY ? "-0" : result;
}
var baseToString_default = baseToString;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_trimmedEndIndex.js
var reWhitespace = /\s/;
function trimmedEndIndex(string2) {
  var index = string2.length;
  while (index-- && reWhitespace.test(string2.charAt(index))) {
  }
  return index;
}
var trimmedEndIndex_default = trimmedEndIndex;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseTrim.js
var reTrimStart = /^\s+/;
function baseTrim(string2) {
  return string2 ? string2.slice(0, trimmedEndIndex_default(string2) + 1).replace(reTrimStart, "") : string2;
}
var baseTrim_default = baseTrim;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/isObject.js
function isObject(value) {
  var type2 = typeof value;
  return value != null && (type2 == "object" || type2 == "function");
}
var isObject_default = isObject;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/toNumber.js
var NAN = 0 / 0;
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
var reIsBinary = /^0b[01]+$/i;
var reIsOctal = /^0o[0-7]+$/i;
var freeParseInt = parseInt;
function toNumber(value) {
  if (typeof value == "number") {
    return value;
  }
  if (isSymbol_default(value)) {
    return NAN;
  }
  if (isObject_default(value)) {
    var other = typeof value.valueOf == "function" ? value.valueOf() : value;
    value = isObject_default(other) ? other + "" : other;
  }
  if (typeof value != "string") {
    return value === 0 ? value : +value;
  }
  value = baseTrim_default(value);
  var isBinary2 = reIsBinary.test(value);
  return isBinary2 || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary2 ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
}
var toNumber_default = toNumber;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/toFinite.js
var INFINITY2 = 1 / 0;
var MAX_INTEGER = 17976931348623157e292;
function toFinite(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber_default(value);
  if (value === INFINITY2 || value === -INFINITY2) {
    var sign = value < 0 ? -1 : 1;
    return sign * MAX_INTEGER;
  }
  return value === value ? value : 0;
}
var toFinite_default = toFinite;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/toInteger.js
function toInteger(value) {
  var result = toFinite_default(value), remainder = result % 1;
  return result === result ? remainder ? result - remainder : result : 0;
}
var toInteger_default = toInteger;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/identity.js
function identity(value) {
  return value;
}
var identity_default = identity;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/isFunction.js
var asyncTag = "[object AsyncFunction]";
var funcTag = "[object Function]";
var genTag = "[object GeneratorFunction]";
var proxyTag = "[object Proxy]";
function isFunction(value) {
  if (!isObject_default(value)) {
    return false;
  }
  var tag = baseGetTag_default(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}
var isFunction_default = isFunction;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_coreJsData.js
var coreJsData = root_default["__core-js_shared__"];
var coreJsData_default = coreJsData;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_isMasked.js
var maskSrcKey = function() {
  var uid = /[^.]+$/.exec(coreJsData_default && coreJsData_default.keys && coreJsData_default.keys.IE_PROTO || "");
  return uid ? "Symbol(src)_1." + uid : "";
}();
function isMasked(func) {
  return !!maskSrcKey && maskSrcKey in func;
}
var isMasked_default = isMasked;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_toSource.js
var funcProto = Function.prototype;
var funcToString = funcProto.toString;
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {
    }
    try {
      return func + "";
    } catch (e) {
    }
  }
  return "";
}
var toSource_default = toSource;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseIsNative.js
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
var reIsHostCtor = /^\[object .+?Constructor\]$/;
var funcProto2 = Function.prototype;
var objectProto3 = Object.prototype;
var funcToString2 = funcProto2.toString;
var hasOwnProperty2 = objectProto3.hasOwnProperty;
var reIsNative = RegExp(
  "^" + funcToString2.call(hasOwnProperty2).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function baseIsNative(value) {
  if (!isObject_default(value) || isMasked_default(value)) {
    return false;
  }
  var pattern = isFunction_default(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource_default(value));
}
var baseIsNative_default = baseIsNative;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_getValue.js
function getValue(object, key) {
  return object == null ? void 0 : object[key];
}
var getValue_default = getValue;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_getNative.js
function getNative(object, key) {
  var value = getValue_default(object, key);
  return baseIsNative_default(value) ? value : void 0;
}
var getNative_default = getNative;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_WeakMap.js
var WeakMap2 = getNative_default(root_default, "WeakMap");
var WeakMap_default = WeakMap2;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_metaMap.js
var metaMap = WeakMap_default && new WeakMap_default();
var metaMap_default = metaMap;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseCreate.js
var objectCreate = Object.create;
var baseCreate = /* @__PURE__ */ function() {
  function object() {
  }
  return function(proto) {
    if (!isObject_default(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object();
    object.prototype = void 0;
    return result;
  };
}();
var baseCreate_default = baseCreate;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_apply.js
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}
var apply_default = apply;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseLodash.js
function baseLodash() {
}
var baseLodash_default = baseLodash;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_LazyWrapper.js
var MAX_ARRAY_LENGTH = 4294967295;
function LazyWrapper(value) {
  this.__wrapped__ = value;
  this.__actions__ = [];
  this.__dir__ = 1;
  this.__filtered__ = false;
  this.__iteratees__ = [];
  this.__takeCount__ = MAX_ARRAY_LENGTH;
  this.__views__ = [];
}
LazyWrapper.prototype = baseCreate_default(baseLodash_default.prototype);
LazyWrapper.prototype.constructor = LazyWrapper;
var LazyWrapper_default = LazyWrapper;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/noop.js
function noop() {
}
var noop_default = noop;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_getData.js
var getData = !metaMap_default ? noop_default : function(func) {
  return metaMap_default.get(func);
};
var getData_default = getData;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_realNames.js
var realNames = {};
var realNames_default = realNames;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_getFuncName.js
var objectProto4 = Object.prototype;
var hasOwnProperty3 = objectProto4.hasOwnProperty;
function getFuncName(func) {
  var result = func.name + "", array = realNames_default[result], length = hasOwnProperty3.call(realNames_default, result) ? array.length : 0;
  while (length--) {
    var data = array[length], otherFunc = data.func;
    if (otherFunc == null || otherFunc == func) {
      return data.name;
    }
  }
  return result;
}
var getFuncName_default = getFuncName;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_LodashWrapper.js
function LodashWrapper(value, chainAll) {
  this.__wrapped__ = value;
  this.__actions__ = [];
  this.__chain__ = !!chainAll;
  this.__index__ = 0;
  this.__values__ = void 0;
}
LodashWrapper.prototype = baseCreate_default(baseLodash_default.prototype);
LodashWrapper.prototype.constructor = LodashWrapper;
var LodashWrapper_default = LodashWrapper;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_copyArray.js
function copyArray(source, array) {
  var index = -1, length = source.length;
  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}
var copyArray_default = copyArray;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_wrapperClone.js
function wrapperClone(wrapper) {
  if (wrapper instanceof LazyWrapper_default) {
    return wrapper.clone();
  }
  var result = new LodashWrapper_default(wrapper.__wrapped__, wrapper.__chain__);
  result.__actions__ = copyArray_default(wrapper.__actions__);
  result.__index__ = wrapper.__index__;
  result.__values__ = wrapper.__values__;
  return result;
}
var wrapperClone_default = wrapperClone;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/wrapperLodash.js
var objectProto5 = Object.prototype;
var hasOwnProperty4 = objectProto5.hasOwnProperty;
function lodash(value) {
  if (isObjectLike_default(value) && !isArray_default(value) && !(value instanceof LazyWrapper_default)) {
    if (value instanceof LodashWrapper_default) {
      return value;
    }
    if (hasOwnProperty4.call(value, "__wrapped__")) {
      return wrapperClone_default(value);
    }
  }
  return new LodashWrapper_default(value);
}
lodash.prototype = baseLodash_default.prototype;
lodash.prototype.constructor = lodash;
var wrapperLodash_default = lodash;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_isLaziable.js
function isLaziable(func) {
  var funcName = getFuncName_default(func), other = wrapperLodash_default[funcName];
  if (typeof other != "function" || !(funcName in LazyWrapper_default.prototype)) {
    return false;
  }
  if (func === other) {
    return true;
  }
  var data = getData_default(other);
  return !!data && func === data[0];
}
var isLaziable_default = isLaziable;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_shortOut.js
var HOT_COUNT = 800;
var HOT_SPAN = 16;
var nativeNow = Date.now;
function shortOut(func) {
  var count2 = 0, lastCalled = 0;
  return function() {
    var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
    lastCalled = stamp;
    if (remaining > 0) {
      if (++count2 >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count2 = 0;
    }
    return func.apply(void 0, arguments);
  };
}
var shortOut_default = shortOut;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/constant.js
function constant(value) {
  return function() {
    return value;
  };
}
var constant_default = constant;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_defineProperty.js
var defineProperty = function() {
  try {
    var func = getNative_default(Object, "defineProperty");
    func({}, "", {});
    return func;
  } catch (e) {
  }
}();
var defineProperty_default = defineProperty;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseSetToString.js
var baseSetToString = !defineProperty_default ? identity_default : function(func, string2) {
  return defineProperty_default(func, "toString", {
    "configurable": true,
    "enumerable": false,
    "value": constant_default(string2),
    "writable": true
  });
};
var baseSetToString_default = baseSetToString;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_setToString.js
var setToString = shortOut_default(baseSetToString_default);
var setToString_default = setToString;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseFindIndex.js
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
  while (fromRight ? index-- : ++index < length) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}
var baseFindIndex_default = baseFindIndex;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseIsNaN.js
function baseIsNaN(value) {
  return value !== value;
}
var baseIsNaN_default = baseIsNaN;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_strictIndexOf.js
function strictIndexOf(array, value, fromIndex) {
  var index = fromIndex - 1, length = array.length;
  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}
var strictIndexOf_default = strictIndexOf;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseIndexOf.js
function baseIndexOf(array, value, fromIndex) {
  return value === value ? strictIndexOf_default(array, value, fromIndex) : baseFindIndex_default(array, baseIsNaN_default, fromIndex);
}
var baseIndexOf_default = baseIndexOf;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_arrayIncludes.js
function arrayIncludes(array, value) {
  var length = array == null ? 0 : array.length;
  return !!length && baseIndexOf_default(array, value, 0) > -1;
}
var arrayIncludes_default = arrayIncludes;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_isIndex.js
var MAX_SAFE_INTEGER = 9007199254740991;
var reIsUint = /^(?:0|[1-9]\d*)$/;
function isIndex(value, length) {
  var type2 = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length && (type2 == "number" || type2 != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
}
var isIndex_default = isIndex;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseAssignValue.js
function baseAssignValue(object, key, value) {
  if (key == "__proto__" && defineProperty_default) {
    defineProperty_default(object, key, {
      "configurable": true,
      "enumerable": true,
      "value": value,
      "writable": true
    });
  } else {
    object[key] = value;
  }
}
var baseAssignValue_default = baseAssignValue;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/eq.js
function eq(value, other) {
  return value === other || value !== value && other !== other;
}
var eq_default = eq;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_overRest.js
var nativeMax = Math.max;
function overRest(func, start, transform) {
  start = nativeMax(start === void 0 ? func.length - 1 : start, 0);
  return function() {
    var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array(length);
    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return apply_default(func, this, otherArgs);
  };
}
var overRest_default = overRest;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseRest.js
function baseRest(func, start) {
  return setToString_default(overRest_default(func, start, identity_default), func + "");
}
var baseRest_default = baseRest;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/isLength.js
var MAX_SAFE_INTEGER2 = 9007199254740991;
function isLength(value) {
  return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER2;
}
var isLength_default = isLength;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/isArrayLike.js
function isArrayLike(value) {
  return value != null && isLength_default(value.length) && !isFunction_default(value);
}
var isArrayLike_default = isArrayLike;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_isIterateeCall.js
function isIterateeCall(value, index, object) {
  if (!isObject_default(object)) {
    return false;
  }
  var type2 = typeof index;
  if (type2 == "number" ? isArrayLike_default(object) && isIndex_default(index, object.length) : type2 == "string" && index in object) {
    return eq_default(object[index], value);
  }
  return false;
}
var isIterateeCall_default = isIterateeCall;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_isPrototype.js
var objectProto6 = Object.prototype;
function isPrototype(value) {
  var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto6;
  return value === proto;
}
var isPrototype_default = isPrototype;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseTimes.js
function baseTimes(n, iteratee) {
  var index = -1, result = Array(n);
  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}
var baseTimes_default = baseTimes;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseIsArguments.js
var argsTag = "[object Arguments]";
function baseIsArguments(value) {
  return isObjectLike_default(value) && baseGetTag_default(value) == argsTag;
}
var baseIsArguments_default = baseIsArguments;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/isArguments.js
var objectProto7 = Object.prototype;
var hasOwnProperty5 = objectProto7.hasOwnProperty;
var propertyIsEnumerable = objectProto7.propertyIsEnumerable;
var isArguments = baseIsArguments_default(/* @__PURE__ */ function() {
  return arguments;
}()) ? baseIsArguments_default : function(value) {
  return isObjectLike_default(value) && hasOwnProperty5.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
};
var isArguments_default = isArguments;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/stubFalse.js
function stubFalse() {
  return false;
}
var stubFalse_default = stubFalse;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/isBuffer.js
var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
var moduleExports = freeModule && freeModule.exports === freeExports;
var Buffer2 = moduleExports ? root_default.Buffer : void 0;
var nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0;
var isBuffer = nativeIsBuffer || stubFalse_default;
var isBuffer_default = isBuffer;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseIsTypedArray.js
var argsTag2 = "[object Arguments]";
var arrayTag = "[object Array]";
var boolTag = "[object Boolean]";
var dateTag = "[object Date]";
var errorTag = "[object Error]";
var funcTag2 = "[object Function]";
var mapTag = "[object Map]";
var numberTag = "[object Number]";
var objectTag = "[object Object]";
var regexpTag = "[object RegExp]";
var setTag = "[object Set]";
var stringTag = "[object String]";
var weakMapTag = "[object WeakMap]";
var arrayBufferTag = "[object ArrayBuffer]";
var dataViewTag = "[object DataView]";
var float32Tag = "[object Float32Array]";
var float64Tag = "[object Float64Array]";
var int8Tag = "[object Int8Array]";
var int16Tag = "[object Int16Array]";
var int32Tag = "[object Int32Array]";
var uint8Tag = "[object Uint8Array]";
var uint8ClampedTag = "[object Uint8ClampedArray]";
var uint16Tag = "[object Uint16Array]";
var uint32Tag = "[object Uint32Array]";
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag2] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag2] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
function baseIsTypedArray(value) {
  return isObjectLike_default(value) && isLength_default(value.length) && !!typedArrayTags[baseGetTag_default(value)];
}
var baseIsTypedArray_default = baseIsTypedArray;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseUnary.js
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}
var baseUnary_default = baseUnary;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_nodeUtil.js
var freeExports2 = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule2 = freeExports2 && typeof module == "object" && module && !module.nodeType && module;
var moduleExports2 = freeModule2 && freeModule2.exports === freeExports2;
var freeProcess = moduleExports2 && freeGlobal_default.process;
var nodeUtil = function() {
  try {
    var types = freeModule2 && freeModule2.require && freeModule2.require("util").types;
    if (types) {
      return types;
    }
    return freeProcess && freeProcess.binding && freeProcess.binding("util");
  } catch (e) {
  }
}();
var nodeUtil_default = nodeUtil;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/isTypedArray.js
var nodeIsTypedArray = nodeUtil_default && nodeUtil_default.isTypedArray;
var isTypedArray = nodeIsTypedArray ? baseUnary_default(nodeIsTypedArray) : baseIsTypedArray_default;
var isTypedArray_default = isTypedArray;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_arrayLikeKeys.js
var objectProto8 = Object.prototype;
var hasOwnProperty6 = objectProto8.hasOwnProperty;
function arrayLikeKeys(value, inherited) {
  var isArr = isArray_default(value), isArg = !isArr && isArguments_default(value), isBuff = !isArr && !isArg && isBuffer_default(value), isType = !isArr && !isArg && !isBuff && isTypedArray_default(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes_default(value.length, String) : [], length = result.length;
  for (var key in value) {
    if ((inherited || hasOwnProperty6.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
    (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
    isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
    isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
    isIndex_default(key, length)))) {
      result.push(key);
    }
  }
  return result;
}
var arrayLikeKeys_default = arrayLikeKeys;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_overArg.js
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}
var overArg_default = overArg;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_nativeKeys.js
var nativeKeys = overArg_default(Object.keys, Object);
var nativeKeys_default = nativeKeys;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseKeys.js
var objectProto9 = Object.prototype;
var hasOwnProperty7 = objectProto9.hasOwnProperty;
function baseKeys(object) {
  if (!isPrototype_default(object)) {
    return nativeKeys_default(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty7.call(object, key) && key != "constructor") {
      result.push(key);
    }
  }
  return result;
}
var baseKeys_default = baseKeys;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/keys.js
function keys(object) {
  return isArrayLike_default(object) ? arrayLikeKeys_default(object) : baseKeys_default(object);
}
var keys_default = keys;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_isKey.js
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
var reIsPlainProp = /^\w*$/;
function isKey(value, object) {
  if (isArray_default(value)) {
    return false;
  }
  var type2 = typeof value;
  if (type2 == "number" || type2 == "symbol" || type2 == "boolean" || value == null || isSymbol_default(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
}
var isKey_default = isKey;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_nativeCreate.js
var nativeCreate = getNative_default(Object, "create");
var nativeCreate_default = nativeCreate;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_hashClear.js
function hashClear() {
  this.__data__ = nativeCreate_default ? nativeCreate_default(null) : {};
  this.size = 0;
}
var hashClear_default = hashClear;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_hashDelete.js
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}
var hashDelete_default = hashDelete;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_hashGet.js
var HASH_UNDEFINED = "__lodash_hash_undefined__";
var objectProto10 = Object.prototype;
var hasOwnProperty8 = objectProto10.hasOwnProperty;
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate_default) {
    var result = data[key];
    return result === HASH_UNDEFINED ? void 0 : result;
  }
  return hasOwnProperty8.call(data, key) ? data[key] : void 0;
}
var hashGet_default = hashGet;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_hashHas.js
var objectProto11 = Object.prototype;
var hasOwnProperty9 = objectProto11.hasOwnProperty;
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate_default ? data[key] !== void 0 : hasOwnProperty9.call(data, key);
}
var hashHas_default = hashHas;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_hashSet.js
var HASH_UNDEFINED2 = "__lodash_hash_undefined__";
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = nativeCreate_default && value === void 0 ? HASH_UNDEFINED2 : value;
  return this;
}
var hashSet_default = hashSet;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_Hash.js
function Hash(entries) {
  var index = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
Hash.prototype.clear = hashClear_default;
Hash.prototype["delete"] = hashDelete_default;
Hash.prototype.get = hashGet_default;
Hash.prototype.has = hashHas_default;
Hash.prototype.set = hashSet_default;
var Hash_default = Hash;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_listCacheClear.js
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}
var listCacheClear_default = listCacheClear;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_assocIndexOf.js
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq_default(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}
var assocIndexOf_default = assocIndexOf;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_listCacheDelete.js
var arrayProto = Array.prototype;
var splice = arrayProto.splice;
function listCacheDelete(key) {
  var data = this.__data__, index = assocIndexOf_default(data, key);
  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}
var listCacheDelete_default = listCacheDelete;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_listCacheGet.js
function listCacheGet(key) {
  var data = this.__data__, index = assocIndexOf_default(data, key);
  return index < 0 ? void 0 : data[index][1];
}
var listCacheGet_default = listCacheGet;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_listCacheHas.js
function listCacheHas(key) {
  return assocIndexOf_default(this.__data__, key) > -1;
}
var listCacheHas_default = listCacheHas;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_listCacheSet.js
function listCacheSet(key, value) {
  var data = this.__data__, index = assocIndexOf_default(data, key);
  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}
var listCacheSet_default = listCacheSet;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_ListCache.js
function ListCache(entries) {
  var index = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
ListCache.prototype.clear = listCacheClear_default;
ListCache.prototype["delete"] = listCacheDelete_default;
ListCache.prototype.get = listCacheGet_default;
ListCache.prototype.has = listCacheHas_default;
ListCache.prototype.set = listCacheSet_default;
var ListCache_default = ListCache;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_Map.js
var Map2 = getNative_default(root_default, "Map");
var Map_default = Map2;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_mapCacheClear.js
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    "hash": new Hash_default(),
    "map": new (Map_default || ListCache_default)(),
    "string": new Hash_default()
  };
}
var mapCacheClear_default = mapCacheClear;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_isKeyable.js
function isKeyable(value) {
  var type2 = typeof value;
  return type2 == "string" || type2 == "number" || type2 == "symbol" || type2 == "boolean" ? value !== "__proto__" : value === null;
}
var isKeyable_default = isKeyable;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_getMapData.js
function getMapData(map3, key) {
  var data = map3.__data__;
  return isKeyable_default(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
}
var getMapData_default = getMapData;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_mapCacheDelete.js
function mapCacheDelete(key) {
  var result = getMapData_default(this, key)["delete"](key);
  this.size -= result ? 1 : 0;
  return result;
}
var mapCacheDelete_default = mapCacheDelete;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_mapCacheGet.js
function mapCacheGet(key) {
  return getMapData_default(this, key).get(key);
}
var mapCacheGet_default = mapCacheGet;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_mapCacheHas.js
function mapCacheHas(key) {
  return getMapData_default(this, key).has(key);
}
var mapCacheHas_default = mapCacheHas;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_mapCacheSet.js
function mapCacheSet(key, value) {
  var data = getMapData_default(this, key), size = data.size;
  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}
var mapCacheSet_default = mapCacheSet;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_MapCache.js
function MapCache(entries) {
  var index = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
MapCache.prototype.clear = mapCacheClear_default;
MapCache.prototype["delete"] = mapCacheDelete_default;
MapCache.prototype.get = mapCacheGet_default;
MapCache.prototype.has = mapCacheHas_default;
MapCache.prototype.set = mapCacheSet_default;
var MapCache_default = MapCache;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/memoize.js
var FUNC_ERROR_TEXT = "Expected a function";
function memoize(func, resolver) {
  if (typeof func != "function" || resolver != null && typeof resolver != "function") {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache_default)();
  return memoized;
}
memoize.Cache = MapCache_default;
var memoize_default = memoize;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_memoizeCapped.js
var MAX_MEMOIZE_SIZE = 500;
function memoizeCapped(func) {
  var result = memoize_default(func, function(key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }
    return key;
  });
  var cache = result.cache;
  return result;
}
var memoizeCapped_default = memoizeCapped;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_stringToPath.js
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
var reEscapeChar = /\\(\\)?/g;
var stringToPath = memoizeCapped_default(function(string2) {
  var result = [];
  if (string2.charCodeAt(0) === 46) {
    result.push("");
  }
  string2.replace(rePropName, function(match, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
  });
  return result;
});
var stringToPath_default = stringToPath;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/toString.js
function toString(value) {
  return value == null ? "" : baseToString_default(value);
}
var toString_default = toString;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_castPath.js
function castPath(value, object) {
  if (isArray_default(value)) {
    return value;
  }
  return isKey_default(value, object) ? [value] : stringToPath_default(toString_default(value));
}
var castPath_default = castPath;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_toKey.js
var INFINITY3 = 1 / 0;
function toKey(value) {
  if (typeof value == "string" || isSymbol_default(value)) {
    return value;
  }
  var result = value + "";
  return result == "0" && 1 / value == -INFINITY3 ? "-0" : result;
}
var toKey_default = toKey;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseGet.js
function baseGet(object, path) {
  path = castPath_default(path, object);
  var index = 0, length = path.length;
  while (object != null && index < length) {
    object = object[toKey_default(path[index++])];
  }
  return index && index == length ? object : void 0;
}
var baseGet_default = baseGet;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/get.js
function get(object, path, defaultValue) {
  var result = object == null ? void 0 : baseGet_default(object, path);
  return result === void 0 ? defaultValue : result;
}
var get_default = get;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_arrayPush.js
function arrayPush(array, values2) {
  var index = -1, length = values2.length, offset = array.length;
  while (++index < length) {
    array[offset + index] = values2[index];
  }
  return array;
}
var arrayPush_default = arrayPush;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_isFlattenable.js
var spreadableSymbol = Symbol_default ? Symbol_default.isConcatSpreadable : void 0;
function isFlattenable(value) {
  return isArray_default(value) || isArguments_default(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
}
var isFlattenable_default = isFlattenable;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseFlatten.js
function baseFlatten(array, depth, predicate, isStrict, result) {
  var index = -1, length = array.length;
  predicate || (predicate = isFlattenable_default);
  result || (result = []);
  while (++index < length) {
    var value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        arrayPush_default(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}
var baseFlatten_default = baseFlatten;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/flatten.js
function flatten(array) {
  var length = array == null ? 0 : array.length;
  return length ? baseFlatten_default(array, 1) : [];
}
var flatten_default = flatten;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_flatRest.js
function flatRest(func) {
  return setToString_default(overRest_default(func, void 0, flatten_default), func + "");
}
var flatRest_default = flatRest;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_basePropertyOf.js
function basePropertyOf(object) {
  return function(key) {
    return object == null ? void 0 : object[key];
  };
}
var basePropertyOf_default = basePropertyOf;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_deburrLetter.js
var deburredLetters = {
  // Latin-1 Supplement block.
  "\xC0": "A",
  "\xC1": "A",
  "\xC2": "A",
  "\xC3": "A",
  "\xC4": "A",
  "\xC5": "A",
  "\xE0": "a",
  "\xE1": "a",
  "\xE2": "a",
  "\xE3": "a",
  "\xE4": "a",
  "\xE5": "a",
  "\xC7": "C",
  "\xE7": "c",
  "\xD0": "D",
  "\xF0": "d",
  "\xC8": "E",
  "\xC9": "E",
  "\xCA": "E",
  "\xCB": "E",
  "\xE8": "e",
  "\xE9": "e",
  "\xEA": "e",
  "\xEB": "e",
  "\xCC": "I",
  "\xCD": "I",
  "\xCE": "I",
  "\xCF": "I",
  "\xEC": "i",
  "\xED": "i",
  "\xEE": "i",
  "\xEF": "i",
  "\xD1": "N",
  "\xF1": "n",
  "\xD2": "O",
  "\xD3": "O",
  "\xD4": "O",
  "\xD5": "O",
  "\xD6": "O",
  "\xD8": "O",
  "\xF2": "o",
  "\xF3": "o",
  "\xF4": "o",
  "\xF5": "o",
  "\xF6": "o",
  "\xF8": "o",
  "\xD9": "U",
  "\xDA": "U",
  "\xDB": "U",
  "\xDC": "U",
  "\xF9": "u",
  "\xFA": "u",
  "\xFB": "u",
  "\xFC": "u",
  "\xDD": "Y",
  "\xFD": "y",
  "\xFF": "y",
  "\xC6": "Ae",
  "\xE6": "ae",
  "\xDE": "Th",
  "\xFE": "th",
  "\xDF": "ss",
  // Latin Extended-A block.
  "\u0100": "A",
  "\u0102": "A",
  "\u0104": "A",
  "\u0101": "a",
  "\u0103": "a",
  "\u0105": "a",
  "\u0106": "C",
  "\u0108": "C",
  "\u010A": "C",
  "\u010C": "C",
  "\u0107": "c",
  "\u0109": "c",
  "\u010B": "c",
  "\u010D": "c",
  "\u010E": "D",
  "\u0110": "D",
  "\u010F": "d",
  "\u0111": "d",
  "\u0112": "E",
  "\u0114": "E",
  "\u0116": "E",
  "\u0118": "E",
  "\u011A": "E",
  "\u0113": "e",
  "\u0115": "e",
  "\u0117": "e",
  "\u0119": "e",
  "\u011B": "e",
  "\u011C": "G",
  "\u011E": "G",
  "\u0120": "G",
  "\u0122": "G",
  "\u011D": "g",
  "\u011F": "g",
  "\u0121": "g",
  "\u0123": "g",
  "\u0124": "H",
  "\u0126": "H",
  "\u0125": "h",
  "\u0127": "h",
  "\u0128": "I",
  "\u012A": "I",
  "\u012C": "I",
  "\u012E": "I",
  "\u0130": "I",
  "\u0129": "i",
  "\u012B": "i",
  "\u012D": "i",
  "\u012F": "i",
  "\u0131": "i",
  "\u0134": "J",
  "\u0135": "j",
  "\u0136": "K",
  "\u0137": "k",
  "\u0138": "k",
  "\u0139": "L",
  "\u013B": "L",
  "\u013D": "L",
  "\u013F": "L",
  "\u0141": "L",
  "\u013A": "l",
  "\u013C": "l",
  "\u013E": "l",
  "\u0140": "l",
  "\u0142": "l",
  "\u0143": "N",
  "\u0145": "N",
  "\u0147": "N",
  "\u014A": "N",
  "\u0144": "n",
  "\u0146": "n",
  "\u0148": "n",
  "\u014B": "n",
  "\u014C": "O",
  "\u014E": "O",
  "\u0150": "O",
  "\u014D": "o",
  "\u014F": "o",
  "\u0151": "o",
  "\u0154": "R",
  "\u0156": "R",
  "\u0158": "R",
  "\u0155": "r",
  "\u0157": "r",
  "\u0159": "r",
  "\u015A": "S",
  "\u015C": "S",
  "\u015E": "S",
  "\u0160": "S",
  "\u015B": "s",
  "\u015D": "s",
  "\u015F": "s",
  "\u0161": "s",
  "\u0162": "T",
  "\u0164": "T",
  "\u0166": "T",
  "\u0163": "t",
  "\u0165": "t",
  "\u0167": "t",
  "\u0168": "U",
  "\u016A": "U",
  "\u016C": "U",
  "\u016E": "U",
  "\u0170": "U",
  "\u0172": "U",
  "\u0169": "u",
  "\u016B": "u",
  "\u016D": "u",
  "\u016F": "u",
  "\u0171": "u",
  "\u0173": "u",
  "\u0174": "W",
  "\u0175": "w",
  "\u0176": "Y",
  "\u0177": "y",
  "\u0178": "Y",
  "\u0179": "Z",
  "\u017B": "Z",
  "\u017D": "Z",
  "\u017A": "z",
  "\u017C": "z",
  "\u017E": "z",
  "\u0132": "IJ",
  "\u0133": "ij",
  "\u0152": "Oe",
  "\u0153": "oe",
  "\u0149": "'n",
  "\u017F": "s"
};
var deburrLetter = basePropertyOf_default(deburredLetters);
var deburrLetter_default = deburrLetter;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/deburr.js
var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
var rsComboMarksRange = "\\u0300-\\u036f";
var reComboHalfMarksRange = "\\ufe20-\\ufe2f";
var rsComboSymbolsRange = "\\u20d0-\\u20ff";
var rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange;
var rsCombo = "[" + rsComboRange + "]";
var reComboMark = RegExp(rsCombo, "g");
function deburr(string2) {
  string2 = toString_default(string2);
  return string2 && string2.replace(reLatin, deburrLetter_default).replace(reComboMark, "");
}
var deburr_default = deburr;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_stackClear.js
function stackClear() {
  this.__data__ = new ListCache_default();
  this.size = 0;
}
var stackClear_default = stackClear;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_stackDelete.js
function stackDelete(key) {
  var data = this.__data__, result = data["delete"](key);
  this.size = data.size;
  return result;
}
var stackDelete_default = stackDelete;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_stackGet.js
function stackGet(key) {
  return this.__data__.get(key);
}
var stackGet_default = stackGet;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_stackHas.js
function stackHas(key) {
  return this.__data__.has(key);
}
var stackHas_default = stackHas;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_stackSet.js
var LARGE_ARRAY_SIZE = 200;
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache_default) {
    var pairs2 = data.__data__;
    if (!Map_default || pairs2.length < LARGE_ARRAY_SIZE - 1) {
      pairs2.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache_default(pairs2);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}
var stackSet_default = stackSet;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_Stack.js
function Stack(entries) {
  var data = this.__data__ = new ListCache_default(entries);
  this.size = data.size;
}
Stack.prototype.clear = stackClear_default;
Stack.prototype["delete"] = stackDelete_default;
Stack.prototype.get = stackGet_default;
Stack.prototype.has = stackHas_default;
Stack.prototype.set = stackSet_default;
var Stack_default = Stack;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_arrayFilter.js
function arrayFilter(array, predicate) {
  var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}
var arrayFilter_default = arrayFilter;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/stubArray.js
function stubArray() {
  return [];
}
var stubArray_default = stubArray;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_getSymbols.js
var objectProto12 = Object.prototype;
var propertyIsEnumerable2 = objectProto12.propertyIsEnumerable;
var nativeGetSymbols = Object.getOwnPropertySymbols;
var getSymbols = !nativeGetSymbols ? stubArray_default : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter_default(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable2.call(object, symbol);
  });
};
var getSymbols_default = getSymbols;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseGetAllKeys.js
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray_default(object) ? result : arrayPush_default(result, symbolsFunc(object));
}
var baseGetAllKeys_default = baseGetAllKeys;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_getAllKeys.js
function getAllKeys(object) {
  return baseGetAllKeys_default(object, keys_default, getSymbols_default);
}
var getAllKeys_default = getAllKeys;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_DataView.js
var DataView = getNative_default(root_default, "DataView");
var DataView_default = DataView;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_Promise.js
var Promise2 = getNative_default(root_default, "Promise");
var Promise_default = Promise2;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_Set.js
var Set2 = getNative_default(root_default, "Set");
var Set_default = Set2;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_getTag.js
var mapTag2 = "[object Map]";
var objectTag2 = "[object Object]";
var promiseTag = "[object Promise]";
var setTag2 = "[object Set]";
var weakMapTag2 = "[object WeakMap]";
var dataViewTag2 = "[object DataView]";
var dataViewCtorString = toSource_default(DataView_default);
var mapCtorString = toSource_default(Map_default);
var promiseCtorString = toSource_default(Promise_default);
var setCtorString = toSource_default(Set_default);
var weakMapCtorString = toSource_default(WeakMap_default);
var getTag = baseGetTag_default;
if (DataView_default && getTag(new DataView_default(new ArrayBuffer(1))) != dataViewTag2 || Map_default && getTag(new Map_default()) != mapTag2 || Promise_default && getTag(Promise_default.resolve()) != promiseTag || Set_default && getTag(new Set_default()) != setTag2 || WeakMap_default && getTag(new WeakMap_default()) != weakMapTag2) {
  getTag = function(value) {
    var result = baseGetTag_default(value), Ctor = result == objectTag2 ? value.constructor : void 0, ctorString = Ctor ? toSource_default(Ctor) : "";
    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString:
          return dataViewTag2;
        case mapCtorString:
          return mapTag2;
        case promiseCtorString:
          return promiseTag;
        case setCtorString:
          return setTag2;
        case weakMapCtorString:
          return weakMapTag2;
      }
    }
    return result;
  };
}
var getTag_default = getTag;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_Uint8Array.js
var Uint8Array2 = root_default.Uint8Array;
var Uint8Array_default = Uint8Array2;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/concat.js
function concat() {
  var length = arguments.length;
  if (!length) {
    return [];
  }
  var args = Array(length - 1), array = arguments[0], index = length;
  while (index--) {
    args[index - 1] = arguments[index];
  }
  return arrayPush_default(isArray_default(array) ? copyArray_default(array) : [array], baseFlatten_default(args, 1));
}
var concat_default = concat;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_setCacheAdd.js
var HASH_UNDEFINED3 = "__lodash_hash_undefined__";
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED3);
  return this;
}
var setCacheAdd_default = setCacheAdd;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_setCacheHas.js
function setCacheHas(value) {
  return this.__data__.has(value);
}
var setCacheHas_default = setCacheHas;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_SetCache.js
function SetCache(values2) {
  var index = -1, length = values2 == null ? 0 : values2.length;
  this.__data__ = new MapCache_default();
  while (++index < length) {
    this.add(values2[index]);
  }
}
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd_default;
SetCache.prototype.has = setCacheHas_default;
var SetCache_default = SetCache;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_arraySome.js
function arraySome(array, predicate) {
  var index = -1, length = array == null ? 0 : array.length;
  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}
var arraySome_default = arraySome;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_cacheHas.js
function cacheHas(cache, key) {
  return cache.has(key);
}
var cacheHas_default = cacheHas;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_equalArrays.js
var COMPARE_PARTIAL_FLAG = 1;
var COMPARE_UNORDERED_FLAG = 2;
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  var arrStacked = stack.get(array);
  var othStacked = stack.get(other);
  if (arrStacked && othStacked) {
    return arrStacked == other && othStacked == array;
  }
  var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache_default() : void 0;
  stack.set(array, other);
  stack.set(other, array);
  while (++index < arrLength) {
    var arrValue = array[index], othValue = other[index];
    if (customizer) {
      var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== void 0) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    if (seen) {
      if (!arraySome_default(other, function(othValue2, othIndex) {
        if (!cacheHas_default(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
          return seen.push(othIndex);
        }
      })) {
        result = false;
        break;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
      result = false;
      break;
    }
  }
  stack["delete"](array);
  stack["delete"](other);
  return result;
}
var equalArrays_default = equalArrays;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_mapToArray.js
function mapToArray(map3) {
  var index = -1, result = Array(map3.size);
  map3.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}
var mapToArray_default = mapToArray;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_setToArray.js
function setToArray(set3) {
  var index = -1, result = Array(set3.size);
  set3.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}
var setToArray_default = setToArray;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_equalByTag.js
var COMPARE_PARTIAL_FLAG2 = 1;
var COMPARE_UNORDERED_FLAG2 = 2;
var boolTag2 = "[object Boolean]";
var dateTag2 = "[object Date]";
var errorTag2 = "[object Error]";
var mapTag3 = "[object Map]";
var numberTag2 = "[object Number]";
var regexpTag2 = "[object RegExp]";
var setTag3 = "[object Set]";
var stringTag2 = "[object String]";
var symbolTag2 = "[object Symbol]";
var arrayBufferTag2 = "[object ArrayBuffer]";
var dataViewTag3 = "[object DataView]";
var symbolProto2 = Symbol_default ? Symbol_default.prototype : void 0;
var symbolValueOf = symbolProto2 ? symbolProto2.valueOf : void 0;
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag3:
      if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;
    case arrayBufferTag2:
      if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array_default(object), new Uint8Array_default(other))) {
        return false;
      }
      return true;
    case boolTag2:
    case dateTag2:
    case numberTag2:
      return eq_default(+object, +other);
    case errorTag2:
      return object.name == other.name && object.message == other.message;
    case regexpTag2:
    case stringTag2:
      return object == other + "";
    case mapTag3:
      var convert = mapToArray_default;
    case setTag3:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG2;
      convert || (convert = setToArray_default);
      if (object.size != other.size && !isPartial) {
        return false;
      }
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG2;
      stack.set(object, other);
      var result = equalArrays_default(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack["delete"](object);
      return result;
    case symbolTag2:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}
var equalByTag_default = equalByTag;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_equalObjects.js
var COMPARE_PARTIAL_FLAG3 = 1;
var objectProto13 = Object.prototype;
var hasOwnProperty10 = objectProto13.hasOwnProperty;
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG3, objProps = getAllKeys_default(object), objLength = objProps.length, othProps = getAllKeys_default(other), othLength = othProps.length;
  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty10.call(other, key))) {
      return false;
    }
  }
  var objStacked = stack.get(object);
  var othStacked = stack.get(other);
  if (objStacked && othStacked) {
    return objStacked == other && othStacked == object;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);
  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key], othValue = other[key];
    if (customizer) {
      var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
    }
    if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == "constructor");
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor, othCtor = other.constructor;
    if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack["delete"](object);
  stack["delete"](other);
  return result;
}
var equalObjects_default = equalObjects;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseIsEqualDeep.js
var COMPARE_PARTIAL_FLAG4 = 1;
var argsTag3 = "[object Arguments]";
var arrayTag2 = "[object Array]";
var objectTag3 = "[object Object]";
var objectProto14 = Object.prototype;
var hasOwnProperty11 = objectProto14.hasOwnProperty;
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray_default(object), othIsArr = isArray_default(other), objTag = objIsArr ? arrayTag2 : getTag_default(object), othTag = othIsArr ? arrayTag2 : getTag_default(other);
  objTag = objTag == argsTag3 ? objectTag3 : objTag;
  othTag = othTag == argsTag3 ? objectTag3 : othTag;
  var objIsObj = objTag == objectTag3, othIsObj = othTag == objectTag3, isSameTag = objTag == othTag;
  if (isSameTag && isBuffer_default(object)) {
    if (!isBuffer_default(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack_default());
    return objIsArr || isTypedArray_default(object) ? equalArrays_default(object, other, bitmask, customizer, equalFunc, stack) : equalByTag_default(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG4)) {
    var objIsWrapped = objIsObj && hasOwnProperty11.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty11.call(other, "__wrapped__");
    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
      stack || (stack = new Stack_default());
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack_default());
  return equalObjects_default(object, other, bitmask, customizer, equalFunc, stack);
}
var baseIsEqualDeep_default = baseIsEqualDeep;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseIsEqual.js
function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || !isObjectLike_default(value) && !isObjectLike_default(other)) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep_default(value, other, bitmask, customizer, baseIsEqual, stack);
}
var baseIsEqual_default = baseIsEqual;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseIsMatch.js
var COMPARE_PARTIAL_FLAG5 = 1;
var COMPARE_UNORDERED_FLAG3 = 2;
function baseIsMatch(object, source, matchData, customizer) {
  var index = matchData.length, length = index, noCustomizer = !customizer;
  if (object == null) {
    return !length;
  }
  object = Object(object);
  while (index--) {
    var data = matchData[index];
    if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0], objValue = object[key], srcValue = data[1];
    if (noCustomizer && data[2]) {
      if (objValue === void 0 && !(key in object)) {
        return false;
      }
    } else {
      var stack = new Stack_default();
      if (customizer) {
        var result = customizer(objValue, srcValue, key, object, source, stack);
      }
      if (!(result === void 0 ? baseIsEqual_default(srcValue, objValue, COMPARE_PARTIAL_FLAG5 | COMPARE_UNORDERED_FLAG3, customizer, stack) : result)) {
        return false;
      }
    }
  }
  return true;
}
var baseIsMatch_default = baseIsMatch;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_isStrictComparable.js
function isStrictComparable(value) {
  return value === value && !isObject_default(value);
}
var isStrictComparable_default = isStrictComparable;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_getMatchData.js
function getMatchData(object) {
  var result = keys_default(object), length = result.length;
  while (length--) {
    var key = result[length], value = object[key];
    result[length] = [key, value, isStrictComparable_default(value)];
  }
  return result;
}
var getMatchData_default = getMatchData;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_matchesStrictComparable.js
function matchesStrictComparable(key, srcValue) {
  return function(object) {
    if (object == null) {
      return false;
    }
    return object[key] === srcValue && (srcValue !== void 0 || key in Object(object));
  };
}
var matchesStrictComparable_default = matchesStrictComparable;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseMatches.js
function baseMatches(source) {
  var matchData = getMatchData_default(source);
  if (matchData.length == 1 && matchData[0][2]) {
    return matchesStrictComparable_default(matchData[0][0], matchData[0][1]);
  }
  return function(object) {
    return object === source || baseIsMatch_default(object, source, matchData);
  };
}
var baseMatches_default = baseMatches;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseHasIn.js
function baseHasIn(object, key) {
  return object != null && key in Object(object);
}
var baseHasIn_default = baseHasIn;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_hasPath.js
function hasPath(object, path, hasFunc) {
  path = castPath_default(path, object);
  var index = -1, length = path.length, result = false;
  while (++index < length) {
    var key = toKey_default(path[index]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result || ++index != length) {
    return result;
  }
  length = object == null ? 0 : object.length;
  return !!length && isLength_default(length) && isIndex_default(key, length) && (isArray_default(object) || isArguments_default(object));
}
var hasPath_default = hasPath;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/hasIn.js
function hasIn(object, path) {
  return object != null && hasPath_default(object, path, baseHasIn_default);
}
var hasIn_default = hasIn;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseMatchesProperty.js
var COMPARE_PARTIAL_FLAG6 = 1;
var COMPARE_UNORDERED_FLAG4 = 2;
function baseMatchesProperty(path, srcValue) {
  if (isKey_default(path) && isStrictComparable_default(srcValue)) {
    return matchesStrictComparable_default(toKey_default(path), srcValue);
  }
  return function(object) {
    var objValue = get_default(object, path);
    return objValue === void 0 && objValue === srcValue ? hasIn_default(object, path) : baseIsEqual_default(srcValue, objValue, COMPARE_PARTIAL_FLAG6 | COMPARE_UNORDERED_FLAG4);
  };
}
var baseMatchesProperty_default = baseMatchesProperty;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseProperty.js
function baseProperty(key) {
  return function(object) {
    return object == null ? void 0 : object[key];
  };
}
var baseProperty_default = baseProperty;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_basePropertyDeep.js
function basePropertyDeep(path) {
  return function(object) {
    return baseGet_default(object, path);
  };
}
var basePropertyDeep_default = basePropertyDeep;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/property.js
function property(path) {
  return isKey_default(path) ? baseProperty_default(toKey_default(path)) : basePropertyDeep_default(path);
}
var property_default = property;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseIteratee.js
function baseIteratee(value) {
  if (typeof value == "function") {
    return value;
  }
  if (value == null) {
    return identity_default;
  }
  if (typeof value == "object") {
    return isArray_default(value) ? baseMatchesProperty_default(value[0], value[1]) : baseMatches_default(value);
  }
  return property_default(value);
}
var baseIteratee_default = baseIteratee;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_arrayAggregator.js
function arrayAggregator(array, setter, iteratee, accumulator) {
  var index = -1, length = array == null ? 0 : array.length;
  while (++index < length) {
    var value = array[index];
    setter(accumulator, value, iteratee(value), array);
  }
  return accumulator;
}
var arrayAggregator_default = arrayAggregator;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_createBaseFor.js
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}
var createBaseFor_default = createBaseFor;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseFor.js
var baseFor = createBaseFor_default();
var baseFor_default = baseFor;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseForOwn.js
function baseForOwn(object, iteratee) {
  return object && baseFor_default(object, iteratee, keys_default);
}
var baseForOwn_default = baseForOwn;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_createBaseEach.js
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    if (collection == null) {
      return collection;
    }
    if (!isArrayLike_default(collection)) {
      return eachFunc(collection, iteratee);
    }
    var length = collection.length, index = fromRight ? length : -1, iterable = Object(collection);
    while (fromRight ? index-- : ++index < length) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}
var createBaseEach_default = createBaseEach;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseEach.js
var baseEach = createBaseEach_default(baseForOwn_default);
var baseEach_default = baseEach;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseAggregator.js
function baseAggregator(collection, setter, iteratee, accumulator) {
  baseEach_default(collection, function(value, key, collection2) {
    setter(accumulator, value, iteratee(value), collection2);
  });
  return accumulator;
}
var baseAggregator_default = baseAggregator;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_createAggregator.js
function createAggregator(setter, initializer) {
  return function(collection, iteratee) {
    var func = isArray_default(collection) ? arrayAggregator_default : baseAggregator_default, accumulator = initializer ? initializer() : {};
    return func(collection, setter, baseIteratee_default(iteratee, 2), accumulator);
  };
}
var createAggregator_default = createAggregator;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/isArrayLikeObject.js
function isArrayLikeObject(value) {
  return isObjectLike_default(value) && isArrayLike_default(value);
}
var isArrayLikeObject_default = isArrayLikeObject;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_arrayIncludesWith.js
function arrayIncludesWith(array, value, comparator) {
  var index = -1, length = array == null ? 0 : array.length;
  while (++index < length) {
    if (comparator(value, array[index])) {
      return true;
    }
  }
  return false;
}
var arrayIncludesWith_default = arrayIncludesWith;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/last.js
function last(array) {
  var length = array == null ? 0 : array.length;
  return length ? array[length - 1] : void 0;
}
var last_default = last;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/escapeRegExp.js
var reRegExpChar2 = /[\\^$.*+?()[\]{}|]/g;
var reHasRegExpChar = RegExp(reRegExpChar2.source);
function escapeRegExp(string2) {
  string2 = toString_default(string2);
  return string2 && reHasRegExpChar.test(string2) ? string2.replace(reRegExpChar2, "\\$&") : string2;
}
var escapeRegExp_default = escapeRegExp;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/findLastIndex.js
var nativeMax2 = Math.max;
var nativeMin = Math.min;
function findLastIndex(array, predicate, fromIndex) {
  var length = array == null ? 0 : array.length;
  if (!length) {
    return -1;
  }
  var index = length - 1;
  if (fromIndex !== void 0) {
    index = toInteger_default(fromIndex);
    index = fromIndex < 0 ? nativeMax2(length + index, 0) : nativeMin(index, length - 1);
  }
  return baseFindIndex_default(array, baseIteratee_default(predicate, 3), index, true);
}
var findLastIndex_default = findLastIndex;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseMap.js
function baseMap(collection, iteratee) {
  var index = -1, result = isArrayLike_default(collection) ? Array(collection.length) : [];
  baseEach_default(collection, function(value, key, collection2) {
    result[++index] = iteratee(value, key, collection2);
  });
  return result;
}
var baseMap_default = baseMap;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_createFlow.js
var FUNC_ERROR_TEXT2 = "Expected a function";
var WRAP_CURRY_FLAG = 8;
var WRAP_PARTIAL_FLAG = 32;
var WRAP_ARY_FLAG = 128;
var WRAP_REARG_FLAG = 256;
function createFlow(fromRight) {
  return flatRest_default(function(funcs) {
    var length = funcs.length, index = length, prereq = LodashWrapper_default.prototype.thru;
    if (fromRight) {
      funcs.reverse();
    }
    while (index--) {
      var func = funcs[index];
      if (typeof func != "function") {
        throw new TypeError(FUNC_ERROR_TEXT2);
      }
      if (prereq && !wrapper && getFuncName_default(func) == "wrapper") {
        var wrapper = new LodashWrapper_default([], true);
      }
    }
    index = wrapper ? index : length;
    while (++index < length) {
      func = funcs[index];
      var funcName = getFuncName_default(func), data = funcName == "wrapper" ? getData_default(func) : void 0;
      if (data && isLaziable_default(data[0]) && data[1] == (WRAP_ARY_FLAG | WRAP_CURRY_FLAG | WRAP_PARTIAL_FLAG | WRAP_REARG_FLAG) && !data[4].length && data[9] == 1) {
        wrapper = wrapper[getFuncName_default(data[0])].apply(wrapper, data[3]);
      } else {
        wrapper = func.length == 1 && isLaziable_default(func) ? wrapper[funcName]() : wrapper.thru(func);
      }
    }
    return function() {
      var args = arguments, value = args[0];
      if (wrapper && args.length == 1 && isArray_default(value)) {
        return wrapper.plant(value).value();
      }
      var index2 = 0, result = length ? funcs[index2].apply(this, args) : value;
      while (++index2 < length) {
        result = funcs[index2].call(this, result);
      }
      return result;
    };
  });
}
var createFlow_default = createFlow;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/flow.js
var flow = createFlow_default();
var flow_default = flow;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/groupBy.js
var objectProto15 = Object.prototype;
var hasOwnProperty12 = objectProto15.hasOwnProperty;
var groupBy = createAggregator_default(function(result, value, key) {
  if (hasOwnProperty12.call(result, key)) {
    result[key].push(value);
  } else {
    baseAssignValue_default(result, key, [value]);
  }
});
var groupBy_default = groupBy;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseGt.js
function baseGt(value, other) {
  return value > other;
}
var baseGt_default = baseGt;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseValues.js
function baseValues(object, props) {
  return arrayMap_default(props, function(key) {
    return object[key];
  });
}
var baseValues_default = baseValues;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/values.js
function values(object) {
  return object == null ? [] : baseValues_default(object, keys_default(object));
}
var values_default = values;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/isEqual.js
function isEqual(value, other) {
  return baseIsEqual_default(value, other);
}
var isEqual_default = isEqual;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseLt.js
function baseLt(value, other) {
  return value < other;
}
var baseLt_default = baseLt;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseExtremum.js
function baseExtremum(array, iteratee, comparator) {
  var index = -1, length = array.length;
  while (++index < length) {
    var value = array[index], current2 = iteratee(value);
    if (current2 != null && (computed === void 0 ? current2 === current2 && !isSymbol_default(current2) : comparator(current2, computed))) {
      var computed = current2, result = value;
    }
  }
  return result;
}
var baseExtremum_default = baseExtremum;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/maxBy.js
function maxBy(array, iteratee) {
  return array && array.length ? baseExtremum_default(array, baseIteratee_default(iteratee, 2), baseGt_default) : void 0;
}
var maxBy_default = maxBy;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseSum.js
function baseSum(array, iteratee) {
  var result, index = -1, length = array.length;
  while (++index < length) {
    var current2 = iteratee(array[index]);
    if (current2 !== void 0) {
      result = result === void 0 ? current2 : result + current2;
    }
  }
  return result;
}
var baseSum_default = baseSum;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/min.js
function min(array) {
  return array && array.length ? baseExtremum_default(array, identity_default, baseLt_default) : void 0;
}
var min_default = min;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseSortBy.js
function baseSortBy(array, comparer) {
  var length = array.length;
  array.sort(comparer);
  while (length--) {
    array[length] = array[length].value;
  }
  return array;
}
var baseSortBy_default = baseSortBy;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_compareAscending.js
function compareAscending(value, other) {
  if (value !== other) {
    var valIsDefined = value !== void 0, valIsNull = value === null, valIsReflexive = value === value, valIsSymbol = isSymbol_default(value);
    var othIsDefined = other !== void 0, othIsNull = other === null, othIsReflexive = other === other, othIsSymbol = isSymbol_default(other);
    if (!othIsNull && !othIsSymbol && !valIsSymbol && value > other || valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol || valIsNull && othIsDefined && othIsReflexive || !valIsDefined && othIsReflexive || !valIsReflexive) {
      return 1;
    }
    if (!valIsNull && !valIsSymbol && !othIsSymbol && value < other || othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol || othIsNull && valIsDefined && valIsReflexive || !othIsDefined && valIsReflexive || !othIsReflexive) {
      return -1;
    }
  }
  return 0;
}
var compareAscending_default = compareAscending;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_compareMultiple.js
function compareMultiple(object, other, orders) {
  var index = -1, objCriteria = object.criteria, othCriteria = other.criteria, length = objCriteria.length, ordersLength = orders.length;
  while (++index < length) {
    var result = compareAscending_default(objCriteria[index], othCriteria[index]);
    if (result) {
      if (index >= ordersLength) {
        return result;
      }
      var order = orders[index];
      return result * (order == "desc" ? -1 : 1);
    }
  }
  return object.index - other.index;
}
var compareMultiple_default = compareMultiple;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseOrderBy.js
function baseOrderBy(collection, iteratees, orders) {
  if (iteratees.length) {
    iteratees = arrayMap_default(iteratees, function(iteratee) {
      if (isArray_default(iteratee)) {
        return function(value) {
          return baseGet_default(value, iteratee.length === 1 ? iteratee[0] : iteratee);
        };
      }
      return iteratee;
    });
  } else {
    iteratees = [identity_default];
  }
  var index = -1;
  iteratees = arrayMap_default(iteratees, baseUnary_default(baseIteratee_default));
  var result = baseMap_default(collection, function(value, key, collection2) {
    var criteria = arrayMap_default(iteratees, function(iteratee) {
      return iteratee(value);
    });
    return { "criteria": criteria, "index": ++index, "value": value };
  });
  return baseSortBy_default(result, function(object, other) {
    return compareMultiple_default(object, other, orders);
  });
}
var baseOrderBy_default = baseOrderBy;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseRepeat.js
var MAX_SAFE_INTEGER3 = 9007199254740991;
var nativeFloor = Math.floor;
function baseRepeat(string2, n) {
  var result = "";
  if (!string2 || n < 1 || n > MAX_SAFE_INTEGER3) {
    return result;
  }
  do {
    if (n % 2) {
      result += string2;
    }
    n = nativeFloor(n / 2);
    if (n) {
      string2 += string2;
    }
  } while (n);
  return result;
}
var baseRepeat_default = baseRepeat;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseIndexOfWith.js
function baseIndexOfWith(array, value, fromIndex, comparator) {
  var index = fromIndex - 1, length = array.length;
  while (++index < length) {
    if (comparator(array[index], value)) {
      return index;
    }
  }
  return -1;
}
var baseIndexOfWith_default = baseIndexOfWith;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_basePullAll.js
var arrayProto2 = Array.prototype;
var splice2 = arrayProto2.splice;
function basePullAll(array, values2, iteratee, comparator) {
  var indexOf = comparator ? baseIndexOfWith_default : baseIndexOf_default, index = -1, length = values2.length, seen = array;
  if (array === values2) {
    values2 = copyArray_default(values2);
  }
  if (iteratee) {
    seen = arrayMap_default(array, baseUnary_default(iteratee));
  }
  while (++index < length) {
    var fromIndex = 0, value = values2[index], computed = iteratee ? iteratee(value) : value;
    while ((fromIndex = indexOf(seen, computed, fromIndex, comparator)) > -1) {
      if (seen !== array) {
        splice2.call(seen, fromIndex, 1);
      }
      splice2.call(array, fromIndex, 1);
    }
  }
  return array;
}
var basePullAll_default = basePullAll;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/pullAll.js
function pullAll(array, values2) {
  return array && array.length && values2 && values2.length ? basePullAll_default(array, values2) : array;
}
var pullAll_default = pullAll;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/pull.js
var pull = baseRest_default(pullAll_default);
var pull_default = pull;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseRandom.js
var nativeFloor2 = Math.floor;
var nativeRandom = Math.random;
function baseRandom(lower, upper) {
  return lower + nativeFloor2(nativeRandom() * (upper - lower + 1));
}
var baseRandom_default = baseRandom;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseRange.js
var nativeCeil = Math.ceil;
var nativeMax3 = Math.max;
function baseRange(start, end, step, fromRight) {
  var index = -1, length = nativeMax3(nativeCeil((end - start) / (step || 1)), 0), result = Array(length);
  while (length--) {
    result[fromRight ? length : ++index] = start;
    start += step;
  }
  return result;
}
var baseRange_default = baseRange;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_createRange.js
function createRange(fromRight) {
  return function(start, end, step) {
    if (step && typeof step != "number" && isIterateeCall_default(start, end, step)) {
      end = step = void 0;
    }
    start = toFinite_default(start);
    if (end === void 0) {
      end = start;
      start = 0;
    } else {
      end = toFinite_default(end);
    }
    step = step === void 0 ? start < end ? 1 : -1 : toFinite_default(step);
    return baseRange_default(start, end, step, fromRight);
  };
}
var createRange_default = createRange;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/range.js
var range = createRange_default();
var range_default = range;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/repeat.js
function repeat(string2, n, guard) {
  if (guard ? isIterateeCall_default(string2, n, guard) : n === void 0) {
    n = 1;
  } else {
    n = toInteger_default(n);
  }
  return baseRepeat_default(toString_default(string2), n);
}
var repeat_default = repeat;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_shuffleSelf.js
function shuffleSelf(array, size) {
  var index = -1, length = array.length, lastIndex = length - 1;
  size = size === void 0 ? length : size;
  while (++index < size) {
    var rand = baseRandom_default(index, lastIndex), value = array[rand];
    array[rand] = array[index];
    array[index] = value;
  }
  array.length = size;
  return array;
}
var shuffleSelf_default = shuffleSelf;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_arrayShuffle.js
function arrayShuffle(array) {
  return shuffleSelf_default(copyArray_default(array));
}
var arrayShuffle_default = arrayShuffle;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseShuffle.js
function baseShuffle(collection) {
  return shuffleSelf_default(values_default(collection));
}
var baseShuffle_default = baseShuffle;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/shuffle.js
function shuffle(collection) {
  var func = isArray_default(collection) ? arrayShuffle_default : baseShuffle_default;
  return func(collection);
}
var shuffle_default = shuffle;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/sortBy.js
var sortBy = baseRest_default(function(collection, iteratees) {
  if (collection == null) {
    return [];
  }
  var length = iteratees.length;
  if (length > 1 && isIterateeCall_default(collection, iteratees[0], iteratees[1])) {
    iteratees = [];
  } else if (length > 2 && isIterateeCall_default(iteratees[0], iteratees[1], iteratees[2])) {
    iteratees = [iteratees[0]];
  }
  return baseOrderBy_default(collection, baseFlatten_default(iteratees, 1), []);
});
var sortBy_default = sortBy;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/sumBy.js
function sumBy(array, iteratee) {
  return array && array.length ? baseSum_default(array, baseIteratee_default(iteratee, 2)) : 0;
}
var sumBy_default = sumBy;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_createSet.js
var INFINITY4 = 1 / 0;
var createSet = !(Set_default && 1 / setToArray_default(new Set_default([, -0]))[1] == INFINITY4) ? noop_default : function(values2) {
  return new Set_default(values2);
};
var createSet_default = createSet;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/_baseUniq.js
var LARGE_ARRAY_SIZE2 = 200;
function baseUniq(array, iteratee, comparator) {
  var index = -1, includes = arrayIncludes_default, length = array.length, isCommon = true, result = [], seen = result;
  if (comparator) {
    isCommon = false;
    includes = arrayIncludesWith_default;
  } else if (length >= LARGE_ARRAY_SIZE2) {
    var set3 = iteratee ? null : createSet_default(array);
    if (set3) {
      return setToArray_default(set3);
    }
    isCommon = false;
    includes = cacheHas_default;
    seen = new SetCache_default();
  } else {
    seen = iteratee ? [] : result;
  }
  outer:
    while (++index < length) {
      var value = array[index], computed = iteratee ? iteratee(value) : value;
      value = comparator || value !== 0 ? value : 0;
      if (isCommon && computed === computed) {
        var seenIndex = seen.length;
        while (seenIndex--) {
          if (seen[seenIndex] === computed) {
            continue outer;
          }
        }
        if (iteratee) {
          seen.push(computed);
        }
        result.push(value);
      } else if (!includes(seen, computed, comparator)) {
        if (seen !== result) {
          seen.push(computed);
        }
        result.push(value);
      }
    }
  return result;
}
var baseUniq_default = baseUniq;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/uniq.js
function uniq(array) {
  return array && array.length ? baseUniq_default(array) : [];
}
var uniq_default = uniq;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/uniqWith.js
function uniqWith(array, comparator) {
  comparator = typeof comparator == "function" ? comparator : void 0;
  return array && array.length ? baseUniq_default(array, void 0, comparator) : [];
}
var uniqWith_default = uniqWith;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/unzip.js
var nativeMax4 = Math.max;
function unzip(array) {
  if (!(array && array.length)) {
    return [];
  }
  var length = 0;
  array = arrayFilter_default(array, function(group) {
    if (isArrayLikeObject_default(group)) {
      length = nativeMax4(group.length, length);
      return true;
    }
  });
  return baseTimes_default(length, function(index) {
    return arrayMap_default(array, baseProperty_default(index));
  });
}
var unzip_default = unzip;

// ../../node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/zip.js
var zip = baseRest_default(unzip_default);
var zip_default = zip;

// ../common/src/ide/fake/FakeCapabilities.ts
var FakeCapabilities = class {
  constructor() {
    this.commands = {
      clipboardPaste: void 0,
      clipboardCopy: void 0,
      toggleLineComment: void 0,
      indentLine: void 0,
      outdentLine: void 0,
      rename: void 0,
      quickFix: void 0,
      revealDefinition: void 0,
      revealTypeDefinition: void 0,
      showHover: void 0,
      showDebugHover: void 0,
      extractVariable: void 0,
      fold: void 0,
      highlight: { acceptsLocation: true },
      unfold: void 0,
      showReferences: void 0,
      insertLineAfter: void 0
    };
  }
};

// ../common/src/ide/fake/FakeClipboard.ts
var FakeClipboard = class {
  constructor() {
    this.clipboardContents = "";
  }
  async readText() {
    return this.clipboardContents;
  }
  async writeText(value) {
    this.clipboardContents = value;
  }
};

// ../common/src/util/Notifier.ts
var Notifier = class {
  constructor() {
    this.listeners = [];
    /**
     * Notify all listeners that something has changed
     */
    this.notifyListeners = (...args) => {
      this.listeners.forEach((listener) => listener(...args));
    };
    this.registerListener = this.registerListener.bind(this);
  }
  /**
   * Register to be notified when {@link notifyListeners} is called
   * @param listener A function to be called when {@link notifyListeners} is called
   * @returns A function that can be called to unsubscribe from notifications
   */
  registerListener(listener) {
    this.listeners.push(listener);
    return {
      dispose: () => {
        pull_default(this.listeners, listener);
      }
    };
  }
};

// ../common/src/ide/types/Configuration.ts
var CONFIGURATION_DEFAULTS = {
  tokenHatSplittingMode: {
    preserveCase: false,
    lettersToPreserve: [],
    symbolsToPreserve: []
  },
  wordSeparators: ["_"],
  decorationDebounceDelayMs: 50,
  experimental: {
    snippetsDir: void 0,
    hatStability: "balanced" /* balanced */,
    keyboardTargetFollowsSelection: false
  },
  commandHistory: false,
  debug: false
};

// ../common/src/ide/fake/FakeConfiguration.ts
var FakeConfiguration = class {
  constructor() {
    this.notifier = new Notifier();
    this.mocks = {
      ...CONFIGURATION_DEFAULTS
    };
    this.scopes = [];
    this.onDidChangeConfiguration = this.notifier.registerListener;
    this.onDidChangeConfiguration = this.onDidChangeConfiguration.bind(this);
  }
  getOwnConfiguration(path, scope) {
    if (scope != null) {
      for (const { scope: candidateScope, values: values2 } of this.scopes) {
        if (scopeMatches(candidateScope, scope)) {
          return get_default(values2, path) ?? get_default(this.mocks, path);
        }
      }
    }
    return get_default(this.mocks, path);
  }
  mockConfiguration(key, value) {
    this.mocks[key] = value;
    this.notifier.notifyListeners();
  }
  mockConfigurationScope(scope, values2, noNotification = false) {
    this.scopes.push({ scope, values: values2 });
    if (!noNotification) {
      this.notifier.notifyListeners();
    }
  }
};
function scopeMatches(candidateScope, scope) {
  return candidateScope.languageId === scope.languageId;
}

// ../common/src/ide/types/KeyValueStore.ts
var KEY_VALUE_STORE_DEFAULTS = {
  hideInferenceWarning: false,
  tutorialProgress: {}
};

// ../common/src/ide/fake/FakeKeyValueStore.ts
var FakeKeyValueStore = class {
  constructor() {
    this.data = { ...KEY_VALUE_STORE_DEFAULTS };
  }
  get(key) {
    return this.data[key];
  }
  set(key, value) {
    this.data[key] = value;
    return Promise.resolve();
  }
};

// ../common/src/ide/fake/FakeMessages.ts
var FakeMessages = class {
  async showMessage(_type, _id, _message, ..._options) {
    return void 0;
  }
};

// ../common/src/ide/fake/FakeIDE.ts
var FakeIDE = class {
  constructor() {
    this.configuration = new FakeConfiguration();
    this.messages = new FakeMessages();
    this.keyValueStore = new FakeKeyValueStore();
    this.clipboard = new FakeClipboard();
    this.capabilities = new FakeCapabilities();
    this.runMode = "test";
    this.cursorlessVersion = "0.0.0";
    this.workspaceFolders = void 0;
    this.disposables = [];
    this.quickPickReturnValue = void 0;
    this.onDidOpenTextDocument = dummyEvent;
    this.onDidCloseTextDocument = dummyEvent;
    this.onDidChangeActiveTextEditor = dummyEvent;
    this.onDidChangeVisibleTextEditors = dummyEvent;
    this.onDidChangeTextEditorSelection = dummyEvent;
    this.onDidChangeTextEditorVisibleRanges = dummyEvent;
  }
  async flashRanges(_flashDescriptors) {
  }
  async setHighlightRanges(_highlightId, _editor, _ranges) {
  }
  mockAssetsRoot(_assetsRoot) {
    this.assetsRoot_ = _assetsRoot;
  }
  get assetsRoot() {
    if (this.assetsRoot_ == null) {
      throw Error("Field `assetsRoot` has not yet been mocked");
    }
    return this.assetsRoot_;
  }
  get activeTextEditor() {
    throw Error("Not implemented");
  }
  get activeEditableTextEditor() {
    throw Error("Not implemented");
  }
  get visibleTextEditors() {
    throw Error("Not implemented");
  }
  getEditableTextEditor(_editor) {
    throw Error("Not implemented");
  }
  findInDocument(_query, _editor) {
    throw Error("Not implemented");
  }
  findInWorkspace(_query) {
    throw Error("Not implemented");
  }
  openTextDocument(_path) {
    throw Error("Not implemented");
  }
  openUntitledTextDocument(_options) {
    throw Error("Not implemented");
  }
  setQuickPickReturnValue(value) {
    this.quickPickReturnValue = value;
  }
  async showQuickPick(_items, _options) {
    return this.quickPickReturnValue;
  }
  showInputBox(_options) {
    throw Error("Not implemented");
  }
  executeCommand(_command, ..._args) {
    throw new Error("Method not implemented.");
  }
  onDidChangeTextDocument(_listener) {
    throw Error("Not implemented");
  }
  disposeOnExit(...disposables) {
    this.disposables.push(...disposables);
    return () => pull_default(this.disposables, ...disposables);
  }
  exit() {
    this.disposables.forEach((disposable) => disposable.dispose());
  }
};
function dummyEvent() {
  return {
    dispose() {
    }
  };
}

// ../common/src/types/Position.ts
var Position = class _Position {
  /**
   * @param line A zero-based line value.
   * @param character A zero-based character value.
   */
  constructor(line, character) {
    this.line = line;
    this.character = character;
  }
  /**
   * Check if this position is equal to `other`.
   *
   * @param other A position.
   * @return `true` if the line and character of the given position are equal to
   * the line and character of this position.
   */
  isEqual(other) {
    return this.line === other.line && this.character === other.character;
  }
  /**
   * Check if this position is before `other`.
   *
   * @param other A position.
   * @return `true` if position is on a smaller line
   * or on the same line on a smaller character.
   */
  isBefore(other) {
    if (this.line < other.line) {
      return true;
    }
    if (this.line > other.line) {
      return false;
    }
    return this.character < other.character;
  }
  /**
   * Check if this position is after `other`.
   *
   * @param other A position.
   * @return `true` if position is on a greater line
   * or on the same line on a greater character.
   */
  isAfter(other) {
    if (this.line > other.line) {
      return true;
    }
    if (this.line < other.line) {
      return false;
    }
    return this.character > other.character;
  }
  /**
   * Check if this position is before or equal to `other`.
   *
   * @param other A position.
   * @return `true` if position is on a smaller line
   * or on the same line on a smaller or equal character.
   */
  isBeforeOrEqual(other) {
    return this.isEqual(other) || this.isBefore(other);
  }
  /**
   * Check if this position is after or equal to `other`.
   *
   * @param other A position.
   * @return `true` if position is on a greater line
   * or on the same line on a greater or equal character.
   */
  isAfterOrEqual(other) {
    return this.isEqual(other) || this.isAfter(other);
  }
  /**
   * Compare this to `other`.
   *
   * @param other A position.
   * @return A number smaller than zero if this position is before the given position,
   * a number greater than zero if this position is after the given position, or zero when
   * this and the given position are equal.
   */
  compareTo(other) {
    if (this.isBefore(other)) {
      return -1;
    }
    if (this.isAfter(other)) {
      return 1;
    }
    return 0;
  }
  /**
   * Create a new position derived from this position.
   *
   * @param line Value that should be used as line value, default is the {@link Position.line existing value}
   * @param character Value that should be used as character value, default is the {@link Position.character existing value}
   * @return A position where line and character are replaced by the given values.
   */
  with(line, character) {
    return new _Position(line ?? this.line, character ?? this.character);
  }
  /**
   * Create a new position relative to this position.
   *
   * @param lineDelta Delta value for the line value, default is `0`.
   * @param characterDelta Delta value for the character value, default is `0`.
   * @return A position which line and character is the sum of the current line and
   * character and the corresponding deltas.
   */
  translate(lineDelta, characterDelta) {
    return new _Position(
      this.line + (lineDelta ?? 0),
      this.character + (characterDelta ?? 0)
    );
  }
  /**
   * Create a new empty range from this position.
   * @returns A {@link Range}
   */
  toEmptyRange() {
    return new Range(this, this);
  }
  /**
   * Return a concise string representation of the position.
   * @returns concise representation
   **/
  concise() {
    return `${this.line}:${this.character}`;
  }
  toString() {
    return this.concise();
  }
};
function adjustPosition(doc, pos, by) {
  return doc.positionAt(doc.offsetAt(pos) + by);
}

// ../common/src/types/Range.ts
var Range = class _Range {
  constructor(...args) {
    const [p1, p2] = (() => {
      if (args.length === 2) {
        return args;
      }
      return [new Position(args[0], args[1]), new Position(args[2], args[3])];
    })();
    if (p1.isBefore(p2)) {
      this.start = p1;
      this.end = p2;
    } else {
      this.start = p2;
      this.end = p1;
    }
  }
  /**
   * `true` if `start` and `end` are equal.
   */
  get isEmpty() {
    return this.start.isEqual(this.end);
  }
  /**
   * `true` if `start.line` and `end.line` are equal.
   */
  get isSingleLine() {
    return this.start.line === this.end.line;
  }
  /**
   * Check if `other` equals this range.
   *
   * @param other A range.
   * @return `true` when start and end are {@link Position.isEqual equal} to
   * start and end of this range.
   */
  isRangeEqual(other) {
    return this.start.isEqual(other.start) && this.end.isEqual(other.end);
  }
  /**
   * Check if a position or a range is contained in this range.
   *
   * @param positionOrRange A position or a range.
   * @return `true` if the position or range is inside or equal
   * to this range.
   */
  contains(positionOrRange) {
    const [start, end] = positionOrRange instanceof Position ? [positionOrRange, positionOrRange] : [positionOrRange.start, positionOrRange.end];
    return start.isAfterOrEqual(this.start) && end.isBeforeOrEqual(this.end);
  }
  /**
   * Intersect `range` with this range and returns a new range.
   * If the ranges are adjacent but non-overlapping, the resulting range is empty.
   * If the ranges have no overlap and are not adjacent, it returns `undefined`.
   *
   * @param other A range.
   * @return A range of the greater start and smaller end positions. Will
   * return undefined when there is no overlap.
   */
  intersection(other) {
    const start = this.start.isAfter(other.start) ? this.start : other.start;
    const end = this.end.isBefore(other.end) ? this.end : other.end;
    return start.isBeforeOrEqual(end) ? new _Range(start, end) : void 0;
  }
  /**
   * Compute the union of `other` with this range.
   *
   * @param other A range.
   * @return A range of smaller start position and the greater end position.
   */
  union(other) {
    return new _Range(
      this.start.isBefore(other.start) ? this.start : other.start,
      this.end.isAfter(other.end) ? this.end : other.end
    );
  }
  /**
   * Derive a new range from this range.
   * If the resulting range has end before start, they are swapped.
   *
   * @param start A position that should be used as start. The default value is the {@link Range.start current start}.
   * @param end A position that should be used as end. The default value is the {@link Range.end current end}.
   * @return A range derived from this range with the given start and end position.
   */
  with(start, end) {
    return new _Range(start ?? this.start, end ?? this.end);
  }
  /**
   * Construct a new selection from this range
   * @param isReversed If true active is before anchor
   * @returns A new selection
   */
  toSelection(isReversed) {
    return isReversed ? new Selection(this.end, this.start) : new Selection(this.start, this.end);
  }
  /**
   * Return a concise string representation of the range
   * @returns concise representation
   **/
  concise() {
    return `${this.start.concise()}-${this.end.concise()}`;
  }
  toString() {
    return this.concise();
  }
};

// ../common/src/util/regex.ts
function _rightAnchored(regex) {
  const { source, flags } = regex;
  return new RegExp(`(${source})$`, flags.replace("m", ""));
}
function _leftAnchored(regex) {
  const { source, flags } = regex;
  return new RegExp(`^(${source})`, flags.replace("m", ""));
}
function makeCache(func) {
  const cache = /* @__PURE__ */ new Map();
  function wrapper(arg) {
    let cachedValue = cache.get(arg);
    if (cachedValue == null) {
      cachedValue = func(arg);
      cache.set(arg, cachedValue);
    }
    return cachedValue;
  }
  return wrapper;
}
var rightAnchored = makeCache(_rightAnchored);
var leftAnchored = makeCache(_leftAnchored);
function matchAll(text, regex, mapfn) {
  regex.lastIndex = 0;
  return Array.from(text.matchAll(regex), mapfn);
}
function testRegex(regex, text) {
  regex.lastIndex = 0;
  return regex.test(text);
}
function matchRegex(regex, text) {
  regex.lastIndex = 0;
  return text.match(regex);
}
function matchText(text, regex) {
  return matchAll(text, regex, (match) => ({
    index: match.index,
    text: match[0]
  }));
}
function getLeadingWhitespace(text) {
  return text.match(/^\s+/)?.[0] ?? "";
}
function getTrailingWhitespace(text) {
  return text.match(/\s+$/)?.[0] ?? "";
}

// ../common/src/ide/inMemoryTextDocument/InMemoryTextLine.ts
var InMemoryTextLine = class {
  constructor(lineNumber, offset, text, eol) {
    this.lineNumber = lineNumber;
    this.offset = offset;
    this.text = text;
    this.isEmptyOrWhitespace = /^\s*$/.test(text);
    this.lengthIncludingEol = text.length + (eol?.length ?? 0);
    const start = new Position(lineNumber, 0);
    const end = new Position(lineNumber, text.length);
    const endIncludingLineBreak = eol != null ? new Position(lineNumber + 1, 0) : end;
    this.range = new Range(start, end);
    this.rangeIncludingLineBreak = new Range(start, endIncludingLineBreak);
    this.rangeTrimmed = this.isEmptyOrWhitespace ? void 0 : new Range(
      start.translate(void 0, getLeadingWhitespace(text).length),
      end.translate(void 0, -getTrailingWhitespace(text).length)
    );
  }
};

// ../common/src/ide/inMemoryTextDocument/performEdits.ts
function performEdits(document, edits) {
  const changes = createChangeEvents(document, edits);
  let result = document.getText();
  for (const change of changes) {
    const { text, rangeOffset, rangeLength } = change;
    result = result.slice(0, rangeOffset) + text + result.slice(rangeOffset + rangeLength);
  }
  return { text: result, changes };
}
function createChangeEvents(document, edits) {
  const changes = [];
  const sortedEdits = edits.map((edit, index) => ({ edit, index })).sort((a, b) => {
    if (a.edit.range.start.isEqual(b.edit.range.start)) {
      return b.index - a.index;
    }
    return b.edit.range.start.compareTo(a.edit.range.start);
  }).map(({ edit }) => edit);
  const eol = document.eol === "LF" ? "\n" : "\r\n";
  for (const edit of sortedEdits) {
    const previousChange = changes[changes.length - 1];
    const intersection = previousChange?.range.intersection(edit.range);
    if (intersection != null && !intersection.isEmpty) {
      if (!previousChange.text && !edit.text) {
        changes[changes.length - 1] = createChangeEvent(
          document,
          previousChange.range.union(edit.range),
          ""
        );
        continue;
      }
      throw Error("Overlapping ranges are not allowed!");
    }
    const text = edit.text.replace(/\r?\n/g, eol);
    changes.push(createChangeEvent(document, edit.range, text));
  }
  return changes;
}
function createChangeEvent(document, range3, text) {
  const start = document.offsetAt(range3.start);
  const end = document.offsetAt(range3.end);
  return {
    text,
    range: range3,
    rangeOffset: start,
    rangeLength: end - start
  };
}

// ../common/src/ide/inMemoryTextDocument/InMemoryTextDocument.ts
var InMemoryTextDocument = class {
  constructor(uri, languageId, text) {
    this.uri = uri;
    this.languageId = languageId;
    this.filename = uri.path.split(/\\|\//g).at(-1) ?? "";
    this._text = "";
    this._eol = "LF";
    this._version = -1;
    this._lines = [];
    this.setTextInternal(text);
  }
  get version() {
    return this._version;
  }
  get lineCount() {
    return this._lines.length;
  }
  get eol() {
    return this._eol;
  }
  get text() {
    return this._text;
  }
  get range() {
    return new Range(this._lines[0].range.start, this._lines.at(-1).range.end);
  }
  setTextInternal(text) {
    this._text = text;
    this._eol = text.includes("\r\n") ? "CRLF" : "LF";
    this._version++;
    this._lines = createLines(text);
  }
  lineAt(lineOrPosition) {
    const value = typeof lineOrPosition === "number" ? lineOrPosition : lineOrPosition.line;
    const index = clamp(value, 0, this.lineCount - 1);
    return this._lines[index];
  }
  offsetAt(position) {
    if (position.line < 0) {
      return 0;
    }
    if (position.line > this._lines.length - 1) {
      return this._text.length;
    }
    const line = this._lines[position.line];
    return line.offset + clamp(position.character, 0, line.text.length);
  }
  positionAt(offset) {
    if (offset <= 0) {
      return this.range.start;
    }
    if (offset >= this._text.length) {
      return this.range.end;
    }
    const line = this._lines.find(
      (line2) => offset < line2.offset + line2.lengthIncludingEol
    );
    if (line == null) {
      throw Error(`Couldn't find line for offset ${offset}`);
    }
    return new Position(
      line.lineNumber,
      Math.min(offset - line.offset, line.text.length)
    );
  }
  getText(range3) {
    if (range3 == null) {
      return this.text;
    }
    const startOffset = this.offsetAt(range3.start);
    const endOffset = this.offsetAt(range3.end);
    return this.text.slice(startOffset, endOffset);
  }
  edit(edits) {
    const { text, changes } = performEdits(this, edits);
    this.setTextInternal(text);
    return changes;
  }
};
function createLines(text) {
  const documentParts = text.split(/(\r?\n)/g);
  const result = [];
  let offset = 0;
  for (let i = 0; i < documentParts.length; i += 2) {
    const line = new InMemoryTextLine(
      result.length,
      offset,
      documentParts[i],
      documentParts[i + 1]
    );
    result.push(line);
    offset += line.lengthIncludingEol;
  }
  return result;
}
function clamp(value, min2, max) {
  return Math.min(Math.max(value, min2), max);
}

// ../common/src/ide/PassthroughIDEBase.ts
var PassthroughIDEBase = class {
  constructor(original) {
    this.original = original;
    this.configuration = original.configuration;
    this.keyValueStore = original.keyValueStore;
    this.clipboard = original.clipboard;
    this.messages = original.messages;
    this.capabilities = original.capabilities;
  }
  flashRanges(flashDescriptors) {
    return this.original.flashRanges(flashDescriptors);
  }
  setHighlightRanges(highlightId, editor, ranges) {
    return this.original.setHighlightRanges(highlightId, editor, ranges);
  }
  onDidOpenTextDocument(listener, thisArgs, disposables) {
    return this.original.onDidOpenTextDocument(listener, thisArgs, disposables);
  }
  onDidCloseTextDocument(listener, thisArgs, disposables) {
    return this.original.onDidCloseTextDocument(
      listener,
      thisArgs,
      disposables
    );
  }
  onDidChangeActiveTextEditor(listener, thisArgs, disposables) {
    return this.original.onDidChangeActiveTextEditor(
      listener,
      thisArgs,
      disposables
    );
  }
  onDidChangeVisibleTextEditors(listener, thisArgs, disposables) {
    return this.original.onDidChangeVisibleTextEditors(
      listener,
      thisArgs,
      disposables
    );
  }
  onDidChangeTextEditorSelection(listener, thisArgs, disposables) {
    return this.original.onDidChangeTextEditorSelection(
      listener,
      thisArgs,
      disposables
    );
  }
  onDidChangeTextEditorVisibleRanges(listener, thisArgs, disposables) {
    return this.original.onDidChangeTextEditorVisibleRanges(
      listener,
      thisArgs,
      disposables
    );
  }
  get activeTextEditor() {
    return this.original.activeTextEditor;
  }
  get activeEditableTextEditor() {
    return this.original.activeEditableTextEditor;
  }
  get visibleTextEditors() {
    return this.original.visibleTextEditors;
  }
  get cursorlessVersion() {
    return this.original.cursorlessVersion;
  }
  get assetsRoot() {
    return this.original.assetsRoot;
  }
  get runMode() {
    return this.original.runMode;
  }
  get workspaceFolders() {
    return this.original.workspaceFolders;
  }
  findInDocument(query, editor) {
    return this.original.findInDocument(query, editor);
  }
  findInWorkspace(query) {
    return this.original.findInWorkspace(query);
  }
  openTextDocument(path) {
    return this.original.openTextDocument(path);
  }
  openUntitledTextDocument(options2) {
    return this.original.openUntitledTextDocument(options2);
  }
  showQuickPick(items, options2) {
    return this.original.showQuickPick(items, options2);
  }
  showInputBox(options2) {
    return this.original.showInputBox(options2);
  }
  getEditableTextEditor(editor) {
    return this.original.getEditableTextEditor(editor);
  }
  executeCommand(command, ...args) {
    return this.original.executeCommand(command, ...args);
  }
  onDidChangeTextDocument(listener) {
    return this.original.onDidChangeTextDocument(listener);
  }
  disposeOnExit(...disposables) {
    return this.original.disposeOnExit(...disposables);
  }
};

// ../common/src/ide/normalized/NormalizedIDE.ts
var NormalizedIDE = class extends PassthroughIDEBase {
  constructor(original, fakeIde, isSilent, cursorlessSnippetsDir) {
    super(original);
    this.fakeIde = fakeIde;
    this.isSilent = isSilent;
    this.cursorlessSnippetsDir = cursorlessSnippetsDir;
    this.messages = isSilent ? fakeIde.messages : original.messages;
    this.configuration = fakeIde.configuration;
    this.keyValueStore = fakeIde.keyValueStore;
    this.initializeConfiguration();
  }
  initializeConfiguration() {
    this.configuration.mockConfigurationScope(
      { languageId: "css" },
      { wordSeparators: ["_", "-"] },
      true
    );
    this.configuration.mockConfigurationScope(
      { languageId: "scss" },
      { wordSeparators: ["_", "-"] },
      true
    );
    this.configuration.mockConfigurationScope(
      { languageId: "shellscript" },
      { wordSeparators: ["_", "-"] },
      true
    );
    this.configuration.mockConfiguration("experimental", {
      hatStability: this.configuration.getOwnConfiguration(
        "experimental.hatStability"
      ),
      snippetsDir: this.cursorlessSnippetsDir,
      keyboardTargetFollowsSelection: false
    });
  }
  flashRanges(flashDescriptors) {
    return this.isSilent ? this.fakeIde.flashRanges(flashDescriptors) : super.flashRanges(flashDescriptors);
  }
  setHighlightRanges(highlightId, editor, ranges) {
    return this.isSilent ? this.fakeIde.setHighlightRanges(highlightId, editor, ranges) : super.setHighlightRanges(highlightId, editor, ranges);
  }
  async showQuickPick(_items, _options) {
    return this.isSilent ? this.fakeIde.showQuickPick(_items, _options) : super.showQuickPick(_items, _options);
  }
};

// ../common/src/ide/util/messages.ts
function showWarning(messages, id2, message, ...options2) {
  return messages.showMessage("warning" /* warning */, id2, message, ...options2);
}
function showError(messages, id2, message, ...options2) {
  return messages.showMessage("error" /* error */, id2, message, ...options2);
}

// ../common/src/scopeSupportFacets/scopeSupportFacets.types.ts
var ScopeSupportFacetLevel = /* @__PURE__ */ ((ScopeSupportFacetLevel2) => {
  ScopeSupportFacetLevel2[ScopeSupportFacetLevel2["supported"] = 0] = "supported";
  ScopeSupportFacetLevel2[ScopeSupportFacetLevel2["supportedLegacy"] = 1] = "supportedLegacy";
  ScopeSupportFacetLevel2[ScopeSupportFacetLevel2["unsupported"] = 2] = "unsupported";
  ScopeSupportFacetLevel2[ScopeSupportFacetLevel2["notApplicable"] = 3] = "notApplicable";
  return ScopeSupportFacetLevel2;
})(ScopeSupportFacetLevel || {});

// ../common/src/scopeSupportFacets/c.ts
var { supported, unsupported, notApplicable } = ScopeSupportFacetLevel;
var cScopeSupport = {
  ifStatement: supported,
  disqualifyDelimiter: supported,
  "comment.line": supported,
  "comment.block": supported,
  "string.singleLine": supported,
  "textFragment.comment.line": supported,
  "textFragment.comment.block": supported,
  "textFragment.string.singleLine": supported,
  class: supported,
  className: supported,
  namedFunction: supported,
  "name.function": supported,
  "name.class": supported,
  "name.field": supported,
  functionName: supported,
  "name.argument.formal": supported,
  "name.argument.formal.iteration": supported,
  "name.variable": supported,
  "value.variable": supported,
  "name.assignment": supported,
  "value.assignment": supported,
  "statement.class": supported,
  "type.class": supported,
  "type.field": supported,
  "value.argument.formal": notApplicable,
  "value.argument.formal.iteration": notApplicable
};

// ../common/src/scopeSupportFacets/clojure.ts
var { supported: supported2, unsupported: unsupported2, notApplicable: notApplicable2 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/cpp.ts
var { supported: supported3, unsupported: unsupported3, notApplicable: notApplicable3 } = ScopeSupportFacetLevel;
var cppScopeSupport = {
  ...cScopeSupport,
  "value.argument.formal": supported3,
  "value.argument.formal.iteration": supported3
};

// ../common/src/scopeSupportFacets/csharp.ts
var { supported: supported4, unsupported: unsupported4, notApplicable: notApplicable4 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/css.ts
var { supported: supported5, unsupported: unsupported5, notApplicable: notApplicable5 } = ScopeSupportFacetLevel;
var cssScopeSupport = {
  "comment.block": supported5,
  "string.singleLine": supported5,
  "name.iteration.block": supported5,
  "name.iteration.document": supported5,
  disqualifyDelimiter: supported5,
  "comment.line": unsupported5
};

// ../common/src/scopeSupportFacets/go.ts
var { supported: supported6, unsupported: unsupported6, notApplicable: notApplicable6 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/html.ts
var { supported: supported7, notApplicable: notApplicable7 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/java.ts
var { supported: supported8, notApplicable: notApplicable8 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/javascript.ts
var { supported: supported9, unsupported: unsupported7, notApplicable: notApplicable9 } = ScopeSupportFacetLevel;
var javascriptCoreScopeSupport = {
  list: supported9,
  map: supported9,
  ifStatement: supported9,
  regularExpression: supported9,
  switchStatementSubject: supported9,
  fieldAccess: supported9,
  disqualifyDelimiter: supported9,
  "textFragment.string.singleLine": supported9,
  "textFragment.string.multiLine": supported9,
  "textFragment.comment.line": supported9,
  "textFragment.comment.block": supported9,
  statement: supported9,
  "statement.iteration.document": supported9,
  "statement.iteration.block": supported9,
  class: supported9,
  className: supported9,
  anonymousFunction: supported9,
  namedFunction: supported9,
  "namedFunction.iteration.document": supported9,
  "namedFunction.method": supported9,
  "namedFunction.method.iteration.class": supported9,
  "namedFunction.constructor": supported9,
  functionName: supported9,
  "functionName.iteration.document": supported9,
  "functionName.method": supported9,
  "functionName.method.iteration.class": supported9,
  "functionName.constructor": supported9,
  functionCall: supported9,
  "functionCall.constructor": supported9,
  functionCallee: supported9,
  "functionCallee.constructor": supported9,
  "argument.actual": supported9,
  "argument.actual.iteration": supported9,
  "argument.actual.method": supported9,
  "argument.actual.method.iteration": supported9,
  "argument.actual.constructor": supported9,
  "argument.actual.constructor.iteration": supported9,
  "argument.formal": supported9,
  "argument.formal.iteration": supported9,
  "argument.formal.method": supported9,
  "argument.formal.method.iteration": supported9,
  "argument.formal.constructor": supported9,
  "argument.formal.constructor.iteration": supported9,
  "comment.line": supported9,
  "comment.block": supported9,
  "string.singleLine": supported9,
  "string.multiLine": supported9,
  "branch.if": supported9,
  "branch.if.iteration": supported9,
  "branch.try": supported9,
  "branch.switchCase": supported9,
  "branch.switchCase.iteration": supported9,
  "branch.ternary": supported9,
  "condition.if": supported9,
  "condition.while": supported9,
  "condition.doWhile": supported9,
  "condition.for": supported9,
  "condition.ternary": supported9,
  "condition.switchCase": supported9,
  "name.argument.formal": supported9,
  "name.argument.formal.iteration": supported9,
  "name.argument.formal.method": supported9,
  "name.argument.formal.method.iteration": supported9,
  "name.argument.formal.constructor": supported9,
  "name.argument.formal.constructor.iteration": supported9,
  "name.foreach": supported9,
  "name.assignment": supported9,
  "name.assignment.pattern": supported9,
  "name.variable": supported9,
  "name.variable.pattern": supported9,
  "name.function": supported9,
  "name.method": supported9,
  "name.constructor": supported9,
  "name.class": supported9,
  "name.field": supported9,
  "key.mapPair": supported9,
  "key.mapPair.iteration": supported9,
  "value.argument.formal": supported9,
  "value.argument.formal.iteration": supported9,
  "value.argument.formal.method": supported9,
  "value.argument.formal.method.iteration": supported9,
  "value.argument.formal.constructor": supported9,
  "value.argument.formal.constructor.iteration": supported9,
  "value.mapPair": supported9,
  "value.mapPair.iteration": supported9,
  "value.assignment": supported9,
  "value.variable": supported9,
  "value.variable.pattern": supported9,
  "value.foreach": supported9,
  "value.return": supported9,
  "value.return.lambda": supported9,
  "value.field": supported9
};
var javascriptJsxScopeSupport = {
  element: supported9,
  tags: supported9,
  startTag: supported9,
  endTag: supported9,
  attribute: supported9,
  "key.attribute": supported9,
  "value.attribute": supported9
};
var javascriptScopeSupport = {
  ...javascriptCoreScopeSupport,
  ...javascriptJsxScopeSupport,
  "type.variable": notApplicable9,
  "type.argument.formal": notApplicable9,
  "type.argument.formal.iteration": notApplicable9,
  "type.argument.formal.method": notApplicable9,
  "type.argument.formal.method.iteration": notApplicable9,
  "type.argument.formal.constructor": notApplicable9,
  "type.argument.formal.constructor.iteration": notApplicable9,
  "type.return": notApplicable9,
  "type.field": notApplicable9,
  "type.foreach": notApplicable9,
  "type.interface": notApplicable9,
  command: notApplicable9
};

// ../common/src/scopeSupportFacets/json.ts
var { supported: supported10 } = ScopeSupportFacetLevel;
var jsonScopeSupport = {
  "comment.line": supported10,
  "comment.block": supported10,
  map: supported10
};

// ../common/src/scopeSupportFacets/jsonc.ts
var { supported: supported11, unsupported: unsupported8, notApplicable: notApplicable10 } = ScopeSupportFacetLevel;
var jsoncScopeSupport = {
  ...jsonScopeSupport
};

// ../common/src/scopeSupportFacets/jsonl.ts
var { supported: supported12, unsupported: unsupported9, notApplicable: notApplicable11 } = ScopeSupportFacetLevel;
var jsonlScopeSupport = {
  ...jsonScopeSupport
};

// ../common/src/scopeSupportFacets/latex.ts
var { supported: supported13, unsupported: unsupported10, notApplicable: notApplicable12 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/lua.ts
var { supported: supported14, notApplicable: notApplicable13 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/markdown.ts
var { supported: supported15, unsupported: unsupported11, notApplicable: notApplicable14 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/php.ts
var { supported: supported16, unsupported: unsupported12, notApplicable: notApplicable15 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/python.ts
var { supported: supported17, notApplicable: notApplicable16 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/ruby.ts
var { supported: supported18, unsupported: unsupported13, notApplicable: notApplicable17 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/rust.ts
var { supported: supported19, unsupported: unsupported14, notApplicable: notApplicable18 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/scala.ts
var { supported: supported20, unsupported: unsupported15, notApplicable: notApplicable19 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/scm.ts
var { supported: supported21, unsupported: unsupported16, notApplicable: notApplicable20 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/scss.ts
var { supported: supported22, unsupported: unsupported17, notApplicable: notApplicable21 } = ScopeSupportFacetLevel;
var scssScopeSupport = {
  ...cssScopeSupport,
  "namedFunction.iteration": supported22,
  "namedFunction.iteration.document": supported22,
  "functionName.iteration": supported22,
  "functionName.iteration.document": supported22,
  "comment.line": supported22,
  disqualifyDelimiter: supported22
};

// ../common/src/scopeSupportFacets/talon.ts
var { supported: supported23 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/typescript.ts
var { supported: supported24 } = ScopeSupportFacetLevel;
var typescriptScopeSupport = {
  ...javascriptCoreScopeSupport,
  "name.field": supported24,
  "type.argument.formal": supported24,
  "type.argument.formal.iteration": supported24,
  "type.argument.formal.method": supported24,
  "type.argument.formal.method.iteration": supported24,
  "type.argument.formal.constructor": supported24,
  "type.argument.formal.constructor.iteration": supported24,
  "type.alias": supported24,
  "type.cast": supported24,
  "type.field": supported24,
  "type.interface": supported24,
  "type.return": supported24,
  "type.variable": supported24,
  "value.field": supported24,
  "value.typeAlias": supported24
};

// ../common/src/scopeSupportFacets/typescriptreact.ts
var { supported: supported25, unsupported: unsupported18, notApplicable: notApplicable22 } = ScopeSupportFacetLevel;
var typescriptreactScopeSupport = {
  ...typescriptScopeSupport,
  ...javascriptJsxScopeSupport
};

// ../common/src/scopeSupportFacets/xml.ts
var { supported: supported26, unsupported: unsupported19, notApplicable: notApplicable23 } = ScopeSupportFacetLevel;

// ../common/src/scopeSupportFacets/yaml.ts
var { supported: supported27, unsupported: unsupported20, notApplicable: notApplicable24 } = ScopeSupportFacetLevel;

// ../common/src/StoredTargetKey.ts
var storedTargetKeys = [
  "that",
  "source",
  "instanceReference",
  "keyboard"
];

// ../common/src/types/Selection.ts
var Selection = class extends Range {
  /**
   * Is true if active position is before anchor position.
   */
  get isReversed() {
    return this.active.isBefore(this.anchor);
  }
  constructor(...args) {
    const [anchor, active] = (() => {
      if (args.length === 2) {
        return args;
      }
      return [new Position(args[0], args[1]), new Position(args[2], args[3])];
    })();
    super(anchor, active);
    this.anchor = anchor;
    this.active = active;
  }
  /**
   * Check if `other` equals this range.
   *
   * @param other A selection.
   * @return `true` when anchor and active are {@link Position.isEqual equal} to
   * anchor and active of this range.
   */
  isEqual(other) {
    return this.anchor.isEqual(other.anchor) && this.active.isEqual(other.active);
  }
  /**
   * Return a concise string representation of the selection
   * @returns concise representation
   **/
  concise() {
    return `${this.anchor.concise()}->${this.active.concise()}`;
  }
  toString() {
    return this.concise();
  }
};

// ../common/src/testUtil/fromPlainObject.ts
function plainObjectToPosition({
  line,
  character
}) {
  return new Position(line, character);
}
function plainObjectToRange({ start, end }) {
  return new Range(plainObjectToPosition(start), plainObjectToPosition(end));
}

// ../common/src/types/GeneralizedRange.ts
function toLineRange({ start, end }) {
  return { type: "line", start: start.line, end: end.line };
}
function toCharacterRange({ start, end }) {
  return { type: "character", start, end };
}

// ../common/src/util/toPlainObject.ts
function rangeToPlainObject(range3) {
  return {
    start: positionToPlainObject(range3.start),
    end: positionToPlainObject(range3.end)
  };
}
function positionToPlainObject({
  line,
  character
}) {
  return { line, character };
}

// ../../node_modules/.pnpm/js-yaml@4.1.0/node_modules/js-yaml/dist/js-yaml.mjs
function isNothing(subject) {
  return typeof subject === "undefined" || subject === null;
}
function isObject2(subject) {
  return typeof subject === "object" && subject !== null;
}
function toArray(sequence) {
  if (Array.isArray(sequence)) return sequence;
  else if (isNothing(sequence)) return [];
  return [sequence];
}
function extend(target, source) {
  var index, length, key, sourceKeys;
  if (source) {
    sourceKeys = Object.keys(source);
    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }
  return target;
}
function repeat2(string2, count2) {
  var result = "", cycle;
  for (cycle = 0; cycle < count2; cycle += 1) {
    result += string2;
  }
  return result;
}
function isNegativeZero(number) {
  return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
}
var isNothing_1 = isNothing;
var isObject_1 = isObject2;
var toArray_1 = toArray;
var repeat_1 = repeat2;
var isNegativeZero_1 = isNegativeZero;
var extend_1 = extend;
var common = {
  isNothing: isNothing_1,
  isObject: isObject_1,
  toArray: toArray_1,
  repeat: repeat_1,
  isNegativeZero: isNegativeZero_1,
  extend: extend_1
};
function formatError(exception2, compact) {
  var where = "", message = exception2.reason || "(unknown reason)";
  if (!exception2.mark) return message;
  if (exception2.mark.name) {
    where += 'in "' + exception2.mark.name + '" ';
  }
  where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
  if (!compact && exception2.mark.snippet) {
    where += "\n\n" + exception2.mark.snippet;
  }
  return message + " " + where;
}
function YAMLException$1(reason, mark) {
  Error.call(this);
  this.name = "YAMLException";
  this.reason = reason;
  this.mark = mark;
  this.message = formatError(this, false);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = new Error().stack || "";
  }
}
YAMLException$1.prototype = Object.create(Error.prototype);
YAMLException$1.prototype.constructor = YAMLException$1;
YAMLException$1.prototype.toString = function toString2(compact) {
  return this.name + ": " + formatError(this, compact);
};
var exception = YAMLException$1;
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
  var head = "";
  var tail = "";
  var maxHalfLength = Math.floor(maxLineLength / 2) - 1;
  if (position - lineStart > maxHalfLength) {
    head = " ... ";
    lineStart = position - maxHalfLength + head.length;
  }
  if (lineEnd - position > maxHalfLength) {
    tail = " ...";
    lineEnd = position + maxHalfLength - tail.length;
  }
  return {
    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "\u2192") + tail,
    pos: position - lineStart + head.length
    // relative position
  };
}
function padStart(string2, max) {
  return common.repeat(" ", max - string2.length) + string2;
}
function makeSnippet(mark, options2) {
  options2 = Object.create(options2 || null);
  if (!mark.buffer) return null;
  if (!options2.maxLength) options2.maxLength = 79;
  if (typeof options2.indent !== "number") options2.indent = 1;
  if (typeof options2.linesBefore !== "number") options2.linesBefore = 3;
  if (typeof options2.linesAfter !== "number") options2.linesAfter = 2;
  var re = /\r?\n|\r|\0/g;
  var lineStarts = [0];
  var lineEnds = [];
  var match;
  var foundLineNo = -1;
  while (match = re.exec(mark.buffer)) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);
    if (mark.position <= match.index && foundLineNo < 0) {
      foundLineNo = lineStarts.length - 2;
    }
  }
  if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
  var result = "", i, line;
  var lineNoLength = Math.min(mark.line + options2.linesAfter, lineEnds.length).toString().length;
  var maxLineLength = options2.maxLength - (options2.indent + lineNoLength + 3);
  for (i = 1; i <= options2.linesBefore; i++) {
    if (foundLineNo - i < 0) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo - i],
      lineEnds[foundLineNo - i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
      maxLineLength
    );
    result = common.repeat(" ", options2.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line.str + "\n" + result;
  }
  line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result += common.repeat(" ", options2.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
  result += common.repeat("-", options2.indent + lineNoLength + 3 + line.pos) + "^\n";
  for (i = 1; i <= options2.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo + i],
      lineEnds[foundLineNo + i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
      maxLineLength
    );
    result += common.repeat(" ", options2.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line.str + "\n";
  }
  return result.replace(/\n$/, "");
}
var snippet = makeSnippet;
var TYPE_CONSTRUCTOR_OPTIONS = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
];
var YAML_NODE_KINDS = [
  "scalar",
  "sequence",
  "mapping"
];
function compileStyleAliases(map3) {
  var result = {};
  if (map3 !== null) {
    Object.keys(map3).forEach(function(style) {
      map3[style].forEach(function(alias) {
        result[String(alias)] = style;
      });
    });
  }
  return result;
}
function Type$1(tag, options2) {
  options2 = options2 || {};
  Object.keys(options2).forEach(function(name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
      throw new exception('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  });
  this.options = options2;
  this.tag = tag;
  this.kind = options2["kind"] || null;
  this.resolve = options2["resolve"] || function() {
    return true;
  };
  this.construct = options2["construct"] || function(data) {
    return data;
  };
  this.instanceOf = options2["instanceOf"] || null;
  this.predicate = options2["predicate"] || null;
  this.represent = options2["represent"] || null;
  this.representName = options2["representName"] || null;
  this.defaultStyle = options2["defaultStyle"] || null;
  this.multi = options2["multi"] || false;
  this.styleAliases = compileStyleAliases(options2["styleAliases"] || null);
  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
    throw new exception('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
  }
}
var type = Type$1;
function compileList(schema3, name) {
  var result = [];
  schema3[name].forEach(function(currentType) {
    var newIndex = result.length;
    result.forEach(function(previousType, previousIndex) {
      if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
        newIndex = previousIndex;
      }
    });
    result[newIndex] = currentType;
  });
  return result;
}
function compileMap() {
  var result = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  }, index, length;
  function collectType(type2) {
    if (type2.multi) {
      result.multi[type2.kind].push(type2);
      result.multi["fallback"].push(type2);
    } else {
      result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
    }
  }
  for (index = 0, length = arguments.length; index < length; index += 1) {
    arguments[index].forEach(collectType);
  }
  return result;
}
function Schema$1(definition) {
  return this.extend(definition);
}
Schema$1.prototype.extend = function extend2(definition) {
  var implicit = [];
  var explicit = [];
  if (definition instanceof type) {
    explicit.push(definition);
  } else if (Array.isArray(definition)) {
    explicit = explicit.concat(definition);
  } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
    if (definition.implicit) implicit = implicit.concat(definition.implicit);
    if (definition.explicit) explicit = explicit.concat(definition.explicit);
  } else {
    throw new exception("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  }
  implicit.forEach(function(type$1) {
    if (!(type$1 instanceof type)) {
      throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    }
    if (type$1.loadKind && type$1.loadKind !== "scalar") {
      throw new exception("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    }
    if (type$1.multi) {
      throw new exception("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }
  });
  explicit.forEach(function(type$1) {
    if (!(type$1 instanceof type)) {
      throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    }
  });
  var result = Object.create(Schema$1.prototype);
  result.implicit = (this.implicit || []).concat(implicit);
  result.explicit = (this.explicit || []).concat(explicit);
  result.compiledImplicit = compileList(result, "implicit");
  result.compiledExplicit = compileList(result, "explicit");
  result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
  return result;
};
var schema = Schema$1;
var str = new type("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(data) {
    return data !== null ? data : "";
  }
});
var seq = new type("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(data) {
    return data !== null ? data : [];
  }
});
var map = new type("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(data) {
    return data !== null ? data : {};
  }
});
var failsafe = new schema({
  explicit: [
    str,
    seq,
    map
  ]
});
function resolveYamlNull(data) {
  if (data === null) return true;
  var max = data.length;
  return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
}
function constructYamlNull() {
  return null;
}
function isNull(object) {
  return object === null;
}
var _null = new type("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: resolveYamlNull,
  construct: constructYamlNull,
  predicate: isNull,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
});
function resolveYamlBoolean(data) {
  if (data === null) return false;
  var max = data.length;
  return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
}
function constructYamlBoolean(data) {
  return data === "true" || data === "True" || data === "TRUE";
}
function isBoolean(object) {
  return Object.prototype.toString.call(object) === "[object Boolean]";
}
var bool = new type("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: resolveYamlBoolean,
  construct: constructYamlBoolean,
  predicate: isBoolean,
  represent: {
    lowercase: function(object) {
      return object ? "true" : "false";
    },
    uppercase: function(object) {
      return object ? "TRUE" : "FALSE";
    },
    camelcase: function(object) {
      return object ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
});
function isHexCode(c) {
  return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
}
function isOctCode(c) {
  return 48 <= c && c <= 55;
}
function isDecCode(c) {
  return 48 <= c && c <= 57;
}
function resolveYamlInteger(data) {
  if (data === null) return false;
  var max = data.length, index = 0, hasDigits = false, ch;
  if (!max) return false;
  ch = data[index];
  if (ch === "-" || ch === "+") {
    ch = data[++index];
  }
  if (ch === "0") {
    if (index + 1 === max) return true;
    ch = data[++index];
    if (ch === "b") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (ch !== "0" && ch !== "1") return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "x") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (!isHexCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "o") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (!isOctCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
  }
  if (ch === "_") return false;
  for (; index < max; index++) {
    ch = data[index];
    if (ch === "_") continue;
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }
  if (!hasDigits || ch === "_") return false;
  return true;
}
function constructYamlInteger(data) {
  var value = data, sign = 1, ch;
  if (value.indexOf("_") !== -1) {
    value = value.replace(/_/g, "");
  }
  ch = value[0];
  if (ch === "-" || ch === "+") {
    if (ch === "-") sign = -1;
    value = value.slice(1);
    ch = value[0];
  }
  if (value === "0") return 0;
  if (ch === "0") {
    if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
    if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
    if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
  }
  return sign * parseInt(value, 10);
}
function isInteger(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common.isNegativeZero(object));
}
var int = new type("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: resolveYamlInteger,
  construct: constructYamlInteger,
  predicate: isInteger,
  represent: {
    binary: function(obj) {
      return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
    },
    octal: function(obj) {
      return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
    },
    decimal: function(obj) {
      return obj.toString(10);
    },
    /* eslint-disable max-len */
    hexadecimal: function(obj) {
      return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
});
var YAML_FLOAT_PATTERN = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function resolveYamlFloat(data) {
  if (data === null) return false;
  if (!YAML_FLOAT_PATTERN.test(data) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  data[data.length - 1] === "_") {
    return false;
  }
  return true;
}
function constructYamlFloat(data) {
  var value, sign;
  value = data.replace(/_/g, "").toLowerCase();
  sign = value[0] === "-" ? -1 : 1;
  if ("+-".indexOf(value[0]) >= 0) {
    value = value.slice(1);
  }
  if (value === ".inf") {
    return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  } else if (value === ".nan") {
    return NaN;
  }
  return sign * parseFloat(value, 10);
}
var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
function representYamlFloat(object, style) {
  var res;
  if (isNaN(object)) {
    switch (style) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  } else if (common.isNegativeZero(object)) {
    return "-0.0";
  }
  res = object.toString(10);
  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
}
function isFloat(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
}
var float = new type("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: isFloat,
  represent: representYamlFloat,
  defaultStyle: "lowercase"
});
var json = failsafe.extend({
  implicit: [
    _null,
    bool,
    int,
    float
  ]
});
var core = json;
var YAML_DATE_REGEXP = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
);
var YAML_TIMESTAMP_REGEXP = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function resolveYamlTimestamp(data) {
  if (data === null) return false;
  if (YAML_DATE_REGEXP.exec(data) !== null) return true;
  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
  return false;
}
function constructYamlTimestamp(data) {
  var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
  match = YAML_DATE_REGEXP.exec(data);
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
  if (match === null) throw new Error("Date resolve error");
  year = +match[1];
  month = +match[2] - 1;
  day = +match[3];
  if (!match[4]) {
    return new Date(Date.UTC(year, month, day));
  }
  hour = +match[4];
  minute = +match[5];
  second = +match[6];
  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) {
      fraction += "0";
    }
    fraction = +fraction;
  }
  if (match[9]) {
    tz_hour = +match[10];
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 6e4;
    if (match[9] === "-") delta = -delta;
  }
  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
  if (delta) date.setTime(date.getTime() - delta);
  return date;
}
function representYamlTimestamp(object) {
  return object.toISOString();
}
var timestamp = new type("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: resolveYamlTimestamp,
  construct: constructYamlTimestamp,
  instanceOf: Date,
  represent: representYamlTimestamp
});
function resolveYamlMerge(data) {
  return data === "<<" || data === null;
}
var merge = new type("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: resolveYamlMerge
});
var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
function resolveYamlBinary(data) {
  if (data === null) return false;
  var code, idx, bitlen = 0, max = data.length, map3 = BASE64_MAP;
  for (idx = 0; idx < max; idx++) {
    code = map3.indexOf(data.charAt(idx));
    if (code > 64) continue;
    if (code < 0) return false;
    bitlen += 6;
  }
  return bitlen % 8 === 0;
}
function constructYamlBinary(data) {
  var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map3 = BASE64_MAP, bits = 0, result = [];
  for (idx = 0; idx < max; idx++) {
    if (idx % 4 === 0 && idx) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    }
    bits = bits << 6 | map3.indexOf(input.charAt(idx));
  }
  tailbits = max % 4 * 6;
  if (tailbits === 0) {
    result.push(bits >> 16 & 255);
    result.push(bits >> 8 & 255);
    result.push(bits & 255);
  } else if (tailbits === 18) {
    result.push(bits >> 10 & 255);
    result.push(bits >> 2 & 255);
  } else if (tailbits === 12) {
    result.push(bits >> 4 & 255);
  }
  return new Uint8Array(result);
}
function representYamlBinary(object) {
  var result = "", bits = 0, idx, tail, max = object.length, map3 = BASE64_MAP;
  for (idx = 0; idx < max; idx++) {
    if (idx % 3 === 0 && idx) {
      result += map3[bits >> 18 & 63];
      result += map3[bits >> 12 & 63];
      result += map3[bits >> 6 & 63];
      result += map3[bits & 63];
    }
    bits = (bits << 8) + object[idx];
  }
  tail = max % 3;
  if (tail === 0) {
    result += map3[bits >> 18 & 63];
    result += map3[bits >> 12 & 63];
    result += map3[bits >> 6 & 63];
    result += map3[bits & 63];
  } else if (tail === 2) {
    result += map3[bits >> 10 & 63];
    result += map3[bits >> 4 & 63];
    result += map3[bits << 2 & 63];
    result += map3[64];
  } else if (tail === 1) {
    result += map3[bits >> 2 & 63];
    result += map3[bits << 4 & 63];
    result += map3[64];
    result += map3[64];
  }
  return result;
}
function isBinary(obj) {
  return Object.prototype.toString.call(obj) === "[object Uint8Array]";
}
var binary = new type("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: resolveYamlBinary,
  construct: constructYamlBinary,
  predicate: isBinary,
  represent: representYamlBinary
});
var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
var _toString$2 = Object.prototype.toString;
function resolveYamlOmap(data) {
  if (data === null) return true;
  var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;
    if (_toString$2.call(pair) !== "[object Object]") return false;
    for (pairKey in pair) {
      if (_hasOwnProperty$3.call(pair, pairKey)) {
        if (!pairHasKey) pairHasKey = true;
        else return false;
      }
    }
    if (!pairHasKey) return false;
    if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
    else return false;
  }
  return true;
}
function constructYamlOmap(data) {
  return data !== null ? data : [];
}
var omap = new type("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: resolveYamlOmap,
  construct: constructYamlOmap
});
var _toString$1 = Object.prototype.toString;
function resolveYamlPairs(data) {
  if (data === null) return true;
  var index, length, pair, keys2, result, object = data;
  result = new Array(object.length);
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    if (_toString$1.call(pair) !== "[object Object]") return false;
    keys2 = Object.keys(pair);
    if (keys2.length !== 1) return false;
    result[index] = [keys2[0], pair[keys2[0]]];
  }
  return true;
}
function constructYamlPairs(data) {
  if (data === null) return [];
  var index, length, pair, keys2, result, object = data;
  result = new Array(object.length);
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    keys2 = Object.keys(pair);
    result[index] = [keys2[0], pair[keys2[0]]];
  }
  return result;
}
var pairs = new type("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: resolveYamlPairs,
  construct: constructYamlPairs
});
var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;
function resolveYamlSet(data) {
  if (data === null) return true;
  var key, object = data;
  for (key in object) {
    if (_hasOwnProperty$2.call(object, key)) {
      if (object[key] !== null) return false;
    }
  }
  return true;
}
function constructYamlSet(data) {
  return data !== null ? data : {};
}
var set = new type("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: resolveYamlSet,
  construct: constructYamlSet
});
var _default = core.extend({
  implicit: [
    timestamp,
    merge
  ],
  explicit: [
    binary,
    omap,
    pairs,
    set
  ]
});
var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var CONTEXT_FLOW_IN = 1;
var CONTEXT_FLOW_OUT = 2;
var CONTEXT_BLOCK_IN = 3;
var CONTEXT_BLOCK_OUT = 4;
var CHOMPING_CLIP = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP = 3;
var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function _class(obj) {
  return Object.prototype.toString.call(obj);
}
function is_EOL(c) {
  return c === 10 || c === 13;
}
function is_WHITE_SPACE(c) {
  return c === 9 || c === 32;
}
function is_WS_OR_EOL(c) {
  return c === 9 || c === 32 || c === 10 || c === 13;
}
function is_FLOW_INDICATOR(c) {
  return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
}
function fromHexCode(c) {
  var lc;
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  lc = c | 32;
  if (97 <= lc && lc <= 102) {
    return lc - 97 + 10;
  }
  return -1;
}
function escapedHexLen(c) {
  if (c === 120) {
    return 2;
  }
  if (c === 117) {
    return 4;
  }
  if (c === 85) {
    return 8;
  }
  return 0;
}
function fromDecimalCode(c) {
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  return -1;
}
function simpleEscapeSequence(c) {
  return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "\x85" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
}
function charFromCodepoint(c) {
  if (c <= 65535) {
    return String.fromCharCode(c);
  }
  return String.fromCharCode(
    (c - 65536 >> 10) + 55296,
    (c - 65536 & 1023) + 56320
  );
}
var simpleEscapeCheck = new Array(256);
var simpleEscapeMap = new Array(256);
for (i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}
var i;
function State$1(input, options2) {
  this.input = input;
  this.filename = options2["filename"] || null;
  this.schema = options2["schema"] || _default;
  this.onWarning = options2["onWarning"] || null;
  this.legacy = options2["legacy"] || false;
  this.json = options2["json"] || false;
  this.listener = options2["listener"] || null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap = this.schema.compiledTypeMap;
  this.length = input.length;
  this.position = 0;
  this.line = 0;
  this.lineStart = 0;
  this.lineIndent = 0;
  this.firstTabInLine = -1;
  this.documents = [];
}
function generateError(state, message) {
  var mark = {
    name: state.filename,
    buffer: state.input.slice(0, -1),
    // omit trailing \0
    position: state.position,
    line: state.line,
    column: state.position - state.lineStart
  };
  mark.snippet = snippet(mark);
  return new exception(message, mark);
}
function throwError(state, message) {
  throw generateError(state, message);
}
function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}
var directiveHandlers = {
  YAML: function handleYamlDirective(state, name, args) {
    var match, major, minor;
    if (state.version !== null) {
      throwError(state, "duplication of %YAML directive");
    }
    if (args.length !== 1) {
      throwError(state, "YAML directive accepts exactly one argument");
    }
    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
    if (match === null) {
      throwError(state, "ill-formed argument of the YAML directive");
    }
    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);
    if (major !== 1) {
      throwError(state, "unacceptable YAML version of the document");
    }
    state.version = args[0];
    state.checkLineBreaks = minor < 2;
    if (minor !== 1 && minor !== 2) {
      throwWarning(state, "unsupported YAML version of the document");
    }
  },
  TAG: function handleTagDirective(state, name, args) {
    var handle, prefix;
    if (args.length !== 2) {
      throwError(state, "TAG directive accepts exactly two arguments");
    }
    handle = args[0];
    prefix = args[1];
    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
    }
    if (_hasOwnProperty$1.call(state.tagMap, handle)) {
      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
    }
    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
    }
    try {
      prefix = decodeURIComponent(prefix);
    } catch (err) {
      throwError(state, "tag prefix is malformed: " + prefix);
    }
    state.tagMap[handle] = prefix;
  }
};
function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;
  if (start < end) {
    _result = state.input.slice(start, end);
    if (checkJson) {
      for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(_character === 9 || 32 <= _character && _character <= 1114111)) {
          throwError(state, "expected valid JSON character");
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
      throwError(state, "the stream contains non-printable characters");
    }
    state.result += _result;
  }
}
function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;
  if (!common.isObject(source)) {
    throwError(state, "cannot merge mappings; the provided source object is unacceptable");
  }
  sourceKeys = Object.keys(source);
  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
    key = sourceKeys[index];
    if (!_hasOwnProperty$1.call(destination, key)) {
      destination[key] = source[key];
      overridableKeys[key] = true;
    }
  }
}
function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
  var index, quantity;
  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);
    for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, "nested arrays are not supported inside keys");
      }
      if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
        keyNode[index] = "[object Object]";
      }
    }
  }
  if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
    keyNode = "[object Object]";
  }
  keyNode = String(keyNode);
  if (_result === null) {
    _result = {};
  }
  if (keyTag === "tag:yaml.org,2002:merge") {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, _result, valueNode, overridableKeys);
    }
  } else {
    if (!state.json && !_hasOwnProperty$1.call(overridableKeys, keyNode) && _hasOwnProperty$1.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.lineStart = startLineStart || state.lineStart;
      state.position = startPos || state.position;
      throwError(state, "duplicated mapping key");
    }
    if (keyNode === "__proto__") {
      Object.defineProperty(_result, keyNode, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: valueNode
      });
    } else {
      _result[keyNode] = valueNode;
    }
    delete overridableKeys[keyNode];
  }
  return _result;
}
function readLineBreak(state) {
  var ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 10) {
    state.position++;
  } else if (ch === 13) {
    state.position++;
    if (state.input.charCodeAt(state.position) === 10) {
      state.position++;
    }
  } else {
    throwError(state, "a line break is expected");
  }
  state.line += 1;
  state.lineStart = state.position;
  state.firstTabInLine = -1;
}
function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      if (ch === 9 && state.firstTabInLine === -1) {
        state.firstTabInLine = state.position;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    if (allowComments && ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 10 && ch !== 13 && ch !== 0);
    }
    if (is_EOL(ch)) {
      readLineBreak(state);
      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;
      while (ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }
  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
    throwWarning(state, "deficient indentation");
  }
  return lineBreaks;
}
function testDocumentSeparator(state) {
  var _position = state.position, ch;
  ch = state.input.charCodeAt(_position);
  if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
    _position += 3;
    ch = state.input.charCodeAt(_position);
    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }
  return false;
}
function writeFoldedLines(state, count2) {
  if (count2 === 1) {
    state.result += " ";
  } else if (count2 > 1) {
    state.result += common.repeat("\n", count2 - 1);
  }
}
function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
  ch = state.input.charCodeAt(state.position);
  if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
    return false;
  }
  if (ch === 63 || ch === 45) {
    following = state.input.charCodeAt(state.position + 1);
    if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
      return false;
    }
  }
  state.kind = "scalar";
  state.result = "";
  captureStart = captureEnd = state.position;
  hasPendingContent = false;
  while (ch !== 0) {
    if (ch === 58) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
        break;
      }
    } else if (ch === 35) {
      preceding = state.input.charCodeAt(state.position - 1);
      if (is_WS_OR_EOL(preceding)) {
        break;
      }
    } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
      break;
    } else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);
      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        break;
      }
    }
    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }
    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }
    ch = state.input.charCodeAt(++state.position);
  }
  captureSegment(state, captureStart, captureEnd, false);
  if (state.result) {
    return true;
  }
  state.kind = _kind;
  state.result = _result;
  return false;
}
function readSingleQuotedScalar(state, nodeIndent) {
  var ch, captureStart, captureEnd;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 39) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 39) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (ch === 39) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a single quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 34) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 34) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;
    } else if (ch === 92) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent);
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;
      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;
        for (; hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);
          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;
          } else {
            throwError(state, "expected hexadecimal character");
          }
        }
        state.result += charFromCodepoint(hexResult);
        state.position++;
      } else {
        throwError(state, "unknown escape sequence");
      }
      captureStart = captureEnd = state.position;
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a double quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a double quoted scalar");
}
function readFlowCollection(state, nodeIndent) {
  var readNext = true, _line, _lineStart, _pos, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = /* @__PURE__ */ Object.create(null), keyNode, keyTag, valueNode, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 91) {
    terminator = 93;
    isMapping = false;
    _result = [];
  } else if (ch === 123) {
    terminator = 125;
    isMapping = true;
    _result = {};
  } else {
    return false;
  }
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(++state.position);
  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? "mapping" : "sequence";
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, "missed comma between flow collection entries");
    } else if (ch === 44) {
      throwError(state, "expected the node content, but found ','");
    }
    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;
    if (ch === 63) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }
    _line = state.line;
    _lineStart = state.lineStart;
    _pos = state.position;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if ((isExplicitPair || state.line === _line) && ch === 58) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }
    if (isMapping) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
    } else {
      _result.push(keyNode);
    }
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === 44) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }
  throwError(state, "unexpected end of the stream within a flow collection");
}
function readBlockScalar(state, nodeIndent) {
  var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 124) {
    folding = false;
  } else if (ch === 62) {
    folding = true;
  } else {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);
    if (ch === 43 || ch === 45) {
      if (CHOMPING_CLIP === chomping) {
        chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, "repeat of a chomping mode identifier");
      }
    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, "repeat of an indentation width identifier");
      }
    } else {
      break;
    }
  }
  if (is_WHITE_SPACE(ch)) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (is_WHITE_SPACE(ch));
    if (ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (!is_EOL(ch) && ch !== 0);
    }
  }
  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;
    ch = state.input.charCodeAt(state.position);
    while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }
    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }
    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }
    if (state.lineIndent < textIndent) {
      if (chomping === CHOMPING_KEEP) {
        state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) {
          state.result += "\n";
        }
      }
      break;
    }
    if (folding) {
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common.repeat("\n", emptyLines + 1);
      } else if (emptyLines === 0) {
        if (didReadContent) {
          state.result += " ";
        }
      } else {
        state.result += common.repeat("\n", emptyLines);
      }
    } else {
      state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
    }
    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;
    while (!is_EOL(ch) && ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, state.position, false);
  }
  return true;
}
function readBlockSequence(state, nodeIndent) {
  var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
  if (state.firstTabInLine !== -1) return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    if (ch !== 45) {
      break;
    }
    following = state.input.charCodeAt(state.position + 1);
    if (!is_WS_OR_EOL(following)) {
      break;
    }
    detected = true;
    state.position++;
    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }
    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a sequence entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "sequence";
    state.result = _result;
    return true;
  }
  return false;
}
function readBlockMapping(state, nodeIndent, flowIndent) {
  var following, allowCompact, _line, _keyLine, _keyLineStart, _keyPos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = /* @__PURE__ */ Object.create(null), keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
  if (state.firstTabInLine !== -1) return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    following = state.input.charCodeAt(state.position + 1);
    _line = state.line;
    if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
      if (ch === 63) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        detected = true;
        atExplicitKey = true;
        allowCompact = true;
      } else if (atExplicitKey) {
        atExplicitKey = false;
        allowCompact = true;
      } else {
        throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
      }
      state.position += 1;
      ch = following;
    } else {
      _keyLine = state.line;
      _keyLineStart = state.lineStart;
      _keyPos = state.position;
      if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
        break;
      }
      if (state.line === _line) {
        ch = state.input.charCodeAt(state.position);
        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 58) {
          ch = state.input.charCodeAt(++state.position);
          if (!is_WS_OR_EOL(ch)) {
            throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
          }
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;
        } else if (detected) {
          throwError(state, "can not read an implicit mapping pair; a colon is missed");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      } else if (detected) {
        throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
      } else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true;
      }
    }
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (atExplicitKey) {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
      }
      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }
      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
        keyTag = keyNode = valueNode = null;
      }
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a mapping entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (atExplicitKey) {
    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "mapping";
    state.result = _result;
  }
  return detected;
}
function readTagProperty(state) {
  var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 33) return false;
  if (state.tag !== null) {
    throwError(state, "duplication of a tag property");
  }
  ch = state.input.charCodeAt(++state.position);
  if (ch === 60) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);
  } else if (ch === 33) {
    isNamed = true;
    tagHandle = "!!";
    ch = state.input.charCodeAt(++state.position);
  } else {
    tagHandle = "!";
  }
  _position = state.position;
  if (isVerbatim) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (ch !== 0 && ch !== 62);
    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, "unexpected end of the stream within a verbatim tag");
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      if (ch === 33) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);
          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, "named tag handle cannot contain such characters");
          }
          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, "tag suffix cannot contain exclamation marks");
        }
      }
      ch = state.input.charCodeAt(++state.position);
    }
    tagName = state.input.slice(_position, state.position);
    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, "tag suffix cannot contain flow indicator characters");
    }
  }
  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, "tag name cannot contain such characters: " + tagName);
  }
  try {
    tagName = decodeURIComponent(tagName);
  } catch (err) {
    throwError(state, "tag name is malformed: " + tagName);
  }
  if (isVerbatim) {
    state.tag = tagName;
  } else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;
  } else if (tagHandle === "!") {
    state.tag = "!" + tagName;
  } else if (tagHandle === "!!") {
    state.tag = "tag:yaml.org,2002:" + tagName;
  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }
  return true;
}
function readAnchorProperty(state) {
  var _position, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 38) return false;
  if (state.anchor !== null) {
    throwError(state, "duplication of an anchor property");
  }
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an anchor node must contain at least one character");
  }
  state.anchor = state.input.slice(_position, state.position);
  return true;
}
function readAlias(state) {
  var _position, alias, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 42) return false;
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an alias node must contain at least one character");
  }
  alias = state.input.slice(_position, state.position);
  if (!_hasOwnProperty$1.call(state.anchorMap, alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }
  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}
function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, typeList, type2, flowIndent, blockIndent;
  if (state.listener !== null) {
    state.listener("open", state);
  }
  state.tag = null;
  state.anchor = null;
  state.kind = null;
  state.result = null;
  allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;
      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }
  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }
  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }
  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }
    blockIndent = state.position - state.lineStart;
    if (indentStatus === 1) {
      if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;
        } else if (readAlias(state)) {
          hasContent = true;
          if (state.tag !== null || state.anchor !== null) {
            throwError(state, "alias node should not have any properties");
          }
        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;
          if (state.tag === null) {
            state.tag = "?";
          }
        }
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }
  if (state.tag === null) {
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = state.result;
    }
  } else if (state.tag === "?") {
    if (state.result !== null && state.kind !== "scalar") {
      throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
    }
    for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
      type2 = state.implicitTypes[typeIndex];
      if (type2.resolve(state.result)) {
        state.result = type2.construct(state.result);
        state.tag = type2.tag;
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
        break;
      }
    }
  } else if (state.tag !== "!") {
    if (_hasOwnProperty$1.call(state.typeMap[state.kind || "fallback"], state.tag)) {
      type2 = state.typeMap[state.kind || "fallback"][state.tag];
    } else {
      type2 = null;
      typeList = state.typeMap.multi[state.kind || "fallback"];
      for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
        if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
          type2 = typeList[typeIndex];
          break;
        }
      }
    }
    if (!type2) {
      throwError(state, "unknown tag !<" + state.tag + ">");
    }
    if (state.result !== null && type2.kind !== state.kind) {
      throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type2.kind + '", not "' + state.kind + '"');
    }
    if (!type2.resolve(state.result, state.tag)) {
      throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
    } else {
      state.result = type2.construct(state.result, state.tag);
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = state.result;
      }
    }
  }
  if (state.listener !== null) {
    state.listener("close", state);
  }
  return state.tag !== null || state.anchor !== null || hasContent;
}
function readDocument(state) {
  var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = /* @__PURE__ */ Object.create(null);
  state.anchorMap = /* @__PURE__ */ Object.create(null);
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if (state.lineIndent > 0 || ch !== 37) {
      break;
    }
    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];
    if (directiveName.length < 1) {
      throwError(state, "directive name must not be less than one character in length");
    }
    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && !is_EOL(ch));
        break;
      }
      if (is_EOL(ch)) break;
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      directiveArgs.push(state.input.slice(_position, state.position));
    }
    if (ch !== 0) readLineBreak(state);
    if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }
  skipSeparationSpace(state, true, -1);
  if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);
  } else if (hasDirectives) {
    throwError(state, "directives end mark is expected");
  }
  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);
  if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, "non-ASCII line breaks are interpreted as content");
  }
  state.documents.push(state.result);
  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    if (state.input.charCodeAt(state.position) === 46) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
    return;
  }
  if (state.position < state.length - 1) {
    throwError(state, "end of the stream or a document separator is expected");
  } else {
    return;
  }
}
function loadDocuments(input, options2) {
  input = String(input);
  options2 = options2 || {};
  if (input.length !== 0) {
    if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
      input += "\n";
    }
    if (input.charCodeAt(0) === 65279) {
      input = input.slice(1);
    }
  }
  var state = new State$1(input, options2);
  var nullpos = input.indexOf("\0");
  if (nullpos !== -1) {
    state.position = nullpos;
    throwError(state, "null byte is not allowed in input");
  }
  state.input += "\0";
  while (state.input.charCodeAt(state.position) === 32) {
    state.lineIndent += 1;
    state.position += 1;
  }
  while (state.position < state.length - 1) {
    readDocument(state);
  }
  return state.documents;
}
function loadAll$1(input, iterator, options2) {
  if (iterator !== null && typeof iterator === "object" && typeof options2 === "undefined") {
    options2 = iterator;
    iterator = null;
  }
  var documents = loadDocuments(input, options2);
  if (typeof iterator !== "function") {
    return documents;
  }
  for (var index = 0, length = documents.length; index < length; index += 1) {
    iterator(documents[index]);
  }
}
function load$1(input, options2) {
  var documents = loadDocuments(input, options2);
  if (documents.length === 0) {
    return void 0;
  } else if (documents.length === 1) {
    return documents[0];
  }
  throw new exception("expected a single document in the stream, but found more");
}
var loadAll_1 = loadAll$1;
var load_1 = load$1;
var loader = {
  loadAll: loadAll_1,
  load: load_1
};
var _toString = Object.prototype.toString;
var _hasOwnProperty = Object.prototype.hasOwnProperty;
var CHAR_BOM = 65279;
var CHAR_TAB = 9;
var CHAR_LINE_FEED = 10;
var CHAR_CARRIAGE_RETURN = 13;
var CHAR_SPACE = 32;
var CHAR_EXCLAMATION = 33;
var CHAR_DOUBLE_QUOTE = 34;
var CHAR_SHARP = 35;
var CHAR_PERCENT = 37;
var CHAR_AMPERSAND = 38;
var CHAR_SINGLE_QUOTE = 39;
var CHAR_ASTERISK = 42;
var CHAR_COMMA = 44;
var CHAR_MINUS = 45;
var CHAR_COLON = 58;
var CHAR_EQUALS = 61;
var CHAR_GREATER_THAN = 62;
var CHAR_QUESTION = 63;
var CHAR_COMMERCIAL_AT = 64;
var CHAR_LEFT_SQUARE_BRACKET = 91;
var CHAR_RIGHT_SQUARE_BRACKET = 93;
var CHAR_GRAVE_ACCENT = 96;
var CHAR_LEFT_CURLY_BRACKET = 123;
var CHAR_VERTICAL_LINE = 124;
var CHAR_RIGHT_CURLY_BRACKET = 125;
var ESCAPE_SEQUENCES = {};
ESCAPE_SEQUENCES[0] = "\\0";
ESCAPE_SEQUENCES[7] = "\\a";
ESCAPE_SEQUENCES[8] = "\\b";
ESCAPE_SEQUENCES[9] = "\\t";
ESCAPE_SEQUENCES[10] = "\\n";
ESCAPE_SEQUENCES[11] = "\\v";
ESCAPE_SEQUENCES[12] = "\\f";
ESCAPE_SEQUENCES[13] = "\\r";
ESCAPE_SEQUENCES[27] = "\\e";
ESCAPE_SEQUENCES[34] = '\\"';
ESCAPE_SEQUENCES[92] = "\\\\";
ESCAPE_SEQUENCES[133] = "\\N";
ESCAPE_SEQUENCES[160] = "\\_";
ESCAPE_SEQUENCES[8232] = "\\L";
ESCAPE_SEQUENCES[8233] = "\\P";
var DEPRECATED_BOOLEANS_SYNTAX = [
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
];
var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function compileStyleMap(schema3, map3) {
  var result, keys2, index, length, tag, style, type2;
  if (map3 === null) return {};
  result = {};
  keys2 = Object.keys(map3);
  for (index = 0, length = keys2.length; index < length; index += 1) {
    tag = keys2[index];
    style = String(map3[tag]);
    if (tag.slice(0, 2) === "!!") {
      tag = "tag:yaml.org,2002:" + tag.slice(2);
    }
    type2 = schema3.compiledTypeMap["fallback"][tag];
    if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) {
      style = type2.styleAliases[style];
    }
    result[tag] = style;
  }
  return result;
}
function encodeHex(character) {
  var string2, handle, length;
  string2 = character.toString(16).toUpperCase();
  if (character <= 255) {
    handle = "x";
    length = 2;
  } else if (character <= 65535) {
    handle = "u";
    length = 4;
  } else if (character <= 4294967295) {
    handle = "U";
    length = 8;
  } else {
    throw new exception("code point within a string may not be greater than 0xFFFFFFFF");
  }
  return "\\" + handle + common.repeat("0", length - string2.length) + string2;
}
var QUOTING_TYPE_SINGLE = 1;
var QUOTING_TYPE_DOUBLE = 2;
function State(options2) {
  this.schema = options2["schema"] || _default;
  this.indent = Math.max(1, options2["indent"] || 2);
  this.noArrayIndent = options2["noArrayIndent"] || false;
  this.skipInvalid = options2["skipInvalid"] || false;
  this.flowLevel = common.isNothing(options2["flowLevel"]) ? -1 : options2["flowLevel"];
  this.styleMap = compileStyleMap(this.schema, options2["styles"] || null);
  this.sortKeys = options2["sortKeys"] || false;
  this.lineWidth = options2["lineWidth"] || 80;
  this.noRefs = options2["noRefs"] || false;
  this.noCompatMode = options2["noCompatMode"] || false;
  this.condenseFlow = options2["condenseFlow"] || false;
  this.quotingType = options2["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
  this.forceQuotes = options2["forceQuotes"] || false;
  this.replacer = typeof options2["replacer"] === "function" ? options2["replacer"] : null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;
  this.tag = null;
  this.result = "";
  this.duplicates = [];
  this.usedDuplicates = null;
}
function indentString(string2, spaces) {
  var ind = common.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string2.length;
  while (position < length) {
    next = string2.indexOf("\n", position);
    if (next === -1) {
      line = string2.slice(position);
      position = length;
    } else {
      line = string2.slice(position, next + 1);
      position = next + 1;
    }
    if (line.length && line !== "\n") result += ind;
    result += line;
  }
  return result;
}
function generateNextLine(state, level) {
  return "\n" + common.repeat(" ", state.indent * level);
}
function testImplicitResolving(state, str2) {
  var index, length, type2;
  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
    type2 = state.implicitTypes[index];
    if (type2.resolve(str2)) {
      return true;
    }
  }
  return false;
}
function isWhitespace(c) {
  return c === CHAR_SPACE || c === CHAR_TAB;
}
function isPrintable(c) {
  return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== CHAR_BOM || 65536 <= c && c <= 1114111;
}
function isNsCharOrWhitespace(c) {
  return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
}
function isPlainSafe(c, prev, inblock) {
  var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
  var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
  return (
    // ns-plain-safe
    (inblock ? (
      // c = flow-in
      cIsNsCharOrWhitespace
    ) : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar
  );
}
function isPlainSafeFirst(c) {
  return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
}
function isPlainSafeLast(c) {
  return !isWhitespace(c) && c !== CHAR_COLON;
}
function codePointAt(string2, pos) {
  var first = string2.charCodeAt(pos), second;
  if (first >= 55296 && first <= 56319 && pos + 1 < string2.length) {
    second = string2.charCodeAt(pos + 1);
    if (second >= 56320 && second <= 57343) {
      return (first - 55296) * 1024 + second - 56320 + 65536;
    }
  }
  return first;
}
function needIndentIndicator(string2) {
  var leadingSpaceRe = /^\n* /;
  return leadingSpaceRe.test(string2);
}
var STYLE_PLAIN = 1;
var STYLE_SINGLE = 2;
var STYLE_LITERAL = 3;
var STYLE_FOLDED = 4;
var STYLE_DOUBLE = 5;
function chooseScalarStyle(string2, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
  var i;
  var char = 0;
  var prevChar = null;
  var hasLineBreak = false;
  var hasFoldableLine = false;
  var shouldTrackWidth = lineWidth !== -1;
  var previousLineBreak = -1;
  var plain = isPlainSafeFirst(codePointAt(string2, 0)) && isPlainSafeLast(codePointAt(string2, string2.length - 1));
  if (singleLineOnly || forceQuotes) {
    for (i = 0; i < string2.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string2, i);
      if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
  } else {
    for (i = 0; i < string2.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string2, i);
      if (char === CHAR_LINE_FEED) {
        hasLineBreak = true;
        if (shouldTrackWidth) {
          hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
          i - previousLineBreak - 1 > lineWidth && string2[previousLineBreak + 1] !== " ";
          previousLineBreak = i;
        }
      } else if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
    hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string2[previousLineBreak + 1] !== " ");
  }
  if (!hasLineBreak && !hasFoldableLine) {
    if (plain && !forceQuotes && !testAmbiguousType(string2)) {
      return STYLE_PLAIN;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  if (indentPerLevel > 9 && needIndentIndicator(string2)) {
    return STYLE_DOUBLE;
  }
  if (!forceQuotes) {
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
  }
  return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
}
function writeScalar(state, string2, level, iskey, inblock) {
  state.dump = function() {
    if (string2.length === 0) {
      return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
    }
    if (!state.noCompatMode) {
      if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string2) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string2)) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string2 + '"' : "'" + string2 + "'";
      }
    }
    var indent = state.indent * Math.max(1, level);
    var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
    var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
    function testAmbiguity(string3) {
      return testImplicitResolving(state, string3);
    }
    switch (chooseScalarStyle(
      string2,
      singleLineOnly,
      state.indent,
      lineWidth,
      testAmbiguity,
      state.quotingType,
      state.forceQuotes && !iskey,
      inblock
    )) {
      case STYLE_PLAIN:
        return string2;
      case STYLE_SINGLE:
        return "'" + string2.replace(/'/g, "''") + "'";
      case STYLE_LITERAL:
        return "|" + blockHeader(string2, state.indent) + dropEndingNewline(indentString(string2, indent));
      case STYLE_FOLDED:
        return ">" + blockHeader(string2, state.indent) + dropEndingNewline(indentString(foldString(string2, lineWidth), indent));
      case STYLE_DOUBLE:
        return '"' + escapeString(string2) + '"';
      default:
        throw new exception("impossible error: invalid scalar style");
    }
  }();
}
function blockHeader(string2, indentPerLevel) {
  var indentIndicator = needIndentIndicator(string2) ? String(indentPerLevel) : "";
  var clip = string2[string2.length - 1] === "\n";
  var keep = clip && (string2[string2.length - 2] === "\n" || string2 === "\n");
  var chomp = keep ? "+" : clip ? "" : "-";
  return indentIndicator + chomp + "\n";
}
function dropEndingNewline(string2) {
  return string2[string2.length - 1] === "\n" ? string2.slice(0, -1) : string2;
}
function foldString(string2, width) {
  var lineRe = /(\n+)([^\n]*)/g;
  var result = function() {
    var nextLF = string2.indexOf("\n");
    nextLF = nextLF !== -1 ? nextLF : string2.length;
    lineRe.lastIndex = nextLF;
    return foldLine(string2.slice(0, nextLF), width);
  }();
  var prevMoreIndented = string2[0] === "\n" || string2[0] === " ";
  var moreIndented;
  var match;
  while (match = lineRe.exec(string2)) {
    var prefix = match[1], line = match[2];
    moreIndented = line[0] === " ";
    result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
    prevMoreIndented = moreIndented;
  }
  return result;
}
function foldLine(line, width) {
  if (line === "" || line[0] === " ") return line;
  var breakRe = / [^ ]/g;
  var match;
  var start = 0, end, curr = 0, next = 0;
  var result = "";
  while (match = breakRe.exec(line)) {
    next = match.index;
    if (next - start > width) {
      end = curr > start ? curr : next;
      result += "\n" + line.slice(start, end);
      start = end + 1;
    }
    curr = next;
  }
  result += "\n";
  if (line.length - start > width && curr > start) {
    result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
  } else {
    result += line.slice(start);
  }
  return result.slice(1);
}
function escapeString(string2) {
  var result = "";
  var char = 0;
  var escapeSeq;
  for (var i = 0; i < string2.length; char >= 65536 ? i += 2 : i++) {
    char = codePointAt(string2, i);
    escapeSeq = ESCAPE_SEQUENCES[char];
    if (!escapeSeq && isPrintable(char)) {
      result += string2[i];
      if (char >= 65536) result += string2[i + 1];
    } else {
      result += escapeSeq || encodeHex(char);
    }
  }
  return result;
}
function writeFlowSequence(state, level, object) {
  var _result = "", _tag = state.tag, index, length, value;
  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];
    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }
    if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
      if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
      _result += state.dump;
    }
  }
  state.tag = _tag;
  state.dump = "[" + _result + "]";
}
function writeBlockSequence(state, level, object, compact) {
  var _result = "", _tag = state.tag, index, length, value;
  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];
    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }
    if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
      if (!compact || _result !== "") {
        _result += generateNextLine(state, level);
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        _result += "-";
      } else {
        _result += "- ";
      }
      _result += state.dump;
    }
  }
  state.tag = _tag;
  state.dump = _result || "[]";
}
function writeFlowMapping(state, level, object) {
  var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, pairBuffer;
  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = "";
    if (_result !== "") pairBuffer += ", ";
    if (state.condenseFlow) pairBuffer += '"';
    objectKey = objectKeyList[index];
    objectValue = object[objectKey];
    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }
    if (!writeNode(state, level, objectKey, false, false)) {
      continue;
    }
    if (state.dump.length > 1024) pairBuffer += "? ";
    pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
    if (!writeNode(state, level, objectValue, false, false)) {
      continue;
    }
    pairBuffer += state.dump;
    _result += pairBuffer;
  }
  state.tag = _tag;
  state.dump = "{" + _result + "}";
}
function writeBlockMapping(state, level, object, compact) {
  var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, explicitPair, pairBuffer;
  if (state.sortKeys === true) {
    objectKeyList.sort();
  } else if (typeof state.sortKeys === "function") {
    objectKeyList.sort(state.sortKeys);
  } else if (state.sortKeys) {
    throw new exception("sortKeys must be a boolean or a function");
  }
  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = "";
    if (!compact || _result !== "") {
      pairBuffer += generateNextLine(state, level);
    }
    objectKey = objectKeyList[index];
    objectValue = object[objectKey];
    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }
    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
      continue;
    }
    explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
    if (explicitPair) {
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += "?";
      } else {
        pairBuffer += "? ";
      }
    }
    pairBuffer += state.dump;
    if (explicitPair) {
      pairBuffer += generateNextLine(state, level);
    }
    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
      continue;
    }
    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
      pairBuffer += ":";
    } else {
      pairBuffer += ": ";
    }
    pairBuffer += state.dump;
    _result += pairBuffer;
  }
  state.tag = _tag;
  state.dump = _result || "{}";
}
function detectType(state, object, explicit) {
  var _result, typeList, index, length, type2, style;
  typeList = explicit ? state.explicitTypes : state.implicitTypes;
  for (index = 0, length = typeList.length; index < length; index += 1) {
    type2 = typeList[index];
    if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
      if (explicit) {
        if (type2.multi && type2.representName) {
          state.tag = type2.representName(object);
        } else {
          state.tag = type2.tag;
        }
      } else {
        state.tag = "?";
      }
      if (type2.represent) {
        style = state.styleMap[type2.tag] || type2.defaultStyle;
        if (_toString.call(type2.represent) === "[object Function]") {
          _result = type2.represent(object, style);
        } else if (_hasOwnProperty.call(type2.represent, style)) {
          _result = type2.represent[style](object, style);
        } else {
          throw new exception("!<" + type2.tag + '> tag resolver accepts not "' + style + '" style');
        }
        state.dump = _result;
      }
      return true;
    }
  }
  return false;
}
function writeNode(state, level, object, block, compact, iskey, isblockseq) {
  state.tag = null;
  state.dump = object;
  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }
  var type2 = _toString.call(state.dump);
  var inblock = block;
  var tagStr;
  if (block) {
    block = state.flowLevel < 0 || state.flowLevel > level;
  }
  var objectOrArray = type2 === "[object Object]" || type2 === "[object Array]", duplicateIndex, duplicate;
  if (objectOrArray) {
    duplicateIndex = state.duplicates.indexOf(object);
    duplicate = duplicateIndex !== -1;
  }
  if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
    compact = false;
  }
  if (duplicate && state.usedDuplicates[duplicateIndex]) {
    state.dump = "*ref_" + duplicateIndex;
  } else {
    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
      state.usedDuplicates[duplicateIndex] = true;
    }
    if (type2 === "[object Object]") {
      if (block && Object.keys(state.dump).length !== 0) {
        writeBlockMapping(state, level, state.dump, compact);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + state.dump;
        }
      } else {
        writeFlowMapping(state, level, state.dump);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + " " + state.dump;
        }
      }
    } else if (type2 === "[object Array]") {
      if (block && state.dump.length !== 0) {
        if (state.noArrayIndent && !isblockseq && level > 0) {
          writeBlockSequence(state, level - 1, state.dump, compact);
        } else {
          writeBlockSequence(state, level, state.dump, compact);
        }
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + state.dump;
        }
      } else {
        writeFlowSequence(state, level, state.dump);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + " " + state.dump;
        }
      }
    } else if (type2 === "[object String]") {
      if (state.tag !== "?") {
        writeScalar(state, state.dump, level, iskey, inblock);
      }
    } else if (type2 === "[object Undefined]") {
      return false;
    } else {
      if (state.skipInvalid) return false;
      throw new exception("unacceptable kind of an object to dump " + type2);
    }
    if (state.tag !== null && state.tag !== "?") {
      tagStr = encodeURI(
        state.tag[0] === "!" ? state.tag.slice(1) : state.tag
      ).replace(/!/g, "%21");
      if (state.tag[0] === "!") {
        tagStr = "!" + tagStr;
      } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
        tagStr = "!!" + tagStr.slice(18);
      } else {
        tagStr = "!<" + tagStr + ">";
      }
      state.dump = tagStr + " " + state.dump;
    }
  }
  return true;
}
function getDuplicateReferences(object, state) {
  var objects = [], duplicatesIndexes = [], index, length;
  inspectNode(object, objects, duplicatesIndexes);
  for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
    state.duplicates.push(objects[duplicatesIndexes[index]]);
  }
  state.usedDuplicates = new Array(length);
}
function inspectNode(object, objects, duplicatesIndexes) {
  var objectKeyList, index, length;
  if (object !== null && typeof object === "object") {
    index = objects.indexOf(object);
    if (index !== -1) {
      if (duplicatesIndexes.indexOf(index) === -1) {
        duplicatesIndexes.push(index);
      }
    } else {
      objects.push(object);
      if (Array.isArray(object)) {
        for (index = 0, length = object.length; index < length; index += 1) {
          inspectNode(object[index], objects, duplicatesIndexes);
        }
      } else {
        objectKeyList = Object.keys(object);
        for (index = 0, length = objectKeyList.length; index < length; index += 1) {
          inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
        }
      }
    }
  }
}
function dump$1(input, options2) {
  options2 = options2 || {};
  var state = new State(options2);
  if (!state.noRefs) getDuplicateReferences(input, state);
  var value = input;
  if (state.replacer) {
    value = state.replacer.call({ "": value }, "", value);
  }
  if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
  return "";
}
var dump_1 = dump$1;
var dumper = {
  dump: dump_1
};
function renamed(from, to) {
  return function() {
    throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
  };
}
var Type = type;
var DEFAULT_SCHEMA = _default;
var load = loader.load;
var loadAll = loader.loadAll;
var dump = dumper.dump;
var safeLoad = renamed("safeLoad", "load");
var safeLoadAll = renamed("safeLoadAll", "loadAll");
var safeDump = renamed("safeDump", "dump");

// ../common/src/testUtil/serialize.ts
var CustomDump = class {
  constructor(data, opts) {
    this.data = data;
    this.opts = opts;
  }
  represent() {
    let result = dump(
      this.data,
      Object.assign({ replacer, schema: schema2 }, this.opts)
    );
    result = result.trim();
    if (result.includes("\n")) {
      result = "\n" + result;
    }
    return result;
  }
};
var customDumpType = new Type("!format", {
  kind: "scalar",
  resolve: () => false,
  instanceOf: CustomDump,
  represent: (d) => d.represent()
});
var schema2 = DEFAULT_SCHEMA.extend({ implicit: [customDumpType] });
var isObject3 = (value) => typeof value === "object" && value != null;
function hasSimpleChildren(value) {
  if (isObject3(value)) {
    return Object.values(value).every(
      (value2) => !isObject3(value2) && !Array.isArray(value2)
    );
  }
  if (Array.isArray(value)) {
    return value.every((value2) => !isObject3(value2) && !Array.isArray(value2));
  }
}
function replacer(key, value) {
  if (key === "") {
    return value;
  }
  if (hasSimpleChildren(value)) {
    return new CustomDump(value, { flowLevel: 0 });
  }
  return value;
}

// ../common/src/types/command/ActionDescriptor.ts
var simpleActionNames = [
  "breakLine",
  "clearAndSetSelection",
  "copyToClipboard",
  "cutToClipboard",
  "decrement",
  "deselect",
  "editNewLineAfter",
  "editNewLineBefore",
  "experimental.setInstanceReference",
  "extractVariable",
  "findInDocument",
  "findInWorkspace",
  "foldRegion",
  "followLink",
  "followLinkAside",
  "increment",
  "indentLine",
  "insertCopyAfter",
  "insertCopyBefore",
  "insertEmptyLineAfter",
  "insertEmptyLineBefore",
  "insertEmptyLinesAround",
  "joinLines",
  "outdentLine",
  "randomizeTargets",
  "remove",
  "rename",
  "revealDefinition",
  "revealTypeDefinition",
  "reverseTargets",
  "scrollToBottom",
  "scrollToCenter",
  "scrollToTop",
  "setSelection",
  "setSelectionAfter",
  "setSelectionBefore",
  "showDebugHover",
  "showHover",
  "showQuickFix",
  "showReferences",
  "sortTargets",
  "toggleLineBreakpoint",
  "toggleLineComment",
  "unfoldRegion",
  "private.setKeyboardTarget",
  "private.showParseTree",
  "private.getTargets"
];
var complexActionNames = [
  "callAsFunction",
  "editNew",
  "executeCommand",
  "generateSnippet",
  "getText",
  "highlight",
  "insertSnippet",
  "moveToTarget",
  "pasteFromClipboard",
  "replace",
  "replaceWithTarget",
  "rewrapWithPairedDelimiter",
  "swapTargets",
  "wrapWithPairedDelimiter",
  "wrapWithSnippet",
  "parsed"
];
var actionNames = [
  ...simpleActionNames,
  ...complexActionNames
];

// ../common/src/types/command/command.types.ts
var LATEST_VERSION = 7;

// ../common/src/types/command/PartialTargetDescriptor.types.ts
var simpleSurroundingPairNames = [
  "angleBrackets",
  "backtickQuotes",
  "curlyBrackets",
  "doubleQuotes",
  "escapedDoubleQuotes",
  "escapedParentheses",
  "escapedSingleQuotes",
  "escapedSquareBrackets",
  "parentheses",
  "singleQuotes",
  "squareBrackets",
  "tripleDoubleQuotes",
  "tripleSingleQuotes"
];
var complexSurroundingPairNames = [
  "string",
  "any",
  "collectionBoundary"
];
var surroundingPairNames = [
  ...simpleSurroundingPairNames,
  ...complexSurroundingPairNames
];
var simpleScopeTypeTypes = [
  "argumentOrParameter",
  "anonymousFunction",
  "attribute",
  "branch",
  "class",
  "className",
  "collectionItem",
  "collectionKey",
  "comment",
  "private.fieldAccess",
  "functionCall",
  "functionCallee",
  "functionName",
  "ifStatement",
  "instance",
  "list",
  "map",
  "name",
  "namedFunction",
  "regularExpression",
  "statement",
  "string",
  "type",
  "value",
  "condition",
  "section",
  "sectionLevelOne",
  "sectionLevelTwo",
  "sectionLevelThree",
  "sectionLevelFour",
  "sectionLevelFive",
  "sectionLevelSix",
  "selector",
  "private.switchStatementSubject",
  "unit",
  "xmlBothTags",
  "xmlElement",
  "xmlEndTag",
  "xmlStartTag",
  // Latex scope types
  "part",
  "chapter",
  "subSection",
  "subSubSection",
  "namedParagraph",
  "subParagraph",
  "environment",
  // Text based scopes
  "character",
  "word",
  "token",
  "identifier",
  "line",
  "sentence",
  "paragraph",
  "boundedParagraph",
  "document",
  "nonWhitespaceSequence",
  "boundedNonWhitespaceSequence",
  "url",
  "notebookCell",
  // Talon
  "command",
  // Private scope types
  "textFragment",
  "disqualifyDelimiter"
];
function isSimpleScopeType(scopeType) {
  return simpleScopeTypeTypes.includes(scopeType.type);
}

// ../common/src/types/TalonSpokenForms.ts
var SUPPORTED_ENTRY_TYPES = [
  "simpleScopeTypeType",
  "complexScopeTypeType",
  "customRegex",
  "pairedDelimiter",
  "action",
  "customAction",
  "grapheme"
];
var NeedsInitialTalonUpdateError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "NeedsInitialTalonUpdateError";
  }
};
var DisabledCustomSpokenFormsError = class extends Error {
  constructor() {
    super("Custom spoken forms are not currently supported in this ide");
    this.name = "DisabledCustomSpokenFormsError";
  }
};

// ../common/src/util/camelCaseToAllDown.ts
function camelCaseToAllDown(input) {
  return input.replace(/([A-Z])/g, " $1").split(" ").map((word) => word.toLowerCase()).join(" ");
}

// ../common/src/util/clientSupportsFallback.ts
function clientSupportsFallback(command) {
  return command.version >= 7;
}

// ../common/src/util/CompositeKeyMap.ts
var CompositeKeyMap = class {
  /**
   *
   * @param hashFunction A function that maps from a key to a list whose entries can be converted to string
   */
  constructor(hashFunction) {
    this.hashFunction = hashFunction;
    this.map = {};
  }
  hash(key) {
    return this.hashFunction(key).join("\0");
  }
  set(key, item) {
    this.map[this.hash(key)] = item;
    return this;
  }
  has(key) {
    return this.hash(key) in this.map;
  }
  get(key) {
    return this.map[this.hash(key)];
  }
  delete(key) {
    delete this.map[this.hash(key)];
    return this;
  }
  clear() {
    this.map = {};
    return this;
  }
};

// ../common/src/util/DefaultMap.ts
var DefaultMap = class extends Map {
  /**
   * @param getDefaultValue A function that returns the default value for a given key
   */
  constructor(getDefaultValue) {
    super();
    this.getDefaultValue = getDefaultValue;
  }
  get(key) {
    const currentValue = super.get(key);
    if (currentValue != null) {
      return currentValue;
    }
    const value = this.getDefaultValue(key);
    this.set(key, value);
    return value;
  }
};

// ../common/src/util/disposableFrom.ts
function disposableFrom(...disposables) {
  return {
    dispose() {
      disposables.forEach(({ dispose }) => {
        try {
          dispose();
        } catch (e) {
          console.error(e);
        }
      });
    }
  };
}

// ../common/src/util/type.ts
function isString(arg) {
  return typeof arg === "string" || arg instanceof String;
}

// ../common/src/util/ensureCommandShape.ts
function ensureCommandShape(args) {
  const [spokenFormOrCommand, ...rest] = args;
  return handleLegacyCommandShape(spokenFormOrCommand, rest);
}
function handleLegacyCommandShape(spokenFormOrCommand, rest) {
  let command;
  if (isString(spokenFormOrCommand)) {
    const spokenForm = spokenFormOrCommand;
    const [action, targets, ...extraArgs] = rest;
    command = {
      version: 0,
      spokenForm,
      action,
      targets,
      extraArgs,
      usePrePhraseSnapshot: false
    };
  } else {
    command = spokenFormOrCommand;
  }
  return command;
}

// ../common/src/util/itertools.ts
function groupBy2(list, func) {
  const map3 = /* @__PURE__ */ new Map();
  list.forEach((element) => {
    const key = func(element);
    let group;
    if (map3.has(key)) {
      group = map3.get(key);
    } else {
      group = [];
      map3.set(key, group);
    }
    group.push(element);
  });
  return map3;
}
function isEmptyIterable(iterable) {
  for (const _ of iterable) {
    return false;
  }
  return true;
}

// ../common/src/util/object.ts
function unsafeKeys(o) {
  return Object.keys(o);
}

// ../common/src/util/selectionsEqual.ts
function selectionsEqual(a, b) {
  return a.length === b.length && a.every((selection, i) => selection.isEqual(b[i]));
}

// ../common/src/util/splitKey.ts
function getKey(hatStyle, character) {
  return `${hatStyle}.${character}`;
}

// ../common/src/util/textFormatters.ts
var textFormatters = {
  camelCase(tokens2) {
    if (tokens2.length === 0) {
      return "";
    }
    const [first, ...rest] = tokens2;
    return first + rest.map(capitalizeToken).join("");
  },
  snakeCase(tokens2) {
    return tokens2.join("_");
  },
  upperSnakeCase(tokens2) {
    return tokens2.map((token) => token.toUpperCase()).join("_");
  },
  pascalCase(tokens2) {
    return tokens2.map(capitalizeToken).join("");
  }
};
function capitalizeToken(token) {
  return token.length === 0 ? "" : token[0].toUpperCase() + token.substr(1);
}

// ../common/src/util/uniqWithHash.ts
function uniqWithHash(array, isEqual2, hash) {
  if (array.length < 2) {
    return [...array];
  }
  if (array.length === 2) {
    if (isEqual2(array[0], array[1])) {
      return [array[0]];
    }
    return [...array];
  }
  const needsUniq = [];
  const hashToItems = array.reduce((acc, item) => {
    const key = hash(item);
    const items = acc.get(key);
    if (items == null) {
      acc.set(key, [item]);
      return acc;
    }
    acc.get(key).push(item);
    if (items.length === 2) {
      needsUniq.push(key);
    }
    return acc;
  }, /* @__PURE__ */ new Map());
  if (needsUniq.length === 0) {
    return [...array];
  }
  needsUniq.forEach((key) => {
    hashToItems.set(key, uniqWith_default(hashToItems.get(key), isEqual2));
  });
  return array.flatMap((item) => {
    const key = hash(item);
    const items = hashToItems.get(key);
    if (items == null || items.length === 0) {
      return [];
    }
    const first = items[0];
    if (!isEqual2(first, item)) {
      return [];
    }
    items.shift();
    return first;
  });
}

// ../common/src/util/zipStrict.ts
function zipStrict(list1, list2) {
  if (list1.length !== list2.length) {
    throw new Error("Lists must have the same length");
  }
  return list1.map((value, index) => [value, list2[index]]);
}

// ../../node_modules/.pnpm/immer@10.1.1/node_modules/immer/dist/immer.mjs
var NOTHING = Symbol.for("immer-nothing");
var DRAFTABLE = Symbol.for("immer-draftable");
var DRAFT_STATE = Symbol.for("immer-state");
var errors = process.env.NODE_ENV !== "production" ? [
  // All error codes, starting by 0:
  function(plugin) {
    return `The plugin for '${plugin}' has not been loaded into Immer. To enable the plugin, import and call \`enable${plugin}()\` when initializing your application.`;
  },
  function(thing) {
    return `produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '${thing}'`;
  },
  "This object has been frozen and should not be mutated",
  function(data) {
    return "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " + data;
  },
  "An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.",
  "Immer forbids circular references",
  "The first or second argument to `produce` must be a function",
  "The third argument to `produce` must be a function or undefined",
  "First argument to `createDraft` must be a plain object, an array, or an immerable object",
  "First argument to `finishDraft` must be a draft returned by `createDraft`",
  function(thing) {
    return `'current' expects a draft, got: ${thing}`;
  },
  "Object.defineProperty() cannot be used on an Immer draft",
  "Object.setPrototypeOf() cannot be used on an Immer draft",
  "Immer only supports deleting array indices",
  "Immer only supports setting array indices and the 'length' property",
  function(thing) {
    return `'original' expects a draft, got: ${thing}`;
  }
  // Note: if more errors are added, the errorOffset in Patches.ts should be increased
  // See Patches.ts for additional errors
] : [];
function die(error, ...args) {
  if (process.env.NODE_ENV !== "production") {
    const e = errors[error];
    const msg = typeof e === "function" ? e.apply(null, args) : e;
    throw new Error(`[Immer] ${msg}`);
  }
  throw new Error(
    `[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`
  );
}
var getPrototypeOf = Object.getPrototypeOf;
function isDraft(value) {
  return !!value && !!value[DRAFT_STATE];
}
function isDraftable(value) {
  if (!value)
    return false;
  return isPlainObject(value) || Array.isArray(value) || !!value[DRAFTABLE] || !!value.constructor?.[DRAFTABLE] || isMap(value) || isSet(value);
}
var objectCtorString = Object.prototype.constructor.toString();
function isPlainObject(value) {
  if (!value || typeof value !== "object")
    return false;
  const proto = getPrototypeOf(value);
  if (proto === null) {
    return true;
  }
  const Ctor = Object.hasOwnProperty.call(proto, "constructor") && proto.constructor;
  if (Ctor === Object)
    return true;
  return typeof Ctor == "function" && Function.toString.call(Ctor) === objectCtorString;
}
function each(obj, iter2) {
  if (getArchtype(obj) === 0) {
    Reflect.ownKeys(obj).forEach((key) => {
      iter2(key, obj[key], obj);
    });
  } else {
    obj.forEach((entry, index) => iter2(index, entry, obj));
  }
}
function getArchtype(thing) {
  const state = thing[DRAFT_STATE];
  return state ? state.type_ : Array.isArray(thing) ? 1 : isMap(thing) ? 2 : isSet(thing) ? 3 : 0;
}
function has(thing, prop) {
  return getArchtype(thing) === 2 ? thing.has(prop) : Object.prototype.hasOwnProperty.call(thing, prop);
}
function set2(thing, propOrOldValue, value) {
  const t = getArchtype(thing);
  if (t === 2)
    thing.set(propOrOldValue, value);
  else if (t === 3) {
    thing.add(value);
  } else
    thing[propOrOldValue] = value;
}
function is(x, y) {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}
function isMap(target) {
  return target instanceof Map;
}
function isSet(target) {
  return target instanceof Set;
}
function latest(state) {
  return state.copy_ || state.base_;
}
function shallowCopy(base, strict) {
  if (isMap(base)) {
    return new Map(base);
  }
  if (isSet(base)) {
    return new Set(base);
  }
  if (Array.isArray(base))
    return Array.prototype.slice.call(base);
  const isPlain = isPlainObject(base);
  if (strict === true || strict === "class_only" && !isPlain) {
    const descriptors = Object.getOwnPropertyDescriptors(base);
    delete descriptors[DRAFT_STATE];
    let keys2 = Reflect.ownKeys(descriptors);
    for (let i = 0; i < keys2.length; i++) {
      const key = keys2[i];
      const desc = descriptors[key];
      if (desc.writable === false) {
        desc.writable = true;
        desc.configurable = true;
      }
      if (desc.get || desc.set)
        descriptors[key] = {
          configurable: true,
          writable: true,
          // could live with !!desc.set as well here...
          enumerable: desc.enumerable,
          value: base[key]
        };
    }
    return Object.create(getPrototypeOf(base), descriptors);
  } else {
    const proto = getPrototypeOf(base);
    if (proto !== null && isPlain) {
      return { ...base };
    }
    const obj = Object.create(proto);
    return Object.assign(obj, base);
  }
}
function freeze(obj, deep = false) {
  if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj))
    return obj;
  if (getArchtype(obj) > 1) {
    obj.set = obj.add = obj.clear = obj.delete = dontMutateFrozenCollections;
  }
  Object.freeze(obj);
  if (deep)
    Object.entries(obj).forEach(([key, value]) => freeze(value, true));
  return obj;
}
function dontMutateFrozenCollections() {
  die(2);
}
function isFrozen(obj) {
  return Object.isFrozen(obj);
}
var plugins = {};
function getPlugin(pluginKey) {
  const plugin = plugins[pluginKey];
  if (!plugin) {
    die(0, pluginKey);
  }
  return plugin;
}
var currentScope;
function getCurrentScope() {
  return currentScope;
}
function createScope(parent_, immer_) {
  return {
    drafts_: [],
    parent_,
    immer_,
    // Whenever the modified draft contains a draft from another scope, we
    // need to prevent auto-freezing so the unowned draft can be finalized.
    canAutoFreeze_: true,
    unfinalizedDrafts_: 0
  };
}
function usePatchesInScope(scope, patchListener) {
  if (patchListener) {
    getPlugin("Patches");
    scope.patches_ = [];
    scope.inversePatches_ = [];
    scope.patchListener_ = patchListener;
  }
}
function revokeScope(scope) {
  leaveScope(scope);
  scope.drafts_.forEach(revokeDraft);
  scope.drafts_ = null;
}
function leaveScope(scope) {
  if (scope === currentScope) {
    currentScope = scope.parent_;
  }
}
function enterScope(immer2) {
  return currentScope = createScope(currentScope, immer2);
}
function revokeDraft(draft) {
  const state = draft[DRAFT_STATE];
  if (state.type_ === 0 || state.type_ === 1)
    state.revoke_();
  else
    state.revoked_ = true;
}
function processResult(result, scope) {
  scope.unfinalizedDrafts_ = scope.drafts_.length;
  const baseDraft = scope.drafts_[0];
  const isReplaced = result !== void 0 && result !== baseDraft;
  if (isReplaced) {
    if (baseDraft[DRAFT_STATE].modified_) {
      revokeScope(scope);
      die(4);
    }
    if (isDraftable(result)) {
      result = finalize(scope, result);
      if (!scope.parent_)
        maybeFreeze(scope, result);
    }
    if (scope.patches_) {
      getPlugin("Patches").generateReplacementPatches_(
        baseDraft[DRAFT_STATE].base_,
        result,
        scope.patches_,
        scope.inversePatches_
      );
    }
  } else {
    result = finalize(scope, baseDraft, []);
  }
  revokeScope(scope);
  if (scope.patches_) {
    scope.patchListener_(scope.patches_, scope.inversePatches_);
  }
  return result !== NOTHING ? result : void 0;
}
function finalize(rootScope, value, path) {
  if (isFrozen(value))
    return value;
  const state = value[DRAFT_STATE];
  if (!state) {
    each(
      value,
      (key, childValue) => finalizeProperty(rootScope, state, value, key, childValue, path)
    );
    return value;
  }
  if (state.scope_ !== rootScope)
    return value;
  if (!state.modified_) {
    maybeFreeze(rootScope, state.base_, true);
    return state.base_;
  }
  if (!state.finalized_) {
    state.finalized_ = true;
    state.scope_.unfinalizedDrafts_--;
    const result = state.copy_;
    let resultEach = result;
    let isSet2 = false;
    if (state.type_ === 3) {
      resultEach = new Set(result);
      result.clear();
      isSet2 = true;
    }
    each(
      resultEach,
      (key, childValue) => finalizeProperty(rootScope, state, result, key, childValue, path, isSet2)
    );
    maybeFreeze(rootScope, result, false);
    if (path && rootScope.patches_) {
      getPlugin("Patches").generatePatches_(
        state,
        path,
        rootScope.patches_,
        rootScope.inversePatches_
      );
    }
  }
  return state.copy_;
}
function finalizeProperty(rootScope, parentState, targetObject, prop, childValue, rootPath, targetIsSet) {
  if (process.env.NODE_ENV !== "production" && childValue === targetObject)
    die(5);
  if (isDraft(childValue)) {
    const path = rootPath && parentState && parentState.type_ !== 3 && // Set objects are atomic since they have no keys.
    !has(parentState.assigned_, prop) ? rootPath.concat(prop) : void 0;
    const res = finalize(rootScope, childValue, path);
    set2(targetObject, prop, res);
    if (isDraft(res)) {
      rootScope.canAutoFreeze_ = false;
    } else
      return;
  } else if (targetIsSet) {
    targetObject.add(childValue);
  }
  if (isDraftable(childValue) && !isFrozen(childValue)) {
    if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
      return;
    }
    finalize(rootScope, childValue);
    if ((!parentState || !parentState.scope_.parent_) && typeof prop !== "symbol" && Object.prototype.propertyIsEnumerable.call(targetObject, prop))
      maybeFreeze(rootScope, childValue);
  }
}
function maybeFreeze(scope, value, deep = false) {
  if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
    freeze(value, deep);
  }
}
function createProxyProxy(base, parent) {
  const isArray2 = Array.isArray(base);
  const state = {
    type_: isArray2 ? 1 : 0,
    // Track which produce call this is associated with.
    scope_: parent ? parent.scope_ : getCurrentScope(),
    // True for both shallow and deep changes.
    modified_: false,
    // Used during finalization.
    finalized_: false,
    // Track which properties have been assigned (true) or deleted (false).
    assigned_: {},
    // The parent draft state.
    parent_: parent,
    // The base state.
    base_: base,
    // The base proxy.
    draft_: null,
    // set below
    // The base copy with any updated values.
    copy_: null,
    // Called by the `produce` function.
    revoke_: null,
    isManual_: false
  };
  let target = state;
  let traps = objectTraps;
  if (isArray2) {
    target = [state];
    traps = arrayTraps;
  }
  const { revoke, proxy } = Proxy.revocable(target, traps);
  state.draft_ = proxy;
  state.revoke_ = revoke;
  return proxy;
}
var objectTraps = {
  get(state, prop) {
    if (prop === DRAFT_STATE)
      return state;
    const source = latest(state);
    if (!has(source, prop)) {
      return readPropFromProto(state, source, prop);
    }
    const value = source[prop];
    if (state.finalized_ || !isDraftable(value)) {
      return value;
    }
    if (value === peek(state.base_, prop)) {
      prepareCopy(state);
      return state.copy_[prop] = createProxy(value, state);
    }
    return value;
  },
  has(state, prop) {
    return prop in latest(state);
  },
  ownKeys(state) {
    return Reflect.ownKeys(latest(state));
  },
  set(state, prop, value) {
    const desc = getDescriptorFromProto(latest(state), prop);
    if (desc?.set) {
      desc.set.call(state.draft_, value);
      return true;
    }
    if (!state.modified_) {
      const current2 = peek(latest(state), prop);
      const currentState = current2?.[DRAFT_STATE];
      if (currentState && currentState.base_ === value) {
        state.copy_[prop] = value;
        state.assigned_[prop] = false;
        return true;
      }
      if (is(value, current2) && (value !== void 0 || has(state.base_, prop)))
        return true;
      prepareCopy(state);
      markChanged(state);
    }
    if (state.copy_[prop] === value && // special case: handle new props with value 'undefined'
    (value !== void 0 || prop in state.copy_) || // special case: NaN
    Number.isNaN(value) && Number.isNaN(state.copy_[prop]))
      return true;
    state.copy_[prop] = value;
    state.assigned_[prop] = true;
    return true;
  },
  deleteProperty(state, prop) {
    if (peek(state.base_, prop) !== void 0 || prop in state.base_) {
      state.assigned_[prop] = false;
      prepareCopy(state);
      markChanged(state);
    } else {
      delete state.assigned_[prop];
    }
    if (state.copy_) {
      delete state.copy_[prop];
    }
    return true;
  },
  // Note: We never coerce `desc.value` into an Immer draft, because we can't make
  // the same guarantee in ES5 mode.
  getOwnPropertyDescriptor(state, prop) {
    const owner = latest(state);
    const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
    if (!desc)
      return desc;
    return {
      writable: true,
      configurable: state.type_ !== 1 || prop !== "length",
      enumerable: desc.enumerable,
      value: owner[prop]
    };
  },
  defineProperty() {
    die(11);
  },
  getPrototypeOf(state) {
    return getPrototypeOf(state.base_);
  },
  setPrototypeOf() {
    die(12);
  }
};
var arrayTraps = {};
each(objectTraps, (key, fn) => {
  arrayTraps[key] = function() {
    arguments[0] = arguments[0][0];
    return fn.apply(this, arguments);
  };
});
arrayTraps.deleteProperty = function(state, prop) {
  if (process.env.NODE_ENV !== "production" && isNaN(parseInt(prop)))
    die(13);
  return arrayTraps.set.call(this, state, prop, void 0);
};
arrayTraps.set = function(state, prop, value) {
  if (process.env.NODE_ENV !== "production" && prop !== "length" && isNaN(parseInt(prop)))
    die(14);
  return objectTraps.set.call(this, state[0], prop, value, state[0]);
};
function peek(draft, prop) {
  const state = draft[DRAFT_STATE];
  const source = state ? latest(state) : draft;
  return source[prop];
}
function readPropFromProto(state, source, prop) {
  const desc = getDescriptorFromProto(source, prop);
  return desc ? `value` in desc ? desc.value : (
    // This is a very special case, if the prop is a getter defined by the
    // prototype, we should invoke it with the draft as context!
    desc.get?.call(state.draft_)
  ) : void 0;
}
function getDescriptorFromProto(source, prop) {
  if (!(prop in source))
    return void 0;
  let proto = getPrototypeOf(source);
  while (proto) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc)
      return desc;
    proto = getPrototypeOf(proto);
  }
  return void 0;
}
function markChanged(state) {
  if (!state.modified_) {
    state.modified_ = true;
    if (state.parent_) {
      markChanged(state.parent_);
    }
  }
}
function prepareCopy(state) {
  if (!state.copy_) {
    state.copy_ = shallowCopy(
      state.base_,
      state.scope_.immer_.useStrictShallowCopy_
    );
  }
}
var Immer2 = class {
  constructor(config) {
    this.autoFreeze_ = true;
    this.useStrictShallowCopy_ = false;
    this.produce = (base, recipe, patchListener) => {
      if (typeof base === "function" && typeof recipe !== "function") {
        const defaultBase = recipe;
        recipe = base;
        const self2 = this;
        return function curriedProduce(base2 = defaultBase, ...args) {
          return self2.produce(base2, (draft) => recipe.call(this, draft, ...args));
        };
      }
      if (typeof recipe !== "function")
        die(6);
      if (patchListener !== void 0 && typeof patchListener !== "function")
        die(7);
      let result;
      if (isDraftable(base)) {
        const scope = enterScope(this);
        const proxy = createProxy(base, void 0);
        let hasError = true;
        try {
          result = recipe(proxy);
          hasError = false;
        } finally {
          if (hasError)
            revokeScope(scope);
          else
            leaveScope(scope);
        }
        usePatchesInScope(scope, patchListener);
        return processResult(result, scope);
      } else if (!base || typeof base !== "object") {
        result = recipe(base);
        if (result === void 0)
          result = base;
        if (result === NOTHING)
          result = void 0;
        if (this.autoFreeze_)
          freeze(result, true);
        if (patchListener) {
          const p = [];
          const ip = [];
          getPlugin("Patches").generateReplacementPatches_(base, result, p, ip);
          patchListener(p, ip);
        }
        return result;
      } else
        die(1, base);
    };
    this.produceWithPatches = (base, recipe) => {
      if (typeof base === "function") {
        return (state, ...args) => this.produceWithPatches(state, (draft) => base(draft, ...args));
      }
      let patches, inversePatches;
      const result = this.produce(base, recipe, (p, ip) => {
        patches = p;
        inversePatches = ip;
      });
      return [result, patches, inversePatches];
    };
    if (typeof config?.autoFreeze === "boolean")
      this.setAutoFreeze(config.autoFreeze);
    if (typeof config?.useStrictShallowCopy === "boolean")
      this.setUseStrictShallowCopy(config.useStrictShallowCopy);
  }
  createDraft(base) {
    if (!isDraftable(base))
      die(8);
    if (isDraft(base))
      base = current(base);
    const scope = enterScope(this);
    const proxy = createProxy(base, void 0);
    proxy[DRAFT_STATE].isManual_ = true;
    leaveScope(scope);
    return proxy;
  }
  finishDraft(draft, patchListener) {
    const state = draft && draft[DRAFT_STATE];
    if (!state || !state.isManual_)
      die(9);
    const { scope_: scope } = state;
    usePatchesInScope(scope, patchListener);
    return processResult(void 0, scope);
  }
  /**
   * Pass true to automatically freeze all copies created by Immer.
   *
   * By default, auto-freezing is enabled.
   */
  setAutoFreeze(value) {
    this.autoFreeze_ = value;
  }
  /**
   * Pass true to enable strict shallow copy.
   *
   * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
   */
  setUseStrictShallowCopy(value) {
    this.useStrictShallowCopy_ = value;
  }
  applyPatches(base, patches) {
    let i;
    for (i = patches.length - 1; i >= 0; i--) {
      const patch = patches[i];
      if (patch.path.length === 0 && patch.op === "replace") {
        base = patch.value;
        break;
      }
    }
    if (i > -1) {
      patches = patches.slice(i + 1);
    }
    const applyPatchesImpl = getPlugin("Patches").applyPatches_;
    if (isDraft(base)) {
      return applyPatchesImpl(base, patches);
    }
    return this.produce(
      base,
      (draft) => applyPatchesImpl(draft, patches)
    );
  }
};
function createProxy(value, parent) {
  const draft = isMap(value) ? getPlugin("MapSet").proxyMap_(value, parent) : isSet(value) ? getPlugin("MapSet").proxySet_(value, parent) : createProxyProxy(value, parent);
  const scope = parent ? parent.scope_ : getCurrentScope();
  scope.drafts_.push(draft);
  return draft;
}
function current(value) {
  if (!isDraft(value))
    die(10, value);
  return currentImpl(value);
}
function currentImpl(value) {
  if (!isDraftable(value) || isFrozen(value))
    return value;
  const state = value[DRAFT_STATE];
  let copy;
  if (state) {
    if (!state.modified_)
      return state.base_;
    state.finalized_ = true;
    copy = shallowCopy(value, state.scope_.immer_.useStrictShallowCopy_);
  } else {
    copy = shallowCopy(value, true);
  }
  each(copy, (key, childValue) => {
    set2(copy, key, currentImpl(childValue));
  });
  if (state) {
    state.finalized_ = false;
  }
  return copy;
}
var immer = new Immer2();
var produce = immer.produce;
var produceWithPatches = immer.produceWithPatches.bind(
  immer
);
var setAutoFreeze = immer.setAutoFreeze.bind(immer);
var setUseStrictShallowCopy = immer.setUseStrictShallowCopy.bind(immer);
var applyPatches = immer.applyPatches.bind(immer);
var createDraft = immer.createDraft.bind(immer);
var finishDraft = immer.finishDraft.bind(immer);

// ../cursorless-engine/src/core/indexArrayStrict.ts
function indexArrayStrict(arr, idx, name) {
  if (idx >= arr.length) {
    throw Error(
      `Expected at least ${idx + 1} ${name} but received only ${arr.length}`
    );
  }
  return arr[idx];
}

// ../cursorless-engine/src/customCommandGrammar/fillPlaceholders.ts
function fillPlaceholders(input, values2) {
  if (Array.isArray(input)) {
    return input.map((item) => fillPlaceholders(item, values2));
  }
  if (typeof input === "object" && input != null) {
    if (isPlaceholder(input)) {
      return indexArrayStrict(values2, input.index, "placeholder value");
    }
    const result = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        result[key] = fillPlaceholders(input[key], values2);
      }
    }
    return result;
  }
  return input;
}
function isPlaceholder(value) {
  return typeof value === "object" && value != null && "type" in value && value.type === "placeholder";
}

// ../cursorless-engine/src/customCommandGrammar/parseCommand.ts
var import_nearley = __toESM(require_nearley(), 1);

// ../cursorless-engine/src/generateSpokenForm/defaultSpokenForms/marks.ts
var hatColors = {
  blue: "blue",
  green: "green",
  red: "red",
  pink: "pink",
  yellow: "yellow",
  userColor1: "navy",
  userColor2: "apricot",
  default: null
};
var hatShapes = {
  ex: "ex",
  fox: "fox",
  wing: "wing",
  hole: "hole",
  frame: "frame",
  curve: "curve",
  eye: "eye",
  play: "play",
  crosshairs: "cross",
  bolt: "bolt",
  default: null
};
var marks = {
  cursor: "this",
  that: "that",
  source: "source",
  nothing: "nothing",
  keyboard: null,
  explicit: null,
  decoratedSymbol: null,
  lineNumber: null,
  range: null,
  target: null
};
var lineDirections = {
  modulo100: "row",
  relativeUp: "up",
  relativeDown: "down"
};
function hatColorToSpokenForm(color) {
  const result = hatColors[color];
  if (result == null) {
    throw Error(`Unknown hat color '${color}'`);
  }
  return result;
}
function hatShapeToSpokenForm(shape) {
  const result = hatShapes[shape];
  if (result == null) {
    throw Error(`Unknown hat shape '${shape}'`);
  }
  return result;
}

// ../cursorless-engine/src/spokenForms/SpokenFormMap.ts
function mapSpokenForms(input, mapper) {
  return Object.fromEntries(
    Object.entries(input).map(([spokenFormType, map3]) => [
      spokenFormType,
      Object.fromEntries(
        Object.entries(map3).map(([id2, inputValue]) => [
          id2,
          mapper(inputValue, spokenFormType, id2)
        ])
      )
    ])
    // FIXME: Don't cast here; need to make our own mapValues with stronger typing
    // using tricks from our object.d.ts
  );
}

// ../cursorless-engine/src/spokenForms/graphemes.ts
var alphabet = Object.fromEntries(
  "air bat cap drum each fine gust harp sit jury crunch look made near odd pit quench red sun trap urge vest whale plex yank zip".split(" ").map((word, index) => [
    String.fromCharCode("a".charCodeAt(0) + index),
    word
  ])
);
var digits = Object.fromEntries(
  "zero one two three four five six seven eight nine".split(" ").map((word, index) => [index.toString(), word])
);
var symbols = {
  ".": "dot",
  ",": "comma",
  ";": "semicolon",
  ":": "colon",
  "!": "bang",
  "*": "asterisk",
  "@": "at sign",
  "&": "ampersand",
  "?": "question",
  "/": "slash",
  "\\": "backslash",
  "-": "dash",
  "=": "equals",
  "+": "plus",
  "~": "tilde",
  _: "underscore",
  "#": "hash",
  "%": "percent",
  "^": "caret",
  "|": "pipe",
  $: "dollar",
  "\xA3": "pound",
  "'": "quote",
  '"': "double quote",
  "`": "back tick",
  "(": "paren",
  ")": "right paren",
  "{": "brace",
  "}": "right brace",
  "[": "square",
  "]": "right square",
  "<": "angle",
  ">": "right angle",
  "\uFFFD": "special"
};
var graphemeDefaultSpokenForms = {
  ...alphabet,
  ...digits,
  ...symbols
};

// ../cursorless-engine/src/spokenForms/spokenFormMapUtil.ts
function isDisabledByDefault(...spokenForms) {
  return {
    defaultSpokenForms: spokenForms,
    isDisabledByDefault: true,
    isPrivate: false
  };
}
function isPrivate(...spokenForms) {
  return {
    defaultSpokenForms: spokenForms,
    isDisabledByDefault: true,
    isPrivate: true
  };
}

// ../cursorless-engine/src/spokenForms/defaultSpokenFormMapCore.ts
var defaultSpokenFormMapCore = {
  pairedDelimiter: {
    curlyBrackets: "curly",
    angleBrackets: "diamond",
    escapedDoubleQuotes: "escaped quad",
    escapedSingleQuotes: "escaped twin",
    escapedParentheses: "escaped round",
    escapedSquareBrackets: "escaped box",
    doubleQuotes: "quad",
    parentheses: "round",
    backtickQuotes: "skis",
    squareBrackets: "box",
    singleQuotes: "twin",
    tripleDoubleQuotes: isPrivate("triple quad"),
    tripleSingleQuotes: isPrivate("triple twin"),
    any: "pair",
    string: "string",
    whitespace: "void",
    collectionBoundary: isPrivate("collection boundary")
  },
  simpleScopeTypeType: {
    argumentOrParameter: "arg",
    attribute: "attribute",
    functionCall: "call",
    functionCallee: "callee",
    className: "class name",
    class: "class",
    comment: "comment",
    functionName: "funk name",
    namedFunction: "funk",
    ifStatement: "if state",
    instance: "instance",
    collectionItem: "item",
    collectionKey: "key",
    anonymousFunction: "lambda",
    list: "list",
    map: "map",
    name: "name",
    regularExpression: "regex",
    section: "section",
    sectionLevelOne: isDisabledByDefault("one section"),
    sectionLevelTwo: isDisabledByDefault("two section"),
    sectionLevelThree: isDisabledByDefault("three section"),
    sectionLevelFour: isDisabledByDefault("four section"),
    sectionLevelFive: isDisabledByDefault("five section"),
    sectionLevelSix: isDisabledByDefault("six section"),
    selector: "selector",
    statement: "state",
    branch: "branch",
    type: "type",
    value: "value",
    condition: "condition",
    unit: "unit",
    //  XML, JSX
    xmlElement: "element",
    xmlBothTags: "tags",
    xmlStartTag: "start tag",
    xmlEndTag: "end tag",
    // LaTeX
    part: "part",
    chapter: "chapter",
    subSection: "subsection",
    subSubSection: "subsubsection",
    namedParagraph: "paragraph",
    subParagraph: "subparagraph",
    environment: "environment",
    // Talon
    command: "command",
    // Text-based scope types
    character: "char",
    word: "sub",
    token: "token",
    identifier: "identifier",
    line: "line",
    sentence: "sentence",
    paragraph: "block",
    boundedParagraph: "short block",
    document: "file",
    nonWhitespaceSequence: "paint",
    boundedNonWhitespaceSequence: "short paint",
    url: "link",
    notebookCell: "cell",
    string: isPrivate("parse tree string"),
    textFragment: isPrivate("text fragment"),
    disqualifyDelimiter: isPrivate("disqualify delimiter"),
    ["private.fieldAccess"]: isPrivate("access"),
    ["private.switchStatementSubject"]: isPrivate("subject")
  },
  complexScopeTypeType: {
    glyph: "glyph"
  },
  surroundingPairForceDirection: {
    left: "left",
    right: "right"
  },
  simpleModifier: {
    excludeInterior: "bounds",
    toRawSelection: "just",
    leading: "leading",
    trailing: "trailing",
    keepContentFilter: "content",
    keepEmptyFilter: "empty",
    inferPreviousMark: "its",
    startOf: "start of",
    endOf: "end of",
    interiorOnly: "inside",
    visible: "visible",
    extendThroughStartOf: "head",
    extendThroughEndOf: "tail",
    everyScope: "every"
  },
  modifierExtra: {
    first: "first",
    last: "last",
    previous: "previous",
    next: "next",
    forward: "forward",
    backward: "backward",
    ancestor: "grand"
  },
  customRegex: {},
  action: {
    breakLine: "break",
    scrollToBottom: "bottom",
    toggleLineBreakpoint: "break point",
    cutToClipboard: "carve",
    scrollToCenter: "center",
    clearAndSetSelection: "change",
    remove: "chuck",
    insertCopyBefore: "clone up",
    insertCopyAfter: "clone",
    toggleLineComment: "comment",
    copyToClipboard: "copy",
    scrollToTop: "crown",
    outdentLine: "dedent",
    revealDefinition: "define",
    editNewLineBefore: "drink",
    insertEmptyLineBefore: "drop",
    extractVariable: "extract",
    insertEmptyLineAfter: "float",
    foldRegion: "fold",
    followLink: "follow",
    followLinkAside: "follow split",
    deselect: "give",
    highlight: "highlight",
    showHover: "hover",
    increment: "increment",
    decrement: "decrement",
    indentLine: "indent",
    showDebugHover: "inspect",
    setSelectionAfter: "post",
    editNewLineAfter: "pour",
    setSelectionBefore: "pre",
    insertEmptyLinesAround: "puff",
    showQuickFix: "quick fix",
    showReferences: "reference",
    rename: "rename",
    reverseTargets: "reverse",
    findInDocument: "scout",
    findInWorkspace: "scout all",
    randomizeTargets: "shuffle",
    generateSnippet: "snippet make",
    sortTargets: "sort",
    setSelection: "take",
    revealTypeDefinition: "type deaf",
    unfoldRegion: "unfold",
    callAsFunction: "call",
    swapTargets: "swap",
    replaceWithTarget: "bring",
    moveToTarget: "move",
    wrapWithPairedDelimiter: "wrap",
    wrapWithSnippet: "wrap",
    rewrapWithPairedDelimiter: "repack",
    insertSnippet: "snippet",
    pasteFromClipboard: "paste",
    joinLines: "join",
    ["private.showParseTree"]: isPrivate("parse tree"),
    ["experimental.setInstanceReference"]: isDisabledByDefault("from"),
    editNew: isPrivate("edit new"),
    executeCommand: isPrivate("execute command"),
    parsed: isPrivate("parsed"),
    getText: isPrivate("get text"),
    replace: isPrivate("replace"),
    ["private.getTargets"]: isPrivate("get targets"),
    ["private.setKeyboardTarget"]: isPrivate("set keyboard target")
    // These actions are implemented talon-side, usually using `getText` followed
    // by some other action.
    // applyFormatter: "format",
    // nextHomophone: "phones",
  },
  customAction: {},
  grapheme: graphemeDefaultSpokenForms
};

// ../cursorless-engine/src/spokenForms/defaultSpokenFormMap.ts
var defaultSpokenFormInfoMap = mapSpokenForms(
  defaultSpokenFormMapCore,
  (value) => typeof value === "string" ? {
    defaultSpokenForms: [value],
    isDisabledByDefault: false,
    isPrivate: false
  } : value
);
var defaultSpokenFormMap = mapSpokenForms(
  defaultSpokenFormInfoMap,
  ({ defaultSpokenForms, isDisabledByDefault: isDisabledByDefault2, isPrivate: isPrivate2 }) => ({
    spokenForms: isDisabledByDefault2 ? [] : defaultSpokenForms,
    isCustom: false,
    defaultSpokenForms,
    requiresTalonUpdate: false,
    isPrivate: isPrivate2
  })
);

// ../cursorless-engine/src/generateSpokenForm/defaultSpokenForms/connectives.ts
var connectives = {
  rangeExclusive: "between",
  rangeInclusive: "past",
  // Note: rangeExcludingStart has no default spoken form
  rangeExcludingStart: null,
  rangeExcludingEnd: "until",
  listConnective: "and",
  swapConnective: "with",
  sourceDestinationConnective: "to",
  before: "before",
  after: "after",
  verticalRange: "slice",
  previous: "previous",
  next: "next",
  forward: "forward",
  backward: "backward"
};

// ../cursorless-engine/src/customCommandGrammar/CommandLexer.ts
var import_moo = __toESM(require_moo(), 1);
var CommandLexer = class {
  constructor(rules) {
    this.mooLexer = import_moo.default.compile(rules);
  }
  reset(chunk, state) {
    const { mooState } = state ?? {};
    this.mooLexer.reset(chunk, mooState);
    return this;
  }
  formatError(token, message) {
    return this.mooLexer.formatError(token, message);
  }
  has(tokenType) {
    return this.mooLexer.has(tokenType);
  }
  save() {
    return {
      mooState: this.mooLexer.save()
    };
  }
  next() {
    const token = this.mooLexer.next();
    if (this.skipToken(token)) {
      return this.next();
    }
    return token;
  }
  transform({ value }) {
    return value;
  }
  skipToken(token) {
    return token?.type === "ws";
  }
};

// ../cursorless-engine/src/customCommandGrammar/lexer.ts
var tokens = {};
for (const simpleActionName2 of simpleActionNames) {
  const { spokenForms } = defaultSpokenFormMap.action[simpleActionName2];
  for (const spokenForm of spokenForms) {
    tokens[spokenForm] = {
      type: "simpleActionName",
      value: simpleActionName2
    };
  }
}
var bringMoveActionNames = [
  "replaceWithTarget",
  "moveToTarget"
];
for (const bringMoveActionName of bringMoveActionNames) {
  const { spokenForms } = defaultSpokenFormMap.action[bringMoveActionName];
  for (const spokenForm of spokenForms) {
    tokens[spokenForm] = {
      type: "bringMove",
      value: bringMoveActionName
    };
  }
}
var insertionModes = ["before", "after", "to"];
for (const insertionMode2 of insertionModes) {
  const spokenForm = connectives[insertionMode2 === "to" ? "sourceDestinationConnective" : insertionMode2];
  tokens[spokenForm] = {
    type: "insertionMode",
    value: insertionMode2
  };
}
for (const simpleScopeTypeType2 of simpleScopeTypeTypes) {
  const { spokenForms } = defaultSpokenFormMap.simpleScopeTypeType[simpleScopeTypeType2];
  for (const spokenForm of spokenForms) {
    tokens[spokenForm] = {
      type: "simpleScopeTypeType",
      value: simpleScopeTypeType2
    };
  }
}
for (const pairedDelimiter2 of surroundingPairNames) {
  const { spokenForms } = defaultSpokenFormMap.pairedDelimiter[pairedDelimiter2];
  for (const spokenForm of spokenForms) {
    tokens[spokenForm] = {
      type: "pairedDelimiter",
      value: pairedDelimiter2
    };
  }
}
for (const [mark, spokenForm] of Object.entries(marks)) {
  if (spokenForm != null) {
    tokens[spokenForm] = {
      type: "simpleMarkType",
      value: mark
    };
  }
}
var lexer = new CommandLexer({
  ws: /[ \t]+/,
  placeholderTarget: {
    match: /<target\d*>/,
    value: (text) => text.slice(7, -1)
  },
  token: {
    match: Object.keys(tokens),
    type: (text) => tokens[text].type,
    value: (text) => tokens[text].value
  }
});

// ../cursorless-engine/src/customCommandGrammar/grammarUtil.ts
function simpleActionDescriptor(name, target) {
  return { name, target };
}
function bringMoveActionDescriptor(name, source, destination) {
  return { name, source, destination };
}
function partialPrimitiveTargetDescriptor(modifiers, mark) {
  const target = {
    type: "primitive"
  };
  if (modifiers != null) {
    target.modifiers = modifiers;
  }
  if (mark != null) {
    target.mark = mark;
  }
  return target;
}
function primitiveDestinationDescriptor(insertionMode2, target) {
  return { type: "primitive", insertionMode: insertionMode2, target };
}
function containingScopeModifier(scopeType) {
  return {
    type: "containingScope",
    scopeType
  };
}
function simpleScopeType(type2) {
  return { type: type2 };
}
function surroundingPairScopeType(delimiter) {
  return { type: "surroundingPair", delimiter };
}
function simplePartialMark(type2) {
  return { type: type2 };
}
function createPlaceholderTarget(index) {
  return {
    type: "target",
    target: {
      type: "placeholder",
      index: index.length === 0 ? 0 : parseInt(index) - 1
    }
  };
}

// ../cursorless-engine/src/customCommandGrammar/generated/grammar.ts
function id(d) {
  return d[0];
}
var grammar = {
  Lexer: lexer,
  ParserRules: [
    { "name": "main", "symbols": ["action"], "postprocess": id },
    {
      "name": "action",
      "symbols": [lexer.has("simpleActionName") ? { type: "simpleActionName" } : simpleActionName, "target"],
      "postprocess": ([simpleActionName2, target]) => simpleActionDescriptor(simpleActionName2, target)
    },
    {
      "name": "action",
      "symbols": [lexer.has("bringMove") ? { type: "bringMove" } : bringMove, "target", "destination"],
      "postprocess": ([bringMove2, target, destination]) => bringMoveActionDescriptor(bringMove2, target, destination)
    },
    { "name": "destination", "symbols": ["primitiveDestination"], "postprocess": id },
    {
      "name": "destination",
      "symbols": [lexer.has("insertionMode") ? { type: "insertionMode" } : insertionMode, "target"],
      "postprocess": ([insertionMode2, target]) => primitiveDestinationDescriptor(insertionMode2, target)
    },
    { "name": "target", "symbols": ["primitiveTarget"], "postprocess": id },
    { "name": "primitiveTarget$ebnf$1", "symbols": ["modifier"] },
    { "name": "primitiveTarget$ebnf$1", "symbols": ["primitiveTarget$ebnf$1", "modifier"], "postprocess": (d) => d[0].concat([d[1]]) },
    {
      "name": "primitiveTarget",
      "symbols": ["primitiveTarget$ebnf$1"],
      "postprocess": ([modifiers]) => partialPrimitiveTargetDescriptor(modifiers, void 0)
    },
    {
      "name": "primitiveTarget",
      "symbols": ["mark"],
      "postprocess": ([mark]) => partialPrimitiveTargetDescriptor(void 0, mark)
    },
    { "name": "primitiveTarget$ebnf$2", "symbols": ["modifier"] },
    { "name": "primitiveTarget$ebnf$2", "symbols": ["primitiveTarget$ebnf$2", "modifier"], "postprocess": (d) => d[0].concat([d[1]]) },
    {
      "name": "primitiveTarget",
      "symbols": ["primitiveTarget$ebnf$2", "mark"],
      "postprocess": ([modifiers, mark]) => partialPrimitiveTargetDescriptor(modifiers, mark)
    },
    {
      "name": "modifier",
      "symbols": ["containingScopeModifier"],
      "postprocess": ([containingScopeModifier2]) => containingScopeModifier2
    },
    {
      "name": "containingScopeModifier",
      "symbols": ["scopeType"],
      "postprocess": ([scopeType]) => containingScopeModifier(scopeType)
    },
    {
      "name": "scopeType",
      "symbols": [lexer.has("simpleScopeTypeType") ? { type: "simpleScopeTypeType" } : simpleScopeTypeType],
      "postprocess": ([simpleScopeTypeType2]) => simpleScopeType(simpleScopeTypeType2)
    },
    {
      "name": "scopeType",
      "symbols": [lexer.has("pairedDelimiter") ? { type: "pairedDelimiter" } : pairedDelimiter],
      "postprocess": ([delimiter]) => surroundingPairScopeType(delimiter)
    },
    {
      "name": "mark",
      "symbols": [lexer.has("simpleMarkType") ? { type: "simpleMarkType" } : simpleMarkType],
      "postprocess": ([simpleMarkType2]) => simplePartialMark(simpleMarkType2)
    },
    {
      "name": "mark",
      "symbols": [lexer.has("placeholderTarget") ? { type: "placeholderTarget" } : placeholderTarget],
      "postprocess": ([placeholderTarget2]) => createPlaceholderTarget(placeholderTarget2)
    }
  ],
  ParserStart: "main"
};
var grammar_default = grammar;

// ../cursorless-engine/src/customCommandGrammar/parseCommand.ts
function getActionParser() {
  return new import_nearley.Parser(import_nearley.Grammar.fromCompiled(grammar_default));
}
function parseAction(input) {
  const parser = getActionParser();
  parser.feed(input);
  if (parser.results.length !== 1) {
    throw new Error(
      `Expected exactly one result, got ${parser.results.length}`
    );
  }
  return parser.results[0];
}

// ../cursorless-engine/src/customCommandGrammar/parseAndFillOutAction.ts
function parseAndFillOutAction(content, args) {
  const parsed = parseAction(content);
  return fillPlaceholders(parsed, args);
}

// ../cursorless-engine/src/util/getPartialTargetDescriptors.ts
function getPartialTargetDescriptors(action) {
  switch (action.name) {
    case "callAsFunction":
      return [action.callee, action.argument];
    case "replaceWithTarget":
    case "moveToTarget":
      return [
        action.source,
        ...getPartialTargetDescriptorsFromDestination(action.destination)
      ];
    case "swapTargets":
      return [action.target1, action.target2];
    case "pasteFromClipboard":
    case "insertSnippet":
    case "replace":
    case "editNew":
      return getPartialTargetDescriptorsFromDestination(action.destination);
    case "parsed":
      return getPartialTargetDescriptors(
        parseAndFillOutAction(action.content, action.arguments)
      );
    default:
      return [action.target];
  }
}
function getPartialTargetDescriptorsFromDestination(destination) {
  switch (destination.type) {
    case "list":
      return destination.destinations.map(({ target }) => target);
    case "primitive":
      return [destination.target];
    case "implicit":
      return [];
  }
}

// ../cursorless-engine/src/util/getPrimitiveTargets.ts
function getPartialPrimitiveTargets(targets) {
  return targets.flatMap(getPartialPrimitiveTargetsHelper);
}
function getPartialPrimitiveTargetsHelper(target) {
  switch (target.type) {
    case "primitive":
      return [target];
    case "list":
      return target.elements.flatMap(getPartialPrimitiveTargetsHelper);
    case "range":
      return [target.anchor, target.active].flatMap(
        getPartialPrimitiveTargetsHelper
      );
    case "implicit":
      return [];
  }
}

// ../cursorless-engine/src/core/commandVersionUpgrades/canonicalizeTargetsInPlace.ts
var SCOPE_TYPE_CANONICALIZATION_MAPPING = {
  arrowFunction: "anonymousFunction",
  dictionary: "map",
  regex: "regularExpression"
};
var COLOR_CANONICALIZATION_MAPPING = {
  purple: "pink"
};
function canonicalizeScopeTypesInPlace(target) {
  target.modifiers?.forEach((mod) => {
    if (mod.type === "containingScope" || mod.type === "everyScope") {
      mod.scopeType.type = SCOPE_TYPE_CANONICALIZATION_MAPPING[mod.scopeType.type] ?? mod.scopeType.type;
    }
  });
}
function canonicalizeColorsInPlace(target) {
  if (target.mark?.type === "decoratedSymbol") {
    target.mark.symbolColor = COLOR_CANONICALIZATION_MAPPING[target.mark.symbolColor] ?? target.mark.symbolColor;
  }
}
function canonicalizeTargetsInPlace(partialTargets) {
  getPartialPrimitiveTargets(partialTargets).forEach((target) => {
    canonicalizeScopeTypesInPlace(target);
    canonicalizeColorsInPlace(target);
  });
}

// ../cursorless-engine/src/core/commandVersionUpgrades/upgradeV0ToV1/upgradeV0ToV1.ts
function upgradeV0ToV1(command) {
  return { ...command, version: 1 };
}

// ../cursorless-engine/src/core/commandVersionUpgrades/upgradeV1ToV2/upgradeStrictHere.ts
var STRICT_HERE = {
  type: "primitive",
  mark: { type: "cursor" },
  selectionType: "token",
  position: "contents",
  modifier: { type: "identity" },
  insideOutsideType: "inside"
};
var IMPLICIT_TARGET = {
  type: "primitive",
  isImplicit: true
};
var upgradeStrictHere = (target) => isEqual_default(target, STRICT_HERE) ? IMPLICIT_TARGET : target;

// ../cursorless-engine/src/core/commandVersionUpgrades/upgradeV1ToV2/upgradeV1ToV2.ts
function upgradeV1ToV2(command) {
  const actionName = command.action;
  return {
    spokenForm: command.spokenForm,
    action: {
      name: actionName,
      args: command.extraArgs
    },
    targets: upgradeTargets(command.targets, actionName),
    usePrePhraseSnapshot: command.usePrePhraseSnapshot ?? false,
    version: 2
  };
}
function upgradeModifier(modifier) {
  switch (modifier.type) {
    case "identity":
      return [];
    case "containingScope": {
      const { includeSiblings, scopeType, type: type2, ...rest } = modifier;
      return [
        {
          type: includeSiblings ? "everyScope" : "containingScope",
          scopeType: {
            type: scopeType
          },
          ...rest
        }
      ];
    }
    case "surroundingPair": {
      const { delimiterInclusion, ...rest } = modifier;
      const surroundingPairModifier = {
        type: "containingScope",
        scopeType: rest
      };
      if (delimiterInclusion === "interiorOnly" || delimiterInclusion === "excludeInterior") {
        if (surroundingPairModifier.scopeType.delimiter === "any") {
          return [{ type: delimiterInclusion }];
        }
        return [{ type: delimiterInclusion }, surroundingPairModifier];
      }
      return [surroundingPairModifier];
    }
    case "subpiece": {
      const { type: type2, pieceType, ...rest } = modifier;
      return [
        {
          type: "ordinalRange",
          scopeType: { type: pieceType },
          ...rest
        }
      ];
    }
    case "head":
      return [{ type: "extendThroughStartOf" }];
    case "tail":
      return [{ type: "extendThroughEndOf" }];
    default:
      return [modifier];
  }
}
function upgradePrimitiveTarget(target, action) {
  const {
    type: type2,
    isImplicit,
    mark,
    insideOutsideType,
    modifier,
    selectionType,
    position
  } = target;
  const modifiers = [];
  if (position && position !== "contents") {
    if (position === "before") {
      if (insideOutsideType === "inside") {
        modifiers.push({ type: "position", position: "start" });
      } else if (action === "remove") {
        modifiers.push({ type: "leading" });
      } else {
        modifiers.push({ type: "position", position: "before" });
      }
    } else {
      if (insideOutsideType === "inside") {
        modifiers.push({ type: "position", position: "end" });
      } else if (action === "remove") {
        modifiers.push({ type: "trailing" });
      } else {
        modifiers.push({ type: "position", position: "after" });
      }
    }
  }
  if (selectionType) {
    switch (selectionType) {
      case "token":
        if (modifier?.type === "subpiece") {
          break;
        }
      // fallthrough
      case "line":
        if (mark?.type === "lineNumber") {
          break;
        }
      // fallthrough
      default:
        modifiers.push({
          type: "containingScope",
          scopeType: { type: selectionType }
        });
    }
  }
  if (modifier) {
    modifiers.push(...upgradeModifier(modifier));
  }
  return {
    type: type2,
    isImplicit,
    // Empty array of modifiers is not allowed
    modifiers: modifiers.length > 0 ? modifiers : void 0,
    // Cursor token is just cursor position but treated as a token. This is done in the pipeline for normal cursor now
    mark: mark?.type === "cursorToken" ? void 0 : mark
  };
}
function upgradeTarget(target, action) {
  switch (target.type) {
    case "list":
      return {
        ...target,
        elements: target.elements.map(
          (target2) => upgradeTarget(target2, action)
        )
      };
    case "range": {
      const { type: type2, rangeType, start, end, excludeStart, excludeEnd } = target;
      return {
        type: type2,
        rangeType,
        anchor: upgradePrimitiveTarget(start, action),
        active: upgradePrimitiveTarget(end, action),
        excludeAnchor: excludeStart ?? false,
        excludeActive: excludeEnd ?? false
      };
    }
    case "primitive":
      return upgradePrimitiveTarget(target, action);
  }
}
function upgradeTargets(partialTargets, action) {
  return partialTargets.map((target) => upgradeTarget(target, action)).map(
    (target) => target.type === "primitive" ? upgradeStrictHere(target) : target
  );
}

// ../cursorless-engine/src/core/commandVersionUpgrades/upgradeV2ToV3/upgradeV2ToV3.ts
function upgradeV2ToV3(command) {
  return {
    ...command,
    version: 3,
    targets: command.targets.map(upgradeTarget2)
  };
}
function upgradeTarget2(target) {
  switch (target.type) {
    case "list":
      return {
        ...target,
        elements: target.elements.map(
          (target2) => upgradeTarget2(target2)
        )
      };
    case "range": {
      const { anchor, active, ...rest } = target;
      return {
        anchor: upgradePrimitiveTarget2(
          anchor
        ),
        active: upgradePrimitiveTarget2(
          active
        ),
        ...rest
      };
    }
    case "primitive":
      return upgradePrimitiveTarget2(target);
  }
}
function upgradePrimitiveTarget2(target) {
  const modifiers = target.modifiers != null ? target.modifiers.map(updateModifier) : void 0;
  if (target.mark?.type === "lineNumber") {
    const { anchor, active } = target.mark;
    if (anchor.type !== active.type || anchor.lineNumber < 0 !== active.lineNumber < 0) {
      return {
        type: "range",
        anchor: {
          type: "primitive",
          mark: createLineNumberMarkFromPos(anchor),
          modifiers
        },
        active: {
          type: "primitive",
          mark: createLineNumberMarkFromPos(active)
        },
        excludeAnchor: false,
        excludeActive: false
      };
    }
  }
  return {
    ...target,
    mark: target.mark != null ? updateMark(target.mark) : void 0,
    modifiers
  };
}
function updateMark(mark) {
  switch (mark.type) {
    case "lineNumber":
      return createLineNumberMark(mark);
    default:
      return mark;
  }
}
function updateModifier(modifier) {
  switch (modifier.type) {
    case "ordinalRange":
      return createOrdinalModifier(modifier);
    default:
      return modifier;
  }
}
function createLineNumberMark(mark) {
  if (isEqual_default(mark.anchor, mark.active)) {
    return createLineNumberMarkFromPos(mark.anchor);
  }
  return {
    type: "range",
    anchor: createLineNumberMarkFromPos(mark.anchor),
    active: createLineNumberMarkFromPos(mark.active)
  };
}
function createOrdinalModifier(modifier) {
  if (modifier.anchor === modifier.active) {
    return createAbsoluteOrdinalModifier(modifier.scopeType, modifier.anchor);
  }
  if (modifier.anchor === 0 && modifier.active > modifier.anchor) {
    return createAbsoluteOrdinalModifier(
      modifier.scopeType,
      modifier.anchor,
      modifier.active - modifier.anchor + 1
    );
  }
  if (modifier.anchor < 0 && modifier.active === -1) {
    return createAbsoluteOrdinalModifier(
      modifier.scopeType,
      modifier.anchor,
      -modifier.anchor
    );
  }
  return {
    type: "range",
    anchor: createAbsoluteOrdinalModifier(modifier.scopeType, modifier.anchor),
    active: createAbsoluteOrdinalModifier(modifier.scopeType, modifier.active),
    excludeAnchor: modifier.excludeAnchor,
    excludeActive: modifier.excludeActive
  };
}
function createLineNumberMarkFromPos(position) {
  return {
    type: "lineNumber",
    lineNumberType: position.type,
    lineNumber: position.lineNumber
  };
}
function createAbsoluteOrdinalModifier(scopeType, start, length = 1) {
  return {
    type: "ordinalScope",
    scopeType,
    start,
    length
  };
}

// ../cursorless-engine/src/core/commandVersionUpgrades/upgradeV3ToV4/upgradeV3ToV4.ts
function upgradeV3ToV4(command) {
  return {
    ...command,
    version: 4,
    targets: command.targets.map(upgradeTarget3)
  };
}
function upgradeTarget3(target) {
  switch (target.type) {
    case "primitive":
      return upgradePrimitiveTarget3(target);
    case "range": {
      const { anchor, ...rest } = target;
      return {
        ...rest,
        anchor: upgradePrimitiveTarget3(anchor)
      };
    }
    case "list": {
      const { elements, ...rest } = target;
      return {
        ...rest,
        elements: elements.map(upgradeTarget3)
      };
    }
  }
}
function upgradePrimitiveTarget3(target) {
  if (target.mark == null && target.modifiers == null || target.isImplicit) {
    return { type: "implicit" };
  }
  return target;
}

// ../cursorless-engine/src/core/commandVersionUpgrades/upgradeV4ToV5/upgradeV4ToV5.ts
function upgradeV4ToV5(command) {
  return {
    ...command,
    version: 5,
    action: upgradeAction(command.action),
    targets: command.targets.map(upgradeTarget4)
  };
}
function upgradeAction(action) {
  switch (action.name) {
    case "wrapWithSnippet": {
      const [name, variableName] = parseSnippetLocation(
        action.args[0]
      );
      return {
        name: "wrapWithSnippet",
        args: [
          {
            type: "named",
            name,
            variableName
          }
        ]
      };
    }
    case "insertSnippet": {
      const [name, substitutions] = action.args;
      const snippetDescription = {
        type: "named",
        name
      };
      if (substitutions != null) {
        snippetDescription.substitutions = substitutions;
      }
      return {
        name: "insertSnippet",
        args: [snippetDescription]
      };
    }
    default:
      return action;
  }
}
function parseSnippetLocation(snippetLocation) {
  const [snippetName, placeholderName] = snippetLocation.split(".");
  if (snippetName == null || placeholderName == null) {
    throw new Error("Snippet location missing '.'");
  }
  return [snippetName, placeholderName];
}
function upgradeTarget4(target) {
  switch (target.type) {
    case "implicit":
      return target;
    case "list":
      return {
        ...target,
        elements: target.elements.map(
          upgradeTarget4
        )
      };
    case "range":
      return {
        ...target,
        anchor: upgradeTarget4(
          target.anchor
        ),
        active: upgradeTarget4(
          target.active
        )
      };
    case "primitive":
      return {
        ...target,
        mark: target.mark != null ? upgradeMark(target.mark) : void 0,
        modifiers: target.modifiers != null && target.modifiers.length > 0 ? target.modifiers.map(upgradeModifier2) : void 0
      };
  }
}
function upgradeMark(mark) {
  if (mark.type === "range") {
    return {
      ...mark,
      anchor: upgradeMark(mark.anchor),
      active: upgradeMark(mark.active),
      excludeAnchor: mark.excludeAnchor ?? false,
      excludeActive: mark.excludeActive ?? false
    };
  }
  return mark;
}
function upgradeModifier2(modifier) {
  if (modifier.type === "range") {
    return {
      ...modifier,
      anchor: upgradeModifier2(modifier.anchor),
      active: upgradeModifier2(modifier.active),
      excludeAnchor: modifier.excludeAnchor ?? false,
      excludeActive: modifier.excludeActive ?? false
    };
  }
  return modifier;
}

// ../cursorless-engine/src/core/commandVersionUpgrades/upgradeV5ToV6/canonicalizeActionName.ts
var actionAliasToCanonicalName = {
  bring: "replaceWithTarget",
  call: "callAsFunction",
  clear: "clearAndSetSelection",
  commentLines: "toggleLineComment",
  copy: "copyToClipboard",
  cut: "cutToClipboard",
  delete: "remove",
  editNewLineAbove: "editNewLineBefore",
  editNewLineBelow: "editNewLineAfter",
  findInFiles: "findInWorkspace",
  fold: "foldRegion",
  indentLines: "indentLine",
  insertEmptyLineAbove: "insertEmptyLineBefore",
  insertEmptyLineBelow: "insertEmptyLineAfter",
  insertLineAfter: "editNewLineAfter",
  insertLineBefore: "editNewLineBefore",
  move: "moveToTarget",
  outdentLines: "outdentLine",
  paste: "pasteFromClipboard",
  reverse: "reverseTargets",
  setBreakpoint: "toggleLineBreakpoint",
  sort: "sortTargets",
  swap: "swapTargets",
  unfold: "unfoldRegion",
  use: "replaceWithTarget",
  wrap: "wrapWithPairedDelimiter"
};
function canonicalizeActionName(actionName) {
  const canonicalName = actionAliasToCanonicalName[actionName] ?? actionName;
  if (!actionNames.includes(canonicalName)) {
    throw new Error(`Unknown action name: ${canonicalName}`);
  }
  return canonicalName;
}

// ../cursorless-engine/src/core/commandVersionUpgrades/upgradeV5ToV6/upgradeV5ToV6.ts
function upgradeV5ToV6(command) {
  return {
    version: 6,
    spokenForm: command.spokenForm,
    usePrePhraseSnapshot: command.usePrePhraseSnapshot,
    action: upgradeAction2(command.action, command.targets)
  };
}
function upgradeAction2(action, targets) {
  const name = canonicalizeActionName(action.name);
  switch (name) {
    case "replaceWithTarget":
    case "moveToTarget":
      return {
        name,
        source: upgradeTarget5(targets[0]),
        destination: targetToDestination(targets[1])
      };
    case "swapTargets":
      return {
        name,
        target1: upgradeTarget5(targets[0]),
        target2: upgradeTarget5(targets[1])
      };
    case "callAsFunction":
      return {
        name,
        callee: upgradeTarget5(targets[0]),
        argument: upgradeTarget5(targets[1])
      };
    case "pasteFromClipboard":
      return {
        name,
        destination: targetToDestination(targets[0])
      };
    case "wrapWithPairedDelimiter":
    case "rewrapWithPairedDelimiter":
      return {
        name,
        left: action.args[0],
        right: action.args[1],
        target: upgradeTarget5(targets[0])
      };
    case "generateSnippet":
      return {
        name,
        snippetName: action.args?.[0],
        target: upgradeTarget5(targets[0])
      };
    case "insertSnippet":
      return {
        name,
        snippetDescription: action.args[0],
        destination: targetToDestination(targets[0])
      };
    case "wrapWithSnippet":
      return {
        name,
        snippetDescription: action.args[0],
        target: upgradeTarget5(targets[0])
      };
    case "executeCommand":
      return {
        name,
        commandId: action.args[0],
        options: action.args?.[1],
        target: upgradeTarget5(targets[0])
      };
    case "replace":
      return {
        name,
        replaceWith: action.args[0],
        destination: targetToDestination(targets[0])
      };
    case "highlight": {
      const result = {
        name,
        target: upgradeTarget5(targets[0])
      };
      if (action.args?.[0] != null) {
        result.highlightId = action.args?.[0];
      }
      return result;
    }
    case "editNew":
      return {
        name,
        destination: targetToDestination(targets[0])
      };
    case "getText":
      return {
        name,
        options: action.args?.[0],
        target: upgradeTarget5(targets[0])
      };
    case "parsed":
      throw Error("Parsed action should not be present in V5");
    default:
      return {
        name,
        target: upgradeTarget5(targets[0])
      };
  }
}
function upgradeTarget5(target) {
  switch (target.type) {
    case "list":
    case "range":
    case "primitive":
      return upgradeNonImplicitTarget(target);
    case "implicit":
      return target;
  }
}
function upgradeNonImplicitTarget(target) {
  switch (target.type) {
    case "list":
      return upgradeListTarget(target);
    case "range":
    case "primitive":
      return upgradeRangeOrPrimitiveTarget(target);
  }
}
function upgradeListTarget(target) {
  return {
    ...target,
    elements: target.elements.map(upgradeRangeOrPrimitiveTarget)
  };
}
function upgradeRangeOrPrimitiveTarget(target) {
  switch (target.type) {
    case "range":
      return upgradeRangeTarget(target);
    case "primitive":
      return upgradePrimitiveTarget4(target);
  }
}
function upgradeRangeTarget(target) {
  const { anchor, active } = target;
  const result = {
    type: "range",
    anchor: anchor.type === "implicit" ? anchor : upgradePrimitiveTarget4(anchor),
    active: upgradePrimitiveTarget4(active),
    excludeAnchor: target.excludeAnchor,
    excludeActive: target.excludeActive
  };
  if (target.rangeType != null) {
    result.rangeType = target.rangeType;
  }
  return result;
}
function upgradePrimitiveTarget4(target) {
  const result = {
    type: "primitive"
  };
  const modifiers = upgradeModifiers(target.modifiers);
  if (modifiers != null) {
    result.modifiers = modifiers;
  }
  if (target.mark != null) {
    result.mark = target.mark;
  }
  return result;
}
function targetToDestination(target) {
  switch (target.type) {
    case "list":
      return listTargetToDestination(target);
    case "range":
      return rangeTargetToDestination(target);
    case "primitive":
      return primitiveTargetToDestination(target);
    case "implicit":
      return implicitTargetToDestination();
  }
}
function listTargetToDestination(target) {
  const destinations = [];
  let currentElements = [];
  let currentInsertionMode = void 0;
  const potentiallyAddDestination = () => {
    if (currentElements.length > 0) {
      destinations.push({
        type: "primitive",
        insertionMode: currentInsertionMode ?? "to",
        target: currentElements.length === 1 ? currentElements[0] : {
          type: "list",
          elements: currentElements
        }
      });
    }
  };
  target.elements.forEach((element) => {
    const insertionMode2 = getInsertionMode(element);
    if (insertionMode2 != null) {
      potentiallyAddDestination();
      currentElements = [upgradeRangeOrPrimitiveTarget(element)];
      currentInsertionMode = insertionMode2;
    } else {
      currentElements.push(upgradeRangeOrPrimitiveTarget(element));
    }
  });
  potentiallyAddDestination();
  if (destinations.length > 1) {
    return {
      type: "list",
      destinations
    };
  }
  return destinations[0];
}
function rangeTargetToDestination(target) {
  return {
    type: "primitive",
    insertionMode: getInsertionMode(target.anchor) ?? "to",
    target: upgradeRangeTarget(target)
  };
}
function primitiveTargetToDestination(target) {
  return {
    type: "primitive",
    insertionMode: getInsertionMode(target) ?? "to",
    target: upgradePrimitiveTarget4(target)
  };
}
function implicitTargetToDestination() {
  return { type: "implicit" };
}
function getInsertionMode(target) {
  switch (target.type) {
    case "implicit":
      return "to";
    case "primitive":
      return getInsertionModeFromPrimitive(target);
    case "range":
      return getInsertionMode(target.anchor);
  }
}
function getInsertionModeFromPrimitive(target) {
  const positionModifier = target.modifiers?.find(
    (m) => m.type === "position"
  );
  if (positionModifier != null) {
    if (target.modifiers.indexOf(positionModifier) !== 0) {
      throw Error("Position modifier has to be at first index");
    }
    if (positionModifier?.position === "before" || positionModifier?.position === "after") {
      return positionModifier.position;
    }
  }
  return void 0;
}
function upgradeModifiers(modifiers) {
  const result = [];
  if (modifiers != null) {
    for (const modifier of modifiers) {
      if (modifier.type === "position") {
        if (modifier.position === "start") {
          result.push({ type: "startOf" });
        } else if (modifier.position === "end") {
          result.push({ type: "endOf" });
        }
      } else {
        result.push(modifier);
      }
    }
  }
  return result.length > 0 ? result : void 0;
}

// ../cursorless-engine/src/core/commandVersionUpgrades/upgradeV6ToV7.ts
function upgradeV6ToV7(command) {
  return { ...command, version: 7 };
}

// ../cursorless-engine/src/core/commandVersionUpgrades/canonicalizeAndValidateCommand.ts
function canonicalizeAndValidateCommand(command) {
  const commandUpgraded = upgradeCommand(command, LATEST_VERSION);
  const { action, usePrePhraseSnapshot = false, spokenForm } = commandUpgraded;
  return {
    version: LATEST_VERSION,
    spokenForm,
    action: produce(action, (draft) => {
      const partialTargets = getPartialTargetDescriptors(draft);
      canonicalizeTargetsInPlace(partialTargets);
      validateCommand(action.name, partialTargets);
    }),
    usePrePhraseSnapshot
  };
}
function upgradeCommand(command, minimumVersion) {
  if (command.version > LATEST_VERSION) {
    throw new OutdatedExtensionError();
  }
  while (command.version < minimumVersion) {
    switch (command.version) {
      case 0:
        command = upgradeV0ToV1(command);
        break;
      case 1:
        command = upgradeV1ToV2(command);
        break;
      case 2:
        command = upgradeV2ToV3(command);
        break;
      case 3:
        command = upgradeV3ToV4(command);
        break;
      case 4:
        command = upgradeV4ToV5(command);
        break;
      case 5:
        command = upgradeV5ToV6(command);
        break;
      case 6:
        command = upgradeV6ToV7(command);
        break;
      default:
        throw new Error(
          `Can't upgrade from unknown version ${command.version}`
        );
    }
  }
  return command;
}
function validateCommand(_actionName, _partialTargets) {
}

// ../cursorless-engine/src/singletons/ide.singleton.ts
var ide_;
function injectIde(ide2) {
  ide_ = ide2;
}
function ide() {
  if (ide_ == null) {
    throw Error("Tried to access ide before it was injected");
  }
  return ide_;
}

// ../cursorless-engine/src/core/UndoStack.ts
var UndoStack = class {
  constructor(maxLength) {
    this.maxLength = maxLength;
    this.stack = [];
    this.index = void 0;
  }
  /**
   * Push a new state onto the stack. If {@link undo} has been called, the
   * future states will be dropped and the new state will be pushed onto the
   * stack.
   *
   * @param item The new state to push onto the stack
   */
  push(item) {
    if (this.index != null) {
      this.stack.splice(
        this.index + 1,
        this.stack.length - this.index - 1,
        item
      );
    } else {
      this.stack.push(item);
    }
    if (this.stack.length > this.maxLength) {
      this.stack.shift();
    }
    this.index = this.stack.length - 1;
  }
  /**
   * Undo to the previous state.
   *
   * @returns The previous state, or `undefined` if there are no previous states
   */
  undo() {
    if (this.index != null && this.index > 0) {
      this.index--;
      return this.stack[this.index];
    }
    return void 0;
  }
  /**
   * Redo to the next state.
   *
   * @returns The next state, or `undefined` if there are no future states
   */
  redo() {
    if (this.index != null && this.index < this.stack.length - 1) {
      this.index++;
      return this.stack[this.index];
    }
    return void 0;
  }
};

// ../cursorless-engine/src/core/StoredTargets.ts
var MAX_HISTORY_LENGTH = 25;
var StoredTargetMap = class {
  constructor() {
    this.targetMap = /* @__PURE__ */ new Map();
    // FIXME: Keep these targets up to date as document changes
    this.targetHistory = new DefaultMap(() => new UndoStack(MAX_HISTORY_LENGTH));
    this.notifier = new Notifier();
  }
  set(key, targets, { history = false } = {}) {
    this.targetMap.set(key, targets);
    if (history && targets != null) {
      this.targetHistory.get(key).push(targets);
    }
    this.notifier.notifyListeners(key, targets);
  }
  get(key) {
    return this.targetMap.get(key);
  }
  undo(key) {
    const targets = this.targetHistory.get(key).undo();
    if (targets != null) {
      this.set(key, targets, { history: false });
    }
  }
  redo(key) {
    const targets = this.targetHistory.get(key).redo();
    if (targets != null) {
      this.set(key, targets, { history: false });
    }
  }
  onStoredTargets(callback2) {
    for (const key of storedTargetKeys) {
      callback2(key, this.get(key));
    }
    return this.notifier.registerListener(callback2);
  }
};

// ../cursorless-engine/src/util/rangeUtils.ts
function expandToFullLine(editor, range3) {
  return new Range(
    new Position(range3.start.line, 0),
    editor.document.lineAt(range3.end).range.end
  );
}
function getRangeLength(editor, range3) {
  return range3.isEmpty ? 0 : editor.document.offsetAt(range3.end) - editor.document.offsetAt(range3.start);
}
function strictlyContains(range1, rangeOrPosition) {
  const [start, end] = rangeOrPosition instanceof Position ? [rangeOrPosition, rangeOrPosition] : [rangeOrPosition.start, rangeOrPosition.end];
  return range1.start.isBefore(start) && range1.end.isAfter(end);
}
function union(range3, ...unionWith) {
  for (const r of unionWith) {
    if (r != null) {
      range3 = range3.union(r);
    }
  }
  return range3;
}

// ../cursorless-engine/src/processTargets/targets/DestinationImpl.ts
var DestinationImpl = class _DestinationImpl {
  constructor(target, insertionMode2, indentationString) {
    this.target = target;
    this.insertionMode = insertionMode2;
    this.contentRange = getContentRange(target.contentRange, insertionMode2);
    this.isBefore = insertionMode2 === "before";
    this.isLineDelimiter = target.insertionDelimiter.includes("\n");
    this.indentationString = indentationString ?? this.isLineDelimiter ? getIndentationString(target.editor, target.contentRange) : "";
    this.insertionPrefix = target.prefixRange != null ? target.editor.document.getText(target.prefixRange) : void 0;
  }
  get contentSelection() {
    return this.contentRange.toSelection(this.target.isReversed);
  }
  get editor() {
    return this.target.editor;
  }
  get insertionDelimiter() {
    return this.target.insertionDelimiter;
  }
  get isRaw() {
    return this.target.isRaw;
  }
  /**
   * Creates a new destination with the given target while preserving insertion
   * mode and indentation string from this destination. This is important
   * because our "edit new" code updates the content range of the target when
   * multiple edits are performed in the same document, but we want to insert
   * the original indentation.
   */
  withTarget(target) {
    return new _DestinationImpl(
      target,
      this.insertionMode,
      this.indentationString
    );
  }
  getEditNewActionType() {
    if (this.insertionMode === "after" && this.target.contentRange.isSingleLine && this.insertionDelimiter === "\n" && this.insertionPrefix == null) {
      return "insertLineAfter";
    }
    return "edit";
  }
  constructChangeEdit(text, skipIndentation = false) {
    return this.insertionMode === "before" || this.insertionMode === "after" ? this.constructEditWithDelimiters(text, skipIndentation) : this.constructEditWithoutDelimiters(text);
  }
  constructEditWithDelimiters(text, skipIndentation) {
    const range3 = this.getEditRange();
    const editText2 = this.getEditText(text, skipIndentation);
    const updateRange = (range4) => {
      return this.updateRange(range4, text, skipIndentation);
    };
    return {
      range: range3,
      text: editText2,
      isReplace: this.insertionMode === "after",
      updateRange
    };
  }
  constructEditWithoutDelimiters(text) {
    return {
      range: this.contentRange,
      text,
      updateRange: (range3) => range3
    };
  }
  getEditRange() {
    const position = (() => {
      const insertionPosition = this.isBefore ? union(this.target.contentRange, this.target.prefixRange).start : this.target.contentRange.end;
      if (this.isLineDelimiter) {
        const line = this.editor.document.lineAt(insertionPosition);
        const trimmedPosition = this.isBefore ? line.rangeTrimmed?.start ?? line.range.start : line.rangeTrimmed?.end ?? line.range.end;
        if (insertionPosition.isEqual(trimmedPosition)) {
          return this.isBefore ? line.range.start : line.range.end;
        }
      }
      return insertionPosition;
    })();
    return new Range(position, position);
  }
  getEditText(text, skipIndentation) {
    const indentationString = skipIndentation ? "" : this.indentationString;
    const insertionText = indentationString + (this.insertionPrefix ?? "") + text;
    return this.isBefore ? insertionText + this.insertionDelimiter : this.insertionDelimiter + insertionText;
  }
  updateRange(range3, text, skipIndentation) {
    const baseStartOffset = this.editor.document.offsetAt(range3.start) + (skipIndentation ? 0 : this.indentationString.length) + (this.insertionPrefix?.length ?? 0);
    const startIndex = this.isBefore ? baseStartOffset : baseStartOffset + this.getLengthOfInsertionDelimiter();
    const endIndex = startIndex + text.length;
    return new Range(
      this.editor.document.positionAt(startIndex),
      this.editor.document.positionAt(endIndex)
    );
  }
  getLengthOfInsertionDelimiter() {
    if (this.editor.document.eol === "CRLF") {
      const matches = this.insertionDelimiter.match(/\n/g);
      if (matches != null) {
        return this.insertionDelimiter.length + matches.length;
      }
    }
    return this.insertionDelimiter.length;
  }
};
function getIndentationString(editor, range3) {
  let length = Number.MAX_SAFE_INTEGER;
  let indentationString = "";
  for (let i = range3.start.line; i <= range3.end.line; ++i) {
    const line = editor.document.lineAt(i);
    if (line.range.isEmpty || line.isEmptyOrWhitespace && !range3.isSingleLine) {
      continue;
    }
    const trimmedPosition = line.rangeTrimmed?.start ?? line.range.end;
    if (trimmedPosition.character < length) {
      length = trimmedPosition.character;
      indentationString = line.text.slice(0, length);
    }
  }
  return indentationString;
}
function getContentRange(contentRange, insertionMode2) {
  switch (insertionMode2) {
    case "before":
      return contentRange.start.toEmptyRange();
    case "after":
      return contentRange.end.toEmptyRange();
    case "to":
      return contentRange;
  }
}

// ../cursorless-engine/src/processTargets/targets/util/createContinuousRange.ts
function createContinuousRange(startTarget, endTarget, includeStart, includeEnd) {
  return createContinuousRangeFromRanges(
    startTarget.contentRange,
    endTarget.contentRange,
    includeStart,
    includeEnd
  );
}
function createContinuousRangeFromRanges(startRange, endRange, includeStart, includeEnd) {
  return new Range(
    includeStart ? startRange.start : startRange.end,
    includeEnd ? endRange.end : endRange.start
  );
}
function createContinuousLineRange(startTarget, endTarget, includeStart, includeEnd) {
  const start = includeStart ? startTarget.contentRange.start : new Position(startTarget.contentRange.end.line + 1, 0);
  const end = includeEnd ? endTarget.contentRange.end : endTarget.editor.document.lineAt(endTarget.contentRange.start.line - 1).range.end;
  return new Range(start, end);
}

// ../cursorless-engine/src/processTargets/targets/BaseTarget.ts
var BaseTarget = class _BaseTarget {
  constructor(parameters) {
    this.isLine = false;
    this.isToken = true;
    this.hasExplicitScopeType = true;
    this.hasExplicitRange = true;
    this.isRaw = false;
    this.isImplicit = false;
    this.isNotebookCell = false;
    this.isWord = false;
    this.joinAs = "line";
    this.state = {
      editor: parameters.editor,
      isReversed: parameters.isReversed,
      contentRange: parameters.contentRange,
      thatTarget: parameters.thatTarget
    };
  }
  get editor() {
    return this.state.editor;
  }
  get isReversed() {
    return this.state.isReversed;
  }
  get thatTarget() {
    return this.state.thatTarget != null ? this.state.thatTarget.thatTarget : this;
  }
  get contentText() {
    return this.editor.document.getText(this.contentRange);
  }
  get contentSelection() {
    return this.contentRange.toSelection(this.isReversed);
  }
  get contentRange() {
    return this.state.contentRange;
  }
  constructRemovalEdit() {
    return {
      range: this.getRemovalRange(),
      text: "",
      updateRange: (range3) => range3
    };
  }
  getRemovalHighlightRange() {
    return this.getRemovalRange();
  }
  withThatTarget(thatTarget) {
    return this.cloneWith({ thatTarget });
  }
  withContentRange(contentRange) {
    return this.cloneWith({ contentRange });
  }
  getInterior() {
    return void 0;
  }
  getBoundary() {
    return void 0;
  }
  cloneWith(parameters) {
    const constructor = Object.getPrototypeOf(this).constructor;
    return new constructor({
      ...this.getCloneParameters(),
      ...parameters
    });
  }
  maybeCreateRichRangeTarget(isReversed, endTarget) {
    const { constructor } = Object.getPrototypeOf(this);
    return new constructor({
      ...this.getCloneParameters(),
      isReversed,
      contentRange: createContinuousRange(this, endTarget, true, true)
    });
  }
  isEqual(otherTarget) {
    return otherTarget instanceof _BaseTarget && isEqual_default(this.getEqualityParameters(), otherTarget.getEqualityParameters());
  }
  /**
   * Constructs an object that can be used for determining equality between two
   * {@link BaseTarget} objects. We proceed by just getting the objects clone
   * parameters and removing the `thatTarget`.
   *
   * We would prefer to instead merge the `thatTarget`s into a list. See #780
   * for more details.
   *
   * @returns The object to be used for determining equality
   */
  getEqualityParameters() {
    const { thatTarget, ...otherCloneParameters } = this.getCloneParameters();
    return {
      ...otherCloneParameters
    };
  }
  toDestination(insertionMode2) {
    return new DestinationImpl(this, insertionMode2);
  }
  /**
   * Converts the target to a plain object representation.
   *
   * Note that this implementation is quite incomplete, but is suitable for
   * round-tripping {@link UntypedTarget} objects and capturing the fact that an
   * object is not an un typed target if it is not, via the {@link type}
   * attribute.  In the future, we should override this method in subclasses to
   * provide a more complete representation.
   * @returns A plain object representation of the target
   */
  toPlainObject() {
    return {
      type: this.type,
      contentRange: rangeToPlainObject(this.contentRange),
      isReversed: this.isReversed,
      hasExplicitRange: this.hasExplicitRange
    };
  }
};

// ../cursorless-engine/src/util/selectionUtils.ts
function selectionWithEditorFromRange(selection, range3) {
  return selectionWithEditorFromPositions(selection, range3.start, range3.end);
}
function selectionWithEditorFromPositions(selection, start, end) {
  return {
    editor: selection.editor,
    selection: selectionFromPositions(selection.selection, start, end)
  };
}
function selectionFromPositions(selection, start, end) {
  return !selection.isReversed ? new Selection(start, end) : new Selection(end, start);
}
function shrinkRangeToFitContent(editor, range3) {
  const { document } = editor;
  const text = document.getText(range3);
  const startDelta = text.length - text.trimStart().length;
  const endDelta = text.length - text.trimEnd().length;
  const startOffset = document.offsetAt(range3.start) + startDelta;
  const endOffset = document.offsetAt(range3.end) - endDelta;
  const start = document.positionAt(startOffset);
  const end = document.positionAt(endOffset);
  return new Range(start, end);
}

// ../cursorless-engine/src/util/tryConstructTarget.ts
function tryConstructTarget(constructor, editor, range3, isReversed) {
  return range3 == null ? void 0 : new constructor({
    editor,
    isReversed,
    contentRange: range3
  });
}

// ../cursorless-engine/src/processTargets/targets/PlainTarget.ts
var PlainTarget = class extends BaseTarget {
  constructor(parameters) {
    super(parameters);
    this.type = "PlainTarget";
    this.getLeadingDelimiterTarget = () => void 0;
    this.getTrailingDelimiterTarget = () => void 0;
    this.getRemovalRange = () => this.contentRange;
    this.isToken = parameters.isToken ?? true;
    this.insertionDelimiter = parameters.insertionDelimiter ?? "";
  }
  getCloneParameters() {
    return {
      ...this.state,
      isToken: this.isToken,
      insertionDelimiter: this.insertionDelimiter
    };
  }
};
function tryConstructPlainTarget(editor, range3, isReversed) {
  return tryConstructTarget(PlainTarget, editor, range3, isReversed);
}

// ../cursorless-engine/src/processTargets/targets/DocumentTarget.ts
var DocumentTarget = class extends BaseTarget {
  constructor(parameters) {
    super(parameters);
    this.type = "DocumentTarget";
    this.insertionDelimiter = "\n";
    this.isLine = true;
  }
  getLeadingDelimiterTarget() {
    return void 0;
  }
  getTrailingDelimiterTarget() {
    return void 0;
  }
  getRemovalRange() {
    return this.contentRange;
  }
  getInterior() {
    return [
      // Use plain target instead of interior target since we want the same content and removal range for a document interior.
      new PlainTarget({
        editor: this.editor,
        isReversed: this.isReversed,
        contentRange: shrinkRangeToFitContent(this.editor, this.contentRange)
      })
    ];
  }
  getCloneParameters() {
    return this.state;
  }
};

// ../cursorless-engine/src/processTargets/targets/LineTarget.ts
var LineTarget = class _LineTarget extends BaseTarget {
  constructor() {
    super(...arguments);
    this.type = "LineTarget";
    this.insertionDelimiter = "\n";
    this.isLine = true;
    this.getRemovalHighlightRange = () => this.fullLineContentRange;
  }
  get fullLineContentRange() {
    return expandToFullLine(this.editor, this.contentRange);
  }
  getLeadingDelimiterTarget() {
    return tryConstructPlainTarget(
      this.editor,
      getLeadingDelimiterRange(this.editor, this.fullLineContentRange),
      this.isReversed
    );
  }
  getTrailingDelimiterTarget() {
    return tryConstructPlainTarget(
      this.editor,
      getTrailingDelimiterRange(this.editor, this.fullLineContentRange),
      this.isReversed
    );
  }
  getRemovalRange() {
    const contentRemovalRange = this.fullLineContentRange;
    const delimiterTarget = this.getTrailingDelimiterTarget() ?? this.getLeadingDelimiterTarget();
    return delimiterTarget == null ? contentRemovalRange : contentRemovalRange.union(delimiterTarget.contentRange);
  }
  maybeCreateRichRangeTarget(isReversed, endTarget) {
    return new _LineTarget({
      editor: this.editor,
      isReversed,
      contentRange: createContinuousLineRange(this, endTarget, true, true)
    });
  }
  getCloneParameters() {
    return this.state;
  }
};
function getLeadingDelimiterRange(editor, range3) {
  const { start } = range3;
  return start.line > 0 ? new Range(editor.document.lineAt(start.line - 1).range.end, range3.start) : void 0;
}
function getTrailingDelimiterRange(editor, range3) {
  const { end } = range3;
  return end.line + 1 < editor.document.lineCount ? new Range(range3.end, new Position(end.line + 1, 0)) : void 0;
}
function constructLineTarget(editor, range3, isReversed) {
  return tryConstructTarget(LineTarget, editor, range3, isReversed);
}

// ../cursorless-engine/src/processTargets/targets/NotebookCellDestination.ts
var NotebookCellDestination = class _NotebookCellDestination {
  constructor(target, insertionMode2) {
    this.target = target;
    this.insertionMode = insertionMode2;
  }
  get editor() {
    return this.target.editor;
  }
  get contentRange() {
    return this.target.contentRange;
  }
  get contentSelection() {
    return this.target.contentSelection;
  }
  get insertionDelimiter() {
    return this.target.insertionDelimiter;
  }
  get isRaw() {
    return this.target.isRaw;
  }
  withTarget(target) {
    return new _NotebookCellDestination(target, this.insertionMode);
  }
  getEditNewActionType() {
    throw new Error("Method not implemented.");
  }
  constructChangeEdit(_text) {
    throw new Error("Method not implemented.");
  }
};

// ../cursorless-engine/src/processTargets/targets/NotebookCellTarget.ts
var NotebookCellTarget = class extends BaseTarget {
  constructor(parameters) {
    super(parameters);
    this.type = "NotebookCellTarget";
    this.insertionDelimiter = "\n";
    this.isNotebookCell = true;
    this.getLeadingDelimiterTarget = () => void 0;
    this.getTrailingDelimiterTarget = () => void 0;
    this.getRemovalRange = () => this.contentRange;
  }
  getCloneParameters() {
    return this.state;
  }
  toDestination(insertionMode2) {
    return new NotebookCellDestination(this, insertionMode2);
  }
};

// ../cursorless-engine/src/processTargets/targets/ParagraphTarget.ts
var ParagraphTarget = class _ParagraphTarget extends BaseTarget {
  constructor() {
    super(...arguments);
    this.type = "ParagraphTarget";
    this.insertionDelimiter = "\n\n";
    this.isLine = true;
  }
  getLeadingDelimiterTarget() {
    return constructLineTarget(
      this.editor,
      getLeadingDelimiterRange2(this.editor, this.fullLineContentRange),
      this.isReversed
    );
  }
  getTrailingDelimiterTarget() {
    return constructLineTarget(
      this.editor,
      getTrailingDelimiterRange2(this.editor, this.fullLineContentRange),
      this.isReversed
    );
  }
  getRemovalRange() {
    const delimiterTarget = this.getTrailingDelimiterTarget() ?? this.getLeadingDelimiterTarget();
    const removalContentRange = delimiterTarget != null ? this.contentRange.union(delimiterTarget.contentRange) : this.contentRange;
    return new LineTarget({
      contentRange: removalContentRange,
      editor: this.editor,
      isReversed: this.isReversed
    }).getRemovalRange();
  }
  get fullLineContentRange() {
    return expandToFullLine(this.editor, this.contentRange);
  }
  getRemovalHighlightRange() {
    const delimiterTarget = this.getTrailingDelimiterTarget() ?? this.getLeadingDelimiterTarget();
    return delimiterTarget != null ? this.fullLineContentRange.union(delimiterTarget.contentRange) : this.fullLineContentRange;
  }
  maybeCreateRichRangeTarget(isReversed, endTarget) {
    return new _ParagraphTarget({
      ...this.getCloneParameters(),
      isReversed,
      contentRange: createContinuousLineRange(this, endTarget, true, true)
    });
  }
  getCloneParameters() {
    return this.state;
  }
};
function getLeadingDelimiterRange2(editor, contentRange) {
  const { document } = editor;
  const startLine = document.lineAt(contentRange.start);
  const leadingLine = getPreviousNonEmptyLine(document, startLine);
  if (leadingLine != null) {
    if (leadingLine.lineNumber + 1 === startLine.lineNumber) {
      return void 0;
    }
    return new Range(
      new Position(leadingLine.lineNumber + 1, 0),
      document.lineAt(startLine.lineNumber - 1).range.end
    );
  }
  if (startLine.lineNumber > 0) {
    return new Range(
      new Position(0, 0),
      document.lineAt(startLine.lineNumber - 1).range.end
    );
  }
  return void 0;
}
function getTrailingDelimiterRange2(editor, contentRange) {
  const { document } = editor;
  const endLine = document.lineAt(contentRange.end);
  const trailingLine = getNextNonEmptyLine(document, endLine);
  if (trailingLine != null) {
    if (trailingLine.lineNumber - 1 === endLine.lineNumber) {
      return void 0;
    }
    return new Range(
      new Position(endLine.lineNumber + 1, 0),
      document.lineAt(trailingLine.lineNumber - 1).range.end
    );
  }
  if (endLine.lineNumber < document.lineCount - 1) {
    return new Range(
      new Position(endLine.lineNumber + 1, 0),
      document.lineAt(document.lineCount - 1).range.end
    );
  }
  return void 0;
}
function getPreviousNonEmptyLine(document, line) {
  while (line.lineNumber > 0) {
    const previousLine = document.lineAt(line.lineNumber - 1);
    if (!previousLine.isEmptyOrWhitespace) {
      return previousLine;
    }
    line = previousLine;
  }
  return null;
}
function getNextNonEmptyLine(document, line) {
  while (line.lineNumber + 1 < document.lineCount) {
    const nextLine = document.lineAt(line.lineNumber + 1);
    if (!nextLine.isEmptyOrWhitespace) {
      return nextLine;
    }
    line = nextLine;
  }
  return null;
}

// ../cursorless-engine/src/processTargets/targets/RawSelectionTarget.ts
var RawSelectionTarget = class extends BaseTarget {
  constructor() {
    super(...arguments);
    this.type = "RawSelectionTarget";
    this.insertionDelimiter = "";
    this.isRaw = true;
    this.isToken = false;
    this.getLeadingDelimiterTarget = () => void 0;
    this.getTrailingDelimiterTarget = () => void 0;
    this.getRemovalRange = () => this.contentRange;
    this.getCloneParameters = () => this.state;
  }
};

// ../cursorless-engine/src/processTargets/targets/InteriorTarget.ts
var InteriorTarget = class _InteriorTarget extends BaseTarget {
  constructor(parameters) {
    super({
      ...parameters,
      contentRange: shrinkRangeToFitContent(
        parameters.editor,
        parameters.fullInteriorRange
      )
    });
    this.type = "InteriorTarget";
    this.insertionDelimiter = " ";
    this.getLeadingDelimiterTarget = () => void 0;
    this.getTrailingDelimiterTarget = () => void 0;
    this.getRemovalRange = () => this.fullInteriorRange;
    this.fullInteriorRange = parameters.fullInteriorRange;
  }
  getCloneParameters() {
    return {
      ...this.state,
      fullInteriorRange: this.fullInteriorRange
    };
  }
  maybeCreateRichRangeTarget(isReversed, endTarget) {
    return new _InteriorTarget({
      ...this.getCloneParameters(),
      isReversed,
      fullInteriorRange: createContinuousRangeFromRanges(
        this.fullInteriorRange,
        endTarget.fullInteriorRange,
        true,
        true
      )
    });
  }
};

// ../cursorless-engine/src/processTargets/targets/util/insertionRemovalBehaviors/DelimitedSequenceInsertionRemovalBehavior.ts
function getDelimitedSequenceRemovalRange(target) {
  const contentRange = union(target.contentRange, target.prefixRange);
  const delimiterTarget = target.getTrailingDelimiterTarget() ?? target.getLeadingDelimiterTarget();
  return delimiterTarget != null ? contentRange.union(delimiterTarget.contentRange) : contentRange;
}

// ../cursorless-engine/src/processTargets/targets/util/insertionRemovalBehaviors/TokenInsertionRemovalBehavior.ts
var leadingDelimiters = ['"', "'", "(", "[", "{", "<"];
var trailingDelimiters = ['"', "'", ")", "]", "}", ">", ",", ";", ":"];
function getTokenLeadingDelimiterTarget(target) {
  const { editor } = target;
  const { start } = union(target.contentRange, target.prefixRange);
  const startLine = editor.document.lineAt(start);
  const leadingText = startLine.text.slice(0, start.character);
  const leadingDelimiters2 = leadingText.match(/\s+$/);
  return leadingDelimiters2 == null ? void 0 : new PlainTarget({
    contentRange: new Range(
      start.line,
      start.character - leadingDelimiters2[0].length,
      start.line,
      start.character
    ),
    editor,
    isReversed: target.isReversed
  });
}
function getTokenTrailingDelimiterTarget(target) {
  const { editor } = target;
  const { end } = target.contentRange;
  const endLine = editor.document.lineAt(end);
  const trailingText = endLine.text.slice(end.character);
  const trailingDelimiters2 = trailingText.match(/^\s+/);
  return trailingDelimiters2 == null ? void 0 : new PlainTarget({
    contentRange: new Range(
      end.line,
      end.character,
      end.line,
      end.character + trailingDelimiters2[0].length
    ),
    editor,
    isReversed: target.isReversed
  });
}
function getTokenRemovalRange(target) {
  const { editor } = target;
  const contentRange = union(target.contentRange, target.prefixRange);
  const { start, end } = contentRange;
  const leadingWhitespaceRange = target.getLeadingDelimiterTarget()?.contentRange ?? start.toEmptyRange();
  const trailingWhitespaceRange = target.getTrailingDelimiterTarget()?.contentRange ?? end.toEmptyRange();
  const fullLineRange = expandToFullLine(editor, contentRange);
  if (leadingWhitespaceRange.union(trailingWhitespaceRange).isRangeEqual(fullLineRange)) {
    return fullLineRange;
  }
  if (!trailingWhitespaceRange.isEmpty) {
    if (!leadingWhitespaceRange.isEmpty || contentRange.start.isEqual(fullLineRange.start) || leadingDelimiters.includes(getLeadingCharacter(editor, contentRange))) {
      return contentRange.union(trailingWhitespaceRange);
    }
  }
  if (!leadingWhitespaceRange.isEmpty) {
    if (contentRange.end.isEqual(fullLineRange.end) || trailingDelimiters.includes(getTrailingCharacter(editor, contentRange))) {
      return contentRange.union(leadingWhitespaceRange);
    }
  }
  return contentRange;
}
function getLeadingCharacter(editor, contentRange) {
  const { start } = contentRange;
  const line = editor.document.lineAt(start);
  return start.isAfter(line.range.start) ? editor.document.getText(new Range(start.translate(void 0, -1), start)) : "";
}
function getTrailingCharacter(editor, contentRange) {
  const { end } = contentRange;
  const line = editor.document.lineAt(end);
  return end.isBefore(line.range.end) ? editor.document.getText(new Range(end.translate(void 0, 1), end)) : "";
}

// ../cursorless-engine/src/processTargets/targets/ScopeTypeTarget.ts
var ScopeTypeTarget = class _ScopeTypeTarget extends BaseTarget {
  constructor(parameters) {
    super(parameters);
    this.type = "ScopeTypeTarget";
    this.scopeTypeType_ = parameters.scopeTypeType;
    this.removalRange_ = parameters.removalRange;
    this.interiorRange_ = parameters.interiorRange;
    this.leadingDelimiterRange_ = parameters.leadingDelimiterRange;
    this.trailingDelimiterRange_ = parameters.trailingDelimiterRange;
    this.prefixRange = parameters.prefixRange;
    this.insertionDelimiter = parameters.insertionDelimiter ?? getInsertionDelimiter(parameters.scopeTypeType);
    this.hasDelimiterRange_ = !!this.leadingDelimiterRange_ || !!this.trailingDelimiterRange_;
  }
  getLeadingDelimiterTarget() {
    if (this.leadingDelimiterRange_ != null) {
      return new PlainTarget({
        editor: this.editor,
        isReversed: this.isReversed,
        contentRange: this.leadingDelimiterRange_
      });
    }
    if (!this.hasDelimiterRange_) {
      return getTokenLeadingDelimiterTarget(this);
    }
    return void 0;
  }
  getTrailingDelimiterTarget() {
    if (this.trailingDelimiterRange_ != null) {
      return new PlainTarget({
        editor: this.editor,
        isReversed: this.isReversed,
        contentRange: this.trailingDelimiterRange_
      });
    }
    if (!this.hasDelimiterRange_) {
      return getTokenTrailingDelimiterTarget(this);
    }
    return void 0;
  }
  getInterior() {
    if (this.interiorRange_ == null) {
      return super.getInterior();
    }
    return [
      new InteriorTarget({
        editor: this.editor,
        isReversed: this.isReversed,
        fullInteriorRange: this.interiorRange_
      })
    ];
  }
  getRemovalRange() {
    return this.removalRange_ != null ? this.removalRange_ : this.hasDelimiterRange_ ? getDelimitedSequenceRemovalRange(this) : getTokenRemovalRange(this);
  }
  maybeCreateRichRangeTarget(isReversed, endTarget) {
    if (this.scopeTypeType_ !== endTarget.scopeTypeType_) {
      return null;
    }
    const contentRemovalRange = this.removalRange_ != null || endTarget.removalRange_ != null ? createContinuousRangeFromRanges(
      this.removalRange_ ?? this.contentRange,
      endTarget.removalRange_ ?? endTarget.contentRange,
      true,
      true
    ) : void 0;
    return new _ScopeTypeTarget({
      ...this.getCloneParameters(),
      isReversed,
      leadingDelimiterRange: this.leadingDelimiterRange_,
      trailingDelimiterRange: endTarget.trailingDelimiterRange_,
      removalRange: contentRemovalRange,
      contentRange: createContinuousRange(this, endTarget, true, true)
    });
  }
  getCloneParameters() {
    return {
      ...this.state,
      insertionDelimiter: this.insertionDelimiter,
      prefixRange: this.prefixRange,
      removalRange: void 0,
      interiorRange: void 0,
      scopeTypeType: this.scopeTypeType_,
      leadingDelimiterRange: this.leadingDelimiterRange_,
      trailingDelimiterRange: this.trailingDelimiterRange_
    };
  }
};
function getInsertionDelimiter(scopeType) {
  switch (scopeType) {
    case "class":
    case "namedFunction":
    case "section":
    case "sectionLevelOne":
    case "sectionLevelTwo":
    case "sectionLevelThree":
    case "sectionLevelFour":
    case "sectionLevelFive":
    case "sectionLevelSix":
    case "part":
    case "chapter":
    case "subSection":
    case "subSubSection":
    case "namedParagraph":
    case "subParagraph":
      return "\n\n";
    case "anonymousFunction":
    case "statement":
    case "ifStatement":
    case "comment":
    case "xmlElement":
    case "collectionItem":
    case "branch":
    case "environment":
      return "\n";
    default:
      return " ";
  }
}

// ../cursorless-engine/src/processTargets/targets/SubTokenWordTarget.ts
var SubTokenWordTarget = class _SubTokenWordTarget extends BaseTarget {
  constructor(parameters) {
    super(parameters);
    this.type = "SubTokenWordTarget";
    this.isToken = false;
    this.isWord = true;
    this.leadingDelimiterRange_ = parameters.leadingDelimiterRange;
    this.trailingDelimiterRange_ = parameters.trailingDelimiterRange;
    this.insertionDelimiter = parameters.insertionDelimiter;
  }
  getLeadingDelimiterTarget() {
    return tryConstructPlainTarget(
      this.editor,
      this.leadingDelimiterRange_,
      this.isReversed
    );
  }
  getTrailingDelimiterTarget() {
    return tryConstructPlainTarget(
      this.editor,
      this.trailingDelimiterRange_,
      this.isReversed
    );
  }
  getRemovalRange() {
    return getDelimitedSequenceRemovalRange(this);
  }
  maybeCreateRichRangeTarget(isReversed, endTarget) {
    return new _SubTokenWordTarget({
      ...this.getCloneParameters(),
      isReversed,
      contentRange: createContinuousRange(this, endTarget, true, true),
      trailingDelimiterRange: endTarget.trailingDelimiterRange_
    });
  }
  getCloneParameters() {
    return {
      ...this.state,
      leadingDelimiterRange: this.leadingDelimiterRange_,
      trailingDelimiterRange: this.trailingDelimiterRange_,
      insertionDelimiter: this.insertionDelimiter
    };
  }
};

// ../cursorless-engine/src/processTargets/targets/TokenTarget.ts
var TokenTarget = class extends BaseTarget {
  constructor() {
    super(...arguments);
    this.type = "TokenTarget";
    this.insertionDelimiter = " ";
    this.joinAs = "token";
  }
  getLeadingDelimiterTarget() {
    return getTokenLeadingDelimiterTarget(this);
  }
  getTrailingDelimiterTarget() {
    return getTokenTrailingDelimiterTarget(this);
  }
  getRemovalRange() {
    return getTokenRemovalRange(this);
  }
  getCloneParameters() {
    return this.state;
  }
};

// ../cursorless-engine/src/processTargets/targets/SurroundingPairTarget.ts
var SurroundingPairTarget = class extends BaseTarget {
  constructor(parameters) {
    super(parameters);
    this.type = "SurroundingPairTarget";
    this.insertionDelimiter = " ";
    this.boundary_ = parameters.boundary;
    this.interiorRange_ = parameters.interiorRange;
  }
  getLeadingDelimiterTarget() {
    return getTokenLeadingDelimiterTarget(this);
  }
  getTrailingDelimiterTarget() {
    return getTokenTrailingDelimiterTarget(this);
  }
  getRemovalRange() {
    return getTokenRemovalRange(this);
  }
  getInterior() {
    return [
      new InteriorTarget({
        editor: this.editor,
        isReversed: this.isReversed,
        fullInteriorRange: this.interiorRange_
      })
    ];
  }
  getBoundary() {
    return this.boundary_.map(
      (contentRange) => new TokenTarget({
        editor: this.editor,
        isReversed: this.isReversed,
        contentRange
      })
    );
  }
  getCloneParameters() {
    return {
      ...this.state,
      interiorRange: this.interiorRange_,
      boundary: this.boundary_
    };
  }
};

// ../cursorless-engine/src/processTargets/targets/UntypedTarget.ts
var UntypedTarget = class extends BaseTarget {
  constructor(parameters) {
    super(parameters);
    this.type = "UntypedTarget";
    this.insertionDelimiter = " ";
    this.hasExplicitScopeType = false;
    this.hasExplicitRange = parameters.hasExplicitRange;
    this.isToken = parameters.isToken ?? true;
  }
  getLeadingDelimiterTarget() {
    return getTokenLeadingDelimiterTarget(this);
  }
  getTrailingDelimiterTarget() {
    return getTokenTrailingDelimiterTarget(this);
  }
  getRemovalRange() {
    return this.editor.document.getText(this.contentRange).trim().length === 0 ? this.contentRange : getTokenRemovalRange(this);
  }
  maybeCreateRichRangeTarget() {
    return null;
  }
  getCloneParameters() {
    return {
      ...this.state,
      isToken: this.isToken,
      hasExplicitRange: this.hasExplicitRange
    };
  }
};

// ../cursorless-engine/src/processTargets/targets/ImplicitTarget.ts
var ImplicitTarget = class extends BaseTarget {
  constructor() {
    super(...arguments);
    this.type = "ImplicitTarget";
    this.insertionDelimiter = "";
    this.isRaw = true;
    this.hasExplicitScopeType = false;
    this.isImplicit = true;
    this.isToken = false;
    this.getLeadingDelimiterTarget = () => void 0;
    this.getTrailingDelimiterTarget = () => void 0;
    this.getRemovalRange = () => this.contentRange;
    this.getCloneParameters = () => this.state;
  }
};

// ../cursorless-engine/src/processTargets/targets/HeadTailTarget.ts
var HeadTailTarget = class extends BaseTarget {
  constructor(parameters) {
    const { inputTarget, modifiedTarget, isHead } = parameters;
    super({
      ...parameters,
      contentRange: constructRange(
        inputTarget.contentRange,
        modifiedTarget.contentRange,
        isHead
      )
    });
    this.type = "HeadTailTarget";
    this.insertionDelimiter = " ";
    this.inputTarget = inputTarget;
    this.modifiedTarget = modifiedTarget;
    this.isHead = isHead;
  }
  getLeadingDelimiterTarget() {
    return getTokenLeadingDelimiterTarget(this);
  }
  getTrailingDelimiterTarget() {
    return getTokenTrailingDelimiterTarget(this);
  }
  getRemovalRange() {
    return getTokenRemovalRange(this);
  }
  getInterior() {
    const modifiedInterior = this.modifiedTarget.getInterior();
    if (modifiedInterior == null) {
      return void 0;
    }
    return modifiedInterior.map((target) => {
      return new PlainTarget({
        editor: this.editor,
        contentRange: constructRange(
          this.inputTarget.contentRange,
          target.contentRange,
          this.isHead
        ),
        isReversed: this.isReversed
      });
    });
  }
  getCloneParameters() {
    return {
      ...this.state,
      inputTarget: this.inputTarget,
      modifiedTarget: this.modifiedTarget,
      isHead: this.isHead
    };
  }
};
function constructRange(originalRange, modifiedRange, isHead) {
  return isHead ? new Range(modifiedRange.start, originalRange.end) : new Range(originalRange.start, modifiedRange.end);
}

// ../cursorless-engine/src/processTargets/targets/BoundedParagraphTarget.ts
var BoundedParagraphTarget = class _BoundedParagraphTarget extends BaseTarget {
  constructor(parameters) {
    super({
      ...parameters,
      contentRange: getIntersectionStrict(
        parameters.paragraphTarget.contentRange,
        parameters.containingInterior.contentRange
      )
    });
    this.type = "BoundedParagraphTarget";
    this.insertionDelimiter = "\n\n";
    this.isLine = true;
    this.containingInterior = parameters.containingInterior;
    this.paragraphTarget = parameters.paragraphTarget;
    this.startLineGap = this.contentRange.start.line - this.containingInterior.fullInteriorRange.start.line;
    this.endLineGap = this.containingInterior.fullInteriorRange.end.line - this.contentRange.end.line;
  }
  getLeadingDelimiterTarget() {
    return this.startLineGap > 1 ? this.paragraphTarget.getLeadingDelimiterTarget() : void 0;
  }
  getTrailingDelimiterTarget() {
    return this.endLineGap > 1 ? this.paragraphTarget.getTrailingDelimiterTarget() : void 0;
  }
  getRemovalRange() {
    const delimiterTarget = this.getTrailingDelimiterTarget() ?? this.getLeadingDelimiterTarget();
    const removalContentRange = delimiterTarget != null ? this.contentRange.union(delimiterTarget.contentRange) : this.contentRange;
    if (this.startLineGap <= 0 || this.endLineGap <= 0) {
      return removalContentRange;
    }
    return new LineTarget({
      contentRange: removalContentRange,
      editor: this.editor,
      isReversed: this.isReversed
    }).getRemovalRange();
  }
  get fullLineContentRange() {
    return expandToFullLine(this.editor, this.contentRange);
  }
  getRemovalHighlightRange() {
    if (this.startLineGap < 1 || this.endLineGap < 1) {
      return this.getRemovalRange();
    }
    const delimiterTarget = this.getTrailingDelimiterTarget() ?? this.getLeadingDelimiterTarget();
    return delimiterTarget != null ? this.fullLineContentRange.union(delimiterTarget.contentRange) : this.fullLineContentRange;
  }
  maybeCreateRichRangeTarget(isReversed, endTarget) {
    return new _BoundedParagraphTarget({
      ...this.getCloneParameters(),
      isReversed,
      containingInterior: this.containingInterior.maybeCreateRichRangeTarget(
        isReversed,
        endTarget.containingInterior
      ),
      paragraphTarget: this.paragraphTarget.maybeCreateRichRangeTarget(
        isReversed,
        endTarget.paragraphTarget
      )
    });
  }
  getCloneParameters() {
    return {
      ...this.state,
      paragraphTarget: this.paragraphTarget,
      containingInterior: this.containingInterior
    };
  }
};
function getIntersectionStrict(range1, range22) {
  const intersection = range1.intersection(range22);
  if (intersection == null || intersection.isEmpty) {
    throw new Error("Ranges do not intersect");
  }
  return intersection;
}

// ../cursorless-engine/src/processTargets/marks/getActiveSelections.ts
function getActiveSelections(ide2) {
  return ide2.activeTextEditor?.selections.map((selection) => ({
    selection,
    editor: ide2.activeTextEditor
  })) ?? [];
}

// ../cursorless-engine/src/processTargets/marks/CursorStage.ts
var CursorStage = class {
  run() {
    return getActiveSelections(ide()).map(
      (selection) => new UntypedTarget({
        editor: selection.editor,
        isReversed: selection.selection.isReversed,
        contentRange: selection.selection,
        hasExplicitRange: !selection.selection.isEmpty,
        isToken: false
      })
    );
  }
};

// ../cursorless-engine/src/util/DecorationDebouncer.ts
var DecorationDebouncer = class {
  constructor(configuration, callback2) {
    this.debouncer = new Debouncer(
      callback2,
      configuration.getOwnConfiguration("decorationDebounceDelayMs")
    );
    this.run = this.run.bind(this);
  }
  run() {
    this.debouncer.run();
  }
  dispose() {
    this.debouncer.dispose();
  }
};

// ../cursorless-engine/src/KeyboardTargetUpdater.ts
var KeyboardTargetUpdater = class {
  constructor(ide2, storedTargets) {
    this.ide = ide2;
    this.storedTargets = storedTargets;
    this.disposables = [];
    this.debouncer = new DecorationDebouncer(
      ide2.configuration,
      () => this.updateKeyboardTarget()
    );
    this.disposables.push(
      ide2.configuration.onDidChangeConfiguration(() => this.maybeActivate()),
      this.debouncer
    );
    this.maybeActivate();
  }
  maybeActivate() {
    const isActive = this.ide.configuration.getOwnConfiguration(
      "experimental.keyboardTargetFollowsSelection"
    );
    if (isActive) {
      if (this.selectionWatcherDisposable == null) {
        this.selectionWatcherDisposable = this.ide.onDidChangeTextEditorSelection(this.debouncer.run);
      }
      return;
    }
    if (this.selectionWatcherDisposable != null) {
      this.selectionWatcherDisposable.dispose();
      this.selectionWatcherDisposable = void 0;
    }
  }
  updateKeyboardTarget() {
    const activeEditor = this.ide.activeTextEditor;
    if (activeEditor == null || this.storedTargets.get("keyboard") == null) {
      return;
    }
    this.storedTargets.set("keyboard", new CursorStage().run());
  }
  dispose() {
    this.disposables.forEach((disposable) => disposable.dispose());
    this.selectionWatcherDisposable?.dispose();
  }
};

// ../cursorless-engine/src/core/Debug.ts
var Debug = class {
  constructor(ide2) {
    this.ide = ide2;
    ide2.disposeOnExit(this);
    this.evaluateSetting = this.evaluateSetting.bind(this);
    this.active = true;
    switch (ide2.runMode) {
      // Development mode. Always enable.
      case "development":
        this.enableDebugLog();
        break;
      // Test mode. Always disable.
      case "test":
        this.disableDebugLog();
        break;
      // Production mode. Enable based on user setting.
      case "production":
        this.evaluateSetting();
        this.disposableConfiguration = ide2.configuration.onDidChangeConfiguration(this.evaluateSetting);
        break;
    }
  }
  log(...args) {
    if (this.active) {
      console.log(...args);
    }
  }
  dispose() {
    if (this.disposableConfiguration) {
      this.disposableConfiguration.dispose();
    }
  }
  enableDebugLog() {
    this.active = true;
  }
  disableDebugLog() {
    this.active = false;
  }
  evaluateSetting() {
    const debugEnabled = this.ide.configuration.getOwnConfiguration("debug");
    if (debugEnabled) {
      this.enableDebugLog();
    } else {
      this.disableDebugLog();
    }
  }
};

// ../cursorless-engine/src/tokenGraphemeSplitter/tokenGraphemeSplitter.ts
var KNOWN_SYMBOLS = [
  "!",
  "#",
  "$",
  "%",
  "&",
  "'",
  "(",
  ")",
  "*",
  "+",
  ",",
  "-",
  ".",
  "/",
  ":",
  ";",
  "<",
  "=",
  ">",
  "?",
  "@",
  "[",
  "\\",
  "]",
  "^",
  "_",
  "`",
  "{",
  "|",
  "}",
  "~",
  "\xA3",
  '"'
];
var KNOWN_SYMBOL_REGEXP_STR = KNOWN_SYMBOLS.map(escapeRegExp_default).join("|");
var KNOWN_GRAPHEME_REGEXP_STR = ["[a-zA-Z0-9]", KNOWN_SYMBOL_REGEXP_STR].join(
  "|"
);
var KNOWN_GRAPHEME_MATCHER = new RegExp(
  `^(${KNOWN_GRAPHEME_REGEXP_STR})$`,
  "u"
);
var UNKNOWN = "[unk]";
var GRAPHEME_SPLIT_REGEX = /\p{L}\p{M}*|[\p{N}\p{P}\p{S}]/gu;
var TokenGraphemeSplitter = class {
  constructor() {
    this.disposables = [];
    this.algorithmChangeNotifier = new Notifier();
    /**
     * Splits {@link token} into a list of graphemes, normalised as per
     * {@link normalizeGrapheme}.
     * @param token The token to split
     * @returns A list of normalised graphemes in {@link token}
     */
    this.getTokenGraphemes = (token) => matchAll(token, GRAPHEME_SPLIT_REGEX, (match) => ({
      text: this.normalizeGrapheme(match[0]),
      tokenStartOffset: match.index,
      tokenEndOffset: match.index + match[0].length
    }));
    /**
     * Register to be notified when the graphing splitting algorithm changes, for example if
     * the user changes the setting to enable preserving case
     * @param listener A function to be called when graphing splitting algorithm changes
     * @returns A function that can be called to unsubscribe from notifications
     */
    this.registerAlgorithmChangeListener = this.algorithmChangeNotifier.registerListener;
    ide().disposeOnExit(this);
    this.updateTokenHatSplittingMode = this.updateTokenHatSplittingMode.bind(this);
    this.getTokenGraphemes = this.getTokenGraphemes.bind(this);
    this.updateTokenHatSplittingMode();
    this.disposables.push(
      // Notify listeners in case the user changed their token hat splitting
      // setting.
      ide().configuration.onDidChangeConfiguration(
        this.updateTokenHatSplittingMode
      )
    );
  }
  updateTokenHatSplittingMode() {
    const { lettersToPreserve, symbolsToPreserve, ...rest } = ide().configuration.getOwnConfiguration("tokenHatSplittingMode");
    this.tokenHatSplittingMode = {
      lettersToPreserve: lettersToPreserve.map(
        (grapheme) => grapheme.toLowerCase().normalize("NFC")
      ),
      symbolsToPreserve: symbolsToPreserve.map(
        (grapheme) => grapheme.normalize("NFC")
      ),
      ...rest
    };
    this.algorithmChangeNotifier.notifyListeners();
  }
  /**
   * Normalizes the grapheme {@link rawGraphemeText} based on user
   * configuration.  Proceeds as follows:
   *
   * 1. Runs text through Unicode NFC normalization to ensure that characters
   *    that look identical are handled the same (eg whether they use combining
   *    mark or single codepoint for diacritics).
   * 2. If the grapheme is a known grapheme, returns it.
   * 3. Transforms grapheme to lowercase if
   *    {@link TokenHatSplittingMode.preserveCase} is `false`
   * 3. Returns the (possibly case-normalised) grapheme if it appears in
   *    {@link TokenHatSplittingMode.lettersToPreserve}
   * 4. Strips diacritics from the grapheme
   * 5. If the grapheme doesn't match {@link KNOWN_GRAPHEME_MATCHER}, maps the
   *    grapheme to the constant {@link UNKNOWN}, so that it can be referred to
   *    using "special", "red special", etc.
   * 6. Returns the grapheme.
   *
   * @param rawGraphemeText The raw grapheme text to normalise
   * @returns The normalised grapheme
   */
  normalizeGrapheme(rawGraphemeText) {
    const { preserveCase, lettersToPreserve, symbolsToPreserve } = this.tokenHatSplittingMode;
    let returnValue = rawGraphemeText.normalize("NFC");
    if (symbolsToPreserve.includes(returnValue)) {
      return returnValue;
    }
    if (!preserveCase) {
      returnValue = returnValue.toLowerCase();
    }
    if (lettersToPreserve.includes(returnValue.toLowerCase())) {
      return returnValue;
    }
    returnValue = deburr_default(returnValue);
    if (!KNOWN_GRAPHEME_MATCHER.test(returnValue)) {
      returnValue = UNKNOWN;
    }
    return returnValue;
  }
  dispose() {
    this.disposables.forEach(({ dispose }) => dispose());
  }
};

// ../cursorless-engine/src/singletons/tokenGraphemeSplitter.singleton.ts
function tokenGraphemeSplitter() {
  if (tokenGraphemeSplitter_ == null) {
    tokenGraphemeSplitter_ = new TokenGraphemeSplitter();
  }
  return tokenGraphemeSplitter_;
}
var tokenGraphemeSplitter_;

// ../cursorless-engine/src/util/allocateHats/HatMetrics.ts
var negativePenalty = ({ penalty }) => -penalty;
function hatOldTokenRank(hatOldTokenRanks) {
  return ({ grapheme: { text: grapheme }, style }) => {
    const hatOldTokenRank2 = hatOldTokenRanks.get({
      grapheme,
      hatStyle: style
    });
    return hatOldTokenRank2 == null ? Infinity : -hatOldTokenRank2;
  };
}
function minimumTokenRankContainingGrapheme(tokenRank, graphemeTokenRanks) {
  const coreMetric = memoize_default((graphemeText) => {
    return min_default(graphemeTokenRanks[graphemeText].filter((r) => r > tokenRank)) ?? Infinity;
  });
  return ({ grapheme: { text } }) => coreMetric(text);
}
function isOldTokenHat(oldTokenHat) {
  return (hat) => hat.grapheme.text === oldTokenHat?.grapheme && hat.style === oldTokenHat?.hatStyle ? 1 : 0;
}
function penaltyEquivalenceClass(hatStability) {
  switch (hatStability) {
    case "greedy" /* greedy */:
      return ({ penalty }) => -penalty;
    case "balanced" /* balanced */:
      return ({ penalty }) => -(penalty < 2 ? 0 : 1);
    case "stable" /* stable */:
      return (_) => 0;
  }
}

// ../cursorless-engine/src/util/allocateHats/maxByFirstDiffering.ts
function maxByFirstDiffering(arr, fns) {
  if (arr.length === 0) {
    return void 0;
  }
  let remainingValues = arr;
  for (const fn of fns) {
    if (remainingValues.length === 1) {
      return remainingValues[0];
    }
    remainingValues = maxByAllowingTies(remainingValues, fn);
  }
  return remainingValues[0];
}
function maxByAllowingTies(arr, fn) {
  let best = -Infinity;
  const keep = [];
  for (const item of arr) {
    const value = fn(item);
    if (value < best) {
      continue;
    }
    if (value > best) {
      best = value;
      keep.length = 0;
    }
    keep.push(item);
  }
  return keep;
}

// ../cursorless-engine/src/util/allocateHats/chooseTokenHat.ts
function chooseTokenHat({ hatOldTokenRanks, graphemeTokenRanks }, hatStability, tokenRank, forcedTokenHat, oldTokenHat, candidates) {
  return maxByFirstDiffering(candidates, [
    // Use forced hat
    isOldTokenHat(forcedTokenHat),
    // Discard any hats that are sufficiently worse than the best hat that we
    // wouldn't use them even if they were our old hat
    penaltyEquivalenceClass(hatStability),
    // Use our old hat if it's still in the running
    isOldTokenHat(oldTokenHat),
    // Use a free hat if possible; if not, steal the hat of the token with
    // lowest rank
    hatOldTokenRank(hatOldTokenRanks),
    // Narrow to the hats with the lowest penalty
    negativePenalty,
    // Prefer hats that sit on a grapheme that doesn't appear in any highly
    // ranked token
    minimumTokenRankContainingGrapheme(tokenRank, graphemeTokenRanks)
  ]);
}

// ../cursorless-engine/src/util/allocateHats/getHatRankingContext.ts
function getHatRankingContext(tokens2, oldTokenHatMap, tokenGraphemeSplitter2) {
  const graphemeTokenRanks = {};
  const hatOldTokenRanks = new CompositeKeyMap(({ grapheme, hatStyle }) => [grapheme, hatStyle]);
  tokens2.forEach(({ token, rank }) => {
    const existingTokenHat = oldTokenHatMap.get(token);
    if (existingTokenHat != null) {
      hatOldTokenRanks.set(existingTokenHat, rank);
    }
    tokenGraphemeSplitter2.getTokenGraphemes(token.text).forEach(({ text: graphemeText }) => {
      let tokenRanksForGrapheme;
      if (graphemeText in graphemeTokenRanks) {
        tokenRanksForGrapheme = graphemeTokenRanks[graphemeText];
      } else {
        tokenRanksForGrapheme = [];
        graphemeTokenRanks[graphemeText] = tokenRanksForGrapheme;
      }
      tokenRanksForGrapheme.push(rank);
    });
  });
  return {
    hatOldTokenRanks,
    graphemeTokenRanks
  };
}

// ../cursorless-engine/src/util/allocateHats/getDisplayLineMap.ts
function getDisplayLineMap(editor, extraLines = []) {
  return new Map(
    flow_default(
      flatten_default,
      uniq_default
    )(
      concat_default(
        [extraLines],
        editor.visibleRanges.map(
          (visibleRange) => range_default(visibleRange.start.line, visibleRange.end.line + 1)
        )
      )
    ).sort((a, b) => a - b).map((value, index) => [value, index])
  );
}

// ../cursorless-engine/src/util/allocateHats/getTokenComparator.ts
function getTokenComparator(selectionDisplayLine, selectionCharacterIndex) {
  return (token1, token2) => {
    const token1LineDiff = Math.abs(token1.displayLine - selectionDisplayLine);
    const token2LineDiff = Math.abs(token2.displayLine - selectionDisplayLine);
    if (token1LineDiff < token2LineDiff) {
      return -1;
    }
    if (token1LineDiff > token2LineDiff) {
      return 1;
    }
    const token1CharacterDiff = Math.abs(
      token1.range.start.character - selectionCharacterIndex
    );
    const token2CharacterDiff = Math.abs(
      token2.range.start.character - selectionCharacterIndex
    );
    return token1CharacterDiff - token2CharacterDiff;
  };
}

// ../cursorless-engine/src/tokenizer/tokenizer.ts
var REPEATABLE_SYMBOLS = [
  "-",
  "+",
  "*",
  "/",
  "=",
  "<",
  ">",
  "_",
  "#",
  ".",
  "|",
  "&",
  ":"
];
var FIXED_TOKENS = [
  "!==",
  "!=",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "<=",
  ">=",
  "=>",
  "->",
  "??",
  '"""',
  "```",
  "/*",
  "*/",
  "<!--",
  "-->"
];
var IDENTIFIER_WORD_REGEXES = ["\\p{L}", "\\p{M}", "\\p{N}"];
var SINGLE_SYMBOLS_REGEX = "[^\\s\\w]";
var NUMBERS_REGEX = "(?<![.\\d])\\d+\\.\\d+(?![.\\d])";
function generateMatcher(languageComponents) {
  const {
    fixedTokens,
    repeatableSymbols,
    identifierWordRegexes,
    identifierWordDelimiters,
    numbersRegex,
    singleSymbolsRegex
  } = languageComponents;
  const repeatableSymbolsRegex = repeatableSymbols.map(escapeRegExp_default).map((s) => `${s}+`).join("|");
  const fixedTokensRegex = fixedTokens.map(escapeRegExp_default).join("|");
  const identifierComponents = identifierWordRegexes.concat(
    identifierWordDelimiters.map(escapeRegExp_default)
  );
  const identifiersRegex = `(${identifierComponents.join("|")})+`;
  const wordRegex = `(${identifierWordRegexes.join("|")})+`;
  const regex = [
    fixedTokensRegex,
    numbersRegex,
    identifiersRegex,
    repeatableSymbolsRegex,
    singleSymbolsRegex
  ].join("|");
  return {
    identifierMatcher: new RegExp(identifiersRegex, "gu"),
    wordMatcher: new RegExp(wordRegex, "gu"),
    tokenMatcher: new RegExp(regex, "gu")
  };
}
var matchers = /* @__PURE__ */ new Map();
function getMatcher(languageId) {
  const wordSeparators = ide().configuration.getOwnConfiguration(
    "wordSeparators",
    {
      languageId
    }
  );
  const key = wordSeparators.join("\0");
  if (!matchers.has(key)) {
    const components = {
      fixedTokens: FIXED_TOKENS,
      repeatableSymbols: REPEATABLE_SYMBOLS,
      identifierWordRegexes: IDENTIFIER_WORD_REGEXES,
      identifierWordDelimiters: wordSeparators,
      numbersRegex: NUMBERS_REGEX,
      singleSymbolsRegex: SINGLE_SYMBOLS_REGEX
    };
    matchers.set(key, generateMatcher(components));
  }
  return matchers.get(key);
}
function tokenize(text, languageId, mapfn) {
  return matchAll(text, getMatcher(languageId).tokenMatcher, mapfn);
}

// ../cursorless-engine/src/util/allocateHats/getTokensInRange.ts
function getTokensInRange(editor, range3) {
  const languageId = editor.document.languageId;
  const text = editor.document.getText(range3);
  const rangeOffset = editor.document.offsetAt(range3.start);
  return tokenize(text, languageId, (match) => {
    const startOffset = rangeOffset + match.index;
    const endOffset = rangeOffset + match.index + match[0].length;
    const range4 = new Range(
      editor.document.positionAt(startOffset),
      editor.document.positionAt(endOffset)
    );
    return {
      editor,
      text: match[0],
      range: range4,
      offsets: { start: startOffset, end: endOffset }
    };
  });
}

// ../cursorless-engine/src/util/allocateHats/getRankedTokens.ts
function getRankedTokens(activeTextEditor, visibleTextEditors, forcedHatMap) {
  const editors = getRankedEditors(
    activeTextEditor,
    visibleTextEditors
  );
  const tokens2 = editors.flatMap((editor) => {
    const referencePosition = editor.selections[0].active;
    const displayLineMap = getDisplayLineMap(editor, [referencePosition.line]);
    const tokens3 = flatten_default(
      editor.visibleRanges.map(
        (range3) => getTokensInRange(editor, range3).map((partialToken) => ({
          ...partialToken,
          displayLine: displayLineMap.get(partialToken.range.start.line)
        }))
      )
    );
    tokens3.sort(
      getTokenComparator(
        displayLineMap.get(referencePosition.line),
        referencePosition.character
      )
    );
    return tokens3;
  });
  return moveForcedHatsToFront(forcedHatMap, tokens2).map((token, index) => ({
    token,
    rank: -index
  }));
}
function moveForcedHatsToFront(forcedHatMap, tokens2) {
  if (forcedHatMap == null) {
    return tokens2;
  }
  return tokens2.sort((a, b) => {
    const aIsForced = forcedHatMap.has(a);
    const bIsForced = forcedHatMap.has(b);
    if (aIsForced && !bIsForced) {
      return -1;
    }
    if (!aIsForced && bIsForced) {
      return 1;
    }
    return 0;
  });
}
function getRankedEditors(activeTextEditor, visibleTextEditors) {
  let editors;
  if (activeTextEditor == null) {
    editors = visibleTextEditors;
  } else {
    editors = [
      activeTextEditor,
      ...visibleTextEditors.filter((editor) => editor !== activeTextEditor)
    ];
  }
  return editors;
}

// ../cursorless-engine/src/util/allocateHats/allocateHats.ts
function allocateHats({
  tokenGraphemeSplitter: tokenGraphemeSplitter2,
  enabledHatStyles,
  forceTokenHats,
  oldTokenHats,
  hatStability,
  activeTextEditor,
  visibleTextEditors
}) {
  const forcedHatMap = forceTokenHats == null ? void 0 : getTokenOldHatMap(forceTokenHats);
  const tokenOldHatMap = getTokenOldHatMap(oldTokenHats);
  const rankedTokens = getRankedTokens(
    activeTextEditor,
    visibleTextEditors,
    forcedHatMap
  );
  const context = getHatRankingContext(
    rankedTokens,
    tokenOldHatMap,
    tokenGraphemeSplitter2
  );
  const enabledHatStyleNames = Object.keys(enabledHatStyles);
  const graphemeRemainingHatCandidates = new DefaultMap(
    () => [...enabledHatStyleNames]
  );
  return rankedTokens.map(({ token, rank: tokenRank }) => {
    const tokenRemainingHatCandidates = getTokenRemainingHatCandidates(
      tokenGraphemeSplitter2,
      token,
      graphemeRemainingHatCandidates,
      enabledHatStyles
    );
    const chosenHat = chooseTokenHat(
      context,
      hatStability,
      tokenRank,
      forcedHatMap?.get(token),
      tokenOldHatMap.get(token),
      tokenRemainingHatCandidates
    );
    if (chosenHat == null) {
      return void 0;
    }
    graphemeRemainingHatCandidates.set(
      chosenHat.grapheme.text,
      graphemeRemainingHatCandidates.get(chosenHat.grapheme.text).filter((style) => style !== chosenHat.style)
    );
    return constructHatRangeDescriptor(token, chosenHat);
  }).filter((value) => value != null);
}
function getTokenOldHatMap(oldTokenHats) {
  const tokenOldHatMap = new CompositeKeyMap(
    ({ editor, offsets }) => [editor.id, offsets.start, offsets.end]
  );
  oldTokenHats.forEach(
    (descriptor) => tokenOldHatMap.set(descriptor.token, descriptor)
  );
  return tokenOldHatMap;
}
function getTokenRemainingHatCandidates(tokenGraphemeSplitter2, token, graphemeRemainingHatCandidates, enabledHatStyles) {
  const candidates = [];
  const graphemes = tokenGraphemeSplitter2.getTokenGraphemes(token.text);
  for (const grapheme of graphemes) {
    for (const style of graphemeRemainingHatCandidates.get(grapheme.text)) {
      candidates.push({
        grapheme,
        style,
        penalty: enabledHatStyles[style].penalty
      });
    }
  }
  return candidates;
}
function constructHatRangeDescriptor(token, chosenHat) {
  return {
    hatStyle: chosenHat.style,
    grapheme: chosenHat.grapheme.text,
    token,
    hatRange: new Range(
      token.range.start.translate(
        void 0,
        chosenHat.grapheme.tokenStartOffset
      ),
      token.range.start.translate(void 0, chosenHat.grapheme.tokenEndOffset)
    )
  };
}

// ../cursorless-engine/src/core/HatAllocator.ts
var HatAllocator = class {
  constructor(hats, context) {
    this.hats = hats;
    this.context = context;
    this.disposables = [];
    ide().disposeOnExit(this);
    const debouncer = new DecorationDebouncer(
      ide().configuration,
      () => this.allocateHats()
    );
    this.disposables.push(
      this.hats.onDidChangeEnabledHatStyles(debouncer.run),
      this.hats.onDidChangeIsEnabled(debouncer.run),
      // An event that fires when a text document opens
      ide().onDidOpenTextDocument(debouncer.run),
      // An event that fires when a text document closes
      ide().onDidCloseTextDocument(debouncer.run),
      // An Event which fires when the active editor has changed. Note that the event also fires when the active editor changes to undefined.
      ide().onDidChangeActiveTextEditor(debouncer.run),
      // An Event which fires when the array of visible editors has changed.
      ide().onDidChangeVisibleTextEditors(debouncer.run),
      // An event that is emitted when a text document is changed. This usually happens when the contents changes but also when other things like the dirty-state changes.
      ide().onDidChangeTextDocument(debouncer.run),
      // An Event which fires when the selection in an editor has changed.
      ide().onDidChangeTextEditorSelection(debouncer.run),
      // An Event which fires when the visible ranges of an editor has changed.
      ide().onDidChangeTextEditorVisibleRanges(debouncer.run),
      // Re-draw hats on grapheme splitting algorithm change in case they
      // changed their token hat splitting setting.
      tokenGraphemeSplitter().registerAlgorithmChangeListener(debouncer.run),
      debouncer
    );
  }
  /**
   * Allocate hats to the visible tokens.
   *
   * @param forceTokenHats If supplied, force the allocator to use these hats
   * for the given tokens. This is used for the tutorial, and for testing.
   */
  async allocateHats(forceTokenHats) {
    const activeMap = await this.context.getActiveMap();
    forceTokenHats = forceTokenHats?.map((tokenHat) => ({
      ...tokenHat,
      grapheme: tokenGraphemeSplitter().normalizeGrapheme(tokenHat.grapheme)
    }));
    const tokenHats = this.hats.isEnabled ? allocateHats({
      tokenGraphemeSplitter: tokenGraphemeSplitter(),
      enabledHatStyles: this.hats.enabledHatStyles,
      forceTokenHats,
      oldTokenHats: activeMap.tokenHats,
      hatStability: ide().configuration.getOwnConfiguration(
        "experimental.hatStability"
      ),
      activeTextEditor: ide().activeTextEditor,
      visibleTextEditors: ide().visibleTextEditors
    }) : [];
    activeMap.setTokenHats(tokenHats);
    await this.hats.setHatRanges(
      tokenHats.map(({ hatStyle, hatRange, token: { editor } }) => ({
        editor,
        range: hatRange,
        styleName: hatStyle
      }))
    );
  }
  dispose() {
    this.disposables.forEach(({ dispose }) => dispose());
  }
};

// ../cursorless-engine/src/core/IndividualHatMap.ts
var IndividualHatMap = class _IndividualHatMap {
  constructor(rangeUpdater) {
    this.rangeUpdater = rangeUpdater;
    this.isExpired = false;
    this.documentTokenLists = /* @__PURE__ */ new Map();
    this.deregisterFunctions = [];
    this.map = {};
    this._tokenHats = [];
  }
  get tokenHats() {
    return this._tokenHats;
  }
  getDocumentTokenList(document) {
    const key = document.uri.toString();
    let currentValue = this.documentTokenLists.get(key);
    if (currentValue == null) {
      currentValue = [];
      this.documentTokenLists.set(key, currentValue);
      this.deregisterFunctions.push(
        this.rangeUpdater.registerRangeInfoList(document, currentValue)
      );
    }
    return currentValue;
  }
  clone() {
    const ret = new _IndividualHatMap(this.rangeUpdater);
    ret.setTokenHats(this._tokenHats);
    return ret;
  }
  /**
   * Overwrites the hat assignment for this hat token map.
   *
   * @param tokenHats The new hat assignments
   */
  setTokenHats(tokenHats) {
    this.map = {};
    this.documentTokenLists = /* @__PURE__ */ new Map();
    this.deregisterFunctions.forEach((func) => func());
    const liveTokenHats = tokenHats.map((tokenHat) => {
      const { hatStyle, grapheme, token } = tokenHat;
      const liveToken = this.makeTokenLive(token);
      this.map[getKey(hatStyle, grapheme)] = liveToken;
      return { ...tokenHat, token: liveToken };
    });
    this._tokenHats = liveTokenHats;
  }
  makeTokenLive(token) {
    const { tokenMatcher } = getMatcher(token.editor.document.languageId);
    const liveToken = {
      ...token,
      expansionBehavior: {
        start: {
          type: "regex",
          regex: tokenMatcher
        },
        end: {
          type: "regex",
          regex: tokenMatcher
        }
      }
    };
    this.getDocumentTokenList(token.editor.document).push(liveToken);
    return liveToken;
  }
  getEntries() {
    this.checkExpired();
    return Object.entries(this.map);
  }
  getToken(hatStyle, character) {
    this.checkExpired();
    return this.map[getKey(hatStyle, tokenGraphemeSplitter().normalizeGrapheme(character))];
  }
  checkExpired() {
    if (this.isExpired) {
      throw Error("Map snapshot has expired");
    }
  }
  dispose() {
    this.isExpired = true;
    this.deregisterFunctions.forEach((func) => func());
  }
};

// ../cursorless-engine/src/core/HatTokenMapImpl.ts
var PRE_PHRASE_SNAPSHOT_MAX_AGE_MS = 6e4;
var HatTokenMapImpl = class {
  constructor(rangeUpdater, debug, hats, commandServerApi) {
    this.debug = debug;
    this.commandServerApi = commandServerApi;
    this.prePhraseMapsSnapshotTimestamp = null;
    this.lastSignalVersion = null;
    ide().disposeOnExit(this);
    this.activeMap = new IndividualHatMap(rangeUpdater);
    this.getActiveMap = this.getActiveMap.bind(this);
    this.allocateHats = this.allocateHats.bind(this);
    this.hatAllocator = new HatAllocator(hats, {
      getActiveMap: this.getActiveMap
    });
  }
  /**
   * Allocate hats to the visible tokens.
   *
   * @param forceTokenHats If supplied, force the allocator to use these hats
   * for the given tokens. This is used for the tutorial, and for testing.
   */
  allocateHats(forceTokenHats) {
    return this.hatAllocator.allocateHats(forceTokenHats);
  }
  async getActiveMap() {
    await this.maybeTakePrePhraseSnapshot();
    return this.activeMap;
  }
  /**
   * Returns a transient, read-only hat map for use during the course of a
   * single command.
   *
   * Please do not hold onto this copy beyond the lifetime of a single command,
   * because it will get stale.
   * @param usePrePhraseSnapshot Whether to use pre-phrase snapshot
   * @returns A readable snapshot of the map
   */
  async getReadableMap(usePrePhraseSnapshot) {
    await this.maybeTakePrePhraseSnapshot();
    if (usePrePhraseSnapshot) {
      if (this.lastSignalVersion == null) {
        console.error(
          "Pre phrase snapshot requested but no signal was present; please upgrade command client"
        );
        return this.activeMap;
      }
      if (this.prePhraseMapSnapshot == null) {
        console.error(
          "Navigation map pre-phrase snapshot requested, but no snapshot has been taken"
        );
        return this.activeMap;
      }
      if (performance.now() - this.prePhraseMapsSnapshotTimestamp > PRE_PHRASE_SNAPSHOT_MAX_AGE_MS) {
        console.error(
          "Navigation map pre-phrase snapshot requested, but snapshot is more than a minute old"
        );
        return this.activeMap;
      }
      return this.prePhraseMapSnapshot;
    }
    return this.activeMap;
  }
  dispose() {
    this.activeMap.dispose();
    if (this.prePhraseMapSnapshot != null) {
      this.prePhraseMapSnapshot.dispose();
    }
  }
  async maybeTakePrePhraseSnapshot() {
    const newSignalVersion = await this.commandServerApi.signals.prePhrase.getVersion();
    if (newSignalVersion !== this.lastSignalVersion) {
      this.debug.log("taking snapshot");
      this.lastSignalVersion = newSignalVersion;
      if (newSignalVersion != null) {
        this.takePrePhraseSnapshot();
      }
    }
  }
  takePrePhraseSnapshot() {
    if (this.prePhraseMapSnapshot != null) {
      this.prePhraseMapSnapshot.dispose();
    }
    this.prePhraseMapSnapshot = this.activeMap.clone();
    this.prePhraseMapsSnapshotTimestamp = performance.now();
  }
};

// ../cursorless-engine/src/util/map.ts
function getDefault(map3, key, factory) {
  let currentValue = map3.get(key);
  if (currentValue == null) {
    currentValue = factory();
    map3.set(key, currentValue);
  }
  return currentValue;
}

// ../cursorless-engine/src/core/updateSelections/getOffsetsForDeleteOrReplace.ts
var import_immutability_helper = __toESM(require_immutability_helper(), 1);
function getOffsetsForDeleteOrReplace(changeEventInfo, rangeInfo) {
  const {
    originalOffsets: {
      start: changeOriginalStartOffset,
      end: changeOriginalEndOffset
    },
    finalOffsets: { end: changeFinalEndOffset },
    displacement
  } = changeEventInfo;
  const {
    offsets: { start: rangeStart, end: rangeEnd }
  } = rangeInfo;
  (0, import_immutability_helper.invariant)(
    changeOriginalEndOffset > changeOriginalStartOffset,
    () => "Change range expected to be nonempty"
  );
  (0, import_immutability_helper.invariant)(
    changeOriginalEndOffset >= rangeStart && changeOriginalStartOffset <= rangeEnd,
    () => "Change range expected to intersect with selection range"
  );
  return {
    start: changeOriginalEndOffset <= rangeStart ? rangeStart + displacement : Math.min(rangeStart, changeFinalEndOffset),
    end: changeOriginalEndOffset <= rangeEnd ? rangeEnd + displacement : Math.min(rangeEnd, changeFinalEndOffset)
  };
}

// ../cursorless-engine/src/core/updateSelections/getOffsetsForEmptyRangeInsert.ts
var import_immutability_helper2 = __toESM(require_immutability_helper(), 1);
function getOffsetsForEmptyRangeInsert(changeEventInfo, rangeInfo) {
  const {
    event: { text, isReplace: isReplace2 },
    finalOffsets: { start, end }
  } = changeEventInfo;
  (0, import_immutability_helper2.invariant)(
    start === changeEventInfo.originalOffsets.end && start === rangeInfo.offsets.start && start === rangeInfo.offsets.end,
    () => "Selection range and change range expected to be same empty range"
  );
  if (isReplace2) {
    const expansionBehavior = rangeInfo.expansionBehavior.end;
    switch (expansionBehavior.type) {
      case "closed":
        return {
          start,
          end: start
        };
      case "open":
        return { start, end };
      case "regex": {
        const matches = text.match(leftAnchored(expansionBehavior.regex));
        return matches == null ? {
          start,
          end: start
        } : {
          start,
          end: start + matches[0].length
        };
      }
    }
  } else {
    const expansionBehavior = rangeInfo.expansionBehavior.start;
    switch (expansionBehavior.type) {
      case "closed":
        return {
          start: end,
          end
        };
      case "open":
        return { start, end };
      case "regex": {
        const index = text.search(rightAnchored(expansionBehavior.regex));
        return index === -1 ? {
          start: end,
          end
        } : {
          start: start + index,
          end
        };
      }
    }
  }
}

// ../cursorless-engine/src/core/updateSelections/getOffsetsForNonEmptyRangeInsert.ts
var import_immutability_helper3 = __toESM(require_immutability_helper(), 1);
function getOffsetsForNonEmptyRangeInsert(changeEventInfo, rangeInfo) {
  const {
    event: { text: insertedText },
    originalOffsets: { start: insertOffset },
    displacement
  } = changeEventInfo;
  const {
    offsets: { start: rangeStart, end: rangeEnd },
    text: originalRangeText
  } = rangeInfo;
  (0, import_immutability_helper3.invariant)(
    rangeEnd > rangeStart,
    () => "Selection range expected to be nonempty"
  );
  (0, import_immutability_helper3.invariant)(
    insertOffset >= rangeStart && insertOffset <= rangeEnd,
    () => "Insertion offset expected to intersect with selection range"
  );
  if (insertOffset > rangeStart && insertOffset < rangeEnd) {
    return { start: rangeStart, end: rangeEnd + displacement };
  }
  if (insertOffset === rangeStart) {
    const expansionBehavior = rangeInfo.expansionBehavior.start;
    const newRangeEnd = rangeEnd + displacement;
    switch (expansionBehavior.type) {
      case "closed":
        return {
          start: rangeStart + displacement,
          end: newRangeEnd
        };
      case "open":
        return {
          start: rangeStart,
          end: newRangeEnd
        };
      case "regex": {
        let text = insertedText + originalRangeText;
        const regex = rightAnchored(expansionBehavior.regex);
        let index = text.search(regex);
        while (index > insertedText.length) {
          text = text.slice(0, index);
          index = text.search(regex);
        }
        return index === -1 ? {
          start: rangeStart,
          end: newRangeEnd
        } : {
          start: rangeStart + index,
          end: newRangeEnd
        };
      }
    }
  } else {
    const expansionBehavior = rangeInfo.expansionBehavior.end;
    const newRangeStart = rangeStart;
    switch (expansionBehavior.type) {
      case "closed":
        return {
          start: newRangeStart,
          end: rangeEnd
        };
      case "open":
        return {
          start: newRangeStart,
          end: rangeEnd + displacement
        };
      case "regex": {
        let text = originalRangeText + insertedText;
        const regex = leftAnchored(expansionBehavior.regex);
        let matches = text.match(regex);
        let matchLength = matches == null ? 0 : matches[0].length;
        while (matchLength !== 0 && matchLength < originalRangeText.length) {
          text = originalRangeText.slice(matchLength) + insertedText;
          matches = text.match(regex);
          matchLength = matches == null ? 0 : matchLength + matches[0].length;
        }
        return matchLength === 0 ? {
          start: newRangeStart,
          end: rangeEnd
        } : {
          start: newRangeStart,
          end: rangeStart + matchLength
        };
      }
    }
  }
}

// ../cursorless-engine/src/core/updateSelections/getUpdatedText.ts
function getUpdatedText(changeEventInfo, rangeInfo, newOffsets) {
  const { start: changeOriginalOffsetsStart, end: changeOriginalOffsetsEnd } = changeEventInfo.originalOffsets;
  const { start: rangeOriginalOffsetsStart, end: rangeOriginalOffsetsEnd } = rangeInfo.offsets;
  const newTextStartOffset = Math.min(
    changeOriginalOffsetsStart,
    rangeOriginalOffsetsStart
  );
  let result = "";
  if (rangeOriginalOffsetsStart < changeOriginalOffsetsStart) {
    result += rangeInfo.text.substring(
      0,
      changeOriginalOffsetsStart - rangeOriginalOffsetsStart
    );
  }
  result += changeEventInfo.event.text;
  if (changeOriginalOffsetsEnd < rangeOriginalOffsetsEnd) {
    result += rangeInfo.text.substring(
      rangeOriginalOffsetsEnd - changeOriginalOffsetsEnd,
      rangeInfo.text.length
    );
  }
  return result.substring(
    newOffsets.start - newTextStartOffset,
    newOffsets.end - newTextStartOffset
  );
}

// ../cursorless-engine/src/core/updateSelections/updateRangeInfos.ts
function updateRangeInfos(changeEvent, rangeInfoGenerator) {
  const { document, contentChanges } = changeEvent;
  const changeEventInfos = contentChanges.map((change) => {
    const changeDisplacement = change.text.length - change.rangeLength;
    const changeOriginalStartOffset = change.rangeOffset;
    const changeOriginalEndOffset = changeOriginalStartOffset + change.rangeLength;
    const changeFinalStartOffset = changeOriginalStartOffset;
    const changeFinalEndOffset = changeOriginalEndOffset + changeDisplacement;
    return {
      displacement: changeDisplacement,
      event: change,
      originalOffsets: {
        start: changeOriginalStartOffset,
        end: changeOriginalEndOffset
      },
      finalOffsets: {
        start: changeFinalStartOffset,
        end: changeFinalEndOffset
      }
    };
  });
  for (const rangeInfo of rangeInfoGenerator) {
    const originalOffsets = rangeInfo.offsets;
    const displacements = changeEventInfos.map((changeEventInfo) => {
      let newOffsets2;
      if (changeEventInfo.originalOffsets.start > originalOffsets.end) {
        return {
          start: 0,
          end: 0
        };
      }
      if (changeEventInfo.originalOffsets.end < originalOffsets.start) {
        return {
          start: changeEventInfo.displacement,
          end: changeEventInfo.displacement
        };
      }
      if (changeEventInfo.event.rangeLength === 0) {
        if (rangeInfo.range.isEmpty) {
          newOffsets2 = getOffsetsForEmptyRangeInsert(
            changeEventInfo,
            rangeInfo
          );
        } else {
          newOffsets2 = getOffsetsForNonEmptyRangeInsert(
            changeEventInfo,
            rangeInfo
          );
        }
      } else {
        newOffsets2 = getOffsetsForDeleteOrReplace(changeEventInfo, rangeInfo);
      }
      rangeInfo.text = getUpdatedText(changeEventInfo, rangeInfo, newOffsets2);
      return {
        start: newOffsets2.start - originalOffsets.start,
        end: newOffsets2.end - originalOffsets.end
      };
    });
    const newOffsets = {
      start: originalOffsets.start + sumBy_default(displacements, ({ start }) => start),
      end: originalOffsets.end + sumBy_default(displacements, ({ end }) => end)
    };
    rangeInfo.range = rangeInfo.range.with(
      document.positionAt(newOffsets.start),
      document.positionAt(newOffsets.end)
    );
    rangeInfo.offsets = newOffsets;
  }
}

// ../cursorless-engine/src/core/updateSelections/RangeUpdater.ts
var RangeUpdater = class {
  constructor() {
    this.rangeInfoLists = /* @__PURE__ */ new Map();
    this.replaceEditLists = /* @__PURE__ */ new Map();
    this.listenForDocumentChanges();
  }
  getDocumentRangeInfoLists(document) {
    return getDefault(this.rangeInfoLists, document.uri.toString(), () => []);
  }
  getDocumentReplaceEditLists(document) {
    return getDefault(this.replaceEditLists, document.uri.toString(), () => []);
  }
  /**
   * Registers a list of range infos to be kept up to date.  It is ok to
   * add to this list after registering it; any items in the list at the time of
   * a document change will be kept up to date.  Please be sure to call the
   * returned deregister function when you no longer need the ranges
   * updated.
   * @param document The document containing the ranges
   * @param rangeInfoList The ranges to keep up to date; it is ok to add to this list after the fact
   * @returns A function that can be used to deregister the list
   */
  registerRangeInfoList(document, rangeInfoList) {
    const documentRangeInfoLists = this.getDocumentRangeInfoLists(document);
    documentRangeInfoLists.push(rangeInfoList);
    return () => pull_default(documentRangeInfoLists, rangeInfoList);
  }
  /**
   * Registers a list of edits to treat as replace edits. These edits are
   * insertions that will not shift an empty selection to the right. Call this
   * function before applying your edits to the document
   *
   * Note that if you make two edits at the same location with the same text,
   * it is not possible to mark only one of them as replace edit.
   *
   * It is ok to add to this list after registering it; any items in the list
   * at the time of a document change will be treated as replace edits.  Please
   * be sure to call the returned deregister function after you have waited for
   * your edits to be applied.
   * @param document The document containing the ranges
   * @param replaceEditList A list of edits to treat as replace edits; it is ok to add to this list after the fact
   * @returns A function that can be used to deregister the list
   */
  registerReplaceEditList(document, replaceEditList) {
    const documentReplaceEditLists = this.getDocumentReplaceEditLists(document);
    documentReplaceEditLists.push(replaceEditList);
    return () => pull_default(documentReplaceEditLists, replaceEditList);
  }
  *documentRangeInfoGenerator(document) {
    const documentRangeInfoLists = this.getDocumentRangeInfoLists(document);
    for (const rangeInfoLists of documentRangeInfoLists) {
      for (const rangeInfo of rangeInfoLists) {
        yield rangeInfo;
      }
    }
  }
  listenForDocumentChanges() {
    this.disposable = ide().onDidChangeTextDocument(
      (event) => {
        const documentReplaceEditLists = this.getDocumentReplaceEditLists(
          event.document
        );
        const extendedEvent = {
          ...event,
          contentChanges: event.contentChanges.map(
            (change) => isReplace(documentReplaceEditLists, change) ? {
              ...change,
              isReplace: true
            } : change
          )
        };
        updateRangeInfos(
          extendedEvent,
          this.documentRangeInfoGenerator(event.document)
        );
      }
    );
  }
  dispose() {
    this.disposable.dispose();
  }
};
function isReplace(documentReplaceEditLists, change) {
  for (const replaceEditLists of documentReplaceEditLists) {
    for (const replaceEdit of replaceEditLists) {
      if (replaceEdit.range.isRangeEqual(change.range) && replaceEdit.text === change.text) {
        return true;
      }
    }
  }
  return false;
}

// ../cursorless-engine/src/disabledComponents/DisabledCommandServerApi.ts
var DisabledCommandServerApi = class {
  constructor() {
    this.signals = {
      prePhrase: {
        getVersion() {
          return Promise.resolve(null);
        }
      }
    };
  }
  getFocusedElementType() {
    return Promise.resolve(void 0);
  }
};

// ../cursorless-engine/src/disabledComponents/DisabledHatTokenMap.ts
var DisabledHatTokenMap = class {
  async allocateHats() {
  }
  async getReadableMap() {
    return {
      getEntries() {
        return [];
      },
      getToken() {
        throw new Error("Hat map is disabled");
      }
    };
  }
  dispose() {
  }
};

// ../cursorless-engine/src/disabledComponents/DisabledLanguageDefinitions.ts
var DisabledLanguageDefinitions = class {
  onDidChangeDefinition(_listener) {
    return { dispose: () => {
    } };
  }
  loadLanguage(_languageId) {
    return Promise.resolve();
  }
  get(_languageId) {
    return void 0;
  }
  getNodeAtLocation(_document, _range) {
    return void 0;
  }
  dispose() {
  }
};

// ../cursorless-engine/src/disabledComponents/DisabledSnippets.ts
var DisabledSnippets = class {
  updateUserSnippets() {
    throw new Error("Snippets are not implemented.");
  }
  registerThirdPartySnippets(_extensionId, _snippets) {
    throw new Error("Snippets are not implemented.");
  }
  getSnippetStrict(_snippetName) {
    throw new Error("Snippets are not implemented.");
  }
  openNewSnippetFile(_snippetName) {
    throw new Error("Snippets are not implemented.");
  }
};

// ../cursorless-engine/src/disabledComponents/DisabledTalonSpokenForms.ts
var DisabledTalonSpokenForms = class {
  getSpokenFormEntries() {
    throw new DisabledCustomSpokenFormsError();
  }
  onDidChange() {
    return { dispose: () => {
    } };
  }
};

// ../cursorless-engine/src/disabledComponents/DisabledTreeSitter.ts
var DisabledTreeSitter = class {
  getTree(_document) {
    throw new Error("Tree sitter not provided");
  }
  loadLanguage(_languageId) {
    return Promise.resolve(false);
  }
  getLanguage(_languageId) {
    throw new Error("Tree sitter not provided");
  }
  getNodeAtLocation(_document, _range) {
    throw new Error("Tree sitter not provided");
  }
};

// ../cursorless-engine/src/generateSpokenForm/NoSpokenFormError.ts
var NoSpokenFormError = class extends Error {
  constructor(reason, requiresTalonUpdate = false, isPrivate2 = false) {
    super(`No spoken form for: ${reason}`);
    this.reason = reason;
    this.requiresTalonUpdate = requiresTalonUpdate;
    this.isPrivate = isPrivate2;
  }
};

// ../cursorless-engine/src/generateSpokenForm/defaultSpokenForms/surroundingPairsDelimiters.ts
var surroundingPairsDelimiters = {
  curlyBrackets: ["{", "}"],
  angleBrackets: ["<", ">"],
  escapedDoubleQuotes: ['\\"', '\\"'],
  escapedSingleQuotes: ["\\'", "\\'"],
  escapedParentheses: ["\\(", "\\)"],
  escapedSquareBrackets: ["\\[", "\\]"],
  doubleQuotes: ['"', '"'],
  parentheses: ["(", ")"],
  backtickQuotes: ["`", "`"],
  squareBrackets: ["[", "]"],
  singleQuotes: ["'", "'"],
  tripleDoubleQuotes: ['"""', '"""'],
  tripleSingleQuotes: ["'''", "'''"],
  whitespace: [" ", " "],
  any: null,
  string: null,
  collectionBoundary: null
};

// ../cursorless-engine/src/generateSpokenForm/defaultSpokenForms/modifiers.ts
var surroundingPairDelimiterToName = new CompositeKeyMap((pair) => pair);
for (const [name, pair] of Object.entries(surroundingPairsDelimiters)) {
  if (pair != null) {
    surroundingPairDelimiterToName.set(
      pair,
      name
    );
  }
}
function surroundingPairDelimitersToSpokenForm(spokenFormMap, left, right) {
  const pairName = surroundingPairDelimiterToName.get([left, right]);
  if (pairName == null) {
    throw Error(`Unknown surrounding pair delimiters '${left} ${right}'`);
  }
  return spokenFormMap.pairedDelimiter[pairName];
}

// ../cursorless-engine/src/generateSpokenForm/defaultSpokenForms/snippets.ts
var insertionSnippets = {
  ifStatement: "if",
  ifElseStatement: "if else",
  tryCatchStatement: "try",
  functionDeclaration: "funk",
  link: "link"
};
var wrapperSnippets = {
  "ifElseStatement.alternative": "else",
  "functionDeclaration.body": "funk",
  "ifElseStatement.consequence": "if else",
  "ifStatement.consequence": "if",
  "tryCatchStatement.body": "try",
  "link.text": "link"
};
function insertionSnippetToSpokenForm(snippetDescription) {
  if (snippetDescription.type === "custom") {
    throw new NoSpokenFormError("Custom insertion snippet");
  }
  const result = insertionSnippets[snippetDescription.name];
  if (result == null) {
    throw new NoSpokenFormError(
      `Named insertion snippet '${snippetDescription.name}'`
    );
  }
  if (snippetDescription.substitutions != null) {
    const values2 = Object.values(snippetDescription.substitutions);
    return `${result} ${values2.join(" ")}`;
  }
  return result;
}
function wrapperSnippetToSpokenForm(snippetDescription) {
  if (snippetDescription.type === "custom") {
    throw new NoSpokenFormError("Custom wrap with snippet");
  }
  const name = `${snippetDescription.name}.${snippetDescription.variableName}`;
  const result = wrapperSnippets[name];
  if (result == null) {
    throw new NoSpokenFormError(`Named wrap with snippet '${name}'`);
  }
  return result;
}

// ../cursorless-engine/src/generateSpokenForm/getRangeConnective.ts
function getRangeConnective(excludeAnchor, excludeActive, type2) {
  const prefix = type2 === "vertical" ? `${connectives.verticalRange} ` : "";
  if (excludeAnchor && excludeActive) {
    return prefix + connectives.rangeExclusive;
  }
  if (excludeAnchor) {
    throw new NoSpokenFormError("Range exclude anchor");
  }
  if (excludeActive) {
    return prefix + connectives.rangeExcludingEnd;
  }
  if (type2 === "vertical") {
    return connectives.verticalRange;
  }
  return connectives.rangeInclusive;
}

// ../cursorless-engine/src/generateSpokenForm/getSpokenFormComponentMap.ts
function getSpokenFormComponentMap(spokenFormMap) {
  return Object.fromEntries(
    Object.entries(spokenFormMap).map(([spokenFormType, map3]) => [
      spokenFormType,
      Object.fromEntries(
        Object.entries(map3).map(([id2, spokenForms]) => [
          id2,
          {
            type: "customizable",
            spokenForms,
            spokenFormType,
            id: id2
          }
        ])
      )
    ])
    // FIXME: Don't cast here; need to make our own mapValues with stronger typing
    // using tricks from our object.d.ts
  );
}

// ../cursorless-engine/src/generateSpokenForm/defaultSpokenForms/numbers.ts
var numbers = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
  "twenty one",
  "twenty two",
  "twenty three",
  "twenty four",
  "twenty five",
  "twenty six",
  "twenty seven",
  "twenty eight",
  "twenty nine",
  "thirty",
  "thirty one",
  "thirty two",
  "thirty three",
  "thirty four",
  "thirty five",
  "thirty six",
  "thirty seven",
  "thirty eight",
  "thirty nine",
  "forty",
  "forty one",
  "forty two",
  "forty three",
  "forty four",
  "forty five",
  "forty six",
  "forty seven",
  "forty eight",
  "forty nine",
  "fifty",
  "fifty one",
  "fifty two",
  "fifty three",
  "fifty four",
  "fifty five",
  "fifty six",
  "fifty seven",
  "fifty eight",
  "fifty nine",
  "sixty",
  "sixty one",
  "sixty two",
  "sixty three",
  "sixty four",
  "sixty five",
  "sixty six",
  "sixty seven",
  "sixty eight",
  "sixty nine",
  "seventy",
  "seventy one",
  "seventy two",
  "seventy three",
  "seventy four",
  "seventy five",
  "seventy six",
  "seventy seven",
  "seventy eight",
  "seventy nine",
  "eighty",
  "eighty one",
  "eighty two",
  "eighty three",
  "eighty four",
  "eighty five",
  "eighty six",
  "eighty seven",
  "eighty eight",
  "eighty nine",
  "ninety",
  "ninety one",
  "ninety two",
  "ninety three",
  "ninety four",
  "ninety five",
  "ninety six",
  "ninety seven",
  "ninety eight",
  "ninety nine"
];
var ordinals = [
  "zeroth",
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
  "eleventh",
  "twelfth",
  "thirteenth",
  "fourteenth",
  "fifteenth",
  "sixteenth",
  "seventeenth",
  "eighteenth",
  "nineteenth",
  "twentieth"
];
function numberToSpokenForm(number) {
  const result = numbers[number];
  if (result == null) {
    throw Error(`Unknown number '${number}'`);
  }
  return result;
}
function ordinalToSpokenForm(ordinal) {
  const result = ordinals[ordinal];
  if (result == null) {
    throw Error(`Unknown ordinal '${ordinal}'`);
  }
  return result;
}

// ../cursorless-engine/src/generateSpokenForm/primitiveTargetToSpokenForm.ts
var PrimitiveTargetSpokenFormGenerator = class {
  constructor(spokenFormMap) {
    this.spokenFormMap = spokenFormMap;
    this.handleModifier = this.handleModifier.bind(this);
  }
  handlePrimitiveTarget(target) {
    const components = [];
    if (target.modifiers != null) {
      components.push(target.modifiers.map(this.handleModifier));
    }
    if (target.mark != null) {
      components.push(this.handleMark(target.mark));
    }
    return components;
  }
  handleModifier(modifier) {
    switch (modifier.type) {
      case "cascading":
      case "modifyIfUntyped":
      case "preferredScope":
        throw new NoSpokenFormError(`Modifier '${modifier.type}'`);
      case "containingScope":
        if (modifier.ancestorIndex == null || modifier.ancestorIndex === 0) {
          return this.handleScopeType(modifier.scopeType);
        }
        if (modifier.ancestorIndex === 1) {
          return [
            this.spokenFormMap.modifierExtra.ancestor,
            this.handleScopeType(modifier.scopeType)
          ];
        }
        throw new NoSpokenFormError(
          `Modifier '${modifier.type}' with ancestor index ${modifier.ancestorIndex}`
        );
      case "everyScope":
        return [
          this.spokenFormMap.simpleModifier.everyScope,
          this.handleScopeType(modifier.scopeType)
        ];
      case "extendThroughStartOf":
      case "extendThroughEndOf": {
        const type2 = this.spokenFormMap.simpleModifier[modifier.type];
        return modifier.modifiers != null ? [type2, modifier.modifiers.map(this.handleModifier)] : [type2];
      }
      case "relativeScope":
        return modifier.offset === 0 ? this.handleRelativeScopeInclusive(modifier) : this.handleRelativeScopeExclusive(modifier);
      case "ordinalScope": {
        const scope = this.handleScopeType(modifier.scopeType);
        const isEvery = modifier.isEvery ? this.spokenFormMap.simpleModifier.everyScope : [];
        if (modifier.length === 1) {
          if (modifier.start === -1) {
            return [isEvery, this.spokenFormMap.modifierExtra.last, scope];
          }
          if (modifier.start === 0) {
            return [isEvery, this.spokenFormMap.modifierExtra.first, scope];
          }
          if (modifier.start < 0) {
            return [
              isEvery,
              ordinalToSpokenForm(Math.abs(modifier.start)),
              this.spokenFormMap.modifierExtra.last,
              scope
            ];
          }
          return [isEvery, ordinalToSpokenForm(modifier.start + 1), scope];
        }
        const number = numberToSpokenForm(modifier.length);
        if (modifier.start === 0) {
          return [
            isEvery,
            this.spokenFormMap.modifierExtra.first,
            number,
            pluralize(scope)
          ];
        }
        if (modifier.start === -modifier.length) {
          return [
            isEvery,
            this.spokenFormMap.modifierExtra.last,
            number,
            pluralize(scope)
          ];
        }
        throw new NoSpokenFormError(
          `'${modifier.type}' with count > 1 and offset away from start / end`
        );
      }
      case "range": {
        if (modifier.anchor.type === "ordinalScope" && modifier.active.type === "ordinalScope" && modifier.anchor.length === 1 && modifier.active.length === 1 && modifier.anchor.scopeType.type === modifier.active.scopeType.type) {
          const anchor = modifier.anchor.start === -1 ? this.spokenFormMap.modifierExtra.last : ordinalToSpokenForm(modifier.anchor.start + 1);
          const active = this.handleModifier(modifier.active);
          const connective = getRangeConnective(
            modifier.excludeAnchor,
            modifier.excludeActive
          );
          return [anchor, connective, active];
        }
        throw Error(`Modifier '${modifier.type}' is not fully implemented`);
      }
      default:
        return [this.spokenFormMap.simpleModifier[modifier.type]];
    }
  }
  handleRelativeScopeInclusive(modifier) {
    const scope = this.handleScopeType(modifier.scopeType);
    const isEvery = modifier.isEvery ? this.spokenFormMap.simpleModifier.everyScope : [];
    if (modifier.length === 1) {
      const direction = modifier.direction === "forward" ? connectives.forward : connectives.backward;
      return [isEvery, scope, direction];
    }
    const length = numberToSpokenForm(modifier.length);
    const scopePlural = pluralize(scope);
    if (modifier.direction === "forward") {
      return [isEvery, length, scopePlural];
    }
    return [isEvery, length, scopePlural, connectives.backward];
  }
  handleRelativeScopeExclusive(modifier) {
    const scope = this.handleScopeType(modifier.scopeType);
    const direction = modifier.direction === "forward" ? connectives.next : connectives.previous;
    const isEvery = modifier.isEvery ? this.spokenFormMap.simpleModifier.everyScope : [];
    if (modifier.offset === 1) {
      const number = numberToSpokenForm(modifier.length);
      if (modifier.length === 1) {
        return [isEvery, direction, scope];
      }
      const scopePlural = pluralize(scope);
      return [isEvery, direction, number, scopePlural];
    }
    if (modifier.length === 1) {
      const ordinal = ordinalToSpokenForm(modifier.offset);
      return [isEvery, ordinal, direction, scope];
    }
    throw new NoSpokenFormError(
      `${modifier.type} modifier with offset > 1 and length > 1`
    );
  }
  handleScopeType(scopeType) {
    switch (scopeType.type) {
      case "oneOf":
      case "surroundingPairInterior":
        throw new NoSpokenFormError(`Scope type '${scopeType.type}'`);
      case "glyph":
        return [
          this.spokenFormMap.complexScopeTypeType.glyph,
          getSpokenFormStrict(
            this.spokenFormMap.grapheme,
            "grapheme",
            scopeType.character
          )
        ];
      case "surroundingPair": {
        const pair = this.spokenFormMap.pairedDelimiter[scopeType.delimiter];
        if (scopeType.forceDirection != null) {
          return [
            this.spokenFormMap.surroundingPairForceDirection[scopeType.forceDirection],
            pair
          ];
        }
        return pair;
      }
      case "customRegex":
        return this.spokenFormMap.customRegex[scopeType.regex] ?? {
          type: "customizable",
          spokenForms: {
            spokenForms: [],
            isCustom: true,
            defaultSpokenForms: [],
            requiresTalonUpdate: false,
            isPrivate: false
          },
          spokenFormType: "customRegex",
          id: scopeType.regex
        };
      default:
        return this.spokenFormMap.simpleScopeTypeType[scopeType.type];
    }
  }
  handleMark(mark) {
    switch (mark.type) {
      case "decoratedSymbol": {
        const [color, shape] = mark.symbolColor.split("-");
        const components = [];
        if (color !== "default") {
          components.push(hatColorToSpokenForm(color));
        }
        if (shape != null) {
          components.push(hatShapeToSpokenForm(shape));
        }
        components.push(
          getSpokenFormStrict(
            this.spokenFormMap.grapheme,
            "grapheme",
            mark.character
          )
        );
        return components;
      }
      case "lineNumber": {
        return this.handleLineNumberMark(mark);
      }
      case "range": {
        if (mark.anchor.type === "lineNumber" && mark.active.type === "lineNumber") {
          const [typeAnchor, numberAnchor] = this.handleLineNumberMark(
            mark.anchor
          );
          const [typeActive, numberActive] = this.handleLineNumberMark(
            mark.active
          );
          if (typeAnchor === typeActive) {
            const connective = getRangeConnective(
              mark.excludeAnchor,
              mark.excludeActive
            );
            return [typeAnchor, numberAnchor, connective, numberActive];
          }
        }
        throw Error(`Mark '${mark.type}' is not fully implemented`);
      }
      case "explicit":
      case "keyboard":
      case "target":
        throw new NoSpokenFormError(`Mark '${mark.type}'`);
      default:
        return [marks[mark.type]];
    }
  }
  handleLineNumberMark(mark) {
    switch (mark.lineNumberType) {
      case "absolute":
        throw new NoSpokenFormError("Absolute line numbers");
      case "modulo100": {
        return [
          lineDirections.modulo100,
          numberToSpokenForm(mark.lineNumber + 1)
        ];
      }
      case "relative": {
        return [
          mark.lineNumber < 0 ? lineDirections.relativeUp : lineDirections.relativeDown,
          numberToSpokenForm(Math.abs(mark.lineNumber))
        ];
      }
    }
  }
};
function pluralize(name) {
  if (typeof name === "string") {
    return pluralizeString(name);
  }
  if (Array.isArray(name)) {
    if (name.length === 0) {
      return name;
    }
    const last2 = name[name.length - 1];
    return [...name.slice(0, -1), pluralize(last2)];
  }
  return {
    ...name,
    spokenForms: {
      ...name.spokenForms,
      spokenForms: name.spokenForms.spokenForms.map(pluralizeString)
    }
  };
}
function pluralizeString(name) {
  return `${name}s`;
}
function getSpokenFormStrict(map3, typeName, key) {
  const spokenForm = map3[key];
  if (spokenForm == null) {
    throw new NoSpokenFormError(`${typeName} '${key}'`);
  }
  return spokenForm;
}

// ../cursorless-engine/src/generateSpokenForm/generateSpokenForm.ts
var SpokenFormGenerator = class {
  constructor(spokenFormMap) {
    this.spokenFormMap = getSpokenFormComponentMap(spokenFormMap);
    this.primitiveGenerator = new PrimitiveTargetSpokenFormGenerator(
      this.spokenFormMap
    );
  }
  getSpokenFormForSingleTerm(type2, id2) {
    return this.componentsToSpokenForm(() => {
      const value = this.spokenFormMap[type2][id2];
      if (value == null) {
        throw new NoSpokenFormError(`${type2} with id ${id2}`);
      }
      return value;
    });
  }
  /**
   * Given a command, generates its spoken form.
   * @param command The command to generate a spoken form for
   * @returns The spoken form of the command
   */
  processCommand(command) {
    return this.componentsToSpokenForm(() => this.handleAction(command.action));
  }
  /**
   * Given a scope type, generates its spoken form.
   * @param scopeType The scope type to generate a spoken form for
   * @returns The spoken form of the scope type
   */
  processScopeType(scopeType) {
    return this.componentsToSpokenForm(() => [
      this.primitiveGenerator.handleScopeType(scopeType)
    ]);
  }
  /**
   * Given a function that returns a spoken form component, generates a spoken
   * form for that component by flattening the component and performing a
   * cartesian product over any elements that have multiple ways to be spoken.
   * Note that this spoken form object can correspond to multiple actual spoken
   * forms, consisting of a preferred spoken form and a list of alternative
   * spoken forms.
   *
   * Note that today, we arbitrarily choose the first spoken form as the
   * preferred spoken form, and the rest as alternative spoken forms.
   *
   * If the function throws a {@link NoSpokenFormError}, returns an error spoken
   * form object instead.
   *
   * @param getComponents A function that returns the components to generate a
   * spoken form for
   * @returns A spoken form for the given components
   */
  componentsToSpokenForm(getComponents) {
    try {
      return {
        type: "success",
        spokenForms: constructSpokenForms(getComponents())
      };
    } catch (e) {
      if (e instanceof NoSpokenFormError) {
        return {
          type: "error",
          reason: e.reason,
          requiresTalonUpdate: e.requiresTalonUpdate,
          isPrivate: e.isPrivate
        };
      }
      throw e;
    }
  }
  handleAction(action) {
    switch (action.name) {
      case "editNew":
      case "getText":
      case "replace":
      case "executeCommand":
      case "parsed":
      case "private.getTargets":
      case "private.setKeyboardTarget":
        throw new NoSpokenFormError(`Action '${action.name}'`);
      case "replaceWithTarget":
      case "moveToTarget":
        return [
          this.spokenFormMap.action[action.name],
          this.handleTarget(action.source),
          this.handleDestination(action.destination)
        ];
      case "swapTargets":
        return [
          this.spokenFormMap.action[action.name],
          this.handleTarget(action.target1),
          connectives.swapConnective,
          this.handleTarget(action.target2)
        ];
      case "callAsFunction":
        if (action.argument.type === "implicit") {
          return [
            this.spokenFormMap.action[action.name],
            this.handleTarget(action.callee)
          ];
        }
        return [
          this.spokenFormMap.action[action.name],
          this.handleTarget(action.callee),
          "on",
          this.handleTarget(action.argument)
        ];
      case "wrapWithPairedDelimiter":
      case "rewrapWithPairedDelimiter":
        return [
          surroundingPairDelimitersToSpokenForm(
            this.spokenFormMap,
            action.left,
            action.right
          ),
          this.spokenFormMap.action[action.name],
          this.handleTarget(action.target)
        ];
      case "pasteFromClipboard":
        return [
          this.spokenFormMap.action[action.name],
          this.handleDestination(action.destination)
        ];
      case "insertSnippet":
        return [
          this.spokenFormMap.action[action.name],
          insertionSnippetToSpokenForm(action.snippetDescription),
          this.handleDestination(action.destination)
        ];
      case "generateSnippet":
        if (action.snippetName != null) {
          throw new NoSpokenFormError(`${action.name}.snippetName`);
        }
        return [
          this.spokenFormMap.action[action.name],
          this.handleTarget(action.target)
        ];
      case "wrapWithSnippet":
        return [
          wrapperSnippetToSpokenForm(action.snippetDescription),
          this.spokenFormMap.action[action.name],
          this.handleTarget(action.target)
        ];
      case "highlight": {
        if (action.highlightId != null) {
          throw new NoSpokenFormError(`${action.name}.highlightId`);
        }
        return [
          this.spokenFormMap.action[action.name],
          this.handleTarget(action.target)
        ];
      }
      default: {
        return [
          this.spokenFormMap.action[action.name],
          this.handleTarget(action.target)
        ];
      }
    }
  }
  handleTarget(target) {
    switch (target.type) {
      case "list":
        if (target.elements.length < 2) {
          throw new NoSpokenFormError("List target with < 2 elements");
        }
        return target.elements.map(
          (element, i) => i === 0 ? this.handleTarget(element) : [connectives.listConnective, this.handleTarget(element)]
        );
      case "range": {
        const anchor = this.handleTarget(target.anchor);
        const active = this.handleTarget(target.active);
        const connective = getRangeConnective(
          target.excludeAnchor,
          target.excludeActive,
          target.rangeType
        );
        return [anchor, connective, active];
      }
      case "primitive":
        return this.primitiveGenerator.handlePrimitiveTarget(target);
      case "implicit":
        return [];
    }
  }
  handleDestination(destination) {
    switch (destination.type) {
      case "list":
        if (destination.destinations.length < 2) {
          throw new NoSpokenFormError("List destination with < 2 elements");
        }
        return destination.destinations.map(
          (destination2, i) => i === 0 ? this.handleDestination(destination2) : [connectives.listConnective, this.handleDestination(destination2)]
        );
      case "primitive":
        return [
          this.handleInsertionMode(destination.insertionMode),
          this.handleTarget(destination.target)
        ];
      case "implicit":
        return [];
    }
  }
  handleInsertionMode(insertionMode2) {
    switch (insertionMode2) {
      case "to":
        return connectives.sourceDestinationConnective;
      case "before":
        return connectives.before;
      case "after":
        return connectives.after;
    }
  }
};
function constructSpokenForms(component) {
  if (typeof component === "string") {
    return [component];
  }
  if (Array.isArray(component)) {
    if (component.length === 0) {
      return [""];
    }
    return cartesianProduct(component.map(constructSpokenForms)).map(
      (words) => words.filter((word) => word.length !== 0).join(" ")
    );
  }
  if (component.spokenForms.spokenForms.length === 0) {
    const componentInfo = `${camelCaseToAllDown(
      component.spokenFormType
    )} with id ${component.id}`;
    let helpInfo;
    if (component.spokenForms.isPrivate) {
      helpInfo = "this is a private spoken form currently only for internal experimentation";
    } else if (component.spokenForms.requiresTalonUpdate) {
      helpInfo = "please update talon to the latest version (see https://www.cursorless.org/docs/user/updating/)";
    } else {
      helpInfo = "please see https://www.cursorless.org/docs/user/customization/ for more information";
    }
    throw new NoSpokenFormError(
      `${componentInfo}; ${helpInfo}`,
      component.spokenForms.requiresTalonUpdate,
      component.spokenForms.isPrivate
    );
  }
  return component.spokenForms.spokenForms;
}
function cartesianProduct(arrays) {
  if (arrays.length === 0) {
    return [];
  }
  if (arrays.length === 1) {
    return arrays[0].map((element) => [element]);
  }
  const [first, ...rest] = arrays;
  const restCartesianProduct = cartesianProduct(rest);
  return first.flatMap(
    (element) => restCartesianProduct.map((restElement) => [element, ...restElement])
  );
}

// ../cursorless-engine/src/spokenForms/CustomSpokenForms.ts
var CustomSpokenForms = class {
  constructor(talonSpokenForms) {
    this.talonSpokenForms = talonSpokenForms;
    this.notifier = new Notifier();
    this.spokenFormMap_ = { ...defaultSpokenFormMap };
    /**
     * Registers a callback to be run when the custom spoken forms change.
     * @param callback The callback to run when the scope ranges change
     * @returns A {@link Disposable} which will stop the callback from running
     */
    this.onDidChangeCustomSpokenForms = this.notifier.registerListener;
    this.disposable = talonSpokenForms.onDidChange(
      () => this.updateSpokenFormMaps().catch(() => {
      })
    );
    this.customSpokenFormsInitialized = this.updateSpokenFormMaps();
    this.customSpokenFormsInitialized.catch(() => {
    });
  }
  get spokenFormMap() {
    return this.spokenFormMap_;
  }
  /**
   * If `true`, indicates they need to update their Talon files to get the
   * machinery used to share spoken forms from Talon to the VSCode extension.
   */
  get needsInitialTalonUpdate() {
    return this.needsInitialTalonUpdate_;
  }
  async updateSpokenFormMaps() {
    let allCustomEntries;
    try {
      allCustomEntries = await this.talonSpokenForms.getSpokenFormEntries();
      if (allCustomEntries.length === 0) {
        throw new Error("Custom spoken forms list empty");
      }
    } catch (err) {
      if (err instanceof NeedsInitialTalonUpdateError) {
        this.needsInitialTalonUpdate_ = true;
      } else if (err instanceof DisabledCustomSpokenFormsError) {
      } else {
        console.error("Error loading custom spoken forms", err);
        const msg = err.message.replace(/\.$/, "");
        void showError(
          ide().messages,
          "CustomSpokenForms.updateSpokenFormMaps",
          `Error loading custom spoken forms: ${msg}. Falling back to default spoken forms.`
        );
      }
      this.spokenFormMap_ = { ...defaultSpokenFormMap };
      this.notifier.notifyListeners();
      throw err;
    }
    for (const entryType of SUPPORTED_ENTRY_TYPES) {
      updateEntriesForType(
        this.spokenFormMap_,
        entryType,
        defaultSpokenFormInfoMap[entryType],
        Object.fromEntries(
          allCustomEntries.filter((entry) => entry.type === entryType).map(({ id: id2, spokenForms }) => [id2, spokenForms])
        )
      );
    }
    this.notifier.notifyListeners();
  }
  getCustomRegexScopeTypes() {
    return Object.keys(this.spokenFormMap_.customRegex).map((regex) => ({
      type: "customRegex",
      regex
    }));
  }
  dispose() {
    this.disposable.dispose();
  }
};
function updateEntriesForType(spokenFormMapToUpdate, key, defaultEntries, customEntries) {
  const ids = Array.from(
    /* @__PURE__ */ new Set([...Object.keys(defaultEntries), ...Object.keys(customEntries)])
  );
  const obj = {};
  for (const id2 of ids) {
    const { defaultSpokenForms = [], isPrivate: isPrivate2 = false } = defaultEntries[id2] ?? {};
    const customSpokenForms = customEntries[id2];
    obj[id2] = customSpokenForms == null ? (
      // No entry for the given id. This either means that the user needs to
      // update Talon, or it's a private spoken form.
      {
        defaultSpokenForms,
        spokenForms: [],
        // If it's not a private spoken form, then it's a new scope type
        requiresTalonUpdate: !isPrivate2,
        isCustom: false,
        isPrivate: isPrivate2
      }
    ) : (
      // We have an entry for the given id
      {
        defaultSpokenForms,
        spokenForms: customSpokenForms,
        requiresTalonUpdate: false,
        isCustom: !isEqual_default(defaultSpokenForms, customSpokenForms),
        isPrivate: isPrivate2
      }
    );
  }
  spokenFormMapToUpdate[key] = obj;
}

// ../cursorless-engine/src/generateSpokenForm/CustomSpokenFormGeneratorImpl.ts
var CustomSpokenFormGeneratorImpl = class {
  constructor(talonSpokenForms) {
    this.customSpokenForms = new CustomSpokenForms(talonSpokenForms);
    this.customSpokenFormsInitialized = this.customSpokenForms.customSpokenFormsInitialized;
    this.spokenFormGenerator = new SpokenFormGenerator(
      this.customSpokenForms.spokenFormMap
    );
    this.disposable = this.customSpokenForms.onDidChangeCustomSpokenForms(
      () => {
        this.spokenFormGenerator = new SpokenFormGenerator(
          this.customSpokenForms.spokenFormMap
        );
      }
    );
  }
  onDidChangeCustomSpokenForms(listener) {
    return this.customSpokenForms.onDidChangeCustomSpokenForms(listener);
  }
  commandToSpokenForm(command) {
    return this.spokenFormGenerator.processCommand(command);
  }
  scopeTypeToSpokenForm(scopeType) {
    return this.spokenFormGenerator.processScopeType(scopeType);
  }
  actionIdToSpokenForm(actionId) {
    return this.spokenFormGenerator.getSpokenFormForSingleTerm(
      "action",
      actionId
    );
  }
  graphemeToSpokenForm(grapheme) {
    return this.spokenFormGenerator.getSpokenFormForSingleTerm(
      "grapheme",
      grapheme
    );
  }
  getCustomRegexScopeTypes() {
    return this.customSpokenForms.getCustomRegexScopeTypes();
  }
  get needsInitialTalonUpdate() {
    return this.customSpokenForms.needsInitialTalonUpdate;
  }
  dispose() {
    this.disposable.dispose();
  }
};

// ../../node_modules/.pnpm/itertools@2.3.2/node_modules/itertools/dist/index.js
function* flatten2(iterableOfIterables) {
  for (const iterable of iterableOfIterables) {
    for (const item of iterable) {
      yield item;
    }
  }
}
function* itake(n, iterable) {
  const it = iter(iterable);
  let count2 = n;
  while (count2-- > 0) {
    const s = it.next();
    if (!s.done) {
      yield s.value;
    } else {
      return;
    }
  }
}
function* pairwise(iterable) {
  const it = iter(iterable);
  const first2 = it.next();
  if (first2.done) {
    return;
  }
  let r1 = first2.value;
  for (const r2 of it) {
    yield [r1, r2];
    r1 = r2;
  }
}
var SENTINEL = Symbol();
function* count(start = 0, step = 1) {
  let n = start;
  for (; ; ) {
    yield n;
    n += step;
  }
}
function* ifilter(iterable, predicate) {
  for (const value of iterable) {
    if (predicate(value)) {
      yield value;
    }
  }
}
function* imap(iterable, mapper) {
  for (const value of iterable) {
    yield mapper(value);
  }
}
function* islice(iterable, stopOrStart, possiblyStop, step = 1) {
  let start, stop;
  if (possiblyStop !== void 0) {
    start = stopOrStart;
    stop = possiblyStop;
  } else {
    start = 0;
    stop = stopOrStart;
  }
  if (start < 0)
    throw new Error("start cannot be negative");
  if (stop !== null && stop < 0)
    throw new Error("stop cannot be negative");
  if (step <= 0)
    throw new Error("step cannot be negative");
  let i = -1;
  const it = iter(iterable);
  let res;
  while (true) {
    i++;
    if (stop !== null && i >= stop)
      return;
    res = it.next();
    if (res.done)
      return;
    if (i < start)
      continue;
    if ((i - start) % step === 0) {
      yield res.value;
    }
  }
}
function* takewhile(iterable, predicate) {
  const it = iter(iterable);
  let res;
  while (!(res = it.next()).done) {
    const value = res.value;
    if (!predicate(value))
      return;
    yield value;
  }
}
function iter(iterable) {
  return iterable[Symbol.iterator]();
}
function map2(iterable, mapper) {
  return Array.from(imap(iterable, mapper));
}
function range_(start, stop, step) {
  const counter = count(start, step);
  const pred = step >= 0 ? (n) => n < stop : (n) => n > stop;
  return takewhile(counter, pred);
}
function range2(startOrStop, definitelyStop, step = 1) {
  if (definitelyStop !== void 0) {
    return range_(startOrStop, definitelyStop, step);
  } else {
    return range_(0, startOrStop, step);
  }
}
function flatmap(iterable, mapper) {
  return flatten2(imap(iterable, mapper));
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/compareTargetScopes.ts
function compareTargetScopes(direction, position, { domain: a }, { domain: b }) {
  return direction === "forward" ? compareTargetScopesForward(position, a, b) : compareTargetScopesBackward(position, a, b);
}
function compareTargetScopesForward(position, a, b) {
  const aIsStartVisible = a.start.isAfterOrEqual(position);
  const bIsStartVisible = b.start.isAfterOrEqual(position);
  if (aIsStartVisible && bIsStartVisible) {
    const value2 = a.start.compareTo(b.start);
    return value2 === 0 ? a.end.compareTo(b.end) : value2;
  }
  if (!aIsStartVisible && !bIsStartVisible) {
    const value2 = a.end.compareTo(b.end);
    return value2 === 0 ? -a.start.compareTo(b.start) : value2;
  }
  if (!aIsStartVisible && bIsStartVisible) {
    const value2 = a.end.compareTo(b.start);
    return value2 !== 0 ? value2 : b.isEmpty ? 1 : -1;
  }
  const value = a.start.compareTo(b.end);
  return value !== 0 ? value : a.isEmpty ? -1 : 1;
}
function compareTargetScopesBackward(position, a, b) {
  const aIsEndVisible = a.end.isBeforeOrEqual(position);
  const bIsEndVisible = b.end.isBeforeOrEqual(position);
  if (aIsEndVisible && bIsEndVisible) {
    const value2 = -a.end.compareTo(b.end);
    return value2 === 0 ? -a.start.compareTo(b.start) : value2;
  }
  if (!aIsEndVisible && !bIsEndVisible) {
    const value2 = -a.start.compareTo(b.start);
    return value2 === 0 ? a.end.compareTo(b.end) : value2;
  }
  if (!aIsEndVisible && bIsEndVisible) {
    const value2 = -a.start.compareTo(b.end);
    return value2 !== 0 ? value2 : b.isEmpty ? 1 : -1;
  }
  const value = -a.end.compareTo(b.start);
  return value !== 0 ? value : a.isEmpty ? -1 : 1;
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/shouldYieldScope.ts
function shouldYieldScope(initialPosition, currentPosition, direction, requirements, previousScope, scope) {
  return checkRequirements(initialPosition, requirements, previousScope, scope) && // Note that we're using `currentPosition` instead of `initialPosition`
  // below, because we want to filter out scopes that are strictly contained
  // by previous scopes.  However, if we want to include descendant scopes,
  // then we do use the initial position
  (previousScope == null || compareTargetScopes(
    direction,
    requirements.includeDescendantScopes ? initialPosition : currentPosition,
    previousScope,
    scope
  ) < 0);
}
function checkRequirements(position, requirements, previousScope, scope) {
  const {
    containment,
    distalPosition,
    allowAdjacentScopes,
    skipAncestorScopes
  } = requirements;
  const { domain } = scope;
  switch (containment) {
    case "disallowed":
      if (domain.contains(position)) {
        return false;
      }
      break;
    case "disallowedIfStrict":
      if (strictlyContains(domain, position)) {
        return false;
      }
      break;
    case "required":
      if (!domain.contains(position)) {
        return false;
      }
      break;
  }
  if (skipAncestorScopes && previousScope != null && domain.contains(previousScope.domain)) {
    return false;
  }
  return partiallyContains(
    new Range(position, distalPosition),
    domain,
    allowAdjacentScopes
  );
}
function partiallyContains(range1, range22, allowAdjacent) {
  const intersection = range1.intersection(range22);
  if (intersection == null) {
    return false;
  }
  return !intersection.isEmpty || allowAdjacent || range22.isEmpty;
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/BaseScopeHandler.ts
var DEFAULT_REQUIREMENTS = {
  containment: null,
  allowAdjacentScopes: false,
  skipAncestorScopes: false,
  includeDescendantScopes: false
};
var BaseScopeHandler = class {
  constructor() {
    this.includeAdjacentInEvery = false;
  }
  *generateScopes(editor, position, direction, requirements = {}) {
    const hints = {
      ...DEFAULT_REQUIREMENTS,
      ...requirements,
      distalPosition: requirements.distalPosition ?? (direction === "forward" ? editor.document.range.end : editor.document.range.start)
    };
    let previousScope = void 0;
    let currentPosition = position;
    for (const scope of this.generateScopeCandidates(
      editor,
      position,
      direction,
      hints
    )) {
      if (shouldYieldScope(
        position,
        currentPosition,
        direction,
        hints,
        previousScope,
        scope
      )) {
        yield scope;
        previousScope = scope;
        currentPosition = direction === "forward" ? scope.domain.end : scope.domain.start;
      }
      if (this.canStopEarly(position, direction, hints, previousScope, scope)) {
        return;
      }
    }
  }
  canStopEarly(position, direction, requirements, previousScope, scope) {
    const { containment, distalPosition, skipAncestorScopes } = requirements;
    if (this.isHierarchical && !skipAncestorScopes) {
      return false;
    }
    const scopeToCheck = this.isHierarchical && skipAncestorScopes ? previousScope : scope;
    if (scopeToCheck == null) {
      return false;
    }
    if (containment === "required" && (direction === "forward" ? scopeToCheck.domain.end.isAfter(position) : scopeToCheck.domain.start.isBefore(position))) {
      return true;
    }
    if (direction === "forward" ? scopeToCheck.domain.end.isAfterOrEqual(distalPosition) : scopeToCheck.domain.start.isBeforeOrEqual(distalPosition)) {
      return true;
    }
    return false;
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/NestedScopeHandler.ts
var NestedScopeHandler = class extends BaseScopeHandler {
  constructor(scopeHandlerFactory, scopeType, languageId) {
    super();
    this.scopeHandlerFactory = scopeHandlerFactory;
    this.scopeType = scopeType;
    this.languageId = languageId;
    this.isHierarchical = false;
  }
  /**
   * We expand to this scope type before looking for instances of the scope type
   * handled by this scope handler.  In most cases the iteration scope will
   * suffice, but in some cases you want them to diverge.  For example, you
   * might want the default iteration scope to be `"file"`, but you don't need
   * to expand to the file just to find instances of the given scope type.
   */
  get searchScopeType() {
    return this.iterationScopeType;
  }
  get searchScopeHandler() {
    if (this._searchScopeHandler == null) {
      this._searchScopeHandler = this.scopeHandlerFactory.create(
        this.searchScopeType,
        this.languageId
      );
    }
    return this._searchScopeHandler;
  }
  generateScopeCandidates(editor, position, direction, hints) {
    const { containment, ...rest } = hints;
    const generator = this.searchScopeHandler.generateScopes(
      editor,
      position,
      direction,
      // If containment is disallowed, we need to unset that for the search
      // scope, because the search scope could contain position but nested
      // scopes do not.
      {
        containment: containment === "required" ? "required" : void 0,
        ...rest
      }
    );
    return flatmap(
      generator,
      (searchScope) => this.generateScopesInSearchScope(direction, searchScope)
    );
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/LineScopeHandler.ts
var LineScopeHandler = class extends BaseScopeHandler {
  constructor(_scopeType, _languageId) {
    super();
    this.scopeType = { type: "line" };
    this.iterationScopeType = {
      type: "paragraph"
    };
    this.isHierarchical = false;
    this.includeAdjacentInEvery = true;
  }
  *generateScopeCandidates(editor, position, direction) {
    if (direction === "forward") {
      for (let i = position.line; i < editor.document.lineCount; i++) {
        yield lineNumberToScope(editor, i);
      }
    } else {
      for (let i = position.line; i >= 0; i--) {
        yield lineNumberToScope(editor, i);
      }
    }
  }
};
function lineNumberToScope(editor, lineNumber) {
  const { range: range3 } = editor.document.lineAt(lineNumber);
  return {
    editor,
    domain: range3,
    getTargets: (isReversed) => [createLineTarget(editor, isReversed, range3)]
  };
}
function createLineTarget(editor, isReversed, range3) {
  return new LineTarget({
    editor,
    isReversed,
    contentRange: fitRangeToLineContent(editor, range3)
  });
}
function fitRangeToLineContent(editor, range3) {
  const startLine = editor.document.lineAt(range3.start);
  const endLine = editor.document.lineAt(range3.end);
  return new Range(
    startLine.rangeTrimmed?.start ?? startLine.range.start,
    endLine.rangeTrimmed?.end ?? endLine.range.end
  );
}

// ../cursorless-engine/src/util/getMatchesInRange.ts
function generateMatchesInRange(regex, editor, range3, direction) {
  const offset = editor.document.offsetAt(range3.start);
  const text = editor.document.getText(range3);
  const matchToRange = (match) => new Range(
    editor.document.positionAt(offset + match.index),
    editor.document.positionAt(offset + match.index + match[0].length)
  );
  regex.lastIndex = 0;
  return direction === "forward" ? imap(text.matchAll(regex), matchToRange) : Array.from(text.matchAll(regex), matchToRange).reverse();
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/IdentifierScopeHandler.ts
var IdentifierScopeHandler = class extends NestedScopeHandler {
  constructor() {
    super(...arguments);
    this.scopeType = { type: "identifier" };
    this.iterationScopeType = { type: "line" };
    this.regex = getMatcher(this.languageId).identifierMatcher;
  }
  generateScopesInSearchScope(direction, { editor, domain }) {
    return imap(
      generateMatchesInRange(this.regex, editor, domain, direction),
      (range3) => ({
        editor,
        domain: range3,
        getTargets: (isReversed) => [
          new TokenTarget({
            editor,
            contentRange: range3,
            isReversed
          })
        ]
      })
    );
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/isPreferredOverHelper.ts
function isPreferredOverHelper(scopeA, scopeB, matchers2) {
  const textA = scopeA.editor.document.getText(scopeA.domain);
  const textB = scopeB.editor.document.getText(scopeB.domain);
  for (const matcher2 of matchers2) {
    const aMatchesRegex = testRegex(matcher2, textA);
    const bMatchesRegex = testRegex(matcher2, textB);
    if (aMatchesRegex && !bMatchesRegex) {
      return true;
    }
    if (bMatchesRegex && !aMatchesRegex) {
      return false;
    }
  }
  return void 0;
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/CharacterScopeHandler.ts
var SPLIT_REGEX = /\p{L}\p{M}*|[\p{N}\p{P}\p{S}\p{Z}\p{C}]/gu;
var PREFERRED_SYMBOLS_REGEX = /[$]/g;
var NONWHITESPACE_REGEX = /\p{L}\p{M}*|[\p{N}\p{P}\p{S}]/gu;
var CharacterScopeHandler = class extends NestedScopeHandler {
  constructor() {
    super(...arguments);
    this.scopeType = { type: "character" };
    this.iterationScopeType = { type: "token" };
  }
  get searchScopeType() {
    return { type: "line" };
  }
  generateScopesInSearchScope(direction, { editor, domain }) {
    return imap(
      generateMatchesInRange(SPLIT_REGEX, editor, domain, direction),
      (range3) => ({
        editor,
        domain: range3,
        getTargets: (isReversed) => [
          new PlainTarget({
            editor,
            contentRange: range3,
            isReversed,
            isToken: false
          })
        ]
      })
    );
  }
  isPreferredOver(scopeA, scopeB) {
    const { identifierMatcher } = getMatcher(this.languageId);
    return isPreferredOverHelper(scopeA, scopeB, [
      identifierMatcher,
      PREFERRED_SYMBOLS_REGEX,
      NONWHITESPACE_REGEX
    ]);
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/WordScopeHandler/WordTokenizer.ts
var CAMEL_REGEX = /\p{Lu}?\p{Ll}+|\p{Lu}+(?!\p{Ll})|\p{N}+/gu;
var WordTokenizer = class {
  constructor(languageId) {
    this.wordRegex = getMatcher(languageId).wordMatcher;
  }
  splitIdentifier(text) {
    const wordMatches = matchText(text, this.wordRegex);
    return wordMatches.length > 1 ? wordMatches : (
      // Secondly try split on camel case
      matchText(text, CAMEL_REGEX)
    );
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/WordScopeHandler/WordScopeHandler.ts
var WordScopeHandler = class extends NestedScopeHandler {
  constructor() {
    super(...arguments);
    this.scopeType = { type: "word" };
    this.iterationScopeType = { type: "identifier" };
    this.wordTokenizer = new WordTokenizer(this.languageId);
  }
  getScopesInSearchScope({
    editor,
    domain
  }) {
    const { document } = editor;
    const offset = document.offsetAt(domain.start);
    const matches = this.wordTokenizer.splitIdentifier(
      document.getText(domain)
    );
    const contentRanges = matches.map(
      (match) => new Range(
        document.positionAt(offset + match.index),
        document.positionAt(offset + match.index + match.text.length)
      )
    );
    return contentRanges.map((range3, i) => ({
      editor,
      domain: range3,
      getTargets: (isReversed) => {
        const previousContentRange = i > 0 ? contentRanges[i - 1] : null;
        const nextContentRange = i + 1 < contentRanges.length ? contentRanges[i + 1] : null;
        return [
          constructTarget(
            isReversed,
            editor,
            previousContentRange,
            range3,
            nextContentRange
          )
        ];
      }
    }));
  }
  generateScopesInSearchScope(direction, searchScope) {
    const scopes = this.getScopesInSearchScope(searchScope);
    if (direction === "backward") {
      scopes.reverse();
    }
    return scopes;
  }
};
function constructTarget(isReversed, editor, previousContentRange, contentRange, nextContentRange) {
  const leadingDelimiterRange = previousContentRange != null && contentRange.start.isAfter(previousContentRange.end) ? new Range(previousContentRange.end, contentRange.start) : void 0;
  const trailingDelimiterRange = nextContentRange != null && nextContentRange.start.isAfter(contentRange.end) ? new Range(contentRange.end, nextContentRange.start) : void 0;
  const isInDelimitedList = leadingDelimiterRange != null || trailingDelimiterRange != null;
  const insertionDelimiter = isInDelimitedList ? editor.document.getText(leadingDelimiterRange ?? trailingDelimiterRange) : "";
  return new SubTokenWordTarget({
    editor,
    isReversed,
    contentRange,
    insertionDelimiter,
    leadingDelimiterRange,
    trailingDelimiterRange
  });
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/TokenScopeHandler.ts
var PREFERRED_SYMBOLS_REGEX2 = /[$]/g;
var TokenScopeHandler = class extends NestedScopeHandler {
  constructor() {
    super(...arguments);
    this.scopeType = { type: "token" };
    this.iterationScopeType = { type: "line" };
    this.regex = getMatcher(this.languageId).tokenMatcher;
  }
  generateScopesInSearchScope(direction, { editor, domain }) {
    return imap(
      generateMatchesInRange(this.regex, editor, domain, direction),
      (range3) => ({
        editor,
        domain: range3,
        getTargets: (isReversed) => [
          new TokenTarget({
            editor,
            contentRange: range3,
            isReversed
          })
        ]
      })
    );
  }
  isPreferredOver(scopeA, scopeB) {
    const { identifierMatcher } = getMatcher(this.languageId);
    return isPreferredOverHelper(scopeA, scopeB, [
      identifierMatcher,
      PREFERRED_SYMBOLS_REGEX2
    ]);
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/DocumentScopeHandler.ts
var DocumentScopeHandler = class extends BaseScopeHandler {
  constructor(_scopeType, _languageId) {
    super();
    this.scopeType = { type: "document" };
    this.iterationScopeType = { type: "document" };
    this.isHierarchical = false;
  }
  *generateScopeCandidates(editor, _position, _direction) {
    const contentRange = editor.document.range;
    yield {
      editor,
      domain: contentRange,
      getTargets: (isReversed) => [
        new DocumentTarget({
          editor,
          isReversed,
          contentRange
        })
      ]
    };
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/TreeSitterScopeHandler/mergeAdjacentBy.ts
function mergeAdjacentBy(input, isEqual2, merge2) {
  const result = [];
  let current2 = [];
  for (const elem of input) {
    if (current2.length === 0 || isEqual2(current2[current2.length - 1], elem)) {
      current2.push(elem);
    } else {
      result.push(merge2(current2));
      current2 = [elem];
    }
  }
  if (current2.length > 0) {
    result.push(merge2(current2));
  }
  return result;
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/TreeSitterScopeHandler/BaseTreeSitterScopeHandler.ts
var BaseTreeSitterScopeHandler = class extends BaseScopeHandler {
  constructor(query) {
    super();
    this.query = query;
  }
  *generateScopeCandidates(editor, position, direction, _hints) {
    const { document } = editor;
    const scopes = this.query.matches(document).map((match) => this.matchToScope(editor, match)).filter((scope) => scope != null).sort((a, b) => compareTargetScopes(direction, position, a, b));
    yield* mergeAdjacentBy(
      scopes,
      (a, b) => a.domain.isRangeEqual(b.domain),
      (equivalentScopes) => {
        if (equivalentScopes.length === 1) {
          return equivalentScopes[0];
        }
        return {
          ...equivalentScopes[0],
          getTargets(isReversed) {
            const targets = uniqWith_default(
              equivalentScopes.flatMap((scope) => scope.getTargets(isReversed)),
              (a, b) => a.isEqual(b)
            );
            if (targets.length > 1 && !equivalentScopes.every((scope) => scope.allowMultiple)) {
              const message = "Please use #allow-multiple! predicate in your query to allow multiple matches for this scope type";
              void showError(
                ide().messages,
                "BaseTreeSitterScopeHandler.allow-multiple",
                message
              );
              if (ide().runMode === "test") {
                throw Error(message);
              }
            }
            return targets;
          }
        };
      }
    );
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/TreeSitterScopeHandler/captureUtils.ts
function getRelatedCapture(match, scopeTypeType, relationship, matchHasScopeType) {
  if (matchHasScopeType) {
    return findCaptureByName(
      match,
      `${scopeTypeType}.${relationship}`,
      `_.${relationship}`
    );
  }
  return findCaptureByName(match, `${scopeTypeType}.${relationship}`) ?? (findCaptureByName(match, scopeTypeType) != null ? findCaptureByName(match, `_.${relationship}`) : void 0);
}
function getRelatedRange(match, scopeTypeType, relationship, matchHasScopeType) {
  return getRelatedCapture(
    match,
    scopeTypeType,
    relationship,
    matchHasScopeType
  )?.range;
}
function findCaptureByName(match, ...names) {
  return match.captures.find(
    (capture) => names.some((name) => capture.name === name)
  );
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/TreeSitterScopeHandler/TreeSitterIterationScopeHandler.ts
var TreeSitterIterationScopeHandler = class extends BaseTreeSitterScopeHandler {
  constructor(query, iterateeScopeType) {
    super(query);
    this.iterateeScopeType = iterateeScopeType;
    this.isHierarchical = true;
    // Doesn't correspond to any scope type
    this.scopeType = void 0;
  }
  // Doesn't have any iteration scope type itself; that would correspond to
  // something like "every every"
  get iterationScopeType() {
    throw Error("Not implemented");
  }
  matchToScope(editor, match) {
    const scopeTypeType = this.iterateeScopeType.type;
    const capture = getRelatedCapture(match, scopeTypeType, "iteration", false);
    if (capture == null) {
      return void 0;
    }
    const { range: contentRange, allowMultiple } = capture;
    const domain = getRelatedRange(match, scopeTypeType, "iteration.domain", false) ?? contentRange;
    return {
      editor,
      domain,
      allowMultiple,
      getTargets: (isReversed) => [
        new PlainTarget({
          editor,
          isReversed,
          contentRange
        })
      ]
    };
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/TreeSitterScopeHandler/TreeSitterScopeHandler.ts
var TreeSitterScopeHandler = class extends BaseTreeSitterScopeHandler {
  constructor(query, scopeType) {
    super(query);
    this.scopeType = scopeType;
    this.isHierarchical = true;
  }
  // We just create a custom scope handler that doesn't necessarily correspond
  // to any well-defined scope type
  get iterationScopeType() {
    return {
      type: "custom",
      scopeHandler: new TreeSitterIterationScopeHandler(
        this.query,
        this.scopeType
      )
    };
  }
  matchToScope(editor, match) {
    const scopeTypeType = this.scopeType.type;
    const capture = findCaptureByName(match, scopeTypeType);
    if (capture == null) {
      return void 0;
    }
    const { range: contentRange, allowMultiple, insertionDelimiter } = capture;
    const domain = getRelatedRange(match, scopeTypeType, "domain", true) ?? contentRange;
    const removalRange = getRelatedRange(match, scopeTypeType, "removal", true);
    const interiorRange = getRelatedRange(
      match,
      scopeTypeType,
      "interior",
      true
    );
    const prefixRange = getRelatedRange(
      match,
      scopeTypeType,
      "prefix",
      true
    )?.with(void 0, contentRange.start);
    const leadingDelimiterRange = getRelatedRange(
      match,
      scopeTypeType,
      "leading",
      true
    )?.with(void 0, prefixRange?.start ?? contentRange.start);
    const trailingDelimiterRange = getRelatedRange(
      match,
      scopeTypeType,
      "trailing",
      true
    )?.with(contentRange.end);
    return {
      editor,
      domain,
      allowMultiple,
      getTargets: (isReversed) => [
        new ScopeTypeTarget({
          scopeTypeType,
          editor,
          isReversed,
          contentRange,
          prefixRange,
          removalRange,
          leadingDelimiterRange,
          trailingDelimiterRange,
          interiorRange,
          insertionDelimiter
        })
      ]
    };
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/IteratorInfo.ts
function getInitialIteratorInfos(iterators) {
  return iterators.flatMap((iterator) => {
    const { value, done } = iterator.next();
    return done ? [] : [
      {
        iterator,
        value
      }
    ];
  });
}
function advanceIteratorsUntil(iteratorInfos, criterion) {
  return iteratorInfos.flatMap((iteratorInfo) => {
    const { iterator } = iteratorInfo;
    let { value } = iteratorInfo;
    let done = false;
    while (!done && !criterion(value)) {
      ({ value, done } = iterator.next());
    }
    if (done) {
      return [];
    }
    return [{ iterator, value }];
  });
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/OneOfScopeHandler.ts
var OneOfScopeHandler = class _OneOfScopeHandler extends BaseScopeHandler {
  constructor(scopeType, scopeHandlers, getIterationScopeType) {
    super();
    this.scopeType = scopeType;
    this.scopeHandlers = scopeHandlers;
    this.getIterationScopeType = getIterationScopeType;
    this.isHierarchical = true;
  }
  static create(scopeHandlerFactory, scopeType, languageId) {
    const scopeHandlers = scopeType.scopeTypes.map(
      (scopeType2) => {
        const handler = scopeHandlerFactory.create(scopeType2, languageId);
        if (handler == null) {
          throw new Error(`No available scope handler for '${scopeType2.type}'`);
        }
        return handler;
      }
    );
    const iterationScopeType = () => ({
      type: "custom",
      scopeHandler: new _OneOfScopeHandler(
        void 0,
        scopeHandlers.map(
          (scopeHandler) => scopeHandlerFactory.create(
            scopeHandler.iterationScopeType,
            languageId
          )
        ),
        () => {
          throw new Error("Not implemented");
        }
      )
    });
    return new _OneOfScopeHandler(scopeType, scopeHandlers, iterationScopeType);
  }
  get iterationScopeType() {
    return this.getIterationScopeType();
  }
  *generateScopeCandidates(editor, position, direction, hints) {
    const iterators = this.scopeHandlers.map(
      (scopeHandler) => scopeHandler.generateScopes(editor, position, direction, hints)[Symbol.iterator]()
    );
    let iteratorInfos = getInitialIteratorInfos(iterators);
    while (iteratorInfos.length > 0) {
      iteratorInfos.sort(
        (a, b) => compareTargetScopes(direction, position, a.value, b.value)
      );
      const currentScope2 = iteratorInfos[0].value;
      yield currentScope2;
      iteratorInfos = advanceIteratorsUntil(
        iteratorInfos,
        (scope) => compareTargetScopes(direction, position, currentScope2, scope) < 0
      );
    }
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/ParagraphScopeHandler.ts
var ParagraphScopeHandler = class extends BaseScopeHandler {
  constructor(_scopeType, _languageId) {
    super();
    this.scopeType = { type: "paragraph" };
    this.iterationScopeType = { type: "document" };
    this.isHierarchical = false;
  }
  *generateScopeCandidates(editor, position, direction) {
    const { document } = editor;
    const offset = direction === "forward" ? 1 : -1;
    const stop = direction === "forward" ? document.lineCount : -1;
    let startLine = getStartLine(document, position, direction);
    let previousLine = editor.document.lineAt(position);
    for (let i = position.line + offset; i !== stop; i += offset) {
      const currentLine = editor.document.lineAt(i);
      if (currentLine.isEmptyOrWhitespace) {
        if (startLine != null) {
          yield createScope2(editor, startLine.range.union(previousLine.range));
          startLine = void 0;
        }
      } else if (startLine == null) {
        startLine = currentLine;
      }
      previousLine = currentLine;
    }
    if (startLine != null) {
      yield createScope2(editor, startLine.range.union(previousLine.range));
    }
  }
};
function getStartLine(document, position, direction) {
  const offset = direction === "forward" ? -1 : 1;
  const stop = direction === "forward" ? -1 : document.lineCount;
  let startLine = document.lineAt(position);
  if (startLine.isEmptyOrWhitespace) {
    return void 0;
  }
  for (let i = position.line + offset; i !== stop; i += offset) {
    const line = document.lineAt(i);
    if (line.isEmptyOrWhitespace) {
      break;
    }
    startLine = line;
  }
  return startLine;
}
function createScope2(editor, domain) {
  return {
    editor,
    domain,
    getTargets: (isReversed) => [
      new ParagraphTarget({
        editor,
        isReversed,
        contentRange: fitRangeToLineContent(editor, domain)
      })
    ]
  };
}

// ../sentence-parser/src/stringHelper.ts
function endsWithChar(word, c) {
  if (c.length > 1) {
    return c.indexOf(word.slice(-1)) > -1;
  }
  return word.slice(-1) === c;
}
function endsWith(word, end) {
  return word.slice(word.length - end.length) === end;
}

// ../sentence-parser/src/Match.ts
var abbreviations;
var englishAbbreviations = [
  "al",
  "adj",
  "assn",
  "Ave",
  "BSc",
  "MSc",
  "Cell",
  "Ch",
  "Co",
  "cc",
  "Corp",
  "Dem",
  "Dept",
  "ed",
  "eg",
  "Eq",
  "Eqs",
  "est",
  "est",
  "etc",
  "Ex",
  "ext",
  // + number?
  "Fig",
  "fig",
  "Figs",
  "figs",
  "i.e",
  "ie",
  "Inc",
  "inc",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
  "jr",
  "mi",
  "Miss",
  "Mrs",
  "Mr",
  "Ms",
  "Mol",
  "mt",
  "mts",
  "no",
  "Nos",
  "PhD",
  "MD",
  "BA",
  "MA",
  "MM",
  "pl",
  "pop",
  "pp",
  "Prof",
  "Dr",
  "pt",
  "Ref",
  "Refs",
  "Rep",
  "repr",
  "rev",
  "Sec",
  "Secs",
  "Sgt",
  "Col",
  "Gen",
  "Rep",
  "Sen",
  "Gov",
  "Lt",
  "Maj",
  "Capt",
  "St",
  "Sr",
  "sr",
  "Jr",
  "jr",
  "Rev",
  "Sun",
  "Mon",
  "Tu",
  "Tue",
  "Tues",
  "Wed",
  "Th",
  "Thu",
  "Thur",
  "Thurs",
  "Fri",
  "Sat",
  "trans",
  "Univ",
  "Viz",
  "Vol",
  "vs",
  "v"
];
function setAbbreviations(abbr) {
  if (abbr) {
    abbreviations = abbr;
  } else {
    abbreviations = englishAbbreviations;
  }
}
function isCapitalized(str2) {
  return /^[A-Z][a-z].*/.test(str2) || isNumber(str2);
}
function isSentenceStarter(str2) {
  return isCapitalized(str2) || /``|"|'/.test(str2.substring(0, 2));
}
function isCommonAbbreviation(str2) {
  const noSymbols = str2.replace(/[-'`~!@#$%^&*()_|+=?;:'",.<>{}[\]\\/]/gi, "");
  return ~abbreviations.indexOf(noSymbols);
}
function isTimeAbbreviation(word, next) {
  if (word === "a.m." || word === "p.m.") {
    const tmp = next.replace(/\W+/g, "").slice(-3).toLowerCase();
    if (tmp === "day") {
      return true;
    }
  }
  return false;
}
function isDottedAbbreviation(word) {
  const matches = word.replace(/[()[]{}]/g, "").match(/(.\.)*/);
  return matches && matches[0].length > 0;
}
function isCustomAbbreviation(str2) {
  if (str2.length <= 3) {
    return true;
  }
  return isCapitalized(str2);
}
function isNameAbbreviation(wordCount, words) {
  if (words.length > 0) {
    if (wordCount < 5 && words[0].length < 6 && isCapitalized(words[0])) {
      return true;
    }
    const capitalized = words.filter(function(str2) {
      return /[A-Z]/.test(str2.charAt(0));
    });
    return capitalized.length >= 3;
  }
  return false;
}
function isNumber(str2, dotPos) {
  if (dotPos) {
    str2 = str2.slice(dotPos - 1, dotPos + 2);
  }
  return !isNaN(str2);
}
function isPhoneNr(str2) {
  return str2.match(
    /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/
  );
}
function isURL(str2) {
  return str2.match(
    /[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/
  );
}
function isConcatenated(word) {
  let i = 0;
  if ((i = word.indexOf(".")) > -1 || (i = word.indexOf("!")) > -1 || (i = word.indexOf("?")) > -1) {
    const c = word.charAt(i + 1);
    if (c.match(/[a-zA-Z].*/)) {
      return [word.slice(0, i), word.slice(i + 1)];
    }
  }
  return false;
}
function isBoundaryChar(word) {
  return word === "." || word === "!" || word === "?";
}

// ../sentence-parser/src/sbd.ts
var newline_placeholder = " @~@ ";
var newline_placeholder_t = newline_placeholder.trim();
var whiteSpaceCheck = new RegExp("\\S", "");
var addNewLineBoundaries = new RegExp("\\n+|[-#=_+*]{4,}", "g");
var splitIntoWords = new RegExp("\\S+|\\n", "g");
var defaultOptions = {
  newlineBoundaries: false,
  preserveWhitespace: false,
  abbreviations: void 0
};
function getSentences(text, userOptions) {
  if (!text) {
    return [];
  }
  if (!whiteSpaceCheck.test(text)) {
    return [];
  }
  const options2 = {
    ...defaultOptions,
    ...userOptions
  };
  setAbbreviations(options2.abbreviations);
  if (options2.newlineBoundaries) {
    text = text.replace(addNewLineBoundaries, newline_placeholder);
  }
  let words;
  let tokens2;
  if (options2.preserveWhitespace) {
    tokens2 = text.split(/(<br\s*\/?>|\S+|\n+)/);
    words = tokens2.filter(function(token, ii) {
      return ii % 2;
    });
  } else {
    words = text.trim().match(splitIntoWords) ?? [];
  }
  let wordCount = 0;
  let index = 0;
  let temp = [];
  let sentences = [];
  let current2 = [];
  if (!words || !words.length) {
    return [];
  }
  for (let i = 0, L = words.length; i < L; i++) {
    wordCount++;
    current2.push(words[i]);
    if (~words[i].indexOf(",")) {
      wordCount = 0;
    }
    if (isBoundaryChar(words[i]) || endsWithChar(words[i], "?!") || words[i] === newline_placeholder_t) {
      if (options2.newlineBoundaries && words[i] === newline_placeholder_t) {
        current2.pop();
      }
      sentences.push(current2);
      wordCount = 0;
      current2 = [];
      continue;
    }
    if (endsWithChar(words[i], '"') || endsWithChar(words[i], "\u201D")) {
      words[i] = words[i].slice(0, -1);
    }
    if (endsWithChar(words[i], ".")) {
      if (i + 1 < L) {
        if (words[i].length === 2 && isNaN(words[i].charAt(0))) {
          continue;
        }
        if (isCommonAbbreviation(words[i])) {
          continue;
        }
        if (isSentenceStarter(words[i + 1])) {
          if (isTimeAbbreviation(words[i], words[i + 1])) {
            continue;
          }
          if (isNameAbbreviation(wordCount, words.slice(i, 6))) {
            continue;
          }
          if (isNumber(words[i + 1])) {
            if (isCustomAbbreviation(words[i])) {
              continue;
            }
          }
        } else {
          if (endsWith(words[i], "..")) {
            continue;
          }
          if (isDottedAbbreviation(words[i])) {
            continue;
          }
          if (isNameAbbreviation(wordCount, words.slice(i, 5))) {
            continue;
          }
        }
      }
      sentences.push(current2);
      current2 = [];
      wordCount = 0;
      continue;
    }
    if ((index = words[i].indexOf(".")) > -1) {
      if (isNumber(words[i], index)) {
        continue;
      }
      if (isDottedAbbreviation(words[i])) {
        continue;
      }
      if (isURL(words[i]) || isPhoneNr(words[i])) {
        continue;
      }
    }
    if (temp = isConcatenated(words[i])) {
      current2.pop();
      current2.push(temp[0]);
      sentences.push(current2);
      current2 = [];
      wordCount = 0;
      current2.push(temp[1]);
    }
  }
  if (current2.length) {
    sentences.push(current2);
  }
  sentences = sentences.filter(function(s) {
    return s.length > 0;
  });
  const result = sentences.slice(1).reduce(
    function(out, sentence) {
      const lastSentence = out[out.length - 1];
      if (lastSentence.length === 1 && /^.{1,2}[.]$/.test(lastSentence[0])) {
        if (!/[.]/.test(sentence[0])) {
          out.pop();
          out.push(lastSentence.concat(sentence));
          return out;
        }
      }
      out.push(sentence);
      return out;
    },
    [sentences[0]]
  );
  return result.map(function(sentence, ii) {
    if (options2.preserveWhitespace && !options2.newlineBoundaries) {
      let tokenCount = sentence.length * 2;
      if (ii === 0) {
        tokenCount += 1;
      }
      return tokens2.splice(0, tokenCount).join("");
    }
    return sentence.join(" ");
  });
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/SentenceScopeHandler/SentenceSegmenter.ts
var leadingOffsetRegex = /\S*\p{L}/u;
var skipPartRegex = /(\r?\n[^\p{L}]*\r?\n)|(?<=[.!?])(\s*\r?\n)/gu;
var options = {
  newlineBoundaries: false,
  preserveWhitespace: true
};
var SentenceSegmenter = class {
  *segment(text) {
    const sentences = getSentences(text, options);
    let index = 0;
    for (const sentence of sentences) {
      const parts = sentence.split(skipPartRegex).filter((p) => p != null);
      for (const part of parts) {
        if (!skipPart(part)) {
          const segment = createSegment(part, index);
          if (segment != null) {
            yield segment;
          }
        }
        index += part.length;
      }
    }
  }
};
function createSegment(sentence, index) {
  const leadingOffsetMatch = matchRegex(leadingOffsetRegex, sentence);
  if (leadingOffsetMatch == null) {
    return void 0;
  }
  const leadingOffset = leadingOffsetMatch.index;
  if (leadingOffset !== 0) {
    index += leadingOffset;
    sentence = sentence.slice(leadingOffset);
  }
  return {
    text: sentence.trimEnd(),
    index
  };
}
function skipPart(text) {
  return testRegex(skipPartRegex, text);
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/SentenceScopeHandler/SentenceScopeHandler.ts
var SentenceScopeHandler = class extends NestedScopeHandler {
  constructor() {
    super(...arguments);
    this.scopeType = { type: "sentence" };
    this.iterationScopeType = { type: "paragraph" };
    this.segmenter = new SentenceSegmenter();
  }
  generateScopesInSearchScope(direction, { editor, domain }) {
    const offset = editor.document.offsetAt(domain.start);
    const text = editor.document.getText(domain);
    const sentenceToScope = (sentence) => {
      const contentRange = new Range(
        editor.document.positionAt(offset + sentence.index),
        editor.document.positionAt(
          offset + sentence.index + sentence.text.length
        )
      );
      return {
        editor,
        domain: contentRange,
        getTargets: (isReversed) => [
          new TokenTarget({
            editor,
            contentRange,
            isReversed
          })
        ]
      };
    };
    const sentences = this.segmenter.segment(text);
    return direction === "forward" ? imap(sentences, sentenceToScope) : Array.from(sentences, sentenceToScope).reverse();
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/RegexScopeHandler.ts
var RegexStageBase = class extends NestedScopeHandler {
  constructor() {
    super(...arguments);
    this.iterationScopeType = { type: "line" };
  }
  generateScopesInSearchScope(direction, { editor, domain }) {
    return imap(
      generateMatchesInRange(this.regex, editor, domain, direction),
      (range3) => ({
        editor,
        domain: range3,
        getTargets: (isReversed) => [
          new TokenTarget({
            editor,
            contentRange: range3,
            isReversed
          })
        ]
      })
    );
  }
};
var NonWhitespaceSequenceScopeHandler = class extends RegexStageBase {
  constructor() {
    super(...arguments);
    this.regex = /\S+/g;
  }
};
var UrlScopeHandler = class extends RegexStageBase {
  constructor(scopeHandlerFactory, scopeType, languageId) {
    super(scopeHandlerFactory, scopeType, languageId);
    this.scopeType = scopeType;
    // taken from https://regexr.com/3e6m0
    this.regex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;
  }
};
var CustomRegexScopeHandler = class extends RegexStageBase {
  constructor(scopeHandlerFactory, scopeType, languageId) {
    super(scopeHandlerFactory, scopeType, languageId);
    this.scopeType = scopeType;
  }
  get regex() {
    return new RegExp(this.scopeType.regex, this.scopeType.flags ?? "gu");
  }
};
var GlyphScopeHandler = class extends RegexStageBase {
  constructor(scopeHandlerFactory, scopeType, languageId) {
    super(scopeHandlerFactory, scopeType, languageId);
    this.scopeType = scopeType;
  }
  get regex() {
    return new RegExp(escapeRegExp_default(this.scopeType.character), "gui");
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/BoundedScopeHandler.ts
var BoundedBaseScopeHandler = class extends BaseScopeHandler {
  constructor(scopeHandlerFactory, languageId, targetScopeType) {
    super();
    this.scopeHandlerFactory = scopeHandlerFactory;
    this.languageId = languageId;
    this.targetScopeType = targetScopeType;
    this.isHierarchical = true;
    this.targetScopeHandler = this.scopeHandlerFactory.create(
      this.targetScopeType,
      this.languageId
    );
    this.surroundingPairInteriorScopeHandler = this.scopeHandlerFactory.create(
      {
        type: "surroundingPairInterior",
        delimiter: "any"
      },
      this.languageId
    );
  }
  get iterationScopeType() {
    if (this.targetScopeHandler.iterationScopeType.type === "custom") {
      throw Error(
        "Iteration scope type can't be custom for BoundedBaseScopeHandler"
      );
    }
    return {
      type: "oneOf",
      scopeTypes: [
        this.targetScopeHandler.iterationScopeType,
        {
          type: "surroundingPairInterior",
          delimiter: "any"
        }
      ]
    };
  }
  *generateScopeCandidates(editor, position, direction, hints) {
    const targetScopes = this.targetScopeHandler.generateScopes(
      editor,
      position,
      direction,
      {
        ...hints,
        // Don't skip containing paint since it might have non contained nested scopes.
        containment: hints.containment !== "disallowed" ? hints.containment : void 0
      }
    );
    const interiorScopes = Array.from(
      this.surroundingPairInteriorScopeHandler.generateScopes(
        editor,
        position,
        direction,
        {
          ...hints,
          // For every (skipAncestorScopes=true) we don't want to go outside of the surrounding pair
          containment: hints.containment == null && hints.skipAncestorScopes ? "required" : hints.containment
        }
      )
    );
    for (const targetScope of targetScopes) {
      const allScopes = [];
      for (const interiorScope of interiorScopes) {
        const domain = targetScope.domain.intersection(interiorScope.domain);
        if (domain != null && !domain.isEmpty) {
          allScopes.push({
            editor,
            domain,
            getTargets: (isReversed) => {
              return [
                this.getTargets(
                  ensureSingleTarget(targetScope, isReversed),
                  ensureSingleTarget(interiorScope, isReversed)
                )
              ];
            }
          });
        }
      }
      allScopes.push(targetScope);
      allScopes.sort((a, b) => compareTargetScopes(direction, position, a, b));
      yield* allScopes;
    }
  }
};
function ensureSingleTarget(scope, isReversed) {
  const targets = scope.getTargets(isReversed);
  if (targets.length !== 1) {
    throw Error(`Expected one target but got ${targets.length}`);
  }
  return targets[0];
}
var BoundedNonWhitespaceSequenceScopeHandler = class extends BoundedBaseScopeHandler {
  constructor(scopeHandlerFactory, _scopeType, languageId) {
    super(scopeHandlerFactory, languageId, { type: "nonWhitespaceSequence" });
    this.scopeType = { type: "boundedNonWhitespaceSequence" };
  }
  getTargets(target, interior) {
    const contentRange = target.contentRange.intersection(
      interior.contentRange
    );
    if (contentRange == null || contentRange.isEmpty) {
      throw Error("Expected non empty intersection");
    }
    return new TokenTarget({
      editor: target.editor,
      isReversed: target.isReversed,
      contentRange
    });
  }
};
var BoundedParagraphScopeHandler = class extends BoundedBaseScopeHandler {
  constructor(scopeHandlerFactory, scopeType, languageId) {
    super(scopeHandlerFactory, languageId, { type: "paragraph" });
    this.scopeType = { type: "boundedParagraph" };
  }
  getTargets(target, interior) {
    if (!(target instanceof ParagraphTarget)) {
      throw Error("Expected ParagraphTarget");
    }
    return new BoundedParagraphTarget({
      editor: target.editor,
      isReversed: target.isReversed,
      paragraphTarget: target,
      containingInterior: interior
    });
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/SurroundingPairScopeHandler/SurroundingPairInteriorScopeHandler.ts
var SurroundingPairInteriorScopeHandler = class extends BaseScopeHandler {
  constructor(scopeHandlerFactory, scopeType, languageId) {
    super();
    this.scopeHandlerFactory = scopeHandlerFactory;
    this.scopeType = scopeType;
    this.languageId = languageId;
    this.isHierarchical = true;
    this.surroundingPairScopeHandler = this.scopeHandlerFactory.create(
      {
        type: "surroundingPair",
        delimiter: this.scopeType.delimiter,
        requireStrongContainment: true
      },
      this.languageId
    );
  }
  get iterationScopeType() {
    return this.surroundingPairScopeHandler.iterationScopeType;
  }
  *generateScopeCandidates(editor, position, direction, hints) {
    const scopes = this.surroundingPairScopeHandler.generateScopes(
      editor,
      position,
      direction,
      hints
    );
    for (const scope of scopes) {
      if (this.scopeType.requireSingleLine && !scope.domain.isSingleLine) {
        continue;
      }
      yield {
        editor,
        domain: scope.domain,
        getTargets(isReversed) {
          return scope.getTargets(isReversed).flatMap((target) => target.getInterior());
        }
      };
    }
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/SurroundingPairScopeHandler/createTargetScope.ts
function createTargetScope(editor, { openingDelimiterRange, closingDelimiterRange }, requireStrongContainment) {
  const fullRange = openingDelimiterRange.union(closingDelimiterRange);
  const interiorRange = new Range(
    openingDelimiterRange.end,
    closingDelimiterRange.start
  );
  return {
    editor,
    domain: requireStrongContainment ? interiorRange : fullRange,
    getTargets: (isReversed) => [
      new SurroundingPairTarget({
        editor,
        isReversed,
        contentRange: fullRange,
        interiorRange,
        boundary: [openingDelimiterRange, closingDelimiterRange]
      })
    ]
  };
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/SurroundingPairScopeHandler/getDelimiterRegex.ts
function getDelimiterRegex(individualDelimiters) {
  const individualDelimiterDisjunct = uniq_default(
    individualDelimiters.map(({ text }) => text)
  ).map(escapeRegExp_default).join("|");
  return new RegExp(`(?<!\\\\)(${individualDelimiterDisjunct})`, "gu");
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/SurroundingPairScopeHandler/getDelimiterOccurrences.ts
function getDelimiterOccurrences(languageDefinition, document, individualDelimiters) {
  if (individualDelimiters.length === 0) {
    return [];
  }
  const delimiterRegex = getDelimiterRegex(individualDelimiters);
  const disqualifyDelimiters = languageDefinition?.getCaptures(document, "disqualifyDelimiter") ?? [];
  const textFragments = languageDefinition?.getCaptures(document, "textFragment") ?? [];
  const delimiterTextToDelimiterInfoMap = Object.fromEntries(
    individualDelimiters.map((individualDelimiter) => [
      individualDelimiter.text,
      individualDelimiter
    ])
  );
  const text = document.getText();
  return matchAll(text, delimiterRegex, (match) => {
    const text2 = match[0];
    const range3 = new Range(
      document.positionAt(match.index),
      document.positionAt(match.index + text2.length)
    );
    const isDisqualified = disqualifyDelimiters.some(
      (c) => c.range.contains(range3) && !c.hasError()
    );
    const textFragmentRange = textFragments.find(
      (c) => c.range.contains(range3)
    )?.range;
    return {
      delimiterInfo: delimiterTextToDelimiterInfoMap[text2],
      isDisqualified,
      textFragmentRange,
      range: range3
    };
  });
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/SurroundingPairScopeHandler/delimiterMaps.ts
var delimiterToText = Object.freeze({
  angleBrackets: [
    ["</", "<"],
    [">", "/>"]
  ],
  backtickQuotes: ["`", "`"],
  curlyBrackets: [["{", "${"], "}"],
  tripleDoubleQuotes: [[], []],
  tripleSingleQuotes: [[], []],
  doubleQuotes: ['"', '"', { isSingleLine: true }],
  escapedDoubleQuotes: ['\\"', '\\"', { isSingleLine: true }],
  escapedParentheses: ["\\(", "\\)"],
  escapedSquareBrackets: ["\\[", "\\]"],
  escapedSingleQuotes: ["\\'", "\\'", { isSingleLine: true }],
  parentheses: [["(", "$("], ")"],
  singleQuotes: ["'", "'", { isSingleLine: true }],
  squareBrackets: ["[", "]"]
});
var pythonPrefixes = [
  // Base case without a prefix
  "",
  // string prefixes
  "r",
  "u",
  "R",
  "U",
  "f",
  "F",
  "fr",
  "Fr",
  "fR",
  "FR",
  "rf",
  "rF",
  "Rf",
  "RF",
  // byte prefixes
  "b",
  "B",
  "br",
  "Br",
  "bR",
  "BR",
  "rb",
  "rB",
  "Rb",
  "RB"
];
var delimiterToTextOverrides = {
  nix: {
    singleQuotes: ["''", "''"]
  },
  lua: {
    // FIXME: Add special double square brackets
    // see https://github.com/cursorless-dev/cursorless/pull/2012#issuecomment-1808214409
    // see also https://github.com/cursorless-dev/cursorless/issues/1812#issuecomment-1691493746
    doubleQuotes: [
      ['"', "[["],
      ['"', "]]"]
    ]
  },
  python: {
    singleQuotes: [
      pythonPrefixes.map((prefix) => `${prefix}'`),
      "'",
      { isSingleLine: true, isUnknownSide: true }
    ],
    doubleQuotes: [
      pythonPrefixes.map((prefix) => `${prefix}"`),
      '"',
      { isSingleLine: true, isUnknownSide: true }
    ],
    tripleSingleQuotes: [
      pythonPrefixes.map((prefix) => `${prefix}'''`),
      "'''",
      { isUnknownSide: true }
    ],
    tripleDoubleQuotes: [
      pythonPrefixes.map((prefix) => `${prefix}"""`),
      '"""',
      { isUnknownSide: true }
    ]
  },
  ruby: {
    tripleDoubleQuotes: ["%Q(", ")"]
  }
};
var leftToRightMap = Object.fromEntries(
  Object.values(delimiterToText)
);
var complexDelimiterMap = {
  any: unsafeKeys(delimiterToText),
  string: [
    "tripleDoubleQuotes",
    "tripleSingleQuotes",
    "doubleQuotes",
    "singleQuotes",
    "backtickQuotes"
  ],
  collectionBoundary: [
    "parentheses",
    "squareBrackets",
    "curlyBrackets",
    "angleBrackets"
  ]
};
function getSimpleDelimiterMap(languageId) {
  if (languageId != null && languageId in delimiterToTextOverrides) {
    return {
      ...delimiterToText,
      ...delimiterToTextOverrides[languageId]
    };
  }
  return delimiterToText;
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/SurroundingPairScopeHandler/getIndividualDelimiters.ts
function getIndividualDelimiters(delimiter, languageId) {
  const delimiters = complexDelimiterMap[delimiter] ?? [delimiter];
  return getSimpleIndividualDelimiters(languageId, delimiters);
}
function getSimpleIndividualDelimiters(languageId, delimiters) {
  const delimiterToText2 = getSimpleDelimiterMap(languageId);
  return delimiters.flatMap((delimiterName) => {
    const [leftDelimiter, rightDelimiter, options2] = delimiterToText2[delimiterName];
    const { isSingleLine = false, isUnknownSide = false } = options2 ?? {};
    const leftDelimiters = isString(leftDelimiter) ? [leftDelimiter] : leftDelimiter;
    const rightDelimiters = isString(rightDelimiter) ? [rightDelimiter] : rightDelimiter;
    const allDelimiterTexts = uniq_default(concat_default(leftDelimiters, rightDelimiters));
    return allDelimiterTexts.map((text) => {
      const isLeft = leftDelimiters.includes(text);
      const isRight = rightDelimiters.includes(text);
      const side = (() => {
        if (isUnknownSide) {
          return "unknown";
        }
        if (isLeft && !isRight) {
          return "left";
        }
        if (!isLeft && isRight) {
          return "right";
        }
        return "unknown";
      })();
      return {
        text,
        side,
        delimiterName,
        isSingleLine
      };
    });
  });
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/SurroundingPairScopeHandler/getSurroundingPairOccurrences.ts
function getSurroundingPairOccurrences(delimiterOccurrences) {
  const result = [];
  const openingDelimiterOccurrences = new DefaultMap(() => []);
  for (const occurrence of delimiterOccurrences) {
    const {
      delimiterInfo: { delimiterName, side, isSingleLine },
      isDisqualified,
      textFragmentRange,
      range: range3
    } = occurrence;
    if (isDisqualified) {
      continue;
    }
    let openingDelimiters = openingDelimiterOccurrences.get(delimiterName);
    if (isSingleLine) {
      openingDelimiters = openingDelimiters.filter(
        (openingDelimiter) => openingDelimiter.range.start.line === range3.start.line
      );
      openingDelimiterOccurrences.set(delimiterName, openingDelimiters);
    }
    const relevantOpeningDelimiters = openingDelimiters.filter(
      (openingDelimiter) => textFragmentRange == null && openingDelimiter.textFragmentRange == null || textFragmentRange != null && openingDelimiter.textFragmentRange != null && openingDelimiter.textFragmentRange.isRangeEqual(textFragmentRange)
    );
    if (side === "left" || side === "unknown" && relevantOpeningDelimiters.length % 2 === 0) {
      openingDelimiters.push(occurrence);
    } else {
      const openingDelimiter = relevantOpeningDelimiters.at(-1);
      if (openingDelimiter == null) {
        continue;
      }
      openingDelimiters.splice(
        openingDelimiters.lastIndexOf(openingDelimiter),
        1
      );
      result.push({
        delimiterName,
        openingDelimiterRange: openingDelimiter.range,
        closingDelimiterRange: range3
      });
    }
  }
  return result;
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/SurroundingPairScopeHandler/SurroundingPairScopeHandler.ts
var SurroundingPairScopeHandler = class extends BaseScopeHandler {
  constructor(languageDefinitions, scopeType, languageId) {
    super();
    this.languageDefinitions = languageDefinitions;
    this.scopeType = scopeType;
    this.languageId = languageId;
    this.iterationScopeType = { type: "line" };
    this.isHierarchical = true;
  }
  *generateScopeCandidates(editor, position, direction, hints) {
    if (this.scopeType.forceDirection != null) {
      void showError(
        ide().messages,
        "deprecatedForceDirection",
        "forceDirection is deprecated. If this is important to you please file an issue on the cursorless repo."
      );
      return;
    }
    const delimiterOccurrences = getDelimiterOccurrences(
      this.languageDefinitions.get(this.languageId),
      editor.document,
      getIndividualDelimiters(this.scopeType.delimiter, this.languageId)
    );
    let surroundingPairs = getSurroundingPairOccurrences(delimiterOccurrences);
    surroundingPairs = maybeApplyEmptyTargetHack(
      direction,
      hints,
      position,
      surroundingPairs
    );
    yield* surroundingPairs.map(
      (pair) => createTargetScope(
        editor,
        pair,
        this.scopeType.requireStrongContainment ?? false
      )
    ).sort((a, b) => compareTargetScopes(direction, position, a, b));
  }
};
function maybeApplyEmptyTargetHack(direction, hints, position, surroundingPairs) {
  if (direction === "forward" && hints.containment === "required" && hints.allowAdjacentScopes && hints.skipAncestorScopes) {
    return surroundingPairs.filter(
      (pair, i) => !(pair.closingDelimiterRange.end.isEqual(position) && surroundingPairs[i + 1]?.closingDelimiterRange.start.isEqual(position))
    );
  }
  return surroundingPairs;
}

// ../cursorless-engine/src/processTargets/modifiers/scopeHandlers/ScopeHandlerFactoryImpl.ts
var ScopeHandlerFactoryImpl = class {
  constructor(languageDefinitions) {
    this.languageDefinitions = languageDefinitions;
    this.create = this.create.bind(this);
  }
  create(scopeType, languageId) {
    switch (scopeType.type) {
      case "character":
        return new CharacterScopeHandler(this, scopeType, languageId);
      case "word":
        return new WordScopeHandler(this, scopeType, languageId);
      case "token":
        return new TokenScopeHandler(this, scopeType, languageId);
      case "identifier":
        return new IdentifierScopeHandler(this, scopeType, languageId);
      case "line":
        return new LineScopeHandler(scopeType, languageId);
      case "sentence":
        return new SentenceScopeHandler(this, scopeType, languageId);
      case "paragraph":
        return new ParagraphScopeHandler(scopeType, languageId);
      case "boundedParagraph":
        return new BoundedParagraphScopeHandler(this, scopeType, languageId);
      case "document":
        return new DocumentScopeHandler(scopeType, languageId);
      case "oneOf":
        return OneOfScopeHandler.create(this, scopeType, languageId);
      case "nonWhitespaceSequence":
        return new NonWhitespaceSequenceScopeHandler(
          this,
          scopeType,
          languageId
        );
      case "boundedNonWhitespaceSequence":
        return new BoundedNonWhitespaceSequenceScopeHandler(
          this,
          scopeType,
          languageId
        );
      case "url":
        return new UrlScopeHandler(this, scopeType, languageId);
      case "customRegex":
        return new CustomRegexScopeHandler(this, scopeType, languageId);
      case "glyph":
        return new GlyphScopeHandler(this, scopeType, languageId);
      case "surroundingPair":
        return new SurroundingPairScopeHandler(
          this.languageDefinitions,
          scopeType,
          languageId
        );
      case "surroundingPairInterior":
        return new SurroundingPairInteriorScopeHandler(
          this,
          scopeType,
          languageId
        );
      case "custom":
        return scopeType.scopeHandler;
      case "instance":
        throw Error("Unexpected scope type 'instance'");
      default:
        return this.languageDefinitions.get(languageId)?.getScopeHandler(scopeType);
    }
  }
};

// ../cursorless-engine/src/util/nodeSelectors.ts
function makeRangeFromPositions(startPosition, endPosition) {
  return new Range(
    startPosition.row,
    startPosition.column,
    endPosition.row,
    endPosition.column
  );
}
function positionFromPoint(point) {
  return new Position(point.row, point.column);
}
function getNodeRange(node) {
  return new Range(
    node.startPosition.row,
    node.startPosition.column,
    node.endPosition.row,
    node.endPosition.column
  );
}
function makeNodePairSelection(anchor, active) {
  return new Selection(
    anchor.startPosition.row,
    anchor.startPosition.column,
    active.endPosition.row,
    active.endPosition.column
  );
}
function simpleSelectionExtractor(editor, node) {
  return {
    selection: new Selection(
      new Position(node.startPosition.row, node.startPosition.column),
      new Position(node.endPosition.row, node.endPosition.column)
    ),
    context: {}
  };
}
function pairSelectionExtractor(editor, node1, node2) {
  const isForward = node1.startIndex < node2.startIndex;
  const start = isForward ? node1 : node2;
  const end = isForward ? node2 : node1;
  return {
    selection: new Selection(
      new Position(start.startPosition.row, start.startPosition.column),
      new Position(end.endPosition.row, end.endPosition.column)
    ),
    context: {}
  };
}
function argumentSelectionExtractor() {
  return delimitedSelector(
    (node) => node.type === "," || node.type === "(" || node.type === ")" || node.type === "[" || node.type === "]" || node.type === ">" || node.type === "<" || node.type === "}" || node.type === "{",
    ", "
  );
}
function unwrapSelectionExtractor(editor, node) {
  let startIndex = node.startIndex;
  let endIndex = node.endIndex;
  if (node.text.startsWith("(") && node.text.endsWith(")")) {
    startIndex += 1;
    endIndex -= 1;
  } else if (node.text.endsWith(";")) {
    endIndex -= 1;
  }
  return {
    selection: new Selection(
      editor.document.positionAt(startIndex),
      editor.document.positionAt(endIndex)
    ),
    context: {}
  };
}
function selectWithLeadingDelimiter(...delimiters) {
  return function(editor, node) {
    const firstSibling = node.previousSibling;
    const secondSibling = firstSibling?.previousSibling;
    let leadingDelimiterRange;
    if (firstSibling) {
      if (delimiters.includes(firstSibling.type)) {
        if (secondSibling) {
          leadingDelimiterRange = makeRangeFromPositions(
            secondSibling.endPosition,
            node.startPosition
          );
        } else {
          leadingDelimiterRange = makeRangeFromPositions(
            firstSibling.startPosition,
            node.startPosition
          );
        }
      } else {
        leadingDelimiterRange = makeRangeFromPositions(
          firstSibling.endPosition,
          node.startPosition
        );
      }
    }
    return {
      ...simpleSelectionExtractor(editor, node),
      context: {
        leadingDelimiterRange
      }
    };
  };
}
function childRangeSelector(typesToExclude = [], typesToInclude = [], { includeUnnamedChildren = false } = {}) {
  return function(editor, node) {
    if (typesToExclude.length > 0 && typesToInclude.length > 0) {
      throw new Error("Cannot have both exclusions and inclusions.");
    }
    let nodes = includeUnnamedChildren ? node.children : node.namedChildren;
    const exclusionSet = new Set(typesToExclude);
    const inclusionSet = new Set(typesToInclude);
    nodes = nodes.filter((child) => {
      if (exclusionSet.size > 0) {
        return !exclusionSet.has(child.type);
      }
      if (inclusionSet.size > 0) {
        return inclusionSet.has(child.type);
      }
      return true;
    });
    return pairSelectionExtractor(editor, nodes[0], nodes[nodes.length - 1]);
  };
}
function selectWithTrailingDelimiter(...delimiters) {
  return function(editor, node) {
    const firstSibling = node.nextSibling;
    const secondSibling = firstSibling?.nextSibling;
    let trailingDelimiterRange;
    if (firstSibling) {
      if (delimiters.includes(firstSibling.type)) {
        if (secondSibling) {
          trailingDelimiterRange = makeRangeFromPositions(
            node.endPosition,
            secondSibling.startPosition
          );
        } else {
          trailingDelimiterRange = makeRangeFromPositions(
            node.endPosition,
            firstSibling.endPosition
          );
        }
      } else {
        trailingDelimiterRange = makeRangeFromPositions(
          node.endPosition,
          firstSibling.startPosition
        );
      }
    }
    return {
      ...simpleSelectionExtractor(editor, node),
      context: {
        trailingDelimiterRange
      }
    };
  };
}
function getNextNonDelimiterNode(startNode, isDelimiterNode) {
  let node = startNode.nextSibling;
  while (node != null) {
    if (!isDelimiterNode(node)) {
      return node;
    }
    node = node.nextSibling;
  }
  return node;
}
function getPreviousNonDelimiterNode(startNode, isDelimiterNode) {
  let node = startNode.previousSibling;
  while (node != null) {
    if (!isDelimiterNode(node)) {
      return node;
    }
    node = node.previousSibling;
  }
  return node;
}
function delimitedSelector(isDelimiterNode, defaultDelimiter, getStartNode = identity_default, getEndNode = identity_default) {
  return (editor, node) => {
    let leadingDelimiterRange;
    let trailingDelimiterRange;
    const startNode = getStartNode(node);
    const endNode = getEndNode(node);
    const previousNonDelimiterNode = getPreviousNonDelimiterNode(
      startNode,
      isDelimiterNode
    );
    const nextNonDelimiterNode = getNextNonDelimiterNode(
      endNode,
      isDelimiterNode
    );
    if (previousNonDelimiterNode != null) {
      leadingDelimiterRange = makeRangeFromPositions(
        previousNonDelimiterNode.endPosition,
        startNode.startPosition
      );
    }
    if (nextNonDelimiterNode != null) {
      trailingDelimiterRange = makeRangeFromPositions(
        endNode.endPosition,
        nextNonDelimiterNode.startPosition
      );
    }
    const containingListDelimiter = getInsertionDelimiter2(
      editor,
      leadingDelimiterRange,
      trailingDelimiterRange,
      defaultDelimiter
    );
    return {
      selection: new Selection(
        new Position(
          startNode.startPosition.row,
          startNode.startPosition.column
        ),
        new Position(endNode.endPosition.row, endNode.endPosition.column)
      ),
      context: {
        containingListDelimiter,
        leadingDelimiterRange,
        trailingDelimiterRange
      }
    };
  };
}
function getInsertionDelimiter2(editor, leadingDelimiterRange, trailingDelimiterRange, defaultDelimiterInsertion) {
  const { document } = editor;
  const delimiters = [
    trailingDelimiterRange != null ? document.getText(trailingDelimiterRange) : defaultDelimiterInsertion,
    leadingDelimiterRange != null ? document.getText(leadingDelimiterRange) : defaultDelimiterInsertion
  ];
  return maxBy_default(delimiters, "length");
}

// ../cursorless-engine/src/languages/TreeSitterQuery/checkCaptureStartEnd.ts
function checkCaptureStartEnd(captures, messages) {
  if (captures.length === 1) {
    return true;
  }
  let shownError = false;
  const lastStart = captures.filter(({ name }) => name.endsWith(".start")).map(({ range: { end } }) => end).sort((a, b) => a.compareTo(b)).at(-1);
  const firstEnd = captures.filter(({ name }) => name.endsWith(".end")).map(({ range: { start } }) => start).sort((a, b) => a.compareTo(b)).at(0);
  if (lastStart != null && firstEnd != null) {
    if (lastStart.isAfter(firstEnd)) {
      void showError(
        messages,
        "TreeSitterQuery.checkCaptures.badOrder",
        `Start capture must be before end capture: ${captures}`
      );
      shownError = true;
    }
  }
  const startCount = captures.filter(
    ({ name }) => name.endsWith(".start")
  ).length;
  const endCount = captures.filter(({ name }) => name.endsWith(".end")).length;
  const regularCount = captures.length - startCount - endCount;
  if (regularCount > 0 && (startCount > 0 || endCount > 0)) {
    void showError(
      messages,
      "TreeSitterQuery.checkCaptures.mixRegularStartEnd",
      `Please do not mix regular captures and start/end captures: ${captures.map(
        ({ name, range: range3 }) => name + " " + range3.toString()
      )}`
    );
    shownError = true;
  }
  if (regularCount > 1) {
    void showError(
      messages,
      "TreeSitterQuery.checkCaptures.duplicate",
      `A capture with the same name may only appear once in a single pattern: ${captures.map(
        ({ name, range: range3 }) => name + " " + range3.toString()
      )}`
    );
    shownError = true;
  }
  return !shownError;
}

// ../cursorless-engine/src/languages/TreeSitterQuery/isContainedInErrorNode.ts
function isContainedInErrorNode(node) {
  let currentNode = node;
  while (currentNode != null) {
    if (currentNode.hasError) {
      return true;
    }
    currentNode = currentNode.parent;
  }
  return false;
}

// ../../node_modules/.pnpm/zod@3.23.8/node_modules/zod/lib/index.mjs
var util;
(function(util2) {
  util2.assertEqual = (val) => val;
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys2 = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys2.push(key);
      }
    }
    return keys2;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator2 = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator2);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json2 = JSON.stringify(obj, null, 2);
  return json2.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  get errors() {
    return this.issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
        fieldErrors[sub.path[0]].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var overrideErrorMap = errorMap;
function setErrorMap(map3) {
  overrideErrorMap = map3;
}
function getErrorMap() {
  return overrideErrorMap;
}
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map3 of maps) {
    errorMessage = map3(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      ctx.schemaErrorMap,
      overrideMap,
      overrideMap === errorMap ? void 0 : errorMap
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs2) {
    const syncPairs = [];
    for (const pair of pairs2) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs2) {
    const finalObject = {};
    for (const pair of pairs2) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
})(errorUtil || (errorUtil = {}));
var _ZodEnum_cache;
var _ZodNativeEnum_cache;
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (this._key instanceof Array) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    var _a, _b;
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message !== null && message !== void 0 ? message : ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: (_a = message !== null && message !== void 0 ? message : required_error) !== null && _a !== void 0 ? _a : ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: (_b = message !== null && message !== void 0 ? message : invalid_type_error) !== null && _b !== void 0 ? _b : ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
  }
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    var _a;
    const ctx = {
      common: {
        issues: [],
        async: (_a = params === null || params === void 0 ? void 0 : params.async) !== null && _a !== void 0 ? _a : false,
        contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap
      },
      path: (params === null || params === void 0 ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
        async: true
      },
      path: (params === null || params === void 0 ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this, this._def);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6Regex = /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let regex = `([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d`;
  if (args.precision) {
    regex = `${regex}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    regex = `${regex}(\\.\\d+)?`;
  }
  return regex;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch (_a) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  ip(options2) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options2) });
  }
  datetime(options2) {
    var _a, _b;
    if (typeof options2 === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options2
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof (options2 === null || options2 === void 0 ? void 0 : options2.precision) === "undefined" ? null : options2 === null || options2 === void 0 ? void 0 : options2.precision,
      offset: (_a = options2 === null || options2 === void 0 ? void 0 : options2.offset) !== null && _a !== void 0 ? _a : false,
      local: (_b = options2 === null || options2 === void 0 ? void 0 : options2.local) !== null && _b !== void 0 ? _b : false,
      ...errorUtil.errToObj(options2 === null || options2 === void 0 ? void 0 : options2.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options2) {
    if (typeof options2 === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options2
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof (options2 === null || options2 === void 0 ? void 0 : options2.precision) === "undefined" ? null : options2 === null || options2 === void 0 ? void 0 : options2.precision,
      ...errorUtil.errToObj(options2 === null || options2 === void 0 ? void 0 : options2.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options2) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options2 === null || options2 === void 0 ? void 0 : options2.position,
      ...errorUtil.errToObj(options2 === null || options2 === void 0 ? void 0 : options2.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * @deprecated Use z.string().min(1) instead.
   * @see {@link ZodString.min}
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get minLength() {
    let min2 = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min2 === null || ch.value > min2)
          min2 = ch.value;
      }
    }
    return min2;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  var _a;
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / Math.pow(10, decCount);
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min2 = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min2 === null || ch.value > min2)
          min2 = ch.value;
      }
    }
    return min2;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null, min2 = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min2 === null || ch.value > min2)
          min2 = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min2) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = BigInt(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.bigint,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min2 = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min2 === null || ch.value > min2)
          min2 = ch.value;
      }
    }
    return min2;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  var _a;
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min2 = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min2 === null || ch.value > min2)
          min2 = ch.value;
      }
    }
    return min2 != null ? new Date(min2) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema3, params) => {
  return new ZodArray({
    type: schema3,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema3) {
  if (schema3 instanceof ZodObject) {
    const newShape = {};
    for (const key in schema3.shape) {
      const fieldSchema = schema3.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema3._def,
      shape: () => newShape
    });
  } else if (schema3 instanceof ZodArray) {
    return new ZodArray({
      ...schema3._def,
      type: deepPartialify(schema3.element)
    });
  } else if (schema3 instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema3.unwrap()));
  } else if (schema3 instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema3.unwrap()));
  } else if (schema3 instanceof ZodTuple) {
    return ZodTuple.create(schema3.items.map((item) => deepPartialify(item)));
  } else {
    return schema3;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys2 = util.objectKeys(shape);
    return this._cached = { shape, keys: keys2 };
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs2 = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs2.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs2.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") ;
      else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs2.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs2) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs2);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          var _a, _b, _c, _d;
          const defaultError = (_c = (_b = (_a = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: (_d = errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema3) {
    return this.augment({ [key]: schema3 });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    util.objectKeys(mask).forEach((key) => {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    });
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    util.objectKeys(this.shape).forEach((key) => {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    });
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    util.objectKeys(this.shape).forEach((key) => {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    });
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    util.objectKeys(this.shape).forEach((key) => {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    });
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options2 = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options2.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options2) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type2) => {
  if (type2 instanceof ZodLazy) {
    return getDiscriminator(type2.schema);
  } else if (type2 instanceof ZodEffects) {
    return getDiscriminator(type2.innerType());
  } else if (type2 instanceof ZodLiteral) {
    return [type2.value];
  } else if (type2 instanceof ZodEnum) {
    return type2.options;
  } else if (type2 instanceof ZodNativeEnum) {
    return util.objectValues(type2.enum);
  } else if (type2 instanceof ZodDefault) {
    return getDiscriminator(type2._def.innerType);
  } else if (type2 instanceof ZodUndefined) {
    return [void 0];
  } else if (type2 instanceof ZodNull) {
    return [null];
  } else if (type2 instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type2.unwrap())];
  } else if (type2 instanceof ZodNullable) {
    return [null, ...getDiscriminator(type2.unwrap())];
  } else if (type2 instanceof ZodBranded) {
    return getDiscriminator(type2.unwrap());
  } else if (type2 instanceof ZodReadonly) {
    return getDiscriminator(type2.unwrap());
  } else if (type2 instanceof ZodCatch) {
    return getDiscriminator(type2._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options2, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type2 of options2) {
      const discriminatorValues = getDiscriminator(type2.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type2);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options: options2,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema3 = this._def.items[itemIndex] || this._def.rest;
      if (!schema3)
        return null;
      return schema3._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs2 = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs2.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs2);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs2);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs2 = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs2) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs2) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [
          ctx.common.contextualErrorMap,
          ctx.schemaErrorMap,
          getErrorMap(),
          errorMap
        ].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [
          ctx.common.contextualErrorMap,
          ctx.schemaErrorMap,
          getErrorMap(),
          errorMap
        ].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values2, params) {
  return new ZodEnum({
    values: values2,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  constructor() {
    super(...arguments);
    _ZodEnum_cache.set(this, void 0);
  }
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f")) {
      __classPrivateFieldSet(this, _ZodEnum_cache, new Set(this._def.values), "f");
    }
    if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f").has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values2, newDef = this._def) {
    return _ZodEnum.create(values2, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values2, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values2.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
_ZodEnum_cache = /* @__PURE__ */ new WeakMap();
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  constructor() {
    super(...arguments);
    _ZodNativeEnum_cache.set(this, void 0);
  }
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f")) {
      __classPrivateFieldSet(this, _ZodNativeEnum_cache, new Set(util.getValidEnumValues(this._def.values)), "f");
    }
    if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f").has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
_ZodNativeEnum_cache = /* @__PURE__ */ new WeakMap();
ZodNativeEnum.create = (values2, params) => {
  return new ZodNativeEnum({
    values: values2,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema3, params) => {
  return new ZodPromise({
    type: schema3,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return base;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return base;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({ status: status.value, value: result }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema3, effect, params) => {
  return new ZodEffects({
    schema: schema3,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema3, params) => {
  return new ZodEffects({
    schema: schema3,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type2, params) => {
  return new ZodOptional({
    innerType: type2,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type2, params) => {
  return new ZodNullable({
    innerType: type2,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type2, params) => {
  return new ZodDefault({
    innerType: type2,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type2, params) => {
  return new ZodCatch({
    innerType: type2,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze2 = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze2(data)) : freeze2(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type2, params) => {
  return new ZodReadonly({
    innerType: type2,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function custom(check, params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      var _a, _b;
      if (!check(data)) {
        const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
        const _fatal = (_b = (_a = p.fatal) !== null && _a !== void 0 ? _a : fatal) !== null && _b !== void 0 ? _b : true;
        const p2 = typeof p === "string" ? { message: p } : p;
        ctx.addIssue({ code: "custom", ...p2, fatal: _fatal });
      }
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;
var z = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  defaultErrorMap: errorMap,
  setErrorMap,
  getErrorMap,
  makeIssue,
  EMPTY_PATH,
  addIssueToContext,
  ParseStatus,
  INVALID,
  DIRTY,
  OK,
  isAborted,
  isDirty,
  isValid,
  isAsync,
  get util() {
    return util;
  },
  get objectUtil() {
    return objectUtil;
  },
  ZodParsedType,
  getParsedType,
  ZodType,
  datetimeRegex,
  ZodString,
  ZodNumber,
  ZodBigInt,
  ZodBoolean,
  ZodDate,
  ZodSymbol,
  ZodUndefined,
  ZodNull,
  ZodAny,
  ZodUnknown,
  ZodNever,
  ZodVoid,
  ZodArray,
  ZodObject,
  ZodUnion,
  ZodDiscriminatedUnion,
  ZodIntersection,
  ZodTuple,
  ZodRecord,
  ZodMap,
  ZodSet,
  ZodFunction,
  ZodLazy,
  ZodLiteral,
  ZodEnum,
  ZodNativeEnum,
  ZodPromise,
  ZodEffects,
  ZodTransformer: ZodEffects,
  ZodOptional,
  ZodNullable,
  ZodDefault,
  ZodCatch,
  ZodNaN,
  BRAND,
  ZodBranded,
  ZodPipeline,
  ZodReadonly,
  custom,
  Schema: ZodType,
  ZodSchema: ZodType,
  late,
  get ZodFirstPartyTypeKind() {
    return ZodFirstPartyTypeKind;
  },
  coerce,
  any: anyType,
  array: arrayType,
  bigint: bigIntType,
  boolean: booleanType,
  date: dateType,
  discriminatedUnion: discriminatedUnionType,
  effect: effectsType,
  "enum": enumType,
  "function": functionType,
  "instanceof": instanceOfType,
  intersection: intersectionType,
  lazy: lazyType,
  literal: literalType,
  map: mapType,
  nan: nanType,
  nativeEnum: nativeEnumType,
  never: neverType,
  "null": nullType,
  nullable: nullableType,
  number: numberType,
  object: objectType,
  oboolean,
  onumber,
  optional: optionalType,
  ostring,
  pipeline: pipelineType,
  preprocess: preprocessType,
  promise: promiseType,
  record: recordType,
  set: setType,
  strictObject: strictObjectType,
  string: stringType,
  symbol: symbolType,
  transformer: effectsType,
  tuple: tupleType,
  "undefined": undefinedType,
  union: unionType,
  unknown: unknownType,
  "void": voidType,
  NEVER,
  ZodIssueCode,
  quotelessJson,
  ZodError
});

// ../cursorless-engine/src/languages/TreeSitterQuery/predicateToString.ts
function predicateToString(predicateDescriptor) {
  const operandList = predicateDescriptor.operands.map(operandToString).join(" ");
  return `(#${predicateDescriptor.operator} ${operandList})`;
}
function operandToString(value) {
  return value.type === "capture" ? `@${value.name}` : value.value;
}

// ../cursorless-engine/src/languages/TreeSitterQuery/constructZodErrorMessages.ts
function constructZodErrorMessages(inputOperands, error) {
  return error.errors.filter(
    // If the user has supplied a capture instead of a string, or vice versa,
    // we'll get two errors instead of one; we prefer to show the more helpful
    // one.
    (error2) => !(error2.code === "invalid_type" && error2.path.length === 2 && (error2.path[1] === "name" || error2.path[1] === "value"))
  ).map((error2) => getErrorMessage(inputOperands, error2));
}
function getErrorMessage(inputOperands, error) {
  if (error.path.length === 0) {
    if (error.code === "too_small") {
      return "Too few arguments";
    } else if (error.code === "too_big") {
      return "Too many arguments";
    }
    return error.message;
  }
  let message = error.message;
  if (error.code === "invalid_literal" && error.path[1] === "type") {
    message = error.expected === "capture" ? "Capture names must be prefixed with @" : "Expected string, but received capture";
  }
  const argIndex = error.path[0];
  const operandString = operandToString(inputOperands[argIndex]);
  return `Error on argument ${argIndex} (\`${operandString}\`): ${message}`;
}

// ../cursorless-engine/src/languages/TreeSitterQuery/QueryPredicateOperator.ts
var QueryPredicateOperator = class {
  /**
   * Whether it is ok for a node argument to be missing.  If true, then the
   * operator will just accept the pattern if the given node is missing.  If
   * false, then the operator will throw an error if the node is missing.
   *
   * This is useful if we want to set some flag on a node, but only if it's
   * present.
   *
   * @returns A boolean indicating whether it is ok for a node argument to be
   * missing.
   */
  allowMissingNode() {
    return false;
  }
  /**
   * Given a list of operands, return a predicate function that can be used to
   * test whether a given match satisfies the predicate.
   *
   * @param inputOperands The operands to the operator, as returned directly
   * from tree-sitter when parse the query file.
   * @returns Either a predicate function, or a list of error messages if the operands
   * were invalid.
   */
  createPredicate(inputOperands) {
    const result = this.schema.safeParse(inputOperands);
    return result.success ? {
      success: true,
      predicate: (match) => {
        try {
          const acceptArgs = this.constructAcceptArgs(result.data, match);
          return this.run(...acceptArgs);
        } catch (err) {
          if (err instanceof CaptureNotFoundError && this.allowMissingNode()) {
            return true;
          }
          throw err;
        }
      }
    } : {
      success: false,
      errors: constructZodErrorMessages(inputOperands, result.error)
    };
  }
  /**
   * Given the output of the schema and a match, construct the arguments to pass
   * to the `accept` function.
   * @param rawOutput The output of the schema.
   * @param match The match to use to convert captures to nodes.
   * @returns The arguments to pass to the `accept` function.
   */
  constructAcceptArgs(rawOutput, match) {
    return rawOutput.map((operand) => {
      if (operand.type === "capture") {
        const capture = match.captures.find(
          (capture2) => capture2.name === operand.name
        );
        if (capture == null) {
          throw new CaptureNotFoundError(operand.name);
        }
        return capture;
      } else {
        return operand.value;
      }
    });
  }
};
var CaptureNotFoundError = class extends Error {
  constructor(operandName) {
    super(`Could not find capture ${operandName}`);
  }
};

// ../cursorless-engine/src/languages/TreeSitterQuery/operatorArgumentSchemaTypes.ts
var string = z.object({ type: z.literal("string"), value: z.string() });
var q = {
  /**
   * Expect a capture, eg @foo.  The operator will receive the node referenced
   * by the capture
   */
  node: z.object({ type: z.literal("capture"), name: z.string() }),
  /** Expect a string */
  string,
  /** Expect an integer */
  integer: string.transform((val, ctx) => {
    const parsedValue = parseInt(val.value);
    if (isNaN(parsedValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expected an integer"
      });
      return z.NEVER;
    }
    return { type: "integer", value: parsedValue };
  }),
  /** Expect a boolean */
  boolean: string.transform((val, ctx) => {
    if (val.value === "true") {
      return { type: "boolean", value: true };
    }
    if (val.value === "false") {
      return { type: "boolean", value: false };
    }
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Expected true or false"
    });
    return z.NEVER;
  })
};

// ../cursorless-engine/src/languages/TreeSitterQuery/queryPredicateOperators.ts
var NotType = class extends QueryPredicateOperator {
  constructor() {
    super(...arguments);
    this.name = "not-type?";
    this.schema = z.tuple([q.node, q.string]).rest(q.string);
  }
  run({ node }, ...types) {
    return !types.includes(node.type);
  }
};
var NotParentType = class extends QueryPredicateOperator {
  constructor() {
    super(...arguments);
    this.name = "not-parent-type?";
    this.schema = z.tuple([q.node, q.string]).rest(q.string);
  }
  run({ node }, ...types) {
    return node.parent == null || !types.includes(node.parent.type);
  }
};
var IsNthChild = class extends QueryPredicateOperator {
  constructor() {
    super(...arguments);
    this.name = "is-nth-child?";
    this.schema = z.tuple([q.node, q.integer]);
  }
  run({ node }, n) {
    return node.parent?.children.findIndex((n2) => n2.id === node.id) === n;
  }
};
var HasMultipleChildrenOfType = class extends QueryPredicateOperator {
  constructor() {
    super(...arguments);
    this.name = "has-multiple-children-of-type?";
    this.schema = z.tuple([q.node, q.string]);
  }
  run({ node }, type2) {
    const count2 = node.children.filter((n) => n.type === type2).length;
    return count2 > 1;
  }
};
var ChildRange = class extends QueryPredicateOperator {
  constructor() {
    super(...arguments);
    this.name = "child-range!";
    this.schema = z.union([
      z.tuple([q.node, q.integer]),
      z.tuple([q.node, q.integer, q.integer]),
      z.tuple([q.node, q.integer, q.integer, q.boolean]),
      z.tuple([q.node, q.integer, q.integer, q.boolean, q.boolean])
    ]);
  }
  run(nodeInfo, startIndex, endIndex, excludeStart, excludeEnd) {
    const {
      node: { children }
    } = nodeInfo;
    startIndex = startIndex < 0 ? children.length + startIndex : startIndex;
    endIndex = endIndex == null ? -1 : endIndex;
    endIndex = endIndex < 0 ? children.length + endIndex : endIndex;
    const start = children[startIndex];
    const end = children[endIndex];
    nodeInfo.range = makeRangeFromPositions(
      excludeStart ? start.endPosition : start.startPosition,
      excludeEnd ? end.startPosition : end.endPosition
    );
    return true;
  }
};
var CharacterRange = class extends QueryPredicateOperator {
  constructor() {
    super(...arguments);
    this.name = "character-range!";
    this.schema = z.union([
      z.tuple([q.node, q.integer]),
      z.tuple([q.node, q.integer, q.integer])
    ]);
  }
  run(nodeInfo, startOffset, endOffset) {
    nodeInfo.range = new Range(
      nodeInfo.range.start.translate(void 0, startOffset),
      nodeInfo.range.end.translate(void 0, endOffset ?? 0)
    );
    return true;
  }
};
var ShrinkToMatch = class extends QueryPredicateOperator {
  constructor() {
    super(...arguments);
    this.name = "shrink-to-match!";
    this.schema = z.tuple([q.node, q.string]);
  }
  run(nodeInfo, pattern) {
    const { document, range: range3 } = nodeInfo;
    const text = document.getText(range3);
    const match = text.match(new RegExp(pattern, "ds"));
    if (match?.index == null) {
      throw Error(`No match for pattern '${pattern}'`);
    }
    const [startOffset, endOffset] = match.indices?.groups?.keep ?? match.indices[0];
    const baseOffset = document.offsetAt(range3.start);
    nodeInfo.range = new Range(
      document.positionAt(baseOffset + startOffset),
      document.positionAt(baseOffset + endOffset)
    );
    return true;
  }
};
var TrimEnd = class extends QueryPredicateOperator {
  constructor() {
    super(...arguments);
    this.name = "trim-end!";
    this.schema = z.tuple([q.node]);
  }
  run(nodeInfo) {
    const { document, range: range3 } = nodeInfo;
    const text = document.getText(range3);
    const whitespaceLength = text.length - text.trimEnd().length;
    if (whitespaceLength > 0) {
      nodeInfo.range = new Range(
        range3.start,
        adjustPosition(document, range3.end, -whitespaceLength)
      );
    }
    return true;
  }
};
var AllowMultiple = class extends QueryPredicateOperator {
  constructor() {
    super(...arguments);
    this.name = "allow-multiple!";
    this.schema = z.tuple([q.node]);
  }
  allowMissingNode() {
    return true;
  }
  run(nodeInfo) {
    nodeInfo.allowMultiple = true;
    return true;
  }
};
var Log = class extends QueryPredicateOperator {
  constructor() {
    super(...arguments);
    this.name = "log!";
    this.schema = z.tuple([q.node]);
  }
  run(nodeInfo) {
    console.log(`#log!: ${nodeInfo.name}@${nodeInfo.range}`);
    return true;
  }
};
var InsertionDelimiter = class extends QueryPredicateOperator {
  constructor() {
    super(...arguments);
    this.name = "insertion-delimiter!";
    this.schema = z.tuple([q.node, q.string]);
  }
  run(nodeInfo, insertionDelimiter) {
    nodeInfo.insertionDelimiter = insertionDelimiter;
    return true;
  }
};
var SingleOrMultilineDelimiter = class extends QueryPredicateOperator {
  constructor() {
    super(...arguments);
    this.name = "single-or-multi-line-delimiter!";
    this.schema = z.tuple([q.node, q.node, q.string, q.string]);
  }
  run(nodeInfo, conditionNodeInfo, insertionDelimiterConsequence, insertionDelimiterAlternative) {
    nodeInfo.insertionDelimiter = conditionNodeInfo.range.isSingleLine ? insertionDelimiterConsequence : insertionDelimiterAlternative;
    return true;
  }
};
var queryPredicateOperators = [
  new Log(),
  new NotType(),
  new TrimEnd(),
  new NotParentType(),
  new IsNthChild(),
  new ChildRange(),
  new CharacterRange(),
  new ShrinkToMatch(),
  new AllowMultiple(),
  new InsertionDelimiter(),
  new SingleOrMultilineDelimiter(),
  new HasMultipleChildrenOfType()
];

// ../cursorless-engine/src/languages/TreeSitterQuery/parsePredicates.ts
function parsePredicates(predicateDescriptors) {
  const errors2 = [];
  const predicates = [];
  predicateDescriptors.forEach((patternPredicateDescriptors, patternIdx) => {
    const patternPredicates = [];
    patternPredicateDescriptors.forEach((predicateDescriptor, predicateIdx) => {
      const operator = queryPredicateOperators.find(
        ({ name }) => name === predicateDescriptor.operator
      );
      if (operator == null) {
        errors2.push({
          patternIdx,
          predicateIdx,
          error: `Unknown predicate operator "${predicateDescriptor.operator}"`
        });
        return;
      }
      const result = operator.createPredicate(predicateDescriptor.operands);
      if (!result.success) {
        errors2.push(
          ...result.errors.map((error) => ({
            patternIdx,
            predicateIdx,
            error
          }))
        );
        return;
      }
      patternPredicates.push(result.predicate);
    });
    predicates.push(patternPredicates);
  });
  return { errors: errors2, predicates };
}

// ../cursorless-engine/src/languages/TreeSitterQuery/rewriteStartOfEndOf.ts
function rewriteStartOfEndOf(captures) {
  return captures.map((capture) => {
    if (capture.name.endsWith(".startOf")) {
      return {
        ...capture,
        name: capture.name.replace(/\.startOf$/, ""),
        range: capture.range.start.toEmptyRange()
      };
    }
    if (capture.name.endsWith(".endOf")) {
      return {
        ...capture,
        name: capture.name.replace(/\.endOf$/, ""),
        range: capture.range.end.toEmptyRange()
      };
    }
    return capture;
  });
}

// ../cursorless-engine/src/languages/TreeSitterQuery/TreeSitterQuery.ts
var TreeSitterQuery = class _TreeSitterQuery {
  constructor(treeSitter, query, patternPredicates) {
    this.treeSitter = treeSitter;
    this.query = query;
    this.patternPredicates = patternPredicates;
  }
  static create(languageId, treeSitter, query) {
    const { errors: errors2, predicates } = parsePredicates(query.predicates);
    if (errors2.length > 0) {
      for (const error of errors2) {
        const context = [
          `language ${languageId}`,
          `pattern ${error.patternIdx}`,
          `predicate \`${predicateToString(
            query.predicates[error.patternIdx][error.predicateIdx]
          )}\``
        ].join(", ");
        void showError(
          ide().messages,
          "TreeSitterQuery.parsePredicates",
          `Error parsing predicate for ${context}: ${error.error}`
        );
      }
      if (ide().runMode === "test") {
        throw new Error("Invalid predicates");
      }
    }
    return new _TreeSitterQuery(treeSitter, query, predicates);
  }
  matches(document, start, end) {
    return this.query.matches(this.treeSitter.getTree(document).rootNode, {
      startPosition: start == null ? void 0 : positionToPoint(start),
      endPosition: end == null ? void 0 : positionToPoint(end)
    }).map(
      ({ pattern, captures }) => ({
        patternIdx: pattern,
        captures: captures.map(({ name, node }) => ({
          name,
          node,
          document,
          range: getNodeRange(node),
          insertionDelimiter: void 0,
          allowMultiple: false,
          hasError: () => isContainedInErrorNode(node)
        }))
      })
    ).filter(
      (match) => this.patternPredicates[match.patternIdx].every(
        (predicate) => predicate(match)
      )
    ).map((match) => {
      const captures = Object.entries(
        groupBy_default(match.captures, ({ name }) => normalizeCaptureName(name))
      ).map(([name, captures2]) => {
        captures2 = rewriteStartOfEndOf(captures2);
        const capturesAreValid = checkCaptureStartEnd(
          captures2,
          ide().messages
        );
        if (!capturesAreValid && ide().runMode === "test") {
          throw new Error("Invalid captures");
        }
        return {
          name,
          range: captures2.map(({ range: range3 }) => range3).reduce((accumulator, range3) => range3.union(accumulator)),
          allowMultiple: captures2.some((capture) => capture.allowMultiple),
          insertionDelimiter: captures2.find(
            (capture) => capture.insertionDelimiter != null
          )?.insertionDelimiter,
          hasError: () => captures2.some((capture) => capture.hasError())
        };
      });
      return { ...match, captures };
    });
  }
  get captureNames() {
    return uniq_default(this.query.captureNames.map(normalizeCaptureName));
  }
};
function normalizeCaptureName(name) {
  return name.replace(/(\.(start|end))?(\.(startOf|endOf))?$/, "");
}
function positionToPoint(start) {
  return { row: start.line, column: start.character };
}

// ../cursorless-engine/src/languages/TreeSitterQuery/validateQueryCaptures.ts
var wildcard = "_";
var captureNames = [wildcard, ...simpleScopeTypeTypes];
var positionRelationships = ["prefix", "leading", "trailing"];
var positionSuffixes = ["startOf", "endOf"];
var rangeRelationships = [
  "domain",
  "removal",
  "interior",
  "iteration",
  "iteration.domain"
];
var rangeSuffixes = [
  "start",
  "end",
  "start.startOf",
  "start.endOf",
  "end.startOf",
  "end.endOf"
];
var allowedCaptures = /* @__PURE__ */ new Set();
for (const captureName of captureNames) {
  if (captureName !== wildcard) {
    allowedCaptures.add(captureName);
    for (const suffix of rangeSuffixes) {
      allowedCaptures.add(`${captureName}.${suffix}`);
    }
  }
  for (const relationship of positionRelationships) {
    allowedCaptures.add(`${captureName}.${relationship}`);
    for (const suffix of positionSuffixes) {
      allowedCaptures.add(`${captureName}.${relationship}.${suffix}`);
    }
  }
  for (const relationship of rangeRelationships) {
    allowedCaptures.add(`${captureName}.${relationship}`);
    for (const suffix of rangeSuffixes) {
      allowedCaptures.add(`${captureName}.${relationship}.${suffix}`);
    }
  }
}
var capturePattern = new RegExp(`^(?!;;).*@([\\w.]*)`, "gm");
function validateQueryCaptures(file, rawQuery) {
  const matches = rawQuery.matchAll(capturePattern);
  const errors2 = [];
  for (const match of matches) {
    const captureName = match[1];
    if (captureName.length > 1 && !captureName.includes(".") && captureName.startsWith("_")) {
      continue;
    }
    if (!allowedCaptures.has(captureName)) {
      const lineNumber = match.input.slice(0, match.index).split("\n").length;
      errors2.push(`${file}(${lineNumber}) invalid capture '@${captureName}'.`);
    }
  }
  if (errors2.length === 0) {
    return;
  }
  const message = errors2.join("\n");
  void showError(
    ide().messages,
    "validateQueryCaptures.invalidCaptureName",
    message
  );
  if (ide().runMode === "test") {
    throw new Error(message);
  }
}

// ../cursorless-engine/src/languages/LanguageDefinition.ts
var LanguageDefinition = class _LanguageDefinition {
  constructor(query) {
    this.query = query;
  }
  /**
   * Construct a language definition for the given language id, if the language
   * has a new-style query definition, or return undefined if the language doesn't
   *
   * @param treeSitter The tree-sitter instance to use for parsing
   * @param languageId The language id for which to create a language definition
   * @returns A language definition for the given language id, or undefined if the given language
   * id doesn't have a new-style query definition
   */
  static async create(ide2, treeSitterQueryProvider, treeSitter, languageId) {
    const rawLanguageQueryString = await readQueryFileAndImports(
      ide2,
      treeSitterQueryProvider,
      `${languageId}.scm`
    );
    if (rawLanguageQueryString == null) {
      return void 0;
    }
    if (!await treeSitter.loadLanguage(languageId)) {
      return void 0;
    }
    const rawQuery = treeSitter.getLanguage(languageId).query(rawLanguageQueryString);
    const query = TreeSitterQuery.create(languageId, treeSitter, rawQuery);
    return new _LanguageDefinition(query);
  }
  /**
   * @param scopeType The scope type for which to get a scope handler
   * @returns A scope handler for the given scope type and language id, or
   * undefined if the given scope type / language id combination is still using
   * legacy pathways
   */
  getScopeHandler(scopeType) {
    if (!this.query.captureNames.includes(scopeType.type)) {
      return void 0;
    }
    return new TreeSitterScopeHandler(this.query, scopeType);
  }
  /**
   * This is a low-level function that just returns a list of captures of the given
   * capture name in the document. We use this in our surrounding pair code.
   *
   * @param document The document to search
   * @param captureName The name of a capture to search for
   * @returns A list of captures of the given capture name in the document
   */
  getCaptures(document, captureName) {
    return this.query.matches(document).map((match) => match.captures.find(({ name }) => name === captureName)).filter((capture) => capture != null);
  }
};
async function readQueryFileAndImports(ide2, provider, languageQueryName) {
  const rawQueryStrings = {
    [languageQueryName]: null
  };
  const doValidation = ide2.runMode !== "production";
  while (Object.values(rawQueryStrings).some((v) => v == null)) {
    for (const [queryName, rawQueryString] of Object.entries(rawQueryStrings)) {
      if (rawQueryString != null) {
        continue;
      }
      let rawQuery = await provider.readQuery(queryName);
      if (rawQuery == null) {
        if (queryName === languageQueryName) {
          return void 0;
        }
        void showError(
          ide2.messages,
          "LanguageDefinition.readQueryFileAndImports.queryNotFound",
          `Could not find imported query file ${queryName}`
        );
        if (ide2.runMode === "test") {
          throw new Error("Invalid import statement");
        }
        rawQuery = "";
      }
      if (doValidation) {
        validateQueryCaptures(queryName, rawQuery);
      }
      rawQueryStrings[queryName] = rawQuery;
      matchAll(
        rawQuery,
        // Matches lines like:
        //
        // ;; import path/to/query.scm
        //
        // but is very lenient about whitespace and quotes, and also allows
        // include instead of import, so that we can throw a nice error message
        // if the developer uses the wrong syntax
        /^[^\S\r\n]*;;?[^\S\r\n]*(?:import|include)[^\S\r\n]+['"]?([\w|/\\.]+)['"]?[^\S\r\n]*$/gm,
        (match) => {
          const importName = match[1];
          if (doValidation) {
            validateImportSyntax(ide2, queryName, importName, match[0]);
          }
          rawQueryStrings[importName] = rawQueryStrings[importName] ?? null;
        }
      );
    }
  }
  return Object.values(rawQueryStrings).join("\n");
}
function validateImportSyntax(ide2, file, importName, actual) {
  let isError = false;
  if (/[/\\]/g.test(importName)) {
    void showError(
      ide2.messages,
      "LanguageDefinition.readQueryFileAndImports.invalidImport",
      `Invalid import statement in ${file}: "${actual}". Relative import paths not supported`
    );
    isError = true;
  }
  const canonicalSyntax = `;; import ${importName}`;
  if (actual !== canonicalSyntax) {
    void showError(
      ide2.messages,
      "LanguageDefinition.readQueryFileAndImports.malformedImport",
      `Malformed import statement in ${file}: "${actual}". Import statements must be of the form "${canonicalSyntax}"`
    );
    isError = true;
  }
  if (isError && ide2.runMode === "test") {
    throw new Error("Invalid import statement");
  }
}

// ../cursorless-engine/src/languages/LanguageDefinitions.ts
var LANGUAGE_UNDEFINED = Symbol("LANGUAGE_UNDEFINED");
var LanguageDefinitionsImpl = class _LanguageDefinitionsImpl {
  constructor(ide2, treeSitter, treeSitterQueryProvider) {
    this.ide = ide2;
    this.treeSitter = treeSitter;
    this.treeSitterQueryProvider = treeSitterQueryProvider;
    this.notifier = new Notifier();
    /**
     * Maps from language id to {@link LanguageDefinition} or
     * {@link LANGUAGE_UNDEFINED} if language doesn't have new-style definitions.
     * We use a sentinel value instead of undefined so that we can distinguish
     * between a situation where we haven't yet checked whether a language has a
     * new-style query definition and a situation where we've checked and found
     * that it doesn't.  The former case is represented by `undefined` (due to the
     * semantics of {@link Map.get}), while the latter is represented by the
     * sentinel value.
     */
    this.languageDefinitions = /* @__PURE__ */ new Map();
    this.disposables = [];
    this.onDidChangeDefinition = this.notifier.registerListener;
    ide2.onDidOpenTextDocument((document) => {
      void this.loadLanguage(document.languageId);
    });
    ide2.onDidChangeVisibleTextEditors((editors) => {
      editors.forEach(({ document }) => this.loadLanguage(document.languageId));
    });
    this.disposables.push(
      treeSitterQueryProvider.onChanges(() => this.reloadLanguageDefinitions())
    );
  }
  static async create(ide2, treeSitter, treeSitterQueryProvider) {
    const instance = new _LanguageDefinitionsImpl(
      ide2,
      treeSitter,
      treeSitterQueryProvider
    );
    await instance.loadAllLanguages();
    return instance;
  }
  async loadAllLanguages() {
    const languageIds = this.ide.visibleTextEditors.map(
      ({ document }) => document.languageId
    );
    try {
      await Promise.all(
        languageIds.map((languageId) => this.loadLanguage(languageId))
      );
    } catch (err) {
      void showError(
        this.ide.messages,
        "Failed to load language definitions",
        toString_default(err)
      );
      if (this.ide.runMode === "test") {
        throw err;
      }
    }
  }
  async loadLanguage(languageId) {
    if (this.languageDefinitions.has(languageId)) {
      return;
    }
    const definition = await LanguageDefinition.create(
      this.ide,
      this.treeSitterQueryProvider,
      this.treeSitter,
      languageId
    ) ?? LANGUAGE_UNDEFINED;
    this.languageDefinitions.set(languageId, definition);
  }
  async reloadLanguageDefinitions() {
    this.languageDefinitions.clear();
    await this.loadAllLanguages();
    this.notifier.notifyListeners();
  }
  get(languageId) {
    const definition = this.languageDefinitions.get(languageId);
    if (definition == null) {
      throw new Error(
        "Expected language definition entry is missing for languageId " + languageId
      );
    }
    return definition === LANGUAGE_UNDEFINED ? void 0 : definition;
  }
  getNodeAtLocation(document, range3) {
    return this.treeSitter.getNodeAtLocation(document, range3);
  }
  dispose() {
    this.disposables.forEach((disposable) => disposable.dispose());
  }
};

// ../cursorless-engine/src/processTargets/modifiers/CascadingStage.ts
var CascadingStage = class {
  constructor(modifierStageFactory, modifier) {
    this.modifierStageFactory = modifierStageFactory;
    this.modifier = modifier;
  }
  get nestedStages() {
    if (this.nestedStages_ == null) {
      this.nestedStages_ = this.modifier.modifiers.map(
        this.modifierStageFactory.create
      );
    }
    return this.nestedStages_;
  }
  run(target) {
    for (const nestedStage of this.nestedStages) {
      try {
        return nestedStage.run(target);
      } catch (_error) {
        continue;
      }
    }
    throw new Error("No modifier could be applied");
  }
};

// ../cursorless-engine/src/processTargets/modifiers/ConditionalModifierStages.ts
var ConditionalModifierBaseStage = class {
  constructor(modifierStageFactory, nestedModifier) {
    this.modifierStageFactory = modifierStageFactory;
    this.nestedModifier = nestedModifier;
    this.suppressErrors = false;
  }
  run(target) {
    if (this.shouldModify(target)) {
      try {
        return this.nestedStage.run(target).map((newTarget) => newTarget.withThatTarget(target));
      } catch (ex) {
        if (!this.suppressErrors) {
          throw ex;
        }
      }
    }
    return [target];
  }
  get nestedStage() {
    if (this.nestedStage_ == null) {
      this.nestedStage_ = this.modifierStageFactory.create(this.nestedModifier);
    }
    return this.nestedStage_;
  }
};
var ModifyIfUntypedStage = class extends ConditionalModifierBaseStage {
  constructor(modifierStageFactory, modifier) {
    super(modifierStageFactory, modifier.modifier);
  }
  shouldModify(target) {
    return !target.hasExplicitScopeType;
  }
};
var ModifyIfConditionStage = class extends ConditionalModifierBaseStage {
  constructor(modifierStageFactory, nestedModifier, modificationCondition) {
    super(modifierStageFactory, nestedModifier);
    this.modificationCondition = modificationCondition;
  }
  shouldModify(target) {
    return this.modificationCondition(target);
  }
};
var ModifyIfUntypedExplicitStage = class extends ConditionalModifierBaseStage {
  shouldModify(target) {
    return !target.hasExplicitScopeType && !target.isImplicit;
  }
};
var ContainingTokenIfUntypedEmptyStage = class extends ConditionalModifierBaseStage {
  constructor(modifierStageFactory) {
    super(modifierStageFactory, {
      type: "containingScope",
      scopeType: { type: "token" }
    });
    this.suppressErrors = true;
  }
  shouldModify(target) {
    return !target.hasExplicitScopeType && !target.hasExplicitRange && target.contentRange.isEmpty;
  }
};

// ../cursorless-engine/src/util/typeUtils.ts
function isSameType(a, b) {
  return Object.getPrototypeOf(a).constructor === Object.getPrototypeOf(b).constructor;
}

// ../cursorless-engine/src/processTargets/createContinuousRangeTarget.ts
function createContinuousRangeTarget(isReversed, startTarget, endTarget, includeStart, includeEnd) {
  if (includeStart && includeEnd && isSameType(startTarget, endTarget)) {
    const richTarget = startTarget.maybeCreateRichRangeTarget(
      isReversed,
      endTarget
    );
    if (richTarget != null) {
      return richTarget;
    }
  }
  if (startTarget.isLine && endTarget.isLine) {
    return new LineTarget({
      editor: startTarget.editor,
      isReversed,
      contentRange: createContinuousLineRange(
        startTarget,
        endTarget,
        includeStart,
        includeEnd
      )
    });
  }
  return new UntypedTarget({
    editor: startTarget.editor,
    isReversed,
    hasExplicitRange: true,
    contentRange: createContinuousRange(
      startTarget,
      endTarget,
      includeStart,
      includeEnd
    ),
    isToken: includeStart && includeEnd && startTarget.isToken && endTarget.isToken
  });
}

// ../cursorless-engine/src/processTargets/modifiers/constructScopeRangeTarget.ts
function constructScopeRangeTarget(isReversed, scope1, scope2) {
  if (scope1 === scope2) {
    return scope1.getTargets(isReversed);
  }
  const targets1 = scope1.getTargets(isReversed);
  const targets2 = scope2.getTargets(isReversed);
  if (targets1.length !== 1 || targets2.length !== 1) {
    throw Error("Scope range targets must be single-target");
  }
  const [target1] = targets1;
  const [target2] = targets2;
  const isScope2After = target2.contentRange.start.isAfterOrEqual(
    target1.contentRange.start
  );
  const [startTarget, endTarget] = isScope2After ? [target1, target2] : [target2, target1];
  return [
    createContinuousRangeTarget(isReversed, startTarget, endTarget, true, true)
  ];
}

// ../cursorless-engine/src/processTargets/modifiers/getPreferredScopeTouchingPosition.ts
function getPreferredScopeTouchingPosition(scopeHandler, editor, position, forceDirection) {
  const candidates = Array.from(
    scopeHandler.generateScopes(editor, position, "forward", {
      containment: "required",
      allowAdjacentScopes: true,
      skipAncestorScopes: true
    })
  );
  switch (candidates.length) {
    case 0:
      return void 0;
    case 1:
      return candidates[0];
    case 2: {
      const [backwardScope, forwardScope] = candidates;
      if (forceDirection === "forward") {
        return forwardScope;
      }
      if (forceDirection === "backward") {
        return backwardScope;
      }
      if (scopeHandler.isPreferredOver?.(backwardScope, forwardScope) ?? false) {
        return backwardScope;
      }
      return forwardScope;
    }
    default:
      throw new Error("Expected no more than 2 scope candidates");
  }
}

// ../cursorless-engine/src/processTargets/modifiers/getContainingScopeTarget.ts
function getContainingScopeTarget(target, scopeHandler, ancestorIndex = 0) {
  const {
    isReversed,
    editor,
    contentRange: { start, end }
  } = target;
  if (end.isEqual(start)) {
    let scope = getPreferredScopeTouchingPosition(scopeHandler, editor, start);
    if (scope == null) {
      return void 0;
    }
    if (ancestorIndex > 0) {
      scope = expandFromPosition(
        scopeHandler,
        editor,
        scope.domain.end,
        "forward",
        ancestorIndex,
        true
      );
    }
    if (scope == null) {
      return void 0;
    }
    return scope.getTargets(isReversed);
  }
  const startScope = expandFromPosition(
    scopeHandler,
    editor,
    start,
    "forward",
    ancestorIndex
  );
  if (startScope == null) {
    return void 0;
  }
  if (startScope.domain.contains(end)) {
    return startScope.getTargets(isReversed);
  }
  const endScope = expandFromPosition(
    scopeHandler,
    editor,
    end,
    "backward",
    ancestorIndex
  );
  if (endScope == null) {
    return void 0;
  }
  return constructScopeRangeTarget(isReversed, startScope, endScope);
}
function expandFromPosition(scopeHandler, editor, position, direction, ancestorIndex, allowAdjacentScopes = false) {
  let nextAncestorIndex = 0;
  for (const scope of scopeHandler.generateScopes(editor, position, direction, {
    containment: "required",
    allowAdjacentScopes
  })) {
    if (nextAncestorIndex === ancestorIndex) {
      return scope;
    }
    nextAncestorIndex += 1;
  }
  return void 0;
}

// ../cursorless-engine/src/processTargets/modifiers/ContainingScopeStage.ts
var ContainingScopeStage = class {
  constructor(modifierStageFactory, scopeHandlerFactory, modifier) {
    this.modifierStageFactory = modifierStageFactory;
    this.scopeHandlerFactory = scopeHandlerFactory;
    this.modifier = modifier;
  }
  run(target) {
    const { scopeType, ancestorIndex = 0 } = this.modifier;
    const scopeHandler = this.scopeHandlerFactory.create(
      scopeType,
      target.editor.document.languageId
    );
    if (scopeHandler == null) {
      return this.modifierStageFactory.getLegacyScopeStage(this.modifier).run(target);
    }
    const containingScope = getContainingScopeTarget(
      target,
      scopeHandler,
      ancestorIndex
    );
    if (containingScope == null) {
      if (scopeType.type === "collectionItem") {
        return this.modifierStageFactory.getLegacyScopeStage(this.modifier).run(target);
      }
      throw new NoContainingScopeError(this.modifier.scopeType.type);
    }
    return containingScope;
  }
};

// ../cursorless-engine/src/processTargets/modifiers/EveryScopeStage.ts
var EveryScopeStage = class {
  constructor(modifierStageFactory, scopeHandlerFactory, modifier) {
    this.modifierStageFactory = modifierStageFactory;
    this.scopeHandlerFactory = scopeHandlerFactory;
    this.modifier = modifier;
  }
  run(target) {
    const { scopeType } = this.modifier;
    const { editor, isReversed } = target;
    const scopeHandler = this.scopeHandlerFactory.create(
      scopeType,
      editor.document.languageId
    );
    if (scopeHandler == null) {
      return this.modifierStageFactory.getLegacyScopeStage(this.modifier).run(target);
    }
    let scopes;
    if (target.hasExplicitRange) {
      scopes = getScopesOverlappingRange(
        scopeHandler,
        editor,
        target.contentRange
      );
      if (scopes.length === 1 && scopes[0].domain.contains(target.contentRange)) {
        scopes = void 0;
      }
    }
    if (scopes == null) {
      try {
        scopes = this.getDefaultIterationRange(
          scopeHandler,
          this.scopeHandlerFactory,
          target
        ).flatMap(
          (iterationRange) => getScopesOverlappingRange(scopeHandler, editor, iterationRange)
        );
      } catch (error) {
        if (!(error instanceof NoContainingScopeError)) {
          throw error;
        }
        scopes = [];
      }
    }
    if (scopes.length === 0) {
      if (scopeType.type === "collectionItem") {
        return this.modifierStageFactory.getLegacyScopeStage(this.modifier).run(target);
      }
      throw new NoContainingScopeError(scopeType.type);
    }
    return scopes.flatMap((scope) => scope.getTargets(isReversed));
  }
  getDefaultIterationRange(scopeHandler, scopeHandlerFactory, target) {
    const iterationScopeHandler = scopeHandlerFactory.create(
      scopeHandler.iterationScopeType,
      target.editor.document.languageId
    );
    if (iterationScopeHandler == null) {
      throw Error("Could not find iteration scope handler");
    }
    const iterationScopeTarget = getContainingScopeTarget(
      target,
      iterationScopeHandler
    );
    if (iterationScopeTarget == null) {
      throw new NoContainingScopeError(
        `iteration scope for ${scopeHandler.scopeType.type}`
      );
    }
    return iterationScopeTarget.map((target2) => target2.contentRange);
  }
};
function getScopesOverlappingRange(scopeHandler, editor, { start, end }) {
  return Array.from(
    scopeHandler.generateScopes(editor, start, "forward", {
      distalPosition: end,
      skipAncestorScopes: true,
      allowAdjacentScopes: scopeHandler.includeAdjacentInEvery
    })
  );
}

// ../cursorless-engine/src/processTargets/modifiers/FilterStages.ts
var KeepContentFilterStage = class {
  constructor(modifier) {
    this.modifier = modifier;
  }
  run(target) {
    return target.contentText.trim() !== "" ? [target] : [];
  }
};
var KeepEmptyFilterStage = class {
  constructor(modifier) {
    this.modifier = modifier;
  }
  run(target) {
    return target.contentText.trim() === "" ? [target] : [];
  }
};

// ../cursorless-engine/src/processTargets/marks/ImplicitStage.ts
var ImplicitStage = class {
  run() {
    return getActiveSelections(ide()).map(
      (selection) => new ImplicitTarget({
        editor: selection.editor,
        isReversed: selection.selection.isReversed,
        contentRange: selection.selection
      })
    );
  }
};

// ../cursorless-engine/src/processTargets/TargetPipelineRunner.ts
var TargetPipelineRunner = class {
  constructor(modifierStageFactory, markStageFactory) {
    this.modifierStageFactory = modifierStageFactory;
    this.markStageFactory = markStageFactory;
  }
  /**
   * Converts the abstract target descriptions provided by the user to a
   * concrete representation usable by actions. Conceptually, the input will be
   * something like "the function call argument containing the cursor" and the
   * output will be something like "line 3, characters 5 through 10".
   * @param target The abstract target representations provided by the user
   * @param actionFinalStages Modifier stages contributed by the action that
   * should run at the end of the modifier pipeline
   * @returns A list of lists of typed selections, one list per input target.
   * Each typed selection includes the selection, as well the uri of the
   * document containing it, and potentially rich context information such as
   * how to remove the target
   */
  run(target, {
    actionFinalStages = [],
    noAutomaticTokenExpansion = false
  } = {}) {
    return new TargetPipeline(
      this.modifierStageFactory,
      this.markStageFactory,
      target,
      { actionFinalStages, noAutomaticTokenExpansion }
    ).run();
  }
};
var TargetPipeline = class {
  constructor(modifierStageFactory, markStageFactory, target, opts) {
    this.modifierStageFactory = modifierStageFactory;
    this.markStageFactory = markStageFactory;
    this.target = target;
    this.opts = opts;
  }
  /**
   * Converts the abstract target descriptions provided by the user to a concrete
   * representation usable by actions. Conceptually, the input will be something
   * like "the function call argument containing the cursor" and the output will be something
   * like "line 3, characters 5 through 10".
   * @param context Captures the environment needed to convert the abstract target
   *    description given by the user to a concrete representation usable by
   *    actions
   * @param targets The abstract target representations provided by the user
   * @returns A list of lists of typed selections, one list per input target. Each
   * typed selection includes the selection, as well the uri of the document
   * containing it, and potentially rich context information such as how to remove
   * the target
   */
  run() {
    return uniqTargets(this.processTarget(this.target));
  }
  processTarget(target) {
    switch (target.type) {
      case "list":
        return target.elements.flatMap(
          (element) => this.processTarget(element)
        );
      case "range":
        return this.processRangeTarget(target);
      case "primitive":
      case "implicit":
        return this.processPrimitiveTarget(target);
    }
  }
  processRangeTarget(targetDesc) {
    const anchorTargets = this.processPrimitiveTarget(targetDesc.anchor);
    const activeTargets = this.processPrimitiveTarget(targetDesc.active);
    return zip_default(anchorTargets, activeTargets).flatMap(
      ([anchorTarget, activeTarget]) => {
        if (anchorTarget == null || activeTarget == null) {
          throw new Error(
            "AnchorTargets and activeTargets lengths don't match"
          );
        }
        switch (targetDesc.rangeType) {
          case "continuous":
            return this.processContinuousRangeTarget(
              anchorTarget,
              activeTarget,
              targetDesc
            );
          case "vertical":
            return targetsToVerticalTarget(
              anchorTarget,
              activeTarget,
              targetDesc.excludeAnchor,
              targetDesc.excludeActive
            );
        }
      }
    );
  }
  processContinuousRangeTarget(anchorTarget, activeTarget, { excludeAnchor, excludeActive, exclusionScopeType }) {
    if (exclusionScopeType == null) {
      return [
        targetsToContinuousTarget(
          anchorTarget,
          activeTarget,
          excludeAnchor,
          excludeActive
        )
      ];
    }
    const isReversed = calcIsReversed(anchorTarget, activeTarget);
    return [
      targetsToContinuousTarget(
        excludeAnchor ? getExcludedScope(
          this.modifierStageFactory,
          anchorTarget,
          exclusionScopeType,
          isReversed ? "backward" : "forward"
        ) : anchorTarget,
        excludeActive ? getExcludedScope(
          this.modifierStageFactory,
          activeTarget,
          exclusionScopeType,
          isReversed ? "forward" : "backward"
        ) : activeTarget,
        false,
        false
      )
    ];
  }
  /**
   * This function implements the modifier pipeline that is at the core of Cursorless target processing.
   * It proceeds as follows:
   *
   * 1. It begins by getting the output from the {@link markStage} (eg "air", "this", etc).
   * This output is a list of zero or more targets.
   * 2. It then constructs a pipeline from the modifiers on the {@link targetDescriptor}
   * 3. It then runs each pipeline stage in turn, feeding the first stage with
   * the list of targets output from the {@link markStage}.  For each pipeline
   * stage, it passes the targets from the previous stage to the pipeline stage
   * one by one.  For each target, the stage will output a list of zero or more output
   * targets.  It then concatenates all of these lists into the list of targets
   * that will be passed to the next pipeline stage.  This process is similar to
   * the way that [jq](https://stedolan.github.io/jq/) processes its inputs.
   *
   * @param targetDescriptor The description of the target, consisting of a mark
   * and zero or more modifiers
   * @returns The output of running the modifier pipeline on the output from the mark
   */
  processPrimitiveTarget(targetDescriptor) {
    let markStage;
    let targetModifierStages;
    if (targetDescriptor.type === "implicit") {
      markStage = new ImplicitStage();
      targetModifierStages = [];
    } else {
      markStage = this.markStageFactory.create(targetDescriptor.mark);
      targetModifierStages = getModifierStagesFromTargetModifiers(
        this.modifierStageFactory,
        targetDescriptor.modifiers
      );
    }
    const markOutputTargets = markStage.run();
    const modifierStages = [
      ...targetModifierStages,
      ...this.opts.actionFinalStages,
      // This performs auto-expansion to token when you say eg "take this" with an
      // empty selection
      ...this.opts.noAutomaticTokenExpansion ? [] : [new ContainingTokenIfUntypedEmptyStage(this.modifierStageFactory)]
    ];
    return processModifierStages(modifierStages, markOutputTargets);
  }
};
function getModifierStagesFromTargetModifiers(modifierStageFactory, targetModifiers) {
  return targetModifiers.map(modifierStageFactory.create).reverse();
}
function processModifierStages(modifierStages, targets) {
  modifierStages.forEach((stage) => {
    targets = targets.flatMap((target) => stage.run(target));
  });
  return targets;
}
function getExcludedScope(modifierStageFactory, target, scopeType, direction) {
  return modifierStageFactory.create({
    type: "relativeScope",
    scopeType,
    direction,
    length: 1,
    offset: 1
  }).run(target)[0];
}
function calcIsReversed(anchor, active) {
  if (anchor.contentRange.start.isAfter(active.contentRange.start)) {
    return true;
  }
  if (anchor.contentRange.start.isBefore(active.contentRange.start)) {
    return false;
  }
  return anchor.contentRange.end.isAfter(active.contentRange.end);
}
function uniqTargets(array) {
  return uniqWithHash(
    array,
    (a, b) => a.isEqual(b),
    (a) => a.contentRange.concise()
  );
}
function ensureSingleEditor(anchorTarget, activeTarget) {
  if (anchorTarget.editor !== activeTarget.editor) {
    throw new Error("Cannot form range between targets in different editors");
  }
}
function targetsToContinuousTarget(anchorTarget, activeTarget, excludeAnchor = false, excludeActive = false) {
  ensureSingleEditor(anchorTarget, activeTarget);
  const isReversed = calcIsReversed(anchorTarget, activeTarget);
  const startTarget = isReversed ? activeTarget : anchorTarget;
  const endTarget = isReversed ? anchorTarget : activeTarget;
  const excludeStart = isReversed ? excludeActive : excludeAnchor;
  const excludeEnd = isReversed ? excludeAnchor : excludeActive;
  return createContinuousRangeTarget(
    isReversed,
    startTarget,
    endTarget,
    !excludeStart,
    !excludeEnd
  );
}
function targetsToVerticalTarget(anchorTarget, activeTarget, excludeAnchor, excludeActive) {
  ensureSingleEditor(anchorTarget, activeTarget);
  const isReversed = calcIsReversed(anchorTarget, activeTarget);
  const delta = isReversed ? -1 : 1;
  const anchorPosition = isReversed ? anchorTarget.contentRange.start : anchorTarget.contentRange.end;
  const anchorLine = anchorPosition.line + (excludeAnchor ? delta : 0);
  const activePosition = isReversed ? activeTarget.contentRange.start : activeTarget.contentRange.end;
  const activeLine = activePosition.line - (excludeActive ? delta : 0);
  const results = [];
  for (let i = anchorLine; true; i += delta) {
    const contentRange = new Range(
      i,
      anchorTarget.contentRange.start.character,
      i,
      anchorTarget.contentRange.end.character
    );
    results.push(
      new PlainTarget({
        editor: anchorTarget.editor,
        isReversed: anchorTarget.isReversed,
        contentRange,
        insertionDelimiter: anchorTarget.insertionDelimiter
      })
    );
    if (i === activeLine) {
      return results;
    }
  }
}

// ../cursorless-engine/src/processTargets/modifiers/HeadTailStage.ts
var HeadTailStage = class {
  constructor(modifierStageFactory, modifier) {
    this.modifierStageFactory = modifierStageFactory;
    this.modifier = modifier;
  }
  run(target) {
    const modifiers = this.modifier.modifiers ?? [
      {
        type: "containingScope",
        scopeType: {
          type: "oneOf",
          scopeTypes: [
            {
              type: "line"
            },
            {
              type: "surroundingPairInterior",
              delimiter: "any",
              requireSingleLine: true
            }
          ]
        }
      }
    ];
    const modifierStages = getModifierStagesFromTargetModifiers(
      this.modifierStageFactory,
      modifiers
    );
    const modifiedTargets = processModifierStages(modifierStages, [target]);
    return modifiedTargets.map((modifiedTarget) => {
      const isHead = this.modifier.type === "extendThroughStartOf";
      return new HeadTailTarget({
        editor: target.editor,
        isReversed: isHead,
        inputTarget: target,
        modifiedTarget,
        isHead
      });
    });
  }
};

// ../cursorless-engine/src/processTargets/modifiers/listUtils.ts
var OutOfRangeError = class extends Error {
  constructor() {
    super("Scope index out of range");
    this.name = "OutOfRangeError";
  }
};
function sliceStrict(targets, startIndex, endIndex) {
  assertIndices(targets, startIndex, endIndex);
  return targets.slice(startIndex, endIndex + 1);
}
function assertIndices(targets, startIndex, endIndex) {
  if (startIndex < 0 || endIndex >= targets.length) {
    throw new OutOfRangeError();
  }
}

// ../cursorless-engine/src/processTargets/modifiers/InstanceStage.ts
var InstanceStage = class {
  constructor(modifierStageFactory, storedTargets, modifier) {
    this.modifierStageFactory = modifierStageFactory;
    this.storedTargets = storedTargets;
    this.modifier = modifier;
  }
  run(inputTarget) {
    const target = new ContainingTokenIfUntypedEmptyStage(
      this.modifierStageFactory
    ).run(inputTarget)[0];
    switch (this.modifier.type) {
      case "everyScope":
        return this.handleEveryScope(target);
      case "ordinalScope":
        return this.handleOrdinalScope(target, this.modifier);
      case "relativeScope":
        return this.handleRelativeScope(target, this.modifier);
      default:
        throw Error(`${this.modifier.type} instance scope not supported`);
    }
  }
  handleEveryScope(target) {
    return Array.from(
      flatmap(
        this.getEveryRanges(target),
        ([editor, searchRange]) => this.getTargetIterable(target, editor, searchRange, "forward")
      )
    );
  }
  handleOrdinalScope(target, { start, length }) {
    return this.getEveryRanges(target).flatMap(
      ([editor, searchRange]) => takeFromOffset(
        this.getTargetIterable(
          target,
          editor,
          searchRange,
          start >= 0 ? "forward" : "backward"
        ),
        start >= 0 ? start : -(length + start),
        length
      )
    );
  }
  handleRelativeScope(target, { direction, offset, length }) {
    const referenceTargets = this.storedTargets.get("instanceReference") ?? [
      target
    ];
    return referenceTargets.flatMap((referenceTarget) => {
      const { editor } = referenceTarget;
      const iterationRange = direction === "forward" ? new Range(
        offset === 0 ? referenceTarget.contentRange.start : referenceTarget.contentRange.end,
        editor.document.range.end
      ) : new Range(
        editor.document.range.start,
        offset === 0 ? referenceTarget.contentRange.end : referenceTarget.contentRange.start
      );
      return takeFromOffset(
        this.getTargetIterable(target, editor, iterationRange, direction),
        offset === 0 ? 0 : offset - 1,
        length
      );
    });
  }
  getEveryRanges({
    editor: targetEditor
  }) {
    return this.storedTargets.get("instanceReference")?.map(({ editor, contentRange }) => [editor, contentRange]) ?? [[targetEditor, targetEditor.document.range]];
  }
  getTargetIterable(target, editor, searchRange, direction) {
    const iterable = imap(
      generateMatchesInRange(
        new RegExp(escapeRegExp_default(target.contentText), "g"),
        editor,
        searchRange,
        direction
      ),
      (range3) => new PlainTarget({
        contentRange: range3,
        editor,
        isReversed: false,
        isToken: false
      })
    );
    const filterScopeType = getFilterScopeType(target);
    if (filterScopeType != null) {
      const containingScopeModifier2 = this.modifierStageFactory.create({
        type: "containingScope",
        scopeType: filterScopeType
      });
      return ifilter(
        imap(iterable, (target2) => {
          try {
            const containingScope = containingScopeModifier2.run(target2);
            if (containingScope.length === 1 && containingScope[0].contentRange.isRangeEqual(target2.contentRange)) {
              return containingScope[0];
            }
            return null;
          } catch (_err) {
            return null;
          }
        }),
        (target2) => target2 != null
      );
    }
    return iterable;
  }
};
function getFilterScopeType(target) {
  if (target.isLine) {
    return { type: "line" };
  }
  if (target.isToken) {
    return { type: "token" };
  }
  if (target.isWord) {
    return { type: "word" };
  }
  return null;
}
function takeFromOffset(iterable, offset, count2) {
  Array.from(itake(offset, iterable));
  const items = Array.from(itake(count2, iterable));
  if (items.length < count2) {
    throw new OutOfRangeError();
  }
  return items;
}

// ../cursorless-engine/src/processTargets/modifiers/InteriorStage.ts
var InteriorOnlyStage = class {
  constructor(modifierStageFactory, modifier) {
    this.modifierStageFactory = modifierStageFactory;
    this.modifier = modifier;
    this.containingSurroundingPairIfNoInteriorStage = getContainingSurroundingPairIfNoInteriorStage(this.modifierStageFactory);
  }
  run(target) {
    return this.containingSurroundingPairIfNoInteriorStage.run(target).flatMap((target2) => target2.getInterior());
  }
};
var ExcludeInteriorStage = class {
  constructor(modifierStageFactory, modifier) {
    this.modifierStageFactory = modifierStageFactory;
    this.modifier = modifier;
    this.containingSurroundingPairIfNoBoundaryStage = getContainingSurroundingPairIfNoBoundaryStage(this.modifierStageFactory);
  }
  run(target) {
    return this.containingSurroundingPairIfNoBoundaryStage.run(target).flatMap((target2) => target2.getBoundary());
  }
};
function getContainingSurroundingPairIfNoInteriorStage(modifierStageFactory) {
  return new ModifyIfConditionStage(
    modifierStageFactory,
    {
      type: "containingScope",
      scopeType: { type: "surroundingPair", delimiter: "any" }
    },
    (target) => target.getInterior() == null
  );
}
function getContainingSurroundingPairIfNoBoundaryStage(modifierStageFactory) {
  return new ModifyIfConditionStage(
    modifierStageFactory,
    {
      type: "containingScope",
      scopeType: { type: "surroundingPair", delimiter: "any" }
    },
    (target) => target.getBoundary() == null
  );
}

// ../cursorless-engine/src/util/nodeFinders.ts
function chainedNodeFinder(...nodeFinders) {
  return (node) => {
    let currentNode = node;
    for (const nodeFinder of nodeFinders) {
      currentNode = nodeFinder(currentNode);
      if (currentNode == null) {
        return null;
      }
    }
    return currentNode;
  };
}
function ancestorChainNodeFinder(nodeToReturn, ...nodeFinders) {
  return (node) => {
    let currentNode = node;
    const nodeList = [];
    const nodeFindersReversed = [...nodeFinders].reverse();
    for (const nodeFinder of nodeFindersReversed) {
      if (currentNode == null) {
        return null;
      }
      currentNode = nodeFinder(currentNode);
      if (currentNode == null) {
        return null;
      }
      nodeList.push(currentNode);
      currentNode = currentNode.parent ?? null;
    }
    return nodeList.reverse()[nodeToReturn];
  };
}
var toPosition = (point) => new Position(point.row, point.column);
var argumentNodeFinder = (...parentTypes) => {
  const left = ["(", "{", "[", "<"];
  const right = [")", "}", "]", ">"];
  const delimiters = left.concat(right);
  const isType = (node, typeNames) => node != null && typeNames.includes(node.type);
  const isOk = (node) => node != null && !isType(node, delimiters);
  return (node, selection) => {
    let resultNode;
    const { start, end } = selection;
    if (isType(node.parent, parentTypes)) {
      if (isType(node, left)) {
        resultNode = node.nextNamedSibling;
      } else if (isType(node, right)) {
        resultNode = node.previousNamedSibling;
      } else if (node.type === ",") {
        resultNode = end.isBeforeOrEqual(toPosition(node.startPosition)) ? node.previousNamedSibling : node.nextNamedSibling;
      } else {
        resultNode = node;
      }
      return isOk(resultNode) ? resultNode : null;
    } else if (isType(node, parentTypes)) {
      const children = [...node.children];
      const childRight = children.find(
        ({ startPosition }) => toPosition(startPosition).isAfterOrEqual(end)
      ) ?? null;
      if (isOk(childRight)) {
        return childRight;
      }
      children.reverse();
      const childLeft = children.find(
        ({ endPosition }) => toPosition(endPosition).isBeforeOrEqual(start)
      ) ?? null;
      if (isOk(childLeft)) {
        return childLeft;
      }
    }
    return null;
  };
};
function patternFinder(...patterns) {
  const parsedPatterns = parsePatternStrings(patterns);
  return (node) => {
    for (const pattern of parsedPatterns) {
      const match = tryPatternMatch(node, pattern);
      if (match != null) {
        return match;
      }
    }
    return null;
  };
}
function parsePatternStrings(patternStrings) {
  return patternStrings.map(
    (patternString) => patternString.split(".").map((pattern) => new Pattern(pattern))
  );
}
function tryPatternMatch(node, patterns) {
  let result = searchNodeAscending(node, patterns);
  if (!result && patterns.length > 1) {
    result = searchNodeDescending(node, patterns);
  }
  let resultNode = null;
  let resultPattern;
  if (result != null) {
    [resultNode, resultPattern] = result;
  }
  if (resultNode != null && resultPattern != null && resultPattern.fields != null) {
    resultPattern.fields.forEach((field) => {
      resultNode = (field.isIndex ? resultNode?.namedChild(field.value) : resultNode?.childForFieldName(field.value)) ?? null;
    });
  }
  return resultNode;
}
function searchNodeAscending(node, patterns) {
  let result = null;
  let currentNode = node;
  for (let i = patterns.length - 1; i > -1; --i) {
    const pattern = patterns[i];
    if (currentNode == null || !pattern.typeEquals(currentNode)) {
      if (pattern.isOptional) {
        continue;
      }
      return null;
    }
    if (!result || !result[1].isImportant) {
      result = [currentNode, pattern];
    }
    currentNode = currentNode.parent;
  }
  return result;
}
function searchNodeDescending(node, patterns) {
  let result = null;
  let currentNode = node;
  for (let i = 0; i < patterns.length; ++i) {
    const pattern = patterns[i];
    if (currentNode == null || !pattern.typeEquals(currentNode)) {
      if (pattern.isOptional) {
        continue;
      }
      return null;
    }
    if (!result || pattern.isImportant) {
      result = [currentNode, pattern];
    }
    if (i + 1 < patterns.length) {
      const children = currentNode.namedChildren.filter(
        (node2) => patterns[i + 1].typeEquals(node2)
      );
      currentNode = children.length === 1 ? children[0] : null;
    }
  }
  return result;
}
var Pattern = class {
  constructor(pattern) {
    this.anyType = false;
    this.notType = false;
    this.type = pattern.match(/^[\w*~]+/)[0];
    if (this.type === "*") {
      this.anyType = true;
    } else if (this.type.startsWith("~")) {
      this.type = this.type.slice(1);
      this.notType = true;
    }
    this.isImportant = pattern.indexOf("!") > -1;
    this.isOptional = pattern.indexOf("?") > -1;
    this.fields = [...pattern.matchAll(/(?<=\[).+?(?=\])/g)].map((m) => m[0]).map((field) => {
      if (/\d+/.test(field)) {
        return {
          isIndex: true,
          value: Number(field)
        };
      }
      return {
        isIndex: false,
        value: field
      };
    });
  }
  typeEquals(node) {
    if (this.anyType) {
      return true;
    }
    if (this.notType) {
      return this.type !== node.type;
    }
    return this.type === node.type;
  }
};

// ../cursorless-engine/src/util/nodeMatchers.ts
function matcher(finder, selector = simpleSelectionExtractor) {
  return function(selection, node) {
    const targetNode = finder(node, selection.selection);
    return targetNode != null ? [
      {
        node: targetNode,
        selection: selector(selection.editor, targetNode)
      }
    ] : null;
  };
}
function chainedMatcher(finders, selector = simpleSelectionExtractor) {
  const nodeFinder = chainedNodeFinder(...finders);
  return function(selection, initialNode) {
    const returnNode = nodeFinder(initialNode);
    if (returnNode == null) {
      return null;
    }
    return [
      {
        node: returnNode,
        selection: selector(selection.editor, returnNode)
      }
    ];
  };
}
function ancestorChainNodeMatcher(nodeFinders, nodeToReturn = 0, selector = simpleSelectionExtractor) {
  return matcher(
    ancestorChainNodeFinder(nodeToReturn, ...nodeFinders),
    selector
  );
}
function patternMatcher(...patterns) {
  return matcher(patternFinder(...patterns));
}
function argumentMatcher(...parentTypes) {
  return matcher(
    argumentNodeFinder(...parentTypes),
    argumentSelectionExtractor()
  );
}
function conditionMatcher(...patterns) {
  return matcher(patternFinder(...patterns), unwrapSelectionExtractor);
}
function leadingMatcher(patterns, delimiters = []) {
  return matcher(
    patternFinder(...patterns),
    selectWithLeadingDelimiter(...delimiters)
  );
}
function trailingMatcher(patterns, delimiters = []) {
  return matcher(
    patternFinder(...patterns),
    selectWithTrailingDelimiter(...delimiters)
  );
}
function cascadingMatcher(...matchers2) {
  return (selection, node) => {
    for (const matcher2 of matchers2) {
      const match = matcher2(selection, node);
      if (match != null) {
        return match;
      }
    }
    return null;
  };
}
function notSupported(scopeTypeType) {
  return (_selection, _node) => {
    throw new Error(`Node type '${scopeTypeType}' not supported`);
  };
}
function createPatternMatchers(nodeMatchers7) {
  return Object.freeze(
    Object.fromEntries(
      unsafeKeys(nodeMatchers7).map((scopeType) => {
        const matcher2 = nodeMatchers7[scopeType];
        if (Array.isArray(matcher2)) {
          return [scopeType, patternMatcher(...matcher2)];
        } else if (typeof matcher2 === "string") {
          return [scopeType, patternMatcher(matcher2)];
        } else {
          return [scopeType, matcher2];
        }
      })
    )
  );
}

// ../cursorless-engine/src/util/treeSitterUtils.ts
function getChildNodesForFieldName(node, fieldName) {
  const treeCursor = node.walk();
  treeCursor.gotoFirstChild();
  const ret = [];
  let hasNext = true;
  while (hasNext) {
    if (treeCursor.currentFieldName === fieldName) {
      ret.push(treeCursor.currentNode);
    }
    hasNext = treeCursor.gotoNextSibling();
  }
  return ret;
}

// ../cursorless-engine/src/languages/clojure.ts
function parityNodeFinder(parentFinder, parity) {
  return indexNodeFinder(
    parentFinder,
    (nodeIndex) => Math.floor(nodeIndex / 2) * 2 + parity
  );
}
function mapParityNodeFinder(parity) {
  return parityNodeFinder(patternFinder("map_lit"), parity);
}
function indexNodeFinder(parentFinder, indexTransform) {
  return (node) => {
    const parent = node.parent;
    if (parent == null || parentFinder(parent) == null) {
      return null;
    }
    const valueNodes = getValueNodes(parent);
    const nodeIndex = valueNodes.findIndex(({ id: id2 }) => id2 === node.id);
    if (nodeIndex === -1) {
      return null;
    }
    const desiredIndex = indexTransform(nodeIndex);
    if (desiredIndex === -1) {
      return null;
    }
    return valueNodes[desiredIndex];
  };
}
function itemFinder() {
  return indexNodeFinder(
    (node) => node,
    (nodeIndex) => nodeIndex
  );
}
var getValueNodes = (node) => getChildNodesForFieldName(node, "value");
var functionCallPattern = "~quoting_lit.list_lit!";
var functionCallFinder = patternFinder(functionCallPattern);
function functionNameBasedFinder(...names) {
  return (node) => {
    const functionCallNode = functionCallFinder(node);
    if (functionCallNode == null) {
      return null;
    }
    const functionNode = getValueNodes(functionCallNode)[0];
    return names.includes(functionNode?.text) ? functionCallNode : null;
  };
}
function functionNameBasedMatcher(...names) {
  return matcher(functionNameBasedFinder(...names));
}
var functionFinder = functionNameBasedFinder("defn", "defmacro");
var functionNameMatcher = chainedMatcher([
  functionFinder,
  (functionNode) => getValueNodes(functionNode)[1]
]);
var ifStatementFinder = functionNameBasedFinder(
  "if",
  "if-let",
  "when",
  "when-let"
);
var ifStatementMatcher = matcher(ifStatementFinder);
var nodeMatchers = {
  collectionKey: matcher(mapParityNodeFinder(0)),
  collectionItem: cascadingMatcher(
    // Treat each key value pair as a single item if we're in a map
    matcher(
      mapParityNodeFinder(0),
      delimitedSelector(
        (node) => node.type === "{" || node.type === "}",
        ", ",
        identity_default,
        mapParityNodeFinder(1)
      )
    ),
    // Otherwise just treat every item within a list as an item
    matcher(itemFinder())
  ),
  value: matcher(mapParityNodeFinder(1)),
  // FIXME: Handle formal parameters
  argumentOrParameter: matcher(
    indexNodeFinder(
      patternFinder(functionCallPattern),
      (nodeIndex) => nodeIndex !== 0 ? nodeIndex : -1
    )
  ),
  functionCall: functionCallPattern,
  functionCallee: chainedMatcher([
    functionCallFinder,
    (functionNode) => getValueNodes(functionNode)[0]
  ]),
  namedFunction: matcher(functionFinder),
  functionName: functionNameMatcher,
  // FIXME: Handle `let` declarations, defs, etc
  name: functionNameMatcher,
  anonymousFunction: cascadingMatcher(
    functionNameBasedMatcher("fn"),
    patternMatcher("anon_fn_lit")
  ),
  ifStatement: ifStatementMatcher,
  condition: chainedMatcher([
    ifStatementFinder,
    (node) => getValueNodes(node)[1]
  ])
};
var clojure_default = createPatternMatchers(nodeMatchers);

// ../cursorless-engine/src/languages/latex.ts
var COMMANDS = [
  "command",
  "displayed_equation",
  "inline_formula",
  "math_set",
  "block_comment",
  "package_include",
  "class_include",
  "latex_include",
  "biblatex_include",
  "bibtex_include",
  "graphics_include",
  "svg_include",
  "inkscape_include",
  "verbatim_include",
  "import_include",
  "caption",
  "citation",
  "label_definition",
  "label_reference",
  "label_reference_range",
  "label_number",
  "new_command_definition",
  "old_command_definition",
  "let_command_definition",
  "environment_definition",
  "glossary_entry_definition",
  "glossary_entry_reference",
  "acronym_definition",
  "acronym_reference",
  "theorem_definition",
  "color_definition",
  "color_set_definition",
  "color_reference",
  "tikz_library_import"
];
var GROUPS = [
  "curly_group",
  "curly_group_text",
  "curly_group_text_list",
  "curly_group_path",
  "curly_group_path_list",
  "curly_group_command_name",
  "curly_group_key_value",
  "curly_group_glob_pattern",
  "curly_group_impl",
  "brack_group",
  "brack_group_text",
  "brack_group_argc",
  "brack_group_key_value",
  "mixed_group"
];
var SECTIONING = [
  "subparagraph",
  "paragraph",
  "subsubsection",
  "subsection",
  "section",
  "chapter",
  "part"
];
var sectioningText = SECTIONING.map((s) => `${s}[text]`);
var sectioningCommand = SECTIONING.map((s) => `${s}[command]`);
function unwrapGroupParens(editor, node) {
  return {
    selection: new Selection(
      editor.document.positionAt(node.startIndex + 1),
      editor.document.positionAt(node.endIndex - 1)
    ),
    context: {
      removalRange: new Selection(
        editor.document.positionAt(node.startIndex),
        editor.document.positionAt(node.endIndex)
      )
    }
  };
}
function extendToNamedSiblingIfExists(editor, node) {
  const startIndex = node.startIndex;
  let endIndex = node.endIndex;
  const sibling = node.nextNamedSibling;
  if (sibling != null && sibling.isNamed) {
    endIndex = sibling.endIndex;
  }
  return {
    selection: new Selection(
      editor.document.positionAt(startIndex),
      editor.document.positionAt(endIndex)
    ),
    context: {}
  };
}
function extractItemContent(editor, node) {
  let contentStartIndex = node.startIndex;
  const label = node.childForFieldName("label");
  if (label == null) {
    const command = node.childForFieldName("command");
    if (command != null) {
      contentStartIndex = command.endIndex + 1;
    }
  } else {
    contentStartIndex = label.endIndex + 1;
  }
  return {
    selection: new Selection(
      editor.document.positionAt(contentStartIndex),
      editor.document.positionAt(node.endIndex)
    ),
    context: {
      leadingDelimiterRange: new Range(
        editor.document.positionAt(node.startIndex),
        editor.document.positionAt(contentStartIndex - 1)
      )
    }
  };
}
var nodeMatchers2 = {
  argumentOrParameter: cascadingMatcher(
    ancestorChainNodeMatcher(
      [patternFinder(...COMMANDS), patternFinder(...GROUPS)],
      1,
      unwrapGroupParens
    ),
    matcher(
      patternFinder("begin[name]", "end[name]", ...sectioningText),
      unwrapGroupParens
    )
  ),
  functionCall: cascadingMatcher(
    matcher(patternFinder(...COMMANDS, "begin", "end")),
    matcher(patternFinder(...sectioningCommand), extendToNamedSiblingIfExists)
  ),
  name: cascadingMatcher(
    matcher(patternFinder(...sectioningText), unwrapGroupParens),
    patternMatcher("begin[name][text]", "end[name][text]")
  ),
  collectionItem: matcher(patternFinder("enum_item"), extractItemContent)
};
var latex_default = createPatternMatchers(nodeMatchers2);

// ../cursorless-engine/src/languages/ruby.ts
var STATEMENT_TYPES = [
  "alias",
  "begin_block",
  "end_block",
  "if_modifier",
  "rescue_modifier",
  "undef",
  "unless_modifier",
  "until_modifier",
  "while_modifier"
];
var EXPRESSION_TYPES = [
  "array",
  "assignment",
  "begin",
  "binary",
  "break",
  "call",
  "case",
  "case_match",
  "chained_string",
  "character",
  "class",
  "class_variable",
  "complex",
  "conditional",
  "constant",
  "delimited_symbol",
  "element_reference",
  "false",
  "float",
  "for",
  "global_variable",
  "hash",
  "heredoc_beginning",
  "identifier",
  "if",
  "instance_variable",
  "integer",
  "lambda",
  "method",
  "module",
  "next",
  "nil",
  "operator_assignment",
  "parenthesized_statements",
  "range",
  "rational",
  "redo",
  "regex",
  "retry",
  "return",
  "scope_resolution",
  "self",
  "simple_symbol",
  "singleton_class",
  "singleton_method",
  "string",
  "string_array",
  "subshell",
  "super",
  "symbol_array",
  "true",
  "unary",
  "unless",
  "until",
  "while",
  "yield"
];
var EXPRESSION_STATEMENT_PARENT_TYPES = [
  "begin_block",
  "begin",
  "block_body",
  "block",
  "body_statement",
  "do_block",
  "do",
  "else",
  "end_block",
  "ensure",
  "heredoc_beginning",
  "interpolation",
  "lambda",
  "method",
  "parenthesized_statements",
  "program",
  "singleton_class",
  "singleton_method",
  "then"
];
var mapTypes = ["hash"];
var listTypes = ["array", "string_array", "symbol_array"];
var assignmentOperators = [
  "=",
  "+=",
  "-=",
  "*=",
  "**=",
  "/=",
  "||=",
  "|=",
  "&&=",
  "&=",
  "%=",
  ">>=",
  "<<=",
  "^="
];
var mapKeyValueSeparators = [":", "=>"];
function blockFinder(node) {
  if (node.type !== "call") {
    return null;
  }
  const receiver = node.childForFieldName("receiver");
  const method = node.childForFieldName("method");
  const block = node.childForFieldName("block");
  if (receiver?.text === "Proc" && method?.text === "new" || receiver == null && method?.text === "lambda") {
    return node;
  }
  return block;
}
var nodeMatchers3 = {
  statement: cascadingMatcher(
    patternMatcher(...STATEMENT_TYPES),
    ancestorChainNodeMatcher(
      [
        patternFinder(...EXPRESSION_STATEMENT_PARENT_TYPES),
        patternFinder(...EXPRESSION_TYPES)
      ],
      1
    )
  ),
  anonymousFunction: cascadingMatcher(
    patternMatcher("lambda", "do_block"),
    matcher(blockFinder)
  ),
  condition: conditionMatcher("*[condition]"),
  argumentOrParameter: argumentMatcher(
    "lambda_parameters",
    "method_parameters",
    "block_parameters",
    "argument_list"
  ),
  collectionKey: trailingMatcher(["pair[key]"], [":"]),
  value: leadingMatcher(
    [
      "pair[value]",
      "assignment[right]",
      "operator_assignment[right]",
      "return.argument_list!"
    ],
    assignmentOperators.concat(mapKeyValueSeparators)
  ),
  collectionItem: argumentMatcher(...mapTypes, ...listTypes)
};
var patternMatchers = createPatternMatchers(nodeMatchers3);

// ../cursorless-engine/src/languages/elseIfExtractor.ts
function elseIfExtractor() {
  const contentRangeExtractor = childRangeSelector(["else_clause"], [], {
    includeUnnamedChildren: true
  });
  return function(editor, node) {
    const contentRange = contentRangeExtractor(editor, node);
    const parent = node.parent;
    if (parent?.type !== "else_clause") {
      const alternative = node.childForFieldName("alternative");
      if (alternative == null) {
        return contentRange;
      }
      const { selection: selection2 } = contentRange;
      return {
        selection: selection2,
        context: {
          removalRange: new Selection(
            selection2.start,
            positionFromPoint(alternative.namedChild(0).startPosition)
          )
        }
      };
    }
    const { selection } = contentRange;
    return {
      selection: new Selection(
        positionFromPoint(parent.child(0).startPosition),
        selection.end
      ),
      context: {}
    };
  };
}
function elseExtractor(ifNodeType) {
  const nestedElseIfExtractor = elseIfExtractor();
  return function(editor, node) {
    return node.namedChild(0).type === ifNodeType ? nestedElseIfExtractor(editor, node.namedChild(0)) : simpleSelectionExtractor(editor, node);
  };
}

// ../cursorless-engine/src/languages/rust.ts
var STATEMENT_TYPES2 = [
  "associated_type",
  "attribute_item",
  "const_item",
  "empty_statement",
  "enum_item",
  "extern_crate_declaration",
  "foreign_mod_item",
  "impl_item",
  "inner_attribute_item",
  "let_declaration",
  "macro_definition",
  "macro_invocation",
  "function_item",
  "function_signature_item",
  "mod_item",
  "static_item",
  "struct_item",
  "trait_item",
  "type_item",
  "union_item",
  "use_declaration",
  "expression_statement"
];
var STATEMENT_PARENT_TYPES = ["source_file", "block", "declaration_list"];
function implItemTypeFinder(node) {
  if (node.parent?.type === "impl_item" && node.parent?.childForFieldName("type")?.equals(node)) {
    return node;
  }
  return null;
}
function traitBoundExtractor(editor, node) {
  return {
    selection: makeNodePairSelection(node.children[1], node.lastNamedChild),
    context: {
      leadingDelimiterRange: makeRangeFromPositions(
        node.children[0].startPosition,
        node.children[1].startPosition
      )
    }
  };
}
function returnValueFinder(node) {
  if (node.type !== "block") {
    return null;
  }
  const { lastNamedChild } = node;
  if (lastNamedChild == null) {
    return null;
  }
  if (lastNamedChild.type === "expression_statement") {
    const expression = lastNamedChild.child(0);
    if (expression.type === "return_expression") {
      return expression.child(1);
    }
    return null;
  }
  if (STATEMENT_TYPES2.includes(lastNamedChild.type)) {
    return null;
  }
  if (lastNamedChild.type === "return_expression") {
    return lastNamedChild.child(1);
  }
  return lastNamedChild;
}
var nodeMatchers4 = {
  statement: ancestorChainNodeMatcher(
    [
      patternFinder(...STATEMENT_PARENT_TYPES),
      patternFinder(...STATEMENT_TYPES2)
    ],
    1
  ),
  condition: cascadingMatcher(
    patternMatcher("while_expression[condition]", "if_expression[condition]"),
    matcher(
      patternFinder("while_let_expression", "if_let_expression"),
      childRangeSelector(["while", "if", "block"], [], {
        includeUnnamedChildren: true
      })
    ),
    leadingMatcher(["*.match_pattern![condition]"], ["if"])
  ),
  collectionItem: argumentMatcher(
    "array_expression",
    "tuple_expression",
    "tuple_type"
  ),
  type: cascadingMatcher(
    leadingMatcher(
      [
        "let_declaration[type]",
        "parameter[type]",
        "field_declaration[type]",
        "const_item[type]"
      ],
      [":"]
    ),
    matcher(
      patternFinder(
        "constrained_type_parameter[bounds]",
        "where_predicate[bounds]"
      ),
      traitBoundExtractor
    ),
    leadingMatcher(["function_item[return_type]"], ["->"]),
    matcher(implItemTypeFinder),
    patternMatcher(
      "struct_item",
      "trait_item",
      "impl_item",
      "array_type[element]"
    )
  ),
  argumentOrParameter: argumentMatcher(
    "arguments",
    "parameters",
    "meta_arguments",
    "type_parameters",
    "ordered_field_declaration_list"
  ),
  collectionKey: cascadingMatcher(
    trailingMatcher(["field_initializer[name]", "field_pattern[name]"], [":"])
  ),
  name: cascadingMatcher(
    patternMatcher(
      "let_declaration.identifier!",
      "parameter.identifier!",
      "function_item[name]",
      "struct_item[name]",
      "enum_item[name]",
      "enum_variant[name]",
      "trait_item[name]",
      "const_item[name]",
      "meta_item.identifier!",
      "let_declaration[pattern]",
      "constrained_type_parameter[left]",
      "where_predicate[left]",
      "field_declaration[name]"
    ),
    trailingMatcher(["field_initializer[name]", "field_pattern[name]"], [":"])
  ),
  value: cascadingMatcher(
    leadingMatcher(["let_declaration[value]"], ["="]),
    leadingMatcher(
      ["field_initializer[value]", "field_pattern[pattern]"],
      [":"]
    ),
    patternMatcher("meta_item[value]", "const_item[value]"),
    matcher(returnValueFinder)
  ),
  attribute: trailingMatcher(["mutable_specifier", "attribute_item"]),
  branch: cascadingMatcher(
    patternMatcher("match_arm"),
    matcher(patternFinder("else_clause"), elseExtractor("if_expression")),
    matcher(patternFinder("if_expression"), elseIfExtractor())
  )
};
var rust_default = createPatternMatchers(nodeMatchers4);

// ../cursorless-engine/src/languages/scala.ts
var nodeMatchers5 = {
  argumentOrParameter: argumentMatcher(
    "arguments",
    "parameters",
    "class_parameters",
    "bindings"
  ),
  branch: matcher(
    patternFinder("case_clause"),
    childRangeSelector([], [], {
      includeUnnamedChildren: true
    })
  ),
  // *[type] does not work here because while we want most of these we don't want "compound" types,
  // eg `generic_type[type]`, because that will grab just the inner generic (the String of List[String])
  // and as a rule we want to grab entire type definitions.
  type: leadingMatcher(
    [
      "upper_bound[type]",
      "lower_bound[type]",
      "view_bound[type]",
      "context_bound[type]",
      "val_definition[type]",
      "val_declaration[type]",
      "var_definition[type]",
      "var_declaration[type]",
      "type_definition",
      "extends_clause[type]",
      "class_parameter[type]",
      "parameter[type]",
      "function_definition[return_type]",
      "typed_pattern[type]",
      "binding[type]"
    ],
    [":"]
  ),
  value: leadingMatcher(
    ["*[value]", "*[default_value]", "type_definition[type]"],
    ["="]
  ),
  condition: conditionMatcher("*[condition]")
  // Scala features unsupported in Cursorless terminology
  //  - Pattern matching
  // Cursorless terminology not yet supported in this Scala implementation
  /*
    lists and maps basic definition are just function calls to constructors, eg List(1,2,3,4)
    These types are also basically arbitrary, so we can't really hard-code them
    There is also fancy list style: val foo = 1 :: (2 :: (3 :: Nil)) // List(1,2,3)
  */
  // list: 'call_expression',
  // map: 'call_expression',
  /* infix_expression, key on left, item on right, operator = "->"
    // collectionItem: "???"
    // collectionKey: "???",
  
    /* "foo".r <-, value of type field_expression, value of type string, field of type identifier = "r",
    // regularExpression: "???",
  
    /*
      none of this stuff is defined well in the tree sitter (it's all just infix expressions etc),
      and native XML/HTML is deprecated in Scala 3
    */
  // attribute: "???",
  // xmlElement: "???",
  // xmlStartTag: "???",
  // xmlEndTag: "???",
  // xmlBothTags: "???",
};
var scala_default = createPatternMatchers(nodeMatchers5);

// ../cursorless-engine/src/languages/scss.ts
var STATEMENT_TYPES3 = [
  "apply_statement",
  "at_rule",
  "charset_statement",
  "debug_statement",
  "each_statement",
  "error_statement",
  "for_statement",
  "forward_statement",
  "function_statement",
  "if_statement",
  "import_statement",
  "include_statement",
  "keyframes_statement",
  "media_statement",
  "mixin_statement",
  "namespace_statement",
  "placeholder",
  "rule_set",
  "supports_statement",
  "use_statement",
  "warn_statement",
  "while_statement"
];
function isArgumentListDelimiter(node) {
  return [",", "(", ")"].includes(node.type) || isAtDelimiter(node);
}
function isAtDelimiter(node) {
  return node.type === "plain_value" && node.text === "at";
}
function findAdjacentArgValues(siblingFunc) {
  return (node) => {
    if (isAtDelimiter(node) || node.type === ",") {
      node = node.previousSibling;
    }
    let nextPossibleRange = siblingFunc(node);
    while (nextPossibleRange && !isArgumentListDelimiter(nextPossibleRange)) {
      node = nextPossibleRange;
      nextPossibleRange = siblingFunc(nextPossibleRange);
    }
    return node;
  };
}
function unitMatcher(selection, node) {
  if (node.type !== "declaration") {
    return null;
  }
  return node.descendantsOfType("unit").map((n) => ({
    node: n,
    selection: simpleSelectionExtractor(selection.editor, n)
  }));
}
var nodeMatchers6 = {
  condition: conditionMatcher("condition"),
  statement: cascadingMatcher(
    patternMatcher(...STATEMENT_TYPES3),
    matcher(
      patternFinder("attribute_selector"),
      childRangeSelector([], ["attribute_name", "string_value"])
    )
  ),
  argumentOrParameter: cascadingMatcher(
    matcher(
      patternFinder("arguments.*!", "parameters.*!"),
      delimitedSelector(
        (node) => isArgumentListDelimiter(node),
        ", ",
        findAdjacentArgValues((node) => node.previousSibling),
        findAdjacentArgValues((node) => node.nextSibling)
      )
    )
  ),
  collectionKey: trailingMatcher(["declaration.property_name!"], [":"]),
  value: cascadingMatcher(
    matcher(
      patternFinder("declaration"),
      childRangeSelector(["property_name", "variable_name"])
    ),
    matcher(
      patternFinder("include_statement", "namespace_statement"),
      childRangeSelector()
    ),
    patternMatcher(
      "return_statement.*!",
      "import_statement.*!",
      "attribute_selector.plain_value!",
      "attribute_selector.string_value!",
      "parameter.default_value!"
    )
  ),
  unit: cascadingMatcher(patternMatcher("integer_value.unit!"), unitMatcher)
};
var patternMatchers2 = createPatternMatchers(nodeMatchers6);

// ../cursorless-engine/src/languages/getNodeMatcher.ts
function getNodeMatcher(languageId, scopeTypeType, includeSiblings) {
  const matchers2 = languageMatchers[languageId];
  if (matchers2 == null) {
    throw new UnsupportedLanguageError(languageId);
  }
  const matcher2 = matchers2[scopeTypeType];
  if (matcher2 == null) {
    return notSupported(scopeTypeType);
  }
  if (includeSiblings) {
    return matcherIncludeSiblings(matcher2);
  }
  return matcher2;
}
var languageMatchers = {
  clojure: clojure_default,
  css: patternMatchers2,
  latex: latex_default,
  ruby: patternMatchers,
  rust: rust_default,
  scala: scala_default,
  scss: patternMatchers2
};
function matcherIncludeSiblings(matcher2) {
  return (selection, node) => {
    let matches = matcher2(selection, node);
    if (matches == null) {
      return null;
    }
    matches = matches.flatMap(
      (match) => iterateNearestIterableAncestor(
        match.node,
        selectionWithEditorFromRange(selection, match.selection.selection),
        matcher2
      )
    );
    if (matches.length > 0) {
      return matches;
    }
    return null;
  };
}
function iterateNearestIterableAncestor(node, selection, nodeMatcher) {
  let parent = node.parent;
  while (parent != null) {
    const matches = parent.namedChildren.flatMap((sibling) => nodeMatcher(selection, sibling)).filter((match) => match != null);
    if (matches.length > 0) {
      return matches;
    }
    parent = parent.parent;
  }
  return [];
}

// ../cursorless-engine/src/processTargets/modifiers/scopeTypeStages/LegacyContainingSyntaxScopeStage.ts
var LegacyContainingSyntaxScopeStage = class {
  constructor(languageDefinitions, modifier) {
    this.languageDefinitions = languageDefinitions;
    this.modifier = modifier;
  }
  run(target) {
    const nodeMatcher = getNodeMatcher(
      target.editor.document.languageId,
      this.modifier.scopeType.type,
      this.modifier.type === "everyScope"
    );
    const node = this.languageDefinitions.getNodeAtLocation(
      target.editor.document,
      target.contentRange
    );
    if (node == null) {
      throw new NoContainingScopeError(this.modifier.scopeType.type);
    }
    const scopeNodes = findNearestContainingAncestorNode(node, nodeMatcher, {
      editor: target.editor,
      selection: new Selection(
        target.contentRange.start,
        target.contentRange.end
      )
    });
    if (scopeNodes == null) {
      throw new NoContainingScopeError(this.modifier.scopeType.type);
    }
    return scopeNodes.map((scope) => {
      const {
        containingListDelimiter,
        leadingDelimiterRange,
        trailingDelimiterRange,
        removalRange,
        interiorRange
      } = scope.context;
      if (removalRange != null && (leadingDelimiterRange != null || trailingDelimiterRange != null)) {
        throw Error(
          "Removal range is mutually exclusive with leading or trailing delimiter range"
        );
      }
      const { editor, selection: contentSelection } = scope.selection;
      return new ScopeTypeTarget({
        scopeTypeType: this.modifier.scopeType.type,
        editor,
        isReversed: target.isReversed,
        contentRange: contentSelection,
        removalRange,
        interiorRange,
        insertionDelimiter: containingListDelimiter,
        leadingDelimiterRange,
        trailingDelimiterRange
      });
    });
  }
};
function findNearestContainingAncestorNode(startNode, nodeMatcher, selection) {
  let node = startNode;
  while (node != null) {
    const matches = nodeMatcher(selection, node);
    if (matches != null) {
      return matches.map((match) => match.selection).map((matchedSelection) => ({
        selection: selectionWithEditorFromRange(
          selection,
          matchedSelection.selection
        ),
        context: matchedSelection.context
      }));
    }
    node = node.parent;
  }
  return null;
}

// ../cursorless-engine/src/processTargets/modifiers/ItemStage/getIterationScope.ts
function getIterationScope(modifierStageFactory, target) {
  let surroundingTarget = getBoundarySurroundingPair(
    modifierStageFactory,
    target
  );
  while (surroundingTarget != null) {
    if (useInteriorOfSurroundingTarget(
      modifierStageFactory,
      target,
      surroundingTarget
    )) {
      return {
        range: surroundingTarget.getInterior()[0].contentRange,
        boundary: getBoundary(surroundingTarget)
      };
    }
    surroundingTarget = getParentSurroundingPair(
      modifierStageFactory,
      target.editor,
      surroundingTarget
    );
  }
  return {
    range: fitRangeToLineContent(target.editor, target.contentRange)
  };
}
function useInteriorOfSurroundingTarget(modifierStageFactory, target, surroundingTarget) {
  const { contentRange } = target;
  if (contentRange.isEmpty) {
    const [left, right] = getBoundary(surroundingTarget);
    const pos = contentRange.start;
    if (pos.isEqual(left.start) || pos.isEqual(right.end)) {
      return false;
    }
    const line = target.editor.document.lineAt(pos);
    if (pos.isEqual(left.end) && characterIsWhitespaceOrMissing(line, pos.character)) {
      return false;
    }
    if (pos.isEqual(right.start) && characterIsWhitespaceOrMissing(line, pos.character - 1)) {
      return false;
    }
  } else {
    if (contentRange.isRangeEqual(surroundingTarget.contentRange)) {
      return false;
    }
    const [left, right] = getBoundary(surroundingTarget);
    if (contentRange.isRangeEqual(left) || contentRange.isRangeEqual(right)) {
      return false;
    }
  }
  const surroundingStringTarget = getStringSurroundingPair(
    modifierStageFactory,
    surroundingTarget
  );
  if (surroundingStringTarget != null && surroundingTarget.contentRange.start.isBeforeOrEqual(
    surroundingStringTarget.contentRange.start
  )) {
    return false;
  }
  return true;
}
function getBoundary(surroundingTarget) {
  return surroundingTarget.getBoundary().map((t) => t.contentRange);
}
function characterIsWhitespaceOrMissing(line, index) {
  return index < line.range.start.character || index >= line.range.end.character || line.text[index].trim() === "";
}
function getParentSurroundingPair(modifierStageFactory, editor, target) {
  const startOffset = editor.document.offsetAt(target.contentRange.start);
  if (startOffset === 0) {
    return void 0;
  }
  const position = editor.document.positionAt(startOffset - 1);
  return getBoundarySurroundingPair(
    modifierStageFactory,
    new PlainTarget({
      editor,
      contentRange: new Range(position, position),
      isReversed: false
    })
  );
}
function getBoundarySurroundingPair(modifierStageFactory, target) {
  return getSurroundingPair(modifierStageFactory, target, {
    type: "surroundingPair",
    delimiter: "collectionBoundary",
    requireStrongContainment: true
  });
}
function getStringSurroundingPair(modifierStageFactory, target) {
  return getSurroundingPair(modifierStageFactory, target, {
    type: "surroundingPair",
    delimiter: "string",
    requireStrongContainment: true
  });
}
function getSurroundingPair(modifierStageFactory, target, scopeType) {
  const pairStage = modifierStageFactory.create({
    type: "containingScope",
    scopeType
  });
  const targets = (() => {
    try {
      return pairStage.run(target);
    } catch (_error) {
      return [];
    }
  })();
  if (targets.length > 1) {
    throw Error("Expected only one surrounding pair target");
  }
  return targets[0];
}

// ../cursorless-engine/src/processTargets/modifiers/ItemStage/tokenizeRange.ts
function tokenizeRange(editor, interior, boundary) {
  const { document } = editor;
  const text = document.getText(interior);
  const lexemes = text.split(/([,(){}<>[\]"'`])|(?<!\\)(\\"|\\'|\\`)/g).filter((lexeme) => lexeme != null && lexeme.length > 0);
  const joinedLexemes = joinLexemesBySkippingMatchingPairs(lexemes);
  const tokens2 = [];
  let offset = document.offsetAt(interior.start);
  joinedLexemes.forEach((lexeme) => {
    if (lexeme.trim().length === 0) {
      offset += lexeme.length;
      return;
    }
    if (lexeme === separator) {
      tokens2.push({
        type: "separator",
        range: new Range(
          document.positionAt(offset),
          document.positionAt(offset + lexeme.length)
        )
      });
    } else {
      const offsetStart = offset + (lexeme.length - lexeme.trimStart().length);
      tokens2.push({
        type: "item",
        range: new Range(
          document.positionAt(offsetStart),
          document.positionAt(offsetStart + lexeme.trim().length)
        )
      });
    }
    offset += lexeme.length;
  });
  if (boundary != null) {
    return [
      { type: "boundary", range: boundary[0] },
      ...tokens2,
      { type: "boundary", range: boundary[1] }
    ];
  }
  return tokens2;
}
function joinLexemesBySkippingMatchingPairs(lexemes) {
  const result = [];
  let delimiterBalance = 0;
  let openingDelimiter = null;
  let closingDelimiter = null;
  let startIndex = -1;
  lexemes.forEach((lexeme, index) => {
    if (delimiterBalance > 0) {
      if (lexeme === closingDelimiter) {
        --delimiterBalance;
      } else if (lexeme === openingDelimiter) {
        ++delimiterBalance;
      }
    } else if (leftToRightMap2[lexeme] != null && lexemes.indexOf(leftToRightMap2[lexeme], index + 1) > -1) {
      openingDelimiter = lexeme;
      closingDelimiter = leftToRightMap2[lexeme];
      delimiterBalance = 1;
      if (startIndex < 0) {
        startIndex = index;
      }
    } else if (startIndex < 0) {
      startIndex = index;
    }
    const isSeparator = lexeme === separator && delimiterBalance === 0;
    if (isSeparator || index === lexemes.length - 1) {
      const endIndex = isSeparator ? index : index + 1;
      result.push(lexemes.slice(startIndex, endIndex).join(""));
      startIndex = -1;
      if (isSeparator) {
        result.push(lexeme);
      }
    }
  });
  return result;
}
var separator = ",";
var leftToRightMap2 = {
  "(": ")",
  "{": "}",
  "<": ">",
  "[": "]",
  '"': '"',
  "'": "'",
  "`": "`"
};

// ../cursorless-engine/src/processTargets/modifiers/ItemStage/ItemStage.ts
var ItemStage = class {
  constructor(languageDefinitions, modifierStageFactory, modifier) {
    this.languageDefinitions = languageDefinitions;
    this.modifierStageFactory = modifierStageFactory;
    this.modifier = modifier;
  }
  run(target) {
    try {
      return new LegacyContainingSyntaxScopeStage(
        this.languageDefinitions,
        this.modifier
      ).run(target);
    } catch (_error) {
    }
    if (this.modifier.type === "everyScope") {
      return this.getEveryTarget(this.modifierStageFactory, target);
    }
    return [this.getSingleTarget(this.modifierStageFactory, target)];
  }
  getEveryTarget(modifierStageFactory, target) {
    const itemInfos = getItemInfosForIterationScope(
      modifierStageFactory,
      target
    );
    const filteredItemInfos = target.hasExplicitRange ? filterItemInfos(target, itemInfos) : itemInfos;
    if (filteredItemInfos.length === 0) {
      throw new NoContainingScopeError(this.modifier.scopeType.type);
    }
    return filteredItemInfos.map(
      (itemInfo) => this.itemInfoToTarget(target, itemInfo)
    );
  }
  getSingleTarget(modifierStageFactory, target) {
    const itemInfos = getItemInfosForIterationScope(
      modifierStageFactory,
      target
    );
    const filteredItemInfos = filterItemInfos(target, itemInfos);
    if (filteredItemInfos.length === 0) {
      throw new NoContainingScopeError(this.modifier.scopeType.type);
    }
    const first = filteredItemInfos[0];
    const last2 = filteredItemInfos[filteredItemInfos.length - 1];
    const itemInfo = {
      contentRange: first.contentRange.union(last2.contentRange),
      domain: first.domain.union(last2.domain),
      leadingDelimiterRange: first.leadingDelimiterRange,
      trailingDelimiterRange: last2.trailingDelimiterRange
    };
    const removalRange = itemInfo.leadingDelimiterRange != null && itemInfo.trailingDelimiterRange != null && getRangeLength(target.editor, itemInfo.leadingDelimiterRange) > getRangeLength(target.editor, itemInfo.trailingDelimiterRange) ? itemInfo.contentRange.union(itemInfo.leadingDelimiterRange) : void 0;
    return this.itemInfoToTarget(target, itemInfo, removalRange);
  }
  itemInfoToTarget(target, itemInfo, removalRange) {
    const insertionDelimiter = getInsertionDelimiter3(
      itemInfo.leadingDelimiterRange,
      itemInfo.trailingDelimiterRange
    );
    return new ScopeTypeTarget({
      scopeTypeType: this.modifier.scopeType.type,
      editor: target.editor,
      isReversed: target.isReversed,
      contentRange: itemInfo.contentRange,
      insertionDelimiter,
      leadingDelimiterRange: itemInfo.leadingDelimiterRange,
      trailingDelimiterRange: itemInfo.trailingDelimiterRange,
      removalRange
    });
  }
};
function getInsertionDelimiter3(leadingDelimiterRange, trailingDelimiterRange) {
  return leadingDelimiterRange != null && !leadingDelimiterRange.isSingleLine || trailingDelimiterRange != null && !trailingDelimiterRange.isSingleLine ? ",\n" : ", ";
}
function filterItemInfos(target, itemInfos) {
  return itemInfos.filter(
    (itemInfo) => itemInfo.domain.intersection(target.contentRange) != null
  );
}
function getItemInfosForIterationScope(modifierStageFactory, target) {
  const { range: range3, boundary } = getIterationScope(modifierStageFactory, target);
  return getItemsInRange(target.editor, range3, boundary);
}
function getItemsInRange(editor, interior, boundary) {
  const tokens2 = tokenizeRange(editor, interior, boundary);
  const itemInfos = [];
  tokens2.forEach((token, i) => {
    if (token.type === "separator" || token.type === "boundary") {
      return;
    }
    const leadingDelimiterRange = (() => {
      if (tokens2[i - 2]?.type === "item") {
        return new Range(tokens2[i - 2].range.end, token.range.start);
      }
      if (tokens2[i - 1]?.type === "separator") {
        return new Range(tokens2[i - 1].range.start, token.range.start);
      }
      return void 0;
    })();
    const trailingDelimiterRange = (() => {
      if (tokens2[i + 2]?.type === "item") {
        return new Range(token.range.end, tokens2[i + 2].range.start);
      }
      if (tokens2[i + 1]?.type === "separator") {
        return new Range(token.range.end, tokens2[i + 1].range.end);
      }
      return void 0;
    })();
    const domainStart = tokens2[i - 1]?.type === "boundary" || tokens2[i - 1]?.type === "separator" ? tokens2[i - 1].range.end : token.range.start;
    const domainEnd = tokens2[i + 1]?.type === "boundary" || tokens2[i + 1]?.type === "separator" ? tokens2[i + 1].range.start : token.range.end;
    itemInfos.push({
      contentRange: token.range,
      leadingDelimiterRange,
      trailingDelimiterRange,
      domain: new Range(domainStart, domainEnd)
    });
  });
  return itemInfos;
}

// ../cursorless-engine/src/processTargets/modifiers/commonContainingScopeIfUntypedModifiers.ts
var containingLineIfUntypedModifier = {
  type: "modifyIfUntyped",
  modifier: {
    type: "containingScope",
    scopeType: { type: "line" }
  }
};
var containingTokenIfUntypedModifier = {
  type: "modifyIfUntyped",
  modifier: {
    type: "containingScope",
    scopeType: { type: "token" }
  }
};

// ../cursorless-engine/src/processTargets/modifiers/LeadingTrailingStages.ts
var NoDelimiterError = class extends Error {
  constructor(type2) {
    super(`Target has no ${type2} delimiter.`);
    this.name = "NoDelimiterError";
  }
};
var LeadingStage = class {
  constructor(modifierStageFactory, modifier) {
    this.modifierStageFactory = modifierStageFactory;
    this.modifier = modifier;
  }
  run(target) {
    return this.modifierStageFactory.create(containingTokenIfUntypedModifier).run(target).map((target2) => {
      const leading = target2.getLeadingDelimiterTarget();
      if (leading == null) {
        throw new NoDelimiterError("leading");
      }
      return leading;
    });
  }
};
var TrailingStage = class {
  constructor(modifierStageFactory, modifier) {
    this.modifierStageFactory = modifierStageFactory;
    this.modifier = modifier;
  }
  run(target) {
    return this.modifierStageFactory.create(containingTokenIfUntypedModifier).run(target).map((target2) => {
      const trailing = target2.getTrailingDelimiterTarget();
      if (trailing == null) {
        throw new NoDelimiterError("trailing");
      }
      return trailing;
    });
  }
};

// ../cursorless-engine/src/processTargets/modifiers/targetSequenceUtils.ts
function createRangeTargetFromIndices(isReversed, targets, startIndex, endIndex) {
  assertIndices(targets, startIndex, endIndex);
  if (startIndex === endIndex) {
    return targets[startIndex];
  }
  return createContinuousRangeTarget(
    isReversed,
    targets[startIndex],
    targets[endIndex],
    true,
    true
  );
}
function getEveryScopeTargets(modifierStageFactory, target, scopeType) {
  const containingStage = modifierStageFactory.create({
    type: "everyScope",
    scopeType
  });
  return containingStage.run(target);
}

// ../cursorless-engine/src/processTargets/modifiers/OrdinalScopeStage.ts
var OrdinalScopeStage = class {
  constructor(modifierStageFactory, modifier) {
    this.modifierStageFactory = modifierStageFactory;
    this.modifier = modifier;
  }
  run(target) {
    const targets = getEveryScopeTargets(
      this.modifierStageFactory,
      target,
      this.modifier.scopeType
    );
    const startIndex = this.modifier.start + (this.modifier.start < 0 ? targets.length : 0);
    const endIndex = startIndex + this.modifier.length - 1;
    if (this.modifier.isEvery) {
      return sliceStrict(targets, startIndex, endIndex);
    }
    return [
      createRangeTargetFromIndices(
        target.isReversed,
        targets,
        startIndex,
        endIndex
      )
    ];
  }
};

// ../cursorless-engine/src/processTargets/modifiers/PositionStage.ts
var PositionStage = class {
  run(target) {
    const parameters = {
      editor: target.editor,
      isReversed: target.isReversed,
      contentRange: this.getContentRange(target.contentRange)
    };
    return [
      target.isRaw ? new RawSelectionTarget(parameters) : new PlainTarget({ ...parameters, isToken: false })
    ];
  }
};
var StartOfStage = class extends PositionStage {
  getContentRange(contentRange) {
    return contentRange.start.toEmptyRange();
  }
};
var EndOfStage = class extends PositionStage {
  getContentRange(contentRange) {
    return contentRange.end.toEmptyRange();
  }
};

// ../cursorless-engine/src/processTargets/modifiers/PreferredScopeStage.ts
var PreferredScopeStage = class {
  constructor(modifierStageFactory, scopeHandlerFactory, modifier) {
    this.modifierStageFactory = modifierStageFactory;
    this.scopeHandlerFactory = scopeHandlerFactory;
    this.modifier = modifier;
  }
  run(target) {
    const { scopeType } = this.modifier;
    const containingScopeStage = new ContainingScopeStage(
      this.modifierStageFactory,
      this.scopeHandlerFactory,
      { type: "containingScope", scopeType }
    );
    try {
      return containingScopeStage.run(target);
    } catch (ex) {
      if (!(ex instanceof NoContainingScopeError)) {
        throw ex;
      }
    }
    const scopeHandler = this.scopeHandlerFactory.create(
      this.modifier.scopeType,
      target.editor.document.languageId
    );
    if (scopeHandler == null) {
      throw Error(`Couldn't create scope handler for: ${scopeType.type}`);
    }
    const closestTargets = getClosestScopeTargets(target, scopeHandler);
    if (closestTargets == null) {
      throw Error(`No scopes found for scope type: ${scopeType.type}`);
    }
    return closestTargets;
  }
};
function getClosestScopeTargets(target, scopeHandler) {
  const previousScopes = scopeHandler.generateScopes(
    target.editor,
    target.contentRange.start,
    "backward"
  );
  const nextScopes = scopeHandler.generateScopes(
    target.editor,
    target.contentRange.end,
    "forward"
  );
  const { active } = target.contentSelection;
  const previousScope = getClosestScope(previousScopes, active);
  const nextScope = getClosestScope(nextScopes, active);
  const preferredScope = previousScope.distance < nextScope.distance ? previousScope.scope : nextScope.scope;
  return preferredScope != null ? preferredScope.getTargets(target.isReversed) : void 0;
}
function getClosestScope(scopes, position) {
  let closestScope;
  let closestDistance = Infinity;
  for (const scope of scopes) {
    const distance = Math.min(
      distanceBetweenPositions(position, scope.domain.start),
      distanceBetweenPositions(position, scope.domain.end)
    );
    if (distance < closestDistance) {
      closestScope = scope;
      closestDistance = distance;
    } else {
      break;
    }
  }
  return { scope: closestScope, distance: closestDistance };
}
function distanceBetweenPositions(a, b) {
  return (
    // 10000 is arbitrary to always pick same-line occurrences first
    Math.abs(a.line - b.line) * 1e4 + Math.abs(a.character - b.character)
  );
}

// ../cursorless-engine/src/processTargets/modifiers/RangeModifierStage.ts
var RangeModifierStage = class {
  constructor(modifierStageFactory, modifier) {
    this.modifierStageFactory = modifierStageFactory;
    this.modifier = modifier;
  }
  run(target) {
    const anchorStage = this.modifierStageFactory.create(this.modifier.anchor);
    const activeStage = this.modifierStageFactory.create(this.modifier.active);
    const anchorTargets = anchorStage.run(target);
    const activeTargets = activeStage.run(target);
    if (anchorTargets.length !== 1 || activeTargets.length !== 1) {
      throw new Error("Expected single anchor and active target");
    }
    return [
      targetsToContinuousTarget(
        anchorTargets[0],
        activeTargets[0],
        this.modifier.excludeAnchor,
        this.modifier.excludeActive
      )
    ];
  }
};

// ../cursorless-engine/src/processTargets/modifiers/RawSelectionStage.ts
var RawSelectionStage = class {
  constructor(modifier) {
    this.modifier = modifier;
  }
  run(target) {
    return [
      new RawSelectionTarget({
        editor: target.editor,
        contentRange: target.contentRange,
        isReversed: target.isReversed
      })
    ];
  }
};

// ../cursorless-engine/src/processTargets/modifiers/TooFewScopesError.ts
var TooFewScopesError = class extends Error {
  constructor(requestedLength, currentLength, scopeType) {
    super(
      `Requested ${requestedLength} ${scopeType}s, but ${currentLength} are already selected.`
    );
    this.name = "TooFewScopesError";
  }
};

// ../cursorless-engine/src/processTargets/modifiers/relativeScopeLegacy.ts
function runLegacy(modifierStageFactory, modifier, target) {
  const targets = getEveryScopeTargets(
    modifierStageFactory,
    createTargetWithoutExplicitRange(target),
    modifier.scopeType
  );
  const containingIndices = getContainingIndices(target.contentRange, targets);
  return calculateIndicesAndCreateTarget(
    modifier,
    target,
    targets,
    containingIndices
  );
}
function calculateIndicesAndCreateTarget(modifier, target, targets, containingIndices) {
  const isForward = modifier.direction === "forward";
  const proximalIndex = computeProximalIndex(
    modifier,
    target.contentRange,
    targets,
    isForward,
    containingIndices
  );
  const distalIndex = isForward ? proximalIndex + modifier.length - 1 : proximalIndex - modifier.length + 1;
  const startIndex = Math.min(proximalIndex, distalIndex);
  const endIndex = Math.max(proximalIndex, distalIndex);
  return [
    createRangeTargetFromIndices(
      target.isReversed,
      targets,
      startIndex,
      endIndex
    )
  ];
}
function computeProximalIndex(modifier, inputTargetRange, targets, isForward, containingIndices) {
  const includeIntersectingScopes = modifier.offset === 0;
  if (containingIndices == null) {
    const adjacentTargetIndex = isForward ? targets.findIndex(
      (t) => t.contentRange.start.isAfter(inputTargetRange.start)
    ) : findLastIndex_default(
      targets,
      (t) => t.contentRange.start.isBefore(inputTargetRange.start)
    );
    if (adjacentTargetIndex === -1) {
      throw new OutOfRangeError();
    }
    if (includeIntersectingScopes) {
      return adjacentTargetIndex;
    }
    return isForward ? adjacentTargetIndex + modifier.offset - 1 : adjacentTargetIndex - modifier.offset + 1;
  }
  const intersectingStartIndex = containingIndices.start;
  const intersectingEndIndex = containingIndices.end;
  if (includeIntersectingScopes) {
    const intersectingLength = intersectingEndIndex - intersectingStartIndex + 1;
    if (intersectingLength > modifier.length) {
      throw new TooFewScopesError(
        modifier.length,
        intersectingLength,
        modifier.scopeType.type
      );
    }
    return isForward ? intersectingStartIndex : intersectingEndIndex;
  }
  return isForward ? intersectingEndIndex + modifier.offset : intersectingStartIndex - modifier.offset;
}
function getContainingIndices(inputTargetRange, targets) {
  const targetsWithIntersection = targets.map((t, i) => ({
    index: i,
    intersection: t.contentRange.intersection(inputTargetRange)
  })).filter((t) => t.intersection != null);
  if (inputTargetRange.isEmpty) {
    if (targetsWithIntersection.length === 0) {
      return void 0;
    }
    const index = targetsWithIntersection.at(-1).index;
    return { start: index, end: index };
  }
  const targetsWithNonEmptyIntersection = targetsWithIntersection.filter((t) => !t.intersection.isEmpty).map((t) => t.index);
  if (targetsWithNonEmptyIntersection.length === 0) {
    return void 0;
  }
  return {
    start: targetsWithNonEmptyIntersection[0],
    end: targetsWithNonEmptyIntersection.at(-1)
  };
}
function createTargetWithoutExplicitRange(target) {
  return new UntypedTarget({
    editor: target.editor,
    isReversed: target.isReversed,
    contentRange: target.contentRange,
    hasExplicitRange: false
  });
}

// ../cursorless-engine/src/processTargets/modifiers/RelativeScopeStage.ts
var RelativeScopeStage = class {
  constructor(modifierStageFactory, scopeHandlerFactory, modifier) {
    this.modifierStageFactory = modifierStageFactory;
    this.scopeHandlerFactory = scopeHandlerFactory;
    this.modifier = modifier;
  }
  run(target) {
    const scopeHandler = this.scopeHandlerFactory.create(
      this.modifier.scopeType,
      target.editor.document.languageId
    );
    if (scopeHandler == null) {
      return runLegacy(this.modifierStageFactory, this.modifier, target);
    }
    const scopes = Array.from(
      this.modifier.offset === 0 ? generateScopesInclusive(scopeHandler, target, this.modifier) : generateScopesExclusive(scopeHandler, target, this.modifier)
    );
    if (scopes.length < this.modifier.length) {
      throw new OutOfRangeError();
    }
    const { isReversed } = target;
    if (this.modifier.isEvery) {
      return scopes.flatMap((scope) => scope.getTargets(isReversed));
    }
    return constructScopeRangeTarget(
      isReversed,
      scopes[0],
      scopes[scopes.length - 1]
    );
  }
};
function generateScopesInclusive(scopeHandler, target, modifier) {
  const { editor, contentRange } = target;
  const { length: desiredScopeCount, direction } = modifier;
  const initialRange = getPreferredScopeTouchingPosition(
    scopeHandler,
    editor,
    direction === "forward" ? contentRange.start : contentRange.end,
    direction
  )?.domain;
  if (initialRange == null) {
    throw new NoContainingScopeError(modifier.scopeType.type);
  }
  return itake(
    desiredScopeCount,
    scopeHandler.generateScopes(
      editor,
      direction === "forward" ? initialRange.start : initialRange.end,
      direction,
      {
        skipAncestorScopes: true
      }
    )
  );
}
function generateScopesExclusive(scopeHandler, target, modifier) {
  const { editor, contentRange: inputRange } = target;
  const { length: desiredScopeCount, direction, offset } = modifier;
  const initialPosition = direction === "forward" ? inputRange.end : inputRange.start;
  const containment = inputRange.isEmpty ? "disallowed" : "disallowedIfStrict";
  return islice(
    scopeHandler.generateScopes(editor, initialPosition, direction, {
      containment,
      skipAncestorScopes: true
    }),
    offset - 1,
    offset + desiredScopeCount - 1
  );
}

// ../cursorless-engine/src/processTargets/modifiers/VisibleStage.ts
var VisibleStage = class {
  constructor(modifier) {
    this.modifier = modifier;
  }
  run(target) {
    return target.editor.visibleRanges.map(
      (range3) => new PlainTarget({
        editor: target.editor,
        isReversed: target.isReversed,
        contentRange: range3
      })
    );
  }
};

// ../cursorless-engine/src/processTargets/modifiers/scopeTypeStages/NotebookCellStage.ts
var NotebookCellStage = class {
  constructor(modifier) {
    this.modifier = modifier;
  }
  run(target) {
    if (this.modifier.type === "everyScope") {
      throw new Error(`Every ${this.modifier.type} not yet implemented`);
    }
    return [
      new NotebookCellTarget({
        editor: target.editor,
        isReversed: target.isReversed,
        contentRange: target.contentRange
      })
    ];
  }
};

// ../cursorless-engine/src/processTargets/ModifierStageFactoryImpl.ts
var ModifierStageFactoryImpl = class {
  constructor(languageDefinitions, storedTargets, scopeHandlerFactory) {
    this.languageDefinitions = languageDefinitions;
    this.storedTargets = storedTargets;
    this.scopeHandlerFactory = scopeHandlerFactory;
    this.create = this.create.bind(this);
  }
  create(modifier) {
    switch (modifier.type) {
      case "startOf":
        return new StartOfStage();
      case "endOf":
        return new EndOfStage();
      case "extendThroughStartOf":
      case "extendThroughEndOf":
        return new HeadTailStage(this, modifier);
      case "toRawSelection":
        return new RawSelectionStage(modifier);
      case "interiorOnly":
        return new InteriorOnlyStage(this, modifier);
      case "excludeInterior":
        return new ExcludeInteriorStage(this, modifier);
      case "leading":
        return new LeadingStage(this, modifier);
      case "trailing":
        return new TrailingStage(this, modifier);
      case "visible":
        return new VisibleStage(modifier);
      case "containingScope":
        return new ContainingScopeStage(
          this,
          this.scopeHandlerFactory,
          modifier
        );
      case "preferredScope":
        return new PreferredScopeStage(
          this,
          this.scopeHandlerFactory,
          modifier
        );
      case "everyScope":
        if (modifier.scopeType.type === "instance") {
          return new InstanceStage(this, this.storedTargets, modifier);
        }
        return new EveryScopeStage(this, this.scopeHandlerFactory, modifier);
      case "ordinalScope":
        if (modifier.scopeType.type === "instance") {
          return new InstanceStage(this, this.storedTargets, modifier);
        }
        return new OrdinalScopeStage(this, modifier);
      case "relativeScope":
        if (modifier.scopeType.type === "instance") {
          return new InstanceStage(this, this.storedTargets, modifier);
        }
        return new RelativeScopeStage(this, this.scopeHandlerFactory, modifier);
      case "keepContentFilter":
        return new KeepContentFilterStage(modifier);
      case "keepEmptyFilter":
        return new KeepEmptyFilterStage(modifier);
      case "cascading":
        return new CascadingStage(this, modifier);
      case "modifyIfUntyped":
        return new ModifyIfUntypedStage(this, modifier);
      case "range":
        return new RangeModifierStage(this, modifier);
      case "inferPreviousMark":
        throw Error(
          `Unexpected modifier '${modifier.type}'; it should have been removed during inference`
        );
    }
  }
  /**
   * Any scope type that has not been fully migrated to the new
   * {@link ScopeHandler} setup should have a branch in this `switch` statement.
   * Once the scope type is fully migrated, remove the branch and the legacy
   * modifier stage.
   *
   * Note that it is possible for a scope type to be partially migrated.  For
   * example, we could support modern scope handlers for a certain scope type in
   * Ruby, but not yet in Python.
   *
   * @param modifier The modifier for which to get the modifier stage
   * @returns A scope stage implementing the modifier for the given scope type
   */
  getLegacyScopeStage(modifier) {
    switch (modifier.scopeType.type) {
      case "notebookCell":
        return new NotebookCellStage(modifier);
      case "collectionItem":
        return new ItemStage(this.languageDefinitions, this, modifier);
      default:
        return new LegacyContainingSyntaxScopeStage(
          this.languageDefinitions,
          modifier
        );
    }
  }
};

// ../cursorless-engine/src/util/performDocumentEdits.ts
async function performDocumentEdits(rangeUpdater, editor, edits) {
  const deregister = rangeUpdater.registerReplaceEditList(
    editor.document,
    edits.filter((edit) => edit.isReplace)
  );
  const wereEditsApplied = await editor.edit(edits);
  deregister();
  return wereEditsApplied;
}

// ../cursorless-engine/src/core/updateSelections/updateSelections.ts
async function performEditsAndUpdateSelections({
  rangeUpdater,
  editor,
  selections,
  preserveCursorSelections: preserveEditorSelections,
  ...rest
}) {
  const keys2 = unsafeKeys(selections);
  const selectionInfos = keys2.map((key) => {
    const selectionValue = selections[key];
    const selectionsWithBehavior = getSelectionsWithBehavior(selectionValue);
    return getFullSelectionInfos(
      editor.document,
      selectionsWithBehavior.selections,
      selectionsWithBehavior.behavior
    );
  });
  if (!preserveEditorSelections) {
    selectionInfos.push(
      getFullSelectionInfos(
        editor.document,
        editor.selections,
        1 /* closedClosed */
      )
    );
  }
  const updatedSelectionsMatrix = await (() => {
    if ("edits" in rest) {
      return performEditsAndUpdateFullSelectionInfos(
        rangeUpdater,
        editor,
        rest.edits,
        selectionInfos
      );
    }
    return callFunctionAndUpdateFullSelectionInfos(
      rangeUpdater,
      rest.callback,
      editor.document,
      selectionInfos
    );
  })();
  if (!preserveEditorSelections) {
    await editor.setSelections(updatedSelectionsMatrix.pop());
  }
  const result = Object.fromEntries(
    keys2.map((key, index) => [key, updatedSelectionsMatrix[index]])
  );
  return result;
}
function getFullSelectionInfos(document, selections, rangeBehavior) {
  return selections.map(
    (selection) => getSelectionInfoInternal(
      document,
      selection,
      selection instanceof Selection ? !selection.isReversed : true,
      rangeBehavior
    )
  );
}
function getSelectionsWithBehavior(selections) {
  if ("selections" in selections) {
    return selections;
  }
  return {
    selections,
    behavior: 1 /* closedClosed */
  };
}
function getSelectionInfoInternal(document, range3, isForward, rangeBehavior) {
  return {
    range: range3,
    isForward,
    expansionBehavior: {
      start: {
        type: rangeBehavior === 1 /* closedClosed */ || rangeBehavior === 3 /* closedOpen */ ? "closed" : "open"
      },
      end: {
        type: rangeBehavior === 1 /* closedClosed */ || rangeBehavior === 2 /* openClosed */ ? "closed" : "open"
      }
    },
    offsets: {
      start: document.offsetAt(range3.start),
      end: document.offsetAt(range3.end)
    },
    text: document.getText(range3)
  };
}
function selectionInfosToSelections(selectionInfoMatrix) {
  return selectionInfoMatrix.map(
    (selectionInfos) => selectionInfos.map(
      ({ range: { start, end }, isForward }) => isForward ? new Selection(start, end) : new Selection(end, start)
    )
  );
}
async function callFunctionAndUpdateFullSelectionInfos(rangeUpdater, func, document, originalSelectionInfos) {
  const unsubscribe = rangeUpdater.registerRangeInfoList(
    document,
    flatten_default(originalSelectionInfos)
  );
  await func();
  unsubscribe();
  return selectionInfosToSelections(originalSelectionInfos);
}
async function performEditsAndUpdateFullSelectionInfos(rangeUpdater, editor, edits, originalSelectionInfos) {
  const func = async () => {
    const wereEditsApplied = await performDocumentEdits(
      rangeUpdater,
      editor,
      edits
    );
    if (!wereEditsApplied) {
      throw new Error("Could not apply edits");
    }
  };
  return await callFunctionAndUpdateFullSelectionInfos(
    rangeUpdater,
    func,
    editor.document,
    originalSelectionInfos
  );
}

// ../cursorless-engine/src/util/targetUtils.ts
function ensureSingleEditor2(targets) {
  if (targets.length === 0) {
    throw new Error("Require at least one target with this action");
  }
  const editors = targets.map((target) => target.editor);
  if (new Set(editors).size > 1) {
    throw new Error("Can only have one editor with this action");
  }
  return editors[0];
}
function ensureSingleTarget2(targets) {
  if (targets.length !== 1) {
    throw new Error("Can only have one target with this action");
  }
  return targets[0];
}
async function runForEachEditor(targets, getEditor, func) {
  return Promise.all(
    groupForEachEditor(targets, getEditor).map(
      ([editor, editorTargets]) => func(editor, editorTargets)
    )
  );
}
async function runOnTargetsForEachEditor(targets, func) {
  return runForEachEditor(targets, (target) => target.editor, func);
}
async function runOnTargetsForEachEditorSequentially(targets, func) {
  const editorGroups = groupForEachEditor(targets, (target) => target.editor);
  const result = [];
  for (const [editor, targets2] of editorGroups) {
    result.push(await func(editor, targets2));
  }
  return result;
}
function groupTargetsForEachEditor(targets) {
  return groupForEachEditor(targets, (target) => target.editor);
}
function groupForEachEditor(targets, getEditor) {
  const getDocumentUri = (target) => getEditor(target).document.uri;
  const editorMap = groupBy2(targets, getDocumentUri);
  return Array.from(editorMap.values(), (editorTargets) => {
    const editor = getEditor(editorTargets[0]);
    return [editor, editorTargets];
  });
}
function getContentRange2(target) {
  return target.contentRange;
}
function createThatMark(targets, ranges) {
  const thatMark = ranges != null ? zip_default(targets, ranges).map(([target, range3]) => ({
    editor: target.editor,
    selection: target?.isReversed ? new Selection(range3.end, range3.start) : new Selection(range3.start, range3.end)
  })) : targets.map((target) => ({
    editor: target.editor,
    selection: target.contentSelection
  }));
  return thatMark;
}
function toGeneralizedRange(target) {
  const range3 = target.contentRange;
  return target.isLine ? toLineRange(range3) : toCharacterRange(range3);
}
function flashTargets(ide2, targets, style, getRange = getContentRange2) {
  return ide2.flashRanges(
    targets.map((target) => {
      const range3 = getRange(target);
      if (range3 == null) {
        return null;
      }
      return {
        editor: target.editor,
        range: target.isLine ? toLineRange(range3) : toCharacterRange(range3),
        style
      };
    }).filter((flash) => flash != null)
  );
}

// ../cursorless-engine/src/actions/BreakLine.ts
var BreakLine = class {
  constructor(rangeUpdater) {
    this.rangeUpdater = rangeUpdater;
    this.run = this.run.bind(this);
  }
  async run(targets) {
    await flashTargets(ide(), targets, "pendingModification0" /* pendingModification0 */);
    const thatSelections = flatten_default(
      await runOnTargetsForEachEditor(targets, async (editor, targets2) => {
        const contentRanges = targets2.map(({ contentRange }) => contentRange);
        const edits = getEdits(editor, contentRanges);
        const editableEditor = ide().getEditableTextEditor(editor);
        const { contentRanges: updatedRanges } = await performEditsAndUpdateSelections({
          rangeUpdater: this.rangeUpdater,
          editor: editableEditor,
          edits,
          selections: {
            contentRanges
          }
        });
        return zip_default(targets2, updatedRanges).map(([target, range3]) => ({
          editor: target.editor,
          selection: range3.toSelection(target.isReversed)
        }));
      })
    );
    return { thatSelections };
  }
};
function getEdits(editor, contentRanges) {
  const { document } = editor;
  const edits = [];
  for (const range3 of contentRanges) {
    const position = range3.start;
    const line = document.lineAt(position);
    const indentation = line.text.slice(
      0,
      line.rangeTrimmed?.start?.character ?? line.range.start.character
    );
    const characterTrailingWhitespace = line.text.slice(0, position.character).search(/\s+$/);
    const replacementRange = characterTrailingWhitespace > -1 ? new Range(
      new Position(line.lineNumber, characterTrailingWhitespace),
      position
    ) : position.toEmptyRange();
    edits.push({
      range: replacementRange,
      text: "\n" + indentation,
      isReplace: !replacementRange.isEmpty
    });
  }
  return edits;
}

// ../cursorless-engine/src/util/unifyRanges.ts
function unifyRemovalTargets(targets) {
  if (targets.length < 2) {
    return targets;
  }
  return groupTargetsForEachEditor(targets).flatMap(([_editor, targets2]) => {
    if (targets2.length < 2) {
      return targets2;
    }
    let results = [...targets2];
    results.sort(
      (a, b) => a.contentRange.start.compareTo(b.contentRange.start)
    );
    let run = true;
    while (run) {
      [results, run] = unifyTargetsOnePass(results);
    }
    return results;
  });
}
function unifyTargetsOnePass(targets) {
  if (targets.length < 2) {
    return [targets, false];
  }
  const results = [];
  let currentGroup = [];
  targets.forEach((target) => {
    if (currentGroup.length && !intersects(currentGroup[currentGroup.length - 1], target)) {
      results.push(mergeTargets(currentGroup));
      currentGroup = [target];
    } else {
      currentGroup.push(target);
    }
  });
  results.push(mergeTargets(currentGroup));
  return [results, results.length !== targets.length];
}
function mergeTargets(targets) {
  if (targets.length === 1) {
    return targets[0];
  }
  const first = targets[0];
  const last2 = targets[targets.length - 1];
  return targetsToContinuousTarget(first, last2);
}
function intersects(targetA, targetB) {
  return !!targetA.getRemovalRange().intersection(targetB.getRemovalRange());
}

// ../cursorless-engine/src/actions/BringMoveSwap.ts
var BringMoveSwap = class {
  constructor(rangeUpdater, type2) {
    this.rangeUpdater = rangeUpdater;
    this.type = type2;
  }
  async decorateTargets(sources, destinations) {
    await Promise.all([
      flashTargets(
        ide(),
        sources,
        this.decoration.sourceStyle,
        this.decoration.getSourceRangeCallback
      ),
      flashTargets(ide(), destinations, this.decoration.destinationStyle)
    ]);
  }
  getEditsBringMove(sources, destinations) {
    const usedSources = [];
    const results = [];
    const shouldJoinSources = sources.length !== destinations.length && destinations.length === 1;
    sources.forEach((source, i) => {
      let destination = destinations[i];
      if ((source == null || destination == null) && !shouldJoinSources) {
        throw new Error("Targets must have same number of args");
      }
      if (destination != null) {
        let text;
        if (shouldJoinSources) {
          text = sources.map((source2, i2) => {
            const text2 = source2.contentText;
            const delimiter = (destination.isRaw ? null : destination.insertionDelimiter) ?? (source2.isRaw ? null : source2.insertionDelimiter);
            return i2 > 0 && delimiter != null ? delimiter + text2 : text2;
          }).join("");
        } else {
          text = source.contentText;
        }
        results.push({
          edit: destination.constructChangeEdit(text),
          editor: destination.editor,
          originalTarget: destination.target,
          isSource: false
        });
      } else {
        destination = destinations[0];
      }
      if (!usedSources.includes(source)) {
        usedSources.push(source);
        if (this.type === "bring") {
          results.push({
            edit: source.toDestination("to").constructChangeEdit(destination.target.contentText),
            editor: source.editor,
            originalTarget: source,
            isSource: true
          });
        }
      }
    });
    if (this.type === "move") {
      unifyRemovalTargets(usedSources).forEach((source) => {
        results.push({
          edit: source.constructRemovalEdit(),
          editor: source.editor,
          originalTarget: source,
          isSource: true
        });
      });
    }
    return results;
  }
  async performEditsAndComputeThatMark(edits) {
    return flatten_default(
      await runForEachEditor(
        edits,
        (edit) => edit.editor,
        async (editor, edits2) => {
          const filteredEdits = this.type !== "bring" ? edits2 : edits2.filter(({ isSource }) => !isSource);
          const sourceEdits = this.type === "swap" ? [] : edits2.filter(({ isSource }) => isSource);
          const destinationEdits = this.type === "swap" ? edits2 : edits2.filter(({ isSource }) => !isSource);
          const sourceEditRanges = sourceEdits.map(({ edit }) => edit.range);
          const destinationEditRanges = destinationEdits.map(
            ({ edit }) => edit.range
          );
          const editableEditor = ide().getEditableTextEditor(editor);
          const {
            sourceEditRanges: updatedSourceEditRanges,
            destinationEditRanges: updatedDestinationEditRanges
          } = await performEditsAndUpdateSelections({
            rangeUpdater: this.rangeUpdater,
            editor: editableEditor,
            edits: filteredEdits.map(({ edit }) => edit),
            selections: {
              // Sources should be closedClosed, because they should be logically
              // the same as the original source.
              sourceEditRanges,
              // Destinations should be openOpen, because they should grow to contain
              // the new text.
              destinationEditRanges: {
                selections: destinationEditRanges,
                behavior: 0 /* openOpen */
              }
            }
          });
          const marks2 = [
            ...this.getMarks(sourceEdits, updatedSourceEditRanges),
            ...this.getMarks(destinationEdits, updatedDestinationEditRanges)
          ];
          marks2.sort(
            (a, b) => edits2.findIndex((e) => e.originalTarget === a.target) - edits2.findIndex((e) => e.originalTarget === b.target)
          );
          return marks2;
        }
      )
    );
  }
  getMarks(edits, ranges) {
    return edits.map((edit, index) => {
      const originalRange = ranges[index];
      const range3 = edit.edit.updateRange(originalRange);
      const target = edit.originalTarget;
      return {
        editor: edit.editor,
        selection: range3.toSelection(target.isReversed),
        isSource: edit.isSource,
        target
      };
    });
  }
  async decorateThatMark(thatMark) {
    const getRange = (target) => thatMark.find((t) => t.target === target).selection;
    return Promise.all([
      flashTargets(
        ide(),
        thatMark.filter(({ isSource }) => isSource).map(({ target }) => target),
        this.decoration.sourceStyle,
        getRange
      ),
      flashTargets(
        ide(),
        thatMark.filter(({ isSource }) => !isSource).map(({ target }) => target),
        this.decoration.destinationStyle,
        getRange
      )
    ]);
  }
  calculateMarksBringMove(markEntries) {
    return {
      thatMark: markEntries.filter(({ isSource }) => !isSource),
      sourceMark: markEntries.filter(({ isSource }) => isSource)
    };
  }
};
function broadcastSource(sources, destinations) {
  if (sources.length === 1) {
    return Array(destinations.length).fill(sources[0]);
  }
  return sources;
}
var Bring = class extends BringMoveSwap {
  constructor(rangeUpdater) {
    super(rangeUpdater, "bring");
    this.decoration = {
      sourceStyle: "referenced" /* referenced */,
      destinationStyle: "pendingModification0" /* pendingModification0 */,
      getSourceRangeCallback: getContentRange2
    };
    this.run = this.run.bind(this);
  }
  async run(sources, destinations) {
    sources = broadcastSource(sources, destinations);
    await this.decorateTargets(
      sources,
      destinations.map((d) => d.target)
    );
    const edits = this.getEditsBringMove(sources, destinations);
    const markEntries = await this.performEditsAndComputeThatMark(edits);
    const { thatMark, sourceMark } = this.calculateMarksBringMove(markEntries);
    await this.decorateThatMark(thatMark);
    return { thatSelections: thatMark, sourceSelections: sourceMark };
  }
};
var Move = class extends BringMoveSwap {
  constructor(rangeUpdater) {
    super(rangeUpdater, "move");
    this.decoration = {
      sourceStyle: "pendingDelete" /* pendingDelete */,
      destinationStyle: "pendingModification0" /* pendingModification0 */,
      getSourceRangeCallback: getRemovalHighlightRange
    };
    this.run = this.run.bind(this);
  }
  async run(sources, destinations) {
    sources = broadcastSource(sources, destinations);
    await this.decorateTargets(
      sources,
      destinations.map((d) => d.target)
    );
    const edits = this.getEditsBringMove(sources, destinations);
    const markEntries = await this.performEditsAndComputeThatMark(edits);
    const { thatMark, sourceMark } = this.calculateMarksBringMove(markEntries);
    await this.decorateThatMark(thatMark);
    return { thatSelections: thatMark, sourceSelections: sourceMark };
  }
};
var Swap = class extends BringMoveSwap {
  constructor(rangeUpdater) {
    super(rangeUpdater, "swap");
    this.decoration = {
      sourceStyle: "pendingModification1" /* pendingModification1 */,
      destinationStyle: "pendingModification0" /* pendingModification0 */,
      getSourceRangeCallback: getContentRange2
    };
    this.run = this.run.bind(this);
  }
  async run(targets1, targets2) {
    await this.decorateTargets(targets1, targets2);
    const edits = this.getEditsSwap(targets1, targets2);
    const markEntries = await this.performEditsAndComputeThatMark(edits);
    await this.decorateThatMark(markEntries);
    return { thatSelections: markEntries, sourceSelections: [] };
  }
  getEditsSwap(targets1, targets2) {
    const results = [];
    targets1.forEach((target1, i) => {
      const target2 = targets2[i];
      if (target1 == null || target2 == null) {
        throw new Error("Targets must have same number of args");
      }
      results.push({
        edit: target2.toDestination("to").constructChangeEdit(target1.contentText),
        editor: target2.editor,
        originalTarget: target2,
        isSource: false
      });
      results.push({
        edit: target1.toDestination("to").constructChangeEdit(target2.contentText),
        editor: target1.editor,
        originalTarget: target1,
        isSource: true
      });
    });
    return results;
  }
};
function getRemovalHighlightRange(target) {
  return target.getRemovalHighlightRange();
}

// ../cursorless-engine/src/actions/Call.ts
var Call = class {
  constructor(actions) {
    this.actions = actions;
    this.run = this.run.bind(this);
  }
  async run(callees, args) {
    ensureSingleTarget2(callees);
    const { returnValue: texts } = await this.actions.getText.run(callees, {
      showDecorations: false
    });
    const { thatSelections: thatMark } = await this.actions.wrapWithPairedDelimiter.run(args, texts[0] + "(", ")");
    return { thatSelections: thatMark };
  }
};

// ../cursorless-engine/src/actions/Clear.ts
var Clear = class {
  constructor(actions) {
    this.actions = actions;
    this.run = this.run.bind(this);
  }
  async run(targets) {
    const editor = ensureSingleEditor2(targets);
    const plainTargets = targets.map(
      (target) => new PlainTarget({
        editor: target.editor,
        isReversed: target.isReversed,
        contentRange: target.contentRange
      })
    );
    const { thatTargets } = await this.actions.remove.run(plainTargets);
    if (thatTargets != null) {
      await ide().getEditableTextEditor(editor).setSelections(
        thatTargets.map(({ contentSelection }) => contentSelection),
        { focusEditor: true }
      );
    }
    return { thatTargets };
  }
};

// ../cursorless-engine/src/core/commandRunner/selectionToStoredTarget.ts
var selectionToStoredTarget = (selection) => new UntypedTarget({
  editor: selection.editor,
  isReversed: selection.selection.isReversed,
  contentRange: selection.selection,
  hasExplicitRange: true
});

// ../cursorless-engine/src/actions/CallbackAction.ts
var CallbackAction = class {
  constructor(rangeUpdater) {
    this.rangeUpdater = rangeUpdater;
    this.run = this.run.bind(this);
  }
  async run(targets, options2) {
    if (options2.showDecorations) {
      await flashTargets(ide(), targets, "referenced" /* referenced */);
    }
    if (options2.ensureSingleEditor) {
      ensureSingleEditor2(targets);
    }
    if (options2.ensureSingleTarget) {
      ensureSingleTarget2(targets);
    }
    const originalEditor = ide().activeEditableTextEditor;
    const runOnTargets = options2.setSelection ? runOnTargetsForEachEditorSequentially : runOnTargetsForEachEditor;
    const thatTargets = flatten_default(
      await runOnTargets(
        targets,
        (editor, targets2) => this.runForEditor(options2, editor, targets2)
      )
    );
    if (options2.setSelection && options2.restoreSelection && originalEditor != null && !originalEditor.isActive) {
      await originalEditor.focus();
    }
    return { thatTargets };
  }
  async runForEditor(options2, editor, targets) {
    const editableEditor = ide().getEditableTextEditor(editor);
    const originalSelections = editor.selections;
    const originalEditorVersion = editor.document.version;
    const targetSelections = targets.map((target) => target.contentSelection);
    if (options2.setSelection) {
      await editableEditor.setSelections(targetSelections, {
        focusEditor: true,
        revealRange: false
      });
    }
    const {
      originalSelections: updatedOriginalSelections,
      targetSelections: updatedTargetSelections
    } = await performEditsAndUpdateSelections({
      rangeUpdater: this.rangeUpdater,
      editor: editableEditor,
      callback: () => options2.callback(editableEditor, targets),
      preserveCursorSelections: true,
      selections: {
        originalSelections,
        targetSelections
      }
    });
    if (options2.setSelection && options2.restoreSelection) {
      await editableEditor.setSelections(updatedOriginalSelections);
    }
    return editor.document.version === originalEditorVersion ? targets : updatedTargetSelections.map(
      (selection) => selectionToStoredTarget({
        editor,
        selection
      })
    );
  }
};

// ../cursorless-engine/src/actions/SimpleIdeCommandActions.ts
var SimpleIdeCommandAction = class {
  constructor(rangeUpdater) {
    this.ensureSingleEditor = false;
    this.ensureSingleTarget = false;
    this.restoreSelection = true;
    this.showDecorations = true;
    this.callbackAction = new CallbackAction(rangeUpdater);
    this.run = this.run.bind(this);
  }
  async run(targets, { showDecorations } = {}) {
    const capabilities = ide().capabilities.commands[this.command];
    if (capabilities == null) {
      throw Error(`Action ${this.command} is not supported by your ide`);
    }
    const { acceptsLocation } = capabilities;
    return this.callbackAction.run(targets, {
      callback: (editor, targets2) => callback(
        editor,
        acceptsLocation ? targets2.map((t) => t.contentRange) : void 0,
        this.command
      ),
      setSelection: !acceptsLocation,
      ensureSingleEditor: this.ensureSingleEditor,
      ensureSingleTarget: this.ensureSingleTarget,
      restoreSelection: this.restoreSelection,
      showDecorations: showDecorations ?? this.showDecorations
    });
  }
};
var CopyToClipboardSimple = class extends SimpleIdeCommandAction {
  constructor() {
    super(...arguments);
    this.command = "clipboardCopy";
    this.ensureSingleEditor = true;
  }
};
var ToggleLineComment = class extends SimpleIdeCommandAction {
  constructor() {
    super(...arguments);
    this.command = "toggleLineComment";
  }
};
var IndentLineSimpleAction = class extends SimpleIdeCommandAction {
  constructor() {
    super(...arguments);
    this.command = "indentLine";
  }
};
var OutdentLineSimpleAction = class extends SimpleIdeCommandAction {
  constructor() {
    super(...arguments);
    this.command = "outdentLine";
  }
};
var Fold = class extends SimpleIdeCommandAction {
  constructor() {
    super(...arguments);
    this.command = "fold";
  }
};
var Unfold = class extends SimpleIdeCommandAction {
  constructor() {
    super(...arguments);
    this.command = "unfold";
  }
};
var Rename = class extends SimpleIdeCommandAction {
  constructor() {
    super(...arguments);
    this.command = "rename";
    this.ensureSingleTarget = true;
  }
};
var ShowReferences = class extends SimpleIdeCommandAction {
  constructor() {
    super(...arguments);
    this.command = "showReferences";
    this.ensureSingleTarget = true;
  }
};
var ShowQuickFix = class extends SimpleIdeCommandAction {
  constructor() {
    super(...arguments);
    this.command = "quickFix";
    this.ensureSingleTarget = true;
  }
};
var RevealDefinition = class extends SimpleIdeCommandAction {
  constructor() {
    super(...arguments);
    this.command = "revealDefinition";
    this.ensureSingleTarget = true;
    this.restoreSelection = false;
  }
};
var RevealTypeDefinition = class extends SimpleIdeCommandAction {
  constructor() {
    super(...arguments);
    this.command = "revealTypeDefinition";
    this.ensureSingleTarget = true;
    this.restoreSelection = false;
  }
};
var ShowHover = class extends SimpleIdeCommandAction {
  constructor() {
    super(...arguments);
    this.command = "showHover";
    this.ensureSingleTarget = true;
    this.restoreSelection = false;
  }
};
var ShowDebugHover = class extends SimpleIdeCommandAction {
  constructor() {
    super(...arguments);
    this.command = "showDebugHover";
    this.ensureSingleTarget = true;
    this.restoreSelection = false;
  }
};
var ExtractVariable = class extends SimpleIdeCommandAction {
  constructor() {
    super(...arguments);
    this.command = "extractVariable";
    this.ensureSingleTarget = true;
    this.restoreSelection = false;
  }
};
function callback(editor, ranges, command) {
  switch (command) {
    // Multi target actions
    case "toggleLineComment":
      return editor.toggleLineComment(ranges);
    case "indentLine":
      return editor.indentLine(ranges);
    case "outdentLine":
      return editor.outdentLine(ranges);
    case "clipboardCopy":
      return editor.clipboardCopy(ranges);
    case "fold":
      return editor.fold(ranges);
    case "unfold":
      return editor.unfold(ranges);
    case "insertLineAfter":
      return editor.insertLineAfter(ranges);
    // Single target actions
    case "rename":
      return editor.rename(ranges?.[0]);
    case "showReferences":
      return editor.showReferences(ranges?.[0]);
    case "quickFix":
      return editor.quickFix(ranges?.[0]);
    case "revealDefinition":
      return editor.revealDefinition(ranges?.[0]);
    case "revealTypeDefinition":
      return editor.revealTypeDefinition(ranges?.[0]);
    case "showHover":
      return editor.showHover(ranges?.[0]);
    case "showDebugHover":
      return editor.showDebugHover(ranges?.[0]);
    case "extractVariable":
      return editor.extractVariable(ranges?.[0]);
    // Unsupported as simple action
    case "highlight":
      throw Error("Highlight command not supported as simple action");
  }
}

// ../cursorless-engine/src/actions/CopyToClipboard.ts
var CopyToClipboard = class {
  constructor(actions, rangeUpdater) {
    this.actions = actions;
    this.rangeUpdater = rangeUpdater;
    this.run = this.run.bind(this);
  }
  async run(targets, options2 = { showDecorations: true }) {
    if (ide().capabilities.commands.clipboardCopy != null) {
      const simpleAction = new CopyToClipboardSimple(this.rangeUpdater);
      return simpleAction.run(targets, options2);
    }
    if (options2.showDecorations) {
      await flashTargets(
        ide(),
        targets,
        "referenced" /* referenced */,
        (target) => target.contentRange
      );
    }
    const text = targets.map((t) => t.contentText).join("\n");
    await ide().clipboard.writeText(text);
    return { thatTargets: targets };
  }
};

// ../cursorless-engine/src/actions/CutToClipboard.ts
var CutToClipboard = class {
  constructor(actions) {
    this.actions = actions;
    this.run = this.run.bind(this);
  }
  async run(targets) {
    await ide().flashRanges(
      targets.flatMap((target) => {
        const { editor, contentRange } = target;
        const removalHighlightRange = target.getRemovalHighlightRange();
        if (target.isLine) {
          return [
            {
              editor,
              range: toCharacterRange(contentRange),
              style: "referenced" /* referenced */
            },
            {
              editor,
              range: toLineRange(removalHighlightRange),
              style: "pendingDelete" /* pendingDelete */
            }
          ];
        }
        return [
          {
            editor,
            range: toCharacterRange(contentRange),
            style: "referenced" /* referenced */
          },
          ...getOutsideOverflow(contentRange, removalHighlightRange).map(
            (overflow) => ({
              editor,
              range: toCharacterRange(overflow),
              style: "pendingDelete" /* pendingDelete */
            })
          )
        ];
      })
    );
    const options2 = { showDecorations: false };
    await this.actions.copyToClipboard.run(targets, options2);
    const { thatTargets } = await this.actions.remove.run(targets, options2);
    return { thatTargets };
  }
};
function getOutsideOverflow(insideRange, outsideRange) {
  const { start: insideStart, end: insideEnd } = insideRange;
  const { start: outsideStart, end: outsideEnd } = outsideRange;
  const result = [];
  if (outsideStart.isBefore(insideStart)) {
    result.push(new Range(outsideStart, insideStart));
  }
  if (outsideEnd.isAfter(insideEnd)) {
    result.push(new Range(insideEnd, outsideEnd));
  }
  return result;
}

// ../cursorless-engine/src/actions/Deselect.ts
var Deselect = class {
  constructor() {
    this.run = this.run.bind(this);
  }
  async run(targets) {
    await runOnTargetsForEachEditor(targets, async (editor, targets2) => {
      const newSelections = editor.selections.filter(
        (selection) => !targets2.some((target) => {
          const intersection = target.contentRange.intersection(selection);
          return intersection && (!intersection.isEmpty || selection.isEmpty);
        })
      );
      if (newSelections.length === 0) {
        throw new SelectionRequiredError();
      }
      await ide().getEditableTextEditor(editor).setSelections(newSelections);
    });
    return {
      thatTargets: targets
    };
  }
};
var SelectionRequiredError = class extends Error {
  constructor() {
    super("Can't deselect every selection. At least one is required");
    this.name = "SelectionRequiredError";
  }
};

// ../cursorless-engine/src/actions/EditNew/runEditTargets.ts
async function runEditTargets(rangeUpdater, editor, state, useAllDestinations) {
  const destinations = state.destinations.map((destination, index) => {
    if (useAllDestinations || destination.getEditNewActionType() === "edit") {
      return {
        destination,
        index
      };
    }
  }).filter((destination) => !!destination);
  if (destinations.length === 0) {
    return state;
  }
  const edits = destinations.map(
    (destination) => destination.destination.constructChangeEdit("")
  );
  const cursorInfos = state.cursorRanges.map((range3, index) => ({ range: range3, index })).filter(({ range: range3 }) => range3 != null);
  const cursorIndices = cursorInfos.map(({ index }) => index);
  const cursorRanges = cursorInfos.map(({ range: range3 }) => range3);
  const editRanges = edits.map((edit) => edit.range);
  const {
    thatRanges: updatedThatRanges,
    cursorRanges: updatedCursorRanges,
    editRanges: updatedEditRanges
  } = await performEditsAndUpdateSelections({
    rangeUpdater,
    editor,
    edits,
    preserveCursorSelections: true,
    selections: {
      thatRanges: state.thatRanges,
      cursorRanges,
      editRanges: {
        selections: editRanges,
        behavior: 0 /* openOpen */
      }
    }
  });
  const finalCursorRanges = [...state.cursorRanges];
  zip_default(cursorIndices, updatedCursorRanges).forEach(([index, range3]) => {
    finalCursorRanges[index] = range3;
  });
  destinations.forEach((delimiterTarget, index) => {
    const edit = edits[index];
    const range3 = edit.updateRange(updatedEditRanges[index]);
    finalCursorRanges[delimiterTarget.index] = range3;
  });
  return {
    destinations: state.destinations,
    thatRanges: updatedThatRanges,
    cursorRanges: finalCursorRanges
  };
}

// ../cursorless-engine/src/actions/EditNew/runInsertLineAfterTargets.ts
async function runInsertLineAfterTargets({ acceptsLocation }, rangeUpdater, editor, state) {
  const destinations = state.destinations.map((destination, index) => {
    const actionType = destination.getEditNewActionType();
    if (actionType === "insertLineAfter") {
      return {
        destination,
        index
      };
    }
  }).filter((destination) => !!destination);
  if (destinations.length === 0) {
    return state;
  }
  const contentRanges = destinations.map(
    ({ destination }) => destination.contentRange
  );
  const targetRanges = state.destinations.map(
    ({ contentRange }) => contentRange
  );
  const callback2 = async () => {
    if (acceptsLocation) {
      await editor.insertLineAfter(contentRanges);
    } else {
      await editor.setSelections(
        contentRanges.map((range3) => range3.toSelection(false))
      );
      await editor.focus();
      await editor.insertLineAfter();
    }
  };
  const { targetRanges: updatedTargetRanges, thatRanges: updatedThatRanges } = await performEditsAndUpdateSelections({
    rangeUpdater,
    editor,
    callback: callback2,
    preserveCursorSelections: true,
    selections: {
      targetRanges,
      thatRanges: state.thatRanges
    }
  });
  const cursorRanges = [...state.cursorRanges];
  destinations.forEach((commandTarget, index) => {
    cursorRanges[commandTarget.index] = editor.selections[index];
  });
  return {
    destinations: state.destinations.map(
      (destination, index) => destination.withTarget(
        destination.target.withContentRange(updatedTargetRanges[index])
      )
    ),
    thatRanges: updatedThatRanges,
    cursorRanges
  };
}

// ../cursorless-engine/src/actions/EditNew/runNotebookCellTargets.ts
async function runEditNewNotebookCellTargets(actions, destinations) {
  const destination = ensureSingleTarget2(destinations);
  const editor = ide().getEditableTextEditor(destination.editor);
  const isAbove = destination.insertionMode === "before";
  if (destination.insertionMode === "to") {
    throw Error(
      `Unsupported insertion mode '${destination.insertionMode}' for notebookcapell`
    );
  }
  await actions.setSelection.run([destination.target]);
  let modifyThatMark = (selection) => selection;
  if (isAbove) {
    modifyThatMark = await editor.editNewNotebookCellAbove();
  } else {
    await editor.editNewNotebookCellBelow();
  }
  const thatMark = createThatMark([destination.target.thatTarget]);
  thatMark[0].selection = modifyThatMark(thatMark[0].selection);
  return { thatSelections: thatMark };
}

// ../cursorless-engine/src/actions/EditNew/EditNew.ts
var EditNew = class {
  constructor(rangeUpdater, actions) {
    this.rangeUpdater = rangeUpdater;
    this.actions = actions;
    this.run = this.run.bind(this);
  }
  async run(destinations) {
    if (destinations.some(({ target }) => target.isNotebookCell)) {
      return runEditNewNotebookCellTargets(this.actions, destinations);
    }
    const editableEditor = ide().getEditableTextEditor(
      ensureSingleEditor2(destinations)
    );
    let state = {
      destinations,
      thatRanges: destinations.map(
        ({ target }) => target.thatTarget.contentRange
      ),
      cursorRanges: new Array(destinations.length).fill(
        void 0
      )
    };
    const insertLineAfterCapability = ide().capabilities.commands.insertLineAfter;
    const useInsertLineAfter = insertLineAfterCapability != null;
    if (useInsertLineAfter) {
      state = await runInsertLineAfterTargets(
        insertLineAfterCapability,
        this.rangeUpdater,
        editableEditor,
        state
      );
    }
    state = await runEditTargets(
      this.rangeUpdater,
      editableEditor,
      state,
      !useInsertLineAfter
    );
    const newSelections = state.destinations.map(
      (destination, index) => state.cursorRanges[index].toSelection(destination.target.isReversed)
    );
    await editableEditor.setSelections(newSelections, { focusEditor: true });
    return {
      thatSelections: createThatMark(
        state.destinations.map((d) => d.target),
        state.thatRanges
      )
    };
  }
};

// ../cursorless-engine/src/actions/EditNewLineAction.ts
var EditNewLineAction = class {
  constructor(actions, modifierStageFactory) {
    this.actions = actions;
    this.modifierStageFactory = modifierStageFactory;
    this.run = this.run.bind(this);
  }
  getFinalStages() {
    return [this.modifierStageFactory.create(containingLineIfUntypedModifier)];
  }
  run(targets) {
    return this.actions.editNew.run(
      targets.map((target) => target.toDestination(this.insertionMode))
    );
  }
};
var EditNewBefore = class extends EditNewLineAction {
  constructor() {
    super(...arguments);
    this.insertionMode = "before";
  }
};
var EditNewAfter = class extends EditNewLineAction {
  constructor() {
    super(...arguments);
    this.insertionMode = "after";
  }
};

// ../cursorless-engine/src/actions/ExecuteCommand.ts
var ExecuteCommand = class {
  constructor(rangeUpdater) {
    this.callbackAction = new CallbackAction(rangeUpdater);
    this.run = this.run.bind(this);
  }
  async run(targets, commandId, {
    commandArgs,
    ensureSingleEditor: ensureSingleEditor3,
    ensureSingleTarget: ensureSingleTarget3,
    restoreSelection,
    showDecorations
  } = {}) {
    const args = commandArgs ?? [];
    return this.callbackAction.run(targets, {
      callback: () => ide().executeCommand(commandId, ...args),
      setSelection: true,
      ensureSingleEditor: ensureSingleEditor3 ?? false,
      ensureSingleTarget: ensureSingleTarget3 ?? false,
      restoreSelection: restoreSelection ?? true,
      showDecorations: showDecorations ?? true
    });
  }
};

// ../cursorless-engine/src/actions/Find.ts
var Find = class {
  constructor(actions) {
    this.actions = actions;
    this.run = this.run.bind(this);
  }
  async run(targets) {
    ensureSingleTarget2(targets);
    const { returnValue, thatTargets } = await this.actions.getText.run(targets);
    const [text] = returnValue;
    let query;
    if (text.length > 200) {
      query = text.substring(0, 200);
      void showWarning(
        ide().messages,
        "truncatedSearchText",
        "Search text is longer than 200 characters; truncating"
      );
    } else {
      query = text;
    }
    await this.find(query);
    return { thatTargets };
  }
};
var FindInDocument = class extends Find {
  find(query) {
    return ide().findInDocument(query);
  }
};
var FindInWorkspace = class extends Find {
  find(query) {
    return ide().findInWorkspace(query);
  }
};

// ../cursorless-engine/src/actions/FollowLink.ts
var FollowLink = class {
  constructor(options2) {
    this.options = options2;
    this.run = this.run.bind(this);
  }
  async run(targets) {
    const target = ensureSingleTarget2(targets);
    await flashTargets(ide(), targets, "referenced" /* referenced */);
    await ide().getEditableTextEditor(target.editor).openLink(target.contentRange, this.options);
    return {
      thatSelections: createThatMark(targets)
    };
  }
};

// ../cursorless-engine/src/actions/GenerateSnippet/constructSnippetBody.ts
function constructSnippetBody(text, linePrefix) {
  const outputLines = [];
  let currentTabCount = 0;
  let currentIndentationString = null;
  const [firstLine, ...remainingLines] = text.split(/\r?\n/);
  const lines = [
    {
      text: linePrefix + firstLine,
      startIndex: linePrefix.length
    },
    ...remainingLines.map((line) => ({ text: line, startIndex: 0 }))
  ];
  lines.forEach(({ text: text2, startIndex }) => {
    const newIndentationString = text2.match(/^\s*/)?.[0] ?? "";
    const firstNonWhitespaceCharacterIndex = newIndentationString.length;
    if (currentIndentationString != null) {
      if (newIndentationString.length > currentIndentationString.length) {
        currentTabCount++;
      } else if (newIndentationString.length < currentIndentationString.length) {
        currentTabCount--;
      }
    }
    currentIndentationString = newIndentationString;
    const lineContentStart = Math.max(
      firstNonWhitespaceCharacterIndex,
      startIndex
    );
    const snippetIndentationString = repeat_default("	", currentTabCount);
    const lineContent = text2.slice(lineContentStart);
    outputLines.push(snippetIndentationString + lineContent);
  });
  return outputLines;
}

// ../cursorless-engine/src/actions/GenerateSnippet/editText.ts
function editText(text, edits) {
  const sortedEdits = sortBy_default(edits, (edit) => edit.offsets.start);
  let output = "";
  let currentOffset = 0;
  for (const edit of sortedEdits) {
    output += text.slice(currentOffset, edit.offsets.start) + edit.text;
    currentOffset = edit.offsets.end;
  }
  output += text.slice(currentOffset);
  return output;
}

// ../cursorless-engine/src/actions/GenerateSnippet/Substituter.ts
var Substituter = class {
  constructor() {
    this.substitutions = [];
  }
  /**
   * Get a random id that can be put into your text body that will then be
   * replaced by {@link to} when you call {@link makeSubstitutions}.
   * @param to The string that you'd like to end up in the final document after
   * replacements
   * @param isQuoted Use this variable to indicate that in the final text the
   * variable will end up quoted. This occurs if you use the replacement string
   * as a stand alone string in a json document and then you serialize it
   * @returns A unique random id that can be put into the document that will
   * then be substituted later
   */
  addSubstitution(to, isQuoted = false) {
    const randomId = makeid(10);
    this.substitutions.push({
      to,
      randomId,
      isQuoted
    });
    return randomId;
  }
  /**
   * Performs substitutions on {@link text}, replacing the random ids generated
   * by {@link addSubstitution} with the values passed in for `to`.
   * @param text The text to perform substitutions on
   * @returns The text with variable substituted for the original values you
   * desired
   */
  makeSubstitutions(text) {
    this.substitutions.forEach(({ to, randomId, isQuoted }) => {
      const from = isQuoted ? `"${randomId}"` : randomId;
      text = text.split(from).join(to);
    });
    return text;
  }
};
function makeid(length) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// ../cursorless-engine/src/actions/GenerateSnippet/GenerateSnippet.ts
var GenerateSnippet = class {
  constructor(snippets) {
    this.snippets = snippets;
    this.run = this.run.bind(this);
  }
  async run(targets, snippetName) {
    const target = ensureSingleTarget2(targets);
    const editor = target.editor;
    void flashTargets(ide(), targets, "referenced" /* referenced */);
    if (snippetName == null) {
      snippetName = await ide().showInputBox({
        prompt: "Name of snippet",
        placeHolder: "helloWorld"
      });
    }
    if (snippetName == null) {
      return {};
    }
    let currentPlaceholderIndex = 1;
    const baseOffset = editor.document.offsetAt(target.contentRange.start);
    const variables = editor.selections.filter((selection) => target.contentRange.contains(selection)).map((selection, index) => ({
      offsets: {
        start: editor.document.offsetAt(selection.start) - baseOffset,
        end: editor.document.offsetAt(selection.end) - baseOffset
      },
      defaultName: `variable${index + 1}`,
      placeholderIndex: currentPlaceholderIndex++
    }));
    const substituter = new Substituter();
    const linePrefix = editor.document.getText(
      new Range(
        target.contentRange.start.with(void 0, 0),
        target.contentRange.start
      )
    );
    const originalText = editor.document.getText(target.contentRange);
    const snippetBodyText = editText(originalText, [
      ...matchAll(originalText, /\$|\\/g, (match) => ({
        offsets: {
          start: match.index,
          end: match.index + match[0].length
        },
        text: match[0] === "\\" ? `\\${match[0]}` : `\\\\${match[0]}`
      })),
      ...variables.map(({ offsets, defaultName, placeholderIndex }) => ({
        offsets,
        // Note that the reason we use the substituter here is primarily so
        // that the `\` below doesn't get escaped upon conversion to json.
        text: substituter.addSubstitution(
          [
            // This `\$` will end up being a `$` in the final document.  It
            // indicates the start of a variable in the user snippet.  We need
            // the `\` so that the meta-snippet doesn't see it as one of its
            // placeholders.
            "\\$",
            // The remaining text here is a placeholder in the meta-snippet
            // that the user can use to name their snippet variable that will
            // be in the user snippet.
            "${",
            placeholderIndex,
            ":",
            defaultName,
            "}"
          ].join("")
        )
      }))
    ]);
    const snippetLines = constructSnippetBody(snippetBodyText, linePrefix);
    const constructVariableDescriptionEntry = ({
      placeholderIndex
    }) => {
      const key = "$" + placeholderIndex;
      const value = substituter.addSubstitution(
        "{$" + currentPlaceholderIndex++ + "}",
        true
      );
      return [key, value];
    };
    const snippet2 = {
      [snippetName]: {
        definitions: [
          {
            scope: {
              langIds: [editor.document.languageId]
            },
            body: snippetLines
          }
        ],
        description: "$" + currentPlaceholderIndex++,
        variables: variables.length === 0 ? void 0 : Object.fromEntries(
          variables.map(constructVariableDescriptionEntry)
        )
      }
    };
    const snippetText = substituter.makeSubstitutions(
      JSON.stringify(snippet2, null, 2)
    );
    const editableEditor = ide().getEditableTextEditor(editor);
    if (ide().runMode === "test") {
      await editableEditor.setSelections([
        editor.document.range.toSelection(false)
      ]);
    } else {
      await this.snippets.openNewSnippetFile(snippetName);
    }
    await editableEditor.insertSnippet(snippetText);
    return {
      thatSelections: targets.map(({ editor: editor2, contentSelection }) => ({
        editor: editor2,
        selection: contentSelection
      }))
    };
  }
};

// ../cursorless-engine/src/actions/GetTargets.ts
var GetTargets = class {
  constructor() {
    this.run = this.run.bind(this);
  }
  async run(targets) {
    return {
      returnValue: targets.map(({ contentRange }) => ({
        contentRange
      })),
      thatTargets: targets
    };
  }
};

// ../cursorless-engine/src/actions/GetText.ts
var GetText = class {
  constructor() {
    this.run = this.run.bind(this);
  }
  async run(targets, {
    showDecorations = true,
    ensureSingleTarget: doEnsureSingleTarget = false
  } = {}) {
    if (showDecorations) {
      await flashTargets(ide(), targets, "referenced" /* referenced */);
    }
    if (doEnsureSingleTarget) {
      ensureSingleTarget2(targets);
    }
    return {
      returnValue: targets.map((target) => target.contentText),
      thatTargets: targets
    };
  }
};

// ../cursorless-engine/src/actions/Highlight.ts
var Highlight = class {
  constructor() {
    this.run = this.run.bind(this);
  }
  async run(targets, highlightId) {
    if (ide().capabilities.commands["highlight"] == null) {
      throw Error(`The highlight action is not supported by your ide`);
    }
    if (targets.length === 0) {
      await Promise.all(
        ide().visibleTextEditors.map(
          (editor) => ide().setHighlightRanges(highlightId, editor, [])
        )
      );
    } else {
      await runOnTargetsForEachEditor(
        targets,
        (editor, targets2) => ide().setHighlightRanges(
          highlightId,
          editor,
          targets2.map(toGeneralizedRange)
        )
      );
    }
    return {
      thatTargets: targets
    };
  }
};

// ../cursorless-engine/src/actions/InsertCopy.ts
var InsertCopy = class {
  constructor(rangeUpdater, modifierStageFactory, isBefore) {
    this.rangeUpdater = rangeUpdater;
    this.modifierStageFactory = modifierStageFactory;
    this.isBefore = isBefore;
    this.getFinalStages = () => [
      this.modifierStageFactory.create(containingLineIfUntypedModifier)
    ];
    this.run = this.run.bind(this);
    this.runForEditor = this.runForEditor.bind(this);
  }
  async run(targets) {
    const results = flatten_default(
      await runOnTargetsForEachEditor(targets, this.runForEditor)
    );
    await ide().flashRanges(
      results.flatMap(
        (result) => result.thatMark.map((that) => ({
          editor: that.editor,
          range: toCharacterRange(that.selection),
          style: "justAdded" /* justAdded */
        }))
      )
    );
    return {
      sourceSelections: results.flatMap(({ sourceMark }) => sourceMark),
      thatSelections: results.flatMap(({ thatMark }) => thatMark)
    };
  }
  async runForEditor(editor, targets) {
    const position = this.isBefore ? "after" : "before";
    const edits = targets.flatMap(
      (target) => target.toDestination(position).constructChangeEdit(target.contentText)
    );
    const contentSelections = targets.map(
      ({ contentSelection }) => contentSelection
    );
    const editRanges = edits.map(({ range: range3 }) => range3);
    const editableEditor = ide().getEditableTextEditor(editor);
    const {
      contentSelections: updatedContentSelections,
      editRanges: updatedEditRanges
    } = await performEditsAndUpdateSelections({
      rangeUpdater: this.rangeUpdater,
      editor: editableEditor,
      edits,
      selections: {
        contentSelections,
        editRanges: {
          selections: editRanges,
          behavior: 0 /* openOpen */
        }
      }
    });
    const insertionRanges = zip_default(edits, updatedEditRanges).map(
      ([edit, range3]) => edit.updateRange(range3)
    );
    const primarySelection = editor.selections[0];
    if (updatedContentSelections.some(
      (selection) => selection.intersection(primarySelection) != null
    )) {
      await editableEditor.revealRange(primarySelection);
    }
    return {
      sourceMark: createThatMark(targets, insertionRanges),
      thatMark: createThatMark(targets, updatedContentSelections)
    };
  }
};
var CopyContentBefore = class extends InsertCopy {
  constructor(rangeUpdater, modifierStageFactory) {
    super(rangeUpdater, modifierStageFactory, true);
  }
};
var CopyContentAfter = class extends InsertCopy {
  constructor(rangeUpdater, modifierStageFactory) {
    super(rangeUpdater, modifierStageFactory, false);
  }
};

// ../cursorless-engine/src/actions/InsertEmptyLines.ts
var InsertEmptyLines = class {
  constructor(rangeUpdater, modifierStageFactory) {
    this.rangeUpdater = rangeUpdater;
    this.modifierStageFactory = modifierStageFactory;
    this.run = this.run.bind(this);
  }
  getFinalStages() {
    return [this.modifierStageFactory.create(containingLineIfUntypedModifier)];
  }
  async run(targets) {
    const results = await runOnTargetsForEachEditor(
      targets,
      async (editor, targets2) => {
        const edits = this.getEdits(targets2);
        const contentSelections = targets2.map(
          (target) => target.thatTarget.contentSelection
        );
        const {
          contentSelections: updatedThatSelections,
          editRanges: updatedEditRanges
        } = await performEditsAndUpdateSelections({
          rangeUpdater: this.rangeUpdater,
          editor: ide().getEditableTextEditor(editor),
          edits,
          selections: {
            contentSelections,
            editRanges: {
              selections: edits.map((edit) => edit.range),
              behavior: 0 /* openOpen */
            }
          }
        });
        return {
          thatMark: updatedThatSelections.map((selection) => ({
            editor,
            selection
          })),
          flashRanges: zipStrict(edits, updatedEditRanges).map(
            ([edit, editRange]) => ({
              editor,
              // Exclude the new line delimiter from the range for line edits
              range: edit.isLine ? edit.updateRange(editRange) : editRange,
              isLine: edit.isLine
            })
          )
        };
      }
    );
    await ide().flashRanges(
      results.flatMap(
        (result) => result.flashRanges.map(({ editor, range: range3, isLine }) => ({
          editor,
          range: isLine ? toLineRange(range3) : toCharacterRange(range3),
          style: "justAdded" /* justAdded */
        }))
      )
    );
    const thatMark = results.flatMap((result) => result.thatMark);
    return { thatSelections: thatMark };
  }
};
var InsertEmptyLinesAround = class extends InsertEmptyLines {
  constructor(rangeUpdater, modifierStageFactory) {
    super(rangeUpdater, modifierStageFactory);
  }
  getEdits(targets) {
    return targets.flatMap((target) => [
      constructChangeEdit(target, "before"),
      constructChangeEdit(target, "after")
    ]);
  }
};
var InsertEmptyLineAbove = class extends InsertEmptyLines {
  constructor(rangeUpdater, modifierStageFactory) {
    super(rangeUpdater, modifierStageFactory);
  }
  getEdits(targets) {
    return targets.map((target) => constructChangeEdit(target, "before"));
  }
};
var InsertEmptyLineBelow = class extends InsertEmptyLines {
  constructor(rangeUpdater, modifierStageFactory) {
    super(rangeUpdater, modifierStageFactory);
  }
  getEdits(targets) {
    return targets.map((target) => constructChangeEdit(target, "after"));
  }
};
function constructChangeEdit(target, insertionMode2) {
  return {
    ...target.toDestination(insertionMode2).constructChangeEdit("", true),
    isLine: target.isLine
  };
}

// ../cursorless-engine/src/snippets/vendor/vscodeSnippet/snippetParser.ts
var Scanner = class _Scanner {
  constructor() {
    this.value = "";
    this.pos = 0;
  }
  static {
    this._table = {
      [36 /* DollarSign */]: 0 /* Dollar */,
      [58 /* Colon */]: 1 /* Colon */,
      [44 /* Comma */]: 2 /* Comma */,
      [123 /* OpenCurlyBrace */]: 3 /* CurlyOpen */,
      [125 /* CloseCurlyBrace */]: 4 /* CurlyClose */,
      [92 /* Backslash */]: 5 /* Backslash */,
      [47 /* Slash */]: 6 /* Forwardslash */,
      [124 /* Pipe */]: 7 /* Pipe */,
      [43 /* Plus */]: 11 /* Plus */,
      [45 /* Dash */]: 12 /* Dash */,
      [63 /* QuestionMark */]: 13 /* QuestionMark */
    };
  }
  static isDigitCharacter(ch) {
    return ch >= 48 /* Digit0 */ && ch <= 57 /* Digit9 */;
  }
  static isVariableCharacter(ch) {
    return ch === 95 /* Underline */ || ch >= 97 /* a */ && ch <= 122 /* z */ || ch >= 65 /* A */ && ch <= 90 /* Z */;
  }
  text(value) {
    this.value = value;
    this.pos = 0;
  }
  tokenText(token) {
    return this.value.substr(token.pos, token.len);
  }
  next() {
    if (this.pos >= this.value.length) {
      return { type: 14 /* EOF */, pos: this.pos, len: 0 };
    }
    let pos = this.pos;
    let len = 0;
    let ch = this.value.charCodeAt(pos);
    let type2;
    type2 = _Scanner._table[ch];
    if (typeof type2 === "number") {
      this.pos += 1;
      return { type: type2, pos, len: 1 };
    }
    if (_Scanner.isDigitCharacter(ch)) {
      type2 = 8 /* Int */;
      do {
        len += 1;
        ch = this.value.charCodeAt(pos + len);
      } while (_Scanner.isDigitCharacter(ch));
      this.pos += len;
      return { type: type2, pos, len };
    }
    if (_Scanner.isVariableCharacter(ch)) {
      type2 = 9 /* VariableName */;
      do {
        ch = this.value.charCodeAt(pos + ++len);
      } while (_Scanner.isVariableCharacter(ch) || _Scanner.isDigitCharacter(ch));
      this.pos += len;
      return { type: type2, pos, len };
    }
    type2 = 10 /* Format */;
    do {
      len += 1;
      ch = this.value.charCodeAt(pos + len);
    } while (!isNaN(ch) && typeof _Scanner._table[ch] === "undefined" && !_Scanner.isDigitCharacter(ch) && !_Scanner.isVariableCharacter(ch));
    this.pos += len;
    return { type: type2, pos, len };
  }
};
var Marker = class {
  constructor() {
    this._children = [];
  }
  appendChild(child) {
    if (child instanceof Text && this._children[this._children.length - 1] instanceof Text) {
      this._children[this._children.length - 1].value += child.value;
    } else {
      child.parent = this;
      this._children.push(child);
    }
    return this;
  }
  replace(child, others) {
    const { parent } = child;
    const idx = parent.children.indexOf(child);
    const newChildren = parent.children.slice(0);
    newChildren.splice(idx, 1, ...others);
    parent._children = newChildren;
    (function _fixParent(children, parent2) {
      for (const child2 of children) {
        child2.parent = parent2;
        _fixParent(child2.children, child2);
      }
    })(others, parent);
  }
  get children() {
    return this._children;
  }
  get snippet() {
    let candidate = this;
    while (true) {
      if (!candidate) {
        return void 0;
      }
      if (candidate instanceof TextmateSnippet) {
        return candidate;
      }
      candidate = candidate.parent;
    }
  }
  toString() {
    return this.children.reduce((prev, cur) => prev + cur.toString(), "");
  }
  len() {
    return 0;
  }
};
var Text = class _Text extends Marker {
  constructor(value) {
    super();
    this.value = value;
  }
  static escape(value) {
    return value.replace(/\$|}|\\/g, "\\$&");
  }
  toString() {
    return this.value;
  }
  toTextmateString() {
    return _Text.escape(this.value);
  }
  len() {
    return this.value.length;
  }
  clone() {
    return new _Text(this.value);
  }
};
var TransformableMarker = class extends Marker {
};
var Placeholder = class _Placeholder extends TransformableMarker {
  constructor(index) {
    super();
    this.index = index;
  }
  static compareByIndex(a, b) {
    if (a.index === b.index) {
      return 0;
    } else if (a.isFinalTabstop) {
      return 1;
    } else if (b.isFinalTabstop) {
      return -1;
    } else if (a.index < b.index) {
      return -1;
    } else if (a.index > b.index) {
      return 1;
    } else {
      return 0;
    }
  }
  get isFinalTabstop() {
    return this.index === 0;
  }
  get choice() {
    return this._children.length === 1 && this._children[0] instanceof Choice ? this._children[0] : void 0;
  }
  toTextmateString() {
    let transformString = "";
    if (this.transform) {
      transformString = this.transform.toTextmateString();
    }
    if (this.children.length === 0 && !this.transform) {
      return `$${this.index}`;
    } else if (this.children.length === 0) {
      return `\${${this.index}${transformString}}`;
    } else if (this.choice) {
      return `\${${this.index}|${this.choice.toTextmateString()}|${transformString}}`;
    } else {
      return `\${${this.index}:${this.children.map((child) => child.toTextmateString()).join("")}${transformString}}`;
    }
  }
  clone() {
    let ret = new _Placeholder(this.index);
    if (this.transform) {
      ret.transform = this.transform.clone();
    }
    ret._children = this.children.map((child) => child.clone());
    return ret;
  }
};
var Choice = class _Choice extends Marker {
  constructor() {
    super(...arguments);
    this.options = [];
  }
  appendChild(marker) {
    if (marker instanceof Text) {
      marker.parent = this;
      this.options.push(marker);
    }
    return this;
  }
  toString() {
    return this.options[0].value;
  }
  toTextmateString() {
    return this.options.map((option) => option.value.replace(/\||,|\\/g, "\\$&")).join(",");
  }
  len() {
    return this.options[0].len();
  }
  clone() {
    let ret = new _Choice();
    this.options.forEach(ret.appendChild, ret);
    return ret;
  }
};
var Transform = class _Transform extends Marker {
  constructor() {
    super(...arguments);
    this.regexp = new RegExp("");
  }
  resolve(value) {
    const _this = this;
    let didMatch = false;
    let ret = value.replace(this.regexp, function() {
      didMatch = true;
      return _this._replace(Array.prototype.slice.call(arguments, 0, -2));
    });
    if (!didMatch && this._children.some((child) => child instanceof FormatString && Boolean(child.elseValue))) {
      ret = this._replace([]);
    }
    return ret;
  }
  _replace(groups) {
    let ret = "";
    for (const marker of this._children) {
      if (marker instanceof FormatString) {
        let value = groups[marker.index] || "";
        value = marker.resolve(value);
        ret += value;
      } else {
        ret += marker.toString();
      }
    }
    return ret;
  }
  toString() {
    return "";
  }
  toTextmateString() {
    return `/${this.regexp.source}/${this.children.map((c) => c.toTextmateString())}/${(this.regexp.ignoreCase ? "i" : "") + (this.regexp.global ? "g" : "")}`;
  }
  clone() {
    let ret = new _Transform();
    ret.regexp = new RegExp(this.regexp.source, (this.regexp.ignoreCase ? "i" : "") + (this.regexp.global ? "g" : ""));
    ret._children = this.children.map((child) => child.clone());
    return ret;
  }
};
var FormatString = class _FormatString extends Marker {
  constructor(index, shorthandName, ifValue, elseValue) {
    super();
    this.index = index;
    this.shorthandName = shorthandName;
    this.ifValue = ifValue;
    this.elseValue = elseValue;
  }
  resolve(value) {
    if (this.shorthandName === "upcase") {
      return !value ? "" : value.toLocaleUpperCase();
    } else if (this.shorthandName === "downcase") {
      return !value ? "" : value.toLocaleLowerCase();
    } else if (this.shorthandName === "capitalize") {
      return !value ? "" : value[0].toLocaleUpperCase() + value.substr(1);
    } else if (this.shorthandName === "pascalcase") {
      return !value ? "" : this._toPascalCase(value);
    } else if (this.shorthandName === "camelcase") {
      return !value ? "" : this._toCamelCase(value);
    } else if (Boolean(value) && typeof this.ifValue === "string") {
      return this.ifValue;
    } else if (!Boolean(value) && typeof this.elseValue === "string") {
      return this.elseValue;
    } else {
      return value || "";
    }
  }
  _toPascalCase(value) {
    const match = value.match(/[a-z0-9]+/gi);
    if (!match) {
      return value;
    }
    return match.map((word) => {
      return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
    }).join("");
  }
  _toCamelCase(value) {
    const match = value.match(/[a-z0-9]+/gi);
    if (!match) {
      return value;
    }
    return match.map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      } else {
        return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
      }
    }).join("");
  }
  toTextmateString() {
    let value = "${";
    value += this.index;
    if (this.shorthandName) {
      value += `:/${this.shorthandName}`;
    } else if (this.ifValue && this.elseValue) {
      value += `:?${this.ifValue}:${this.elseValue}`;
    } else if (this.ifValue) {
      value += `:+${this.ifValue}`;
    } else if (this.elseValue) {
      value += `:-${this.elseValue}`;
    }
    value += "}";
    return value;
  }
  clone() {
    let ret = new _FormatString(this.index, this.shorthandName, this.ifValue, this.elseValue);
    return ret;
  }
};
var Variable = class _Variable extends TransformableMarker {
  constructor(name) {
    super();
    this.name = name;
  }
  resolve(resolver) {
    let value = resolver.resolve(this);
    if (this.transform) {
      value = this.transform.resolve(value || "");
    }
    if (value !== void 0) {
      this._children = [new Text(value)];
      return true;
    }
    return false;
  }
  toTextmateString() {
    let transformString = "";
    if (this.transform) {
      transformString = this.transform.toTextmateString();
    }
    if (this.children.length === 0) {
      return `\${${this.name}${transformString}}`;
    } else {
      return `\${${this.name}:${this.children.map((child) => child.toTextmateString()).join("")}${transformString}}`;
    }
  }
  clone() {
    const ret = new _Variable(this.name);
    if (this.transform) {
      ret.transform = this.transform.clone();
    }
    ret._children = this.children.map((child) => child.clone());
    return ret;
  }
};
function walk(marker, visitor) {
  const stack = [...marker];
  while (stack.length > 0) {
    const marker2 = stack.shift();
    const recurse = visitor(marker2);
    if (!recurse) {
      break;
    }
    stack.unshift(...marker2.children);
  }
}
var TextmateSnippet = class _TextmateSnippet extends Marker {
  get placeholderInfo() {
    if (!this._placeholders) {
      let all = [];
      let last2;
      this.walk(function(candidate) {
        if (candidate instanceof Placeholder) {
          all.push(candidate);
          last2 = !last2 || last2.index < candidate.index ? candidate : last2;
        }
        return true;
      });
      this._placeholders = { all, last: last2 };
    }
    return this._placeholders;
  }
  get placeholders() {
    const { all } = this.placeholderInfo;
    return all;
  }
  offset(marker) {
    let pos = 0;
    let found = false;
    this.walk((candidate) => {
      if (candidate === marker) {
        found = true;
        return false;
      }
      pos += candidate.len();
      return true;
    });
    if (!found) {
      return -1;
    }
    return pos;
  }
  fullLen(marker) {
    let ret = 0;
    walk([marker], (marker2) => {
      ret += marker2.len();
      return true;
    });
    return ret;
  }
  enclosingPlaceholders(placeholder) {
    let ret = [];
    let { parent } = placeholder;
    while (parent) {
      if (parent instanceof Placeholder) {
        ret.push(parent);
      }
      parent = parent.parent;
    }
    return ret;
  }
  resolveVariables(resolver) {
    this.walk((candidate) => {
      if (candidate instanceof Variable) {
        if (candidate.resolve(resolver)) {
          this._placeholders = void 0;
        }
      }
      return true;
    });
    return this;
  }
  appendChild(child) {
    this._placeholders = void 0;
    return super.appendChild(child);
  }
  replace(child, others) {
    this._placeholders = void 0;
    return super.replace(child, others);
  }
  toTextmateString() {
    return this.children.reduce((prev, cur) => prev + cur.toTextmateString(), "");
  }
  clone() {
    let ret = new _TextmateSnippet();
    this._children = this.children.map((child) => child.clone());
    return ret;
  }
  walk(visitor) {
    walk(this.children, visitor);
  }
};
var SnippetParser = class {
  constructor() {
    this._scanner = new Scanner();
    this._token = { type: 14 /* EOF */, pos: 0, len: 0 };
  }
  static escape(value) {
    return value.replace(/\$|}|\\/g, "\\$&");
  }
  static guessNeedsClipboard(template) {
    return /\${?CLIPBOARD/.test(template);
  }
  text(value) {
    return this.parse(value).toString();
  }
  parse(value, insertFinalTabstop, enforceFinalTabstop) {
    this._scanner.text(value);
    this._token = this._scanner.next();
    const snippet2 = new TextmateSnippet();
    while (this._parse(snippet2)) {
    }
    const placeholderDefaultValues = /* @__PURE__ */ new Map();
    const incompletePlaceholders = [];
    let placeholderCount = 0;
    snippet2.walk((marker) => {
      if (marker instanceof Placeholder) {
        placeholderCount += 1;
        if (marker.isFinalTabstop) {
          placeholderDefaultValues.set(0, void 0);
        } else if (!placeholderDefaultValues.has(marker.index) && marker.children.length > 0) {
          placeholderDefaultValues.set(marker.index, marker.children);
        } else {
          incompletePlaceholders.push(marker);
        }
      }
      return true;
    });
    for (const placeholder of incompletePlaceholders) {
      const defaultValues = placeholderDefaultValues.get(placeholder.index);
      if (defaultValues) {
        const clone = new Placeholder(placeholder.index);
        clone.transform = placeholder.transform;
        for (const child of defaultValues) {
          clone.appendChild(child.clone());
        }
        snippet2.replace(placeholder, [clone]);
      }
    }
    if (!enforceFinalTabstop) {
      enforceFinalTabstop = placeholderCount > 0 && insertFinalTabstop;
    }
    if (!placeholderDefaultValues.has(0) && enforceFinalTabstop) {
      snippet2.appendChild(new Placeholder(0));
    }
    return snippet2;
  }
  _accept(type2, value) {
    if (type2 === void 0 || this._token.type === type2) {
      let ret = !value ? true : this._scanner.tokenText(this._token);
      this._token = this._scanner.next();
      return ret;
    }
    return false;
  }
  _backTo(token) {
    this._scanner.pos = token.pos + token.len;
    this._token = token;
    return false;
  }
  _until(type2) {
    const start = this._token;
    while (this._token.type !== type2) {
      if (this._token.type === 14 /* EOF */) {
        return false;
      } else if (this._token.type === 5 /* Backslash */) {
        const nextToken = this._scanner.next();
        if (nextToken.type !== 0 /* Dollar */ && nextToken.type !== 4 /* CurlyClose */ && nextToken.type !== 5 /* Backslash */) {
          return false;
        }
      }
      this._token = this._scanner.next();
    }
    const value = this._scanner.value.substring(start.pos, this._token.pos).replace(/\\(\$|}|\\)/g, "$1");
    this._token = this._scanner.next();
    return value;
  }
  _parse(marker) {
    return this._parseEscaped(marker) || this._parseTabstopOrVariableName(marker) || this._parseComplexPlaceholder(marker) || this._parseComplexVariable(marker) || this._parseAnything(marker);
  }
  // \$, \\, \} -> just text
  _parseEscaped(marker) {
    let value;
    if (value = this._accept(5 /* Backslash */, true)) {
      value = this._accept(0 /* Dollar */, true) || this._accept(4 /* CurlyClose */, true) || this._accept(5 /* Backslash */, true) || value;
      marker.appendChild(new Text(value));
      return true;
    }
    return false;
  }
  // $foo -> variable, $1 -> tabstop
  _parseTabstopOrVariableName(parent) {
    let value;
    const token = this._token;
    const match = this._accept(0 /* Dollar */) && (value = this._accept(9 /* VariableName */, true) || this._accept(8 /* Int */, true));
    if (!match) {
      return this._backTo(token);
    }
    parent.appendChild(
      /^\d+$/.test(value) ? new Placeholder(Number(value)) : new Variable(value)
    );
    return true;
  }
  // ${1:<children>}, ${1} -> placeholder
  _parseComplexPlaceholder(parent) {
    let index;
    const token = this._token;
    const match = this._accept(0 /* Dollar */) && this._accept(3 /* CurlyOpen */) && (index = this._accept(8 /* Int */, true));
    if (!match) {
      return this._backTo(token);
    }
    const placeholder = new Placeholder(Number(index));
    if (this._accept(1 /* Colon */)) {
      while (true) {
        if (this._accept(4 /* CurlyClose */)) {
          parent.appendChild(placeholder);
          return true;
        }
        if (this._parse(placeholder)) {
          continue;
        }
        parent.appendChild(new Text("${" + index + ":"));
        placeholder.children.forEach(parent.appendChild, parent);
        return true;
      }
    } else if (placeholder.index > 0 && this._accept(7 /* Pipe */)) {
      const choice = new Choice();
      while (true) {
        if (this._parseChoiceElement(choice)) {
          if (this._accept(2 /* Comma */)) {
            continue;
          }
          if (this._accept(7 /* Pipe */)) {
            placeholder.appendChild(choice);
            if (this._accept(4 /* CurlyClose */)) {
              parent.appendChild(placeholder);
              return true;
            }
          }
        }
        this._backTo(token);
        return false;
      }
    } else if (this._accept(6 /* Forwardslash */)) {
      if (this._parseTransform(placeholder)) {
        parent.appendChild(placeholder);
        return true;
      }
      this._backTo(token);
      return false;
    } else if (this._accept(4 /* CurlyClose */)) {
      parent.appendChild(placeholder);
      return true;
    } else {
      return this._backTo(token);
    }
  }
  _parseChoiceElement(parent) {
    const token = this._token;
    const values2 = [];
    while (true) {
      if (this._token.type === 2 /* Comma */ || this._token.type === 7 /* Pipe */) {
        break;
      }
      let value;
      if (value = this._accept(5 /* Backslash */, true)) {
        value = this._accept(2 /* Comma */, true) || this._accept(7 /* Pipe */, true) || this._accept(5 /* Backslash */, true) || value;
      } else {
        value = this._accept(void 0, true);
      }
      if (!value) {
        this._backTo(token);
        return false;
      }
      values2.push(value);
    }
    if (values2.length === 0) {
      this._backTo(token);
      return false;
    }
    parent.appendChild(new Text(values2.join("")));
    return true;
  }
  // ${foo:<children>}, ${foo} -> variable
  _parseComplexVariable(parent) {
    let name;
    const token = this._token;
    const match = this._accept(0 /* Dollar */) && this._accept(3 /* CurlyOpen */) && (name = this._accept(9 /* VariableName */, true));
    if (!match) {
      return this._backTo(token);
    }
    const variable = new Variable(name);
    if (this._accept(1 /* Colon */)) {
      while (true) {
        if (this._accept(4 /* CurlyClose */)) {
          parent.appendChild(variable);
          return true;
        }
        if (this._parse(variable)) {
          continue;
        }
        parent.appendChild(new Text("${" + name + ":"));
        variable.children.forEach(parent.appendChild, parent);
        return true;
      }
    } else if (this._accept(6 /* Forwardslash */)) {
      if (this._parseTransform(variable)) {
        parent.appendChild(variable);
        return true;
      }
      this._backTo(token);
      return false;
    } else if (this._accept(4 /* CurlyClose */)) {
      parent.appendChild(variable);
      return true;
    } else {
      return this._backTo(token);
    }
  }
  _parseTransform(parent) {
    let transform = new Transform();
    let regexValue = "";
    let regexOptions = "";
    while (true) {
      if (this._accept(6 /* Forwardslash */)) {
        break;
      }
      let escaped;
      if (escaped = this._accept(5 /* Backslash */, true)) {
        escaped = this._accept(6 /* Forwardslash */, true) || escaped;
        regexValue += escaped;
        continue;
      }
      if (this._token.type !== 14 /* EOF */) {
        regexValue += this._accept(void 0, true);
        continue;
      }
      return false;
    }
    while (true) {
      if (this._accept(6 /* Forwardslash */)) {
        break;
      }
      let escaped;
      if (escaped = this._accept(5 /* Backslash */, true)) {
        escaped = this._accept(5 /* Backslash */, true) || this._accept(6 /* Forwardslash */, true) || escaped;
        transform.appendChild(new Text(escaped));
        continue;
      }
      if (this._parseFormatString(transform) || this._parseAnything(transform)) {
        continue;
      }
      return false;
    }
    while (true) {
      if (this._accept(4 /* CurlyClose */)) {
        break;
      }
      if (this._token.type !== 14 /* EOF */) {
        regexOptions += this._accept(void 0, true);
        continue;
      }
      return false;
    }
    try {
      transform.regexp = new RegExp(regexValue, regexOptions);
    } catch (e) {
      return false;
    }
    parent.transform = transform;
    return true;
  }
  _parseFormatString(parent) {
    const token = this._token;
    if (!this._accept(0 /* Dollar */)) {
      return false;
    }
    let complex = false;
    if (this._accept(3 /* CurlyOpen */)) {
      complex = true;
    }
    let index = this._accept(8 /* Int */, true);
    if (!index) {
      this._backTo(token);
      return false;
    } else if (!complex) {
      parent.appendChild(new FormatString(Number(index)));
      return true;
    } else if (this._accept(4 /* CurlyClose */)) {
      parent.appendChild(new FormatString(Number(index)));
      return true;
    } else if (!this._accept(1 /* Colon */)) {
      this._backTo(token);
      return false;
    }
    if (this._accept(6 /* Forwardslash */)) {
      let shorthand = this._accept(9 /* VariableName */, true);
      if (!shorthand || !this._accept(4 /* CurlyClose */)) {
        this._backTo(token);
        return false;
      } else {
        parent.appendChild(new FormatString(Number(index), shorthand));
        return true;
      }
    } else if (this._accept(11 /* Plus */)) {
      let ifValue = this._until(4 /* CurlyClose */);
      if (ifValue) {
        parent.appendChild(new FormatString(Number(index), void 0, ifValue, void 0));
        return true;
      }
    } else if (this._accept(12 /* Dash */)) {
      let elseValue = this._until(4 /* CurlyClose */);
      if (elseValue) {
        parent.appendChild(new FormatString(Number(index), void 0, void 0, elseValue));
        return true;
      }
    } else if (this._accept(13 /* QuestionMark */)) {
      let ifValue = this._until(1 /* Colon */);
      if (ifValue) {
        let elseValue = this._until(4 /* CurlyClose */);
        if (elseValue) {
          parent.appendChild(new FormatString(Number(index), void 0, ifValue, elseValue));
          return true;
        }
      }
    } else {
      let elseValue = this._until(4 /* CurlyClose */);
      if (elseValue) {
        parent.appendChild(new FormatString(Number(index), void 0, void 0, elseValue));
        return true;
      }
    }
    this._backTo(token);
    return false;
  }
  _parseAnything(marker) {
    if (this._token.type !== 14 /* EOF */) {
      marker.appendChild(new Text(this._scanner.tokenText(this._token)));
      this._accept(void 0);
      return true;
    }
    return false;
  }
};

// ../cursorless-engine/src/snippets/vendor/vscodeSnippet/snippetVariables.ts
var KnownSnippetVariableNames = Object.freeze({
  "CURRENT_YEAR": true,
  "CURRENT_YEAR_SHORT": true,
  "CURRENT_MONTH": true,
  "CURRENT_DATE": true,
  "CURRENT_HOUR": true,
  "CURRENT_MINUTE": true,
  "CURRENT_SECOND": true,
  "CURRENT_DAY_NAME": true,
  "CURRENT_DAY_NAME_SHORT": true,
  "CURRENT_MONTH_NAME": true,
  "CURRENT_MONTH_NAME_SHORT": true,
  "CURRENT_SECONDS_UNIX": true,
  "SELECTION": true,
  "CLIPBOARD": true,
  "TM_SELECTED_TEXT": true,
  "TM_CURRENT_LINE": true,
  "TM_CURRENT_WORD": true,
  "TM_LINE_INDEX": true,
  "TM_LINE_NUMBER": true,
  "TM_FILENAME": true,
  "TM_FILENAME_BASE": true,
  "TM_DIRECTORY": true,
  "TM_FILEPATH": true,
  "RELATIVE_FILEPATH": true,
  "BLOCK_COMMENT_START": true,
  "BLOCK_COMMENT_END": true,
  "LINE_COMMENT": true,
  "WORKSPACE_NAME": true,
  "WORKSPACE_FOLDER": true,
  "RANDOM": true,
  "RANDOM_HEX": true,
  "UUID": true
});

// ../cursorless-engine/src/snippets/snippet.ts
function transformSnippetVariables(parsedSnippet, placeholderName, substitutions) {
  let nextPlaceholderIndex = getMaxPlaceholderIndex(parsedSnippet) + 1;
  const placeholderIndexMap = {};
  parsedSnippet.walk((candidate) => {
    if (candidate instanceof Variable) {
      if (candidate.name === placeholderName) {
        candidate.name = "TM_SELECTED_TEXT";
      } else if (substitutions != null && Object.prototype.hasOwnProperty.call(substitutions, candidate.name)) {
        candidate.parent.replace(candidate, [
          new Text(substitutions[candidate.name])
        ]);
      } else if (!KnownSnippetVariableNames[candidate.name]) {
        let placeholderIndex;
        if (candidate.name in placeholderIndexMap) {
          placeholderIndex = placeholderIndexMap[candidate.name];
        } else {
          placeholderIndex = nextPlaceholderIndex++;
          placeholderIndexMap[candidate.name] = placeholderIndex;
        }
        const placeholder = new Placeholder(placeholderIndex);
        candidate.children.forEach((child) => placeholder.appendChild(child));
        candidate.parent.replace(candidate, [placeholder]);
      }
    } else if (candidate instanceof Placeholder) {
      if (candidate.index.toString() === placeholderName) {
        candidate.parent.replace(candidate, [new Variable("TM_SELECTED_TEXT")]);
      }
    }
    return true;
  });
}
function getMaxPlaceholderIndex(parsedSnippet) {
  let placeholderIndex = 0;
  parsedSnippet.walk((candidate) => {
    if (candidate instanceof Placeholder) {
      placeholderIndex = Math.max(placeholderIndex, candidate.index);
    }
    return true;
  });
  return placeholderIndex;
}
function findMatchingSnippetDefinitionStrict(modifierStageFactory, targets, definitions) {
  const definitionIndices = targets.map(
    (target) => findMatchingSnippetDefinitionForSingleTarget(
      modifierStageFactory,
      target,
      definitions
    )
  );
  const definitionIndex = definitionIndices[0];
  if (!definitionIndices.every((index) => index === definitionIndex)) {
    throw new Error("Multiple snippet definitions match the given context");
  }
  if (definitionIndex === -1) {
    throw new Error("Couldn't find matching snippet definition");
  }
  return definitions[definitionIndex];
}
function findMatchingSnippetDefinitionForSingleTarget(modifierStageFactory, target, definitions) {
  const languageId = target.editor.document.languageId;
  return definitions.findIndex(({ scope }) => {
    if (scope == null) {
      return true;
    }
    const { langIds, scopeTypes, excludeDescendantScopeTypes } = scope;
    if (langIds != null && !langIds.includes(languageId)) {
      return false;
    }
    if (scopeTypes != null) {
      const allScopeTypes = scopeTypes.concat(
        excludeDescendantScopeTypes ?? []
      );
      let matchingTarget = void 0;
      let matchingScopeType = void 0;
      for (const scopeTypeType of allScopeTypes) {
        try {
          let containingTarget = modifierStageFactory.create({
            type: "containingScope",
            scopeType: { type: scopeTypeType }
          }).run(target)[0];
          if (target.contentRange.isRangeEqual(containingTarget.contentRange)) {
            containingTarget = modifierStageFactory.create({
              type: "containingScope",
              scopeType: { type: scopeTypeType },
              ancestorIndex: 1
            }).run(target)[0];
          }
          if (matchingTarget == null || matchingTarget.contentRange.contains(containingTarget.contentRange)) {
            matchingTarget = containingTarget;
            matchingScopeType = scopeTypeType;
          }
        } catch (_e) {
          continue;
        }
      }
      if (matchingScopeType == null) {
        return false;
      }
      return matchingTarget != null && !(excludeDescendantScopeTypes ?? []).includes(matchingScopeType);
    }
    return true;
  });
}

// ../cursorless-engine/src/actions/InsertSnippet.ts
var InsertSnippet = class {
  constructor(rangeUpdater, snippets, actions, modifierStageFactory) {
    this.rangeUpdater = rangeUpdater;
    this.snippets = snippets;
    this.actions = actions;
    this.modifierStageFactory = modifierStageFactory;
    this.snippetParser = new SnippetParser();
    this.run = this.run.bind(this);
  }
  getFinalStages(snippetDescription) {
    const defaultScopeTypes = this.getScopeTypes(snippetDescription);
    return defaultScopeTypes.length === 0 ? [] : [
      new ModifyIfUntypedExplicitStage(this.modifierStageFactory, {
        type: "cascading",
        modifiers: defaultScopeTypes.map((scopeType) => ({
          type: "containingScope",
          scopeType
        }))
      })
    ];
  }
  getScopeTypes(snippetDescription) {
    if (snippetDescription.type === "named") {
      const { name } = snippetDescription;
      const snippet2 = this.snippets.getSnippetStrict(name);
      const scopeTypeTypes = snippet2.insertionScopeTypes;
      return scopeTypeTypes == null ? [] : scopeTypeTypes.map((scopeTypeType) => ({
        type: scopeTypeType
      }));
    } else {
      return snippetDescription.scopeTypes ?? [];
    }
  }
  getSnippetInfo(snippetDescription, targets) {
    if (snippetDescription.type === "named") {
      const { name } = snippetDescription;
      const snippet2 = this.snippets.getSnippetStrict(name);
      const definition = findMatchingSnippetDefinitionStrict(
        this.modifierStageFactory,
        targets,
        snippet2.definitions
      );
      return {
        body: definition.body.join("\n"),
        formatSubstitutions(substitutions) {
          return substitutions == null ? void 0 : formatSubstitutions(snippet2, definition, substitutions);
        }
      };
    } else {
      return {
        body: snippetDescription.body,
        formatSubstitutions(substitutions) {
          return substitutions;
        }
      };
    }
  }
  async run(destinations, snippetDescription) {
    const editor = ide().getEditableTextEditor(
      ensureSingleEditor2(destinations)
    );
    await this.actions.editNew.run(destinations);
    const { body, formatSubstitutions: formatSubstitutions2 } = this.getSnippetInfo(
      snippetDescription,
      // Use new selection locations instead of original targets because
      // that's where we'll be doing the snippet insertion
      editor.selections.map(
        (selection) => new UntypedTarget({
          editor,
          contentRange: selection,
          isReversed: false,
          hasExplicitRange: true
        })
      )
    );
    const parsedSnippet = this.snippetParser.parse(body);
    transformSnippetVariables(
      parsedSnippet,
      null,
      formatSubstitutions2(snippetDescription.substitutions)
    );
    const snippetString = parsedSnippet.toTextmateString();
    const { editorSelections: updatedThatSelections } = await performEditsAndUpdateSelections({
      rangeUpdater: this.rangeUpdater,
      editor,
      callback: () => editor.insertSnippet(snippetString),
      preserveCursorSelections: true,
      selections: {
        editorSelections: {
          selections: editor.selections,
          behavior: 0 /* openOpen */
        }
      }
    });
    return {
      thatSelections: updatedThatSelections.map((selection) => ({
        editor,
        selection
      }))
    };
  }
};
function formatSubstitutions(snippet2, definition, substitutions) {
  return Object.fromEntries(
    Object.entries(substitutions).map(([variableName, value]) => {
      const formatterName = (definition.variables ?? {})[variableName]?.formatter ?? (snippet2.variables ?? {})[variableName]?.formatter;
      if (formatterName == null) {
        return [variableName, value];
      }
      const formatter = textFormatters[formatterName];
      if (formatter == null) {
        throw new Error(
          `Couldn't find formatter ${formatterName} for variable ${variableName}`
        );
      }
      return [variableName, formatter(value.split(" "))];
    })
  );
}

// ../cursorless-engine/src/actions/JoinLines.ts
var JoinLines = class {
  constructor(rangeUpdater, modifierStageFactory) {
    this.rangeUpdater = rangeUpdater;
    this.modifierStageFactory = modifierStageFactory;
    this.run = this.run.bind(this);
  }
  getFinalStages() {
    return [this.modifierStageFactory.create(containingLineIfUntypedModifier)];
  }
  async run(targets) {
    await flashTargets(
      ide(),
      targets.map(({ thatTarget }) => thatTarget),
      "pendingModification0" /* pendingModification0 */
    );
    const thatSelections = flatten_default(
      await runOnTargetsForEachEditor(targets, async (editor, targets2) => {
        const { thatRanges: updatedThatRanges } = await performEditsAndUpdateSelections({
          rangeUpdater: this.rangeUpdater,
          editor: ide().getEditableTextEditor(editor),
          edits: getEdits2(editor, targets2),
          selections: {
            thatRanges: targets2.map(({ contentRange }) => contentRange)
          }
        });
        return zipStrict(targets2, updatedThatRanges).map(([target, range3]) => ({
          editor,
          selection: range3.toSelection(target.isReversed)
        }));
      })
    );
    return { thatSelections };
  }
};
function getEdits2(editor, targets) {
  const edits = [];
  for (const target of targets) {
    const targetsEdits = target.joinAs === "line" ? getLineTargetEdits(target) : getTokenTargetEdits(target);
    edits.push(...targetsEdits);
  }
  return edits;
}
function getTokenTargetEdits(target) {
  const { editor, contentRange } = target;
  const regex = getMatcher(editor.document.languageId).tokenMatcher;
  const matches = generateMatchesInRange(
    regex,
    editor,
    contentRange,
    "forward"
  );
  return Array.from(pairwise(matches)).map(
    ([range1, range22]) => ({
      range: new Range(range1.end, range22.start),
      text: "",
      isReplace: true
    })
  );
}
function getLineTargetEdits(target) {
  const { document } = target.editor;
  const range3 = target.contentRange;
  const startLine = range3.start.line;
  const endLine = range3.isSingleLine ? Math.min(startLine + 1, document.lineCount - 1) : range3.end.line;
  const lines = map2(
    range2(startLine, endLine + 1),
    (i) => document.lineAt(i)
  );
  return Array.from(pairwise(lines)).map(
    ([line1, line2]) => ({
      range: new Range(
        line1.rangeTrimmed?.end ?? line1.range.end,
        line2.rangeTrimmed?.start ?? line2.range.start
      ),
      text: line2.isEmptyOrWhitespace ? "" : " ",
      isReplace: true
    })
  );
}

// ../cursorless-engine/src/actions/PasteFromClipboardUsingCommand.ts
var PasteFromClipboardUsingCommand = class {
  constructor(rangeUpdater, actions) {
    this.rangeUpdater = rangeUpdater;
    this.actions = actions;
    this.run = this.run.bind(this);
  }
  async run(destinations) {
    const editor = ide().getEditableTextEditor(
      ensureSingleEditor2(destinations)
    );
    const originalEditor = ide().activeEditableTextEditor;
    const callbackEdit = async () => {
      await this.actions.editNew.run(destinations);
    };
    const { cursorSelections: originalCursorSelections } = await performEditsAndUpdateSelections({
      rangeUpdater: this.rangeUpdater,
      editor,
      preserveCursorSelections: true,
      callback: callbackEdit,
      selections: {
        cursorSelections: editor.selections
      }
    });
    const {
      originalCursorSelections: updatedCursorSelections,
      editorSelections: updatedTargetSelections
    } = await performEditsAndUpdateSelections({
      rangeUpdater: this.rangeUpdater,
      editor,
      callback: () => editor.clipboardPaste(),
      selections: {
        originalCursorSelections,
        editorSelections: {
          selections: editor.selections,
          behavior: 0 /* openOpen */
        }
      }
    });
    await editor.setSelections(updatedCursorSelections);
    if (originalEditor != null && !originalEditor.isActive) {
      await originalEditor.focus();
    }
    await ide().flashRanges(
      updatedTargetSelections.map((selection) => ({
        editor,
        range: toCharacterRange(selection),
        style: "justAdded" /* justAdded */
      }))
    );
    return {
      thatSelections: updatedTargetSelections.map((selection) => ({
        editor,
        selection
      }))
    };
  }
};

// ../cursorless-engine/src/actions/PasteFromClipboardDirectly.ts
var PasteFromClipboardDirectly = class {
  constructor(rangeUpdater) {
    this.rangeUpdater = rangeUpdater;
    this.runForEditor = this.runForEditor.bind(this);
  }
  async run(destinations) {
    const text = await ide().clipboard.readText();
    const textLines = text.split(/\r?\n/g);
    const destinationsWithText = destinations.length === textLines.length ? zipStrict(destinations, textLines).map(([destination, text2]) => ({
      destination,
      text: text2
    })) : destinations.map((destination) => ({ destination, text }));
    const thatSelections = flatten_default(
      await runForEachEditor(
        destinationsWithText,
        ({ destination }) => destination.editor,
        this.runForEditor
      )
    );
    return { thatSelections };
  }
  async runForEditor(editor, destinationsWithText) {
    const edits = destinationsWithText.map(
      ({ destination, text }) => destination.constructChangeEdit(text)
    );
    const { editSelections: updatedEditSelections } = await performEditsAndUpdateSelections({
      rangeUpdater: this.rangeUpdater,
      editor: ide().getEditableTextEditor(editor),
      edits,
      selections: {
        editSelections: {
          selections: edits.map(({ range: range3 }) => range3),
          behavior: 0 /* openOpen */
        }
      }
    });
    const thatTargetSelections = zipStrict(edits, updatedEditSelections).map(
      ([edit, selection]) => edit.updateRange(selection).toSelection(selection.isReversed)
    );
    await ide().flashRanges(
      thatTargetSelections.map((selection) => ({
        editor,
        range: toCharacterRange(selection),
        style: "justAdded" /* justAdded */
      }))
    );
    return thatTargetSelections.map((selection) => ({
      editor,
      selection
    }));
  }
};

// ../cursorless-engine/src/actions/PasteFromClipboard.ts
var PasteFromClipboard = class {
  constructor(rangeUpdater, actions) {
    this.run = this.run.bind(this);
    this.runner = ide().capabilities.commands.clipboardPaste != null ? new PasteFromClipboardUsingCommand(rangeUpdater, actions) : new PasteFromClipboardDirectly(rangeUpdater);
  }
  run(destinations) {
    return this.runner.run(destinations);
  }
};

// ../cursorless-engine/src/actions/Remove.ts
var Delete = class {
  constructor(rangeUpdater) {
    this.rangeUpdater = rangeUpdater;
    this.run = this.run.bind(this);
    this.runForEditor = this.runForEditor.bind(this);
  }
  async run(targets, { showDecorations = true } = {}) {
    targets = unifyRemovalTargets(targets);
    if (showDecorations) {
      await flashTargets(
        ide(),
        targets,
        "pendingDelete" /* pendingDelete */,
        (target) => target.getRemovalHighlightRange()
      );
    }
    const thatTargets = flatten_default(
      await runOnTargetsForEachEditor(targets, this.runForEditor)
    );
    return { thatTargets };
  }
  async runForEditor(editor, targets) {
    const edits = targets.map((target) => target.constructRemovalEdit());
    const editableEditor = ide().getEditableTextEditor(editor);
    const { editRanges: updatedEditRanges } = await performEditsAndUpdateSelections({
      rangeUpdater: this.rangeUpdater,
      editor: editableEditor,
      edits,
      selections: {
        editRanges: edits.map(({ range: range3 }) => range3)
      }
    });
    return zip_default(targets, updatedEditRanges).map(
      ([target, range3]) => new RawSelectionTarget({
        editor: target.editor,
        isReversed: target.isReversed,
        contentRange: range3
      })
    );
  }
};

// ../cursorless-engine/src/actions/Replace.ts
var Replace = class {
  constructor(rangeUpdater) {
    this.rangeUpdater = rangeUpdater;
    this.run = this.run.bind(this);
  }
  getTexts(destinations, replaceWith) {
    if (Array.isArray(replaceWith)) {
      if (replaceWith.length === 1) {
        return Array(destinations.length).fill(replaceWith[0]);
      }
      return replaceWith;
    }
    const numbers2 = [];
    for (let i = 0; i < destinations.length; ++i) {
      numbers2[i] = (replaceWith.start + i).toString();
    }
    return numbers2;
  }
  async run(destinations, replaceWith) {
    await flashTargets(
      ide(),
      destinations.map((d) => d.target),
      "pendingModification0" /* pendingModification0 */
    );
    const texts = this.getTexts(destinations, replaceWith);
    if (destinations.length !== texts.length) {
      throw new Error("Targets and texts must have same length");
    }
    const edits = zip_default(destinations, texts).map(([destination, text]) => ({
      editor: destination.editor,
      target: destination.target,
      edit: destination.constructChangeEdit(text)
    }));
    const sourceTargets = [];
    const thatSelections = [];
    await runForEachEditor(
      edits,
      (edit) => edit.editor,
      async (editor, editWrappers) => {
        const edits2 = editWrappers.map(({ edit }) => edit);
        const {
          contentSelections: updatedContentSelections,
          editRanges: updatedEditRanges
        } = await performEditsAndUpdateSelections({
          rangeUpdater: this.rangeUpdater,
          editor: ide().getEditableTextEditor(editor),
          edits: edits2,
          selections: {
            contentSelections: editWrappers.map(
              ({ target }) => target.contentSelection
            ),
            editRanges: {
              selections: edits2.map(({ range: range3 }) => range3),
              behavior: 0 /* openOpen */
            }
          }
        });
        for (const [wrapper, selection] of zip_default(
          editWrappers,
          updatedContentSelections
        )) {
          sourceTargets.push(wrapper.target.withContentRange(selection));
        }
        for (const [wrapper, range3] of zip_default(editWrappers, updatedEditRanges)) {
          thatSelections.push({
            editor,
            selection: wrapper.edit.updateRange(range3).toSelection(false)
          });
        }
      }
    );
    return { sourceTargets, thatSelections };
  }
};

// ../cursorless-engine/src/actions/Rewrap.ts
var Rewrap = class {
  constructor(rangeUpdater, modifierStageFactory) {
    this.rangeUpdater = rangeUpdater;
    this.modifierStageFactory = modifierStageFactory;
    this.getFinalStages = () => [
      getContainingSurroundingPairIfNoBoundaryStage(this.modifierStageFactory)
    ];
    this.run = this.run.bind(this);
  }
  async run(targets, left, right) {
    const boundaryTargets = targets.flatMap((target) => {
      const boundary = target.getBoundary();
      if (boundary.length !== 2) {
        throw Error("Target must have an opening and closing delimiter");
      }
      return boundary;
    });
    await flashTargets(ide(), boundaryTargets, "pendingModification0" /* pendingModification0 */);
    const results = await runOnTargetsForEachEditor(
      boundaryTargets,
      async (editor, boundaryTargets2) => {
        const edits = boundaryTargets2.map((target, i) => ({
          editor,
          range: target.contentRange,
          text: i % 2 === 0 ? left : right
        }));
        const {
          sourceRanges: updatedSourceRanges,
          thatRanges: updatedThatRanges
        } = await performEditsAndUpdateSelections({
          rangeUpdater: this.rangeUpdater,
          editor: ide().getEditableTextEditor(editor),
          edits,
          selections: {
            sourceRanges: targets.map(
              (target) => target.thatTarget.contentRange
            ),
            thatRanges: targets.map((target) => target.contentRange)
          }
        });
        return {
          sourceMark: createThatMark(targets, updatedSourceRanges),
          thatMark: createThatMark(targets, updatedThatRanges)
        };
      }
    );
    return {
      sourceSelections: results.flatMap(({ sourceMark }) => sourceMark),
      thatSelections: results.flatMap(({ thatMark }) => thatMark)
    };
  }
};

// ../cursorless-engine/src/actions/Scroll.ts
var Scroll = class {
  constructor(at) {
    this.at = at;
    this.run = this.run.bind(this);
  }
  async run(targets) {
    const selectionGroups = groupBy2(targets, (t) => t.editor);
    const lines = Array.from(selectionGroups, ([editor, targets2]) => {
      return { lineNumber: getLineNumber(targets2, this.at), editor };
    });
    const originalEditor = ide().activeEditableTextEditor;
    for (const lineWithEditor of lines) {
      await ide().getEditableTextEditor(lineWithEditor.editor).revealLine(lineWithEditor.lineNumber, this.at);
    }
    if (originalEditor != null && !originalEditor.isActive) {
      await originalEditor.focus();
    }
    const decorationTargets = targets.filter((target) => {
      const visibleRanges = target.editor.visibleRanges;
      const startLine = visibleRanges[0].start.line;
      const endLine = visibleRanges[visibleRanges.length - 1].end.line;
      return target.contentRange.start.line > startLine || target.contentRange.end.line < endLine || target.contentRange.start.line === startLine && target.contentRange.end.line === endLine;
    });
    await ide().flashRanges(
      decorationTargets.map((target) => ({
        editor: target.editor,
        range: toLineRange(target.contentRange),
        style: "referenced" /* referenced */
      }))
    );
    return {
      thatTargets: targets
    };
  }
};
var ScrollToTop = class extends Scroll {
  constructor() {
    super("top" /* top */);
  }
};
var ScrollToCenter = class extends Scroll {
  constructor() {
    super("center" /* center */);
  }
};
var ScrollToBottom = class extends Scroll {
  constructor() {
    super("bottom" /* bottom */);
  }
};
function getLineNumber(targets, at) {
  let startLine = Number.MAX_SAFE_INTEGER;
  let endLine = 0;
  targets.forEach((target) => {
    startLine = Math.min(startLine, target.contentRange.start.line);
    endLine = Math.max(endLine, target.contentRange.end.line);
  });
  if (at === "top" /* top */) {
    return startLine;
  }
  if (at === "bottom" /* bottom */) {
    return endLine;
  }
  return Math.floor((startLine + endLine) / 2);
}

// ../cursorless-engine/src/actions/SetSelection.ts
var SetSelection = class {
  constructor() {
    this.run = this.run.bind(this);
  }
  getSelection(target) {
    return target.contentSelection;
  }
  async run(targets) {
    const editor = ensureSingleEditor2(targets);
    const selections = targets.map(this.getSelection);
    await ide().getEditableTextEditor(editor).setSelections(selections, { focusEditor: true });
    return {
      thatTargets: targets
    };
  }
};
var SetSelectionBefore = class extends SetSelection {
  getSelection(target) {
    return new Selection(target.contentRange.start, target.contentRange.start);
  }
};
var SetSelectionAfter = class extends SetSelection {
  getSelection(target) {
    return new Selection(target.contentRange.end, target.contentRange.end);
  }
};

// ../cursorless-engine/src/actions/SetSpecialTarget.ts
var SetSpecialTarget = class {
  constructor(key) {
    this.key = key;
    this.noAutomaticTokenExpansion = true;
    this.run = this.run.bind(this);
  }
  async run(targets) {
    return {
      thatTargets: targets,
      [`${this.key}Targets`]: targets
    };
  }
};

// ../cursorless-engine/src/actions/ShowParseTree.ts
var ShowParseTree = class {
  constructor(treeSitter) {
    this.treeSitter = treeSitter;
    this.run = this.run.bind(this);
  }
  async run(targets) {
    await flashTargets(ide(), targets, "referenced" /* referenced */);
    const results = ["# Cursorless parse tree"];
    for (const target of targets) {
      const { editor, contentRange } = target;
      const tree = this.treeSitter.getTree(editor.document);
      results.push(parseTree(editor.document, tree, contentRange));
    }
    void ide().openUntitledTextDocument({
      language: "markdown",
      content: results.join("\n\n")
    });
    return { thatTargets: targets };
  }
};
function parseTree(document, tree, contentRange) {
  const resultPlayground = [];
  const resultQuery = [];
  parseCursor(resultPlayground, resultQuery, contentRange, tree.walk(), 0);
  return [
    `## ${document.filename} [${contentRange}]
`,
    `\`\`\`${document.languageId}`,
    document.getText(contentRange),
    "```",
    "",
    "```scm",
    ...resultQuery,
    "```",
    "",
    "```js",
    ...resultPlayground,
    "```",
    ""
  ].join("\n");
}
function parseCursor(resultPlayground, resultQuery, contentRange, cursor, numIndents) {
  while (true) {
    const nodeRange = new Range(
      cursor.startPosition.row,
      cursor.startPosition.column,
      cursor.endPosition.row,
      cursor.endPosition.column
    );
    if (contentRange.intersection(nodeRange) != null) {
      const indentation = "  ".repeat(numIndents);
      const fieldName = getFieldName(cursor);
      const prefix = indentation + fieldName;
      if (cursor.nodeIsNamed) {
        resultPlayground.push(`${prefix}${cursor.nodeType} [${nodeRange}]`);
        resultQuery.push(`${prefix}(${cursor.nodeType}`);
        if (cursor.gotoFirstChild()) {
          parseCursor(
            resultPlayground,
            resultQuery,
            contentRange,
            cursor,
            numIndents + 1
          );
          cursor.gotoParent();
          resultQuery.push(`${indentation})`);
        } else {
          resultQuery[resultQuery.length - 1] += ")";
        }
      } else {
        const type2 = `"${cursor.nodeType}"`;
        resultPlayground.push(`${prefix}${type2} [${nodeRange}]`);
        resultQuery.push(`${prefix}${type2}`);
      }
    }
    if (!cursor.gotoNextSibling()) {
      return;
    }
  }
}
function getFieldName(cursor) {
  const field = cursor.currentFieldName;
  return field != null ? `${field}: ` : "";
}

// ../cursorless-engine/src/actions/IndentLine.ts
var IndentLineBase = class {
  constructor(rangeUpdater, isIndent) {
    this.rangeUpdater = rangeUpdater;
    this.isIndent = isIndent;
    this.run = this.run.bind(this);
    this.runForEditor = this.runForEditor.bind(this);
  }
  async run(targets) {
    if (this.hasCapability()) {
      return this.runSimpleCommandAction(targets);
    }
    await flashTargets(ide(), targets, "pendingModification0" /* pendingModification0 */);
    const thatTargets = flatten_default(
      await runOnTargetsForEachEditor(targets, this.runForEditor)
    );
    return { thatTargets };
  }
  hasCapability() {
    return this.isIndent ? ide().capabilities.commands.indentLine != null : ide().capabilities.commands.outdentLine != null;
  }
  runSimpleCommandAction(targets) {
    const action = this.isIndent ? new IndentLineSimpleAction(this.rangeUpdater) : new OutdentLineSimpleAction(this.rangeUpdater);
    return action.run(targets);
  }
  async runForEditor(editor, targets) {
    const edits = this.isIndent ? getIndentEdits(editor, targets) : getOutdentEdits(editor, targets);
    const { targetSelections: updatedTargetSelections } = await performEditsAndUpdateSelections({
      rangeUpdater: this.rangeUpdater,
      editor: ide().getEditableTextEditor(editor),
      edits,
      selections: {
        targetSelections: targets.map(
          ({ contentSelection }) => contentSelection
        )
      }
    });
    return zip_default(targets, updatedTargetSelections).map(
      ([target, range3]) => selectionToStoredTarget({
        editor,
        selection: range3.toSelection(target.isReversed)
      })
    );
  }
};
var IndentLine = class extends IndentLineBase {
  constructor(rangeUpdater) {
    super(rangeUpdater, true);
  }
};
var OutdentLine = class extends IndentLineBase {
  constructor(rangeUpdater) {
    super(rangeUpdater, false);
  }
};
function getIndentEdits(editor, targets) {
  const { document } = editor;
  const lineNumbers = getLineNumbers(targets);
  const indent = getIndent(editor);
  return lineNumbers.map((lineNumber) => {
    const line = document.lineAt(lineNumber);
    return {
      range: line.range.start.toEmptyRange(),
      text: indent
    };
  });
}
function getOutdentEdits(editor, targets) {
  const { document } = editor;
  const lineNumbers = getLineNumbers(targets);
  const regex = getRegex(editor);
  return lineNumbers.map((lineNumber) => {
    const line = document.lineAt(lineNumber);
    const match = line.text.match(regex);
    const { start } = line.range;
    const end = start.translate(void 0, match?.[0].length);
    return {
      range: new Range(start, end),
      text: ""
    };
  });
}
function getLineNumbers(targets) {
  const lineNumbers = /* @__PURE__ */ new Set();
  for (const target of targets) {
    const { start, end } = target.contentRange;
    for (let i = start.line; i <= end.line; ++i) {
      lineNumbers.add(i);
    }
  }
  return [...lineNumbers];
}
function getIndent(editor) {
  if (editor.options.insertSpaces) {
    const tabSize = getTabSize(editor);
    return " ".repeat(tabSize);
  }
  return "	";
}
function getRegex(editor) {
  if (editor.options.insertSpaces) {
    const tabSize = getTabSize(editor);
    return new RegExp(`^[ ]{1,${tabSize}}`);
  }
  return /^\t/;
}
function getTabSize(editor) {
  return typeof editor.options.tabSize === "number" ? editor.options.tabSize : 4;
}

// ../cursorless-engine/src/actions/Sort.ts
var SortBase = class {
  constructor(actions) {
    this.actions = actions;
    this.run = this.run.bind(this);
  }
  async run(targets) {
    if (targets.length < 2) {
      void showWarning(
        ide().messages,
        "tooFewTargets",
        'This action works on multiple targets, e.g. "sort every line block" instead of "sort block".'
      );
    }
    const sortedTargets = targets.slice().sort((a, b) => a.contentRange.start.compareTo(b.contentRange.start));
    const { returnValue: unsortedTexts } = await this.actions.getText.run(
      sortedTargets,
      {
        showDecorations: false
      }
    );
    const sortedTexts = this.sortTexts(unsortedTexts);
    const { thatSelections } = await this.actions.replace.run(
      sortedTargets.map((target) => target.toDestination("to")),
      sortedTexts
    );
    return { thatSelections };
  }
};
var Sort = class extends SortBase {
  sortTexts(texts) {
    return texts.sort(
      (a, b) => a.localeCompare(b, void 0, {
        numeric: true,
        caseFirst: "upper"
      })
    );
  }
};
var Reverse = class extends SortBase {
  sortTexts(texts) {
    return texts.reverse();
  }
};
var Random = class extends SortBase {
  sortTexts(texts) {
    return shuffle_default(texts);
  }
};

// ../cursorless-engine/src/actions/ToggleBreakpoint.ts
var ToggleBreakpoint = class {
  constructor(modifierStageFactory) {
    this.modifierStageFactory = modifierStageFactory;
    this.getFinalStages = () => [
      this.modifierStageFactory.create(containingLineIfUntypedModifier)
    ];
    this.run = this.run.bind(this);
  }
  async run(targets) {
    const thatTargets = targets.map(({ thatTarget }) => thatTarget);
    await flashTargets(ide(), thatTargets, "referenced" /* referenced */);
    await runOnTargetsForEachEditor(targets, async (editor, targets2) => {
      const breakpointDescriptors = targets2.map(
        (target) => {
          const range3 = target.contentRange;
          return target.isLine ? {
            type: "line",
            startLine: range3.start.line,
            endLine: range3.end.line
          } : {
            type: "inline",
            range: range3
          };
        }
      );
      await ide().getEditableTextEditor(editor).toggleBreakpoint(breakpointDescriptors);
    });
    return {
      thatTargets: targets
    };
  }
};

// ../cursorless-engine/src/actions/Wrap.ts
var Wrap = class {
  constructor(rangeUpdater) {
    this.rangeUpdater = rangeUpdater;
    this.run = this.run.bind(this);
  }
  async run(targets, left, right) {
    const results = await runOnTargetsForEachEditor(
      targets,
      async (editor, targets2) => {
        const boundaries = targets2.map((target) => ({
          start: new Selection(
            target.contentRange.start,
            target.contentRange.start
          ),
          end: new Selection(target.contentRange.end, target.contentRange.end)
        }));
        const edits = boundaries.flatMap(({ start, end }) => [
          {
            text: left,
            range: start
          },
          {
            text: right,
            range: end,
            isReplace: true
          }
        ]);
        const contentSelections = targets2.map(
          (target) => target.contentSelection
        );
        const {
          boundariesStartSelections: delimiterStartSelections,
          boundariesEndSelections: delimiterEndSelections,
          sourceSelections: sourceMarkSelections,
          thatSelections: thatMarkSelections
        } = await performEditsAndUpdateSelections({
          rangeUpdater: this.rangeUpdater,
          editor: ide().getEditableTextEditor(editor),
          edits,
          selections: {
            boundariesStartSelections: {
              selections: boundaries.map(({ start }) => start),
              behavior: 2 /* openClosed */
            },
            boundariesEndSelections: {
              selections: boundaries.map(({ end }) => end),
              behavior: 3 /* closedOpen */
            },
            sourceSelections: {
              selections: contentSelections,
              behavior: 1 /* closedClosed */
            },
            thatSelections: {
              selections: contentSelections,
              behavior: 0 /* openOpen */
            }
          }
        });
        const delimiterSelections = [
          ...delimiterStartSelections,
          ...delimiterEndSelections
        ];
        await ide().flashRanges(
          delimiterSelections.map((selection) => ({
            editor,
            range: toCharacterRange(selection),
            style: "justAdded" /* justAdded */
          }))
        );
        return {
          sourceMark: sourceMarkSelections.map((selection) => ({
            editor,
            selection
          })),
          thatMark: thatMarkSelections.map((selection) => ({
            editor,
            selection
          }))
        };
      }
    );
    return {
      sourceSelections: results.flatMap(({ sourceMark }) => sourceMark),
      thatSelections: results.flatMap(({ thatMark }) => thatMark)
    };
  }
};

// ../cursorless-engine/src/actions/WrapWithSnippet.ts
var WrapWithSnippet = class {
  constructor(rangeUpdater, snippets, modifierStageFactory) {
    this.rangeUpdater = rangeUpdater;
    this.snippets = snippets;
    this.modifierStageFactory = modifierStageFactory;
    this.snippetParser = new SnippetParser();
    this.run = this.run.bind(this);
  }
  getFinalStages(snippet2) {
    const defaultScopeType = this.getScopeType(snippet2);
    if (defaultScopeType == null) {
      return [];
    }
    return [
      new ModifyIfUntypedStage(this.modifierStageFactory, {
        type: "modifyIfUntyped",
        modifier: {
          type: "containingScope",
          scopeType: defaultScopeType
        }
      })
    ];
  }
  getScopeType(snippetDescription) {
    if (snippetDescription.type === "named") {
      const { name, variableName } = snippetDescription;
      const snippet2 = this.snippets.getSnippetStrict(name);
      const variables = snippet2.variables ?? {};
      const scopeTypeType = variables[variableName]?.wrapperScopeType;
      return scopeTypeType == null ? void 0 : {
        type: scopeTypeType
      };
    } else {
      return snippetDescription.scopeType;
    }
  }
  getBody(snippetDescription, targets) {
    if (snippetDescription.type === "named") {
      const { name } = snippetDescription;
      const snippet2 = this.snippets.getSnippetStrict(name);
      const definition = findMatchingSnippetDefinitionStrict(
        this.modifierStageFactory,
        targets,
        snippet2.definitions
      );
      return definition.body.join("\n");
    } else {
      return snippetDescription.body;
    }
  }
  async run(targets, snippetDescription) {
    const editor = ide().getEditableTextEditor(ensureSingleEditor2(targets));
    const body = this.getBody(snippetDescription, targets);
    const parsedSnippet = this.snippetParser.parse(body);
    transformSnippetVariables(parsedSnippet, snippetDescription.variableName);
    const snippetString = parsedSnippet.toTextmateString();
    await flashTargets(ide(), targets, "pendingModification0" /* pendingModification0 */);
    const targetSelections = targets.map((target) => target.contentSelection);
    const callback2 = () => editor.insertSnippet(snippetString, targetSelections);
    const { targetSelections: updatedTargetSelections } = await performEditsAndUpdateSelections({
      rangeUpdater: this.rangeUpdater,
      editor,
      callback: callback2,
      preserveCursorSelections: true,
      selections: {
        targetSelections
      }
    });
    return {
      thatSelections: updatedTargetSelections.map((selection) => ({
        editor,
        selection
      }))
    };
  }
};

// ../cursorless-engine/src/actions/incrementDecrement.ts
var REGEX = /-?\d+(\.\d+)?/g;
var IncrementDecrement = class {
  constructor(actions, isIncrement) {
    this.actions = actions;
    this.isIncrement = isIncrement;
    this.run = this.run.bind(this);
  }
  async run(targets) {
    const thatSelections = [];
    await runForEachEditor(
      targets,
      (target) => target.editor,
      async (editor, targets2) => {
        const selections = await this.runOnEditor(editor, targets2);
        thatSelections.push(...selections);
      }
    );
    return { thatSelections };
  }
  async runOnEditor(editor, targets) {
    const { document } = editor;
    const destinations = [];
    const replaceWith = [];
    for (const target of targets) {
      const offset = document.offsetAt(target.contentRange.start);
      const text = target.contentText;
      const matches = matchText(text, REGEX);
      for (const match of matches) {
        destinations.push(createDestination(editor, offset, match));
        replaceWith.push(updateNumber(this.isIncrement, match.text));
      }
    }
    const { thatSelections } = await this.actions.replace.run(
      destinations,
      replaceWith
    );
    return thatSelections;
  }
};
var Increment = class extends IncrementDecrement {
  constructor(actions) {
    super(actions, true);
  }
};
var Decrement = class extends IncrementDecrement {
  constructor(actions) {
    super(actions, false);
  }
};
function createDestination(editor, offset, match) {
  const target = new PlainTarget({
    editor,
    isReversed: false,
    contentRange: new Range(
      editor.document.positionAt(offset + match.index),
      editor.document.positionAt(offset + match.index + match.text.length)
    )
  });
  return target.toDestination("to");
}
function updateNumber(isIncrement, text) {
  return text.includes(".") ? updateFloat(isIncrement, text).toString() : updateInteger(isIncrement, text).toString();
}
function updateInteger(isIncrement, text) {
  const original = parseInt(text);
  const diff = 1;
  return original + (isIncrement ? diff : -diff);
}
function updateFloat(isIncrement, text) {
  const original = parseFloat(text);
  const isPercentage = Math.abs(original) <= 1;
  const diff = isPercentage ? 0.1 : 1;
  const updated = original + (isIncrement ? diff : -diff);
  return parseFloat(updated.toPrecision(15)) / 1;
}

// ../cursorless-engine/src/actions/Actions.ts
var Actions = class {
  constructor(treeSitter, snippets, rangeUpdater, modifierStageFactory) {
    this.treeSitter = treeSitter;
    this.snippets = snippets;
    this.rangeUpdater = rangeUpdater;
    this.modifierStageFactory = modifierStageFactory;
    this.callAsFunction = new Call(this);
    this.clearAndSetSelection = new Clear(this);
    this.copyToClipboard = new CopyToClipboard(this, this.rangeUpdater);
    this.cutToClipboard = new CutToClipboard(this);
    this.decrement = new Decrement(this);
    this.deselect = new Deselect();
    this.editNew = new EditNew(this.rangeUpdater, this);
    this.editNewLineAfter = new EditNewAfter(
      this,
      this.modifierStageFactory
    );
    this.editNewLineBefore = new EditNewBefore(
      this,
      this.modifierStageFactory
    );
    this.executeCommand = new ExecuteCommand(this.rangeUpdater);
    this.extractVariable = new ExtractVariable(this.rangeUpdater);
    this.findInDocument = new FindInDocument(this);
    this.findInWorkspace = new FindInWorkspace(this);
    this.foldRegion = new Fold(this.rangeUpdater);
    this.followLink = new FollowLink({ openAside: false });
    this.followLinkAside = new FollowLink({ openAside: true });
    this.generateSnippet = new GenerateSnippet(this.snippets);
    this.getText = new GetText();
    this.highlight = new Highlight();
    this.increment = new Increment(this);
    this.indentLine = new IndentLine(this.rangeUpdater);
    this.insertCopyAfter = new CopyContentAfter(
      this.rangeUpdater,
      this.modifierStageFactory
    );
    this.insertCopyBefore = new CopyContentBefore(
      this.rangeUpdater,
      this.modifierStageFactory
    );
    this.insertEmptyLineAfter = new InsertEmptyLineBelow(
      this.rangeUpdater,
      this.modifierStageFactory
    );
    this.insertEmptyLineBefore = new InsertEmptyLineAbove(
      this.rangeUpdater,
      this.modifierStageFactory
    );
    this.insertEmptyLinesAround = new InsertEmptyLinesAround(
      this.rangeUpdater,
      this.modifierStageFactory
    );
    this.insertSnippet = new InsertSnippet(
      this.rangeUpdater,
      this.snippets,
      this,
      this.modifierStageFactory
    );
    this.joinLines = new JoinLines(this.rangeUpdater, this.modifierStageFactory);
    this.breakLine = new BreakLine(this.rangeUpdater);
    this.moveToTarget = new Move(this.rangeUpdater);
    this.outdentLine = new OutdentLine(this.rangeUpdater);
    this.pasteFromClipboard = new PasteFromClipboard(this.rangeUpdater, this);
    this.randomizeTargets = new Random(this);
    this.remove = new Delete(this.rangeUpdater);
    this.rename = new Rename(this.rangeUpdater);
    this.replace = new Replace(this.rangeUpdater);
    this.replaceWithTarget = new Bring(this.rangeUpdater);
    this.revealDefinition = new RevealDefinition(this.rangeUpdater);
    this.revealTypeDefinition = new RevealTypeDefinition(this.rangeUpdater);
    this.reverseTargets = new Reverse(this);
    this.rewrapWithPairedDelimiter = new Rewrap(
      this.rangeUpdater,
      this.modifierStageFactory
    );
    this.scrollToBottom = new ScrollToBottom();
    this.scrollToCenter = new ScrollToCenter();
    this.scrollToTop = new ScrollToTop();
    this["private.setKeyboardTarget"] = new SetSpecialTarget("keyboard");
    this["experimental.setInstanceReference"] = new SetSpecialTarget(
      "instanceReference"
    );
    this.setSelection = new SetSelection();
    this.setSelectionAfter = new SetSelectionAfter();
    this.setSelectionBefore = new SetSelectionBefore();
    this.showDebugHover = new ShowDebugHover(this.rangeUpdater);
    this.showHover = new ShowHover(this.rangeUpdater);
    this.showQuickFix = new ShowQuickFix(this.rangeUpdater);
    this.showReferences = new ShowReferences(this.rangeUpdater);
    this.sortTargets = new Sort(this);
    this.swapTargets = new Swap(this.rangeUpdater);
    this.toggleLineBreakpoint = new ToggleBreakpoint(this.modifierStageFactory);
    this.toggleLineComment = new ToggleLineComment(this.rangeUpdater);
    this.unfoldRegion = new Unfold(this.rangeUpdater);
    this.wrapWithPairedDelimiter = new Wrap(this.rangeUpdater);
    this.wrapWithSnippet = new WrapWithSnippet(
      this.rangeUpdater,
      this.snippets,
      this.modifierStageFactory
    );
    this["private.showParseTree"] = new ShowParseTree(this.treeSitter);
    this["private.getTargets"] = new GetTargets();
  }
};

// ../cursorless-engine/src/core/getCommandFallback.ts
async function getCommandFallback(commandServerApi, runAction, command) {
  const focusedElementType = await commandServerApi.getFocusedElementType();
  if (focusedElementType == null || focusedElementType === "textEditor") {
    return null;
  }
  const action = command.action;
  switch (action.name) {
    case "replace":
      return destinationIsSelection(action.destination) && Array.isArray(action.replaceWith) ? {
        action: "insert",
        modifiers: getModifiersFromDestination(action.destination),
        text: action.replaceWith.join("\n")
      } : null;
    case "replaceWithTarget":
      if (destinationIsSelection(action.destination)) {
        return {
          action: "insert",
          modifiers: getModifiersFromDestination(action.destination),
          text: await getText(runAction, action.source)
        };
      }
      return null;
    case "moveToTarget":
      if (destinationIsSelection(action.destination)) {
        const text = await getText(runAction, action.source);
        await remove(runAction, action.source);
        return {
          action: "insert",
          modifiers: getModifiersFromDestination(action.destination),
          text
        };
      }
      return null;
    case "callAsFunction":
      if (targetIsSelection(action.argument)) {
        return {
          action: action.name,
          modifiers: getModifiersFromTarget(action.argument),
          callee: await getText(runAction, action.callee)
        };
      }
      return null;
    case "wrapWithPairedDelimiter":
    case "rewrapWithPairedDelimiter":
      return targetIsSelection(action.target) ? {
        action: action.name,
        modifiers: getModifiersFromTarget(action.target),
        left: action.left,
        right: action.right
      } : null;
    case "pasteFromClipboard":
      return destinationIsSelection(action.destination) ? {
        action: action.name,
        modifiers: getModifiersFromDestination(action.destination)
      } : null;
    case "swapTargets":
    case "editNew":
    case "insertSnippet":
    case "generateSnippet":
    case "wrapWithSnippet":
    case "parsed":
      return null;
    default:
      return targetIsSelection(action.target) ? {
        action: action.name,
        modifiers: getModifiersFromTarget(action.target)
      } : null;
  }
}
function destinationIsSelection(destination) {
  if (destination.type === "implicit") {
    return true;
  }
  if (destination.type === "primitive") {
    return destination.insertionMode === "to" && targetIsSelection(destination.target);
  }
  return false;
}
function targetIsSelection(target) {
  if (target.type === "implicit") {
    return true;
  }
  if (target.type === "primitive") {
    return target.mark == null || target.mark.type === "cursor";
  }
  return false;
}
function getModifiersFromDestination(destination) {
  if (destination.type === "primitive") {
    return getModifiersFromTarget(destination.target);
  }
  return [];
}
function getModifiersFromTarget(target) {
  if (target.type === "primitive") {
    if (target.modifiers != null && target.modifiers.length > 0) {
      return target.modifiers;
    }
    if (target.mark?.type === "cursor") {
      return [{ type: "containingTokenIfEmpty" }];
    }
  }
  return [];
}
async function getText(runAction, target) {
  const response = await runAction({ name: "getText", target });
  const texts = response.returnValue;
  return texts.join("\n");
}
async function remove(runAction, target) {
  await runAction({ name: "remove", target });
}

// ../cursorless-engine/src/core/handleHoistedModifiers.ts
function handleHoistedModifiers(targetDescriptor, isAnchorMarkImplicit) {
  const { anchor, rangeType, active } = targetDescriptor;
  if (anchor.type !== "primitive" || rangeType !== "continuous") {
    return targetDescriptor;
  }
  const indexedModifiers = anchor.modifiers.map((v, i) => [v, i]);
  for (const [modifier, idx] of indexedModifiers.reverse()) {
    for (const hoistedModifierType of hoistedModifierTypes) {
      const acceptanceInfo = hoistedModifierType.accept(modifier);
      if (acceptanceInfo.accepted) {
        const [hoistedModifiers, unhoistedModifiers] = [
          anchor.modifiers.slice(0, idx + 1),
          anchor.modifiers.slice(idx + 1)
        ];
        let pipelineInputDescriptor = {
          ...targetDescriptor,
          anchor: (
            // If they say "every line past bat", the anchor is implicit, even though
            // it comes across the wire as a primitive target due to the "every line",
            // which we've now removed
            unhoistedModifiers.length === 0 && isAnchorMarkImplicit ? { type: "implicit" } : {
              type: "primitive",
              mark: anchor.mark,
              modifiers: unhoistedModifiers
            }
          ),
          // Remove the hoisted modifier (and everything before it) from the
          // active if it ended up there from inference
          active: produce(active, (draft) => {
            draft.modifiers = draft.modifiers.slice(
              findLastIndex_default(
                draft.modifiers,
                (modifier2) => hoistedModifierType.accept(modifier2).accepted
              ) + 1
            );
          })
        };
        pipelineInputDescriptor = acceptanceInfo.transformTarget?.(pipelineInputDescriptor) ?? pipelineInputDescriptor;
        return {
          type: "primitive",
          mark: {
            type: "target",
            target: pipelineInputDescriptor
          },
          modifiers: hoistedModifiers
        };
      }
    }
  }
  return targetDescriptor;
}
var hoistedModifierTypes = [
  // "every" ranges, eg "every line air past bat"
  {
    accept(modifier) {
      return modifier.type === "everyScope" && modifier.scopeType.type !== "instance" ? {
        accepted: true,
        transformTarget(target) {
          return {
            ...target,
            exclusionScopeType: modifier.scopeType
          };
        }
      } : { accepted: false };
    }
  },
  // "instance" modifiers treat the range as the instance to search for, eg
  // "every instance air past bat" searches for instances of the text of the
  // range "air past bat".
  {
    accept(modifier) {
      return {
        accepted: (modifier.type === "everyScope" || modifier.type === "relativeScope" || modifier.type === "ordinalScope") && modifier.scopeType.type === "instance"
      };
    }
  }
];

// ../cursorless-engine/src/core/inferFullTargetDescriptor.ts
function inferFullTargetDescriptor(target, previousTargets) {
  switch (target.type) {
    case "list":
      return inferListTarget(target, previousTargets);
    case "range":
      return inferRangeTargetWithHoist(target, previousTargets);
    case "primitive":
      return inferPrimitiveTarget(target, previousTargets);
    case "implicit":
      return target;
  }
}
function inferListTarget(target, previousTargets) {
  return {
    ...target,
    elements: target.elements.map((element, index) => {
      const elementPreviousTargets = previousTargets.concat(
        target.elements.slice(0, index)
      );
      switch (element.type) {
        case "range":
          return inferRangeTargetWithHoist(element, elementPreviousTargets);
        case "primitive":
          return inferPrimitiveTarget(element, elementPreviousTargets);
      }
    })
  };
}
function inferRangeTargetWithHoist(target, previousTargets) {
  const fullTarget = inferRangeTarget(target, previousTargets);
  const isAnchorMarkImplicit = target.anchor.type === "implicit" || target.anchor.mark == null;
  return handleHoistedModifiers(fullTarget, isAnchorMarkImplicit);
}
function inferRangeTarget(target, previousTargets) {
  return {
    type: "range",
    rangeType: target.rangeType ?? "continuous",
    excludeAnchor: target.excludeAnchor ?? false,
    excludeActive: target.excludeActive ?? false,
    anchor: target.anchor.type === "implicit" ? target.anchor : inferPrimitiveTarget(target.anchor, previousTargets),
    active: inferPrimitiveTarget(
      target.active,
      previousTargets.concat(target.anchor)
    )
  };
}
function inferPrimitiveTarget(target, previousTargets) {
  const mark = handleTargetMark(
    target.mark ?? (shouldInferPreviousMark(target) ? getPreviousMark(previousTargets) : null) ?? {
      type: "cursor"
    }
  );
  const modifiers = getPreservedModifiers(target) ?? getPreviousPreservedModifiers(previousTargets) ?? getPreviousLineNumberMarkModifiers(previousTargets) ?? [];
  return {
    type: target.type,
    mark,
    modifiers
  };
}
function shouldInferPreviousMark(target) {
  return target.modifiers?.some((m) => m.type === "inferPreviousMark") ?? false;
}
function getPreservedModifiers(target) {
  const preservedModifiers = target.modifiers?.filter(
    (modifier) => modifier.type !== "inferPreviousMark"
  ) ?? [];
  return preservedModifiers.length !== 0 ? preservedModifiers : void 0;
}
function getLineNumberMarkModifiers(target) {
  if (isLineNumberMark(target)) {
    return [
      {
        type: "containingScope",
        scopeType: {
          type: "line"
        }
      }
    ];
  }
  return void 0;
}
function isLineNumberMark(target) {
  const isLineNumber = (mark) => mark?.type === "lineNumber";
  if (isLineNumber(target.mark)) {
    return true;
  }
  if (target.mark?.type === "range") {
    return isLineNumber(target.mark.anchor) && isLineNumber(target.mark.active);
  }
  return false;
}
function getPreviousMark(previousTargets) {
  return getPreviousTargetAttribute(
    previousTargets,
    (target) => target.mark
  );
}
function getPreviousPreservedModifiers(previousTargets) {
  return getPreviousTargetAttribute(previousTargets, getPreservedModifiers);
}
function getPreviousLineNumberMarkModifiers(previousTargets) {
  return getPreviousTargetAttribute(
    previousTargets,
    getLineNumberMarkModifiers
  );
}
function getPreviousTargetAttribute(previousTargets, getAttribute) {
  for (let i = previousTargets.length - 1; i > -1; --i) {
    const target = previousTargets[i];
    switch (target.type) {
      case "primitive": {
        const attributeValue = getAttribute(target);
        if (attributeValue != null) {
          return attributeValue;
        }
        break;
      }
      case "range": {
        const attributeValue = getPreviousTargetAttribute(
          [target.anchor],
          getAttribute
        );
        if (attributeValue != null) {
          return attributeValue;
        }
        break;
      }
      case "list": {
        const attributeValue = getPreviousTargetAttribute(
          target.elements,
          getAttribute
        );
        if (attributeValue != null) {
          return attributeValue;
        }
        break;
      }
    }
  }
  return void 0;
}
function handleTargetMark(mark) {
  switch (mark.type) {
    case "range":
      return {
        ...mark,
        anchor: handleTargetMark(mark.anchor),
        active: handleTargetMark(mark.active)
      };
    case "target":
      return {
        type: "target",
        target: inferFullTargetDescriptor(mark.target, [])
      };
    default:
      return mark;
  }
}

// ../cursorless-engine/src/core/commandRunner/CommandRunnerImpl.ts
var CommandRunnerImpl = class {
  constructor(commandServerApi, debug, storedTargets, pipelineRunner, actions) {
    this.commandServerApi = commandServerApi;
    this.debug = debug;
    this.storedTargets = storedTargets;
    this.pipelineRunner = pipelineRunner;
    this.actions = actions;
    this.finalStages = [];
    this.runAction = this.runAction.bind(this);
    this.inferenceContext = new InferenceContext(this.debug);
  }
  /**
   * Runs a Cursorless command. We proceed as follows:
   *
   * 1. Perform inference on targets to fill in details left out using things
   *    like previous targets. For example we would automatically infer that
   *    `"take funk air and bat"` is equivalent to `"take funk air and funk
   *    bat"`. See {@link inferFullTargetDescriptors} for details of how this is done.
   * 2. Call {@link processTargets} to map each abstract {@link Target} object
   *    to a concrete list of {@link Target} objects.
   * 3. Run the requested action on the given selections. The mapping from
   *    action id (eg `remove`) to implementation is defined in {@link Actions}.
   *    To understand how actions work, see some examples, such as `"take"`
   *    {@link SetSelection} and `"chuck"` {@link Delete}. See
   * 4. Update `source` and `that` marks, if they have been returned from the
   *    action, and returns the desired return value indicated by the action, if
   *    it has one.
   */
  async run(command) {
    if (clientSupportsFallback(command)) {
      const fallback = await getCommandFallback(
        this.commandServerApi,
        this.runAction,
        command
      );
      if (fallback != null) {
        return { fallback };
      }
    }
    const {
      returnValue,
      thatSelections: newThatSelections,
      thatTargets: newThatTargets,
      sourceSelections: newSourceSelections,
      sourceTargets: newSourceTargets,
      instanceReferenceTargets: newInstanceReferenceTargets,
      keyboardTargets: newKeyboardTargets
    } = await this.runAction(command.action);
    this.storedTargets.set(
      "that",
      constructStoredTarget(newThatTargets, newThatSelections)
    );
    this.storedTargets.set(
      "source",
      constructStoredTarget(newSourceTargets, newSourceSelections)
    );
    this.storedTargets.set("instanceReference", newInstanceReferenceTargets);
    this.storedTargets.set("keyboard", newKeyboardTargets, { history: true });
    return { returnValue };
  }
  runAction(actionDescriptor) {
    this.inferenceContext.reset();
    this.finalStages = [];
    switch (actionDescriptor.name) {
      case "replaceWithTarget":
        return this.actions.replaceWithTarget.run(
          this.getTargets(actionDescriptor.source),
          this.getDestinations(actionDescriptor.destination)
        );
      case "moveToTarget":
        return this.actions.moveToTarget.run(
          this.getTargets(actionDescriptor.source),
          this.getDestinations(actionDescriptor.destination)
        );
      case "swapTargets":
        return this.actions.swapTargets.run(
          this.getTargets(actionDescriptor.target1),
          this.getTargets(actionDescriptor.target2)
        );
      case "callAsFunction":
        return this.actions.callAsFunction.run(
          this.getTargets(actionDescriptor.callee),
          this.getTargets(actionDescriptor.argument)
        );
      case "wrapWithPairedDelimiter":
        return this.actions.wrapWithPairedDelimiter.run(
          this.getTargets(actionDescriptor.target),
          actionDescriptor.left,
          actionDescriptor.right
        );
      case "rewrapWithPairedDelimiter":
        this.finalStages = this.actions.rewrapWithPairedDelimiter.getFinalStages();
        return this.actions.rewrapWithPairedDelimiter.run(
          this.getTargets(actionDescriptor.target),
          actionDescriptor.left,
          actionDescriptor.right
        );
      case "pasteFromClipboard":
        return this.actions.pasteFromClipboard.run(
          this.getDestinations(actionDescriptor.destination)
        );
      case "executeCommand":
        return this.actions.executeCommand.run(
          this.getTargets(actionDescriptor.target),
          actionDescriptor.commandId,
          actionDescriptor.options
        );
      case "replace":
        return this.actions.replace.run(
          this.getDestinations(actionDescriptor.destination),
          actionDescriptor.replaceWith
        );
      case "highlight":
        return this.actions.highlight.run(
          this.getTargets(actionDescriptor.target),
          actionDescriptor.highlightId
        );
      case "generateSnippet":
        return this.actions.generateSnippet.run(
          this.getTargets(actionDescriptor.target),
          actionDescriptor.snippetName
        );
      case "insertSnippet":
        this.finalStages = this.actions.insertSnippet.getFinalStages(
          actionDescriptor.snippetDescription
        );
        return this.actions.insertSnippet.run(
          this.getDestinations(actionDescriptor.destination),
          actionDescriptor.snippetDescription
        );
      case "wrapWithSnippet":
        this.finalStages = this.actions.wrapWithSnippet.getFinalStages(
          actionDescriptor.snippetDescription
        );
        return this.actions.wrapWithSnippet.run(
          this.getTargets(actionDescriptor.target),
          actionDescriptor.snippetDescription
        );
      case "editNew":
        return this.actions.editNew.run(
          this.getDestinations(actionDescriptor.destination)
        );
      case "getText":
        return this.actions.getText.run(
          this.getTargets(actionDescriptor.target),
          actionDescriptor.options
        );
      case "parsed":
        return this.runAction(
          parseAndFillOutAction(
            actionDescriptor.content,
            actionDescriptor.arguments
          )
        );
      default: {
        const action = this.actions[actionDescriptor.name];
        this.finalStages = action.getFinalStages?.() ?? [];
        this.noAutomaticTokenExpansion = action.noAutomaticTokenExpansion ?? false;
        return action.run(this.getTargets(actionDescriptor.target));
      }
    }
  }
  getTargets(partialTargetsDescriptor) {
    const targetDescriptor = this.inferenceContext.run(
      partialTargetsDescriptor
    );
    return this.pipelineRunner.run(targetDescriptor, {
      actionFinalStages: this.finalStages,
      noAutomaticTokenExpansion: this.noAutomaticTokenExpansion
    });
  }
  getDestinations(destinationDescriptor) {
    switch (destinationDescriptor.type) {
      case "list":
        return destinationDescriptor.destinations.flatMap(
          (destination) => this.getDestinations(destination)
        );
      case "primitive":
        return this.getTargets(destinationDescriptor.target).map(
          (target) => target.toDestination(destinationDescriptor.insertionMode)
        );
      case "implicit":
        return this.getTargets({ type: "implicit" }).map(
          (target) => target.toDestination("to")
        );
    }
  }
};
var InferenceContext = class {
  constructor(debug) {
    this.debug = debug;
    this.previousTargets = [];
  }
  run(target) {
    const ret = inferFullTargetDescriptor(target, this.previousTargets);
    if (this.debug.active) {
      this.debug.log("Full target:");
      this.debug.log(JSON.stringify(ret, null, 2));
    }
    this.previousTargets.push(target);
    return ret;
  }
  reset() {
    this.previousTargets = [];
  }
};
function constructStoredTarget(targets, selections) {
  if (targets != null && selections != null) {
    throw Error(
      "Actions may only return full targets or selections for that mark"
    );
  }
  if (selections != null) {
    return selections.map(selectionToStoredTarget);
  } else {
    return targets;
  }
}

// ../cursorless-engine/src/processTargets/marks/DecoratedSymbolStage.ts
var DecoratedSymbolStage = class {
  constructor(readableHatMap, mark) {
    this.readableHatMap = readableHatMap;
    this.mark = mark;
  }
  run() {
    const token = this.readableHatMap.getToken(
      this.mark.symbolColor,
      this.mark.character
    );
    if (token == null) {
      throw new Error(
        `Couldn't find mark ${this.mark.symbolColor} '${this.mark.character}'`
      );
    }
    return [
      new UntypedTarget({
        editor: token.editor,
        contentRange: token.range,
        isReversed: false,
        hasExplicitRange: false
      })
    ];
  }
};

// ../cursorless-engine/src/processTargets/marks/ExplicitMarkStage.ts
var ExplicitMarkStage = class {
  constructor(mark) {
    this.mark = mark;
  }
  run() {
    const {
      editorId,
      range: { start, end }
    } = this.mark;
    const editor = ide().visibleTextEditors.find((e) => e.id === editorId);
    if (editor == null) {
      throw new Error(`Couldn't find editor '${editorId}'`);
    }
    const contentRange = new Range(
      start.line,
      start.character,
      end.line,
      end.character
    );
    return [
      new UntypedTarget({
        editor,
        contentRange,
        isReversed: false,
        hasExplicitRange: false
      })
    ];
  }
};

// ../cursorless-engine/src/processTargets/marks/LineNumberStage.ts
var LineNumberStage = class {
  constructor(mark) {
    this.mark = mark;
  }
  run() {
    const editor = ide().activeTextEditor;
    if (editor == null) {
      return [];
    }
    const lineNumber = getLineNumber2(
      editor,
      this.mark.lineNumberType,
      this.mark.lineNumber
    );
    const contentRange = editor.document.lineAt(lineNumber).range;
    return [createLineTarget(editor, false, contentRange)];
  }
};
var getLineNumber2 = (editor, lineNumberType, lineNumber) => {
  switch (lineNumberType) {
    case "absolute":
      return lineNumber;
    case "relative":
      return editor.selections[0].active.line + lineNumber;
    case "modulo100": {
      const stepSize = 100;
      const startLine = editor.visibleRanges[0].start.line;
      const endLine = editor.visibleRanges[editor.visibleRanges.length - 1].end.line;
      const base = Math.floor(startLine / stepSize) * stepSize;
      const visibleLines = [];
      const invisibleLines = [];
      let currentLineNumber = base + lineNumber;
      while (currentLineNumber <= endLine) {
        if (currentLineNumber >= startLine) {
          const visible = editor.visibleRanges.find(
            (r) => currentLineNumber >= r.start.line && currentLineNumber <= r.end.line
          );
          if (visible) {
            visibleLines.push(currentLineNumber);
          } else {
            invisibleLines.push(currentLineNumber);
          }
        }
        currentLineNumber += stepSize;
      }
      if (visibleLines.length === 1) {
        return visibleLines[0];
      }
      if (visibleLines.length + invisibleLines.length > 1) {
        throw new Error("Multiple lines matching");
      }
      if (invisibleLines.length === 1) {
        return invisibleLines[0];
      }
      throw new Error("Line is not in viewport");
    }
  }
};

// ../cursorless-engine/src/processTargets/marks/NothingStage.ts
var NothingStage = class {
  constructor(mark) {
    this.mark = mark;
  }
  run() {
    return [];
  }
};

// ../cursorless-engine/src/processTargets/marks/RangeMarkStage.ts
var RangeMarkStage = class {
  constructor(markStageFactory, mark) {
    this.markStageFactory = markStageFactory;
    this.mark = mark;
  }
  run() {
    const anchorStage = this.markStageFactory.create(this.mark.anchor);
    const activeStage = this.markStageFactory.create(this.mark.active);
    const anchorTargets = anchorStage.run();
    const activeTargets = activeStage.run();
    if (anchorTargets.length !== 1 || activeTargets.length !== 1) {
      throw new Error("Expected single anchor and active target");
    }
    return [
      targetsToContinuousTarget(
        anchorTargets[0],
        activeTargets[0],
        this.mark.excludeAnchor,
        this.mark.excludeActive
      )
    ];
  }
};

// ../cursorless-engine/src/processTargets/marks/StoredTargetStage.ts
var StoredTargetStage = class {
  constructor(storedTargets, key) {
    this.storedTargets = storedTargets;
    this.key = key;
  }
  run() {
    const targets = this.storedTargets.get(this.key);
    if (targets == null || targets.length === 0) {
      throw Error(`No available ${this.key} marks`);
    }
    return targets;
  }
};

// ../cursorless-engine/src/processTargets/marks/TargetMarkStage.ts
var TargetMarkStage = class {
  constructor(targetPipelineRunner, mark) {
    this.targetPipelineRunner = targetPipelineRunner;
    this.mark = mark;
  }
  run() {
    return this.targetPipelineRunner.run(this.mark.target);
  }
};

// ../cursorless-engine/src/processTargets/MarkStageFactoryImpl.ts
var MarkStageFactoryImpl = class {
  constructor(readableHatMap, storedTargets) {
    this.readableHatMap = readableHatMap;
    this.storedTargets = storedTargets;
    this.create = this.create.bind(this);
  }
  setPipelineRunner(targetPipelineRunner) {
    this.targetPipelineRunner = targetPipelineRunner;
  }
  create(mark) {
    switch (mark.type) {
      case "cursor":
        return new CursorStage();
      case "that":
      case "source":
      case "keyboard":
        return new StoredTargetStage(this.storedTargets, mark.type);
      case "decoratedSymbol":
        return new DecoratedSymbolStage(this.readableHatMap, mark);
      case "lineNumber":
        return new LineNumberStage(mark);
      case "range":
        return new RangeMarkStage(this, mark);
      case "nothing":
        return new NothingStage(mark);
      case "target":
        return new TargetMarkStage(this.targetPipelineRunner, mark);
      case "explicit":
        return new ExplicitMarkStage(mark);
    }
  }
};

// ../cursorless-engine/src/runCommand.ts
async function runCommand(treeSitter, commandServerApi, debug, hatTokenMap, snippets, storedTargets, languageDefinitions, rangeUpdater, commandRunnerDecorators, command) {
  if (debug.active) {
    debug.log(`command:`);
    debug.log(JSON.stringify(command, null, 2));
  }
  const commandComplete = canonicalizeAndValidateCommand(command);
  const readableHatMap = await hatTokenMap.getReadableMap(
    commandComplete.usePrePhraseSnapshot
  );
  let commandRunner = createCommandRunner(
    treeSitter,
    commandServerApi,
    languageDefinitions,
    debug,
    storedTargets,
    readableHatMap,
    snippets,
    rangeUpdater
  );
  for (const decorator of commandRunnerDecorators) {
    commandRunner = decorator.wrapCommandRunner(readableHatMap, commandRunner);
  }
  const response = await commandRunner.run(commandComplete);
  return await unwrapLegacyCommandResponse(command, response);
}
async function unwrapLegacyCommandResponse(command, response) {
  if (clientSupportsFallback(command)) {
    return response;
  }
  if ("returnValue" in response) {
    return response.returnValue;
  }
  return void 0;
}
function createCommandRunner(treeSitter, commandServerApi, languageDefinitions, debug, storedTargets, readableHatMap, snippets, rangeUpdater) {
  const modifierStageFactory = new ModifierStageFactoryImpl(
    languageDefinitions,
    storedTargets,
    new ScopeHandlerFactoryImpl(languageDefinitions)
  );
  const markStageFactory = new MarkStageFactoryImpl(
    readableHatMap,
    storedTargets
  );
  const targetPipelineRunner = new TargetPipelineRunner(
    modifierStageFactory,
    markStageFactory
  );
  markStageFactory.setPipelineRunner(targetPipelineRunner);
  return new CommandRunnerImpl(
    commandServerApi,
    debug,
    storedTargets,
    targetPipelineRunner,
    new Actions(treeSitter, snippets, rangeUpdater, modifierStageFactory)
  );
}

// ../cursorless-engine/src/languages/LegacyLanguageId.ts
var legacyLanguageIds = [
  "clojure",
  "css",
  "latex",
  "ruby",
  "rust",
  "scala",
  "scss"
];

// ../cursorless-engine/src/runIntegrationTests.ts
async function runIntegrationTests(treeSitter, languageDefinitions) {
  await assertNoScopesBothLegacyAndNew(treeSitter, languageDefinitions);
}
async function assertNoScopesBothLegacyAndNew(treeSitter, languageDefinitions) {
  const errors2 = [];
  for (const languageId of legacyLanguageIds) {
    await treeSitter.loadLanguage(languageId);
    await languageDefinitions.loadLanguage(languageId);
    unsafeKeys(languageMatchers[languageId] ?? {}).map((scopeTypeType) => {
      if (languageDefinitions.get(languageId)?.getScopeHandler({
        type: scopeTypeType
      }) != null) {
        errors2.push(
          `Scope '${scopeTypeType}' defined as both legacy and new for language ${languageId}`
        );
      }
    });
  }
  if (errors2.length > 0) {
    throw Error(errors2.join("\n"));
  }
}

// ../cursorless-engine/src/scopeProviders/scopeTypeToString.ts
function scopeTypeToString(scopeType) {
  if (isSimpleScopeType(scopeType)) {
    return camelCaseToAllDown(scopeType.type).replace(".", " ");
  }
  if (scopeType.type === "surroundingPair") {
    return `Matching pair of ${camelCaseToAllDown(scopeType.delimiter)}`;
  }
  if (scopeType.type === "customRegex") {
    return `Regex \`${scopeType.regex}\``;
  }
  return "Unknown scope type";
}

// ../cursorless-engine/src/scopeProviders/ScopeInfoProvider.ts
var ScopeInfoProvider = class {
  constructor(customSpokenFormGenerator) {
    this.customSpokenFormGenerator = customSpokenFormGenerator;
    this.listeners = [];
    this.disposable = customSpokenFormGenerator.onDidChangeCustomSpokenForms(
      () => this.onChange()
    );
    this.onDidChangeScopeInfo = this.onDidChangeScopeInfo.bind(this);
    this.getScopeTypeInfo = this.getScopeTypeInfo.bind(this);
    this.updateScopeTypeInfos();
  }
  /**
   * Registers a callback to be run when the scope info changes.  The callback
   * will be run immediately once with the current scope info.
   *
   * Includes information about the available scopes, including their custom
   * spoken forms, if available. Note that even custom regex scopes will be
   * available, as reported to the engine by Talon.
   * @param callback The callback to run when the scope support changes
   * @returns A {@link Disposable} which will stop the callback from running
   */
  onDidChangeScopeInfo(callback2) {
    callback2(this.getScopeTypeInfos());
    this.listeners.push(callback2);
    return {
      dispose: () => {
        pull_default(this.listeners, callback2);
      }
    };
  }
  async onChange() {
    this.updateScopeTypeInfos();
    this.listeners.forEach((listener) => listener(this.scopeInfos));
  }
  updateScopeTypeInfos() {
    const scopeTypes = [
      ...simpleScopeTypeTypes.filter((scopeTypeType) => scopeTypeType !== "instance").map((scopeTypeType) => ({
        type: scopeTypeType
      })),
      ...surroundingPairNames.map(
        (surroundingPairName) => ({
          type: "surroundingPair",
          delimiter: surroundingPairName
        })
      ),
      ...this.customSpokenFormGenerator.getCustomRegexScopeTypes()
    ];
    this.scopeInfos = scopeTypes.map(
      (scopeType) => this.getScopeTypeInfo(scopeType)
    );
  }
  getScopeTypeInfos() {
    return this.scopeInfos;
  }
  getScopeTypeInfo(scopeType) {
    return {
      scopeType,
      spokenForm: this.customSpokenFormGenerator.scopeTypeToSpokenForm(scopeType),
      humanReadableName: scopeTypeToString(scopeType),
      isLanguageSpecific: isLanguageSpecific(scopeType)
    };
  }
  dispose() {
    this.disposable.dispose();
  }
};
function isLanguageSpecific(scopeType) {
  switch (scopeType.type) {
    case "string":
    case "argumentOrParameter":
    case "anonymousFunction":
    case "attribute":
    case "branch":
    case "class":
    case "className":
    case "collectionItem":
    case "collectionKey":
    case "command":
    case "comment":
    case "private.fieldAccess":
    case "functionCall":
    case "functionCallee":
    case "functionName":
    case "ifStatement":
    case "instance":
    case "list":
    case "map":
    case "name":
    case "namedFunction":
    case "regularExpression":
    case "statement":
    case "type":
    case "value":
    case "condition":
    case "section":
    case "sectionLevelOne":
    case "sectionLevelTwo":
    case "sectionLevelThree":
    case "sectionLevelFour":
    case "sectionLevelFive":
    case "sectionLevelSix":
    case "selector":
    case "private.switchStatementSubject":
    case "unit":
    case "xmlBothTags":
    case "xmlElement":
    case "xmlEndTag":
    case "xmlStartTag":
    case "part":
    case "chapter":
    case "subSection":
    case "subSubSection":
    case "namedParagraph":
    case "subParagraph":
    case "environment":
    case "textFragment":
    case "disqualifyDelimiter":
      return true;
    case "character":
    case "word":
    case "token":
    case "identifier":
    case "line":
    case "sentence":
    case "paragraph":
    case "boundedParagraph":
    case "document":
    case "nonWhitespaceSequence":
    case "boundedNonWhitespaceSequence":
    case "url":
    case "notebookCell":
    case "surroundingPair":
    case "surroundingPairInterior":
    case "customRegex":
    case "glyph":
      return false;
    case "oneOf":
      throw Error(
        `Can't decide whether scope type ${JSON.stringify(
          scopeType,
          void 0,
          3
        )} is language-specific`
      );
  }
}

// ../cursorless-engine/src/scopeProviders/getIterationRange.ts
function getIterationRange(editor, scopeHandler, visibleOnly) {
  if (!visibleOnly) {
    return editor.document.range;
  }
  let visibleRange = editor.visibleRanges.reduce(
    (acc, range3) => acc.union(range3)
  );
  visibleRange = editor.document.range.intersection(
    visibleRange.with(
      visibleRange.start.translate(-10),
      visibleRange.end.translate(10)
    )
  );
  const expandedStart = last_default(
    Array.from(
      scopeHandler.generateScopes(editor, visibleRange.start, "forward", {
        containment: "required"
      })
    )
  )?.domain ?? visibleRange;
  const expandedEnd = last_default(
    Array.from(
      scopeHandler.generateScopes(editor, visibleRange.end, "forward", {
        containment: "required"
      })
    )
  )?.domain ?? visibleRange;
  return expandedStart.union(expandedEnd);
}

// ../cursorless-engine/src/scopeProviders/getTargetRanges.ts
function getTargetRanges(target) {
  return {
    contentRange: target.contentRange,
    removalRange: target.getRemovalRange(),
    removalHighlightRange: target.isLine ? toLineRange(target.getRemovalHighlightRange()) : toCharacterRange(target.getRemovalHighlightRange()),
    leadingDelimiter: getOptionalTarget(target.getLeadingDelimiterTarget()),
    trailingDelimiter: getOptionalTarget(target.getTrailingDelimiterTarget()),
    interior: target.getInterior()?.map(getTargetRanges),
    boundary: target.getBoundary()?.map(getTargetRanges),
    insertionDelimiter: target.insertionDelimiter
  };
}
function getOptionalTarget(target) {
  return target != null ? getTargetRanges(target) : void 0;
}

// ../cursorless-engine/src/scopeProviders/getIterationScopeRanges.ts
function getIterationScopeRanges(editor, iterationScopeHandler, everyStage, iterationRange, includeIterationNestedTargets) {
  return map2(
    iterationScopeHandler.generateScopes(
      editor,
      iterationRange.start,
      "forward",
      {
        includeDescendantScopes: true,
        distalPosition: iterationRange.end
      }
    ),
    (scope) => {
      return {
        domain: scope.domain,
        ranges: scope.getTargets(false).map((target) => ({
          range: target.contentRange,
          targets: includeIterationNestedTargets ? getEveryScopeLenient(everyStage, target).map(getTargetRanges) : void 0
        }))
      };
    }
  );
}
function getEveryScopeLenient(everyStage, target) {
  try {
    return everyStage.run(target);
  } catch (err) {
    if (err.name === "NoContainingScopeError") {
      return [];
    }
    throw err;
  }
}

// ../cursorless-engine/src/scopeProviders/getScopeRanges.ts
function getScopeRanges(editor, scopeHandler, iterationRange) {
  return map2(
    scopeHandler.generateScopes(editor, iterationRange.start, "forward", {
      includeDescendantScopes: true,
      distalPosition: iterationRange.end
    }),
    (scope) => ({
      domain: scope.domain,
      targets: scope.getTargets(false).map(getTargetRanges)
    })
  );
}

// ../cursorless-engine/src/scopeProviders/ScopeRangeProvider.ts
var ScopeRangeProvider = class {
  constructor(scopeHandlerFactory, modifierStageFactory) {
    this.scopeHandlerFactory = scopeHandlerFactory;
    this.modifierStageFactory = modifierStageFactory;
    this.provideScopeRanges = this.provideScopeRanges.bind(this);
    this.provideIterationScopeRanges = this.provideIterationScopeRanges.bind(this);
  }
  provideScopeRanges(editor, { scopeType, visibleOnly }) {
    const scopeHandler = this.scopeHandlerFactory.create(
      scopeType,
      editor.document.languageId
    );
    if (scopeHandler == null) {
      return [];
    }
    return getScopeRanges(
      editor,
      scopeHandler,
      getIterationRange(editor, scopeHandler, visibleOnly)
    );
  }
  provideIterationScopeRanges(editor, { scopeType, visibleOnly, includeNestedTargets }) {
    const { languageId } = editor.document;
    const scopeHandler = this.scopeHandlerFactory.create(scopeType, languageId);
    if (scopeHandler == null) {
      return [];
    }
    const iterationScopeHandler = this.scopeHandlerFactory.create(
      scopeHandler.iterationScopeType,
      languageId
    );
    if (iterationScopeHandler == null) {
      return [];
    }
    return getIterationScopeRanges(
      editor,
      iterationScopeHandler,
      this.modifierStageFactory.create({
        type: "everyScope",
        scopeType
      }),
      getIterationRange(editor, scopeHandler, visibleOnly),
      includeNestedTargets
    );
  }
};

// ../cursorless-engine/src/scopeProviders/ScopeRangeWatcher.ts
var ScopeRangeWatcher = class {
  constructor(languageDefinitions, scopeRangeProvider) {
    this.scopeRangeProvider = scopeRangeProvider;
    this.disposables = [];
    this.listeners = [];
    this.onChange = this.onChange.bind(this);
    this.onDidChangeScopeRanges = this.onDidChangeScopeRanges.bind(this);
    this.onDidChangeIterationScopeRanges = this.onDidChangeIterationScopeRanges.bind(this);
    const debouncer = new DecorationDebouncer(
      ide().configuration,
      () => this.onChange()
    );
    this.disposables.push(
      // An Event which fires when the array of visible editors has changed.
      ide().onDidChangeVisibleTextEditors(debouncer.run),
      // An event that fires when a text document opens
      ide().onDidOpenTextDocument(debouncer.run),
      // An Event that fires when a text document closes
      ide().onDidCloseTextDocument(debouncer.run),
      // An event that is emitted when a text document is changed. This usually
      // happens when the contents changes but also when other things like the
      // dirty-state changes.
      ide().onDidChangeTextDocument(debouncer.run),
      ide().onDidChangeTextEditorVisibleRanges(debouncer.run),
      languageDefinitions.onDidChangeDefinition(this.onChange),
      debouncer
    );
  }
  /**
   * Registers a callback to be run when the scope ranges change for any visible
   * editor.  The callback will be run immediately once for each visible editor
   * with the current scope ranges.
   * @param callback The callback to run when the scope ranges change
   * @param config The configuration for the scope ranges
   * @returns A {@link Disposable} which will stop the callback from running
   */
  onDidChangeScopeRanges(callback2, config) {
    const fn = () => {
      ide().visibleTextEditors.forEach((editor) => {
        let scopeRanges;
        try {
          scopeRanges = this.scopeRangeProvider.provideScopeRanges(
            editor,
            config
          );
        } catch (err) {
          void showError(
            ide().messages,
            "ScopeRangeWatcher.provide",
            err.message
          );
          scopeRanges = [];
          if (ide().runMode === "test") {
            throw err;
          }
        }
        callback2(editor, scopeRanges);
      });
    };
    this.listeners.push(fn);
    fn();
    return {
      dispose: () => {
        pull_default(this.listeners, fn);
      }
    };
  }
  /**
   * Registers a callback to be run when the iteration scope ranges change for
   * any visible editor.  The callback will be run immediately once for each
   * visible editor with the current iteration scope ranges.
   * @param callback The callback to run when the scope ranges change
   * @param config The configuration for the scope ranges
   * @returns A {@link Disposable} which will stop the callback from running
   */
  onDidChangeIterationScopeRanges(callback2, config) {
    const fn = () => {
      ide().visibleTextEditors.forEach((editor) => {
        callback2(
          editor,
          this.scopeRangeProvider.provideIterationScopeRanges(editor, config)
        );
      });
    };
    this.listeners.push(fn);
    fn();
    return {
      dispose: () => {
        pull_default(this.listeners, fn);
      }
    };
  }
  onChange() {
    this.listeners.forEach((listener) => listener());
  }
  dispose() {
    this.disposables.forEach(({ dispose }) => {
      try {
        dispose();
      } catch (_e) {
      }
    });
  }
};

// ../cursorless-engine/src/scopeProviders/ScopeSupportChecker.ts
var ScopeSupportChecker = class {
  constructor(scopeHandlerFactory) {
    this.scopeHandlerFactory = scopeHandlerFactory;
    this.getScopeSupport = this.getScopeSupport.bind(this);
    this.getIterationScopeSupport = this.getIterationScopeSupport.bind(this);
  }
  /**
   * Determine the level of support for {@link scopeType} in {@link editor}, as
   * determined by its language id.
   * @param editor The editor to check
   * @param scopeType The scope type to check
   * @returns The level of support for {@link scopeType} in {@link editor}
   */
  getScopeSupport(editor, scopeType) {
    const { languageId } = editor.document;
    const scopeHandler = this.scopeHandlerFactory.create(scopeType, languageId);
    if (scopeHandler == null) {
      return getLegacyScopeSupport(languageId, scopeType);
    }
    return editorContainsScope(editor, scopeHandler) ? 0 /* supportedAndPresentInEditor */ : 1 /* supportedButNotPresentInEditor */;
  }
  /**
   * Determine the level of support for the iteration scope of {@link scopeType}
   * in {@link editor}, as determined by its language id.
   * @param editor The editor to check
   * @param scopeType The scope type to check
   * @returns The level of support for the iteration scope of {@link scopeType}
   * in {@link editor}
   */
  getIterationScopeSupport(editor, scopeType) {
    const { languageId } = editor.document;
    const scopeHandler = this.scopeHandlerFactory.create(scopeType, languageId);
    if (scopeHandler == null) {
      return getLegacyScopeSupport(languageId, scopeType);
    }
    const iterationScopeHandler = this.scopeHandlerFactory.create(
      scopeHandler.iterationScopeType,
      languageId
    );
    if (iterationScopeHandler == null) {
      return 3 /* unsupported */;
    }
    return editorContainsScope(editor, iterationScopeHandler) ? 0 /* supportedAndPresentInEditor */ : 1 /* supportedButNotPresentInEditor */;
  }
};
function editorContainsScope(editor, scopeHandler) {
  return !isEmptyIterable(
    scopeHandler.generateScopes(editor, new Position(0, 0), "forward")
  );
}
function getLegacyScopeSupport(languageId, scopeType) {
  switch (scopeType.type) {
    case "boundedNonWhitespaceSequence":
    case "surroundingPair":
      return 2 /* supportedLegacy */;
    case "notebookCell":
      return 3 /* unsupported */;
    default:
      if (languageMatchers[languageId]?.[scopeType.type] != null) {
        return 2 /* supportedLegacy */;
      }
      return 3 /* unsupported */;
  }
}

// ../cursorless-engine/src/scopeProviders/ScopeSupportWatcher.ts
var ScopeSupportWatcher = class {
  constructor(languageDefinitions, scopeSupportChecker, scopeInfoProvider) {
    this.scopeSupportChecker = scopeSupportChecker;
    this.scopeInfoProvider = scopeInfoProvider;
    this.listeners = [];
    this.onChange = this.onChange.bind(this);
    this.onDidChangeScopeSupport = this.onDidChangeScopeSupport.bind(this);
    const debouncer = new DecorationDebouncer(
      ide().configuration,
      () => this.onChange()
    );
    this.disposable = disposableFrom(
      // An event that fires when a text document opens
      ide().onDidOpenTextDocument(debouncer.run),
      // An Event that fires when a text document closes
      ide().onDidCloseTextDocument(debouncer.run),
      // An Event which fires when the active editor has changed. Note that the event also fires when the active editor changes to undefined.
      ide().onDidChangeActiveTextEditor(debouncer.run),
      // An event that is emitted when a text document is changed. This usually
      // happens when the contents changes but also when other things like the
      // dirty-state changes.
      ide().onDidChangeTextDocument(debouncer.run),
      languageDefinitions.onDidChangeDefinition(debouncer.run),
      this.scopeInfoProvider.onDidChangeScopeInfo(this.onChange),
      debouncer
    );
  }
  /**
   * Registers a callback to be run when the scope support changes for the active
   * editor.  The callback will be run immediately once with the current support
   * levels for the active editor.
   *
   * Note that this watcher could be expensive, because it runs all the scope
   * handlers for the active editor every time the content of the active editor
   * changes. If you only need info about the available scopes, including their
   * spoken forms, you should use {@link onDidChangeScopeInfo} instead.
   * @param callback The callback to run when the scope support changes
   * @returns A {@link Disposable} which will stop the callback from running
   */
  onDidChangeScopeSupport(callback2) {
    callback2(this.getSupportLevels());
    this.listeners.push(callback2);
    return {
      dispose: () => {
        pull_default(this.listeners, callback2);
      }
    };
  }
  onChange() {
    if (this.listeners.length === 0) {
      return;
    }
    const supportLevels = this.getSupportLevels();
    this.listeners.forEach((listener) => listener(supportLevels));
  }
  getSupportLevels() {
    const activeTextEditor = ide().activeTextEditor;
    const getScopeTypeSupport = activeTextEditor == null ? () => 3 /* unsupported */ : (scopeType) => this.scopeSupportChecker.getScopeSupport(
      activeTextEditor,
      scopeType
    );
    const getIterationScopeTypeSupport = activeTextEditor == null ? () => 3 /* unsupported */ : (scopeType) => this.scopeSupportChecker.getIterationScopeSupport(
      activeTextEditor,
      scopeType
    );
    const scopeTypeInfos = this.scopeInfoProvider.getScopeTypeInfos();
    return scopeTypeInfos.map((scopeTypeInfo) => ({
      ...scopeTypeInfo,
      support: getScopeTypeSupport(scopeTypeInfo.scopeType),
      iterationScopeSupport: getIterationScopeTypeSupport(
        scopeTypeInfo.scopeType
      )
    }));
  }
  dispose() {
    this.disposable.dispose();
  }
};

// ../cursorless-engine/src/cursorlessEngine.ts
async function createCursorlessEngine({
  ide: ide2,
  hats,
  treeSitterQueryProvider,
  treeSitter = new DisabledTreeSitter(),
  commandServerApi = new DisabledCommandServerApi(),
  talonSpokenForms = new DisabledTalonSpokenForms(),
  snippets = new DisabledSnippets()
}) {
  injectIde(ide2);
  const debug = new Debug(ide2);
  const rangeUpdater = new RangeUpdater();
  const storedTargets = new StoredTargetMap();
  const keyboardTargetUpdater = new KeyboardTargetUpdater(ide2, storedTargets);
  const customSpokenFormGenerator = new CustomSpokenFormGeneratorImpl(
    talonSpokenForms
  );
  const hatTokenMap = hats != null ? new HatTokenMapImpl(rangeUpdater, debug, hats, commandServerApi) : new DisabledHatTokenMap();
  void hatTokenMap.allocateHats();
  const languageDefinitions = treeSitterQueryProvider ? await LanguageDefinitionsImpl.create(
    ide2,
    treeSitter,
    treeSitterQueryProvider
  ) : new DisabledLanguageDefinitions();
  ide2.disposeOnExit(
    rangeUpdater,
    languageDefinitions,
    hatTokenMap,
    debug,
    keyboardTargetUpdater
  );
  const commandRunnerDecorators = [];
  let previousCommand = void 0;
  const runCommandClosure = (command) => {
    previousCommand = command;
    return runCommand(
      treeSitter,
      commandServerApi,
      debug,
      hatTokenMap,
      snippets,
      storedTargets,
      languageDefinitions,
      rangeUpdater,
      commandRunnerDecorators,
      command
    );
  };
  return {
    commandApi: {
      runCommand(command) {
        return runCommandClosure(command);
      },
      runCommandSafe(...args) {
        return runCommandClosure(ensureCommandShape(args));
      },
      repeatPreviousCommand() {
        if (previousCommand == null) {
          throw new Error("No previous command");
        }
        return runCommandClosure(previousCommand);
      }
    },
    scopeProvider: createScopeProvider(
      languageDefinitions,
      storedTargets,
      customSpokenFormGenerator
    ),
    customSpokenFormGenerator,
    storedTargets,
    hatTokenMap,
    injectIde,
    runIntegrationTests: () => runIntegrationTests(treeSitter, languageDefinitions),
    addCommandRunnerDecorator: (decorator) => {
      commandRunnerDecorators.push(decorator);
    }
  };
}
function createScopeProvider(languageDefinitions, storedTargets, customSpokenFormGenerator) {
  const scopeHandlerFactory = new ScopeHandlerFactoryImpl(languageDefinitions);
  const rangeProvider = new ScopeRangeProvider(
    scopeHandlerFactory,
    new ModifierStageFactoryImpl(
      languageDefinitions,
      storedTargets,
      scopeHandlerFactory
    )
  );
  const rangeWatcher = new ScopeRangeWatcher(
    languageDefinitions,
    rangeProvider
  );
  const supportChecker = new ScopeSupportChecker(scopeHandlerFactory);
  const infoProvider = new ScopeInfoProvider(customSpokenFormGenerator);
  const supportWatcher = new ScopeSupportWatcher(
    languageDefinitions,
    supportChecker,
    infoProvider
  );
  return {
    provideScopeRanges: rangeProvider.provideScopeRanges,
    provideIterationScopeRanges: rangeProvider.provideIterationScopeRanges,
    onDidChangeScopeRanges: rangeWatcher.onDidChangeScopeRanges,
    onDidChangeIterationScopeRanges: rangeWatcher.onDidChangeIterationScopeRanges,
    getScopeSupport: supportChecker.getScopeSupport,
    getIterationScopeSupport: supportChecker.getIterationScopeSupport,
    onDidChangeScopeSupport: supportWatcher.onDidChangeScopeSupport,
    getScopeInfo: infoProvider.getScopeTypeInfo,
    onDidChangeScopeInfo: infoProvider.onDidChangeScopeInfo
  };
}

// ../cursorless-engine/src/testUtil/plainObjectToTarget.ts
function plainObjectToTarget(editor, plainObject) {
  switch (plainObject.type) {
    case "UntypedTarget":
      return new UntypedTarget({
        editor,
        isReversed: plainObject.isReversed,
        contentRange: plainObjectToRange(plainObject.contentRange),
        hasExplicitRange: plainObject.hasExplicitRange
      });
    case "LineTarget":
      return new LineTarget({
        editor,
        isReversed: plainObject.isReversed,
        contentRange: plainObjectToRange(plainObject.contentRange)
      });
    default:
      throw Error(`Unsupported target type ${plainObject.type}`);
  }
}

// ../cursorless-engine/src/util/grammarHelpers.ts
var UNUSED = Symbol("unused");
var ArgPosition = class {
  constructor(position) {
    this.position = position;
  }
};
var argPositions = {
  $0: new ArgPosition(0),
  $1: new ArgPosition(1),
  $2: new ArgPosition(2)
};

// ../cursorless-everywhere-talon-core/src/constructTestHelpers.ts
function constructTestHelpers({
  talonJsIDE,
  normalizedIde,
  injectIde: injectIde2,
  commandApi,
  hatTokenMap,
  commandServerApi,
  storedTargets
}) {
  return {
    talonJsIDE,
    ide: normalizedIde,
    commandServerApi,
    hatTokenMap,
    storedTargets,
    injectIde: injectIde2,
    runCommand(command) {
      return commandApi.runCommand(command);
    },
    setStoredTarget(editor, key, targets) {
      storedTargets.set(
        key,
        targets?.map((target) => plainObjectToTarget(editor, target))
      );
    }
  };
}

// ../cursorless-everywhere-talon-core/src/ide/TalonJsCapabilities.ts
var COMMAND_CAPABILITIES = {
  clipboardCopy: void 0,
  clipboardPaste: void 0,
  toggleLineComment: void 0,
  rename: void 0,
  quickFix: void 0,
  revealDefinition: void 0,
  revealTypeDefinition: void 0,
  showHover: void 0,
  showDebugHover: void 0,
  extractVariable: void 0,
  fold: void 0,
  highlight: void 0,
  unfold: void 0,
  showReferences: void 0,
  insertLineAfter: void 0,
  indentLine: void 0,
  outdentLine: void 0
};
var TalonJsCapabilities = class {
  commands = COMMAND_CAPABILITIES;
};

// ../cursorless-everywhere-talon-core/src/ide/TalonJsClipboard.ts
var TalonJsClipboard = class {
  constructor(talon2) {
    this.talon = talon2;
  }
  async readText() {
    return this.talon.actions.clip.text();
  }
  async writeText(value) {
    this.talon.actions.clip.set_text(value);
  }
};

// ../cursorless-everywhere-talon-core/src/ide/TalonJsConfiguration.ts
var CONFIGURATION_DEFAULTS2 = {
  tokenHatSplittingMode: {
    preserveCase: false,
    lettersToPreserve: [],
    symbolsToPreserve: []
  },
  wordSeparators: ["_"],
  decorationDebounceDelayMs: 50,
  experimental: {
    snippetsDir: void 0,
    hatStability: "balanced" /* balanced */,
    keyboardTargetFollowsSelection: false
  },
  commandHistory: false,
  debug: false
};
var TalonJsConfiguration = class {
  getOwnConfiguration(path, _scope) {
    return get_default(CONFIGURATION_DEFAULTS2, path);
  }
  onDidChangeConfiguration(_listener) {
    return {
      dispose: () => {
      }
    };
  }
};

// ../cursorless-everywhere-talon-core/src/ide/setSelections.ts
function setSelections(talon2, document, selections) {
  const selectionOffsets = selections.map((selection) => ({
    anchor: document.offsetAt(selection.anchor),
    active: document.offsetAt(selection.active)
  }));
  talon2.actions.user.cursorless_everywhere_set_selections(selectionOffsets);
  return Promise.resolve();
}

// ../cursorless-everywhere-talon-core/src/ide/talonJsPerformEdits.ts
function talonJsPerformEdits(talon2, ide2, document, edits) {
  const changes = document.edit(edits);
  const editorEdit = {
    text: document.text,
    changes: changes.map((change) => ({
      rangeOffset: change.rangeOffset,
      rangeLength: change.rangeLength,
      text: change.text
    }))
  };
  talon2.actions.user.cursorless_everywhere_edit_text(editorEdit);
  ide2.emitDidChangeTextDocument({
    document,
    contentChanges: changes
  });
}

// ../cursorless-everywhere-talon-core/src/ide/TalonJsEditor.ts
var TalonJsEditor = class {
  constructor(talon2, ide2, id2, document, visibleRanges, selections) {
    this.talon = talon2;
    this.ide = ide2;
    this.id = id2;
    this.document = document;
    this.visibleRanges = visibleRanges;
    this.selections = selections;
  }
  options = {
    tabSize: 4,
    insertSpaces: true
  };
  isActive = true;
  isEqual(other) {
    return this.id === other.id;
  }
  async setSelections(selections, _opts) {
    if (!selectionsEqual(this.selections, selections)) {
      await setSelections(this.talon, this.document, selections);
      this.selections = selections;
    }
  }
  edit(edits) {
    talonJsPerformEdits(this.talon, this.ide, this.document, edits);
    return Promise.resolve(true);
  }
  async clipboardCopy(_ranges) {
    throw Error("clipboardCopy not implemented.");
  }
  async clipboardPaste() {
    throw Error("clipboardPaste not implemented.");
  }
  indentLine(_ranges) {
    throw Error("indentLine not implemented.");
  }
  outdentLine(_ranges) {
    throw Error("outdentLine not implemented.");
  }
  insertLineAfter(_ranges) {
    throw Error("insertLineAfter not implemented.");
  }
  focus() {
    throw new Error("focus not implemented.");
  }
  revealRange(_range) {
    return Promise.resolve();
  }
  revealLine(_lineNumber, _at) {
    throw new Error("revealLine not implemented.");
  }
  openLink(_range, _options) {
    throw new Error("openLink not implemented.");
  }
  fold(_ranges) {
    throw new Error("fold not implemented.");
  }
  unfold(_ranges) {
    throw new Error("unfold not implemented.");
  }
  toggleBreakpoint(_descriptors) {
    throw new Error("toggleBreakpoint not implemented.");
  }
  toggleLineComment(_ranges) {
    throw new Error("toggleLineComment not implemented.");
  }
  insertSnippet(_snippet, _ranges) {
    throw new Error("insertSnippet not implemented.");
  }
  rename(_range) {
    throw new Error("rename not implemented.");
  }
  showReferences(_range) {
    throw new Error("showReferences not implemented.");
  }
  quickFix(_range) {
    throw new Error("quickFix not implemented.");
  }
  revealDefinition(_range) {
    throw new Error("revealDefinition not implemented.");
  }
  revealTypeDefinition(_range) {
    throw new Error("revealTypeDefinition not implemented.");
  }
  showHover(_range) {
    throw new Error("showHover not implemented.");
  }
  showDebugHover(_range) {
    throw new Error("showDebugHover not implemented.");
  }
  extractVariable(_range) {
    throw new Error("extractVariable not implemented.");
  }
  editNewNotebookCellAbove() {
    throw new Error("editNewNotebookCellAbove not implemented.");
  }
  editNewNotebookCellBelow() {
    throw new Error("editNewNotebookCellBelow not implemented.");
  }
};

// ../cursorless-everywhere-talon-core/src/ide/TalonJsMessages.ts
var TalonJsMessages = class {
  constructor(talon2) {
    this.talon = talon2;
  }
  async showMessage(type2, _id, message, ...options2) {
    if (options2.length > 0) {
      throw Error(`Message options are not supported in TalonJsMessages.`);
    }
    switch (type2) {
      case "info" /* info */:
        this.talon.actions.app.notify(message, "Cursorless");
        break;
      case "warning" /* warning */:
        this.talon.actions.app.notify(message, "[WARNING] Cursorless");
        break;
      case "error" /* error */:
        this.talon.actions.app.notify(message, "[ERROR] Cursorless");
    }
    return void 0;
  }
};

// ../../node_modules/.pnpm/vscode-uri@3.0.8/node_modules/vscode-uri/lib/esm/index.mjs
var LIB;
(() => {
  "use strict";
  var t = { 470: (t2) => {
    function e2(t3) {
      if ("string" != typeof t3) throw new TypeError("Path must be a string. Received " + JSON.stringify(t3));
    }
    function r2(t3, e3) {
      for (var r3, n3 = "", i = 0, o = -1, s = 0, h = 0; h <= t3.length; ++h) {
        if (h < t3.length) r3 = t3.charCodeAt(h);
        else {
          if (47 === r3) break;
          r3 = 47;
        }
        if (47 === r3) {
          if (o === h - 1 || 1 === s) ;
          else if (o !== h - 1 && 2 === s) {
            if (n3.length < 2 || 2 !== i || 46 !== n3.charCodeAt(n3.length - 1) || 46 !== n3.charCodeAt(n3.length - 2)) {
              if (n3.length > 2) {
                var a = n3.lastIndexOf("/");
                if (a !== n3.length - 1) {
                  -1 === a ? (n3 = "", i = 0) : i = (n3 = n3.slice(0, a)).length - 1 - n3.lastIndexOf("/"), o = h, s = 0;
                  continue;
                }
              } else if (2 === n3.length || 1 === n3.length) {
                n3 = "", i = 0, o = h, s = 0;
                continue;
              }
            }
            e3 && (n3.length > 0 ? n3 += "/.." : n3 = "..", i = 2);
          } else n3.length > 0 ? n3 += "/" + t3.slice(o + 1, h) : n3 = t3.slice(o + 1, h), i = h - o - 1;
          o = h, s = 0;
        } else 46 === r3 && -1 !== s ? ++s : s = -1;
      }
      return n3;
    }
    var n2 = { resolve: function() {
      for (var t3, n3 = "", i = false, o = arguments.length - 1; o >= -1 && !i; o--) {
        var s;
        o >= 0 ? s = arguments[o] : (void 0 === t3 && (t3 = process.cwd()), s = t3), e2(s), 0 !== s.length && (n3 = s + "/" + n3, i = 47 === s.charCodeAt(0));
      }
      return n3 = r2(n3, !i), i ? n3.length > 0 ? "/" + n3 : "/" : n3.length > 0 ? n3 : ".";
    }, normalize: function(t3) {
      if (e2(t3), 0 === t3.length) return ".";
      var n3 = 47 === t3.charCodeAt(0), i = 47 === t3.charCodeAt(t3.length - 1);
      return 0 !== (t3 = r2(t3, !n3)).length || n3 || (t3 = "."), t3.length > 0 && i && (t3 += "/"), n3 ? "/" + t3 : t3;
    }, isAbsolute: function(t3) {
      return e2(t3), t3.length > 0 && 47 === t3.charCodeAt(0);
    }, join: function() {
      if (0 === arguments.length) return ".";
      for (var t3, r3 = 0; r3 < arguments.length; ++r3) {
        var i = arguments[r3];
        e2(i), i.length > 0 && (void 0 === t3 ? t3 = i : t3 += "/" + i);
      }
      return void 0 === t3 ? "." : n2.normalize(t3);
    }, relative: function(t3, r3) {
      if (e2(t3), e2(r3), t3 === r3) return "";
      if ((t3 = n2.resolve(t3)) === (r3 = n2.resolve(r3))) return "";
      for (var i = 1; i < t3.length && 47 === t3.charCodeAt(i); ++i) ;
      for (var o = t3.length, s = o - i, h = 1; h < r3.length && 47 === r3.charCodeAt(h); ++h) ;
      for (var a = r3.length - h, c = s < a ? s : a, f = -1, u = 0; u <= c; ++u) {
        if (u === c) {
          if (a > c) {
            if (47 === r3.charCodeAt(h + u)) return r3.slice(h + u + 1);
            if (0 === u) return r3.slice(h + u);
          } else s > c && (47 === t3.charCodeAt(i + u) ? f = u : 0 === u && (f = 0));
          break;
        }
        var l = t3.charCodeAt(i + u);
        if (l !== r3.charCodeAt(h + u)) break;
        47 === l && (f = u);
      }
      var g = "";
      for (u = i + f + 1; u <= o; ++u) u !== o && 47 !== t3.charCodeAt(u) || (0 === g.length ? g += ".." : g += "/..");
      return g.length > 0 ? g + r3.slice(h + f) : (h += f, 47 === r3.charCodeAt(h) && ++h, r3.slice(h));
    }, _makeLong: function(t3) {
      return t3;
    }, dirname: function(t3) {
      if (e2(t3), 0 === t3.length) return ".";
      for (var r3 = t3.charCodeAt(0), n3 = 47 === r3, i = -1, o = true, s = t3.length - 1; s >= 1; --s) if (47 === (r3 = t3.charCodeAt(s))) {
        if (!o) {
          i = s;
          break;
        }
      } else o = false;
      return -1 === i ? n3 ? "/" : "." : n3 && 1 === i ? "//" : t3.slice(0, i);
    }, basename: function(t3, r3) {
      if (void 0 !== r3 && "string" != typeof r3) throw new TypeError('"ext" argument must be a string');
      e2(t3);
      var n3, i = 0, o = -1, s = true;
      if (void 0 !== r3 && r3.length > 0 && r3.length <= t3.length) {
        if (r3.length === t3.length && r3 === t3) return "";
        var h = r3.length - 1, a = -1;
        for (n3 = t3.length - 1; n3 >= 0; --n3) {
          var c = t3.charCodeAt(n3);
          if (47 === c) {
            if (!s) {
              i = n3 + 1;
              break;
            }
          } else -1 === a && (s = false, a = n3 + 1), h >= 0 && (c === r3.charCodeAt(h) ? -1 == --h && (o = n3) : (h = -1, o = a));
        }
        return i === o ? o = a : -1 === o && (o = t3.length), t3.slice(i, o);
      }
      for (n3 = t3.length - 1; n3 >= 0; --n3) if (47 === t3.charCodeAt(n3)) {
        if (!s) {
          i = n3 + 1;
          break;
        }
      } else -1 === o && (s = false, o = n3 + 1);
      return -1 === o ? "" : t3.slice(i, o);
    }, extname: function(t3) {
      e2(t3);
      for (var r3 = -1, n3 = 0, i = -1, o = true, s = 0, h = t3.length - 1; h >= 0; --h) {
        var a = t3.charCodeAt(h);
        if (47 !== a) -1 === i && (o = false, i = h + 1), 46 === a ? -1 === r3 ? r3 = h : 1 !== s && (s = 1) : -1 !== r3 && (s = -1);
        else if (!o) {
          n3 = h + 1;
          break;
        }
      }
      return -1 === r3 || -1 === i || 0 === s || 1 === s && r3 === i - 1 && r3 === n3 + 1 ? "" : t3.slice(r3, i);
    }, format: function(t3) {
      if (null === t3 || "object" != typeof t3) throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof t3);
      return function(t4, e3) {
        var r3 = e3.dir || e3.root, n3 = e3.base || (e3.name || "") + (e3.ext || "");
        return r3 ? r3 === e3.root ? r3 + n3 : r3 + "/" + n3 : n3;
      }(0, t3);
    }, parse: function(t3) {
      e2(t3);
      var r3 = { root: "", dir: "", base: "", ext: "", name: "" };
      if (0 === t3.length) return r3;
      var n3, i = t3.charCodeAt(0), o = 47 === i;
      o ? (r3.root = "/", n3 = 1) : n3 = 0;
      for (var s = -1, h = 0, a = -1, c = true, f = t3.length - 1, u = 0; f >= n3; --f) if (47 !== (i = t3.charCodeAt(f))) -1 === a && (c = false, a = f + 1), 46 === i ? -1 === s ? s = f : 1 !== u && (u = 1) : -1 !== s && (u = -1);
      else if (!c) {
        h = f + 1;
        break;
      }
      return -1 === s || -1 === a || 0 === u || 1 === u && s === a - 1 && s === h + 1 ? -1 !== a && (r3.base = r3.name = 0 === h && o ? t3.slice(1, a) : t3.slice(h, a)) : (0 === h && o ? (r3.name = t3.slice(1, s), r3.base = t3.slice(1, a)) : (r3.name = t3.slice(h, s), r3.base = t3.slice(h, a)), r3.ext = t3.slice(s, a)), h > 0 ? r3.dir = t3.slice(0, h - 1) : o && (r3.dir = "/"), r3;
    }, sep: "/", delimiter: ":", win32: null, posix: null };
    n2.posix = n2, t2.exports = n2;
  } }, e = {};
  function r(n2) {
    var i = e[n2];
    if (void 0 !== i) return i.exports;
    var o = e[n2] = { exports: {} };
    return t[n2](o, o.exports, r), o.exports;
  }
  r.d = (t2, e2) => {
    for (var n2 in e2) r.o(e2, n2) && !r.o(t2, n2) && Object.defineProperty(t2, n2, { enumerable: true, get: e2[n2] });
  }, r.o = (t2, e2) => Object.prototype.hasOwnProperty.call(t2, e2), r.r = (t2) => {
    "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t2, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(t2, "__esModule", { value: true });
  };
  var n = {};
  (() => {
    let t2;
    if (r.r(n), r.d(n, { URI: () => f, Utils: () => P }), "object" == typeof process) t2 = "win32" === process.platform;
    else if ("object" == typeof navigator) {
      let e3 = navigator.userAgent;
      t2 = e3.indexOf("Windows") >= 0;
    }
    const e2 = /^\w[\w\d+.-]*$/, i = /^\//, o = /^\/\//;
    function s(t3, r2) {
      if (!t3.scheme && r2) throw new Error(`[UriError]: Scheme is missing: {scheme: "", authority: "${t3.authority}", path: "${t3.path}", query: "${t3.query}", fragment: "${t3.fragment}"}`);
      if (t3.scheme && !e2.test(t3.scheme)) throw new Error("[UriError]: Scheme contains illegal characters.");
      if (t3.path) {
        if (t3.authority) {
          if (!i.test(t3.path)) throw new Error('[UriError]: If a URI contains an authority component, then the path component must either be empty or begin with a slash ("/") character');
        } else if (o.test(t3.path)) throw new Error('[UriError]: If a URI does not contain an authority component, then the path cannot begin with two slash characters ("//")');
      }
    }
    const h = "", a = "/", c = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
    class f {
      static isUri(t3) {
        return t3 instanceof f || !!t3 && "string" == typeof t3.authority && "string" == typeof t3.fragment && "string" == typeof t3.path && "string" == typeof t3.query && "string" == typeof t3.scheme && "string" == typeof t3.fsPath && "function" == typeof t3.with && "function" == typeof t3.toString;
      }
      scheme;
      authority;
      path;
      query;
      fragment;
      constructor(t3, e3, r2, n2, i2, o2 = false) {
        "object" == typeof t3 ? (this.scheme = t3.scheme || h, this.authority = t3.authority || h, this.path = t3.path || h, this.query = t3.query || h, this.fragment = t3.fragment || h) : (this.scheme = /* @__PURE__ */ function(t4, e4) {
          return t4 || e4 ? t4 : "file";
        }(t3, o2), this.authority = e3 || h, this.path = function(t4, e4) {
          switch (t4) {
            case "https":
            case "http":
            case "file":
              e4 ? e4[0] !== a && (e4 = a + e4) : e4 = a;
          }
          return e4;
        }(this.scheme, r2 || h), this.query = n2 || h, this.fragment = i2 || h, s(this, o2));
      }
      get fsPath() {
        return m(this, false);
      }
      with(t3) {
        if (!t3) return this;
        let { scheme: e3, authority: r2, path: n2, query: i2, fragment: o2 } = t3;
        return void 0 === e3 ? e3 = this.scheme : null === e3 && (e3 = h), void 0 === r2 ? r2 = this.authority : null === r2 && (r2 = h), void 0 === n2 ? n2 = this.path : null === n2 && (n2 = h), void 0 === i2 ? i2 = this.query : null === i2 && (i2 = h), void 0 === o2 ? o2 = this.fragment : null === o2 && (o2 = h), e3 === this.scheme && r2 === this.authority && n2 === this.path && i2 === this.query && o2 === this.fragment ? this : new l(e3, r2, n2, i2, o2);
      }
      static parse(t3, e3 = false) {
        const r2 = c.exec(t3);
        return r2 ? new l(r2[2] || h, C(r2[4] || h), C(r2[5] || h), C(r2[7] || h), C(r2[9] || h), e3) : new l(h, h, h, h, h);
      }
      static file(e3) {
        let r2 = h;
        if (t2 && (e3 = e3.replace(/\\/g, a)), e3[0] === a && e3[1] === a) {
          const t3 = e3.indexOf(a, 2);
          -1 === t3 ? (r2 = e3.substring(2), e3 = a) : (r2 = e3.substring(2, t3), e3 = e3.substring(t3) || a);
        }
        return new l("file", r2, e3, h, h);
      }
      static from(t3) {
        const e3 = new l(t3.scheme, t3.authority, t3.path, t3.query, t3.fragment);
        return s(e3, true), e3;
      }
      toString(t3 = false) {
        return y(this, t3);
      }
      toJSON() {
        return this;
      }
      static revive(t3) {
        if (t3) {
          if (t3 instanceof f) return t3;
          {
            const e3 = new l(t3);
            return e3._formatted = t3.external, e3._fsPath = t3._sep === u ? t3.fsPath : null, e3;
          }
        }
        return t3;
      }
    }
    const u = t2 ? 1 : void 0;
    class l extends f {
      _formatted = null;
      _fsPath = null;
      get fsPath() {
        return this._fsPath || (this._fsPath = m(this, false)), this._fsPath;
      }
      toString(t3 = false) {
        return t3 ? y(this, true) : (this._formatted || (this._formatted = y(this, false)), this._formatted);
      }
      toJSON() {
        const t3 = { $mid: 1 };
        return this._fsPath && (t3.fsPath = this._fsPath, t3._sep = u), this._formatted && (t3.external = this._formatted), this.path && (t3.path = this.path), this.scheme && (t3.scheme = this.scheme), this.authority && (t3.authority = this.authority), this.query && (t3.query = this.query), this.fragment && (t3.fragment = this.fragment), t3;
      }
    }
    const g = { 58: "%3A", 47: "%2F", 63: "%3F", 35: "%23", 91: "%5B", 93: "%5D", 64: "%40", 33: "%21", 36: "%24", 38: "%26", 39: "%27", 40: "%28", 41: "%29", 42: "%2A", 43: "%2B", 44: "%2C", 59: "%3B", 61: "%3D", 32: "%20" };
    function d(t3, e3, r2) {
      let n2, i2 = -1;
      for (let o2 = 0; o2 < t3.length; o2++) {
        const s2 = t3.charCodeAt(o2);
        if (s2 >= 97 && s2 <= 122 || s2 >= 65 && s2 <= 90 || s2 >= 48 && s2 <= 57 || 45 === s2 || 46 === s2 || 95 === s2 || 126 === s2 || e3 && 47 === s2 || r2 && 91 === s2 || r2 && 93 === s2 || r2 && 58 === s2) -1 !== i2 && (n2 += encodeURIComponent(t3.substring(i2, o2)), i2 = -1), void 0 !== n2 && (n2 += t3.charAt(o2));
        else {
          void 0 === n2 && (n2 = t3.substr(0, o2));
          const e4 = g[s2];
          void 0 !== e4 ? (-1 !== i2 && (n2 += encodeURIComponent(t3.substring(i2, o2)), i2 = -1), n2 += e4) : -1 === i2 && (i2 = o2);
        }
      }
      return -1 !== i2 && (n2 += encodeURIComponent(t3.substring(i2))), void 0 !== n2 ? n2 : t3;
    }
    function p(t3) {
      let e3;
      for (let r2 = 0; r2 < t3.length; r2++) {
        const n2 = t3.charCodeAt(r2);
        35 === n2 || 63 === n2 ? (void 0 === e3 && (e3 = t3.substr(0, r2)), e3 += g[n2]) : void 0 !== e3 && (e3 += t3[r2]);
      }
      return void 0 !== e3 ? e3 : t3;
    }
    function m(e3, r2) {
      let n2;
      return n2 = e3.authority && e3.path.length > 1 && "file" === e3.scheme ? `//${e3.authority}${e3.path}` : 47 === e3.path.charCodeAt(0) && (e3.path.charCodeAt(1) >= 65 && e3.path.charCodeAt(1) <= 90 || e3.path.charCodeAt(1) >= 97 && e3.path.charCodeAt(1) <= 122) && 58 === e3.path.charCodeAt(2) ? r2 ? e3.path.substr(1) : e3.path[1].toLowerCase() + e3.path.substr(2) : e3.path, t2 && (n2 = n2.replace(/\//g, "\\")), n2;
    }
    function y(t3, e3) {
      const r2 = e3 ? p : d;
      let n2 = "", { scheme: i2, authority: o2, path: s2, query: h2, fragment: c2 } = t3;
      if (i2 && (n2 += i2, n2 += ":"), (o2 || "file" === i2) && (n2 += a, n2 += a), o2) {
        let t4 = o2.indexOf("@");
        if (-1 !== t4) {
          const e4 = o2.substr(0, t4);
          o2 = o2.substr(t4 + 1), t4 = e4.lastIndexOf(":"), -1 === t4 ? n2 += r2(e4, false, false) : (n2 += r2(e4.substr(0, t4), false, false), n2 += ":", n2 += r2(e4.substr(t4 + 1), false, true)), n2 += "@";
        }
        o2 = o2.toLowerCase(), t4 = o2.lastIndexOf(":"), -1 === t4 ? n2 += r2(o2, false, true) : (n2 += r2(o2.substr(0, t4), false, true), n2 += o2.substr(t4));
      }
      if (s2) {
        if (s2.length >= 3 && 47 === s2.charCodeAt(0) && 58 === s2.charCodeAt(2)) {
          const t4 = s2.charCodeAt(1);
          t4 >= 65 && t4 <= 90 && (s2 = `/${String.fromCharCode(t4 + 32)}:${s2.substr(3)}`);
        } else if (s2.length >= 2 && 58 === s2.charCodeAt(1)) {
          const t4 = s2.charCodeAt(0);
          t4 >= 65 && t4 <= 90 && (s2 = `${String.fromCharCode(t4 + 32)}:${s2.substr(2)}`);
        }
        n2 += r2(s2, true, false);
      }
      return h2 && (n2 += "?", n2 += r2(h2, false, false)), c2 && (n2 += "#", n2 += e3 ? c2 : d(c2, false, false)), n2;
    }
    function v(t3) {
      try {
        return decodeURIComponent(t3);
      } catch {
        return t3.length > 3 ? t3.substr(0, 3) + v(t3.substr(3)) : t3;
      }
    }
    const b = /(%[0-9A-Za-z][0-9A-Za-z])+/g;
    function C(t3) {
      return t3.match(b) ? t3.replace(b, (t4) => v(t4)) : t3;
    }
    var A = r(470);
    const w = A.posix || A, x = "/";
    var P;
    !function(t3) {
      t3.joinPath = function(t4, ...e3) {
        return t4.with({ path: w.join(t4.path, ...e3) });
      }, t3.resolvePath = function(t4, ...e3) {
        let r2 = t4.path, n2 = false;
        r2[0] !== x && (r2 = x + r2, n2 = true);
        let i2 = w.resolve(r2, ...e3);
        return n2 && i2[0] === x && !t4.authority && (i2 = i2.substring(1)), t4.with({ path: i2 });
      }, t3.dirname = function(t4) {
        if (0 === t4.path.length || t4.path === x) return t4;
        let e3 = w.dirname(t4.path);
        return 1 === e3.length && 46 === e3.charCodeAt(0) && (e3 = ""), t4.with({ path: e3 });
      }, t3.basename = function(t4) {
        return w.basename(t4.path);
      }, t3.extname = function(t4) {
        return w.extname(t4.path);
      };
    }(P || (P = {}));
  })(), LIB = n;
})();
var { URI, Utils } = LIB;

// ../cursorless-everywhere-talon-core/src/ide/createTextEditor.ts
var nextId = 0;
function createTextEditor(talon2, ide2, editorState) {
  const id2 = String(nextId++);
  const uri = URI.parse(`talon-js://${id2}`);
  const languageId = editorState.languageId ?? "plaintext";
  const document = new InMemoryTextDocument(uri, languageId, editorState.text);
  const visibleRanges = [document.range];
  const selections = editorState.selections.map(
    (selection) => createSelection(document, selection)
  );
  return new TalonJsEditor(talon2, ide2, id2, document, visibleRanges, selections);
}
function createSelection(document, selection) {
  const anchor = document.positionAt(selection.anchor);
  const active = document.positionAt(selection.active);
  return new Selection(anchor, active);
}

// ../cursorless-everywhere-talon-core/src/ide/TalonJsKeyValueStore.ts
var TalonJsKeyValueStore = class {
  get(_key) {
    throw new Error("state.get not implemented.");
  }
  async set(_key, _value) {
    throw new Error("state.set not implemented.");
  }
};

// ../cursorless-everywhere-talon-core/src/ide/TalonJsIDE.ts
var TalonJsIDE = class {
  constructor(talon2, runMode) {
    this.talon = talon2;
    this.runMode = runMode;
    this.configuration = new TalonJsConfiguration();
    this.messages = new TalonJsMessages(talon2);
    this.keyValueStore = new TalonJsKeyValueStore();
    this.clipboard = new TalonJsClipboard(talon2);
    this.capabilities = new TalonJsCapabilities();
  }
  configuration;
  messages;
  keyValueStore;
  clipboard;
  capabilities;
  disposables = [];
  editors = [];
  onDidChangeTextDocumentNotifier = new Notifier();
  get assetsRoot() {
    throw new Error("assetsRoot not implemented.");
  }
  get cursorlessVersion() {
    throw new Error("cursorlessVersion not implemented.");
  }
  get workspaceFolders() {
    throw new Error("workspaceFolders not implemented.");
  }
  get activeTextEditor() {
    return this.activeEditableTextEditor;
  }
  get activeEditableTextEditor() {
    return this.editors[0];
  }
  get visibleTextEditors() {
    return this.editors;
  }
  getEditableTextEditor(editor) {
    if (editor instanceof TalonJsEditor) {
      return editor;
    }
    throw Error(`Unsupported text editor type: ${editor}`);
  }
  updateTextEditors(editorState) {
    this.editors = [createTextEditor(this.talon, this, editorState)];
  }
  async findInDocument(query, editor) {
    if (editor != null) {
      throw new Error(
        "findInDocument not implemented for other than active editor."
      );
    }
    this.talon.actions.edit.find(query);
  }
  findInWorkspace(_query) {
    throw new Error("findInWorkspace not implemented.");
  }
  openTextDocument(_path) {
    throw new Error("openTextDocument not implemented.");
  }
  openUntitledTextDocument(_options) {
    throw new Error("openUntitledTextDocument not implemented.");
  }
  showInputBox(_options) {
    throw new Error("showInputBox not implemented.");
  }
  showQuickPick(_items, _options) {
    throw new Error("showQuickPick not implemented.");
  }
  executeCommand(_command, ..._args) {
    throw new Error("executeCommand not implemented.");
  }
  flashRanges(_flashDescriptors) {
    return Promise.resolve();
  }
  setHighlightRanges(_highlightId, _editor, _ranges) {
    throw new Error("setHighlightRanges not implemented.");
  }
  onDidChangeTextDocument(listener) {
    return this.onDidChangeTextDocumentNotifier.registerListener(listener);
  }
  emitDidChangeTextDocument(event) {
    this.onDidChangeTextDocumentNotifier.notifyListeners(event);
  }
  onDidOpenTextDocument(_listener) {
    return { dispose: () => {
    } };
  }
  onDidCloseTextDocument(_listener) {
    return { dispose: () => {
    } };
  }
  onDidChangeActiveTextEditor(_listener) {
    return { dispose: () => {
    } };
  }
  onDidChangeVisibleTextEditors(_listener) {
    return { dispose: () => {
    } };
  }
  onDidChangeTextEditorSelection(_listener) {
    return { dispose: () => {
    } };
  }
  onDidChangeTextEditorVisibleRanges(_listener) {
    return { dispose: () => {
    } };
  }
  disposeOnExit(...disposables) {
    this.disposables.push(...disposables);
    return () => pull_default(this.disposables, ...disposables);
  }
};

// ../cursorless-everywhere-talon-core/src/ide/TalonJsTestHats.ts
var HAT_COLORS = [
  "default",
  "blue",
  "green",
  "red",
  "pink",
  "yellow"
];
var TalonJsTestHats = class {
  isEnabled = true;
  hatRanges = [];
  enabledHatStyles = Object.fromEntries(
    HAT_COLORS.map((color) => [
      color,
      { penalty: color === "default" ? 0 : 1 }
    ])
  );
  async setHatRanges(hatRanges) {
    this.hatRanges = hatRanges;
  }
  onDidChangeEnabledHatStyles(_listener) {
    return { dispose: () => {
    } };
  }
  onDidChangeIsEnabled(_listener) {
    return { dispose: () => {
    } };
  }
};

// ../cursorless-everywhere-talon-core/src/registerCommands.ts
function registerCommands(talon2, ide2, commandApi) {
  const ctx = new talon2.Context();
  ctx.matches = "tag: user.cursorless_everywhere_talon";
  let lastCommandResponse = null;
  ctx.action_class("user", {
    async private_cursorless_talonjs_run_and_wait(commandId, command) {
      lastCommandResponse = await runCommand2(commandId, command);
    },
    private_cursorless_talonjs_run_no_wait(commandId, command) {
      void runCommand2(commandId, command);
      lastCommandResponse = null;
    },
    private_cursorless_talonjs_get_response_json() {
      return JSON.stringify(lastCommandResponse);
    }
  });
  async function runCommand2(commandId, command) {
    try {
      if (commandId !== CURSORLESS_COMMAND_ID) {
        throw Error(`Unknown command ID: ${commandId}`);
      }
      const editorState = talon2.actions.user.cursorless_everywhere_get_editor_state();
      ide2.updateTextEditors(editorState);
      return await commandApi.runCommandSafe(command);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

// ../cursorless-everywhere-talon-core/src/extension.ts
async function activate(talon2, runMode) {
  try {
    return await activateHelper(talon2, runMode);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
async function activateHelper(talon2, runMode) {
  console.debug(`activate talon.js @ ${runMode}`);
  const isTesting = runMode === "test";
  const talonJsIDE = new TalonJsIDE(talon2, runMode);
  const commandServerApi = isTesting ? new FakeCommandServerApi() : void 0;
  const hats = isTesting ? new TalonJsTestHats() : void 0;
  const normalizedIde = runMode === "production" ? talonJsIDE : new NormalizedIDE(talonJsIDE, new FakeIDE(), isTesting);
  const { commandApi, injectIde: injectIde2, hatTokenMap, storedTargets } = await createCursorlessEngine({
    ide: normalizedIde,
    commandServerApi,
    hats
  });
  registerCommands(talon2, talonJsIDE, commandApi);
  const testHelpers = isTesting ? constructTestHelpers({
    talonJsIDE,
    normalizedIde,
    injectIde: injectIde2,
    commandApi,
    hatTokenMap,
    commandServerApi,
    storedTargets
  }) : void 0;
  console.debug("talon.js activated");
  return { testHelpers };
}

// src/extension.ts
import * as talon from "talon";
async function activate2(runMode) {
  await activate(talon, runMode);
}

// src/mainDevelopment.ts
await activate2("development");
/*! Bundled license information:

lodash-es/lodash.js:
  (**
   * @license
   * Lodash (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="es" -o ./`
   * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   *)

js-yaml/dist/js-yaml.mjs:
  (*! js-yaml 4.1.0 https://github.com/nodeca/js-yaml @license MIT *)

itertools/dist/index.js:
  (* istanbul ignore else -- @preserve *)
  (* istanbul ignore if -- @preserve *)
*/
//# sourceMappingURL=talon.js.map
