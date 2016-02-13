/*
  guiding principle:
    our user writes all the logic
    subscribes should be as far away from the rest of the app as possible (and part of the framework)
 */

const {h, h1, span, label, input, hr, div, makeDOMDriver} = CycleDOM;

/********************************************************************************/
// app-specific logic
/********************************************************************************/
// main always returns an object of sinks
function main(sources) {
  const inputEv$ = sources.DOM.select('.field').events('input');
  const name$ = inputEv$
    .map(ev => ev.target.value)
    .startWith('<user>');
  
  return {
    DOM: name$.map(name =>
      div([
        label('Name'),
        input('.field', {type: 'text'}),
        hr(),
        h1(`Hello ${name}!`)
      ])
    )
  }
}

/********************************************************************************/
// effects
/********************************************************************************/
// driver:  does the effect of the sink, returns the sources
// source:  input, read effects our app receives (clicks, localStorage)
// sink:    output, write effects our app produces (DOM output, network requests)

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
}

// actually start the app
const {sinks, sources} = Cycle.run(main, drivers);
