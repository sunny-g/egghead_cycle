/*
  guiding principle:
    our user writes all the logic
    subscribes should be as far away from the rest of the app as possible (and part of the framework)
 */

function h(tagName, children) {
  return { tagName, children };
}

function h1(children) {
  return h('h1', children);
}

function span(children) {
  return h('span', children);
}

/********************************************************************************/
// app-specific logic
/********************************************************************************/
function main(sources) {
  // take a source (input) and create an app-specific sink for each source 
  const sinks = {
    DOM: sources.DOM.selectEvents('span', 'mouseover')
      .startWith(null)
      .flatMapLatest(() => {
        return Rx.Observable.timer(0, 1000)
          .map(i => {
            return h1([
              span([
                `seconds elapsed ${i}`
              ])
            ])
          })
      }),

    console: Rx.Observable.timer(0, 2000)
      .map(i => i * 2)
  };

  return sinks;
}

/********************************************************************************/
// effects
/********************************************************************************/
// driver:  does the effect of the sink, returns the sources
// source:  input, read effects our app receives (clicks, localStorage)
// sink:    output, write effects our app produces (DOM output, network requests)

// takes in a sink, does the write effect, produces a source of read effects
function makeDOMDriver(mountSelector) {
  return function DOMDriver(sink$) {
    // take some sink and do the write effect
    function createElement(obj) {
      const element = document.createElement(obj.tagName);
      obj.children
        .filter(child => typeof child === 'object')
        .map(createElement)
        .forEach(child => element.appendChild(child));
      obj.children
        .filter(child => typeof child === 'string')
        .forEach(child => element.innerHTML += child);
      return element;
    }

    sink$.subscribe(obj => {
      const container = document.querySelector(mountSelector);
      container.innerHTML = '';
      const element = createElement(obj);
      container.appendChild(element);
    });

    // create and return a source of anything that originates from the DOM
    const DOMSource = {
      selectEvents: function(tagName, eventType) {
        return Rx.Observable.fromEvent(document, eventType)
          .filter(ev => ev.target.tagName === tagName.toUpperCase());
      }
    }
    return DOMSource;
  }
}

function consoleDriver(sink$) {
  // take some sink and do the effect
  return sink$.subscribe(msg => console.log(msg));
}

/********************************************************************************/
// cycle.js core code
/********************************************************************************/
/*
  b/c most sinks can be a source, to complete the cycle we must for each driver:
    - create an empty source (proxySource)
      - an observable that represents future inputs into our app
      - aka effects that our app will "read" or "receive"
    - use main to create sinks from driver
      - an observable that maps inputs to write outputs
      - aka effects that our app will "write" or produce
    - create a source from the driver
      - an observable that represents actual inputs into our app
      - aka a stream of the actual effects our app will "read" or "receive"
    - pipe the source's read effects back into the proxySource
      - subscribe to the source stream and call proxySource.onNext for each effect the app receives
      -- thus completing the cycle

 */

const drivers = {
  DOM: makeDOMDriver('#app'),
  console: consoleDriver
}

// actually start the app
const {sinks, sources} = Cycle.run(main, drivers);
