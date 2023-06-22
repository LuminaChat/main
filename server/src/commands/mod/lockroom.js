/*
  Description: Applies setting that only allows privileged trips or elevated users to join target channel
*/

import * as UAC from '../utility/UAC/_info';

// module constructor
export async function init(core) {
  if (typeof core.locked === 'undefined') {
    core.locked = [];
  }

  if (typeof core.config.authedtrips === 'undefined') {
    core.config.authedtrips = [];
  }
}

// module main
export async function run(core, server, socket) {
  // increase rate limit chance and ignore if not admin or mod
  if (!UAC.isModerator(socket.level)) {
    return server.police.frisk(socket.address, 10);
  }

  if (core.locked[socket.channel]) {
    return server.reply({
      cmd: 'info',
      text: '频道已被锁定，无需二次操作.',
    }, socket);
  }

  // apply lock flag to channel list
  core.locked[socket.channel] = true;

  // inform mods
  server.broadcast({
    cmd: 'info',
    text: `房间被锁定: ${socket.channel}`,
  }, { level: UAC.isModerator });

  return true;
}

// module hook functions
export function initHooks(server) {
  server.registerHook('in', 'changenick', this.changeNickCheck.bind(this), 1);
  server.registerHook('in', 'chat', this.chatCheck.bind(this), 1);
  server.registerHook('in', 'invite', this.inviteCheck.bind(this), 1);
  server.registerHook('in', 'join', this.joinCheck.bind(this), 1);
  server.registerHook('in', 'move', this.moveCheck.bind(this), 1);
  // TODO: add whisper hook, need hook priorities todo finished first
}

// prevent all name changes in purgatory
export function changeNickCheck(core, server, socket, payload) {
  if (socket.channel === 'purgatory') {
    return false;
  }

  return payload;
}

// hook incoming chat commands, prevent chat if they are user
export function chatCheck(core, server, socket, payload) {
  // TODO: Change this uType to use level / uac
  if (socket.channel === 'purgatory' && socket.uType === 'user') {
    return false;
  }

  return payload;
}

// prevent all invites in purgatory
export function inviteCheck(core, server, socket, payload) {
  if (socket.channel === 'purgatory') {
    return false;
  }

  return payload;
}

// check if a user is attempting to join a locked channel, shunt to purgatory
export function joinCheck(core, server, socket, payload) {
  // always verifiy user input
  if (typeof payload.nick !== 'string' || typeof payload.channel !== 'string') {
    return false;
  }

  // check if target channel is locked
  if (typeof core.locked[payload.channel] === 'undefined' || core.locked[payload.channel] !== true) {
    if (payload.channel !== 'purgatory') {
      return payload;
    }
  }

  // parse their credentials
  const joinModule = core.commands.get('join');
  const userInfo = joinModule.parseNickname(core, payload);

  // `userInfo` will be string on join failure, continue to allow join to emmit error
  if (typeof userInfo === 'string') {
    return payload;
  }

  // TODO: Change this uType to use level / uac
  // check if trip is allowed
  if (userInfo.uType === 'user') {
    if (userInfo.trip == null || core.config.authedtrips.indexOf(userInfo.trip) === -1) {
      const origNick = userInfo.nick;
      const origChannel = payload.channel;

      // not allowed, shunt to purgatory
      payload.channel = 'purgatory';

      // lost souls have no names
      if (origChannel === 'purgatory') {
        // someone is pulling a Dante
        payload.nick = `Dante_${Math.random().toString(36).substr(2, 8)}`;
      } else {
        payload.nick = `${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}`;

        server.reply({
          cmd: 'info',
          text: '你被阻止进入此房间，请稍后再试或等待一个管理员来运行你进入.',
        }, socket);
      }

      server.broadcast({
        cmd: 'info',
        text: `${payload.nick} 原名称： ${origNick}, 识别码: ${userInfo.trip || '无'}，TA想去： ?${origChannel}`,
      }, { channel: 'purgatory', level: UAC.isModerator });
    }
  }

  return payload;
}

// prevent all move commands out of purgatory or into locked room
export function moveCheck(core, server, socket, payload) {
  // ignore if already in purgatory
  if (socket.channel === 'purgatory') {
    return false;
  }

  // always verifiy user input
  if (typeof payload.channel !== 'string') {
    return false;
  }

  // check if target channel is locked
  if (typeof core.locked[payload.channel] !== 'undefined' && core.locked[payload.channel] === true) {
    // TODO: Change this uType to use level / uac
    if (socket.uType === 'user') {
      return false;
    }
  }

  return payload;
}

// module meta
export const info = {
  name: 'lockroom',
  description: '锁定你所在的频道',
  usage: `
    API: { cmd: 'lockroom' }`,
};
