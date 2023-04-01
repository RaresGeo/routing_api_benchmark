export interface Result {
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
  timeElapsed: number;
  requestnumber: number;
  params: {
    profile: string;
    start: string;
    end: string;
  };
}
