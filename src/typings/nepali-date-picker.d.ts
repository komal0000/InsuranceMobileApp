declare module 'nepali-date-picker/dist/nepaliDatePicker.min.js';

declare module 'jquery' {
  interface JQuery {
    nepaliDatePicker(options?: Record<string, unknown>): JQuery;
  }
}
