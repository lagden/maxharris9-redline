Package.describe({
  name: 'maxharris9:redline',
  version: '0.0.2',
  summary: 'Collaborative word processing for Meteor',
  git: 'https://github.com/max-leportlabs/maxharris9-redline.git',
  documentation: null
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');

  api.use(['tracker', 'templating', 'underscore', 'pfafman:font-awesome-4@4.3.0', 'jquery', 'momentjs:moment@2.9.0', 'maxharris9:template-instance-utils@1.0.3', 'maxharris9:switch@1.0.0'], 'client');
  api.use(['reactive-var'], ['client', 'server']);

  api.addFiles('maxharris9:redline.js', 'client');
  api.addFiles('styles.js');

  api.addFiles('history.js', 'client');

  api.addFiles('carota-debug.js', 'client');

  api.addFiles('comments.js', 'client');
  api.addFiles('single-comment.html');
  api.addFiles('single-comment.js', 'client');

  api.addFiles('fullscreen-editor.html');  
  api.addFiles('fullscreen-editor.js', 'client');  

  api.addFiles('text-edit.html');
  api.addFiles('text-edit.js', 'client');
  api.addFiles('editor-style-controls.html', 'client');
  api.addFiles('editor-style-controls.js', 'client');

  api.export(['fullscreenEditorSetup', 'fullscreenEditorShutdown', 'TextEdits', 'Comments', 'Comment', 'TextEditObj', 'textEditObject', 'commentRoot'], 'client');
});

Package.onTest(function(api) {
  api.use(['maxharris9:redline', 'tinytest', 'test-helpers']);
  api.addFiles('maxharris9:redline-tests.js', ['client', 'server']);
});
