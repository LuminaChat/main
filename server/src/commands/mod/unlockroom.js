/*
  Description: Removes the calling sockets channel from the privileged room list
*/

import * as UAC from '../utility/UAC/_info';

// module main
export async function run(core, server, socket, data) {
  // increase rate limit chance and ignore if not admin or mod
  if (!UAC.isModerator(socket.level)) {
    return server.police.frisk(socket.address, 10);
  }

  if (typeof core.locked === 'undefined') {
    core.locked = [];
  }

  let { channel } = socket;
  if (typeof data.channel !== 'undefined') {
    channel = data.channel;
  }

  if (!core.locked[socket.channel]) {
    return server.reply({
      cmd: 'info',
      text: '频道未被锁定，无需二次操作.',
    }, socket);
  }

  core.locked[channel] = false;

  server.broadcast({
    cmd: 'info',
    text: `频道: ?${channel} 被 [${socket.trip}]${socket.nick} 解锁了`,
  }, { channel, level: UAC.isModerator });

  console.log(`Channel: ?${channel} unlocked by [${socket.trip}]${socket.nick} in ${socket.channel}`);

  return true;
}

// module meta
export const info = {
  name: 'unlockroom',
  description: '解锁一个房间(如果不提供channel参数，即为当前频道)',
  usage: `
    API: { cmd: 'unlockroom', channel: '<目标频道>' }`,
};
