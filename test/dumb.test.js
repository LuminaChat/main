import { expect } from 'chai';
import mocks from './mockImports.js';

const modulePath = '../commands/mod/dumb.js';
let importedModule;

const mockPayload = {
  cmd: 'dumb',
  nick: 'nick',
  channel: 'cake',
  userid: 1234,
  allies: [],
}

describe('Checking dumb module', () => {
  // module meta data
  it('should be importable', async () => {
    importedModule = await import(modulePath);
    expect(importedModule).to.not.be.a('string');
  });
  
  it('should be named', async () => {
    expect(importedModule.info.name).to.be.a('string');
  });

  it('should be categorized', async () => {
    expect(importedModule.info.category).to.be.a('string');
  });

  it('should be described', async () => {
    expect(importedModule.info.description).to.be.a('string');
  });

  it('should be documented', async () => {
    expect(importedModule.info.usage).to.be.a('string');
  });

  it('should be invokable', async () => {
    expect(importedModule.run).to.be.a('function');
  });

  // module export functions
  it('should export a random channel function', async () => {
    const resp = importedModule.getChannel();

    expect(resp).to.be.a('string');
  });

  it('should export a common channel function', async () => {
    const resp = importedModule.getChannel('common');

    expect(resp).to.be.a('string');
  });

  it('should initialize', async () => {
    mocks.core.muzzledHashes = undefined;
    const resp = importedModule.init(mocks.core);

    expect(mocks.core.muzzledHashes).to.be.an('object');
  });

  it('should initialize hooks', async () => {
    expect(() => importedModule.initHooks(mocks.server)).not.to.throw();
  });

  // module main function
  it('should be invokable only by a mod', async () => {
    const resp = await importedModule.run({
      core: mocks.core,
      server: mocks.server,
      socket: mocks.plebSocket,
      payload: mockPayload,
    });

    expect(resp).to.be.false;
  });

  it('should shadow block whisper attempts', async () => {
    mocks.core.muzzledHashes['testHash'] = true;
    mocks.plebSocket.hcProtocol = 1;
    
    const resp = importedModule.whisperCheck({
      core: mocks.core,
      server: mocks.server,
      socket: mocks.plebSocket,
      payload: {
        cmd: 'whisper',
        text: [],
        channel: 'cake',
      },
    });

    expect(resp).to.be.false;
  });

  it('should shadow block chat attempts, validating input', async () => {
    mocks.core.muzzledHashes['testHash'] = true;
    mocks.plebSocket.hcProtocol = 1;
    
    const resp = importedModule.chatCheck({
      core: mocks.core,
      server: mocks.server,
      socket: mocks.plebSocket,
      payload: {
        cmd: 'chat',
        text: [],
        channel: 'cake',
      },
    });

    expect(resp).to.be.false;
  });

  it('should shadow block chat attempts', async () => {
    mocks.core.muzzledHashes['testHash'] = true;
    mocks.plebSocket.hcProtocol = 1;
    
    const resp = importedModule.chatCheck({
      core: mocks.core,
      server: mocks.server,
      socket: mocks.plebSocket,
      payload: {
        cmd: 'chat',
        text: 'test',
        channel: 'cake',
      },
    });

    expect(resp).to.be.false;
  });

  it('should shadow block chat attempts, checking for trips', async () => {
    mocks.core.muzzledHashes['testHash'] = true;
    mocks.plebSocket.hcProtocol = 1;
    const newSocket = Object.assign({}, mocks.plebSocket);
    newSocket.trip = 'test';
    
    const resp = importedModule.chatCheck({
      core: mocks.core,
      server: mocks.server,
      socket: newSocket,
      payload: {
        cmd: 'chat',
        text: 'test',
        channel: 'cake',
      },
    });

    expect(resp).to.be.false;
  });

  it('should shadow block chat attempts, checking for color', async () => {
    mocks.core.muzzledHashes['testHash'] = true;
    mocks.plebSocket.hcProtocol = 1;
    const newSocket = Object.assign({}, mocks.plebSocket);
    newSocket.color = '000000';
    
    const resp = importedModule.chatCheck({
      core: mocks.core,
      server: mocks.server,
      socket: newSocket,
      payload: {
        cmd: 'chat',
        text: 'test',
        channel: 'cake',
      },
    });

    expect(resp).to.be.false;
  });

  it('should shadow block chat attempts, checking for allies', async () => {
    mocks.core.muzzledHashes['testHash'] = {
      dumb: true,
      allies: [1234],
    };
    mocks.plebSocket.hcProtocol = 1;
    const newSocket = Object.assign({}, mocks.plebSocket);
    
    const resp = importedModule.chatCheck({
      core: mocks.core,
      server: mocks.server,
      socket: newSocket,
      payload: {
        cmd: 'chat',
        text: 'test',
        channel: 'cake',
      },
    });

    expect(resp).to.be.false;
  });

  it('should shadow block invite attempts', async () => {
    mocks.core.muzzledHashes['testHash'] = true;
    mocks.plebSocket.hcProtocol = 1;
    
    const resp = importedModule.inviteCheck({
      core: mocks.core,
      server: mocks.server,
      socket: mocks.plebSocket,
      payload: {
        cmd: 'chat',
        text: [],
        channel: 'cake',
      },
    });

    expect(resp).to.be.true;
  });

  it('should shadow block invite attempts with ratelimiting', async () => {
    const oldRL = mocks.server.police.frisk;
    mocks.server.police.frisk = () => true;

    mocks.core.muzzledHashes['testHash'] = true;
    mocks.plebSocket.hcProtocol = 1;
    
    const resp = importedModule.inviteCheck({
      core: mocks.core,
      server: mocks.server,
      socket: mocks.plebSocket,
      payload: {
        cmd: 'chat',
        text: [],
        channel: 'cake',
      },
    });

    mocks.server.police.frisk = oldRL;

    expect(resp).to.be.true;
  });

  it('should verify userid params on shadow block invite attempts', async () => {
    mocks.core.muzzledHashes['testHash'] = true;
    mocks.plebSocket.hcProtocol = 2;
    
    const resp = importedModule.inviteCheck({
      core: mocks.core,
      server: mocks.server,
      socket: mocks.plebSocket,
      payload: {
        cmd: 'chat',
        userid: '1234',
        text: [],
        channel: 'cake',
      },
    });

    expect(resp).to.be.true;
  });

  it('should verify channel params on shadow block invite attempts', async () => {
    mocks.core.muzzledHashes['testHash'] = true;
    mocks.plebSocket.hcProtocol = 2;
    
    const resp = importedModule.inviteCheck({
      core: mocks.core,
      server: mocks.server,
      socket: mocks.plebSocket,
      payload: {
        cmd: 'chat',
        userid: 1234,
        text: [],
        channel: false,
      },
    });

    expect(resp).to.be.true;
  });

  it('should accept an allies param', async () => {
    mockPayload.allies = [1234, 5678];
    const resp = await importedModule.run({
      core: mocks.core,
      server: mocks.server,
      socket: mocks.authedSocket,
      payload: mockPayload,
    });

    expect(resp).to.be.true;
  });

  it('should accept legacy params', async () => {
    const newSocket = Object.assign({}, mocks.authedSocket);
    newSocket.hcProtocol = 1;

    const resp = await importedModule.run({
      core: mocks.core,
      server: mocks.server,
      socket: newSocket,
      payload: {
        cmd: 'dumb',
        nick: false,
      },
    });

    expect(resp).to.be.true;
  });

  it('should accept params', async () => {
    const newSocket = Object.assign({}, mocks.authedSocket);
    newSocket.hcProtocol = 2;

    const resp = await importedModule.run({
      core: mocks.core,
      server: mocks.server,
      socket: newSocket,
      payload: {
        cmd: 'dumb',
        userid : false,
      },
    });

    expect(resp).to.be.true;
  });

  it('should handle users not found', async () => {
    const newSocket = Object.assign({}, mocks.authedSocket);
    newSocket.hcProtocol = 2;
    
    const oldFS = mocks.server.findSockets;
    mocks.server.findSockets = (filterObj) => {
      return false;
    }

    const resp = await importedModule.run({
      core: mocks.core,
      server: mocks.server,
      socket: newSocket,
      payload: {
        cmd: 'dumb',
        userid : 0,
      },
    });

    mocks.server.findSockets = oldFS;

    expect(resp).to.be.true;
  });
  
  it('should not muzzle mods', async () => {
    const newSocket = Object.assign({}, mocks.authedSocket);
    newSocket.hcProtocol = 2;
    
    const oldFS = mocks.server.findSockets;
    mocks.server.findSockets = (filterObj) => {
      return [newSocket];
    }

    const resp = await importedModule.run({
      core: mocks.core,
      server: mocks.server,
      socket: newSocket,
      payload: {
        cmd: 'dumb',
        userid : 0,
      },
    });

    mocks.server.findSockets = oldFS;

    expect(resp).to.be.true;
  });
});