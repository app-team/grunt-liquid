(function() {
  var path;

  path = require("path");

  module.exports = function(grunt) {
    var Liquid;
    Liquid = require("./lib/liquid-ext");
    return grunt.registerMultiTask("liquid", "Compile liquid templates.", function() {
      var done, options;
      done = this.async();
      options = this.options({
        includes: ""
      });
      grunt.verbose.writeflags(options, "Options");
      return this.files.forEach(function(fp) {
        console.log(fp.src);
        var content, dir, ext, parsePromise, srcFiles;
        srcFiles = fp.src;
        content = grunt.file.read(srcFiles);
        ext = path.extname(srcFiles);
        dir = path.dirname(fp.src);
        parsePromise = Liquid.Template.extParse(content, function(subFilepath, cb) {
          var found, includes;
          includes = options.includes;
          if (!Array.isArray(includes)) {
            includes = [includes];
          }
          found = false;
          includes.some(function(include) {
            var includePath;
            includePath = path.join(include, subFilepath + ext);
            if (grunt.file.exists(includePath)) {
              found = true;
              cb(null, grunt.file.read(includePath));
            }
            return found;
          });
          if (!found) {
            return cb("Not found.");
          }
        });
        parsePromise.then(function(template) {
          return template.render(options).then(function(output) {
            grunt.file.write(fp.dest, output);
            return grunt.log.writeln("File \"" + fp.dest + "\" created.");
          })["catch"](function(e) {
            return grunt.log.warn(e);
          })["finally"](done);
        });
        return parsePromise["catch"](function(e) {
          grunt.log.error(e);
          grunt.fail.warn("Liquid failed to compile " + srcFiles + ".");
          return done();
        });
      });
    });
  };

}).call(this);
