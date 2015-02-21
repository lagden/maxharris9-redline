getHistory = function (textObject) {
  var historyBuilder = '';

  var historyArray = textObject.editHistory;
  var historyUsers = textObject.editHistoryUsers;

  for (var i = historyArray.length - 1; i >= 0; --i) { // NB: we are traversing the list backwards
    var laterVersion = carotaJsonStringToHtml(historyArray[i], i + 1);

    var usernameAndDate = '';
    if (historyUsers[i]) {
      var historyUserInfo = historyUsers[i];

      usernameAndDate = '<b>' + ' by ' + transformUserId(historyUserInfo.userId) + ' | ' + moment.unix(historyUserInfo.timestamp/1000).calendar() + '</b>';

      // if you click "send to editor," it will create a new entry that's just a copy of the last for the editor to edit. don't show this unless the entry has been edited
      if (!historyUserInfo.userId) {
        continue;
      }
    }

    var info = '<li><h4>';

    if (0 === i) {
      info += 'Original ';
    }
    else {
      info += 'Edit ' + i;
    }
    historyBuilder += info + usernameAndDate + '</h4>' + laterVersion;

    historyBuilder += '</li>';
  }

  return historyBuilder;
};

function getText (run, diffMode) {
  if (!(diffMode && run.deleted)) {
    return run.text.replace(/\n/g, '<br>');
  }
  else {
    return '';
  }
}

function makeTag (tagOpen, tagName, openString, closeString, tagAttributeString) {
  var attrString = tagOpen ? (' ' + tagAttributeString) : '';
  return '<' + (tagOpen ? openString : closeString) + tagName + attrString + '>';
}

function assignTag (run, tagOpen, lastEditIndex, diffMode) {
  var tagString = '';

  if (run.bold) {
    tagString += makeTag(tagOpen, 'b', '', '/');
  }
  if (run.italic) {
    tagString += makeTag(tagOpen, 'i', '', '/');
  }
  if (run.underline) {
    tagString += makeTag(tagOpen, 'u', '', '/');
  }

  if (diffMode) { // quit early if we don't want diff info
    return tagString;
  }

  if ((run.lasteditindex == lastEditIndex) && (!run.deleted)) {
    tagString += makeTag(tagOpen, 'span', '', '/', "style='color: #FFFFFF; background-color: #0B5394;'");
  }
  if (run.deleted) {
    tagString += makeTag(tagOpen, 'del', '', '/', "style='color: #C4C4C4;'");
  }

  return tagString;
}

var convertcarotaJsonToHtml = function (carotaJson, lastEditIndex, diffMode) {
  var resultString = '';

  for (var i = 0; i < carotaJson.length; i++) {
    resultString += assignTag(carotaJson[i], true, lastEditIndex, diffMode);
    resultString += getText(carotaJson[i], diffMode);
    resultString += assignTag(carotaJson[i], false, lastEditIndex, diffMode);
  }

  return resultString;
};

var carotaJsonStringToHtml = function (carotaJsonString, lastEditIndex) {
  return convertcarotaJsonToHtml(carotaJsonString, lastEditIndex, false);
};