import candela from 'candela';
import ScatterPlot from 'candela/plugins/vega/ScatterPlot';
import 'candela/dist/mixin';

const sq = (x) => x * x;

const inverf = (x) => {
  const a = 0.147;
  const term1 = Math.log(1 - sq(x)) / 2;
  const term = 2 / (Math.PI * a) + term1;
  return Math.sign(x) * Math.sqrt(Math.sqrt(sq(term) - term1) - term);
};

const normQuantile = (p) => Math.sqrt(2) * inverf(2 * p - 1);

const xformData = (opts) => {
  // Sort the data.
  const data = [...opts.data];
  data.sort((a, b) => a - b);

  // Generate expected order statistics from the normal distribution.
  const a = data.length <= 10 ? 0.375 : 0.5;
  const arg = (i) => (i - a) / (data.length + 1 - 2 * a);
  const order = data.map((_, i) => i).map(arg).map(normQuantile);

  let newData = [];
  data.forEach((d, i) => {
    newData.push({
      value: d,
      order: order[i],
      size: 2
    });
  });

  // Fuse the data and order stats together, and set x and y option properties.
  return Object.assign({}, opts, {
    data: newData,
    x: 'value',
    y: 'order'
  });
};

class NormalPlot extends candela.mixins.InitSize(ScatterPlot) {
  constructor (el, options) {
    super(el, xformData(options));
  }
};

export {
  inverf,
  NormalPlot
};
