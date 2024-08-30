// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

const observe = jest.fn();

window.IntersectionObserver = jest.fn(function () {
  this.observe = observe;
});
