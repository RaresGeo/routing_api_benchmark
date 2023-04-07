export interface Result {
  madeAt: string;
  timeElapsed: number;
  requestnumber: number;
  params: {
    profile: string;
    start: string;
    end: string;
  };
  response: any;
}

export interface ResultCore {
  madeAt: string;
  timeElapsed: number;
  requestnumber: number;
  params: {
    profile: string;
    start: string;
    end: string;
  };
}
