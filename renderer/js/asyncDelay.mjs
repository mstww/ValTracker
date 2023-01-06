/**
 * An asynchronous timeout function. Works by returning a promise that gets resolved after the delay
 * that is passed into the function with a parameter.

 * @param {Number} delay Amount of time to wait for. (Milliseconds)

 * @returns A promise that can be awaited.
 */

export default async function asyncDelay(delay) {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}