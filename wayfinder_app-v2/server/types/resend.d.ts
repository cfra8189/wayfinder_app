declare module 'resend' {
  interface SendOptions {
    from?: string;
    to?: string[] | string;
    subject?: string;
    html?: string;
    [key: string]: any;
  }

  class Resend {
    constructor(apiKey?: string);
    emails: {
      send(options: SendOptions): Promise<any>;
    };
  }

  export default Resend;
}
