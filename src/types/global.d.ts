/**
 * global.d.ts
 * 
 * Global type declarations for the project.
 * This file is automatically included by TypeScript.
 */

// Declare Jest globals
declare global {
  // Jest testing functions
  const describe: (name: string, fn: () => void) => void;
  const beforeEach: (fn: () => void) => void;
  const afterEach: (fn: () => void) => void;
  const beforeAll: (fn: () => void) => void;
  const afterAll: (fn: () => void) => void;
  const it: (name: string, fn: () => void | Promise<void>) => void;
  const test: typeof it;
  const expect: jest.Expect;
  
  // Jest namespace
  namespace jest {
    interface Expect {
      <T>(actual: T): jest.Matchers<T>;
    }
    
    interface Matchers<T> {
      toBe(expected: any): void;
      toEqual(expected: any): void;
      toBeNull(): void;
      toBeDefined(): void;
      toBeUndefined(): void;
      toBeNaN(): void;
      toBeTruthy(): void;
      toBeFalsy(): void;
      toBeGreaterThan(expected: number): void;
      toBeGreaterThanOrEqual(expected: number): void;
      toBeLessThan(expected: number): void;
      toBeLessThanOrEqual(expected: number): void;
      toContain(expected: any): void;
      toMatch(expected: string | RegExp): void;
      toThrow(expected?: string | Error | RegExp): void;
      toHaveBeenCalled(): void;
      toHaveBeenCalledTimes(expected: number): void;
      toHaveBeenCalledWith(...args: any[]): void;
      resolves: Matchers<Promise<T>>;
      rejects: Matchers<Promise<T>>;
      not: Matchers<T>;
    }
    
    function fn<T = any>(): jest.Mock<T>;
    
    interface Mock<T = any> {
      (...args: any[]): T;
      mockReturnValue(value: T): this;
      mockReturnValueOnce(value: T): this;
      mockImplementation(fn: (...args: any[]) => T): this;
      mockImplementationOnce(fn: (...args: any[]) => T): this;
      mockResolvedValue(value: any): this;
      mockResolvedValueOnce(value: any): this;
      mockRejectedValue(value: any): this;
      mockRejectedValueOnce(value: any): this;
      mockClear(): this;
      mockReset(): this;
      mockRestore(): this;
      getMockName(): string;
      mockName(name: string): this;
      mock: {
        calls: any[][];
        instances: T[];
        invocationCallOrder: number[];
        results: Array<{ type: string; value: any }>;
      };
    }
  }
}

// This export is needed to make this a module
export {};
