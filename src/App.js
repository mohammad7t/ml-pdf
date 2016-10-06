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
import firebase from 'firebase';
import Spinner from 'react-spinjs';
import Joyride from 'react-joyride';
import 'react-joyride/lib/styles/react-joyride-compiled.css';

const firebaseConf = {
  apiKey: "AIzaSyA33ocRW7FR9S8KDCsh2h9FSy09QBMyut0",
  authDomain: "ml-pdf.firebaseapp.com",
  databaseURL: "https://ml-pdf.firebaseio.com",
};
firebase.initializeApp(firebaseConf);

let memoize = new Map();

function makePoints(args) {
  let {from, to, pdf, n = 80} = args;
  let sig = pdf.hash + ":" + from + ":" + to + ":" + n;
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
  componentWillMount() {
    this.setState({
      hFrom: this.props.from,
      hTo: this.props.to,
      ...this.pointsState(this.props)
    })
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

class MyPanel extends React.Component {
  render() {
    return (<div>
      <div style={{height: 30}}/>
      <Container>
        <Row>
          <Col xs="12" md="10" md-offset="1" lg="6" lg-offset="3">
            <Panel>
              {this.props.children}
            </Panel>
          </Col>
        </Row>
      </Container>
    </div>);
  }
}

class Level extends React.Component {
  resetState() {
    this.setState({
      select: null,
      why: '',
      submitted: false,
    });
  }

  componentWillMount() {
    this.resetState();
  }

  componentWillReceiveProps() {
    this.resetState();
  }

  buttonVariant(index) {
    return (this.state.select === null || this.state.select === index) ? 'default' : 'flat';
  }

  handleClick(select) {
    this.setState({select});
  }

  handleSubmit() {
    if (this.state.submitted)
      return;
    this.setState({submitted: true});
    this.props.onSubmit(this.state);
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
    let {level, levels, question} = this.props;
    let percent = (level + 1) * 100 / (levels + 1);
    return (<MyPanel>
      <Row>
        <Col md="2" xs="2" lg="2">
          <Circle percent={percent} strokeWidth="10" strokeColor="#ccc" className="RideStep1"/>
        </Col>
        <Col md="6" xs="6" lg="6" style={{textAlign: 'right'}} className="RideStep3">
          <Button variant={this.buttonVariant(1)} color="danger"
                  onClick={()=>this.handleClick(1)}>Red </Button>
          <Button variant={this.buttonVariant(2)} color="primary"
                  onClick={()=>this.handleClick(2)}>Blue</Button>
        </Col>
        <Col md="4" xs="4" lg="4">
          {this.state.why ? (
            <Button style={{backgroundColor: '#444', color: '#eee'}}
                    onClick={this.handleSubmit.bind(this)}>
              {(!this.state.submitted ? "Next >" : (<div>
                <div style={{visibility: 'hidden'}}>{"Next >"}</div>
                <Spinner color="white"/>
              </div>))}
            </Button>
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
                      hint={`Please write here your reason for choosing ${['', 'Red', 'Blue'][this.state.select]}
 لطفا توضیح دهید چرا ${['', 'قرمز', 'آبی'][this.state.select]} را انتخاب نمودید. می‌توانید به فارسی بنویسید.
`}
                      required={true} value={this.state.why}
                      style={{
                        direction: Level.isUnicode(this.state.why) ? 'rtl' : 'ltr',
                      }}
                      onChange={this.handleWhyChange.bind(this)}/>
          </Col>
        </Row>
      ) : null}
      <MyChart {...question}/>
    </MyPanel>);
  }
}

let questions = require('./questions').list;
questions = questions.map(({from, to, pdf1, pdf2}) => {
  let s1 = integrate({from, to, pdf: pdf1});
  let s2 = integrate({from, to, pdf: pdf2});
  let ret = {from, to, pdf1: (x)=>pdf1(x) / s1, pdf2: (x)=>pdf2(x) / s2};
  ret.pdf1.hash = Math.random();
  ret.pdf2.hash = Math.random();
  return ret;
});

class App extends Component {
  constructor(props) {
    super(props);
    let session = localStorage.getItem('ml-session');
    let level = Number.parseInt(localStorage.getItem('ml-level') || '0', 10);
    if (!session || level === questions.length) {
      session = firebase.database().ref().child('sessions').push().key;
      level = 0;
      localStorage.setItem('ml-session', session);
      localStorage.setItem('ml-level', level);
    }
    this.state = {
      session,
      level,
      steps: [],
    };

  }

  handleSubmit(data) {
    let {session, level} = this.state;

    firebase.database().ref().child(`sessions/${session}`).update({
      currentLevel: level + 1,
      [level]: data,
    }).then(()=> {
      if (this.state.level === level) {
        localStorage.setItem('ml-level', `${level + 1}`);
        this.setState({
          level: level + 1,
        });
      }
    });
  }

  addSteps(steps) {
    let joyride = this.joyride;

    if (!Array.isArray(steps)) {
      steps = [steps];
    }

    if (!steps.length) {
      return false;
    }

    this.setState(function (currentState) {
      currentState.steps = currentState.steps.concat(joyride.parseSteps(steps));
      return currentState;
    });
  }

  addTooltip(data) {
    this.joyride.addTooltip(data);
  }

  componentDidMount() {
    if (this.state.level === 0) {
      this.addSteps([
        {
          title: 'سلام!',
          text: 'ممنون از اینکه وقت خود را برای کمک به این پژوهش گذاشتید. این پژوهش چند مرحله‌ی کوتاه دارد. لطفا مراحل را تا پر شدن کامل این دایره ادامه دهید. قول می‌دهیم زمان زیادی از شما نگیریم! <br/> بگذارید ابتدا این صفحه را برایتان توضیح دهیم. کلید «آموزش بعدی» را بفشارید',
          selector: '.RideStep1',
          position: 'right',
        },
        {
          title: 'آشنایی با مرحله‌ها',
          text: 'در هر مرحله، ',
          selector: '.RideStep2',
          position: 'bottom',
        },
      ]);
      this.joyride.start(true);
    }
  }

  render() {
    let {level} = this.state;
    if (level < questions.length) {
      return (<div>
        <Joyride ref={c => (this.joyride = c)} steps={this.state.steps} showStepsProgress={true} type="continuous" locale={{
          back: (<span>آموزش قبلی</span>),
          close: (<span>بلدم!</span>),
          next: (<span>آموزش بعدی</span>),
          last: (<span>شروع نظرسنجی</span>),
        }}/>
        <Level key={level} level={level} levels={questions.length} question={questions[level]}
               onSubmit={this.handleSubmit.bind(this)}/>
      </div>);
    } else {
      return (
        <Container>
          <h3>Thank you so much!</h3>
          <Button onClick={()=>location.reload()} color="primary"> Restart </Button>
          <Button onClick={()=>window.close()} color="primary"> Exit </Button>
        </Container>
      );
    }
  }
}

export default App;
