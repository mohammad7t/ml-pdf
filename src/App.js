import React, {Component} from 'react';
import './App.css';
import {VictoryChart, VictoryArea, VictoryGroup, VictoryLine, VictoryAxis} from 'victory';
import InputRange from 'react-input-range';
import './InputRange.css';
import 'muicss/dist/css/mui.min.css';
import Button from 'muicss/lib/react/button';
import Container from 'muicss/lib/react/container';
import Col from 'muicss/lib/react/col';
import Row from 'muicss/lib/react/row';
import Panel from 'muicss/lib/react/panel';
import Textarea from 'muicss/lib/react/textarea';
import _ from 'underscore';
import {Circle} from 'rc-progress';

let memoize = new Map();

function makePoints(args) {
  let {from, to, pdf, n = 80} = args;
  let sig = pdf.toString() + from + ":" + to + ":" + n;
  if (memoize.has(sig))
    return memoize.get(sig);
  let delta = (to - from) / n;
  let points = [];
  let yMax = 0;
  for (let i = 0; i <= n; i++) {
    let x = from + i * delta;
    let y = pdf(x);
    points.push({x, y});
    yMax = Math.max(yMax, y);
  }
  let ret = {
    points, yMax,
  };
  memoize.set(sig, ret);
  return ret;
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
      ...this.pointsState(props)
    }
  }

  handleValuesChange(component, {min, max}) {
    this.setState({
      hFrom: min,
      hTo: max,
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(_.isEqual(this.props, nextProps) && _.isEqual(this.state, nextState));
  }

  pointsState({from, to, pdf1, pdf2}) {
    let {points: points1, yMax: yMax1} = makePoints({from, to, pdf: pdf1});
    let {points: points2, yMax: yMax2} = makePoints({from, to, pdf: pdf2});
    return {
      points1,
      points2,
      yMax: Math.max(yMax1, yMax2),
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.pointsState(nextProps));
  }

  rewardCol(red, p, active) {
    let {hFrom, hTo} = this.state;
    const style = {
      textAlign: 'center',
      color: red ? '#a00' : 'blue',
      fontWeight: active ? 'bold' : 'normal',
      fontSize: '1.5rem',
      paddingTop: '.12em',
      paddingBottom: '.12em'
    };

    return (
      <Col xs="6" md="6" lg="6">
        <p style={style}>
          P({hFrom}&lt;reward&lt;{hTo})={p.toFixed(2)}%
        </p>
      </Col>
    );
  }

  render() {
    let {from, to, pdf1, pdf2} = this.props;
    let {hFrom, hTo, points1, points2, yMax} = this.state;
    const hCond = ({x})=>(x >= hFrom && x <= hTo);
    var hPoints1 = points1.filter(hCond);
    var hPoints2 = points2.filter(hCond);

    let p1 = integrate({from: hFrom, to: hTo, pdf: pdf1}) * 100;
    let p2 = integrate({from: hFrom, to: hTo, pdf: pdf2}) * 100;
    return (
      <div>
        <Row>
          {this.rewardCol(true, p1, p1 > p2)}
          {this.rewardCol(false, p2, p2 > p1)}
        </Row>
        <div style={{paddingLeft: '11%', paddingRight: '11%', position: 'relative', top: 10}}>
          <InputRange
            maxValue={to}
            minValue={from}
            value={{min: hFrom, max: hTo}}
            onChange={this.handleValuesChange.bind(this)}
          />
        </div>
        <div>
          <VictoryChart padding={{top: 20, bottom: 40, left: 50, right: 50}}>
            <VictoryAxis
              label="Reward"
              domain={[from, to]}
              standalone={false}/>
            <VictoryAxis
              dependentAxis
              label="Probability"
              tickFormat={(x)=>''}
              standalone={false}/>
            <VictoryGroup name="main"
                          colorScale={[
                            "red", "blue", "red", "blue", "black", "black"
                          ]}
                          style={{data: {opacity: 0.4}}}
            >
              <VictoryLine data={points1}/>
              <VictoryLine data={points2}/>
              <VictoryArea data={hPoints1}/>
              <VictoryArea data={hPoints2}/>
            </VictoryGroup>
            <VictoryLine data={[{x: hFrom - .001, y: 0}, {x: hFrom, y: yMax}]}/>
            <VictoryLine data={[{x: hTo - .001, y: 0}, {x: hTo, y: yMax}]}/>
          </VictoryChart>
        </div>
      </div>
    );
  }
}

class Level extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      select: null,
      why: '',
    }
  }

  buttonVariant(index) {
    return (this.state.select === null || this.state.select === index) ? 'default' : 'flat';
  }

  handleClick(select) {
    this.setState({select});
  }

  static isUnicode(str) {
    let letters = [];
    for (var i = 0; i <= str.length; i++) {
      letters[i] = str.substring((i - 1), i);
      if (letters[i].charCodeAt() > 255) {
        return true;
      }
    }
    return false;
  }

  handleWhyChange(event) {
    this.setState({why: event.target.value});
  }

  render() {
    let {percent, question} = this.props;
    return (
      <Container style={{marginTop: 30}}>
        <Row>
          <Col xs="12" md="10" md-offset="1" lg="6" lg-offset="3">
            <Panel>
              <Row>
                <Col md="2" xs="2" lg="2">
                  <Circle percent={percent} strokeWidth="10" strokeColor="#ccc"/>
                </Col>
                <Col md="6" xs="6" lg="6" style={{textAlign: 'right'}}>
                  <Button variant={this.buttonVariant(1)} color="danger"
                          onClick={()=>this.handleClick(1)}>Red</Button>
                  <Button variant={this.buttonVariant(2)} color="primary"
                          onClick={()=>this.handleClick(2)}>Blue</Button>
                </Col>
                <Col md="4" xs="4" lg="4">
                  {this.state.why ? (
                    <Button style={{backgroundColor: '#444', color: '#eee'}}>Next &gt;</Button>
                  ) : (
                    this.state.select === null ? (
                      <Button disabled={true}>Red or Blue?</Button>
                    ) : (
                      <Button disabled={true}>Why?</Button>
                    )
                  )}
                </Col>
              </Row>
              {this.state.select !== null ? (
                <Row>
                  <Col xs="12" md="12" lg="12">
                    <Textarea
                      hint={`Please write here your reason for choosing ${['', 'Red', 'Blue'][this.state.select]}`}
                      required={true} value={this.state.why}
                      style={{
                        direction: Level.isUnicode(this.state.why) ? 'rtl' : 'ltr',
                      }}
                      onChange={this.handleWhyChange.bind(this)}/>
                  </Col>
                </Row>
              ) : null}
              <MyChart {...question}/>
            </Panel>
          </Col>
        </Row>
      </Container>
    );
  }
}

let questions = [
  {from: 10, to: 50, pdf1: (x)=>10 / x, pdf2: (x)=>Math.pow(Math.sin(x / 5), 2)},
  {from: 10, to: 50, pdf1: (x)=>10 / x, pdf2: (x)=>Math.pow(Math.tan(x / 200), 2)},
].map(({from, to, pdf1, pdf2}) => {
  let s1 = integrate({from, to, pdf: pdf1});
  let s2 = integrate({from, to, pdf: pdf2});
  return {from, to, pdf1: (x)=>pdf1(x) / s1, pdf2: (x)=>pdf2(x) / s2};
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {level: -1};
  }

  render() {
    return (<Level percent={10} question={questions[0]}/>);
  }
}

export default App;
