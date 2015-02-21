var renderedView;
var timerId;

singleCommentSetup = function (setupObject, elementId, depth, paletteOverride, styleOverride) {
  var domElement = document.getElementById(elementId);

  setupObject['guid'] = generateGuid();
  setupObject['style'] = style(paletteOverride, styleOverride);
  setupObject['depth'] = depth;

  renderedView = Blaze.renderWithData(Template.singleComment, setupObject, domElement);
};

Template.singleComment.rendered = function () {
  var data = Template.instance().data;

  data['renderedView'] = renderedView;

  // iterate over children, create child instances
  for (var i = 0; i < data.childCommentIds.length; i++) {
    var index = data.childCommentIds[i];

    if (index !== data.commentId) { // do not allow an infinite self-referential cycle
      var newComment = textEditObject.commentRoot[index];
      singleCommentSetup(newComment, 'singleCommentStub-' + data.guid, data.depth + 1);
    }
  }

  if (data.depth > 0) {
    textFieldSetup(data.commentText,
      function (text) {
        textEditObject.commentRoot[data.commentId].commentText = text;
    }, 'textBlankStub-' + data.guid, new ReactiveVar(data.removable));
  }
};

Template.singleComment.helpers({
  rootNode: function () {
  	var data = Template.instance().data;
    return (0 === data.depth);
  },
  guid: function () {
    var data = Template.instance().data;
    return data.guid;
  },
  fullUserName: function () {
    var data = Template.instance().data;
    return transformUserId(data.userId);
  },
  textRunId: function () {
    var data = Template.instance().data;
    return data.textRunId;
  },
  commentText: function () {
    var data = Template.instance().data;
    return data.commentText;
  },
  commentsOpen: function () {
    var data = Template.instance().data;
    return data.open;
  },
  userImage: function () {
    return '';
  },
  removeAvailable: function () {
    var data = Template.instance().data;
    return data.removable;
  },
  replyAvailable: function () {
    var data = Template.instance().data;
    return data.replyable;
  },

  // styles
  commentBox: function () {
    var data = Template.instance().data;
    if (0 === data.depth) {
      return css.styleString(css.merge(data.style.commentBox, data.style.topLevel));
    }
    else {
      return css.styleString(data.style.commentBox);
    }
  },
  byline: function () {
    var data = Template.instance().data;
    return css.styleString(data.style.byline);
  },
  comment: function () {
    var data = Template.instance().data;
    return css.styleString(data.style.comment);
  },
  bullet: function () {
    var data = Template.instance().data;
    return css.styleString(data.style.bullet);
  }
});

Template.singleComment.events({
  'click .reply': function (event, template) {
    var newComment = createReplyComment(template.data.textRunId);
    singleCommentSetup(newComment, 'singleCommentStub-' + template.data.guid, template.data.depth + 1);
    event.stopPropagation();
  },
  'click .remove': function (event, template) {
    // never permit the removal of the root node
    if (template.data.depth > 0) {
      Blaze.remove(template.data.renderedView);
    }
    event.stopPropagation();
  },
  'click .commentDiv': function (event, template) {
    if (template.data.depth > 0) {
      console.log('click .commentDiv:');
      carotaEditorInstance.setCommentHighlightId(template.data.textRunId);
      carotaEditorInstance.paint();
    }
  },
  'mouseenter .commentDiv': function (event, template) {
    if (template.data.depth > 0) {
      console.log("mouseenter .commentDiv");
      carotaEditorInstance.setCommentHighlightId(template.data.textRunId);
      carotaEditorInstance.paint();
    }
  },
  'mouseleave .commentDiv': function (event, template) {
    if (template.data.depth > 0) {
      console.log("mouseleave .commentDiv");
      carotaEditorInstance.setCommentHighlightId(-1);
      carotaEditorInstance.paint();
    }
  }
});