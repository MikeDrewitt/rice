(function() {
  var Module, Range, cache, isAbsolute, isCorePath, loadDependencies, loadExtensions, loadFolderCompatibility, nativeModules, originalFindPath, originalLoad, originalRequire, path, registerBuiltins, resolveFilePath, resolveModulePath, satisfies, semver,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Module = require('module');

  path = require('path');

  semver = require('semver');

  Range = (function(superClass) {
    extend(Range, superClass);

    function Range() {
      Range.__super__.constructor.apply(this, arguments);
      this.matchedVersions = new Set();
      this.unmatchedVersions = new Set();
    }

    Range.prototype.test = function(version) {
      var matches;
      if (this.matchedVersions.has(version)) {
        return true;
      }
      if (this.unmatchedVersions.has(version)) {
        return false;
      }
      matches = Range.__super__.test.apply(this, arguments);
      if (matches) {
        this.matchedVersions.add(version);
      } else {
        this.unmatchedVersions.add(version);
      }
      return matches;
    };

    return Range;

  })(semver.Range);

  nativeModules = process.binding('natives');

  cache = {
    builtins: {},
    debug: false,
    dependencies: {},
    extensions: {},
    folders: {},
    ranges: {},
    registered: false,
    resourcePath: null,
    resourcePathWithTrailingSlash: null
  };

  if (process.platform === 'win32') {
    isAbsolute = function(pathToCheck) {
      return pathToCheck && (pathToCheck[1] === ':' || (pathToCheck[0] === '\\' && pathToCheck[1] === '\\'));
    };
  } else {
    isAbsolute = function(pathToCheck) {
      return pathToCheck && pathToCheck[0] === '/';
    };
  }

  isCorePath = function(pathToCheck) {
    return pathToCheck.startsWith(cache.resourcePathWithTrailingSlash);
  };

  loadDependencies = function(modulePath, rootPath, rootMetadata, moduleCache) {
    var childMetadata, childMetadataPath, childPath, error, fs, i, len, mainPath, ref, ref1;
    fs = require('fs-plus');
    ref = fs.listSync(path.join(modulePath, 'node_modules'));
    for (i = 0, len = ref.length; i < len; i++) {
      childPath = ref[i];
      if (path.basename(childPath) === '.bin') {
        continue;
      }
      if (rootPath === modulePath && ((ref1 = rootMetadata.packageDependencies) != null ? ref1.hasOwnProperty(path.basename(childPath)) : void 0)) {
        continue;
      }
      childMetadataPath = path.join(childPath, 'package.json');
      if (!fs.isFileSync(childMetadataPath)) {
        continue;
      }
      childMetadata = JSON.parse(fs.readFileSync(childMetadataPath));
      if (childMetadata != null ? childMetadata.version : void 0) {
        try {
          mainPath = require.resolve(childPath);
        } catch (error1) {
          error = error1;
          mainPath = null;
        }
        if (mainPath) {
          moduleCache.dependencies.push({
            name: childMetadata.name,
            version: childMetadata.version,
            path: path.relative(rootPath, mainPath)
          });
        }
        loadDependencies(childPath, rootPath, rootMetadata, moduleCache);
      }
    }
  };

  loadFolderCompatibility = function(modulePath, rootPath, rootMetadata, moduleCache) {
    var childPath, dependencies, error, extensions, fs, i, len, metadataPath, name, onDirectory, onFile, paths, ref, ref1, ref2, ref3, version;
    fs = require('fs-plus');
    metadataPath = path.join(modulePath, 'package.json');
    if (!fs.isFileSync(metadataPath)) {
      return;
    }
    dependencies = (ref = (ref1 = JSON.parse(fs.readFileSync(metadataPath))) != null ? ref1.dependencies : void 0) != null ? ref : {};
    for (name in dependencies) {
      version = dependencies[name];
      try {
        new Range(version);
      } catch (error1) {
        error = error1;
        delete dependencies[name];
      }
    }
    onDirectory = function(childPath) {
      return path.basename(childPath) !== 'node_modules';
    };
    extensions = ['.js', '.coffee', '.json', '.node'];
    paths = {};
    onFile = function(childPath) {
      var ref2, relativePath;
      if (ref2 = path.extname(childPath), indexOf.call(extensions, ref2) >= 0) {
        relativePath = path.relative(rootPath, path.dirname(childPath));
        return paths[relativePath] = true;
      }
    };
    fs.traverseTreeSync(modulePath, onFile, onDirectory);
    paths = Object.keys(paths);
    if (paths.length > 0 && Object.keys(dependencies).length > 0) {
      moduleCache.folders.push({
        paths: paths,
        dependencies: dependencies
      });
    }
    ref2 = fs.listSync(path.join(modulePath, 'node_modules'));
    for (i = 0, len = ref2.length; i < len; i++) {
      childPath = ref2[i];
      if (path.basename(childPath) === '.bin') {
        continue;
      }
      if (rootPath === modulePath && ((ref3 = rootMetadata.packageDependencies) != null ? ref3.hasOwnProperty(path.basename(childPath)) : void 0)) {
        continue;
      }
      loadFolderCompatibility(childPath, rootPath, rootMetadata, moduleCache);
    }
  };

  loadExtensions = function(modulePath, rootPath, rootMetadata, moduleCache) {
    var extensions, fs, nodeModulesPath, onDirectory, onFile;
    fs = require('fs-plus');
    extensions = ['.js', '.coffee', '.json', '.node'];
    nodeModulesPath = path.join(rootPath, 'node_modules');
    onFile = function(filePath) {
      var base, extension, ref, segments;
      filePath = path.relative(rootPath, filePath);
      segments = filePath.split(path.sep);
      if (indexOf.call(segments, 'test') >= 0) {
        return;
      }
      if (indexOf.call(segments, 'tests') >= 0) {
        return;
      }
      if (indexOf.call(segments, 'spec') >= 0) {
        return;
      }
      if (indexOf.call(segments, 'specs') >= 0) {
        return;
      }
      if (segments.length > 1 && !((ref = segments[0]) === 'exports' || ref === 'lib' || ref === 'node_modules' || ref === 'src' || ref === 'static' || ref === 'vendor')) {
        return;
      }
      extension = path.extname(filePath);
      if (indexOf.call(extensions, extension) >= 0) {
        if ((base = moduleCache.extensions)[extension] == null) {
          base[extension] = [];
        }
        return moduleCache.extensions[extension].push(filePath);
      }
    };
    onDirectory = function(childPath) {
      var packageName, parentPath, ref;
      if (rootMetadata.name === 'atom') {
        parentPath = path.dirname(childPath);
        if (parentPath === nodeModulesPath) {
          packageName = path.basename(childPath);
          if ((ref = rootMetadata.packageDependencies) != null ? ref.hasOwnProperty(packageName) : void 0) {
            return false;
          }
        }
      }
      return true;
    };
    fs.traverseTreeSync(rootPath, onFile, onDirectory);
  };

  satisfies = function(version, rawRange) {
    var parsedRange;
    if (!(parsedRange = cache.ranges[rawRange])) {
      parsedRange = new Range(rawRange);
      cache.ranges[rawRange] = parsedRange;
    }
    return parsedRange.test(version);
  };

  resolveFilePath = function(relativePath, parentModule) {
    var extension, paths, ref, ref1, resolvedPath, resolvedPathWithExtension;
    if (!relativePath) {
      return;
    }
    if (!(parentModule != null ? parentModule.filename : void 0)) {
      return;
    }
    if (!(relativePath[0] === '.' || isAbsolute(relativePath))) {
      return;
    }
    resolvedPath = path.resolve(path.dirname(parentModule.filename), relativePath);
    if (!isCorePath(resolvedPath)) {
      return;
    }
    extension = path.extname(resolvedPath);
    if (extension) {
      if ((ref = cache.extensions[extension]) != null ? ref.has(resolvedPath) : void 0) {
        return resolvedPath;
      }
    } else {
      ref1 = cache.extensions;
      for (extension in ref1) {
        paths = ref1[extension];
        resolvedPathWithExtension = "" + resolvedPath + extension;
        if (paths.has(resolvedPathWithExtension)) {
          return resolvedPathWithExtension;
        }
      }
    }
  };

  resolveModulePath = function(relativePath, parentModule) {
    var builtinPath, candidates, folderPath, range, ref, resolvedPath, version;
    if (!relativePath) {
      return;
    }
    if (!(parentModule != null ? parentModule.filename : void 0)) {
      return;
    }
    if (nativeModules.hasOwnProperty(relativePath)) {
      return;
    }
    if (relativePath[0] === '.') {
      return;
    }
    if (isAbsolute(relativePath)) {
      return;
    }
    folderPath = path.dirname(parentModule.filename);
    range = (ref = cache.folders[folderPath]) != null ? ref[relativePath] : void 0;
    if (range == null) {
      if (builtinPath = cache.builtins[relativePath]) {
        return builtinPath;
      } else {
        return;
      }
    }
    candidates = cache.dependencies[relativePath];
    if (candidates == null) {
      return;
    }
    for (version in candidates) {
      resolvedPath = candidates[version];
      if (Module._cache.hasOwnProperty(resolvedPath) || isCorePath(resolvedPath)) {
        if (satisfies(version, range)) {
          return resolvedPath;
        }
      }
    }
  };

  registerBuiltins = function(devMode) {
    var atomJsPath, base, builtin, commonBuiltins, commonRoot, electronAsarRoot, fs, i, j, len, len1, rendererBuiltins, rendererRoot, results;
    if (devMode || !cache.resourcePath.startsWith("" + process.resourcesPath + path.sep)) {
      fs = require('fs-plus');
      atomJsPath = path.join(cache.resourcePath, 'exports', 'atom.js');
      if (fs.isFileSync(atomJsPath)) {
        cache.builtins.atom = atomJsPath;
      }
    }
    if ((base = cache.builtins).atom == null) {
      base.atom = path.join(cache.resourcePath, 'exports', 'atom.js');
    }
    electronAsarRoot = path.join(process.resourcesPath, 'electron.asar');
    commonRoot = path.join(electronAsarRoot, 'common', 'api');
    commonBuiltins = ['callbacks-registry', 'clipboard', 'crash-reporter', 'shell'];
    for (i = 0, len = commonBuiltins.length; i < len; i++) {
      builtin = commonBuiltins[i];
      cache.builtins[builtin] = path.join(commonRoot, builtin + ".js");
    }
    rendererRoot = path.join(electronAsarRoot, 'renderer', 'api');
    rendererBuiltins = ['ipc-renderer', 'remote', 'screen'];
    results = [];
    for (j = 0, len1 = rendererBuiltins.length; j < len1; j++) {
      builtin = rendererBuiltins[j];
      results.push(cache.builtins[builtin] = path.join(rendererRoot, builtin + ".js"));
    }
    return results;
  };

  if (cache.debug) {
    cache.findPathCount = 0;
    cache.findPathTime = 0;
    cache.loadCount = 0;
    cache.requireTime = 0;
    global.moduleCache = cache;
    originalLoad = Module.prototype.load;
    Module.prototype.load = function() {
      cache.loadCount++;
      return originalLoad.apply(this, arguments);
    };
    originalRequire = Module.prototype.require;
    Module.prototype.require = function() {
      var exports, startTime;
      startTime = Date.now();
      exports = originalRequire.apply(this, arguments);
      cache.requireTime += Date.now() - startTime;
      return exports;
    };
    originalFindPath = Module._findPath;
    Module._findPath = function(request, paths) {
      var cacheKey, foundPath, startTime;
      cacheKey = JSON.stringify({
        request: request,
        paths: paths
      });
      if (!Module._pathCache[cacheKey]) {
        cache.findPathCount++;
      }
      startTime = Date.now();
      foundPath = originalFindPath.apply(global, arguments);
      cache.findPathTime += Date.now() - startTime;
      return foundPath;
    };
  }

  exports.create = function(modulePath) {
    var fs, metadata, metadataPath, moduleCache;
    fs = require('fs-plus');
    modulePath = fs.realpathSync(modulePath);
    metadataPath = path.join(modulePath, 'package.json');
    metadata = JSON.parse(fs.readFileSync(metadataPath));
    moduleCache = {
      version: 1,
      dependencies: [],
      extensions: {},
      folders: []
    };
    loadDependencies(modulePath, modulePath, metadata, moduleCache);
    loadFolderCompatibility(modulePath, modulePath, metadata, moduleCache);
    loadExtensions(modulePath, modulePath, metadata, moduleCache);
    metadata._atomModuleCache = moduleCache;
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  };

  exports.register = function(arg) {
    var devMode, originalResolveFilename, ref, resourcePath;
    ref = arg != null ? arg : {}, resourcePath = ref.resourcePath, devMode = ref.devMode;
    if (cache.registered) {
      return;
    }
    originalResolveFilename = Module._resolveFilename;
    Module._resolveFilename = function(relativePath, parentModule) {
      var resolvedPath;
      resolvedPath = resolveModulePath(relativePath, parentModule);
      if (resolvedPath == null) {
        resolvedPath = resolveFilePath(relativePath, parentModule);
      }
      return resolvedPath != null ? resolvedPath : originalResolveFilename(relativePath, parentModule);
    };
    cache.registered = true;
    cache.resourcePath = resourcePath;
    cache.resourcePathWithTrailingSlash = "" + resourcePath + path.sep;
    registerBuiltins(devMode);
  };

  exports.add = function(directoryPath, metadata) {
    var base, base1, base2, cacheToAdd, dependency, entry, error, extension, filePath, folderPath, i, j, k, l, len, len1, len2, len3, name1, name2, paths, ref, ref1, ref2, ref3, ref4, ref5;
    if (metadata == null) {
      try {
        metadata = require("" + directoryPath + path.sep + "package.json");
      } catch (error1) {
        error = error1;
        return;
      }
    }
    cacheToAdd = metadata != null ? metadata._atomModuleCache : void 0;
    if (cacheToAdd == null) {
      return;
    }
    ref1 = (ref = cacheToAdd.dependencies) != null ? ref : [];
    for (i = 0, len = ref1.length; i < len; i++) {
      dependency = ref1[i];
      if ((base = cache.dependencies)[name1 = dependency.name] == null) {
        base[name1] = {};
      }
      if ((base1 = cache.dependencies[dependency.name])[name2 = dependency.version] == null) {
        base1[name2] = "" + directoryPath + path.sep + dependency.path;
      }
    }
    ref3 = (ref2 = cacheToAdd.folders) != null ? ref2 : [];
    for (j = 0, len1 = ref3.length; j < len1; j++) {
      entry = ref3[j];
      ref4 = entry.paths;
      for (k = 0, len2 = ref4.length; k < len2; k++) {
        folderPath = ref4[k];
        if (folderPath) {
          cache.folders["" + directoryPath + path.sep + folderPath] = entry.dependencies;
        } else {
          cache.folders[directoryPath] = entry.dependencies;
        }
      }
    }
    ref5 = cacheToAdd.extensions;
    for (extension in ref5) {
      paths = ref5[extension];
      if ((base2 = cache.extensions)[extension] == null) {
        base2[extension] = new Set();
      }
      for (l = 0, len3 = paths.length; l < len3; l++) {
        filePath = paths[l];
        cache.extensions[extension].add("" + directoryPath + path.sep + filePath);
      }
    }
  };

  exports.cache = cache;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9tb2R1bGUtY2FjaGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxzUEFBQTtJQUFBOzs7O0VBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztFQUNULElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxNQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0VBR0g7OztJQUNTLGVBQUE7TUFDWCx3Q0FBQSxTQUFBO01BQ0EsSUFBQyxDQUFBLGVBQUQsR0FBdUIsSUFBQSxHQUFBLENBQUE7TUFDdkIsSUFBQyxDQUFBLGlCQUFELEdBQXlCLElBQUEsR0FBQSxDQUFBO0lBSGQ7O29CQUtiLElBQUEsR0FBTSxTQUFDLE9BQUQ7QUFDSixVQUFBO01BQUEsSUFBZSxJQUFDLENBQUEsZUFBZSxDQUFDLEdBQWpCLENBQXFCLE9BQXJCLENBQWY7QUFBQSxlQUFPLEtBQVA7O01BQ0EsSUFBZ0IsSUFBQyxDQUFBLGlCQUFpQixDQUFDLEdBQW5CLENBQXVCLE9BQXZCLENBQWhCO0FBQUEsZUFBTyxNQUFQOztNQUVBLE9BQUEsR0FBVSxpQ0FBQSxTQUFBO01BQ1YsSUFBRyxPQUFIO1FBQ0UsSUFBQyxDQUFBLGVBQWUsQ0FBQyxHQUFqQixDQUFxQixPQUFyQixFQURGO09BQUEsTUFBQTtRQUdFLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxHQUFuQixDQUF1QixPQUF2QixFQUhGOzthQUlBO0lBVEk7Ozs7S0FOWSxNQUFNLENBQUM7O0VBaUIzQixhQUFBLEdBQWdCLE9BQU8sQ0FBQyxPQUFSLENBQWdCLFNBQWhCOztFQUVoQixLQUFBLEdBQ0U7SUFBQSxRQUFBLEVBQVUsRUFBVjtJQUNBLEtBQUEsRUFBTyxLQURQO0lBRUEsWUFBQSxFQUFjLEVBRmQ7SUFHQSxVQUFBLEVBQVks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QUEsU0FBQSxJQUFrQixJQUFBLEdBQUEsQ0FBQTs7QUFDbkMsV0FBQSx5Q0FBQTs7UUFDRSxLQUFLLENBQUMsVUFBVyxDQUFBLFNBQUEsQ0FBVSxDQUFDLEdBQTVCLENBQWdDLEVBQUEsR0FBRyxhQUFILEdBQW1CLElBQUksQ0FBQyxHQUF4QixHQUE4QixRQUE5RDtBQURGO0FBRkY7RUF4Qlk7O0VBK0JkLE9BQU8sQ0FBQyxLQUFSLEdBQWdCO0FBeFRoQiIsInNvdXJjZXNDb250ZW50IjpbIk1vZHVsZSA9IHJlcXVpcmUgJ21vZHVsZSdcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuc2VtdmVyID0gcmVxdWlyZSAnc2VtdmVyJ1xuXG4jIEV4dGVuZCBzZW12ZXIuUmFuZ2UgdG8gbWVtb2l6ZSBtYXRjaGVkIHZlcnNpb25zIGZvciBzcGVlZFxuY2xhc3MgUmFuZ2UgZXh0ZW5kcyBzZW12ZXIuUmFuZ2VcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgc3VwZXJcbiAgICBAbWF0Y2hlZFZlcnNpb25zID0gbmV3IFNldCgpXG4gICAgQHVubWF0Y2hlZFZlcnNpb25zID0gbmV3IFNldCgpXG5cbiAgdGVzdDogKHZlcnNpb24pIC0+XG4gICAgcmV0dXJuIHRydWUgaWYgQG1hdGNoZWRWZXJzaW9ucy5oYXModmVyc2lvbilcbiAgICByZXR1cm4gZmFsc2UgaWYgQHVubWF0Y2hlZFZlcnNpb25zLmhhcyh2ZXJzaW9uKVxuXG4gICAgbWF0Y2hlcyA9IHN1cGVyXG4gICAgaWYgbWF0Y2hlc1xuICAgICAgQG1hdGNoZWRWZXJzaW9ucy5hZGQodmVyc2lvbilcbiAgICBlbHNlXG4gICAgICBAdW5tYXRjaGVkVmVyc2lvbnMuYWRkKHZlcnNpb24pXG4gICAgbWF0Y2hlc1xuXG5uYXRpdmVNb2R1bGVzID0gcHJvY2Vzcy5iaW5kaW5nKCduYXRpdmVzJylcblxuY2FjaGUgPVxuICBidWlsdGluczoge31cbiAgZGVidWc6IGZhbHNlXG4gIGRlcGVuZGVuY2llczoge31cbiAgZXh0ZW5zaW9uczoge31cbiAgZm9sZGVyczoge31cbiAgcmFuZ2VzOiB7fVxuICByZWdpc3RlcmVkOiBmYWxzZVxuICByZXNvdXJjZVBhdGg6IG51bGxcbiAgcmVzb3VyY2VQYXRoV2l0aFRyYWlsaW5nU2xhc2g6IG51bGxcblxuIyBpc0Fic29sdXRlIGlzIGlubGluZWQgZnJvbSBmcy1wbHVzIHNvIHRoYXQgZnMtcGx1cyBpdHNlbGYgY2FuIGJlIHJlcXVpcmVkXG4jIGZyb20gdGhpcyBjYWNoZS5cbmlmIHByb2Nlc3MucGxhdGZvcm0gaXMgJ3dpbjMyJ1xuICBpc0Fic29sdXRlID0gKHBhdGhUb0NoZWNrKSAtPlxuICAgIHBhdGhUb0NoZWNrIGFuZCAocGF0aFRvQ2hlY2tbMV0gaXMgJzonIG9yIChwYXRoVG9DaGVja1swXSBpcyAnXFxcXCcgYW5kIHBhdGhUb0NoZWNrWzFdIGlzICdcXFxcJykpXG5lbHNlXG4gIGlzQWJzb2x1dGUgPSAocGF0aFRvQ2hlY2spIC0+XG4gICAgcGF0aFRvQ2hlY2sgYW5kIHBhdGhUb0NoZWNrWzBdIGlzICcvJ1xuXG5pc0NvcmVQYXRoID0gKHBhdGhUb0NoZWNrKSAtPlxuICBwYXRoVG9DaGVjay5zdGFydHNXaXRoKGNhY2hlLnJlc291cmNlUGF0aFdpdGhUcmFpbGluZ1NsYXNoKVxuXG5sb2FkRGVwZW5kZW5jaWVzID0gKG1vZHVsZVBhdGgsIHJvb3RQYXRoLCByb290TWV0YWRhdGEsIG1vZHVsZUNhY2hlKSAtPlxuICBmcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG5cbiAgZm9yIGNoaWxkUGF0aCBpbiBmcy5saXN0U3luYyhwYXRoLmpvaW4obW9kdWxlUGF0aCwgJ25vZGVfbW9kdWxlcycpKVxuICAgIGNvbnRpbnVlIGlmIHBhdGguYmFzZW5hbWUoY2hpbGRQYXRoKSBpcyAnLmJpbidcbiAgICBjb250aW51ZSBpZiByb290UGF0aCBpcyBtb2R1bGVQYXRoIGFuZCByb290TWV0YWRhdGEucGFja2FnZURlcGVuZGVuY2llcz8uaGFzT3duUHJvcGVydHkocGF0aC5iYXNlbmFtZShjaGlsZFBhdGgpKVxuXG4gICAgY2hpbGRNZXRhZGF0YVBhdGggPSBwYXRoLmpvaW4oY2hpbGRQYXRoLCAncGFja2FnZS5qc29uJylcbiAgICBjb250aW51ZSB1bmxlc3MgZnMuaXNGaWxlU3luYyhjaGlsZE1ldGFkYXRhUGF0aClcblxuICAgIGNoaWxkTWV0YWRhdGEgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhjaGlsZE1ldGFkYXRhUGF0aCkpXG4gICAgaWYgY2hpbGRNZXRhZGF0YT8udmVyc2lvblxuICAgICAgdHJ5XG4gICAgICAgIG1haW5QYXRoID0gcmVxdWlyZS5yZXNvbHZlKGNoaWxkUGF0aClcbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgIG1haW5QYXRoID0gbnVsbFxuXG4gICAgICBpZiBtYWluUGF0aFxuICAgICAgICBtb2R1bGVDYWNoZS5kZXBlbmRlbmNpZXMucHVzaFxuICAgICAgICAgIG5hbWU6IGNoaWxkTWV0YWRhdGEubmFtZVxuICAgICAgICAgIHZlcnNpb246IGNoaWxkTWV0YWRhdGEudmVyc2lvblxuICAgICAgICAgIHBhdGg6IHBhdGgucmVsYXRpdmUocm9vdFBhdGgsIG1haW5QYXRoKVxuXG4gICAgICBsb2FkRGVwZW5kZW5jaWVzKGNoaWxkUGF0aCwgcm9vdFBhdGgsIHJvb3RNZXRhZGF0YSwgbW9kdWxlQ2FjaGUpXG5cbiAgcmV0dXJuXG5cbmxvYWRGb2xkZXJDb21wYXRpYmlsaXR5ID0gKG1vZHVsZVBhdGgsIHJvb3RQYXRoLCByb290TWV0YWRhdGEsIG1vZHVsZUNhY2hlKSAtPlxuICBmcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG5cbiAgbWV0YWRhdGFQYXRoID0gcGF0aC5qb2luKG1vZHVsZVBhdGgsICdwYWNrYWdlLmpzb24nKVxuICByZXR1cm4gdW5sZXNzIGZzLmlzRmlsZVN5bmMobWV0YWRhdGFQYXRoKVxuXG4gIGRlcGVuZGVuY2llcyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKG1ldGFkYXRhUGF0aCkpPy5kZXBlbmRlbmNpZXMgPyB7fVxuXG4gIGZvciBuYW1lLCB2ZXJzaW9uIG9mIGRlcGVuZGVuY2llc1xuICAgIHRyeVxuICAgICAgbmV3IFJhbmdlKHZlcnNpb24pXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIGRlbGV0ZSBkZXBlbmRlbmNpZXNbbmFtZV1cblxuICBvbkRpcmVjdG9yeSA9IChjaGlsZFBhdGgpIC0+XG4gICAgcGF0aC5iYXNlbmFtZShjaGlsZFBhdGgpIGlzbnQgJ25vZGVfbW9kdWxlcydcblxuICBleHRlbnNpb25zID0gWycuanMnLCAnLmNvZmZlZScsICcuanNvbicsICcubm9kZSddXG4gIHBhdGhzID0ge31cbiAgb25GaWxlID0gKGNoaWxkUGF0aCkgLT5cbiAgICBpZiBwYXRoLmV4dG5hbWUoY2hpbGRQYXRoKSBpbiBleHRlbnNpb25zXG4gICAgICByZWxhdGl2ZVBhdGggPSBwYXRoLnJlbGF0aXZlKHJvb3RQYXRoLCBwYXRoLmRpcm5hbWUoY2hpbGRQYXRoKSlcbiAgICAgIHBhdGhzW3JlbGF0aXZlUGF0aF0gPSB0cnVlXG4gIGZzLnRyYXZlcnNlVHJlZVN5bmMobW9kdWxlUGF0aCwgb25GaWxlLCBvbkRpcmVjdG9yeSlcblxuICBwYXRocyA9IE9iamVjdC5rZXlzKHBhdGhzKVxuICBpZiBwYXRocy5sZW5ndGggPiAwIGFuZCBPYmplY3Qua2V5cyhkZXBlbmRlbmNpZXMpLmxlbmd0aCA+IDBcbiAgICBtb2R1bGVDYWNoZS5mb2xkZXJzLnB1c2goe3BhdGhzLCBkZXBlbmRlbmNpZXN9KVxuXG4gIGZvciBjaGlsZFBhdGggaW4gZnMubGlzdFN5bmMocGF0aC5qb2luKG1vZHVsZVBhdGgsICdub2RlX21vZHVsZXMnKSlcbiAgICBjb250aW51ZSBpZiBwYXRoLmJhc2VuYW1lKGNoaWxkUGF0aCkgaXMgJy5iaW4nXG4gICAgY29udGludWUgaWYgcm9vdFBhdGggaXMgbW9kdWxlUGF0aCBhbmQgcm9vdE1ldGFkYXRhLnBhY2thZ2VEZXBlbmRlbmNpZXM/Lmhhc093blByb3BlcnR5KHBhdGguYmFzZW5hbWUoY2hpbGRQYXRoKSlcblxuICAgIGxvYWRGb2xkZXJDb21wYXRpYmlsaXR5KGNoaWxkUGF0aCwgcm9vdFBhdGgsIHJvb3RNZXRhZGF0YSwgbW9kdWxlQ2FjaGUpXG5cbiAgcmV0dXJuXG5cbmxvYWRFeHRlbnNpb25zID0gKG1vZHVsZVBhdGgsIHJvb3RQYXRoLCByb290TWV0YWRhdGEsIG1vZHVsZUNhY2hlKSAtPlxuICBmcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG4gIGV4dGVuc2lvbnMgPSBbJy5qcycsICcuY29mZmVlJywgJy5qc29uJywgJy5ub2RlJ11cbiAgbm9kZU1vZHVsZXNQYXRoID0gcGF0aC5qb2luKHJvb3RQYXRoLCAnbm9kZV9tb2R1bGVzJylcblxuICBvbkZpbGUgPSAoZmlsZVBhdGgpIC0+XG4gICAgZmlsZVBhdGggPSBwYXRoLnJlbGF0aXZlKHJvb3RQYXRoLCBmaWxlUGF0aClcbiAgICBzZWdtZW50cyA9IGZpbGVQYXRoLnNwbGl0KHBhdGguc2VwKVxuICAgIHJldHVybiBpZiAndGVzdCcgaW4gc2VnbWVudHNcbiAgICByZXR1cm4gaWYgJ3Rlc3RzJyBpbiBzZWdtZW50c1xuICAgIHJldHVybiBpZiAnc3BlYycgaW4gc2VnbWVudHNcbiAgICByZXR1cm4gaWYgJ3NwZWNzJyBpbiBzZWdtZW50c1xuICAgIHJldHVybiBpZiBzZWdtZW50cy5sZW5ndGggPiAxIGFuZCBub3QgKHNlZ21lbnRzWzBdIGluIFsnZXhwb3J0cycsICdsaWInLCAnbm9kZV9tb2R1bGVzJywgJ3NyYycsICdzdGF0aWMnLCAndmVuZG9yJ10pXG5cbiAgICBleHRlbnNpb24gPSBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpXG4gICAgaWYgZXh0ZW5zaW9uIGluIGV4dGVuc2lvbnNcbiAgICAgIG1vZHVsZUNhY2hlLmV4dGVuc2lvbnNbZXh0ZW5zaW9uXSA/PSBbXVxuICAgICAgbW9kdWxlQ2FjaGUuZXh0ZW5zaW9uc1tleHRlbnNpb25dLnB1c2goZmlsZVBhdGgpXG5cbiAgb25EaXJlY3RvcnkgPSAoY2hpbGRQYXRoKSAtPlxuICAgICMgRG9uJ3QgaW5jbHVkZSBleHRlbnNpb25zwqBmcm9tIGJ1bmRsZWQgcGFja2FnZXNcbiAgICAjIFRoZXNlIGFyZSBnZW5lcmF0ZWQgYW5kIHN0b3JlZCBpbiB0aGUgcGFja2FnZSdzIG93biBtZXRhZGF0YSBjYWNoZVxuICAgIGlmIHJvb3RNZXRhZGF0YS5uYW1lIGlzICdhdG9tJ1xuICAgICAgcGFyZW50UGF0aCA9IHBhdGguZGlybmFtZShjaGlsZFBhdGgpXG4gICAgICBpZiBwYXJlbnRQYXRoIGlzIG5vZGVNb2R1bGVzUGF0aFxuICAgICAgICBwYWNrYWdlTmFtZSA9IHBhdGguYmFzZW5hbWUoY2hpbGRQYXRoKVxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgcm9vdE1ldGFkYXRhLnBhY2thZ2VEZXBlbmRlbmNpZXM/Lmhhc093blByb3BlcnR5KHBhY2thZ2VOYW1lKVxuXG4gICAgdHJ1ZVxuXG4gIGZzLnRyYXZlcnNlVHJlZVN5bmMocm9vdFBhdGgsIG9uRmlsZSwgb25EaXJlY3RvcnkpXG5cbiAgcmV0dXJuXG5cbnNhdGlzZmllcyA9ICh2ZXJzaW9uLCByYXdSYW5nZSkgLT5cbiAgdW5sZXNzIHBhcnNlZFJhbmdlID0gY2FjaGUucmFuZ2VzW3Jhd1JhbmdlXVxuICAgIHBhcnNlZFJhbmdlID0gbmV3IFJhbmdlKHJhd1JhbmdlKVxuICAgIGNhY2hlLnJhbmdlc1tyYXdSYW5nZV0gPSBwYXJzZWRSYW5nZVxuICBwYXJzZWRSYW5nZS50ZXN0KHZlcnNpb24pXG5cbnJlc29sdmVGaWxlUGF0aCA9IChyZWxhdGl2ZVBhdGgsIHBhcmVudE1vZHVsZSkgLT5cbiAgcmV0dXJuIHVubGVzcyByZWxhdGl2ZVBhdGhcbiAgcmV0dXJuIHVubGVzcyBwYXJlbnRNb2R1bGU/LmZpbGVuYW1lXG4gIHJldHVybiB1bmxlc3MgcmVsYXRpdmVQYXRoWzBdIGlzICcuJyBvciBpc0Fic29sdXRlKHJlbGF0aXZlUGF0aClcblxuICByZXNvbHZlZFBhdGggPSBwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKHBhcmVudE1vZHVsZS5maWxlbmFtZSksIHJlbGF0aXZlUGF0aClcbiAgcmV0dXJuIHVubGVzcyBpc0NvcmVQYXRoKHJlc29sdmVkUGF0aClcblxuICBleHRlbnNpb24gPSBwYXRoLmV4dG5hbWUocmVzb2x2ZWRQYXRoKVxuICBpZiBleHRlbnNpb25cbiAgICByZXR1cm4gcmVzb2x2ZWRQYXRoIGlmIGNhY2hlLmV4dGVuc2lvbnNbZXh0ZW5zaW9uXT8uaGFzKHJlc29sdmVkUGF0aClcbiAgZWxzZVxuICAgIGZvciBleHRlbnNpb24sIHBhdGhzIG9mIGNhY2hlLmV4dGVuc2lvbnNcbiAgICAgIHJlc29sdmVkUGF0aFdpdGhFeHRlbnNpb24gPSBcIiN7cmVzb2x2ZWRQYXRofSN7ZXh0ZW5zaW9ufVwiXG4gICAgICByZXR1cm4gcmVzb2x2ZWRQYXRoV2l0aEV4dGVuc2lvbiBpZiBwYXRocy5oYXMocmVzb2x2ZWRQYXRoV2l0aEV4dGVuc2lvbilcblxuICByZXR1cm5cblxucmVzb2x2ZU1vZHVsZVBhdGggPSAocmVsYXRpdmVQYXRoLCBwYXJlbnRNb2R1bGUpIC0+XG4gIHJldHVybiB1bmxlc3MgcmVsYXRpdmVQYXRoXG4gIHJldHVybiB1bmxlc3MgcGFyZW50TW9kdWxlPy5maWxlbmFtZVxuXG4gIHJldHVybiBpZiBuYXRpdmVNb2R1bGVzLmhhc093blByb3BlcnR5KHJlbGF0aXZlUGF0aClcbiAgcmV0dXJuIGlmIHJlbGF0aXZlUGF0aFswXSBpcyAnLidcbiAgcmV0dXJuIGlmIGlzQWJzb2x1dGUocmVsYXRpdmVQYXRoKVxuXG4gIGZvbGRlclBhdGggPSBwYXRoLmRpcm5hbWUocGFyZW50TW9kdWxlLmZpbGVuYW1lKVxuXG4gIHJhbmdlID0gY2FjaGUuZm9sZGVyc1tmb2xkZXJQYXRoXT9bcmVsYXRpdmVQYXRoXVxuICB1bmxlc3MgcmFuZ2U/XG4gICAgaWYgYnVpbHRpblBhdGggPSBjYWNoZS5idWlsdGluc1tyZWxhdGl2ZVBhdGhdXG4gICAgICByZXR1cm4gYnVpbHRpblBhdGhcbiAgICBlbHNlXG4gICAgICByZXR1cm5cblxuICBjYW5kaWRhdGVzID0gY2FjaGUuZGVwZW5kZW5jaWVzW3JlbGF0aXZlUGF0aF1cbiAgcmV0dXJuIHVubGVzcyBjYW5kaWRhdGVzP1xuXG4gIGZvciB2ZXJzaW9uLCByZXNvbHZlZFBhdGggb2YgY2FuZGlkYXRlc1xuICAgIGlmIE1vZHVsZS5fY2FjaGUuaGFzT3duUHJvcGVydHkocmVzb2x2ZWRQYXRoKSBvciBpc0NvcmVQYXRoKHJlc29sdmVkUGF0aClcbiAgICAgIHJldHVybiByZXNvbHZlZFBhdGggaWYgc2F0aXNmaWVzKHZlcnNpb24sIHJhbmdlKVxuXG4gIHJldHVyblxuXG5yZWdpc3RlckJ1aWx0aW5zID0gKGRldk1vZGUpIC0+XG4gIGlmIGRldk1vZGUgb3Igbm90IGNhY2hlLnJlc291cmNlUGF0aC5zdGFydHNXaXRoKFwiI3twcm9jZXNzLnJlc291cmNlc1BhdGh9I3twYXRoLnNlcH1cIilcbiAgICBmcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG4gICAgYXRvbUpzUGF0aCA9IHBhdGguam9pbihjYWNoZS5yZXNvdXJjZVBhdGgsICdleHBvcnRzJywgJ2F0b20uanMnKVxuICAgIGNhY2hlLmJ1aWx0aW5zLmF0b20gPSBhdG9tSnNQYXRoIGlmIGZzLmlzRmlsZVN5bmMoYXRvbUpzUGF0aClcbiAgY2FjaGUuYnVpbHRpbnMuYXRvbSA/PSBwYXRoLmpvaW4oY2FjaGUucmVzb3VyY2VQYXRoLCAnZXhwb3J0cycsICdhdG9tLmpzJylcblxuICBlbGVjdHJvbkFzYXJSb290ID0gcGF0aC5qb2luKHByb2Nlc3MucmVzb3VyY2VzUGF0aCwgJ2VsZWN0cm9uLmFzYXInKVxuXG4gIGNvbW1vblJvb3QgPSBwYXRoLmpvaW4oZWxlY3Ryb25Bc2FyUm9vdCwgJ2NvbW1vbicsICdhcGknKVxuICBjb21tb25CdWlsdGlucyA9IFsnY2FsbGJhY2tzLXJlZ2lzdHJ5JywgJ2NsaXBib2FyZCcsICdjcmFzaC1yZXBvcnRlcicsICdzaGVsbCddXG4gIGZvciBidWlsdGluIGluIGNvbW1vbkJ1aWx0aW5zXG4gICAgY2FjaGUuYnVpbHRpbnNbYnVpbHRpbl0gPSBwYXRoLmpvaW4oY29tbW9uUm9vdCwgXCIje2J1aWx0aW59LmpzXCIpXG5cbiAgcmVuZGVyZXJSb290ID0gcGF0aC5qb2luKGVsZWN0cm9uQXNhclJvb3QsICdyZW5kZXJlcicsICdhcGknKVxuICByZW5kZXJlckJ1aWx0aW5zID0gWydpcGMtcmVuZGVyZXInLCAncmVtb3RlJywgJ3NjcmVlbiddXG4gIGZvciBidWlsdGluIGluIHJlbmRlcmVyQnVpbHRpbnNcbiAgICBjYWNoZS5idWlsdGluc1tidWlsdGluXSA9IHBhdGguam9pbihyZW5kZXJlclJvb3QsIFwiI3tidWlsdGlufS5qc1wiKVxuXG5pZiBjYWNoZS5kZWJ1Z1xuICBjYWNoZS5maW5kUGF0aENvdW50ID0gMFxuICBjYWNoZS5maW5kUGF0aFRpbWUgPSAwXG4gIGNhY2hlLmxvYWRDb3VudCA9IDBcbiAgY2FjaGUucmVxdWlyZVRpbWUgPSAwXG4gIGdsb2JhbC5tb2R1bGVDYWNoZSA9IGNhY2hlXG5cbiAgb3JpZ2luYWxMb2FkID0gTW9kdWxlOjpsb2FkXG4gIE1vZHVsZTo6bG9hZCA9IC0+XG4gICAgY2FjaGUubG9hZENvdW50KytcbiAgICBvcmlnaW5hbExvYWQuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuXG4gIG9yaWdpbmFsUmVxdWlyZSA9IE1vZHVsZTo6cmVxdWlyZVxuICBNb2R1bGU6OnJlcXVpcmUgPSAtPlxuICAgIHN0YXJ0VGltZSA9IERhdGUubm93KClcbiAgICBleHBvcnRzID0gb3JpZ2luYWxSZXF1aXJlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICBjYWNoZS5yZXF1aXJlVGltZSArPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lXG4gICAgZXhwb3J0c1xuXG4gIG9yaWdpbmFsRmluZFBhdGggPSBNb2R1bGUuX2ZpbmRQYXRoXG4gIE1vZHVsZS5fZmluZFBhdGggPSAocmVxdWVzdCwgcGF0aHMpIC0+XG4gICAgY2FjaGVLZXkgPSBKU09OLnN0cmluZ2lmeSh7cmVxdWVzdCwgcGF0aHN9KVxuICAgIGNhY2hlLmZpbmRQYXRoQ291bnQrKyB1bmxlc3MgTW9kdWxlLl9wYXRoQ2FjaGVbY2FjaGVLZXldXG5cbiAgICBzdGFydFRpbWUgPSBEYXRlLm5vdygpXG4gICAgZm91bmRQYXRoID0gb3JpZ2luYWxGaW5kUGF0aC5hcHBseShnbG9iYWwsIGFyZ3VtZW50cylcbiAgICBjYWNoZS5maW5kUGF0aFRpbWUgKz0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZVxuICAgIGZvdW5kUGF0aFxuXG5leHBvcnRzLmNyZWF0ZSA9IChtb2R1bGVQYXRoKSAtPlxuICBmcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG5cbiAgbW9kdWxlUGF0aCA9IGZzLnJlYWxwYXRoU3luYyhtb2R1bGVQYXRoKVxuICBtZXRhZGF0YVBhdGggPSBwYXRoLmpvaW4obW9kdWxlUGF0aCwgJ3BhY2thZ2UuanNvbicpXG4gIG1ldGFkYXRhID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMobWV0YWRhdGFQYXRoKSlcblxuICBtb2R1bGVDYWNoZSA9XG4gICAgdmVyc2lvbjogMVxuICAgIGRlcGVuZGVuY2llczogW11cbiAgICBleHRlbnNpb25zOiB7fVxuICAgIGZvbGRlcnM6IFtdXG5cbiAgbG9hZERlcGVuZGVuY2llcyhtb2R1bGVQYXRoLCBtb2R1bGVQYXRoLCBtZXRhZGF0YSwgbW9kdWxlQ2FjaGUpXG4gIGxvYWRGb2xkZXJDb21wYXRpYmlsaXR5KG1vZHVsZVBhdGgsIG1vZHVsZVBhdGgsIG1ldGFkYXRhLCBtb2R1bGVDYWNoZSlcbiAgbG9hZEV4dGVuc2lvbnMobW9kdWxlUGF0aCwgbW9kdWxlUGF0aCwgbWV0YWRhdGEsIG1vZHVsZUNhY2hlKVxuXG4gIG1ldGFkYXRhLl9hdG9tTW9kdWxlQ2FjaGUgPSBtb2R1bGVDYWNoZVxuICBmcy53cml0ZUZpbGVTeW5jKG1ldGFkYXRhUGF0aCwgSlNPTi5zdHJpbmdpZnkobWV0YWRhdGEsIG51bGwsIDIpKVxuXG4gIHJldHVyblxuXG5leHBvcnRzLnJlZ2lzdGVyID0gKHtyZXNvdXJjZVBhdGgsIGRldk1vZGV9PXt9KSAtPlxuICByZXR1cm4gaWYgY2FjaGUucmVnaXN0ZXJlZFxuXG4gIG9yaWdpbmFsUmVzb2x2ZUZpbGVuYW1lID0gTW9kdWxlLl9yZXNvbHZlRmlsZW5hbWVcbiAgTW9kdWxlLl9yZXNvbHZlRmlsZW5hbWUgPSAocmVsYXRpdmVQYXRoLCBwYXJlbnRNb2R1bGUpIC0+XG4gICAgcmVzb2x2ZWRQYXRoID0gcmVzb2x2ZU1vZHVsZVBhdGgocmVsYXRpdmVQYXRoLCBwYXJlbnRNb2R1bGUpXG4gICAgcmVzb2x2ZWRQYXRoID89IHJlc29sdmVGaWxlUGF0aChyZWxhdGl2ZVBhdGgsIHBhcmVudE1vZHVsZSlcbiAgICByZXNvbHZlZFBhdGggPyBvcmlnaW5hbFJlc29sdmVGaWxlbmFtZShyZWxhdGl2ZVBhdGgsIHBhcmVudE1vZHVsZSlcblxuICBjYWNoZS5yZWdpc3RlcmVkID0gdHJ1ZVxuICBjYWNoZS5yZXNvdXJjZVBhdGggPSByZXNvdXJjZVBhdGhcbiAgY2FjaGUucmVzb3VyY2VQYXRoV2l0aFRyYWlsaW5nU2xhc2ggPSBcIiN7cmVzb3VyY2VQYXRofSN7cGF0aC5zZXB9XCJcbiAgcmVnaXN0ZXJCdWlsdGlucyhkZXZNb2RlKVxuXG4gIHJldHVyblxuXG5leHBvcnRzLmFkZCA9IChkaXJlY3RvcnlQYXRoLCBtZXRhZGF0YSkgLT5cbiAgIyBwYXRoLmpvaW4gaXNuJ3QgdXNlZCBpbiB0aGlzIGZ1bmN0aW9uIGZvciBzcGVlZCBzaW5jZSBwYXRoLmpvaW4gY2FsbHNcbiAgIyBwYXRoLm5vcm1hbGl6ZSBhbmQgYWxsIHRoZSBwYXRocyBhcmUgYWxyZWFkeSBub3JtYWxpemVkIGhlcmUuXG5cbiAgdW5sZXNzIG1ldGFkYXRhP1xuICAgIHRyeVxuICAgICAgbWV0YWRhdGEgPSByZXF1aXJlKFwiI3tkaXJlY3RvcnlQYXRofSN7cGF0aC5zZXB9cGFja2FnZS5qc29uXCIpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIHJldHVyblxuXG4gIGNhY2hlVG9BZGQgPSBtZXRhZGF0YT8uX2F0b21Nb2R1bGVDYWNoZVxuICByZXR1cm4gdW5sZXNzIGNhY2hlVG9BZGQ/XG5cbiAgZm9yIGRlcGVuZGVuY3kgaW4gY2FjaGVUb0FkZC5kZXBlbmRlbmNpZXMgPyBbXVxuICAgIGNhY2hlLmRlcGVuZGVuY2llc1tkZXBlbmRlbmN5Lm5hbWVdID89IHt9XG4gICAgY2FjaGUuZGVwZW5kZW5jaWVzW2RlcGVuZGVuY3kubmFtZV1bZGVwZW5kZW5jeS52ZXJzaW9uXSA/PSBcIiN7ZGlyZWN0b3J5UGF0aH0je3BhdGguc2VwfSN7ZGVwZW5kZW5jeS5wYXRofVwiXG5cbiAgZm9yIGVudHJ5IGluIGNhY2hlVG9BZGQuZm9sZGVycyA/IFtdXG4gICAgZm9yIGZvbGRlclBhdGggaW4gZW50cnkucGF0aHNcbiAgICAgIGlmIGZvbGRlclBhdGhcbiAgICAgICAgY2FjaGUuZm9sZGVyc1tcIiN7ZGlyZWN0b3J5UGF0aH0je3BhdGguc2VwfSN7Zm9sZGVyUGF0aH1cIl0gPSBlbnRyeS5kZXBlbmRlbmNpZXNcbiAgICAgIGVsc2VcbiAgICAgICAgY2FjaGUuZm9sZGVyc1tkaXJlY3RvcnlQYXRoXSA9IGVudHJ5LmRlcGVuZGVuY2llc1xuXG4gIGZvciBleHRlbnNpb24sIHBhdGhzIG9mIGNhY2hlVG9BZGQuZXh0ZW5zaW9uc1xuICAgIGNhY2hlLmV4dGVuc2lvbnNbZXh0ZW5zaW9uXSA/PSBuZXcgU2V0KClcbiAgICBmb3IgZmlsZVBhdGggaW4gcGF0aHNcbiAgICAgIGNhY2hlLmV4dGVuc2lvbnNbZXh0ZW5zaW9uXS5hZGQoXCIje2RpcmVjdG9yeVBhdGh9I3twYXRoLnNlcH0je2ZpbGVQYXRofVwiKVxuXG4gIHJldHVyblxuXG5leHBvcnRzLmNhY2hlID0gY2FjaGVcbiJdfQ==
