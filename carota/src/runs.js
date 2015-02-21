exports.formattingKeys = [ 'bold', 'italic', 'underline', 'strikeout', 'color', 'font', 'size', 'align', 'script', 'commentids', 'lasteditindex', 'deleted' ];

exports.defaultFormatting = {
    size: 12,
    font: 'sans-serif',
    color: '#222',
    bold: false,
    italic: false,
    underline: false,
    strikeout: false,
    align: 'left',
    script: 'normal',
    commentids: [],
    lasteditindex: 0,
    deleted: false
};

// grabbed out from http://stackoverflow.com/questions/7837456/comparing-two-arrays-in-javascript
Array.prototype.compare = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l = this.length; i < l; i++) {
	/*
		// Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].compare(array[i]))
                return false;
        }
        else
	*/
        if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} !== {x:20}
            return false;
        }
    }
    return true;
}

exports.sameFormatting = function(run1, run2) {
    return exports.formattingKeys.every(function(key) {
        return run1[key] === run2[key];
    })
};

exports.clone = function(run) {
    var result = { text: run.text };
    exports.formattingKeys.forEach(function(key) {
		//if (key === 'lasteditindex') {
		//	console.log('exports.clone, run:', run);
		//}
        var val = run[key];
        if (val && val != exports.defaultFormatting[key]) {
            result[key] = val;
        }
    });
    result['length'] = run.text.length;
    return result;
};

exports.multipleValues = {};

exports.merge = function(run1, run2) {
    if (arguments.length === 1) {
        return Array.isArray(run1) ? run1.reduce(exports.merge) : run1;
    }
    if (arguments.length > 2) {
        return exports.merge(Array.prototype.slice.call(arguments, 0));
    }
    var merged = {};
    exports.formattingKeys.forEach(function(key) {
    	//if (key === 'lasteditindex') {
    	//	console.log('exports.merge, run1:', run1);
    	//	console.log('exports.merge, run2:', run2);
    	//}
        if (key in run1 || key in run2) {
            if (run1[key] === run2[key]) {
                merged[key] = run1[key];
            } else {
                merged[key] = exports.multipleValues;
            }
        }
    });
    return merged;
};

exports.format = function(run, template) {
    if (Array.isArray(run)) {
        run.forEach(function(r) {
            exports.format(r, template);
        });
    } else {
        Object.keys(template).forEach(function(key) {
        	if ((key === 'commentids') && (undefined != run[key])) {
        		console.log('in exports.format, run[key]:', run[key]);
        		console.log('in exports.format, template[key]:', template[key]);
        		run[key] = run[key].concat(template[key]);
        	}
            else if (template[key] !== exports.multipleValues) {
                run[key] = template[key];
            }
        });
    }
};

exports.formatRemoveComment = function(run, template) {
    if (Array.isArray(run)) {
        run.forEach(function(r) {
            exports.formatRemoveComment(r, template);
        });
    } else {
        Object.keys(template).forEach(function(key) {
        	if ((key === 'commentids') && (undefined != run[key])) {
        		console.log('in exports.format, run[key]:', run[key]);
        		console.log('in exports.format, template[key]:', template[key]);
        		run[key] = _.without(run[key], template[key]);
        	}
        });
    }
};

exports.consolidate = function() {
    var current;
    return function (emit, run) {
        if (!current || !exports.sameFormatting(current, run) ||
            (typeof current.text != 'string') ||
            (typeof run.text != 'string')) {
            current = exports.clone(run);
            emit(current);
        } else {
            current.text += run.text;
            current.length += run.text.length;
        }
    };
};

exports.getPlainText = function(run) {
    if (typeof run.text === 'string') {
        return run.text;
    }
    if (Array.isArray(run.text)) {
        var str = [];
        run.text.forEach(function(piece) {
            str.push(exports.getPiecePlainText(piece));
        });
        return str.join('');
    }
    return '_';
};

/*  The text property of a run can be an ordinary string, or a "character object",
 or it can be an array containing strings and "character objects".

 A character object is not a string, but is treated as a single character.

 We abstract over this to provide the same string-like operations regardless.
 */
exports.getPieceLength = function(piece) {
    return piece.length || 1; // either a string or something like a character
};

exports.getPiecePlainText = function(piece) {
    return piece.length ? piece : '_';
};

exports.getTextLength = function(text) {
    if (typeof text === 'string') {
        return text.length;
    }
    if (Array.isArray(text)) {
        var length = 0;
        text.forEach(function(piece) {
            length += exports.getPieceLength(piece);
        });
        return length;
    }
    return 1;
};

exports.getSubText = function(emit, text, start, count) {
    if (count === 0) {
        return;
    }
    if (typeof text === 'string') {
        emit(text.substr(start, count));
        return;
    }
    if (Array.isArray(text)) {
        var pos = 0;
        text.some(function(piece) {
            if (count <= 0) {
                return true;
            }
            var pieceLength = exports.getPieceLength(piece);
            if (pos + pieceLength > start) {
                if (pieceLength === 1) {
                    emit(piece);
                    count -= 1;
                } else {
                    var str = piece.substr(Math.max(0, start - pos), count);
                    emit(str);
                    count -= str.length;
                }
            }
            pos += pieceLength;
        });
        return;
    }
    emit(text);
};

exports.getTextChar = function(text, offset) {
    var result;
    exports.getSubText(function(c) { result = c }, text, offset, 1);
    return result;
};

exports.pieceCharacters = function(each, piece) {
    if (typeof piece === 'string') {
        for (var c = 0; c < piece.length; c++) {
            each(piece[c]);
        }
    } else {
        each(piece);
    }
};
