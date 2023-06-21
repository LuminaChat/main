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
  console.log(`${socket.nick} [${socket.trip}] 在 ${socket.channel} 解封了 ${target}`);

  // reply with success
  /*
  server.reply({
    cmd: 'info',
    text: `解除了对此hash的封禁： ${target}`,
  }, socket);
  */    // MrZhang365：同一种信息，发一次就好，不必先告诉操作员，再广播所有管理员

  // notify mods
  server.broadcast({
    cmd: 'info',
    text: `${socket.nick}#${socket.trip} 解除了对此hash的封禁: ${target}`,    // MrZhang365：即使是IP，也会被上面的代码转换为hash
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
