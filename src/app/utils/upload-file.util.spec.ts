import { prepareUploadFile, uploadFilenameForField } from './upload-file.util';

describe('upload file utilities', () => {
  const timestamp = new Date(2026, 5, 13, 14, 35, 22);

  it('builds deterministic citizenship filenames', () => {
    expect(uploadFilenameForField('citizenship_front_image', 'webp', { timestamp }))
      .toBe('citizen_front_20260613_143522.webp');
    expect(uploadFilenameForField('citizenship_back_image', 'pdf', { timestamp }))
      .toBe('citizen_back_20260613_143522.pdf');
  });

  it('uses sanitized target group type as target group keyword', () => {
    expect(uploadFilenameForField('target_group_front_image', 'webp', {
      timestamp,
      targetGroupType: 'Severe Disability',
    })).toBe('severe_disability_front_20260613_143522.webp');
  });

  it('renames PDFs without attempting image conversion', async () => {
    const source = new File(['pdf'], 'citizenship.pdf', { type: 'application/pdf' });

    const prepared = await prepareUploadFile(source, 'citizenship_front_image', {
      timestamp,
    });

    expect(prepared.name).toBe('citizen_front_20260613_143522.pdf');
    expect(prepared.type).toBe('application/pdf');
    expect(prepared.size).toBe(source.size);
  });
});
