export const TEST_REQUEST_CHANGE_EVENT = 'testrequest:change';

export type TestRequestChangeDetail = { tags: string[] };

export const dispatchTestRequestChange = (tags: string[]) =>
  document.dispatchEvent(new CustomEvent<TestRequestChangeDetail>(TEST_REQUEST_CHANGE_EVENT, { detail: { tags } }));
