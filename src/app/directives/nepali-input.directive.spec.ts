import { NepaliInputDirective } from './nepali-input.directive';
import { TransliterateService } from '../services/transliterate.service';

describe('NepaliInputDirective', () => {
  const convertedName = '\u0915\u094b\u092e\u0932 \u0936\u094d\u0930\u0947\u0937\u094d\u0920';

  function createDirective() {
    const nativeInput = { value: '' };
    const getInputElement = jasmine.createSpy().and.resolveTo(nativeInput);
    const ionInput = { value: '', getInputElement };
    const ngModel = {
      control: {
        setValue: jasmine.createSpy('setValue'),
      },
      viewToModelUpdate: jasmine.createSpy('viewToModelUpdate'),
    };
    const directive = new NepaliInputDirective(
      { nativeElement: ionInput } as any,
      ngModel as any,
      new TransliterateService(),
    );

    return { directive, getInputElement, ionInput, nativeInput, ngModel };
  }

  it('waits until the value is committed before converting', () => {
    const { directive, ionInput, ngModel } = createDirective();

    directive.onIonInput({ detail: { value: 'Komal Shrestha' }, target: ionInput } as any);

    expect(ionInput.value).toBe('');
    expect(ngModel.control.setValue).not.toHaveBeenCalled();
    expect(ngModel.viewToModelUpdate).not.toHaveBeenCalled();
  });

  it('syncs converted text to Ionic input, native input, and ngModel', async () => {
    const { directive, getInputElement, ionInput, nativeInput, ngModel } = createDirective();

    directive.onIonChange({ detail: { value: 'Komal Shrestha' }, target: ionInput } as any);
    await getInputElement.calls.mostRecent().returnValue;

    expect(ionInput.value).toBe(convertedName);
    expect(nativeInput.value).toBe(convertedName);
    expect(ngModel.control.setValue).toHaveBeenCalledWith(convertedName, { emitEvent: false });
    expect(ngModel.viewToModelUpdate).toHaveBeenCalledWith(convertedName);
  });
});
