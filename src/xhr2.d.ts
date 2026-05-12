declare module "xhr2" {
  export const XMLHttpRequest: {
    new (): globalThis.XMLHttpRequest;
  };
}
