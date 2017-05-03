(function() {
  var commandSubscription, createEncodingListView, encodingListView, encodingStatusView, encodings;

  encodingListView = null;

  encodingStatusView = null;

  commandSubscription = null;

  module.exports = {
    activate: function() {
      return commandSubscription = atom.commands.add('atom-text-editor', 'encoding-selector:show', createEncodingListView);
    },
    deactivate: function() {
      if (commandSubscription != null) {
        commandSubscription.dispose();
      }
      commandSubscription = null;
      if (encodingStatusView != null) {
        encodingStatusView.destroy();
      }
      encodingStatusView = null;
      if (encodingListView != null) {
        encodingListView.destroy();
      }
      return encodingListView = null;
    },
    consumeStatusBar: function(statusBar) {
      var EncodingStatusView;
      EncodingStatusView = require('./encoding-status-view');
      encodingStatusView = new EncodingStatusView();
      encodingStatusView.initialize(statusBar, encodings);
      return encodingStatusView.attach();
    }
  };

  createEncodingListView = function() {
    var EncodingListView;
    if (encodingListView == null) {
      EncodingListView = require('./encoding-list-view');
      encodingListView = new EncodingListView(encodings);
    }
    return encodingListView.toggle();
  };

  encodings = {
    utf8: {
      list: 'UTF-8',
      status: 'UTF-8'
    },
    utf16le: {
      list: 'UTF-16 LE',
      status: 'UTF-16 LE'
    },
    utf16be: {
      list: 'UTF-16 BE',
      status: 'UTF-16 BE'
    },
    windows1252: {
      list: 'Western (Windows 1252)',
      status: 'Windows 1252'
    },
    iso88591: {
      list: 'Western (ISO 8859-1)',
      status: 'ISO 8859-1'
    },
    iso88593: {
      list: 'Western (ISO 8859-3)',
      status: 'ISO 8859-3'
    },
    iso885915: {
      list: 'Western (ISO 8859-15)',
      status: 'ISO 8859-15'
    },
    macroman: {
      list: 'Western (Mac Roman)',
      status: 'Mac Roman'
    },
    cp437: {
      list: 'DOS (CP 437)',
      status: 'CP437'
    },
    windows1256: {
      list: 'Arabic (Windows 1256)',
      status: 'Windows 1256'
    },
    iso88596: {
      list: 'Arabic (ISO 8859-6)',
      status: 'ISO 8859-6'
    },
    windows1257: {
      list: 'Baltic (Windows 1257)',
      status: 'Windows 1257'
    },
    iso88594: {
      list: 'Baltic (ISO 8859-4)',
      status: 'ISO 8859-4'
    },
    iso885914: {
      list: 'Celtic (ISO 8859-14)',
      status: 'ISO 8859-14'
    },
    windows1250: {
      list: 'Central European (Windows 1250)',
      status: 'Windows 1250'
    },
    iso88592: {
      list: 'Central European (ISO 8859-2)',
      status: 'ISO 8859-2'
    },
    windows1251: {
      list: 'Cyrillic (Windows 1251)',
      status: 'Windows 1251'
    },
    cp866: {
      list: 'Cyrillic (CP 866)',
      status: 'CP 866'
    },
    iso88595: {
      list: 'Cyrillic (ISO 8859-5)',
      status: 'ISO 8859-5'
    },
    koi8r: {
      list: 'Cyrillic (KOI8-R)',
      status: 'KOI8-R'
    },
    koi8u: {
      list: 'Cyrillic (KOI8-U)',
      status: 'KOI8-U'
    },
    iso885913: {
      list: 'Estonian (ISO 8859-13)',
      status: 'ISO 8859-13'
    },
    windows1253: {
      list: 'Greek (Windows 1253)',
      status: 'Windows 1253'
    },
    iso88597: {
      list: 'Greek (ISO 8859-7)',
      status: 'ISO 8859-7'
    },
    windows1255: {
      list: 'Hebrew (Windows 1255)',
      status: 'Windows 1255'
    },
    iso88598: {
      list: 'Hebrew (ISO 8859-8)',
      status: 'ISO 8859-8'
    },
    iso885910: {
      list: 'Nordic (ISO 8859-10)',
      status: 'ISO 8859-10'
    },
    iso885916: {
      list: 'Romanian (ISO 8859-16)',
      status: 'ISO 8859-16'
    },
    windows1254: {
      list: 'Turkish (Windows 1254)',
      status: 'Windows 1254'
    },
    iso88599: {
      list: 'Turkish (ISO 8859-9)',
      status: 'ISO 8859-9'
    },
    windows1258: {
      list: 'Vietnamese (Windows 1254)',
      status: 'Windows 1254'
    },
    gbk: {
      list: 'Chinese (GBK)',
      status: 'GBK'
    },
    gb18030: {
      list: 'Chinese (GB18030)',
      status: 'GB18030'
    },
    cp950: {
      list: 'Traditional Chinese (Big5)',
      status: 'Big5'
    },
    big5hkscs: {
      list: 'Traditional Chinese (Big5-HKSCS)',
      status: 'Big5-HKSCS'
    },
    shiftjis: {
      list: 'Japanese (Shift JIS)',
      status: 'Shift JIS'
    },
    cp932: {
      list: 'Japanese (CP 932)',
      status: 'CP 932'
    },
    eucjp: {
      list: 'Japanese (EUC-JP)',
      status: 'EUC-JP'
    },
    euckr: {
      list: 'Korean (EUC-KR)',
      status: 'EUC-KR'
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9lbmNvZGluZy1zZWxlY3Rvci9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLGdCQUFBLEdBQW1COztFQUNuQixrQkFBQSxHQUFxQjs7RUFDckIsbUJBQUEsR0FBc0I7O0VBRXRCLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQTthQUNSLG1CQUFBLEdBQXNCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixrQkFBbEIsRUFBc0Msd0JBQXRDLEVBQWdFLHNCQUFoRTtJQURkLENBQVY7SUFHQSxVQUFBLEVBQVksU0FBQTs7UUFDVixtQkFBbUIsQ0FBRSxPQUFyQixDQUFBOztNQUNBLG1CQUFBLEdBQXNCOztRQUV0QixrQkFBa0IsQ0FBRSxPQUFwQixDQUFBOztNQUNBLGtCQUFBLEdBQXFCOztRQUVyQixnQkFBZ0IsQ0FBRSxPQUFsQixDQUFBOzthQUNBLGdCQUFBLEdBQW1CO0lBUlQsQ0FIWjtJQWFBLGdCQUFBLEVBQWtCLFNBQUMsU0FBRDtBQUNoQixVQUFBO01BQUEsa0JBQUEsR0FBcUIsT0FBQSxDQUFRLHdCQUFSO01BQ3JCLGtCQUFBLEdBQXlCLElBQUEsa0JBQUEsQ0FBQTtNQUN6QixrQkFBa0IsQ0FBQyxVQUFuQixDQUE4QixTQUE5QixFQUF5QyxTQUF6QzthQUNBLGtCQUFrQixDQUFDLE1BQW5CLENBQUE7SUFKZ0IsQ0FibEI7OztFQW1CRixzQkFBQSxHQUF5QixTQUFBO0FBQ3ZCLFFBQUE7SUFBQSxJQUFPLHdCQUFQO01BQ0UsZ0JBQUEsR0FBbUIsT0FBQSxDQUFRLHNCQUFSO01BQ25CLGdCQUFBLEdBQXVCLElBQUEsZ0JBQUEsQ0FBaUIsU0FBakIsRUFGekI7O1dBR0EsZ0JBQWdCLENBQUMsTUFBakIsQ0FBQTtFQUp1Qjs7RUFNekIsU0FBQSxHQUNFO0lBQUEsSUFBQSxFQUNFO01BQUEsSUFBQSxFQUFNLE9BQU47TUFDQSxNQUFBLEVBQVEsT0FEUjtLQURGO0lBR0EsT0FBQSxFQUNFO01BQUEsSUFBQSxFQUFNLFdBQU47TUFDQSxNQUFBLEVBQVEsV0FEUjtLQUpGO0lBTUEsT0FBQSxFQUNFO01BQUEsSUFBQSxFQUFNLFdBQU47TUFDQSxNQUFBLEVBQVEsV0FEUjtLQVBGO0lBU0EsV0FBQSxFQUNFO01BQUEsSUFBQSxFQUFNLHdCQUFOO01BQ0EsTUFBQSxFQUFRLGNBRFI7S0FWRjtJQVlBLFFBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxzQkFBTjtNQUNBLE1BQUEsRUFBUSxZQURSO0tBYkY7SUFlQSxRQUFBLEVBQ0U7TUFBQSxJQUFBLEVBQU0sc0JBQU47TUFDQSxNQUFBLEVBQVEsWUFEUjtLQWhCRjtJQWtCQSxTQUFBLEVBQ0U7TUFBQSxJQUFBLEVBQU0sdUJBQU47TUFDQSxNQUFBLEVBQVEsYUFEUjtLQW5CRjtJQXFCQSxRQUFBLEVBQ0U7TUFBQSxJQUFBLEVBQU0scUJBQU47TUFDQSxNQUFBLEVBQVEsV0FEUjtLQXRCRjtJQXdCQSxLQUFBLEVBQ0U7TUFBQSxJQUFBLEVBQU0sY0FBTjtNQUNBLE1BQUEsRUFBUSxPQURSO0tBekJGO0lBMkJBLFdBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSx1QkFBTjtNQUNBLE1BQUEsRUFBUSxjQURSO0tBNUJGO0lBOEJBLFFBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxxQkFBTjtNQUNBLE1BQUEsRUFBUSxZQURSO0tBL0JGO0lBaUNBLFdBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSx1QkFBTjtNQUNBLE1BQUEsRUFBUSxjQURSO0tBbENGO0lBb0NBLFFBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxxQkFBTjtNQUNBLE1BQUEsRUFBUSxZQURSO0tBckNGO0lBdUNBLFNBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxzQkFBTjtNQUNBLE1BQUEsRUFBUSxhQURSO0tBeENGO0lBMENBLFdBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxpQ0FBTjtNQUNBLE1BQUEsRUFBUSxjQURSO0tBM0NGO0lBNkNBLFFBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSwrQkFBTjtNQUNBLE1BQUEsRUFBUSxZQURSO0tBOUNGO0lBZ0RBLFdBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSx5QkFBTjtNQUNBLE1BQUEsRUFBUSxjQURSO0tBakRGO0lBbURBLEtBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxtQkFBTjtNQUNBLE1BQUEsRUFBUSxRQURSO0tBcERGO0lBc0RBLFFBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSx1QkFBTjtNQUNBLE1BQUEsRUFBUSxZQURSO0tBdkRGO0lBeURBLEtBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxtQkFBTjtNQUNBLE1BQUEsRUFBUSxRQURSO0tBMURGO0lBNERBLEtBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxtQkFBTjtNQUNBLE1BQUEsRUFBUSxRQURSO0tBN0RGO0lBK0RBLFNBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSx3QkFBTjtNQUNBLE1BQUEsRUFBUSxhQURSO0tBaEVGO0lBa0VBLFdBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxzQkFBTjtNQUNBLE1BQUEsRUFBUSxjQURSO0tBbkVGO0lBcUVBLFFBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxvQkFBTjtNQUNBLE1BQUEsRUFBUSxZQURSO0tBdEVGO0lBd0VBLFdBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSx1QkFBTjtNQUNBLE1BQUEsRUFBUSxjQURSO0tBekVGO0lBMkVBLFFBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxxQkFBTjtNQUNBLE1BQUEsRUFBUSxZQURSO0tBNUVGO0lBOEVBLFNBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxzQkFBTjtNQUNBLE1BQUEsRUFBUSxhQURSO0tBL0VGO0lBaUZBLFNBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSx3QkFBTjtNQUNBLE1BQUEsRUFBUSxhQURSO0tBbEZGO0lBb0ZBLFdBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSx3QkFBTjtNQUNBLE1BQUEsRUFBUSxjQURSO0tBckZGO0lBdUZBLFFBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxzQkFBTjtNQUNBLE1BQUEsRUFBUSxZQURSO0tBeEZGO0lBMEZBLFdBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSwyQkFBTjtNQUNBLE1BQUEsRUFBUSxjQURSO0tBM0ZGO0lBNkZBLEdBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxlQUFOO01BQ0EsTUFBQSxFQUFRLEtBRFI7S0E5RkY7SUFnR0EsT0FBQSxFQUNFO01BQUEsSUFBQSxFQUFNLG1CQUFOO01BQ0EsTUFBQSxFQUFRLFNBRFI7S0FqR0Y7SUFtR0EsS0FBQSxFQUNFO01BQUEsSUFBQSxFQUFNLDRCQUFOO01BQ0EsTUFBQSxFQUFRLE1BRFI7S0FwR0Y7SUFzR0EsU0FBQSxFQUNFO01BQUEsSUFBQSxFQUFNLGtDQUFOO01BQ0EsTUFBQSxFQUFRLFlBRFI7S0F2R0Y7SUF5R0EsUUFBQSxFQUNFO01BQUEsSUFBQSxFQUFNLHNCQUFOO01BQ0EsTUFBQSxFQUFRLFdBRFI7S0ExR0Y7SUE0R0EsS0FBQSxFQUNFO01BQUEsSUFBQSxFQUFNLG1CQUFOO01BQ0EsTUFBQSxFQUFRLFFBRFI7S0E3R0Y7SUErR0EsS0FBQSxFQUNFO01BQUEsSUFBQSxFQUFNLG1CQUFOO01BQ0EsTUFBQSxFQUFRLFFBRFI7S0FoSEY7SUFrSEEsS0FBQSxFQUNFO01BQUEsSUFBQSxFQUFNLGlCQUFOO01BQ0EsTUFBQSxFQUFRLFFBRFI7S0FuSEY7O0FBL0JGIiwic291cmNlc0NvbnRlbnQiOlsiZW5jb2RpbmdMaXN0VmlldyA9IG51bGxcbmVuY29kaW5nU3RhdHVzVmlldyA9IG51bGxcbmNvbW1hbmRTdWJzY3JpcHRpb24gPSBudWxsXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgYWN0aXZhdGU6IC0+XG4gICAgY29tbWFuZFN1YnNjcmlwdGlvbiA9IGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywgJ2VuY29kaW5nLXNlbGVjdG9yOnNob3cnLCBjcmVhdGVFbmNvZGluZ0xpc3RWaWV3KVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgY29tbWFuZFN1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG4gICAgY29tbWFuZFN1YnNjcmlwdGlvbiA9IG51bGxcblxuICAgIGVuY29kaW5nU3RhdHVzVmlldz8uZGVzdHJveSgpXG4gICAgZW5jb2RpbmdTdGF0dXNWaWV3ID0gbnVsbFxuXG4gICAgZW5jb2RpbmdMaXN0Vmlldz8uZGVzdHJveSgpXG4gICAgZW5jb2RpbmdMaXN0VmlldyA9IG51bGxcblxuICBjb25zdW1lU3RhdHVzQmFyOiAoc3RhdHVzQmFyKSAtPlxuICAgIEVuY29kaW5nU3RhdHVzVmlldyA9IHJlcXVpcmUgJy4vZW5jb2Rpbmctc3RhdHVzLXZpZXcnXG4gICAgZW5jb2RpbmdTdGF0dXNWaWV3ID0gbmV3IEVuY29kaW5nU3RhdHVzVmlldygpXG4gICAgZW5jb2RpbmdTdGF0dXNWaWV3LmluaXRpYWxpemUoc3RhdHVzQmFyLCBlbmNvZGluZ3MpXG4gICAgZW5jb2RpbmdTdGF0dXNWaWV3LmF0dGFjaCgpXG5cbmNyZWF0ZUVuY29kaW5nTGlzdFZpZXcgPSAtPlxuICB1bmxlc3MgZW5jb2RpbmdMaXN0Vmlldz9cbiAgICBFbmNvZGluZ0xpc3RWaWV3ID0gcmVxdWlyZSAnLi9lbmNvZGluZy1saXN0LXZpZXcnXG4gICAgZW5jb2RpbmdMaXN0VmlldyA9IG5ldyBFbmNvZGluZ0xpc3RWaWV3KGVuY29kaW5ncylcbiAgZW5jb2RpbmdMaXN0Vmlldy50b2dnbGUoKVxuXG5lbmNvZGluZ3MgPVxuICB1dGY4OlxuICAgIGxpc3Q6ICdVVEYtOCdcbiAgICBzdGF0dXM6ICdVVEYtOCdcbiAgdXRmMTZsZTpcbiAgICBsaXN0OiAnVVRGLTE2IExFJ1xuICAgIHN0YXR1czogJ1VURi0xNiBMRSdcbiAgdXRmMTZiZTpcbiAgICBsaXN0OiAnVVRGLTE2IEJFJ1xuICAgIHN0YXR1czogJ1VURi0xNiBCRSdcbiAgd2luZG93czEyNTI6XG4gICAgbGlzdDogJ1dlc3Rlcm4gKFdpbmRvd3MgMTI1MiknXG4gICAgc3RhdHVzOiAnV2luZG93cyAxMjUyJ1xuICBpc284ODU5MTpcbiAgICBsaXN0OiAnV2VzdGVybiAoSVNPIDg4NTktMSknXG4gICAgc3RhdHVzOiAnSVNPIDg4NTktMSdcbiAgaXNvODg1OTM6XG4gICAgbGlzdDogJ1dlc3Rlcm4gKElTTyA4ODU5LTMpJ1xuICAgIHN0YXR1czogJ0lTTyA4ODU5LTMnXG4gIGlzbzg4NTkxNTpcbiAgICBsaXN0OiAnV2VzdGVybiAoSVNPIDg4NTktMTUpJ1xuICAgIHN0YXR1czogJ0lTTyA4ODU5LTE1J1xuICBtYWNyb21hbjpcbiAgICBsaXN0OiAnV2VzdGVybiAoTWFjIFJvbWFuKSdcbiAgICBzdGF0dXM6ICdNYWMgUm9tYW4nXG4gIGNwNDM3OlxuICAgIGxpc3Q6ICdET1MgKENQIDQzNyknXG4gICAgc3RhdHVzOiAnQ1A0MzcnXG4gIHdpbmRvd3MxMjU2OlxuICAgIGxpc3Q6ICdBcmFiaWMgKFdpbmRvd3MgMTI1NiknXG4gICAgc3RhdHVzOiAnV2luZG93cyAxMjU2J1xuICBpc284ODU5NjpcbiAgICBsaXN0OiAnQXJhYmljIChJU08gODg1OS02KSdcbiAgICBzdGF0dXM6ICdJU08gODg1OS02J1xuICB3aW5kb3dzMTI1NzpcbiAgICBsaXN0OiAnQmFsdGljIChXaW5kb3dzIDEyNTcpJ1xuICAgIHN0YXR1czogJ1dpbmRvd3MgMTI1NydcbiAgaXNvODg1OTQ6XG4gICAgbGlzdDogJ0JhbHRpYyAoSVNPIDg4NTktNCknXG4gICAgc3RhdHVzOiAnSVNPIDg4NTktNCdcbiAgaXNvODg1OTE0OlxuICAgIGxpc3Q6ICdDZWx0aWMgKElTTyA4ODU5LTE0KSdcbiAgICBzdGF0dXM6ICdJU08gODg1OS0xNCdcbiAgd2luZG93czEyNTA6XG4gICAgbGlzdDogJ0NlbnRyYWwgRXVyb3BlYW4gKFdpbmRvd3MgMTI1MCknXG4gICAgc3RhdHVzOiAnV2luZG93cyAxMjUwJ1xuICBpc284ODU5MjpcbiAgICBsaXN0OiAnQ2VudHJhbCBFdXJvcGVhbiAoSVNPIDg4NTktMiknXG4gICAgc3RhdHVzOiAnSVNPIDg4NTktMidcbiAgd2luZG93czEyNTE6XG4gICAgbGlzdDogJ0N5cmlsbGljIChXaW5kb3dzIDEyNTEpJ1xuICAgIHN0YXR1czogJ1dpbmRvd3MgMTI1MSdcbiAgY3A4NjY6XG4gICAgbGlzdDogJ0N5cmlsbGljIChDUCA4NjYpJ1xuICAgIHN0YXR1czogJ0NQIDg2NidcbiAgaXNvODg1OTU6XG4gICAgbGlzdDogJ0N5cmlsbGljIChJU08gODg1OS01KSdcbiAgICBzdGF0dXM6ICdJU08gODg1OS01J1xuICBrb2k4cjpcbiAgICBsaXN0OiAnQ3lyaWxsaWMgKEtPSTgtUiknXG4gICAgc3RhdHVzOiAnS09JOC1SJ1xuICBrb2k4dTpcbiAgICBsaXN0OiAnQ3lyaWxsaWMgKEtPSTgtVSknXG4gICAgc3RhdHVzOiAnS09JOC1VJ1xuICBpc284ODU5MTM6XG4gICAgbGlzdDogJ0VzdG9uaWFuIChJU08gODg1OS0xMyknXG4gICAgc3RhdHVzOiAnSVNPIDg4NTktMTMnXG4gIHdpbmRvd3MxMjUzOlxuICAgIGxpc3Q6ICdHcmVlayAoV2luZG93cyAxMjUzKSdcbiAgICBzdGF0dXM6ICdXaW5kb3dzIDEyNTMnXG4gIGlzbzg4NTk3OlxuICAgIGxpc3Q6ICdHcmVlayAoSVNPIDg4NTktNyknXG4gICAgc3RhdHVzOiAnSVNPIDg4NTktNydcbiAgd2luZG93czEyNTU6XG4gICAgbGlzdDogJ0hlYnJldyAoV2luZG93cyAxMjU1KSdcbiAgICBzdGF0dXM6ICdXaW5kb3dzIDEyNTUnXG4gIGlzbzg4NTk4OlxuICAgIGxpc3Q6ICdIZWJyZXcgKElTTyA4ODU5LTgpJ1xuICAgIHN0YXR1czogJ0lTTyA4ODU5LTgnXG4gIGlzbzg4NTkxMDpcbiAgICBsaXN0OiAnTm9yZGljIChJU08gODg1OS0xMCknXG4gICAgc3RhdHVzOiAnSVNPIDg4NTktMTAnXG4gIGlzbzg4NTkxNjpcbiAgICBsaXN0OiAnUm9tYW5pYW4gKElTTyA4ODU5LTE2KSdcbiAgICBzdGF0dXM6ICdJU08gODg1OS0xNidcbiAgd2luZG93czEyNTQ6XG4gICAgbGlzdDogJ1R1cmtpc2ggKFdpbmRvd3MgMTI1NCknXG4gICAgc3RhdHVzOiAnV2luZG93cyAxMjU0J1xuICBpc284ODU5OTpcbiAgICBsaXN0OiAnVHVya2lzaCAoSVNPIDg4NTktOSknXG4gICAgc3RhdHVzOiAnSVNPIDg4NTktOSdcbiAgd2luZG93czEyNTg6XG4gICAgbGlzdDogJ1ZpZXRuYW1lc2UgKFdpbmRvd3MgMTI1NCknXG4gICAgc3RhdHVzOiAnV2luZG93cyAxMjU0J1xuICBnYms6XG4gICAgbGlzdDogJ0NoaW5lc2UgKEdCSyknXG4gICAgc3RhdHVzOiAnR0JLJ1xuICBnYjE4MDMwOlxuICAgIGxpc3Q6ICdDaGluZXNlIChHQjE4MDMwKSdcbiAgICBzdGF0dXM6ICdHQjE4MDMwJ1xuICBjcDk1MDpcbiAgICBsaXN0OiAnVHJhZGl0aW9uYWwgQ2hpbmVzZSAoQmlnNSknXG4gICAgc3RhdHVzOiAnQmlnNSdcbiAgYmlnNWhrc2NzOlxuICAgIGxpc3Q6ICdUcmFkaXRpb25hbCBDaGluZXNlIChCaWc1LUhLU0NTKSdcbiAgICBzdGF0dXM6ICdCaWc1LUhLU0NTJ1xuICBzaGlmdGppczpcbiAgICBsaXN0OiAnSmFwYW5lc2UgKFNoaWZ0IEpJUyknXG4gICAgc3RhdHVzOiAnU2hpZnQgSklTJ1xuICBjcDkzMjpcbiAgICBsaXN0OiAnSmFwYW5lc2UgKENQIDkzMiknXG4gICAgc3RhdHVzOiAnQ1AgOTMyJ1xuICBldWNqcDpcbiAgICBsaXN0OiAnSmFwYW5lc2UgKEVVQy1KUCknXG4gICAgc3RhdHVzOiAnRVVDLUpQJ1xuICBldWNrcjpcbiAgICBsaXN0OiAnS29yZWFuIChFVUMtS1IpJ1xuICAgIHN0YXR1czogJ0VVQy1LUidcbiJdfQ==
