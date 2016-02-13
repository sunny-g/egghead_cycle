/*
  guiding principle:
    our user writes all the logic
    subscribes should be as far away from the rest of the app as possible (and part of the framework)

 */

// logic
function main() {
  return Rx.Observable.timer(0, 1000)
    .map((i) => `seconds elapsed ${i}`)
}

// effects
function DOMEffect(text$) {
  return text$.subscribe(text => {
    const container = document.querySelector('#app');
    container.textContent = text;
  });
}

function consoleEffect(msg$) {
  return msg$.subscribe(msg => console.log(msg));
}

// hooks up the logic to the effects

// like a kitchen sink where "water comes into the sink and is drained to some effect" 
const sink = main();
DOMEffect(sink);
consoleEffect(sink);
