declare namespace jest {
  interface Mock<T extends (...args: any[]) => any = (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T>;
    mockResolvedValueOnce(value: any): this;
    mockRejectedValueOnce(value: any): this;
    mockImplementation(fn: T): this;
    mockReturnValue(value: any): this;
    mockReset(): this;
    mockClear(): this;
    mock: {
      calls: Parameters<T>[];
    };
  }
}

declare module '@jest/globals' {
  export const describe: (name: string, fn: () => void) => void;
  export const it: (name: string, fn: () => any) => void;
  export const expect: any;
  export const beforeEach: (fn: () => any) => void;
  export const jest: {
    fn: <T extends (...args: any[]) => any>(implementation?: T) => jest.Mock<T>;
    clearAllMocks: () => void;
    mock: (moduleName: string, factory?: () => unknown) => void;
  };
}
