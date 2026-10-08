import { autosize } from './autosize';

it('sizes a hidden drawer textarea when it becomes visible and on input', () => {
  let visible = false;
  let observeResize = () => {};
  let input = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { observeResize = callback; }
    observe() {}
    disconnect = disconnect;
  });
  const node = {
    style: { height: '', overflow: '' },
    scrollHeight: 160,
    getClientRects: () => visible ? [{}] : [],
    getBoundingClientRect: () => ({ width: visible ? 300 : 0 }),
    addEventListener: (_: string, callback: () => void) => { input = callback; },
    removeEventListener: vi.fn(),
  };
  const action = autosize(node as unknown as HTMLTextAreaElement, 'Description');
  expect(node.style.height).toBe('');
  visible = true;
  observeResize();
  expect(node.style.height).toBe('160px');
  node.scrollHeight = 240;
  input();
  expect(node.style.height).toBe('240px');
  expect(node.style.overflow).toBe('hidden');
  action.destroy();
  expect(disconnect).toHaveBeenCalled();
  vi.unstubAllGlobals();
});
