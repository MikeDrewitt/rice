(function() {
  var Range;

  Range = require('atom').Range;

  module.exports = {
    copyType: function(text) {
      if (text.lastIndexOf("\n") === text.length - 1) {
        return 'linewise';
      } else if (text.lastIndexOf("\r") === text.length - 1) {
        return 'linewise';
      } else {
        return 'character';
      }
    },
    mergeRanges: function(oldRange, newRange) {
      oldRange = Range.fromObject(oldRange);
      newRange = Range.fromObject(newRange);
      if (oldRange.isEmpty()) {
        return newRange;
      } else {
        return oldRange.union(newRange);
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvdXRpbHMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxRQUFTLE9BQUEsQ0FBUSxNQUFSOztFQUVWLE1BQU0sQ0FBQyxPQUFQLEdBT0U7SUFBQSxRQUFBLEVBQVUsU0FBQyxJQUFEO01BQ1IsSUFBRyxJQUFJLENBQUMsV0FBTCxDQUFpQixJQUFqQixDQUFBLEtBQTBCLElBQUksQ0FBQyxNQUFMLEdBQWMsQ0FBM0M7ZUFDRSxXQURGO09BQUEsTUFFSyxJQUFHLElBQUksQ0FBQyxXQUFMLENBQWlCLElBQWpCLENBQUEsS0FBMEIsSUFBSSxDQUFDLE1BQUwsR0FBYyxDQUEzQztlQUNILFdBREc7T0FBQSxNQUFBO2VBR0gsWUFIRzs7SUFIRyxDQUFWO0lBV0EsV0FBQSxFQUFhLFNBQUMsUUFBRCxFQUFXLFFBQVg7TUFDWCxRQUFBLEdBQVcsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsUUFBakI7TUFDWCxRQUFBLEdBQVcsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsUUFBakI7TUFDWCxJQUFHLFFBQVEsQ0FBQyxPQUFULENBQUEsQ0FBSDtlQUNFLFNBREY7T0FBQSxNQUFBO2VBR0UsUUFBUSxDQUFDLEtBQVQsQ0FBZSxRQUFmLEVBSEY7O0lBSFcsQ0FYYjs7QUFURiIsInNvdXJjZXNDb250ZW50IjpbIntSYW5nZX0gPSByZXF1aXJlICdhdG9tJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gICMgUHVibGljOiBEZXRlcm1pbmVzIGlmIGEgc3RyaW5nIHNob3VsZCBiZSBjb25zaWRlcmVkIGxpbmV3aXNlIG9yIGNoYXJhY3RlclxuICAjXG4gICMgdGV4dCAtIFRoZSBzdHJpbmcgdG8gY29uc2lkZXJcbiAgI1xuICAjIFJldHVybnMgJ2xpbmV3aXNlJyBpZiB0aGUgc3RyaW5nIGVuZHMgd2l0aCBhIGxpbmUgcmV0dXJuIGFuZCAnY2hhcmFjdGVyJ1xuICAjICBvdGhlcndpc2UuXG4gIGNvcHlUeXBlOiAodGV4dCkgLT5cbiAgICBpZiB0ZXh0Lmxhc3RJbmRleE9mKFwiXFxuXCIpIGlzIHRleHQubGVuZ3RoIC0gMVxuICAgICAgJ2xpbmV3aXNlJ1xuICAgIGVsc2UgaWYgdGV4dC5sYXN0SW5kZXhPZihcIlxcclwiKSBpcyB0ZXh0Lmxlbmd0aCAtIDFcbiAgICAgICdsaW5ld2lzZSdcbiAgICBlbHNlXG4gICAgICAnY2hhcmFjdGVyJ1xuXG4gICMgUHVibGljOiByZXR1cm4gYSB1bmlvbiBvZiB0d28gcmFuZ2VzLCBvciBzaW1wbHkgdGhlIG5ld1JhbmdlIGlmIHRoZSBvbGRSYW5nZSBpcyBlbXB0eS5cbiAgI1xuICAjIFJldHVybnMgYSBSYW5nZVxuICBtZXJnZVJhbmdlczogKG9sZFJhbmdlLCBuZXdSYW5nZSkgLT5cbiAgICBvbGRSYW5nZSA9IFJhbmdlLmZyb21PYmplY3Qgb2xkUmFuZ2VcbiAgICBuZXdSYW5nZSA9IFJhbmdlLmZyb21PYmplY3QgbmV3UmFuZ2VcbiAgICBpZiBvbGRSYW5nZS5pc0VtcHR5KClcbiAgICAgIG5ld1JhbmdlXG4gICAgZWxzZVxuICAgICAgb2xkUmFuZ2UudW5pb24obmV3UmFuZ2UpXG4iXX0=
