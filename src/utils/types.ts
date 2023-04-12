export interface Result {
  madeAt: string;
  timeElapsed: number;
  requestnumber: number;
  status: number;
  body: { coordinates?: number[][] } | undefined;
  url: string;
  response: any;
}

export interface ResultCore {
  madeAt: string;
  timeElapsed: number;
  requestnumber: number;
  status: number;
  body: { coordinates?: number[][] } | undefined;
  url: string;
}
