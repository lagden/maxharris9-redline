Template.editorStyleControls.rendered = function () {
  switchSetup(false, function (switchState) {
    commentsSwitch.set(switchState);
  }, 'commentSwitchStub', commentsSwitch);
};

Template.editorStyleControls.events({
  'click #editBoldButton': function () {
    var range = carotaEditorInstance.selectedRange();
    var boldState = highlightBoldButton.get();
    range.setFormatting('bold', !boldState);
  },
  'click #editItalicButton': function () {
    var range = carotaEditorInstance.selectedRange();
    var italicState = highlightItalicButton.get();
    range.setFormatting('italic', !italicState);
  },
  'click #editUnderlineButton': function () {
    var range = carotaEditorInstance.selectedRange();
    var underlineState = highlightUnderlineButton.get();
    range.setFormatting('underline', !underlineState);
  },
  'click #editUndoButton': function () {
    carotaEditorInstance.performUndo(false);
  },
  'click #editRedoButton': function () {
    carotaEditorInstance.performUndo(true);
  },
  'click #closeTextEditor': function () {
    if (saveNeeded.get()) {
      if (confirm('This document has unsaved changes. Are you sure you want to close and lose all changes?')) {
      	// XXX: wind things up 
      }
    }
  },
  'click #createCommentButton': function () {
    commentsSwitch.set(true);
    commentingActivated.set(true);

    var newId = textEditObject.latestCommentIndex + 1; // runInfo.length;
    var range = carotaEditorInstance.selectedRange();
    var newComment = createTopLevelComment(newId, range);

    var range = carotaEditorInstance.selectedRange();
    range.addToFormatting('commentids', newId);

    singleCommentSetup(newComment, 'singleCommentStub', 1);
  },

  'click #showRevisionHistory': function () {
    showOpenRevisionHistory.set(!showOpenRevisionHistory.get());
  }
});

var stateToCssClass = function (state) {
  switch (state) {
    case true:
      return 'buttonActive';
    case 'multipleValues':
      return 'multipleValues';
    default:
      return '';
  }
};

Template.editorStyleControls.helpers({
  showBoldState: function () {
    return stateToCssClass(highlightBoldButton.get());
  },
  showItalicState: function () {
    return stateToCssClass(highlightItalicButton.get());
  },
  showUnderlineState: function () {
    return stateToCssClass(highlightUnderlineButton.get());
  },
  showUndoButton: function () {
    return undoAvailable.get();
  },
  showRedoButton: function () {
    return redoAvailable.get();
  },
  activateCommentButton: function () {
    return commentingActivated.get();
  }
});