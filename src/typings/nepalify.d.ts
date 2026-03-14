declare module 'nepalify' {
  const nepalify: {
    format(text: string, options?: { layout?: string }): string;
    availableLayouts(): string[];
    interceptElementById(
      id: string,
      options?: { layout?: string; enable?: boolean },
    ): { el: HTMLElement; enable(): void; disable(): void; isEnabled(): boolean };
  };
  export default nepalify;
}
