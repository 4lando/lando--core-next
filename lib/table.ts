import _ from 'lodash';
import yargonaut from 'yargonaut';
import OldTable from 'cli-table3';
import util from 'util';

const chalk = yargonaut.chalk();

// Const
const noBorderOpts = {
  chars: {
    'top': '',
    'top-mid': '',
    'top-left': '',
    'top-right': '',
    'bottom': '',
    'bottom-mid': '',
    'bottom-left': '',
    'bottom-right': '',
    'left': '',
    'left-mid': '',
    'mid': '',
    'mid-mid': '',
    'right': '',
    'right-mid': '',
    'middle': '',
  },
};

export default class Table extends OldTable {
  constructor(data, {border = true, keyColor = 'cyan', joiner = '\n', sort = false} = {}, opts = {}) {
    // Inherit the table
    const tableDefaults = border ? {} : noBorderOpts;
    super(_.merge({}, tableDefaults, opts));

    // Add new opts
    this.border = border;
    this.joiner = joiner;
    this.keyColor = keyColor;
    this.sort = sort;

    // Add data if we have it
    if (!_.isEmpty(data)) this.add(data);
  }

  // This is a helper to take object data and break it into rows
  add(data, {joiner = this.joiner, sort = this.sort} = {}) {
    _.forEach(sort ? _.sortBy(_.keys(data)) : _.keys(data), key => {
      // Do some special things for arrays
      if (_.isArray(data[key])) data[key] = data[key].join(joiner);
      // Do something special for objects
      if (_.isObject(data[key])) data[key] = util.inspect(data[key], {compact: true});
      // Do the normal push
      this.push([(chalk[this.keyColor](_.toUpper(key))), data[key]]);
    });
  }
}
