import { select } from 'd3-selection';
import VisComponent from 'candela/VisComponent';

import content from './index.jade';

export default class Dropdown extends VisComponent {
  constructor(el, options) {
    super(el, options);

    select(this.el)
      .classed('btn-group', true)
      .html(content())

    this.ul = select(this.el)
      .select('ul');

    this.button = select(this.el)
      .select('button');

    this.buttonText = options.buttonText || 'Select';
    this.onSelect = options.onSelect || (d => undefined);

    this.setButtonText(this.buttonText);
    this.setItems(options.items || []);
  }

  setButtonText (text) {
    this.button.text(text);
  }

  setItems (items, label = d => d) {
    this.ul.selectAll('*')
      .remove();

    this.ul.selectAll('li')
      .data(items)
      .enter()
      .append('li')
      .append('a')
      .attr('href', '#')
      .text(label)
      .on('click.relabel', item => {
        this.button.text(`${this.buttonText}: ${label(item)}`);
      })
      .on('click.custom', item => {
        this.onSelect(item);
      });
  }

  render () {}
}
