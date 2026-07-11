/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

// Plaid Link is a native module with no implementation under Jest's Node
// environment, so stub it out for the render smoke test.
jest.mock('react-native-plaid-link-sdk', () => ({
  createPlaidLinkSession: jest.fn(),
}));

it('renders correctly', () => {
  renderer.create(<App />);
});
