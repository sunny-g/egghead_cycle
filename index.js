/*
  guiding principle:
    our user writes all the logic
    subscribes should be as far away from the rest of the app as possible (and part of the framework)

 */

// logic (functional)
Rx.Observable.timer(0, 1000)
  .map((i) => `seconds elapsed ${i}`)

// effects (imperative, things that change external world)
  .subscribe(text => {
    const container = document.querySelector('#app');
    container.textContent = text;
  });