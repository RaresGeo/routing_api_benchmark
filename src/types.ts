export interface Result {
  madeAt: string;
  timeElapsed: number;
  requestnumber: number;
  params: {
    profile: string;
    start: number[];
    end: number[];
  };
  response: any;
}

export interface ResultCore {
  madeAt: string;
  timeElapsed: number;
  requestnumber: number;
  params: {
    profile: string;
    start: number[];
    end: number[];
  };
}
