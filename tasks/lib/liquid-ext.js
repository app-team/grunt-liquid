(function() {
  var Liquid, Q,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Q = require('q');

  module.exports = Liquid = require('liquid-node');

  // (function() {
    Liquid.Template.registerFilter({
      asset_url: function (input) {
        return 'assets/'+input;
      },
      stylesheet_tag: function (input) {
        return '<link href="'+input+'" type="text/css" rel="stylesheet">';
      },
      script_tag: function (input) {
        return '<script src="'+input+'"></script>';
      }
    });

  // }).call(this);

  Liquid.Template.registerTag("block", (function() {
    var BlockBlock;
    return BlockBlock = (function(_super) {
      var Syntax, SyntaxHelp;

      __extends(BlockBlock, _super);

      Syntax = /(\w+)/;

      SyntaxHelp = "Syntax Error in 'block' - Valid syntax: block [templateName]";

      function BlockBlock(tagName, markup, tokens, template) {
        var match;
        match = Syntax.exec(markup);
        if (!match) {
          throw new Liquid.SyntaxError(SyntaxHelp);
        }
        template.exportedBlocks || (template.exportedBlocks = {});
        template.exportedBlocks[match[1]] = this;
        BlockBlock.__super__.constructor.apply(this, arguments);
      }

      BlockBlock.prototype.replace = function(block) {
        return this.nodelist = block.nodelist;
      };

      return BlockBlock;

    })(Liquid.Block);
  })());

  Liquid.Template.registerTag("layout", (function() {
    var LayoutTag;
    return LayoutTag = (function(_super) {
      var Syntax, SyntaxHelp;

      __extends(LayoutTag, _super);

      Syntax = /([a-z0-9\/\\_-]+)/i;

      SyntaxHelp = "Syntax Error in 'layout' - Valid syntax: layout [templateName]";

      function LayoutTag(tagName, markup, tokens, template) {
        var match;
        match = Syntax.exec(markup);
        if (!match) {
          throw new Liquid.SyntaxError(SyntaxHelp);
        }
        template["layout"] = match[1];
        console.log('layouts/'+match[1]);
        LayoutTag.__super__.constructor.apply(this, arguments);
      }

      LayoutTag.prototype.render = function(context) {
        return "";
      };

      return LayoutTag;

    })(Liquid.Tag);
  })());

  Liquid.Template.registerTag("include", (function() {
    var IncludeTag;
    return IncludeTag = (function(_super) {
      var Syntax, SyntaxHelp;

      __extends(IncludeTag, _super);

      Syntax = /([a-z0-9\/\\_-]+)/i;

      SyntaxHelp = "Syntax Error in 'include' - Valid syntax: include [templateName]";

      function IncludeTag(tagName, markup, tokens, template) {
        var deferred, match;
        match = Syntax.exec(markup);
        if (!match) {
          throw new Liquid.SyntaxError(SyntaxHelp);
        }
        this.filepath = match[1];
        deferred = Q.defer();
        this.included = deferred.promise;
        var that =  this;
        template.importer(this.filepath, function(err, src) {
          var subTemplate;
          subTemplate = Liquid.Template.extParse(src, template.importer);
          return subTemplate.then(function(t) {
            return deferred.resolve(t);
          });
        });
        IncludeTag.__super__.constructor.apply(this, arguments);
      }

      IncludeTag.prototype.render = function(context) {
        return this.included.then(function(i) {
          return i.render(context);
        });
      };

      return IncludeTag;

    })(Liquid.Tag);
  })());

  Liquid.Template.extParse = function(src, importer) {
    var baseTemplate, deferred, depth, stack, walker;
    baseTemplate = new Liquid.Template;
    baseTemplate.importer = importer;
    baseTemplate.parse(src);
    if (!baseTemplate["layout"]) {
      return Q(baseTemplate);
    }
    stack = [baseTemplate];
    depth = 0;
    deferred = Q.defer();
    walker = function(tmpl, cb) {
      if (!tmpl["layout"]) {
        return cb();
      }
      return tmpl.importer(tmpl["layout"], function(err, data) {
        if (err) {
          return cb(err);
        }
        if (depth > 100) {
          return cb("too many `layout`");
        }
        depth++;
        return Liquid.Template.extParse(data, importer).then(function(subTemplate) {
          stack.unshift(subTemplate);
          return walker(subTemplate, cb);
        }).fail(function(err) {
          return cb(err != null ? err : "Failed to parse template.");
        });
      });
    };
    walker(stack[0], (function(_this) {
      return function(err) {
        var rootTemplate, subTemplates;
        if (err) {
          return deferred.reject(err);
        }
        rootTemplate = stack[0], subTemplates = 2 <= stack.length ? __slice.call(stack, 1) : [];
        subTemplates.forEach(function(subTemplate) {
          var k, rootTemplateBlocks, subTemplateBlocks, v, _ref, _results;
          subTemplateBlocks = subTemplate.exportedBlocks || {};
          rootTemplateBlocks = rootTemplate.exportedBlocks || {};
          _results = [];
          for (k in subTemplateBlocks) {
            if (!__hasProp.call(subTemplateBlocks, k)) continue;
            v = subTemplateBlocks[k];
            _results.push((_ref = rootTemplateBlocks[k]) != null ? _ref.replace(v) : void 0);
          }
          return _results;
        });
        return deferred.resolve(rootTemplate);
      };
    })(this));
    return deferred.promise;
  };

}).call(this);
