(function() {
  module.exports = {
    config: {
      forceInline: {
        title: 'Force Inline',
        description: 'Elements in this comma delimited list will render their closing tags on the same line, even if they are block by default. Use * to force all closing tags to render inline',
        type: 'array',
        "default": ['title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
      },
      forceBlock: {
        title: 'Force Block',
        description: 'Elements in this comma delimited list will render their closing tags after a tabbed line, even if they are inline by default. Values are ignored if Force Inline is *',
        type: 'array',
        "default": ['head']
      },
      neverClose: {
        title: 'Never Close Elements',
        description: 'Comma delimited list of elements to never close',
        type: 'array',
        "default": ['br', 'hr', 'img', 'input', 'link', 'meta', 'area', 'base', 'col', 'command', 'embed', 'keygen', 'param', 'source', 'track', 'wbr']
      },
      makeNeverCloseSelfClosing: {
        title: 'Make Never Close Elements Self-Closing',
        description: 'Closes elements with " />" (ie &lt;br&gt; becomes &lt;br /&gt;)',
        type: 'boolean',
        "default": true
      },
      legacyMode: {
        title: "Legacy/International Mode",
        description: "Do not use this unless you use a non-US or non-QUERTY keyboard and/or the plugin isn't working otherwise. USING THIS OPTION WILL OPT YOU OUT OF NEW IMPROVEMENTS/FEATURES POST 0.22.0",
        type: 'boolean',
        "default": false
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy9hdXRvY2xvc2UtaHRtbC9saWIvY29uZmlndXJhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNJO0lBQUEsTUFBQSxFQUNJO01BQUEsV0FBQSxFQUNJO1FBQUEsS0FBQSxFQUFPLGNBQVA7UUFDQSxXQUFBLEVBQWEsNEtBRGI7UUFFQSxJQUFBLEVBQU0sT0FGTjtRQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsQ0FBQyxPQUFELEVBQVUsSUFBVixFQUFnQixJQUFoQixFQUFzQixJQUF0QixFQUE0QixJQUE1QixFQUFrQyxJQUFsQyxFQUF3QyxJQUF4QyxDQUhUO09BREo7TUFLQSxVQUFBLEVBQ0k7UUFBQSxLQUFBLEVBQU8sYUFBUDtRQUNBLFdBQUEsRUFBYSx1S0FEYjtRQUVBLElBQUEsRUFBTSxPQUZOO1FBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxDQUFDLE1BQUQsQ0FIVDtPQU5KO01BVUEsVUFBQSxFQUNJO1FBQUEsS0FBQSxFQUFPLHNCQUFQO1FBQ0EsV0FBQSxFQUFhLGlEQURiO1FBRUEsSUFBQSxFQUFNLE9BRk47UUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLENBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxLQUFiLEVBQW9CLE9BQXBCLEVBQTZCLE1BQTdCLEVBQXFDLE1BQXJDLEVBQTZDLE1BQTdDLEVBQXFELE1BQXJELEVBQTZELEtBQTdELEVBQW9FLFNBQXBFLEVBQStFLE9BQS9FLEVBQXdGLFFBQXhGLEVBQWtHLE9BQWxHLEVBQTJHLFFBQTNHLEVBQXFILE9BQXJILEVBQThILEtBQTlILENBSFQ7T0FYSjtNQWVBLHlCQUFBLEVBQ0k7UUFBQSxLQUFBLEVBQU8sd0NBQVA7UUFDQSxXQUFBLEVBQWEsaUVBRGI7UUFFQSxJQUFBLEVBQU0sU0FGTjtRQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFIVDtPQWhCSjtNQW9CQSxVQUFBLEVBQ0k7UUFBQSxLQUFBLEVBQU8sMkJBQVA7UUFDQSxXQUFBLEVBQWEsdUxBRGI7UUFFQSxJQUFBLEVBQU0sU0FGTjtRQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FIVDtPQXJCSjtLQURKOztBQURKIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuICAgIGNvbmZpZzpcbiAgICAgICAgZm9yY2VJbmxpbmU6XG4gICAgICAgICAgICB0aXRsZTogJ0ZvcmNlIElubGluZSdcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRWxlbWVudHMgaW4gdGhpcyBjb21tYSBkZWxpbWl0ZWQgbGlzdCB3aWxsIHJlbmRlciB0aGVpciBjbG9zaW5nIHRhZ3Mgb24gdGhlIHNhbWUgbGluZSwgZXZlbiBpZiB0aGV5IGFyZSBibG9jayBieSBkZWZhdWx0LiBVc2UgKiB0byBmb3JjZSBhbGwgY2xvc2luZyB0YWdzIHRvIHJlbmRlciBpbmxpbmUnXG4gICAgICAgICAgICB0eXBlOiAnYXJyYXknXG4gICAgICAgICAgICBkZWZhdWx0OiBbJ3RpdGxlJywgJ2gxJywgJ2gyJywgJ2gzJywgJ2g0JywgJ2g1JywgJ2g2J11cbiAgICAgICAgZm9yY2VCbG9jazpcbiAgICAgICAgICAgIHRpdGxlOiAnRm9yY2UgQmxvY2snXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0VsZW1lbnRzIGluIHRoaXMgY29tbWEgZGVsaW1pdGVkIGxpc3Qgd2lsbCByZW5kZXIgdGhlaXIgY2xvc2luZyB0YWdzIGFmdGVyIGEgdGFiYmVkIGxpbmUsIGV2ZW4gaWYgdGhleSBhcmUgaW5saW5lIGJ5IGRlZmF1bHQuIFZhbHVlcyBhcmUgaWdub3JlZCBpZiBGb3JjZSBJbmxpbmUgaXMgKidcbiAgICAgICAgICAgIHR5cGU6ICdhcnJheSdcbiAgICAgICAgICAgIGRlZmF1bHQ6IFsnaGVhZCddXG4gICAgICAgIG5ldmVyQ2xvc2U6XG4gICAgICAgICAgICB0aXRsZTogJ05ldmVyIENsb3NlIEVsZW1lbnRzJ1xuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDb21tYSBkZWxpbWl0ZWQgbGlzdCBvZiBlbGVtZW50cyB0byBuZXZlciBjbG9zZSdcbiAgICAgICAgICAgIHR5cGU6ICdhcnJheSdcbiAgICAgICAgICAgIGRlZmF1bHQ6IFsnYnInLCAnaHInLCAnaW1nJywgJ2lucHV0JywgJ2xpbmsnLCAnbWV0YScsICdhcmVhJywgJ2Jhc2UnLCAnY29sJywgJ2NvbW1hbmQnLCAnZW1iZWQnLCAna2V5Z2VuJywgJ3BhcmFtJywgJ3NvdXJjZScsICd0cmFjaycsICd3YnInXVxuICAgICAgICBtYWtlTmV2ZXJDbG9zZVNlbGZDbG9zaW5nOlxuICAgICAgICAgICAgdGl0bGU6ICdNYWtlIE5ldmVyIENsb3NlIEVsZW1lbnRzIFNlbGYtQ2xvc2luZydcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ2xvc2VzIGVsZW1lbnRzIHdpdGggXCIgLz5cIiAoaWUgJmx0O2JyJmd0OyBiZWNvbWVzICZsdDticiAvJmd0OyknXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgbGVnYWN5TW9kZTpcbiAgICAgICAgICAgIHRpdGxlOiBcIkxlZ2FjeS9JbnRlcm5hdGlvbmFsIE1vZGVcIlxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRG8gbm90IHVzZSB0aGlzIHVubGVzcyB5b3UgdXNlIGEgbm9uLVVTIG9yIG5vbi1RVUVSVFkga2V5Ym9hcmQgYW5kL29yIHRoZSBwbHVnaW4gaXNuJ3Qgd29ya2luZyBvdGhlcndpc2UuIFVTSU5HIFRISVMgT1BUSU9OIFdJTEwgT1BUIFlPVSBPVVQgT0YgTkVXIElNUFJPVkVNRU5UUy9GRUFUVVJFUyBQT1NUIDAuMjIuMFwiXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4iXX0=
