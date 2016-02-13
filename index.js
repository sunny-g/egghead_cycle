/*
  guiding principle:
    our user writes all the logic
    subscribes should be as far away from the rest of the app as possible (and part of the framework)

 */

// logic
function main() {
  // allows us to provide different sinks to different effects
  return {
    DOM: Rx.Observable.timer(0, 1000)
      .map(i => `seconds elapsed ${i}`),

    Log: Rx.Observable.timer(0, 2000)
      .map(i => i * 2)
  }
}

// effects
function DOMDriver(text$) {
  return text$.subscribe(text => {
    const container = document.querySelector('#app');
    container.textContent = text;
  });
}

function consoleDriver(msg$) {
  return msg$.subscribe(msg => console.log(msg));
}

// hooks up the logic to the effects

// like a kitchen sink where "water comes into the sink and is drained to some effect" 
function run(main, drivers) {
  const sinks = main();
  Object.keys(drivers).forEach((driver) => {
    if (sinks[driver]) drivers[driver](sinks[driver]);
  });
  return {sinks, sources: drivers}
}

/*
  drivers are an interface between software (programs) and hardware
  drivers connect the program (logic) to the hardware (effects)
 */
const drivers = {
  DOM: DOMDriver,
  Log: consoleDriver
}

run(main, drivers)
