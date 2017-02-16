import React from 'react';
import FlexibleGrid from '../../src/FlexibleGrid/FlexibleGrid';
import Item from './ExampleGridItem';
import stringToColor from '../../src/stringToColor';

const getRandomColor = () => stringToColor(`${Math.floor(Math.random() * 10000)}`);

const getPins = (meta = {}, collage) => {
  const from = meta.from || 0;
  let until = from + 20;

  let baseHeight = 200;

  if (collage) {
    until = 5;
    baseHeight = 40;
  }

  return new Promise((resolve) => {
    const pins = [];
    for (let i = from; i < until; i += 1) {
      pins.push({
        name: `foo ${i}`,
        height: baseHeight + i,
        color: getRandomColor(),
      });
    }
    setTimeout(() => {
      resolve(pins);
    }, 5);
  });
};

export default class FlexibleExampleGrid extends React.Component {

  constructor(props) {
    super(props);
    if (this.props.constructorItemSplice) {
      this.state = {
        pins: props.initialPins.slice(0, 5),
      };
    } else {
      this.state = {
        pins: props.initialPins,
      };
    }
  }

  componentDidMount() {
    /* eslint-disable react/no-did-mount-set-state */
    if (this.props.constructorItemSplice) {
      this.setState({
        pins: this.props.initialPins,
      });
    }

    window.addEventListener('trigger-reflow', () => {
      this.gridRef.reflow();
      this.forceUpdate();
    });
  }

  loadItems = (meta) => {
    getPins(meta, this.props.collage)
      .then((newPins) => {
        this.setState({
          pins: this.state.pins.concat(newPins),
        });
      });
  }
  /* eslint react/jsx-no-bind:0 */
  render() {
    const dynamicGridProps = {};

    const gridStyleProps = {
      style: {},
    };

    if (this.props.constrained) {
      gridStyleProps.style.margin = '0px 200px';
    }

    // One example of a collage layout w/o scrolling.
    if (this.props.collage) {
      dynamicGridProps.maxItemWidth = 300;
      dynamicGridProps.minItemWidth = 200;
      gridStyleProps.style.width = 500;
    }

    // Allow for infinite scroll if the test does not opt out with the finiteLength prop.
    if (!this.props.finiteLength) {
      dynamicGridProps.loadItems = this.loadItems;
    }

    if (this.props.maxCols) {
      dynamicGridProps.maxCols = 2;
    }

    if (this.props.minCols) {
      dynamicGridProps.minCols = Number(this.props.minCols);
    }

    return (
      <div id="gridWrapper" className="gridCentered" {...gridStyleProps}>
        <FlexibleGrid
          comp={Item}
          items={this.state.pins}
          ref={(ref) => { this.gridRef = ref; }}
          {...dynamicGridProps}
        />
        <div className="afterGrid" />
      </div>
    );
  }
}

FlexibleExampleGrid.propTypes = {
  // Test case: Sets up props to display a collage layout.
  collage: React.PropTypes.string,
  // Test case: Constrains the width of the grid rendering.
  constrained: React.PropTypes.string,
  // Test case: Slices items in the constructor, then sets the entire list in componentDidMount.
  constructorItemSplice: React.PropTypes.string,
  // Test case: Does not allow infinite scroll.
  finiteLength: React.PropTypes.string,
  // The initial data from the server side render.
  initialPins: React.PropTypes.arrayOf(React.PropTypes.shape({})),
  // Whether or not to set the maxCols prop.
  maxCols: React.PropTypes.string,
  // Optional minimum number of columns.
  minCols: React.PropTypes.string,
};
