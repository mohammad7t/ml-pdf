import React, {Component} from 'react';
import './App.css';
import {VictoryChart, VictoryArea, VictoryGroup, VictoryLine} from 'victory';
import InputRange from 'react-input-range';
import './InputRange.css';
import 'muicss/dist/css/mui.min.css';
import Appbar from 'muicss/lib/react/appbar';
import Button from 'muicss/lib/react/button';
import Container from 'muicss/lib/react/container';
import Col from 'muicss/lib/react/col';
import Row from 'muicss/lib/react/row';
import Panel from 'muicss/lib/react/panel';
import Textarea from 'muicss/lib/react/textarea';
import _ from 'underscore';

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

function integrate({from, to, pdf, n = 1000}) {
  let sum = 0, last = pdf(from);
  let delta = (to - from) / n;
  for (let i = 1; i <= n; i++) {
    let cur = pdf(from + i * delta);
    sum += delta * (last + cur) / 2;
    last = cur;
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

  shouldComponentUpdate(nextProps, nextState){
    return !(_.isEqual(this.props, nextProps) && _.isEqual(this.state, nextState));
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
        <div>
          <VictoryChart padding={{top: 20, bottom: 30, left: 50, right: 50}}>
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
        <div style={{paddingLeft: '11%', paddingRight: '11%', paddingBottom:20}}>
          <InputRange
            maxValue={to}
            minValue={from}
            value={{min: hFrom, max: hTo}}
            onChange={this.handleValuesChange.bind(this)}
          />
        </div>
        <div style={{textAlign: 'center', position: 'relative'}}>
          Probability ( {hFrom}&lt;=reward&lt;{hTo} ): <br/>
          for Red={p1.toFixed(5)} {" | "} for Blue={p2.toFixed(5)}
        </div>
      </div>
    );
  }
}

const questions = [
  {from: 10, to: 50, pdf1: (x)=>10 / x / 16.09439, pdf2: (x)=>Math.pow(Math.sin(x), 2) / 20.35464},
  {from: 10, to: 50, pdf1: (x)=>10 / x / 16.09439, pdf2: (x)=>Math.pow(Math.tan(x/200), 2)/1.06004},
];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  buttonVariant(questionIndex, pdfIndex) {
    let value = this.state[questionIndex];
    if (typeof(value) !== "undefined" && value !== pdfIndex) {
      return 'flat';
    } else {
      return 'default';
    }
  }

  handleClick(questionIndex, pdfIndex){
    let latest = Object.keys(this.state).reduce(
      (x, y) => Math.max(x, y),
      -1
    );
    console.log(latest);
    if (latest > questionIndex){
      alert('Please do not change your previous choices.');
    } else {
      this.setState({[questionIndex]: pdfIndex});
    }
  }

  render() {
    return (
      <div >
        <Appbar>
          <table width="100%">
            <tbody>
            <tr style={{verticalAlign: 'middle'}}>
              <td className="mui--appbar-height mui--text-subhead" style={{textAlign: 'center'}}>
                <p>Hi! Thank you very much for participating!</p>
                <p>Please select "RED" or "BLUE" button for
                  each case and describe why. </p>
                <p>The slider at the bottom of each chart helps you inspect probabilities.</p>
              </td>
            </tr>
            </tbody>
          </table>
        </Appbar>
        <Container>
          <Row>
            <Col xs="12" md="6" md-offset="3">
              {questions.map((question, i) => (
                <Panel key={i}>
                  <Row>
                    <Col md="6" xs="4">
                      <h2>Case: {i + 1}</h2>
                    </Col>
                    <Col md="6" xs="8">
                      <h2>
                        <Button variant={this.buttonVariant(i, 1)} color="danger"
                                onClick={()=>this.handleClick(i, 1)}>Red</Button>
                        <Button variant={this.buttonVariant(i, 2)} color="primary"
                                onClick={()=>this.handleClick(i, 2)}>Blue</Button>
                      </h2>
                    </Col>
                  </Row>
                  {this.state[i] ? (
                  <Row>
                    <Col md="12">
                      <Textarea hint="Why?" required={true}/>
                    </Col>
                  </Row>
                  ) : null}
                  <MyChart {...question}/>
                </Panel>
              ))}
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default App;
