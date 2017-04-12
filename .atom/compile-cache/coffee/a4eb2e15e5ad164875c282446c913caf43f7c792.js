(function() {
  var CompositeDisposable, GitRepositoryAsync, GitView, _, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require("underscore-plus");

  ref = require("atom"), CompositeDisposable = ref.CompositeDisposable, GitRepositoryAsync = ref.GitRepositoryAsync;

  GitView = (function(superClass) {
    extend(GitView, superClass);

    function GitView() {
      return GitView.__super__.constructor.apply(this, arguments);
    }

    GitView.prototype.initialize = function() {
      this.classList.add('git-view');
      this.createBranchArea();
      this.createCommitsArea();
      this.createStatusArea();
      this.activeItemSubscription = atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          return _this.subscribeToActiveItem();
        };
      })(this));
      this.projectPathSubscription = atom.project.onDidChangePaths((function(_this) {
        return function() {
          return _this.subscribeToRepositories();
        };
      })(this));
      this.subscribeToRepositories();
      return this.subscribeToActiveItem();
    };

    GitView.prototype.createBranchArea = function() {
      var branchIcon;
      this.branchArea = document.createElement('div');
      this.branchArea.classList.add('git-branch', 'inline-block');
      this.appendChild(this.branchArea);
      branchIcon = document.createElement('span');
      branchIcon.classList.add('icon', 'icon-git-branch');
      this.branchArea.appendChild(branchIcon);
      this.branchLabel = document.createElement('span');
      this.branchLabel.classList.add('branch-label');
      return this.branchArea.appendChild(this.branchLabel);
    };

    GitView.prototype.createCommitsArea = function() {
      this.commitsArea = document.createElement('div');
      this.commitsArea.classList.add('git-commits', 'inline-block');
      this.appendChild(this.commitsArea);
      this.commitsAhead = document.createElement('span');
      this.commitsAhead.classList.add('icon', 'icon-arrow-up', 'commits-ahead-label');
      this.commitsArea.appendChild(this.commitsAhead);
      this.commitsBehind = document.createElement('span');
      this.commitsBehind.classList.add('icon', 'icon-arrow-down', 'commits-behind-label');
      return this.commitsArea.appendChild(this.commitsBehind);
    };

    GitView.prototype.createStatusArea = function() {
      this.gitStatus = document.createElement('div');
      this.gitStatus.classList.add('git-status', 'inline-block');
      this.appendChild(this.gitStatus);
      this.gitStatusIcon = document.createElement('span');
      this.gitStatusIcon.classList.add('icon');
      return this.gitStatus.appendChild(this.gitStatusIcon);
    };

    GitView.prototype.subscribeToActiveItem = function() {
      var activeItem, ref1;
      activeItem = this.getActiveItem();
      if ((ref1 = this.savedSubscription) != null) {
        ref1.dispose();
      }
      this.savedSubscription = activeItem != null ? typeof activeItem.onDidSave === "function" ? activeItem.onDidSave((function(_this) {
        return function() {
          return _this.update();
        };
      })(this)) : void 0 : void 0;
      return this.update();
    };

    GitView.prototype.subscribeToRepositories = function() {
      var i, len, ref1, ref2, repo, results;
      if ((ref1 = this.repositorySubscriptions) != null) {
        ref1.dispose();
      }
      this.repositorySubscriptions = new CompositeDisposable;
      ref2 = atom.project.getRepositories();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        repo = ref2[i];
        if (!(repo != null)) {
          continue;
        }
        this.repositorySubscriptions.add(repo.onDidChangeStatus((function(_this) {
          return function(arg) {
            var path, status;
            path = arg.path, status = arg.status;
            if (path === _this.getActiveItemPath()) {
              return _this.update();
            }
          };
        })(this)));
        results.push(this.repositorySubscriptions.add(repo.onDidChangeStatuses((function(_this) {
          return function() {
            return _this.update();
          };
        })(this))));
      }
      return results;
    };

    GitView.prototype.destroy = function() {
      var ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8;
      if ((ref1 = this.activeItemSubscription) != null) {
        ref1.dispose();
      }
      if ((ref2 = this.projectPathSubscription) != null) {
        ref2.dispose();
      }
      if ((ref3 = this.savedSubscription) != null) {
        ref3.dispose();
      }
      if ((ref4 = this.repositorySubscriptions) != null) {
        ref4.dispose();
      }
      if ((ref5 = this.branchTooltipDisposable) != null) {
        ref5.dispose();
      }
      if ((ref6 = this.commitsAheadTooltipDisposable) != null) {
        ref6.dispose();
      }
      if ((ref7 = this.commitsBehindTooltipDisposable) != null) {
        ref7.dispose();
      }
      return (ref8 = this.statusTooltipDisposable) != null ? ref8.dispose() : void 0;
    };

    GitView.prototype.getActiveItemPath = function() {
      var ref1;
      return (ref1 = this.getActiveItem()) != null ? typeof ref1.getPath === "function" ? ref1.getPath() : void 0 : void 0;
    };

    GitView.prototype.getRepositoryForActiveItem = function() {
      var i, len, ref1, repo, rootDir, rootDirIndex;
      rootDir = atom.project.relativizePath(this.getActiveItemPath())[0];
      rootDirIndex = atom.project.getPaths().indexOf(rootDir);
      if (rootDirIndex >= 0) {
        return atom.project.getRepositories()[rootDirIndex];
      } else {
        ref1 = atom.project.getRepositories();
        for (i = 0, len = ref1.length; i < len; i++) {
          repo = ref1[i];
          if (repo) {
            return repo;
          }
        }
      }
    };

    GitView.prototype.getActiveItem = function() {
      return atom.workspace.getActivePaneItem();
    };

    GitView.prototype.update = function() {
      var repo;
      repo = this.getRepositoryForActiveItem();
      this.updateBranchText(repo);
      this.updateAheadBehindCount(repo);
      return this.updateStatusText(repo);
    };

    GitView.prototype.updateBranchText = function(repo) {
      var head, ref1;
      if (this.showGitInformation(repo)) {
        head = repo.getShortHead(this.getActiveItemPath());
        this.branchLabel.textContent = head;
        if (head) {
          this.branchArea.style.display = '';
        }
        if ((ref1 = this.branchTooltipDisposable) != null) {
          ref1.dispose();
        }
        return this.branchTooltipDisposable = atom.tooltips.add(this.branchArea, {
          title: "On branch " + head
        });
      } else {
        return this.branchArea.style.display = 'none';
      }
    };

    GitView.prototype.showGitInformation = function(repo) {
      var itemPath;
      if (repo == null) {
        return false;
      }
      if (itemPath = this.getActiveItemPath()) {
        return atom.project.contains(itemPath);
      } else {
        return this.getActiveItem() == null;
      }
    };

    GitView.prototype.updateAheadBehindCount = function(repo) {
      var ahead, behind, itemPath, ref1, ref2, ref3;
      if (!this.showGitInformation(repo)) {
        this.commitsArea.style.display = 'none';
        return;
      }
      itemPath = this.getActiveItemPath();
      ref1 = repo.getCachedUpstreamAheadBehindCount(itemPath), ahead = ref1.ahead, behind = ref1.behind;
      if (ahead > 0) {
        this.commitsAhead.textContent = ahead;
        this.commitsAhead.style.display = '';
        if ((ref2 = this.commitsAheadTooltipDisposable) != null) {
          ref2.dispose();
        }
        this.commitsAheadTooltipDisposable = atom.tooltips.add(this.commitsAhead, {
          title: (_.pluralize(ahead, 'commit')) + " ahead of upstream"
        });
      } else {
        this.commitsAhead.style.display = 'none';
      }
      if (behind > 0) {
        this.commitsBehind.textContent = behind;
        this.commitsBehind.style.display = '';
        if ((ref3 = this.commitsBehindTooltipDisposable) != null) {
          ref3.dispose();
        }
        this.commitsBehindTooltipDisposable = atom.tooltips.add(this.commitsBehind, {
          title: (_.pluralize(behind, 'commit')) + " behind upstream"
        });
      } else {
        this.commitsBehind.style.display = 'none';
      }
      if (ahead > 0 || behind > 0) {
        return this.commitsArea.style.display = '';
      } else {
        return this.commitsArea.style.display = 'none';
      }
    };

    GitView.prototype.clearStatus = function() {
      return this.gitStatusIcon.classList.remove('icon-diff-modified', 'status-modified', 'icon-diff-added', 'status-added', 'icon-diff-ignored', 'status-ignored');
    };

    GitView.prototype.updateAsNewFile = function() {
      var textEditor;
      this.clearStatus();
      this.gitStatusIcon.classList.add('icon-diff-added', 'status-added');
      if (textEditor = atom.workspace.getActiveTextEditor()) {
        this.gitStatusIcon.textContent = "+" + (textEditor.getLineCount());
        this.updateTooltipText((_.pluralize(textEditor.getLineCount(), 'line')) + " in this new file not yet committed");
      } else {
        this.gitStatusIcon.textContent = '';
        this.updateTooltipText();
      }
      return this.gitStatus.style.display = '';
    };

    GitView.prototype.updateAsModifiedFile = function(repo, path) {
      var stats;
      stats = repo.getDiffStats(path);
      this.clearStatus();
      this.gitStatusIcon.classList.add('icon-diff-modified', 'status-modified');
      if (stats.added && stats.deleted) {
        this.gitStatusIcon.textContent = "+" + stats.added + ", -" + stats.deleted;
        this.updateTooltipText((_.pluralize(stats.added, 'line')) + " added and " + (_.pluralize(stats.deleted, 'line')) + " deleted in this file not yet committed");
      } else if (stats.added) {
        this.gitStatusIcon.textContent = "+" + stats.added;
        this.updateTooltipText((_.pluralize(stats.added, 'line')) + " added to this file not yet committed");
      } else if (stats.deleted) {
        this.gitStatusIcon.textContent = "-" + stats.deleted;
        this.updateTooltipText((_.pluralize(stats.deleted, 'line')) + " deleted from this file not yet committed");
      } else {
        this.gitStatusIcon.textContent = '';
        this.updateTooltipText();
      }
      return this.gitStatus.style.display = '';
    };

    GitView.prototype.updateAsIgnoredFile = function() {
      this.clearStatus();
      this.gitStatusIcon.classList.add('icon-diff-ignored', 'status-ignored');
      this.gitStatusIcon.textContent = '';
      this.gitStatus.style.display = '';
      return this.updateTooltipText("File is ignored by git");
    };

    GitView.prototype.updateTooltipText = function(text) {
      var ref1;
      if ((ref1 = this.statusTooltipDisposable) != null) {
        ref1.dispose();
      }
      if (text) {
        return this.statusTooltipDisposable = atom.tooltips.add(this.gitStatusIcon, {
          title: text
        });
      }
    };

    GitView.prototype.updateStatusText = function(repo) {
      var hideStatus, itemPath, ref1, status;
      hideStatus = (function(_this) {
        return function() {
          _this.clearStatus();
          return _this.gitStatus.style.display = 'none';
        };
      })(this);
      itemPath = this.getActiveItemPath();
      if (this.showGitInformation(repo) && (itemPath != null)) {
        status = (ref1 = repo.getCachedPathStatus(itemPath)) != null ? ref1 : 0;
        if (repo.isStatusNew(status)) {
          return this.updateAsNewFile();
        }
        if (repo.isStatusModified(status)) {
          return this.updateAsModifiedFile(repo, itemPath);
        }
        if (repo.isPathIgnored(itemPath)) {
          return this.updateAsIgnoredFile();
        } else {
          return hideStatus();
        }
      } else {
        return hideStatus();
      }
    };

    return GitView;

  })(HTMLElement);

  module.exports = document.registerElement('status-bar-git', {
    prototype: GitView.prototype,
    "extends": 'div'
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zdGF0dXMtYmFyL2xpYi9naXQtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHdEQUFBO0lBQUE7OztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBNEMsT0FBQSxDQUFRLE1BQVIsQ0FBNUMsRUFBQyw2Q0FBRCxFQUFzQjs7RUFFaEI7Ozs7Ozs7c0JBQ0osVUFBQSxHQUFZLFNBQUE7TUFDVixJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxVQUFmO01BRUEsSUFBQyxDQUFBLGdCQUFELENBQUE7TUFDQSxJQUFDLENBQUEsaUJBQUQsQ0FBQTtNQUNBLElBQUMsQ0FBQSxnQkFBRCxDQUFBO01BRUEsSUFBQyxDQUFBLHNCQUFELEdBQTBCLElBQUksQ0FBQyxTQUFTLENBQUMseUJBQWYsQ0FBeUMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNqRSxLQUFDLENBQUEscUJBQUQsQ0FBQTtRQURpRTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekM7TUFFMUIsSUFBQyxDQUFBLHVCQUFELEdBQTJCLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWIsQ0FBOEIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUN2RCxLQUFDLENBQUEsdUJBQUQsQ0FBQTtRQUR1RDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUI7TUFFM0IsSUFBQyxDQUFBLHVCQUFELENBQUE7YUFDQSxJQUFDLENBQUEscUJBQUQsQ0FBQTtJQVpVOztzQkFjWixnQkFBQSxHQUFrQixTQUFBO0FBQ2hCLFVBQUE7TUFBQSxJQUFDLENBQUEsVUFBRCxHQUFjLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO01BQ2QsSUFBQyxDQUFB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aUIsTUFBakIsQ0FBSDtBQUNFLGlCQUFPLElBQUMsQ0FBQSxlQUFELENBQUEsRUFEVDs7UUFHQSxJQUFHLElBQUksQ0FBQyxnQkFBTCxDQUFzQixNQUF0QixDQUFIO0FBQ0UsaUJBQU8sSUFBQyxDQUFBLG9CQUFELENBQXNCLElBQXRCLEVBQTRCLFFBQTVCLEVBRFQ7O1FBR0EsSUFBRyxJQUFJLENBQUMsYUFBTCxDQUFtQixRQUFuQixDQUFIO2lCQUNFLElBQUMsQ0FBQSxtQkFBRCxDQUFBLEVBREY7U0FBQSxNQUFBO2lCQUdFLFVBQUEsQ0FBQSxFQUhGO1NBUkY7T0FBQSxNQUFBO2VBYUUsVUFBQSxDQUFBLEVBYkY7O0lBTmdCOzs7O0tBbE1FOztFQXVOdEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIsUUFBUSxDQUFDLGVBQVQsQ0FBeUIsZ0JBQXpCLEVBQTJDO0lBQUEsU0FBQSxFQUFXLE9BQU8sQ0FBQyxTQUFuQjtJQUE4QixDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBQXZDO0dBQTNDO0FBMU5qQiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlIFwidW5kZXJzY29yZS1wbHVzXCJcbntDb21wb3NpdGVEaXNwb3NhYmxlLCBHaXRSZXBvc2l0b3J5QXN5bmN9ID0gcmVxdWlyZSBcImF0b21cIlxuXG5jbGFzcyBHaXRWaWV3IGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAY2xhc3NMaXN0LmFkZCgnZ2l0LXZpZXcnKVxuXG4gICAgQGNyZWF0ZUJyYW5jaEFyZWEoKVxuICAgIEBjcmVhdGVDb21taXRzQXJlYSgpXG4gICAgQGNyZWF0ZVN0YXR1c0FyZWEoKVxuXG4gICAgQGFjdGl2ZUl0ZW1TdWJzY3JpcHRpb24gPSBhdG9tLndvcmtzcGFjZS5vbkRpZENoYW5nZUFjdGl2ZVBhbmVJdGVtID0+XG4gICAgICBAc3Vic2NyaWJlVG9BY3RpdmVJdGVtKClcbiAgICBAcHJvamVjdFBhdGhTdWJzY3JpcHRpb24gPSBhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocyA9PlxuICAgICAgQHN1YnNjcmliZVRvUmVwb3NpdG9yaWVzKClcbiAgICBAc3Vic2NyaWJlVG9SZXBvc2l0b3JpZXMoKVxuICAgIEBzdWJzY3JpYmVUb0FjdGl2ZUl0ZW0oKVxuXG4gIGNyZWF0ZUJyYW5jaEFyZWE6IC0+XG4gICAgQGJyYW5jaEFyZWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIEBicmFuY2hBcmVhLmNsYXNzTGlzdC5hZGQoJ2dpdC1icmFuY2gnLCAnaW5saW5lLWJsb2NrJylcbiAgICBAYXBwZW5kQ2hpbGQoQGJyYW5jaEFyZWEpXG5cbiAgICBicmFuY2hJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpXG4gICAgYnJhbmNoSWNvbi5jbGFzc0xpc3QuYWRkKCdpY29uJywgJ2ljb24tZ2l0LWJyYW5jaCcpXG4gICAgQGJyYW5jaEFyZWEuYXBwZW5kQ2hpbGQoYnJhbmNoSWNvbilcblxuICAgIEBicmFuY2hMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKVxuICAgIEBicmFuY2hMYWJlbC5jbGFzc0xpc3QuYWRkKCdicmFuY2gtbGFiZWwnKVxuICAgIEBicmFuY2hBcmVhLmFwcGVuZENoaWxkKEBicmFuY2hMYWJlbClcblxuICBjcmVhdGVDb21taXRzQXJlYTogLT5cbiAgICBAY29tbWl0c0FyZWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIEBjb21taXRzQXJlYS5jbGFzc0xpc3QuYWRkKCdnaXQtY29tbWl0cycsICdpbmxpbmUtYmxvY2snKVxuICAgIEBhcHBlbmRDaGlsZChAY29tbWl0c0FyZWEpXG5cbiAgICBAY29tbWl0c0FoZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpXG4gICAgQGNvbW1pdHNBaGVhZC5jbGFzc0xpc3QuYWRkKCdpY29uJywgJ2ljb24tYXJyb3ctdXAnLCAnY29tbWl0cy1haGVhZC1sYWJlbCcpXG4gICAgQGNvbW1pdHNBcmVhLmFwcGVuZENoaWxkKEBjb21taXRzQWhlYWQpXG5cbiAgICBAY29tbWl0c0JlaGluZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKVxuICAgIEBjb21taXRzQmVoaW5kLmNsYXNzTGlzdC5hZGQoJ2ljb24nLCAnaWNvbi1hcnJvdy1kb3duJywgJ2NvbW1pdHMtYmVoaW5kLWxhYmVsJylcbiAgICBAY29tbWl0c0FyZWEuYXBwZW5kQ2hpbGQoQGNvbW1pdHNCZWhpbmQpXG5cbiAgY3JlYXRlU3RhdHVzQXJlYTogLT5cbiAgICBAZ2l0U3RhdHVzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBAZ2l0U3RhdHVzLmNsYXNzTGlzdC5hZGQoJ2dpdC1zdGF0dXMnLCAnaW5saW5lLWJsb2NrJylcbiAgICBAYXBwZW5kQ2hpbGQoQGdpdFN0YXR1cylcblxuICAgIEBnaXRTdGF0dXNJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpXG4gICAgQGdpdFN0YXR1c0ljb24uY2xhc3NMaXN0LmFkZCgnaWNvbicpXG4gICAgQGdpdFN0YXR1cy5hcHBlbmRDaGlsZChAZ2l0U3RhdHVzSWNvbilcblxuICBzdWJzY3JpYmVUb0FjdGl2ZUl0ZW06IC0+XG4gICAgYWN0aXZlSXRlbSA9IEBnZXRBY3RpdmVJdGVtKClcblxuICAgIEBzYXZlZFN1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG4gICAgQHNhdmVkU3Vic2NyaXB0aW9uID0gYWN0aXZlSXRlbT8ub25EaWRTYXZlPyA9PiBAdXBkYXRlKClcblxuICAgIEB1cGRhdGUoKVxuXG4gIHN1YnNjcmliZVRvUmVwb3NpdG9yaWVzOiAtPlxuICAgIEByZXBvc2l0b3J5U3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQHJlcG9zaXRvcnlTdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICAgIGZvciByZXBvIGluIGF0b20ucHJvamVjdC5nZXRSZXBvc2l0b3JpZXMoKSB3aGVuIHJlcG8/XG4gICAgICBAcmVwb3NpdG9yeVN1YnNjcmlwdGlvbnMuYWRkIHJlcG8ub25EaWRDaGFuZ2VTdGF0dXMgKHtwYXRoLCBzdGF0dXN9KSA9PlxuICAgICAgICBAdXBkYXRlKCkgaWYgcGF0aCBpcyBAZ2V0QWN0aXZlSXRlbVBhdGgoKVxuICAgICAgQHJlcG9zaXRvcnlTdWJzY3JpcHRpb25zLmFkZCByZXBvLm9uRGlkQ2hhbmdlU3RhdHVzZXMgPT5cbiAgICAgICAgQHVwZGF0ZSgpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAYWN0aXZlSXRlbVN1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG4gICAgQHByb2plY3RQYXRoU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcbiAgICBAc2F2ZWRTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEByZXBvc2l0b3J5U3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQGJyYW5jaFRvb2x0aXBEaXNwb3NhYmxlPy5kaXNwb3NlKClcbiAgICBAY29tbWl0c0FoZWFkVG9vbHRpcERpc3Bvc2FibGU/LmRpc3Bvc2UoKVxuICAgIEBjb21taXRzQmVoaW5kVG9vbHRpcERpc3Bvc2FibGU/LmRpc3Bvc2UoKVxuICAgIEBzdGF0dXNUb29sdGlwRGlzcG9zYWJsZT8uZGlzcG9zZSgpXG5cbiAgZ2V0QWN0aXZlSXRlbVBhdGg6IC0+XG4gICAgQGdldEFjdGl2ZUl0ZW0oKT8uZ2V0UGF0aD8oKVxuXG4gIGdldFJlcG9zaXRvcnlGb3JBY3RpdmVJdGVtOiAtPlxuICAgIFtyb290RGlyXSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChAZ2V0QWN0aXZlSXRlbVBhdGgoKSlcbiAgICByb290RGlySW5kZXggPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKS5pbmRleE9mKHJvb3REaXIpXG4gICAgaWYgcm9vdERpckluZGV4ID49IDBcbiAgICAgIGF0b20ucHJvamVjdC5nZXRSZXBvc2l0b3JpZXMoKVtyb290RGlySW5kZXhdXG4gICAgZWxzZVxuICAgICAgZm9yIHJlcG8gaW4gYXRvbS5wcm9qZWN0LmdldFJlcG9zaXRvcmllcygpIHdoZW4gcmVwb1xuICAgICAgICByZXR1cm4gcmVwb1xuXG4gIGdldEFjdGl2ZUl0ZW06IC0+XG4gICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKVxuXG4gIHVwZGF0ZTogLT5cbiAgICByZXBvID0gQGdldFJlcG9zaXRvcnlGb3JBY3RpdmVJdGVtKClcbiAgICBAdXBkYXRlQnJhbmNoVGV4dChyZXBvKVxuICAgIEB1cGRhdGVBaGVhZEJlaGluZENvdW50KHJlcG8pXG4gICAgQHVwZGF0ZVN0YXR1c1RleHQocmVwbylcblxuICB1cGRhdGVCcmFuY2hUZXh0OiAocmVwbykgLT5cbiAgICBpZiBAc2hvd0dpdEluZm9ybWF0aW9uKHJlcG8pXG4gICAgICBoZWFkID0gcmVwby5nZXRTaG9ydEhlYWQoQGdldEFjdGl2ZUl0ZW1QYXRoKCkpXG4gICAgICBAYnJhbmNoTGFiZWwudGV4dENvbnRlbnQgPSBoZWFkXG4gICAgICBAYnJhbmNoQXJlYS5zdHlsZS5kaXNwbGF5ID0gJycgaWYgaGVhZFxuICAgICAgQGJyYW5jaFRvb2x0aXBEaXNwb3NhYmxlPy5kaXNwb3NlKClcbiAgICAgIEBicmFuY2hUb29sdGlwRGlzcG9zYWJsZSA9IGF0b20udG9vbHRpcHMuYWRkIEBicmFuY2hBcmVhLCB0aXRsZTogXCJPbiBicmFuY2ggI3toZWFkfVwiXG4gICAgZWxzZVxuICAgICAgQGJyYW5jaEFyZWEuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuXG4gIHNob3dHaXRJbmZvcm1hdGlvbjogKHJlcG8pIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyByZXBvP1xuXG4gICAgaWYgaXRlbVBhdGggPSBAZ2V0QWN0aXZlSXRlbVBhdGgoKVxuICAgICAgYXRvbS5wcm9qZWN0LmNvbnRhaW5zKGl0ZW1QYXRoKVxuICAgIGVsc2VcbiAgICAgIG5vdCBAZ2V0QWN0aXZlSXRlbSgpP1xuXG4gIHVwZGF0ZUFoZWFkQmVoaW5kQ291bnQ6IChyZXBvKSAtPlxuICAgIHVubGVzcyBAc2hvd0dpdEluZm9ybWF0aW9uKHJlcG8pXG4gICAgICBAY29tbWl0c0FyZWEuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgcmV0dXJuXG5cbiAgICBpdGVtUGF0aCA9IEBnZXRBY3RpdmVJdGVtUGF0aCgpXG4gICAge2FoZWFkLCBiZWhpbmR9ID0gcmVwby5nZXRDYWNoZWRVcHN0cmVhbUFoZWFkQmVoaW5kQ291bnQoaXRlbVBhdGgpXG4gICAgaWYgYWhlYWQgPiAwXG4gICAgICBAY29tbWl0c0FoZWFkLnRleHRDb250ZW50ID0gYWhlYWRcbiAgICAgIEBjb21taXRzQWhlYWQuc3R5bGUuZGlzcGxheSA9ICcnXG4gICAgICBAY29tbWl0c0FoZWFkVG9vbHRpcERpc3Bvc2FibGU/LmRpc3Bvc2UoKVxuICAgICAgQGNvbW1pdHNBaGVhZFRvb2x0aXBEaXNwb3NhYmxlID0gYXRvbS50b29sdGlwcy5hZGQgQGNvbW1pdHNBaGVhZCwgdGl0bGU6IFwiI3tfLnBsdXJhbGl6ZShhaGVhZCwgJ2NvbW1pdCcpfSBhaGVhZCBvZiB1cHN0cmVhbVwiXG4gICAgZWxzZVxuICAgICAgQGNvbW1pdHNBaGVhZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG5cbiAgICBpZiBiZWhpbmQgPiAwXG4gICAgICBAY29tbWl0c0JlaGluZC50ZXh0Q29udGVudCA9IGJlaGluZFxuICAgICAgQGNvbW1pdHNCZWhpbmQuc3R5bGUuZGlzcGxheSA9ICcnXG4gICAgICBAY29tbWl0c0JlaGluZFRvb2x0aXBEaXNwb3NhYmxlPy5kaXNwb3NlKClcbiAgICAgIEBjb21taXRzQmVoaW5kVG9vbHRpcERpc3Bvc2FibGUgPSBhdG9tLnRvb2x0aXBzLmFkZCBAY29tbWl0c0JlaGluZCwgdGl0bGU6IFwiI3tfLnBsdXJhbGl6ZShiZWhpbmQsICdjb21taXQnKX0gYmVoaW5kIHVwc3RyZWFtXCJcbiAgICBlbHNlXG4gICAgICBAY29tbWl0c0JlaGluZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG5cbiAgICBpZiBhaGVhZCA+IDAgb3IgYmVoaW5kID4gMFxuICAgICAgQGNvbW1pdHNBcmVhLnN0eWxlLmRpc3BsYXkgPSAnJ1xuICAgIGVsc2VcbiAgICAgIEBjb21taXRzQXJlYS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG5cbiAgY2xlYXJTdGF0dXM6IC0+XG4gICAgQGdpdFN0YXR1c0ljb24uY2xhc3NMaXN0LnJlbW92ZSgnaWNvbi1kaWZmLW1vZGlmaWVkJywgJ3N0YXR1cy1tb2RpZmllZCcsICdpY29uLWRpZmYtYWRkZWQnLCAnc3RhdHVzLWFkZGVkJywgJ2ljb24tZGlmZi1pZ25vcmVkJywgJ3N0YXR1cy1pZ25vcmVkJylcblxuICB1cGRhdGVBc05ld0ZpbGU6IC0+XG4gICAgQGNsZWFyU3RhdHVzKClcblxuICAgIEBnaXRTdGF0dXNJY29uLmNsYXNzTGlzdC5hZGQoJ2ljb24tZGlmZi1hZGRlZCcsICdzdGF0dXMtYWRkZWQnKVxuICAgIGlmIHRleHRFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgIEBnaXRTdGF0dXNJY29uLnRleHRDb250ZW50ID0gXCIrI3t0ZXh0RWRpdG9yLmdldExpbmVDb3VudCgpfVwiXG4gICAgICBAdXBkYXRlVG9vbHRpcFRleHQoXCIje18ucGx1cmFsaXplKHRleHRFZGl0b3IuZ2V0TGluZUNvdW50KCksICdsaW5lJyl9IGluIHRoaXMgbmV3IGZpbGUgbm90IHlldCBjb21taXR0ZWRcIilcbiAgICBlbHNlXG4gICAgICBAZ2l0U3RhdHVzSWNvbi50ZXh0Q29udGVudCA9ICcnXG4gICAgICBAdXBkYXRlVG9vbHRpcFRleHQoKVxuXG4gICAgQGdpdFN0YXR1cy5zdHlsZS5kaXNwbGF5ID0gJydcblxuICB1cGRhdGVBc01vZGlmaWVkRmlsZTogKHJlcG8sIHBhdGgpIC0+XG4gICAgc3RhdHMgPSByZXBvLmdldERpZmZTdGF0cyhwYXRoKVxuICAgIEBjbGVhclN0YXR1cygpXG5cbiAgICBAZ2l0U3RhdHVzSWNvbi5jbGFzc0xpc3QuYWRkKCdpY29uLWRpZmYtbW9kaWZpZWQnLCAnc3RhdHVzLW1vZGlmaWVkJylcbiAgICBpZiBzdGF0cy5hZGRlZCBhbmQgc3RhdHMuZGVsZXRlZFxuICAgICAgQGdpdFN0YXR1c0ljb24udGV4dENvbnRlbnQgPSBcIisje3N0YXRzLmFkZGVkfSwgLSN7c3RhdHMuZGVsZXRlZH1cIlxuICAgICAgQHVwZGF0ZVRvb2x0aXBUZXh0KFwiI3tfLnBsdXJhbGl6ZShzdGF0cy5hZGRlZCwgJ2xpbmUnKX0gYWRkZWQgYW5kICN7Xy5wbHVyYWxpemUoc3RhdHMuZGVsZXRlZCwgJ2xpbmUnKX0gZGVsZXRlZCBpbiB0aGlzIGZpbGUgbm90IHlldCBjb21taXR0ZWRcIilcbiAgICBlbHNlIGlmIHN0YXRzLmFkZGVkXG4gICAgICBAZ2l0U3RhdHVzSWNvbi50ZXh0Q29udGVudCA9IFwiKyN7c3RhdHMuYWRkZWR9XCJcbiAgICAgIEB1cGRhdGVUb29sdGlwVGV4dChcIiN7Xy5wbHVyYWxpemUoc3RhdHMuYWRkZWQsICdsaW5lJyl9IGFkZGVkIHRvIHRoaXMgZmlsZSBub3QgeWV0IGNvbW1pdHRlZFwiKVxuICAgIGVsc2UgaWYgc3RhdHMuZGVsZXRlZFxuICAgICAgQGdpdFN0YXR1c0ljb24udGV4dENvbnRlbnQgPSBcIi0je3N0YXRzLmRlbGV0ZWR9XCJcbiAgICAgIEB1cGRhdGVUb29sdGlwVGV4dChcIiN7Xy5wbHVyYWxpemUoc3RhdHMuZGVsZXRlZCwgJ2xpbmUnKX0gZGVsZXRlZCBmcm9tIHRoaXMgZmlsZSBub3QgeWV0IGNvbW1pdHRlZFwiKVxuICAgIGVsc2VcbiAgICAgIEBnaXRTdGF0dXNJY29uLnRleHRDb250ZW50ID0gJydcbiAgICAgIEB1cGRhdGVUb29sdGlwVGV4dCgpXG5cbiAgICBAZ2l0U3RhdHVzLnN0eWxlLmRpc3BsYXkgPSAnJ1xuXG4gIHVwZGF0ZUFzSWdub3JlZEZpbGU6IC0+XG4gICAgQGNsZWFyU3RhdHVzKClcblxuICAgIEBnaXRTdGF0dXNJY29uLmNsYXNzTGlzdC5hZGQoJ2ljb24tZGlmZi1pZ25vcmVkJywgICdzdGF0dXMtaWdub3JlZCcpXG4gICAgQGdpdFN0YXR1c0ljb24udGV4dENvbnRlbnQgPSAnJ1xuICAgIEBnaXRTdGF0dXMuc3R5bGUuZGlzcGxheSA9ICcnXG4gICAgQHVwZGF0ZVRvb2x0aXBUZXh0KFwiRmlsZSBpcyBpZ25vcmVkIGJ5IGdpdFwiKVxuXG4gIHVwZGF0ZVRvb2x0aXBUZXh0OiAodGV4dCkgLT5cbiAgICBAc3RhdHVzVG9vbHRpcERpc3Bvc2FibGU/LmRpc3Bvc2UoKVxuICAgIGlmIHRleHRcbiAgICAgIEBzdGF0dXNUb29sdGlwRGlzcG9zYWJsZSA9IGF0b20udG9vbHRpcHMuYWRkIEBnaXRTdGF0dXNJY29uLCB0aXRsZTogdGV4dFxuXG4gIHVwZGF0ZVN0YXR1c1RleHQ6IChyZXBvKSAtPlxuICAgIGhpZGVTdGF0dXMgPSA9PlxuICAgICAgQGNsZWFyU3RhdHVzKClcbiAgICAgIEBnaXRTdGF0dXMuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuXG4gICAgaXRlbVBhdGggPSBAZ2V0QWN0aXZlSXRlbVBhdGgoKVxuICAgIGlmIEBzaG93R2l0SW5mb3JtYXRpb24ocmVwbykgYW5kIGl0ZW1QYXRoP1xuICAgICAgc3RhdHVzID0gcmVwby5nZXRDYWNoZWRQYXRoU3RhdHVzKGl0ZW1QYXRoKSA/IDBcbiAgICAgIGlmIHJlcG8uaXNTdGF0dXNOZXcoc3RhdHVzKVxuICAgICAgICByZXR1cm4gQHVwZGF0ZUFzTmV3RmlsZSgpXG5cbiAgICAgIGlmIHJlcG8uaXNTdGF0dXNNb2RpZmllZChzdGF0dXMpXG4gICAgICAgIHJldHVybiBAdXBkYXRlQXNNb2RpZmllZEZpbGUocmVwbywgaXRlbVBhdGgpXG5cbiAgICAgIGlmIHJlcG8uaXNQYXRoSWdub3JlZChpdGVtUGF0aClcbiAgICAgICAgQHVwZGF0ZUFzSWdub3JlZEZpbGUoKVxuICAgICAgZWxzZVxuICAgICAgICBoaWRlU3RhdHVzKClcbiAgICBlbHNlXG4gICAgICBoaWRlU3RhdHVzKClcblxubW9kdWxlLmV4cG9ydHMgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ3N0YXR1cy1iYXItZ2l0JywgcHJvdG90eXBlOiBHaXRWaWV3LnByb3RvdHlwZSwgZXh0ZW5kczogJ2RpdicpXG4iXX0=
