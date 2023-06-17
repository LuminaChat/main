/*
  Description: Removes a target ip from the ratelimiter
*/

import * as UAC from '../utility/UAC/_info';

// module main
export async function run(core, server, socket, data) {
  // increase rate limit chance and ignore if not admin or mod
  if (!UAC.isModerator(socket.level)) {
    return server.police.frisk(socket.address, 10);
  }

  // check user input
  if (typeof data.ip !== 'string' && typeof data.hash !== 'string') {
    return server.reply({
      cmd: 'warn',
      text: "需要一个目标hash或IP地址",
    }, socket);
  }

  // find target
  let mode;
  let target;
  if (typeof data.ip === 'string') {
    mode = 'ip';
    target = data.ip;
  } else {
    mode = 'hash';
    target = data.hash;
  }

  // remove arrest record
  server.police.pardon(target);

  // mask ip if used
  if (mode === 'ip') {
    target = server.getSocketHash(target);
  }
  console.log(`${socket.nick} [${socket.trip}] unbanned ${target} in ${socket.channel}`);

  // reply with success
  server.reply({
    cmd: 'info',
    text: `解除了对此hash或ip的封禁： ${target}`,
  }, socket);

  // notify mods
  server.broadcast({
    cmd: 'info',
    text: `${socket.nick}#${socket.trip} 解除了对此hash或ip的封禁: ${target}`,
  }, { level: UAC.isModerator });

  // stats are fun
  core.stats.decrement('users-banned');

  return true;
}

export const info = {
  name: 'unban',
  description: '将目标IP或hash移出频率限制名单',
  usage: `
    API: { cmd: 'unban', ip/hash: '<ip或hash>' }`,
};
