export interface Result {
  madeAt: string;
  timeElapsed: number;
  requestnumber: number;
  body: { coordinates?: number[][] } | undefined;
  response: any;
}

export interface ResultCore {
  madeAt: string;
  timeElapsed: number;
  requestnumber: number;
  body: { coordinates?: number[][] } | undefined;
}
