// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const observe = jest.fn();
const disconnect = jest.fn();

window.IntersectionObserver = jest.fn(function () {
  this.observe = observe;
  this.disconnect = disconnect;
});
