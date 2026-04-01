import { describe, expect, it } from 'vitest';
import { parseApiError } from './parseApiError';

describe('parseApiError', () => {
  it('returns fallback when response data is missing', () => {
    expect(parseApiError(new Error('oops'), 'Something went wrong')).toBe('Something went wrong');
  });

  it('joins detail messages when API provides validation details', () => {
    const err = {
      response: {
        data: {
          error: 'Validation failed',
          details: {
            title: ['Title is required'],
            dueDate: ['Due date must be in the future'],
          },
        },
      },
    };

    expect(parseApiError(err, 'Fallback')).toBe('Title is required. Due date must be in the future');
  });

  it('returns top-level API error when details are empty', () => {
    const err = {
      response: {
        data: {
          error: 'Unauthorized',
          details: {},
        },
      },
    };

    expect(parseApiError(err, 'Fallback')).toBe('Unauthorized');
  });

  it('returns fallback when API response has no error message', () => {
    const err = {
      response: {
        data: {
          details: {
            field: [],
          },
        },
      },
    };

    expect(parseApiError(err, 'Fallback')).toBe('Fallback');
  });
});

