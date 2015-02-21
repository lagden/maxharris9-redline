var per = require('per');
var characters = require('./characters');
var split = require('./split');
var word = require('./word');
var node = require('./node');
var runs = require('./runs');
var range = require('./range');
var util = require('./util');
var frame = require('./frame');
var codes = require('./codes');
var rect = require('./rect');

var makeEditCommand = function(doc, start, count, words) {
	var selStart = doc.selection.start, selEnd = doc.selection.end;
	return function(log) {
		doc._wordOrdinals = [];
		var oldWords = Array.prototype.splice.apply(doc.words, [start, count].concat(words));
		log(makeEditCommand(doc, start, words.length, oldWords));
		doc._nextSelection = { start: selStart, end: selEnd };
	};
};

var makeTransaction = function(perform) {
	var commands = [];
	var log = function(command) {
		commands.push(command);
		log.length = commands.length;
	};
	perform(log);

	return function(outerLog) {
		outerLog(makeTransaction(function(innerLog) {
			while (commands.length) {
				commands.pop()(innerLog);
			}
		}));
	};
};

var isBreaker = function(word) {
	if (word.isNewLine()) {
		return true;
	}
	var code = word.code();
	return !!(code && (code.block || code.eof));
};

var prototype = node.derive({
	load: function(runs, takeFocus) {
		var self = this;
		this.undo = [];
		this.redo = [];
		this._wordOrdinals = [];

		this.words = per(characters(runs)).per(split(self.codes)).map(function(w) {
			//console.log('here\'s a word', w);
			return word(w, self.codes);
		}).all();
		this.layout();
		this.contentChanged.fire();
		this.select(0, 0, takeFocus);
	},
	layout: function() {
		this.frame = null;
		try {
			this.frame = per(this.words).per(frame(0, 0, this._width, 0, this)).first();
		} catch (x) {
			console.error(x);
		}
		if (!this.frame) {
			console.error('A bug somewhere has produced an invalid state - rolling back');
			this.performUndo();
		} else if (this._nextSelection) {
			var next = this._nextSelection;
			delete this._nextSelection;
			this.select(next.start, next.end);
		}
	},
	range: function(start, end) {
		return range(this, start, end);
	},
	documentRange: function() {
		return this.range(0, this.frame.length - 1);
	},
	selectedRange: function() {
		return this.range(this.selection.start, this.selection.end);
	},
	save: function() {
		return this.documentRange().save();
	},
	paragraphRange: function(start, end) {
		var i;

		// find the character after the nearest breaker before start
		var startInfo = this.wordContainingOrdinal(start);
		start = 0;
		if (startInfo && !isBreaker(startInfo.word)) {
			for (i = startInfo.index; i > 0; i--) {
				if (isBreaker(this.words[i - 1])) {
					start = this.wordOrdinal(i);
					break;
				}
			}
		}

		// find the nearest breaker after end
		var endInfo = this.wordContainingOrdinal(end);
		end = this.frame.length - 1;
		if (endInfo && !isBreaker(endInfo.word)) {
			for (i = endInfo.index; i < this.words.length; i++) {
				if (isBreaker(this.words[i])) {
					end = this.wordOrdinal(i);
					break;
				}
			}
		}

		return this.range(start, end);
	},
	nearRange: function(start, end) { // expand the range by one word to the left, and one word to the right.
		// blow away the cache because it's making the code below not work. do this each time we call this.wordContainingOrdinal()
		this._wordOrdinals.length = 0;
		var startInfo = this.wordContainingOrdinal(start);
		var newStart;
		if (startInfo.index > 0)
			newStart = this.wordOrdinal(startInfo.index - 1); // this is the starting position of the previous word
		else
			newStart = this.wordOrdinal(startInfo.index); // at the start of the document, we don't have a previous word, so just use the one we're on

		this._wordOrdinals.length = 0; // blow away the cache for the same reason as above
		var endInfo = this.wordContainingOrdinal(end);
		var newEnd;
		if (endInfo.index >= (this.words.length - 1))
			newEnd = this.wordOrdinal(endInfo.index);
		else
			newEnd = this.wordOrdinal(endInfo.index + 1);

		return this.range(newStart, newEnd); // start and end are absolute positions within the entire doc
	},
	insert: function(text, takeFocus) {
		if (this.selection.start != this.selection.end) {
			var formatting = this.range(this.selection.start, this.selection.end).getFormatting();

			// is the thing we're deleting something from labeled with the currentEditIndex?
			if (this.lastEditedIndex == formatting.lasteditindex) { // not quite right - want to look for the oldest thing in the selection
				this.range(this.selection.start, this.selection.end).clear(); // just delete it.
			}
			else { // the thing we're deleting is old - we want this to show up as a deletion.
				this.range(this.selection.start, this.selection.end).setFormatting('lasteditindex', this.lastEditedIndex);
				this.range(this.selection.start, this.selection.end).setFormatting('deleted', true);
			}

			// okay, now insert the new text:
			var selEnd = this.selection.start + text.length; // this is where the cursor should go when we're done

			this.range(this.selection.start, this.selection.start).setTextUsingDefaultStyle(text); // insert the text
			this.range(this.selection.start, selEnd).setFormatting('lasteditindex', this.lastEditedIndex);
			this.select(selEnd, selEnd, takeFocus);
		}
		else {
			var newInsertionPoint = this.selection.end + this.selectedRange().setTextUsingDefaultStyle(text);
			this.range(this.selection.end, newInsertionPoint).setFormatting('lasteditindex', this.lastEditedIndex);
			this.select(newInsertionPoint, null, takeFocus);
		}
	},
	modifyInsertFormatting: function(attribute, value) {
		this.nextInsertFormatting[attribute] = value;
		this.notifySelectionChanged();
	},
	applyInsertFormatting: function(text) {
		var formatting = this.nextInsertFormatting;
		var insertFormattingProperties = Object.keys(formatting);
		if (insertFormattingProperties.length) {
			text.forEach(function(run) {
				insertFormattingProperties.forEach(function(property) {
					run[property] = formatting[property];
				});
			});
		}
	},
	applyDefaultFormatting: function(text) {
		var formatting = runs.defaultFormatting;
		var insertFormattingProperties = Object.keys(formatting);
		if (insertFormattingProperties.length) {
			text.forEach(function(run) {
				insertFormattingProperties.forEach(function(property) {
					run[property] = formatting[property];
				});
			});
		}
	},
	wordOrdinal: function(index) { // returns a word, given a word index
		if (index < this.words.length) {
			var cached = this._wordOrdinals.length; // TODO: fix the cache
			if (cached < (index + 1)) {
				var o = cached > 0 ? this._wordOrdinals[cached - 1] : 0;
				for (var n = cached; n <= index; n++) {
					this._wordOrdinals[n] = o;
					o += this.words[n].length;
				}
			}

		//	console.log('this._wordOrdinals:', this._wordOrdinals);
			return this._wordOrdinals[index];
		}
	},
	wordContainingOrdinal: function(ordinal) { // ordinal is an absolute position.
		// could rewrite to be faster using binary search over this.wordOrdinal
		var result;
		var pos = 0;
		this.words.some(function(word, i) {
			if (ordinal >= pos && ordinal < (pos + word.length)) {
				result = {
					word: word,
					ordinal: pos, // the absolute position of the word found
					index: i, // word index in the array of words (that is, "which word # is this?")
					offset: ordinal - pos // the absolute position we started with minus the absolute position of the word found
				};
				return true;
			}
			pos += word.length;
		});
		return result;
	},
	runs: function(emit, range) {
		var startDetails = this.wordContainingOrdinal(Math.max(0, range.start)),
			endDetails = this.wordContainingOrdinal(Math.min(range.end, this.frame.length - 1));
		if (startDetails.index === endDetails.index) {
			startDetails.word.runs(emit, {
				start: startDetails.offset,
				end: endDetails.offset
			});
		} else {
			startDetails.word.runs(emit, { start: startDetails.offset });
			for (var n = startDetails.index + 1; n < endDetails.index; n++) {
				this.words[n].runs(emit);
			}
			endDetails.word.runs(emit, { end: endDetails.offset });
		}
	},
	spliceWordsWithRuns: function(wordIndex, count, runs) {
		var self = this;

		var newWords = per(characters(runs))
			.per(split(self.codes))
			.truthy()
			.map(function(w) {
				return word(w, self.codes);
			})
			.all();

		// Check if old or new content contains any fancy control codes:
		var runFilters = false;

		if ('_filtersRunning' in self) {
			self._filtersRunning++;
		} else {
			for (var n = 0; n < count; n++) {
				if (this.words[wordIndex + n].code()) {
					runFilters = true;
				}
			}
			if (!runFilters) {
				runFilters = newWords.some(function(word) {
					return !!word.code();
				});
			}
		}

		this.transaction(function(log) {
			makeEditCommand(self, wordIndex, count, newWords)(log);
			if (runFilters) {
				self._filtersRunning = 0;
				try {
					for (;;) {
						var spliceCount = self._filtersRunning;
						if (!self.editFilters.some(function(filter) {
							filter(self);
							return spliceCount !== self._filtersRunning;
						})) {
							break; // No further changes were made
						}
					}
				} finally {
					delete self._filtersRunning;
				}
			}
		});
	},
	splice: function(start, end, text, useDefaultFormatting) {
		// sample the surrounding run to get an idea of which formatting keys to apply to the new text we're inserting.
		var textType = typeof text === 'string';

		if (textType) {
			var sample = Math.max(0, start - 1);
			var sampleRun = per({ start: sample, end: sample + 1 })
				.per(this.runs, this)
				.first();
		}

		if (textType && (undefined != sampleRun)) {
			text = [
				sampleRun ? Object.create(sampleRun, { text: { value: text } }) : { text: text }
			];
		} else if (!Array.isArray(text)) {
			text = [{ text: text }];
		}

		if (useDefaultFormatting)
			this.applyDefaultFormatting(text);
		else
			this.applyInsertFormatting(text);

		var startWord = this.wordContainingOrdinal(start),
			endWord = this.wordContainingOrdinal(end);

		var prefix;
		if (start === startWord.ordinal) {
			if (startWord.index > 0 && !isBreaker(this.words[startWord.index - 1])) {
				startWord.index--;
				var previousWord = this.words[startWord.index];
				prefix = per({}).per(previousWord.runs, previousWord).all();
			} else {
				prefix = [];
			}
		} else {
			prefix = per({ end: startWord.offset })
					.per(startWord.word.runs, startWord.word)
					.all();
		}

		var suffix;
		if (end === endWord.ordinal) {
			if ((end === this.frame.length - 1) || isBreaker(endWord.word)) {
				suffix = [];
				endWord.index--;
			} else {
				suffix = per({}).per(endWord.word.runs, endWord.word).all();
			}
		} else {
			suffix = per({ start: endWord.offset })
					.per(endWord.word.runs, endWord.word)
					.all();
		}

		var oldLength = this.frame.length;

		this.spliceWordsWithRuns(startWord.index, (endWord.index - startWord.index) + 1,
			per(prefix).concat(text).concat(suffix).per(runs.consolidate()).all());

		return this.frame ? (this.frame.length - oldLength) : 0;
	},
	registerEditFilter: function(filter) {
		this.editFilters.push(filter);
	},
	width: function(width) {
		if (arguments.length === 0) {
			return this._width;
		}
		this._width = width;
		this.layout();
	},
	children: function() {
		return [this.frame];
	},
	toggleCaret: function() {
		var old = this.caretVisible;
		if (this.selection.start === this.selection.end) {
			if (this.selectionJustChanged) {
				this.selectionJustChanged = false;
			} else {
				this.caretVisible = !this.caretVisible;
			}
		}
		return this.caretVisible !== old;
	},
	setLastEditedIndex: function (editIndex) {
		this.lastEditedIndex = editIndex;
		document.lastEditedIndex = editIndex; // XXX: ugly hack: set globally so that text.js can see it 
	},
  setCommentHighlightId: function (commentId) {
    document.commentHighlightId = commentId;
  },
	setLockState: function (lockState) {
		this.locked = lockState;
	},
	getCaretCoords: function(ordinal) {
		var node = this.byOrdinal(ordinal), b;
		if (node) {
			if (node.block && ordinal > 0) {
				var nodeBefore = this.byOrdinal(ordinal - 1);
				if (nodeBefore.newLine) {
					var newLineBounds = nodeBefore.bounds();
					var lineBounds = nodeBefore.parent().parent().bounds();
					b = rect(lineBounds.l, lineBounds.b, 1, newLineBounds.h);
				} else {
					b = nodeBefore.bounds();
					b = rect(b.r, b.t, 1, b.h);
				}
			} else {
				b = node.bounds();
				if (b.h) {
					b = rect(b.l, b.t, 1, b.h);
				} else {
					b = rect(b.l, b.t, b.w, 1);
				}
			}
			return b;
		}
	},
	byCoordinate: function(x, y) {
		var ordinal = this.frame.byCoordinate(x, y).ordinal;
		var caret = this.getCaretCoords(ordinal);
		while (caret.b <= y && ordinal < (this.frame.length - 1)) {
			ordinal++;
			caret = this.getCaretCoords(ordinal);
		}
		while (caret.t >= y && ordinal > 0) {
			ordinal--;
			caret = this.getCaretCoords(ordinal);
		}
		return this.byOrdinal(ordinal);
	},
	drawSelection: function(ctx, hasFocus) {
		if (this.selection.end === this.selection.start) {
			if (this.selectionJustChanged || hasFocus && this.caretVisible) {
				var caret = this.getCaretCoords(this.selection.start);
				if (caret) {
					ctx.save();
					ctx.fillStyle = 'black';
					caret.fill(ctx);
					ctx.restore();
				}
			}
		} else {
			ctx.save();
			ctx.fillStyle = hasFocus ? 'rgba(0, 122, 164, 0.2)' : 'rgba(160, 160, 160, 0.3)';
			this.selectedRange().parts(function(part) {
				part.bounds(true).fill(ctx);
			});
			ctx.restore();
		}
	},
	notifySelectionChanged: function(takeFocus) {
		// When firing selectionChanged, we pass a function can be used
		// to obtain the formatting, as this highly likely to be needed
		var cachedFormatting = null;
		var self = this;
		var getFormatting = function() {
			if (!cachedFormatting) {
				cachedFormatting = self.selectedRange().getFormatting();
			}
			return cachedFormatting;
		};
		this.selectionChanged.fire(getFormatting, takeFocus);
	},
	select: function(ordinal, ordinalEnd, takeFocus) {
		if (!this.frame) {
			// Something has gone terribly wrong - doc.transaction will rollback soon
			return;
		}
		this.selection.start = Math.max(0, ordinal);
		this.selection.end = Math.min(
			typeof ordinalEnd === 'number' ? ordinalEnd : this.selection.start,
			this.frame.length - 1
		);
		this.selectionJustChanged = true;
		this.caretVisible = true;
		this.nextInsertFormatting = {};

		/*  NB. always fire this even if the positions stayed the same. The
			event means that the formatting of the selection has changed
			(which can happen either by moving the selection range or by
			altering the formatting)
		*/
		this.notifySelectionChanged(takeFocus);
	},
	performUndo: function(redo) {
		var fromStack = redo ? this.redo : this.undo,
			toStack = redo ? this.undo : this.redo,
			oldCommand = fromStack.pop();

		if (oldCommand) {
			oldCommand(function(newCommand) {
				toStack.push(newCommand);
			});
			this.layout();
			this.contentChanged.fire();
		}
	},
	canUndo: function(redo) {
		return redo ? !!this.redo.length : !!this.undo.length;
	},
	transaction: function(perform) {
		if (this._currentTransaction) {
			perform(this._currentTransaction);
		} else {
			var self = this;
			while (this.undo.length > 50) {
				self.undo.shift();
			}
			this.redo.length = 0;
			var changed = false;
			this.undo.push(makeTransaction(function(log) {
				self._currentTransaction = log;
				try {
					perform(log);
				} finally {
					changed = log.length > 0;
					self._currentTransaction = null;
				}
			}));
			if (changed) {
				self.layout();
				self.contentChanged.fire();
			}
		}
	},
	type: 'document'
});

exports = module.exports = function() {
	var doc = Object.create(prototype);
	doc._width = 0;
	doc.selection = { start: 0, end: 0 };
	doc.caretVisible = true;
	doc.lastEditedIndex = 0;
	doc.locked = false;
	doc.customCodes = function(code, data, allCodes) {};
	doc.codes = function(code, data) {
		var instance = codes(code, data, doc.codes);
		return instance || doc.customCodes(code, data, doc.codes);
	};
	doc.selectionChanged = util.event();
	doc.contentChanged = util.event();
	doc.editFilters = [codes.editFilter];
	doc.load([]);
	return doc;
};
