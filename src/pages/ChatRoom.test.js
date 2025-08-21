import { describe, it, expect } from 'vitest';
import { autolink, highlightMentions } from './ChatRoom.jsx';

describe('ChatRoom helper functions', () => {
  it('autolink transforms URLs into anchor tags', () => {
    const input = 'visit http://a.com';
    const expected = 'visit <a class="autolink" target="_blank" rel="noreferrer" href="http://a.com">http://a.com</a>';
    expect(autolink(input)).toBe(expected);
  });

  it('highlightMentions wraps mentions with span.mention', () => {
    const input = 'hello @user';
    const expected = 'hello <span class="mention">@user</span>';
    expect(highlightMentions(input, { name: 'user' })).toBe(expected);
  });
});
