style = function (paletteOverride, styleOverride) {
  var palette = paletteOverride || {
    passive: '#E5E5E5',
    active: '#3A87AD',
    blue: css.color(0.0, 0.1, 0.5, 1.0)
  };

  return styleOverride || {
    commentBox: {
      float: css.right,
      display: css.inlineBlock,
      width: css.pct(85)
    },
    byline: {
      display: css.block,
      fontSize: css.em(0.83),
      webkitMarginBefore: css.em(1.67),
      webkitMarginAfter: css.em(1.67),
      webkitMarginStart: css.px(0),
      webkitMarginEnd: css.px(0),
      fontWeight: css.bold
    },
    comment: {
      position: css.relative,
      width: css.pct(100),
      cursor: css.pointer,
      marginLeft: css.px(25),
      maxWidth: css.px(300)
    },
    bullet: {
      fontSize: css.em(0.6),
      lineHeight: css.em(1.2)
    },
    topLevel: {
  //  borderBottom: [css.px(1), css.solid, palette.blue]
    }
  };
};