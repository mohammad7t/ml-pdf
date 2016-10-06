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
      hFrom: this.props.initialFrom || this.props.from,
      hTo: this.props.initialTo || this.props.to,
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

    const hStyle = {data: {strokeDasharray: "5, 5", stroke: "#0f0"}};
    return (
      <div>
        <div className="RideStep4">
          <Row>
            {this.rewardCol(true, p1, p1 > p2)}
            {this.rewardCol(false, p2, p2 > p1)}
          </Row>
          <div style={{height: 10}} />
          <div style={{paddingLeft: '11%', paddingRight: '11%'}}>
            <InputRange
              maxValue={to}
              minValue={from}
              value={{min: hFrom, max: hTo}}
              onChange={this.handleValuesChange.bind(this)}
            />
          </div>
        </div>
        <div className="RideStep3">
          <VictoryChart padding={{top: 20, bottom: 40, left: 50, right: 50}}>
            <VictoryAxis
              label="Reward"
              domain={[from, to]}
              tickCount={8}
              style={{
                axis: {strokeWidth: 3},
                ticks: {size: 7, stroke: '#000'},
              }}
              standalone={false}/>
            <VictoryAxis
              dependentAxis
              style={{axis: {strokeWidth: 3}}}
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
            <VictoryLine data={[{x: hFrom - .00001, y: 0}, {x: hFrom, y: yMax * 1.05}]} style={hStyle}/>
            <VictoryLine data={[{x: hTo - .00001, y: 0}, {x: hTo, y: yMax * 1.05}]} style={hStyle}/>
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
      steps: [],
    });
  }

  componentWillMount() {
    this.resetState();
  }

  componentWillReceiveProps() {
    this.resetState();
  }

  componentDidMount() {
    if (this.props.level === 0) {
      this.addSteps([
        {
          title: 'سلام!',
          text: 'ممنون از اینکه وقت خود را برای کمک به این پژوهش می‌گذارید. این پژوهش چند مرحله‌ی کوتاه دارد. لطفا مراحل را تا پر شدن کامل این دایره ادامه دهید. قول می‌دهیم زمان زیادی از شما نگیریم! <br/> بگذارید ابتدا این صفحه را برایتان توضیح دهیم. کلید «راهنمایی بعدی» را بفشارید',
          selector: '.RideStep1',
          position: 'right',
        },
        {
          title: 'صورت مساله',
          text: `
فرض کنید دو کلید آبی و قرمز روی یک عابربانک وجود دارد و می‌توانید یکی از آن دو را انتخاب نموده و
 <span style="font-weight: bold; color: green;">
«فقط یک بار» 
</span>
شانس خود را برای دریافت جایزه امتحان کنید.
<br/>
با فشار دادن هر کلید، عابربانک مبلغی جایزه به شما می‌دهد. این مبلغ، با فرآیندی تصادفی تعیین می‌شود و مقدار دقیق آن از قبل مشخص نیست. (این مبلغ ممکن است منفی باشد و از حسابتان کسر شود!)
<br/>
اما در هر مرحله اطلاعاتی درباره‌ی احتمال‌های جایزه‌ی دریافتی از هر کلید به شما می‌دهیم و از شما می‌پرسیم اگر جلوی عابربانک باشید، کدام کلید را انتخاب می‌کردید؟
`,
          selector: '.RideStep2',
          position: 'bottom',
        },
        {
          title: 'نمودار توزیع چگالی احتمال جایزه',
          text: `
 در هر مرحله دو نمودار قرمز و آبی هر کدام برای کلید همان رنگ مشاهده می‌کنید.
 
 محور افقی (Reward) نمایانگر مبلغ جایزه (با واحد 
  <span style="font-weight: bold; color: green;">
«هزار تومان» 
</span>
) 
 و محور عمودی بیانگر میزان احتمال است. 
  <br/>
  نحوه‌ی تفسیر هر نمودار به این صورت است که برای هر
    <span style="font-weight: bold; color: green;">
    «بازه»
    </span>
از مقادیر جایزه، احتمال برنده شدن مبلغی در آن بازه، متناسب است با
    <span style="font-weight: bold; color: green;">
    «مساحت زیر نمودار»
    </span>
آن بازه. همواره مساحت زیر کل نمودار هر رنگ برابر ۱۰۰ است.
<br/>
مثلا، در این نمودار حدود یک چهارم مساحت زیر نمودار آبی، در بازه‌ی اعداد منفی است. یعنی به احتمال ۲۵ درصد با انتخاب کلید آبی، ضرر می‌کنید.
`,
          selector: '.RideStep3',
          position: 'top',
        },
        {
          title: 'ابزار اندازه‌گیری',
          text: `
برای کمک به تصمیم‌گیری بهتر شما، ابزاری تعبیه کرده‌ایم که می‌توانید با جابجایی دایره‌‌های سبز رنگ، بازه‌ای را انتخاب نموده و مساحت زیر هر کدام از نمودارهای قرمز و آبی را در آن بازه به صورت همزمان مشاهده نمایید.
<br/>
لطفا نمودار را بررسی نموده و روی یکی از دو کلید بالا کلیک کنید. 
`,
          selector: '.RideStep4',
          position: 'bottom',
        },
      ]);
      this.joyride.start(true);
    }
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

  renderJoyride() {
    if (this.state.level > 0)
      return null;
    return <Joyride ref={c => (this.joyride = c)}
                    steps={this.state.steps}
                    showStepsProgress={true}
                    type="continuous"
                    showSkipButton={true}
                    locale={{
                      back: (<span>راهنمایی قبلی</span>),
                      close: (<span>بستن</span>),
                      next: (<span>راهنمایی بعدی</span>),
                      last: (<span>شروع نظرسنجی</span>),
                      skip: (<span>بلدم!</span>),
                    }}/>
  }

  render() {
    let {level, levels, question} = this.props;
    let percent = (level + 1) * 100 / (levels + 1);
    return (<div>
      {this.renderJoyride()}
      <MyPanel>
        <Row>
          <Col md="2" xs="2" lg="2">
            <Circle percent={percent} strokeWidth="10" strokeColor="#ccc" className="RideStep1"/>
          </Col>
          <Col md="6" xs="6" lg="6" style={{textAlign: 'right'}} className="RideStep2">
            <Button variant={this.buttonVariant(1)} color="danger"
                    onClick={()=>this.handleClick(1)} className="RideStep5">Red </Button>
            <Button variant={this.buttonVariant(2)} color="primary"
                    onClick={()=>this.handleClick(2)} className="RideStep6">Blue</Button>
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
      </MyPanel>
    </div>);
  }
}

let questions = require('./questions').list;
questions = questions.map(({from, to, pdf1, pdf2, ...rest}) => {
  let s1 = integrate({from, to, pdf: pdf1});
  let s2 = integrate({from, to, pdf: pdf2});
  let ret = {from, to, pdf1: (x)=>pdf1(x) / s1, pdf2: (x)=>pdf2(x) / s2, ...rest};
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


  render() {
    let {level} = this.state;
    if (level < questions.length) {
      return (<Level key={level} level={level} levels={questions.length} question={questions[level]}
                     onSubmit={this.handleSubmit.bind(this)}/>);
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
