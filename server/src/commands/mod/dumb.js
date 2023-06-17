/*
 * Description: Make a user (spammer) dumb (mute)
 * Author: simple
 */

import * as UAC from '../utility/UAC/_info';
import * as Invite from '../core/invite';

// module constructor
export function init(core) {
  if (typeof core.muzzledHashes === 'undefined') {
    core.muzzledHashes = {};
  }
}

// module main
export async function run(core, server, socket, data) {
  // increase rate limit chance and ignore if not admin or mod
  if (!UAC.isModerator(socket.level)) {
    return server.police.frisk(socket.address, 10);
  }

  // check user input
  if (typeof data.nick !== 'string') {
    return true;
  }

  // find target user
  let badClient = server.findSockets({ channel: socket.channel, nick: data.nick });

  if (badClient.length === 0) {
    return server.reply({
      cmd: 'warn',
      text: '无法在频道中找到用户',
    }, socket);
  }

  [badClient] = badClient;

  // likely dont need this, muting mods and admins is fine
  if (badClient.level >= socket.level) {
    return server.reply({
      cmd: 'warn',
      text: '为什么要禁言同一级别或更高级别的用户？~~你要造反吗？~~', //造反の故事
    }, socket);
  }

  // store hash in mute list
  const record = core.muzzledHashes[badClient.hash] = {
    dumb: true,
  };

  // store allies if needed
  if (data.allies && Array.isArray(data.allies)) {
    record.allies = data.allies;
  }

  // notify mods
  server.broadcast({
    cmd: 'info',
    text: `${socket.nick}#${socket.trip} 禁言了 ${data.nick} 在 ${socket.channel}, 用户hash： ${badClient.hash}\n你可以通过上面提供的hash来解除禁言`,
  }, { level: UAC.isModerator });

  return true;
}

// module hook functions
export function initHooks(server) {
  server.registerHook('in', 'chat', this.chatCheck.bind(this), 10);
  server.registerHook('in', 'invite', this.inviteCheck.bind(this), 10);
  server.registerHook('in', 'whisper', this.whisperCheck.bind(this), 10);
}

// hook incoming chat commands, shadow-prevent chat if they are muzzled
export function chatCheck(core, server, socket, payload) {
  if (typeof payload.text !== 'string') {
    return false;
  }

  if (core.muzzledHashes[socket.hash]) {
    // build fake chat payload
    const mutedPayload = {
      cmd: 'chat',
      nick: socket.nick,
      text: payload.text,
    };

    if (socket.trip) {
      mutedPayload.trip = socket.trip;
    }

    // broadcast to any duplicate connections in channel
    server.broadcast(mutedPayload, { channel: socket.channel, hash: socket.hash });

    // broadcast to allies, if any
    if (core.muzzledHashes[socket.hash].allies) {
      server.broadcast(
        mutedPayload,
        {
          channel: socket.channel,
          nick: core.muzzledHashes[socket.hash].allies,
        },
      );
    }

    /**
      * Blanket "spam" protection.
      * May expose the ratelimiting lines from `chat` and use that
      * @todo one day #lazydev
      */
    server.police.frisk(socket.address, 9);

    return false;
  }

  return payload;
}

// shadow-prevent all invites from muzzled users
export function inviteCheck(core, server, socket, payload) {
  if (core.muzzledHashes[socket.hash]) {
    const nickValid = Invite.checkNickname(payload.nick);
    if (nickValid !== null) {
      server.reply({
        cmd: 'warn',
        text: nickValid,
      }, socket);
      return false;
    }

    // generate common channel
    const channel = Invite.getChannel();

    // send fake reply
    server.reply(Invite.createSuccessPayload(payload.nick, channel), socket);

    return false;
  }

  return payload;
}

// shadow-prevent all whispers from muzzled users
export function whisperCheck(core, server, socket, payload) {
  if (typeof payload.nick !== 'string') {
    return false;
  }

  if (typeof payload.text !== 'string') {
    return false;
  }

  if (core.muzzledHashes[socket.hash]) {
    const targetNick = payload.nick;

    server.reply({
      cmd: 'info',
      type: 'whisper',
      text: `你悄悄对 ${targetNick} 说: ${payload.text}`,
    }, socket);

    // blanket "spam" protection, may expose the ratelimiting lines from `chat` and use that, TODO: one day #lazydev
    server.police.frisk(socket.address, 9);

    return false;
  }

  return payload;
}

export const requiredData = ['nick'];
export const info = {
  name: 'dumb',
  description: '禁言一个用户',
  usage: `
    API: { cmd: 'dumb', nick: '<呢称>', allies: ['<呢称数组>', ...] }`,
};
info.aliases = ['muzzle', 'mute'];
