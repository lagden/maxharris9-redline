// XXX: carotaEditorInstance is deliberately made global (hung off of window) for debugging purposes.
// scoping issues prevent us from using a package-scoped variable that's exported in package.js
// replace all instances of window.carotaEditorInstance in this file before using in production!

// XXX: pick through this method before general release
//   some of this was just pasted in from the old codebase before everything else was refactored
Template.textEdit.rendered = function () {
  function capitalize (string) {
    return string[0].toUpperCase() + string.slice(1);
  }

  var editorElement = document.getElementById('editor');
  window.carotaEditorInstance = carota.editor.create(editorElement);
  var carotaTextArea = document.getElementById('carotaTextArea');

  carotaTextArea.focus(); // give editor focus 

  var carotaJson = _.filter(textEditObject.editHistory[textEditObject.editHistory.length - 1], function (item) {
    if (item.deleted) { // drop the run, because we deleted in the last cycle.
      return;
    }

    return item;
  });

  window.carotaEditorInstance.load(carotaJson);
  window.carotaEditorInstance.select(window.carotaEditorInstance.frame.length - 1); // set selection to end of document

  var lastEditedIndex = getLastSaveIndex();
  window.carotaEditorInstance.setLastEditedIndex(lastEditedIndex);

  carotaEditorWordCount.set(window.carotaEditorInstance.words.length - 1);

  // when the selected range coordinates change, update the control
  _.each(['bold', 'italic', 'underline'], function (styleAttribute) {
    window.carotaEditorInstance.selectionChanged(function (getFormatting) {
      var formatting = getFormatting();
      var val = styleAttribute in formatting ? formatting[styleAttribute] : carota.runs.defaultFormatting[styleAttribute];

      var item = eval('highlight' + capitalize(styleAttribute) + 'Button');

      (val === carota.runs.multipleValues) ? item.set('multipleValues') : item.set(val);

      commentingActivated.set(window.carotaEditorInstance.selection.start !== window.carotaEditorInstance.selection.end);
    });
  });

  // whenever the document changes, re-display the JSON format and update undo buttons
  window.carotaEditorInstance.contentChanged(function () {
    undoAvailable.set(window.carotaEditorInstance.canUndo(true));
    redoAvailable.set(window.carotaEditorInstance.canUndo(false));
    carotaEditorWordCount.set(window.carotaEditorInstance.words.length - 1);

    saveNeeded.set(true);
  });
};

Template.textEdit.helpers({
  openRevisionHistoryButton: function () {
    return showOpenRevisionHistory.get();
  },
  revisionHistory: function () {
    return getHistory(textEditObject);
  },
  wordCount: function () {
  	return carotaEditorWordCount.get();
  }
});

Template.textEdit.events({
  'click #showRevisionHistory': function () {
    showOpenRevisionHistory.set(!showOpenRevisionHistory.get());
  }
});

var getLastSaveIndex = function () {
  if (textEditObject) {
    return textEditObject.editHistory.length - 1;
  }
  return 0;
};