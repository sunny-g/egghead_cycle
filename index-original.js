/*
  guiding principle:
    our user writes all the logic
    subscribes should be as far away from the rest of the app as possible (and part of the framework)
 */

/********************************************************************************/
// app-specific logic
/********************************************************************************/
function main(sources) {
  // take a source (input) and create an app-specific sink for each source 
  const sinks = {
    DOM: sources.DOM
      .startWith(null)
      .flatMapLatest(() => {
        return Rx.Observable.timer(0, 1000)
          .map(i => `seconds elapsed ${i}`)
      }),

    console: Rx.Observable.timer(0, 2000)
      .map(i => i * 2)
  };

  return sinks;
}

/********************************************************************************/
// effects
/********************************************************************************/
/*
  - right now, `main` takes in no sources and only returns sinks, 
    - drivers only write to the external world but do no reading
  - main should be able to take in read effects (sources), as well as pass data to write effects (sinks)
  - if we want read effects, they should be returned from the driver (sources)
 */

// driver:  does the effect of the sink, returns the sources
// source:  input, read effects our app receives (clicks, localStorage)
// sink:    output, write effects our app produces (DOM output, network requests)

// takes in a sink, does the write effect, produces a source of read effects
function DOMDriver(sink$) {
  // take some sink and do the write effect
  sink$.subscribe(text => {
    const container = document.querySelector('#app');
    container.textContent = text;
  });

  // create and return a source of anything that originates from the DOM
  const DOMSource = Rx.Observable.fromEvent(document, 'click');
  return DOMSource;
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
function run(main, drivers) {
  // create an empty observable/observer (Rx.Subject) for each driver
  const proxySources = {};
  Object.keys(drivers).forEach((driverName) => {
    proxySources[driverName] = new Rx.Subject();
  });

  // create sinks from empty proxySources
  const sinks = main(proxySources);

  // for each driver, pipe it's read effects back into the proxySource
  Object.keys(drivers).forEach((driverName) => {
    const driver = drivers[driverName];
    
    const sink = sinks[driverName];
    const proxySource = proxySources[driverName];
    const source = driver(sink);
    source.subscribe(x => proxySource.onNext(x));
  });

  return {sinks, sources: proxySources};
}

/*
  drivers are an interface between software (programs) and hardware
  drivers connect the program (logic) to the hardware (effects)
 */
const drivers = {
  DOM: DOMDriver,
  // console: consoleDriver
}

// actually start the app
const {sinks, sources} = run(main, drivers);
