(function() {
  var GitHubFile, Range, parseUrl, path, shell;

  shell = require('electron').shell;

  Range = require('atom').Range;

  parseUrl = require('url').parse;

  path = require('path');

  module.exports = GitHubFile = (function() {
    GitHubFile.fromPath = function(filePath) {
      return new GitHubFile(filePath);
    };

    function GitHubFile(filePath1) {
      var rootDir, rootDirIndex;
      this.filePath = filePath1;
      rootDir = atom.project.relativizePath(this.filePath)[0];
      if (rootDir != null) {
        rootDirIndex = atom.project.getPaths().indexOf(rootDir);
        this.repo = atom.project.getRepositories()[rootDirIndex];
      }
    }

    GitHubFile.prototype.open = function(lineRange) {
      if (this.isOpenable()) {
        return this.openUrlInBrowser(this.blobUrl() + this.getLineRangeSuffix(lineRange));
      } else {
        return this.reportValidationErrors();
      }
    };

    GitHubFile.prototype.openOnMaster = function(lineRange) {
      if (this.isOpenable()) {
        return this.openUrlInBrowser(this.blobUrlForMaster() + this.getLineRangeSuffix(lineRange));
      } else {
        return this.reportValidationErrors();
      }
    };

    GitHubFile.prototype.blame = function(lineRange) {
      if (this.isOpenable()) {
        return this.openUrlInBrowser(this.blameUrl() + this.getLineRangeSuffix(lineRange));
      } else {
        return this.reportValidationErrors();
      }
    };

    GitHubFile.prototype.history = function() {
      if (this.isOpenable()) {
        return this.openUrlInBrowser(this.historyUrl());
      } else {
        return this.reportValidationErrors();
      }
    };

    GitHubFile.prototype.copyUrl = function(lineRange) {
      if (this.isOpenable()) {
        return atom.clipboard.write(this.shaUrl() + this.getLineRangeSuffix(lineRange));
      } else {
        return this.reportValidationErrors();
      }
    };

    GitHubFile.prototype.openBranchCompare = function() {
      if (this.isOpenable()) {
        return this.openUrlInBrowser(this.branchCompareUrl());
      } else {
        return this.reportValidationErrors();
      }
    };

    GitHubFile.prototype.openIssues = function() {
      if (this.isOpenable()) {
        return this.openUrlInBrowser(this.issuesUrl());
      } else {
        return this.reportValidationErrors();
      }
    };

    GitHubFile.prototype.openRepository = function() {
      if (this.isOpenable()) {
        return this.openUrlInBrowser(this.githubRepoUrl());
      } else {
        return this.reportValidationErrors();
      }
    };

    GitHubFile.prototype.getLineRangeSuffix = function(lineRange) {
      var endRow, startRow;
      if (lineRange && atom.config.get('open-on-github.includeLineNumbersInUrls')) {
        lineRange = Range.fromObject(lineRange);
        startRow = lineRange.start.row + 1;
        endRow = lineRange.end.row + 1;
        if (startRow === endRow) {
          return "#L" + startRow;
        } else {
          return "#L" + startRow + "-L" + endRow;
        }
      } else {
        return '';
      }
    };

    GitHubFile.prototype.isOpenable = function() {
      return this.validationErrors().length === 0;
    };

    GitHubFile.prototype.validationErrors = function() {
      if (!this.repo) {
        return ["No repository found for path: " + this.filePath + "."];
      }
      if (!this.gitUrl()) {
        return ["No URL defined for remote: " + (this.remoteName())];
      }
      if (!this.githubRepoUrl()) {
        return ["Remote URL is not hosted on GitHub: " + (this.gitUrl())];
      }
      return [];
    };

    GitHubFile.prototype.reportValidationErrors = function() {
      var message;
      message = this.validationErrors().join('\n');
      return atom.notifications.addWarning(message);
    };

    GitHubFile.prototype.openUrlInBrowser = function(url) {
      return shell.openExternal(url);
    };

    GitHubFile.prototype.blobUrl = function() {
      var gitHubRepoUrl, remoteBranchName, repoRelativePath;
      gitHubRepoUrl = this.githubRepoUrl();
      remoteBranchName = this.remoteBranchName();
      repoRelativePath = this.repoRelativePath();
      if (this.isGitHubWikiUrl(gitHubRepoUrl)) {
        return (gitHubRepoUrl.slice(0, -5)) + "/wiki/" + (this.extractFileName(repoRelativePath));
      } else {
        return gitHubRepoUrl + "/blob/" + remoteBranchName + "/" + (this.encodeSegments(repoRelativePath));
      }
    };

    GitHubFile.prototype.blobUrlForMaster = function() {
      return (this.githubRepoUrl()) + "/blob/master/" + (this.encodeSegments(this.repoRelativePath()));
    };

    GitHubFile.prototype.shaUrl = function() {
      return (this.githubRepoUrl()) + "/blob/" + (this.encodeSegments(this.sha())) + "/" + (this.encodeSegments(this.repoRelativePath()));
    };

    GitHubFile.prototype.blameUrl = function() {
      return (this.githubRepoUrl()) + "/blame/" + (this.remoteBranchName()) + "/" + (this.encodeSegments(this.repoRelativePath()));
    };

    GitHubFile.prototype.historyUrl = function() {
      return (this.githubRepoUrl()) + "/commits/" + (this.remoteBranchName()) + "/" + (this.encodeSegments(this.repoRelativePath()));
    };

    GitHubFile.prototype.issuesUrl = function() {
      return (this.githubRepoUrl()) + "/issues";
    };

    GitHubFile.prototype.branchCompareUrl = function() {
      return (this.githubRepoUrl()) + "/compare/" + (this.encodeSegments(this.branchName()));
    };

    GitHubFile.prototype.encodeSegments = function(segments) {
      if (segments == null) {
        segments = '';
      }
      segments = segments.split('/');
      segments = segments.map(function(segment) {
        return encodeURIComponent(segment);
      });
      return segments.join('/');
    };

    GitHubFile.prototype.extractFileName = function(relativePath) {
      if (relativePath == null) {
        relativePath = '';
      }
      return path.parse(relativePath).name;
    };

    GitHubFile.prototype.gitUrl = function() {
      var ref, remoteOrBestGuess;
      remoteOrBestGuess = (ref = this.remoteName()) != null ? ref : 'origin';
      return this.repo.getConfigValue("remote." + remoteOrBestGuess + ".url", this.filePath);
    };

    GitHubFile.prototype.githubRepoUrl = function() {
      var url;
      url = this.gitUrl();
      if (url.match(/git@[^:]+:/)) {
        url = url.replace(/^git@([^:]+):(.+)$/, function(match, host, repoPath) {
          repoPath = repoPath.replace(/^\/+/, '');
          return "http://" + host + "/" + repoPath;
        });
      } else if (url.match(/ssh:\/\/git@([^\/]+)\//)) {
        url = "http://" + (url.substring(10));
      } else if (url.match(/^git:\/\/[^\/]+\//)) {
        url = "http" + (url.substring(3));
      }
      url = url.replace(/\.git$/, '');
      url = url.replace(/\/+$/, '');
      if (!this.isBitbucketUrl(url)) {
        return url;
      }
    };

    GitHubFile.prototype.isGitHubWikiUrl = function(url) {
      return /\.wiki$/.test(url);
    };

    GitHubFile.prototype.isBitbucketUrl = function(url) {
      var host;
      if (url.indexOf('git@bitbucket.org') === 0) {
        return true;
      }
      try {
        host = parseUrl(url).host;
        return host === 'bitbucket.org';
      } catch (error) {}
    };

    GitHubFile.prototype.repoRelativePath = function() {
      return this.repo.getRepo(this.filePath).relativize(this.filePath);
    };

    GitHubFile.prototype.remoteName = function() {
      var branchRemote, gitConfigRemote, shortBranch;
      gitConfigRemote = this.repo.getConfigValue("atom.open-on-github.remote", this.filePath);
      if (gitConfigRemote) {
        return gitConfigRemote;
      }
      shortBranch = this.repo.getShortHead(this.filePath);
      if (!shortBranch) {
        return null;
      }
      branchRemote = this.repo.getConfigValue("branch." + shortBranch + ".remote", this.filePath);
      if (!((branchRemote != null ? branchRemote.length : void 0) > 0)) {
        return null;
      }
      return branchRemote;
    };

    GitHubFile.prototype.sha = function() {
      return this.repo.getReferenceTarget('HEAD', this.filePath);
    };

    GitHubFile.prototype.branchName = function() {
      var branchMerge, shortBranch;
      shortBranch = this.repo.getShortHead(this.filePath);
      if (!shortBranch) {
        return null;
      }
      branchMerge = this.repo.getConfigValue("branch." + shortBranch + ".merge", this.filePath);
      if (!((branchMerge != null ? branchMerge.length : void 0) > 11)) {
        return shortBranch;
      }
      if (branchMerge.indexOf('refs/heads/') !== 0) {
        return shortBranch;
      }
      return branchMerge.substring(11);
    };

    GitHubFile.prototype.remoteBranchName = function() {
      var gitConfigBranch;
      gitConfigBranch = this.repo.getConfigValue("atom.open-on-github.branch", this.filePath);
      if (gitConfigBranch) {
        return gitConfigBranch;
      } else if (this.remoteName() != null) {
        return this.encodeSegments(this.branchName());
      } else {
        return 'master';
      }
    };

    return GitHubFile;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9vcGVuLW9uLWdpdGh1Yi9saWIvZ2l0aHViLWZpbGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxRQUFTLE9BQUEsQ0FBUSxVQUFSOztFQUNULFFBQVMsT0FBQSxDQUFRLE1BQVI7O0VBQ1YsUUFBQSxHQUFXLE9BQUEsQ0FBUSxLQUFSLENBQWMsQ0FBQzs7RUFDMUIsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFHSixVQUFDLENBQUEsUUFBRCxHQUFXLFNBQUMsUUFBRDthQUNMLElBQUEsVUFBQSxDQUFXLFFBQVg7SUFESzs7SUFJRSxvQkFBQyxTQUFEO0FBQ1gsVUFBQTtNQURZLElBQUMsQ0FBQSxXQUFEO01BQ1gsVUFBVyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWIsQ0FBNEIsSUFBQyxDQUFBLFFBQTdCO01BQ1osSUFBRyxlQUFIO1FBQ0UsWUFBQSxHQUFlLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBYixDQUFBLENBQXVCLENBQUMsT0FBeEIsQ0FBZ0MsT0FBaEM7UUFDZixJQUFDLENBQUEsSUFBRCxHQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBYixDQUFBLENBQStCLENBQUEsWUFBQSxFQUZ6Qzs7SUFGVzs7eUJBT2IsSUFBQSxHQUFNLFNBQUMsU0FBRDtNQUNKLElBQUcsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFIO2VBQ0UsSUFBQyxDQUFBLGdCQUFELENBQWtCLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBQSxHQUFhLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixTQUFwQixDQUEvQixFQURGO09BQUEsTUFBQTtlQUdFLElBQUMsQ0FBQSxzQkFBRCxDQUFBLEVBSEY7O0lBREk7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QUQsQ0FBQSxDQUFoQixFQURHO09BQUEsTUFBQTtlQUdILFNBSEc7O0lBTFc7Ozs7O0FBMU5wQiIsInNvdXJjZXNDb250ZW50IjpbIntzaGVsbH0gPSByZXF1aXJlICdlbGVjdHJvbidcbntSYW5nZX0gPSByZXF1aXJlICdhdG9tJ1xucGFyc2VVcmwgPSByZXF1aXJlKCd1cmwnKS5wYXJzZVxucGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBHaXRIdWJGaWxlXG5cbiAgIyBQdWJsaWNcbiAgQGZyb21QYXRoOiAoZmlsZVBhdGgpIC0+XG4gICAgbmV3IEdpdEh1YkZpbGUoZmlsZVBhdGgpXG5cbiAgIyBJbnRlcm5hbFxuICBjb25zdHJ1Y3RvcjogKEBmaWxlUGF0aCkgLT5cbiAgICBbcm9vdERpcl0gPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoQGZpbGVQYXRoKVxuICAgIGlmIHJvb3REaXI/XG4gICAgICByb290RGlySW5kZXggPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKS5pbmRleE9mKHJvb3REaXIpXG4gICAgICBAcmVwbyA9IGF0b20ucHJvamVjdC5nZXRSZXBvc2l0b3JpZXMoKVtyb290RGlySW5kZXhdXG5cbiAgIyBQdWJsaWNcbiAgb3BlbjogKGxpbmVSYW5nZSkgLT5cbiAgICBpZiBAaXNPcGVuYWJsZSgpXG4gICAgICBAb3BlblVybEluQnJvd3NlcihAYmxvYlVybCgpICsgQGdldExpbmVSYW5nZVN1ZmZpeChsaW5lUmFuZ2UpKVxuICAgIGVsc2VcbiAgICAgIEByZXBvcnRWYWxpZGF0aW9uRXJyb3JzKClcblxuICAjIFB1YmxpY1xuICBvcGVuT25NYXN0ZXI6IChsaW5lUmFuZ2UpIC0+XG4gICAgaWYgQGlzT3BlbmFibGUoKVxuICAgICAgQG9wZW5VcmxJbkJyb3dzZXIoQGJsb2JVcmxGb3JNYXN0ZXIoKSArIEBnZXRMaW5lUmFuZ2VTdWZmaXgobGluZVJhbmdlKSlcbiAgICBlbHNlXG4gICAgICBAcmVwb3J0VmFsaWRhdGlvbkVycm9ycygpXG5cbiAgIyBQdWJsaWNcbiAgYmxhbWU6IChsaW5lUmFuZ2UpIC0+XG4gICAgaWYgQGlzT3BlbmFibGUoKVxuICAgICAgQG9wZW5VcmxJbkJyb3dzZXIoQGJsYW1lVXJsKCkgKyBAZ2V0TGluZVJhbmdlU3VmZml4KGxpbmVSYW5nZSkpXG4gICAgZWxzZVxuICAgICAgQHJlcG9ydFZhbGlkYXRpb25FcnJvcnMoKVxuXG4gIGhpc3Rvcnk6IC0+XG4gICAgaWYgQGlzT3BlbmFibGUoKVxuICAgICAgQG9wZW5VcmxJbkJyb3dzZXIoQGhpc3RvcnlVcmwoKSlcbiAgICBlbHNlXG4gICAgICBAcmVwb3J0VmFsaWRhdGlvbkVycm9ycygpXG5cbiAgY29weVVybDogKGxpbmVSYW5nZSkgLT5cbiAgICBpZiBAaXNPcGVuYWJsZSgpXG4gICAgICBhdG9tLmNsaXBib2FyZC53cml0ZShAc2hhVXJsKCkgKyBAZ2V0TGluZVJhbmdlU3VmZml4KGxpbmVSYW5nZSkpXG4gICAgZWxzZVxuICAgICAgQHJlcG9ydFZhbGlkYXRpb25FcnJvcnMoKVxuXG4gIG9wZW5CcmFuY2hDb21wYXJlOiAtPlxuICAgIGlmIEBpc09wZW5hYmxlKClcbiAgICAgIEBvcGVuVXJsSW5Ccm93c2VyKEBicmFuY2hDb21wYXJlVXJsKCkpXG4gICAgZWxzZVxuICAgICAgQHJlcG9ydFZhbGlkYXRpb25FcnJvcnMoKVxuXG4gIG9wZW5Jc3N1ZXM6IC0+XG4gICAgaWYgQGlzT3BlbmFibGUoKVxuICAgICAgQG9wZW5VcmxJbkJyb3dzZXIoQGlzc3Vlc1VybCgpKVxuICAgIGVsc2VcbiAgICAgIEByZXBvcnRWYWxpZGF0aW9uRXJyb3JzKClcblxuICBvcGVuUmVwb3NpdG9yeTogLT5cbiAgICBpZiBAaXNPcGVuYWJsZSgpXG4gICAgICBAb3BlblVybEluQnJvd3NlcihAZ2l0aHViUmVwb1VybCgpKVxuICAgIGVsc2VcbiAgICAgIEByZXBvcnRWYWxpZGF0aW9uRXJyb3JzKClcblxuICBnZXRMaW5lUmFuZ2VTdWZmaXg6IChsaW5lUmFuZ2UpIC0+XG4gICAgaWYgbGluZVJhbmdlIGFuZCBhdG9tLmNvbmZpZy5nZXQoJ29wZW4tb24tZ2l0aHViLmluY2x1ZGVMaW5lTnVtYmVyc0luVXJscycpXG4gICAgICBsaW5lUmFuZ2UgPSBSYW5nZS5mcm9tT2JqZWN0KGxpbmVSYW5nZSlcbiAgICAgIHN0YXJ0Um93ID0gbGluZVJhbmdlLnN0YXJ0LnJvdyArIDFcbiAgICAgIGVuZFJvdyA9IGxpbmVSYW5nZS5lbmQucm93ICsgMVxuICAgICAgaWYgc3RhcnRSb3cgaXMgZW5kUm93XG4gICAgICAgIFwiI0wje3N0YXJ0Um93fVwiXG4gICAgICBlbHNlXG4gICAgICAgIFwiI0wje3N0YXJ0Um93fS1MI3tlbmRSb3d9XCJcbiAgICBlbHNlXG4gICAgICAnJ1xuXG4gICMgUHVibGljXG4gIGlzT3BlbmFibGU6IC0+XG4gICAgQHZhbGlkYXRpb25FcnJvcnMoKS5sZW5ndGggaXMgMFxuXG4gICMgUHVibGljXG4gIHZhbGlkYXRpb25FcnJvcnM6IC0+XG4gICAgdW5sZXNzIEByZXBvXG4gICAgICByZXR1cm4gW1wiTm8gcmVwb3NpdG9yeSBmb3VuZCBmb3IgcGF0aDogI3tAZmlsZVBhdGh9LlwiXVxuXG4gICAgdW5sZXNzIEBnaXRVcmwoKVxuICAgICAgcmV0dXJuIFtcIk5vIFVSTCBkZWZpbmVkIGZvciByZW1vdGU6ICN7QHJlbW90ZU5hbWUoKX1cIl1cblxuICAgIHVubGVzcyBAZ2l0aHViUmVwb1VybCgpXG4gICAgICByZXR1cm4gW1wiUmVtb3RlIFVSTCBpcyBub3QgaG9zdGVkIG9uIEdpdEh1YjogI3tAZ2l0VXJsKCl9XCJdXG5cbiAgICBbXVxuXG4gICMgSW50ZXJuYWxcbiAgcmVwb3J0VmFsaWRhdGlvbkVycm9yczogLT5cbiAgICBtZXNzYWdlID0gQHZhbGlkYXRpb25FcnJvcnMoKS5qb2luKCdcXG4nKVxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKG1lc3NhZ2UpXG5cbiAgIyBJbnRlcm5hbFxuICBvcGVuVXJsSW5Ccm93c2VyOiAodXJsKSAtPlxuICAgIHNoZWxsLm9wZW5FeHRlcm5hbCB1cmxcblxuICAjIEludGVybmFsXG4gIGJsb2JVcmw6IC0+XG4gICAgZ2l0SHViUmVwb1VybCA9IEBnaXRodWJSZXBvVXJsKClcbiAgICByZW1vdGVCcmFuY2hOYW1lID0gQHJlbW90ZUJyYW5jaE5hbWUoKVxuICAgIHJlcG9SZWxhdGl2ZVBhdGggPSBAcmVwb1JlbGF0aXZlUGF0aCgpXG4gICAgaWYgQGlzR2l0SHViV2lraVVybChnaXRIdWJSZXBvVXJsKVxuICAgICAgXCIje2dpdEh1YlJlcG9Vcmwuc2xpY2UoMCwgLTUpfS93aWtpLyN7QGV4dHJhY3RGaWxlTmFtZShyZXBvUmVsYXRpdmVQYXRoKX1cIlxuICAgIGVsc2VcbiAgICAgIFwiI3tnaXRIdWJSZXBvVXJsfS9ibG9iLyN7cmVtb3RlQnJhbmNoTmFtZX0vI3tAZW5jb2RlU2VnbWVudHMocmVwb1JlbGF0aXZlUGF0aCl9XCJcblxuICAjIEludGVybmFsXG4gIGJsb2JVcmxGb3JNYXN0ZXI6IC0+XG4gICAgXCIje0BnaXRodWJSZXBvVXJsKCl9L2Jsb2IvbWFzdGVyLyN7QGVuY29kZVNlZ21lbnRzKEByZXBvUmVsYXRpdmVQYXRoKCkpfVwiXG5cbiAgIyBJbnRlcm5hbFxuICBzaGFVcmw6IC0+XG4gICAgXCIje0BnaXRodWJSZXBvVXJsKCl9L2Jsb2IvI3tAZW5jb2RlU2VnbWVudHMoQHNoYSgpKX0vI3tAZW5jb2RlU2VnbWVudHMoQHJlcG9SZWxhdGl2ZVBhdGgoKSl9XCJcblxuICAjIEludGVybmFsXG4gIGJsYW1lVXJsOiAtPlxuICAgIFwiI3tAZ2l0aHViUmVwb1VybCgpfS9ibGFtZS8je0ByZW1vdGVCcmFuY2hOYW1lKCl9LyN7QGVuY29kZVNlZ21lbnRzKEByZXBvUmVsYXRpdmVQYXRoKCkpfVwiXG5cbiAgIyBJbnRlcm5hbFxuICBoaXN0b3J5VXJsOiAtPlxuICAgIFwiI3tAZ2l0aHViUmVwb1VybCgpfS9jb21taXRzLyN7QHJlbW90ZUJyYW5jaE5hbWUoKX0vI3tAZW5jb2RlU2VnbWVudHMoQHJlcG9SZWxhdGl2ZVBhdGgoKSl9XCJcblxuICAjIEludGVybmFsXG4gIGlzc3Vlc1VybDogLT5cbiAgICBcIiN7QGdpdGh1YlJlcG9VcmwoKX0vaXNzdWVzXCJcblxuICAjIEludGVybmFsXG4gIGJyYW5jaENvbXBhcmVVcmw6IC0+XG4gICAgXCIje0BnaXRodWJSZXBvVXJsKCl9L2NvbXBhcmUvI3tAZW5jb2RlU2VnbWVudHMoQGJyYW5jaE5hbWUoKSl9XCJcblxuICBlbmNvZGVTZWdtZW50czogKHNlZ21lbnRzPScnKSAtPlxuICAgIHNlZ21lbnRzID0gc2VnbWVudHMuc3BsaXQoJy8nKVxuICAgIHNlZ21lbnRzID0gc2VnbWVudHMubWFwIChzZWdtZW50KSAtPiBlbmNvZGVVUklDb21wb25lbnQoc2VnbWVudClcbiAgICBzZWdtZW50cy5qb2luKCcvJylcblxuICAjIEludGVybmFsXG4gIGV4dHJhY3RGaWxlTmFtZTogKHJlbGF0aXZlUGF0aD0nJykgLT5cbiAgICBwYXRoLnBhcnNlKHJlbGF0aXZlUGF0aCkubmFtZVxuICAgICMgWy4uLiwgZmlsZU5hbWVdID0gc2VnbWVudHMuc3BsaXQgJy8nXG4gICAgIyByZXR1cm4gZmlsZU5hbWUuc3BsaXQoJy4nKVswXVxuXG4gICMgSW50ZXJuYWxcbiAgZ2l0VXJsOiAtPlxuICAgIHJlbW90ZU9yQmVzdEd1ZXNzID0gQHJlbW90ZU5hbWUoKSA/ICdvcmlnaW4nXG4gICAgQHJlcG8uZ2V0Q29uZmlnVmFsdWUoXCJyZW1vdGUuI3tyZW1vdGVPckJlc3RHdWVzc30udXJsXCIsIEBmaWxlUGF0aClcblxuICAjIEludGVybmFsXG4gIGdpdGh1YlJlcG9Vcmw6IC0+XG4gICAgdXJsID0gQGdpdFVybCgpXG4gICAgaWYgdXJsLm1hdGNoIC9naXRAW146XSs6LyAgICAjIGUuZy4sIGdpdEBnaXRodWIuY29tOmZvby9iYXIuZ2l0XG4gICAgICB1cmwgPSB1cmwucmVwbGFjZSAvXmdpdEAoW146XSspOiguKykkLywgKG1hdGNoLCBob3N0LCByZXBvUGF0aCkgLT5cbiAgICAgICAgcmVwb1BhdGggPSByZXBvUGF0aC5yZXBsYWNlKC9eXFwvKy8sICcnKSAjIHJlcGxhY2UgbGVhZGluZyBzbGFzaGVzXG4gICAgICAgIFwiaHR0cDovLyN7aG9zdH0vI3tyZXBvUGF0aH1cIlxuICAgIGVsc2UgaWYgdXJsLm1hdGNoIC9zc2g6XFwvXFwvZ2l0QChbXlxcL10rKVxcLy8gICAgIyBlLmcuLCBzc2g6Ly9naXRAZ2l0aHViLmNvbS9mb28vYmFyLmdpdFxuICAgICAgdXJsID0gXCJodHRwOi8vI3t1cmwuc3Vic3RyaW5nKDEwKX1cIlxuICAgIGVsc2UgaWYgdXJsLm1hdGNoIC9eZ2l0OlxcL1xcL1teXFwvXStcXC8vICMgZS5nLiwgZ2l0Oi8vZ2l0aHViLmNvbS9mb28vYmFyLmdpdFxuICAgICAgdXJsID0gXCJodHRwI3t1cmwuc3Vic3RyaW5nKDMpfVwiXG5cbiAgICB1cmwgPSB1cmwucmVwbGFjZSgvXFwuZ2l0JC8sICcnKVxuICAgIHVybCA9IHVybC5yZXBsYWNlKC9cXC8rJC8sICcnKVxuXG4gICAgcmV0dXJuIHVybCB1bmxlc3MgQGlzQml0YnVja2V0VXJsKHVybClcblxuICBpc0dpdEh1Yldpa2lVcmw6ICh1cmwpIC0+XG4gICAgcmV0dXJuIC9cXC53aWtpJC8udGVzdCB1cmxcblxuICBpc0JpdGJ1Y2tldFVybDogKHVybCkgLT5cbiAgICByZXR1cm4gdHJ1ZSBpZiB1cmwuaW5kZXhPZignZ2l0QGJpdGJ1Y2tldC5vcmcnKSBpcyAwXG5cbiAgICB0cnlcbiAgICAgIHtob3N0fSA9IHBhcnNlVXJsKHVybClcbiAgICAgIGhvc3QgaXMgJ2JpdGJ1Y2tldC5vcmcnXG5cbiAgIyBJbnRlcm5hbFxuICByZXBvUmVsYXRpdmVQYXRoOiAtPlxuICAgIEByZXBvLmdldFJlcG8oQGZpbGVQYXRoKS5yZWxhdGl2aXplKEBmaWxlUGF0aClcblxuICAjIEludGVybmFsXG4gIHJlbW90ZU5hbWU6IC0+XG4gICAgZ2l0Q29uZmlnUmVtb3RlID0gQHJlcG8uZ2V0Q29uZmlnVmFsdWUoXCJhdG9tLm9wZW4tb24tZ2l0aHViLnJlbW90ZVwiLCBAZmlsZVBhdGgpXG4gICAgcmV0dXJuIGdpdENvbmZpZ1JlbW90ZSBpZiBnaXRDb25maWdSZW1vdGVcblxuICAgIHNob3J0QnJhbmNoID0gQHJlcG8uZ2V0U2hvcnRIZWFkKEBmaWxlUGF0aClcbiAgICByZXR1cm4gbnVsbCB1bmxlc3Mgc2hvcnRCcmFuY2hcblxuICAgIGJyYW5jaFJlbW90ZSA9IEByZXBvLmdldENvbmZpZ1ZhbHVlKFwiYnJhbmNoLiN7c2hvcnRCcmFuY2h9LnJlbW90ZVwiLCBAZmlsZVBhdGgpXG4gICAgcmV0dXJuIG51bGwgdW5sZXNzIGJyYW5jaFJlbW90ZT8ubGVuZ3RoID4gMFxuXG4gICAgYnJhbmNoUmVtb3RlXG5cbiAgIyBJbnRlcm5hbFxuICBzaGE6IC0+XG4gICAgQHJlcG8uZ2V0UmVmZXJlbmNlVGFyZ2V0KCdIRUFEJywgQGZpbGVQYXRoKVxuXG4gICMgSW50ZXJuYWxcbiAgYnJhbmNoTmFtZTogLT5cbiAgICBzaG9ydEJyYW5jaCA9IEByZXBvLmdldFNob3J0SGVhZChAZmlsZVBhdGgpXG4gICAgcmV0dXJuIG51bGwgdW5sZXNzIHNob3J0QnJhbmNoXG5cbiAgICBicmFuY2hNZXJnZSA9IEByZXBvLmdldENvbmZpZ1ZhbHVlKFwiYnJhbmNoLiN7c2hvcnRCcmFuY2h9Lm1lcmdlXCIsIEBmaWxlUGF0aClcbiAgICByZXR1cm4gc2hvcnRCcmFuY2ggdW5sZXNzIGJyYW5jaE1lcmdlPy5sZW5ndGggPiAxMVxuICAgIHJldHVybiBzaG9ydEJyYW5jaCB1bmxlc3MgYnJhbmNoTWVyZ2UuaW5kZXhPZigncmVmcy9oZWFkcy8nKSBpcyAwXG5cbiAgICBicmFuY2hNZXJnZS5zdWJzdHJpbmcoMTEpXG5cbiAgIyBJbnRlcm5hbFxuICByZW1vdGVCcmFuY2hOYW1lOiAtPlxuICAgIGdpdENvbmZpZ0JyYW5jaCA9IEByZXBvLmdldENvbmZpZ1ZhbHVlKFwiYXRvbS5vcGVuLW9uLWdpdGh1Yi5icmFuY2hcIiwgQGZpbGVQYXRoKVxuXG4gICAgaWYgZ2l0Q29uZmlnQnJhbmNoXG4gICAgICBnaXRDb25maWdCcmFuY2hcbiAgICBlbHNlIGlmIEByZW1vdGVOYW1lKCk/XG4gICAgICBAZW5jb2RlU2VnbWVudHMoQGJyYW5jaE5hbWUoKSlcbiAgICBlbHNlXG4gICAgICAnbWFzdGVyJ1xuIl19
