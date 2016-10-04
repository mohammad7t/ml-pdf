import React, {Component} from 'react';
import './App.css';
import {VictoryChart, VictoryArea, VictoryGroup, VictoryLine} from 'victory';
import InputRange from 'react-input-range';
import _ from 'underscore';
import 'react-input-range/dist/react-input-range.css';

let memoize = new Map();

function makePoints(args) {
  let {from, to, pdf, n = 80} = args;
  let sig = pdf.toString() + from + ":" + to + ":" + n;
  if (memoize.has(sig))
    return memoize.get(sig);
  let delta = (to - from) / n;
  let points = [];
  for (let i = 0; i <= n; i++) {
    let x = from + i * delta;
    let y = pdf(x);
    points.push({x, y, delta})
  }
  memoize.set(sig, points);
  return points;
}

function integrate({from, to, pdf, n = 500}) {
  let sum = 0, last = pdf(from);
  let delta = (to - from) / n;
  for (let i = 1; i <= n; i++) {
    let cur = pdf(from + i * delta);
    sum += delta * (last + cur) / 2;
  }
  return sum;
}

class MyChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hFrom: props.from,
      hTo: props.to,
    }
  }

  handleValuesChange(component, {min, max}) {
    this.setState({
      hFrom: min,
      hTo: max,
    });
  }

  render() {
    let {from, to, pdf1, pdf2} = this.props;
    let {hFrom, hTo} = this.state;
    var points1 = makePoints({from, to, pdf: pdf1});
    var points2 = makePoints({from, to, pdf: pdf2});
    const hCond = ({x})=>(x >= hFrom && x <= hTo);
    var hPoints1 = points1.filter(hCond);
    var hPoints2 = points2.filter(hCond);

    let p1 = integrate({from: hFrom, to: hTo, pdf: pdf1});
    let p2 = integrate({from: hFrom, to: hTo, pdf: pdf2});
    return (
      <div>
        <div style={{width: 500, textAlign: 'center', bottom: -20, position: 'relative'}}>
          Red: {p1.toFixed(5)} {""} Blue: {p2.toFixed(5)}
        </div>
        <div style={{width: 500}}>
          <VictoryChart
            events={[{
              onClick: (x)=> {
                console.log(x);
                return [];
              }
            }]}
          >
            <VictoryGroup name="main"
                          colorScale={[
                            "red", "blue", "red", "blue"
                          ]}
                          style={{data: {opacity: 0.4}}}
            >
              <VictoryLine data={points1}/>
              <VictoryLine data={points2}/>
              <VictoryArea data={hPoints1}/>
              <VictoryArea data={hPoints2}/>
            </VictoryGroup>
          </VictoryChart>
        </div>
        <div style={{width: 390, paddingLeft: 55}}>
          <InputRange
            maxValue={to}
            minValue={from}
            value={{min: hFrom, max: hTo}}
            onChange={this.handleValuesChange.bind(this)}
          />
        </div>
      </div>
    );
  }
}

class App extends Component {

  render() {
    return (
      <div >
        <MyChart from={10} to={50} pdf1={(x)=>10 / x} pdf2={(x)=>Math.sin(x) * Math.sin(x)}/>
      </div>
    );
  }
}

export default App;
