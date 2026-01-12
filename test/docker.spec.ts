import {describe, expect, test} from 'bun:test';
import Landerode from './../lib/docker';

describe('docker', () => {
  describe('#Landerode', () => {
    test('should be a class with expected methods', () => {
      const landerode = new Landerode();
      expect(landerode).toBeInstanceOf(Landerode);
      expect(typeof landerode.createNet).toBe('function');
      expect(typeof landerode.scan).toBe('function');
      expect(typeof landerode.isRunning).toBe('function');
      expect(typeof landerode.list).toBe('function');
      expect(typeof landerode.remove).toBe('function');
      expect(typeof landerode.stop).toBe('function');
      expect(typeof landerode.getContainer).toBe('function');
      expect(typeof landerode.getNetwork).toBe('function');
      expect(typeof landerode.listNetworks).toBe('function');
      expect(typeof landerode.listContainers).toBe('function');
      expect(typeof landerode.ping).toBe('function');
    });

    test('should accept custom id in constructor', () => {
      const landerode = new Landerode({}, 'custom-id');
      expect(landerode.id).toBe('custom-id');
    });

    test('should use default id if not specified', () => {
      const landerode = new Landerode();
      expect(landerode.id).toBe('lando');
    });

    test('should accept options in constructor', () => {
      const landerode = new Landerode({socketPath: '/custom/socket.sock'});
      expect(landerode).toBeInstanceOf(Landerode);
    });
  });
});
