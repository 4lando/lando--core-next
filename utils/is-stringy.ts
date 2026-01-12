
export default data => typeof data === 'string' || data?.constructor?.name == 'ImportString';
