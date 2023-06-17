/*
  Description: Adds the target socket's ip to the ratelimiter
*/

import * as UAC from '../utility/UAC/_info';

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
  const targetNick = data.nick;
  let badClient = server.findSockets({ channel: socket.channel, nick: targetNick });

  if (badClient.length === 0) {
    return server.reply({
      cmd: 'warn',
      text: '无法在频道中找到用户',
    }, socket);
  }

  [badClient] = badClient;

  // i guess banning mods or admins isn't the best idea?
  if (badClient.level >= socket.level) {
    return server.reply({
      cmd: 'warn',
      text: '不能禁止同一级别的其他用户，真不礼貌。',
    }, socket);
  }

  // commit arrest record
  server.police.arrest(badClient.address, badClient.hash);

  console.log(`${socket.nick} [${socket.trip}] banned ${targetNick} in ${socket.channel}`);

  // notify normal users
  server.broadcast({
    cmd: 'info',
    text: `已封禁 ${targetNick}`,
    user: UAC.getUserDetails(badClient),
  }, { channel: socket.channel, level: (level) => level < UAC.levels.moderator });

  // notify mods
  server.broadcast({
    cmd: 'info',
    text: `${socket.nick}#${socket.trip} 在 ${socket.channel} 封禁了 ${targetNick}, 用户的Hash: ${badClient.hash}`,
    channel: socket.channel,
    user: UAC.getUserDetails(badClient),
    banner: UAC.getUserDetails(socket),
  }, { level: UAC.isModerator });

  // force connection closed
  badClient.terminate();

  // stats are fun
  core.stats.increment('users-banned');

  return true;
}

export const requiredData = ['nick'];
export const info = {
  name: 'ban',
  description: '禁止一个用户连接到服务器',
  usage: `
    API: { cmd: 'ban', nick: '<用户名称>' }`,
};
