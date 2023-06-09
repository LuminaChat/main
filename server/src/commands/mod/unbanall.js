/*
  Description: Clears all bans and ratelimits
*/

import * as UAC from '../utility/UAC/_info';

// module main
export async function run(core, server, socket) {
  // increase rate limit chance and ignore if not admin or mod
  if (!UAC.isModerator(socket.level)) {
    return server.police.frisk(socket.address, 10);
  }

  // remove arrest records
  server.police.clear();

  core.stats.set('users-banned', 0);

  console.log(`${socket.nick} [${socket.trip}] 解除了所有封禁`);

  // reply with success
  /*
  server.reply({
    cmd: 'info',
    text: '已解除所有封禁',
  }, socket);
  */    // MrZhang365：同一种信息，发一次就好，不必先告诉操作员，再广播所有管理员

  // notify mods
  server.broadcast({
    cmd: 'info',
    text: `${socket.nick}#${socket.trip} 解除了所有封禁`,
  }, { level: UAC.isModerator });

  return true;
}

export const info = {
  name: 'unbanall',
  description: '解除所有封禁',
  usage: `
    API: { cmd: 'unbanall' }`,
};
