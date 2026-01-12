import isRoot from 'is-root';

export default () => isRoot() ? 'system' : 'user';
