var renderedView;

var styles = {
  hiddenState: "display:none;",
  normalState: ""
};

Template.fullscreenEditor.helpers({
  commentRoot: function () {
    return commentRoot;
  },
  showCommentsStyle: function () {
    return commentsSwitch.get() ? styles.normalState : styles.hiddenState;
  }
});

Template.fullscreenEditor.rendered = function () {
  // the root node that is never displayed. children don't require special code to render this way
  singleCommentSetup(textEditObject.commentRoot[0], 'singleCommentStub', 0);
};

fullscreenEditorSetup = function (setupObject, elementId, data, paletteOverride, styleOverride) {
  var domElement = document.getElementById(elementId);

  checkProperty(setupObject, 'getProfilePictureCallback', 'fullscreen-editor.js');
  checkProperty(setupObject, 'transformUserId', 'fullscreen-editor.js');
  checkProperty(setupObject, 'currentUserId', 'fullscreen-editor.js');

  // these items are intentionally package-scoped
  externalProperties = setupObject;
  getProfilePictureCallback = setupObject.getProfilePictureCallback;
  transformUserId = setupObject.transformUserId;
  textEditObject = data;

  renderedView = Blaze.renderWithData(Template.fullscreenEditor, setupObject, domElement);
};

fullscreenEditorShutdown = function () {
  // blow away any ephemeral properties leaking in from the UI, such as guids and the like
  var temp = _.map(textEditObject.commentRoot,
    function (object) {
      return _.pick(object, 'childCommentIds', 'commentId', 'commentText', 'removable', 'replyable', 'textRunId', 'userId');
  });

  // XXX: set properties, including removable and replayable, to correct state for new user

  console.log('temp:', temp);

  // XXX: put temp somewhere!
};