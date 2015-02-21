// package globals

// XXX: think about hanging these on the template instance if we decide to support concurrent redline instances
commentsSwitch = new ReactiveVar(false);
commentCount = new ReactiveVar(0);
showOpenRevisionHistory = new ReactiveVar(true);
highlightBoldButton = new ReactiveVar('');
highlightItalicButton = new ReactiveVar('');
highlightUnderlineButton = new ReactiveVar('');
commentingActivated = new ReactiveVar(false);
commentIdJustAdded = new ReactiveVar(0);
saveableComment = new ReactiveVar(false);
carotaEditorLastSelected = new ReactiveVar(0);
carotaEditorWordCount = new ReactiveVar(0);
saveNeeded = new ReactiveVar(false);

undoAvailable = new ReactiveVar();
redoAvailable = new ReactiveVar();