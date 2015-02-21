function newComment (newId) {
	return {
    textRunId: newId,
    userId: externalProperties.currentUserId,
    commentText: '',
    childCommentIds: [],
    commentId: textEditObject.commentRoot.length,
    removable: true,
    replyable: false
  };
}

createTopLevelComment = function (newId, range) {
  var nc = newComment(newId);
  textEditObject.latestCommentIndex += 1;

  // update the root node to point to this new comment
  textEditObject.commentRoot[0].childCommentIds.push(newId);
  textEditObject.commentRoot.push(nc);

  return nc;
};

createReplyComment = function (textRunId) {
  var nc = newComment(textRunId);
  textEditObject.commentRoot.push(nc);

  return nc;
};